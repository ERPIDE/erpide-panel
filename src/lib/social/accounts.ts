/**
 * Sosyal hesap bağlantıları — token saklama, çözme, doğrulama.
 *
 * Panel bu katmanın dışına asla düz token vermez: listAccounts() yalnızca
 * "token var mı" bilgisini döndürür. Token yalnızca yayın anında ve
 * doğrulama sırasında çözülür.
 */
import { getPrisma } from "../db";
import { decryptToken, encryptToken, HAS_TOKEN_KEY } from "./crypto";
import { VERIFIERS } from "./adapters";
import {
  EXTERNAL_PLATFORMS,
  SocialPublishError,
  type ExternalPlatform,
  type ResolvedCredentials,
  type SocialAccountView,
} from "./types";

interface AccountRow {
  platform: string;
  displayName: string | null;
  externalId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  connected: boolean;
  lastCheckedAt: Date | null;
  lastError: string | null;
  meta: unknown;
}

function toView(platform: ExternalPlatform, row: AccountRow | null): SocialAccountView {
  return {
    platform,
    displayName: row?.displayName ?? null,
    externalId: row?.externalId ?? null,
    connected: row?.connected ?? false,
    tokenExpiresAt: row?.tokenExpiresAt?.toISOString() ?? null,
    lastCheckedAt: row?.lastCheckedAt?.toISOString() ?? null,
    lastError: row?.lastError ?? null,
    hasToken: !!row?.accessToken,
  };
}

/** Üç platformun da satırını döndürür — kaydı olmayanlar "bağlı değil" görünür. */
export async function listAccounts(): Promise<SocialAccountView[]> {
  const rows = (await getPrisma().socialAccount.findMany()) as unknown as AccountRow[];
  const byPlatform = new Map(rows.map((r) => [r.platform, r]));
  return EXTERNAL_PLATFORMS.map((p) => toView(p, byPlatform.get(p) ?? null));
}

/** Yayın için token'ı çözer. Bağlı değilse veya çözülemiyorsa anlamlı hata verir. */
export async function resolveCredentials(platform: ExternalPlatform): Promise<ResolvedCredentials> {
  const row = (await getPrisma().socialAccount.findUnique({
    where: { platform },
  })) as unknown as AccountRow | null;

  if (!row || !row.connected || !row.accessToken) {
    throw new SocialPublishError(platform, "hesap bağlı değil — panelden bağlantı kurun", false);
  }

  const token = decryptToken(row.accessToken);
  if (!token) {
    throw new SocialPublishError(
      platform,
      "kayıtlı token çözülemedi (şifreleme anahtarı değişmiş olabilir) — yeniden bağlayın",
      false,
    );
  }

  if (row.tokenExpiresAt && row.tokenExpiresAt.getTime() < Date.now()) {
    throw new SocialPublishError(platform, "token süresi dolmuş — yeniden bağlayın", false);
  }

  return {
    accessToken: token,
    externalId: row.externalId,
    meta: (row.meta as Record<string, unknown> | null) ?? null,
  };
}

export interface SaveAccountInput {
  platform: ExternalPlatform;
  externalId: string;
  /** Boş bırakılırsa mevcut token korunur (ID düzeltirken token silinmesin). */
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date | null;
  displayName?: string | null;
}

/** Bağlantı bilgilerini kaydeder. Token verilmişse şifrelenir. */
export async function saveAccount(input: SaveAccountInput): Promise<void> {
  if (input.accessToken && !HAS_TOKEN_KEY) {
    throw new Error(
      "SOCIAL_TOKEN_KEY tanımlı olmadan token kaydedilemez — önce ortam değişkenini ekleyin.",
    );
  }

  const data: Record<string, unknown> = {
    externalId: input.externalId,
    displayName: input.displayName ?? null,
    lastError: null,
  };
  if (input.accessToken) {
    data.accessToken = encryptToken(input.accessToken);
    data.connected = true;
  }
  if (input.refreshToken) data.refreshToken = encryptToken(input.refreshToken);
  if (input.tokenExpiresAt !== undefined) data.tokenExpiresAt = input.tokenExpiresAt;

  // upsert KULLANMA — Neon HTTP adapter'ı transaction desteklemiyor
  // ("Transactions are not supported in HTTP mode") ve Prisma upsert'i
  // transaction'a sarıyor. Var mı diye bakıp tek satırlık yazım yapıyoruz.
  const prisma = getPrisma();
  const existing = await prisma.socialAccount.findUnique({
    where: { platform: input.platform },
    select: { platform: true },
  });

  if (existing) {
    await prisma.socialAccount.update({
      where: { platform: input.platform },
      data: data as never,
    });
    return;
  }

  await prisma.socialAccount.create({
    data: {
      platform: input.platform,
      connected: !!input.accessToken,
      ...data,
    } as never,
  });
}

/** Bağlantıyı keser ve token'ları siler. */
export async function disconnectAccount(platform: ExternalPlatform): Promise<void> {
  // Kayıt yoksa yapacak bir şey yok; upsert'ten kaçınma sebebi için
  // saveAccount'taki nota bakın (Neon HTTP transaction desteklemiyor).
  const prisma = getPrisma();
  const existing = await prisma.socialAccount.findUnique({
    where: { platform },
    select: { platform: true },
  });
  if (!existing) return;

  await prisma.socialAccount.update({
    where: { platform },
    data: {
      connected: false,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastError: null,
    } as never,
  });
}

/**
 * Bağlantıyı canlı olarak test eder ve sonucu kaydeder.
 * Başarılıysa displayName platformdan gelen gerçek adla güncellenir.
 */
export async function verifyAccount(
  platform: ExternalPlatform,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const prisma = getPrisma();
  try {
    const creds = await resolveCredentials(platform);
    const info = await VERIFIERS[platform](creds);
    await prisma.socialAccount.update({
      where: { platform },
      data: {
        displayName: info.name,
        connected: true,
        lastCheckedAt: new Date(),
        lastError: null,
      } as never,
    });
    return { ok: true, name: info.name };
  } catch (e) {
    const error = e instanceof Error ? e.message : "bilinmeyen hata";
    // Satır hiç yoksa update patlar; bağlı olmayan hesabın testi zaten hata.
    await prisma.socialAccount
      .update({
        where: { platform },
        data: { lastCheckedAt: new Date(), lastError: error } as never,
      })
      .catch(() => undefined);
    return { ok: false, error };
  }
}
