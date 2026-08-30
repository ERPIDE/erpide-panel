/**
 * Yayın motoru — bir post'u seçili platformlara gönderir.
 *
 * Tasarım kararları:
 *
 *  1. **Site önce gider.** Facebook/LinkedIn caption'ları erpide.com'daki
 *     Gündem adresini içerir; post yayınlanmadan o adres 404 verir. Bu yüzden
 *     "site" hedefi her zaman ilk sırada işlenir.
 *
 *  2. **Kısmi başarı normaldir.** Instagram patlarken LinkedIn geçebilir. Her
 *     platform kendi SocialPublication satırına yazar; post durumu
 *     published / partial / failed olarak özetlenir. Yeniden deneme yalnızca
 *     başarısız satırları tekrarlar — aynı içerik iki kez yayınlanmaz.
 *
 *  3. **Sıralı çalışır.** Paralel göndermek hız kazandırmaz (yayın anlık bir
 *     iş değil) ama rate-limit'e yakalanma ve hata izini kaybetme riskini
 *     artırır.
 */
import { getPrisma } from "../db";
import { ADAPTERS } from "./adapters";
import { resolveCredentials } from "./accounts";
import { buildPayload, resolveImageUrl, absoluteUrl } from "./compose";
import { getById, markPostStatus } from "./store";
import {
  isExternalPlatform,
  SocialPublishError,
  type Platform,
  type PostStatus,
  type PublicationStatus,
  type SocialPostView,
} from "./types";

export interface PublishOptions {
  /** Yalnızca bu platformlara gönder. Boşsa post'un kendi hedefleri kullanılır. */
  platforms?: Platform[];
  /** true → daha önce başarılı olan platformlar atlanır (yeniden deneme). */
  skipSucceeded?: boolean;
}

export interface PublishOutcome {
  postId: string;
  status: PostStatus;
  results: Array<{
    platform: Platform;
    status: PublicationStatus;
    externalUrl?: string | null;
    error?: string | null;
  }>;
}

/** "site" her zaman başa alınır; kalanlar sabit bir sırayla işlenir. */
const ORDER: Platform[] = ["site", "linkedin", "facebook", "instagram"];

function sortTargets(targets: Platform[]): Platform[] {
  return [...new Set(targets)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}

export async function publishPost(
  postId: string,
  options: PublishOptions = {},
): Promise<PublishOutcome> {
  const post = await getById(postId);
  if (!post) throw new Error("Post bulunamadı");

  const targets = sortTargets(
    options.platforms?.length ? options.platforms : post.targets,
  );
  if (targets.length === 0) {
    throw new Error("Yayın hedefi seçilmemiş");
  }

  validateForPublish(post, targets);

  await markPostStatus(postId, "publishing");

  const alreadyOk = new Set(
    post.publications.filter((p) => p.status === "success").map((p) => p.platform),
  );

  const imageUrl = resolveImageUrl(post);
  const results: PublishOutcome["results"] = [];

  for (const platform of targets) {
    if (options.skipSucceeded && alreadyOk.has(platform)) {
      results.push({ platform, status: "skipped" });
      continue;
    }

    try {
      const outcome = platform === "site"
        ? await publishToSite(post)
        : await publishToPlatform(post, platform, imageUrl);

      await recordPublication(postId, platform, {
        status: "success",
        externalId: outcome.externalId ?? null,
        externalUrl: outcome.externalUrl ?? null,
        error: null,
      });
      results.push({ platform, status: "success", externalUrl: outcome.externalUrl ?? null });
    } catch (e) {
      const error = e instanceof Error ? e.message : "bilinmeyen hata";
      await recordPublication(postId, platform, {
        status: "failed",
        externalId: null,
        externalUrl: null,
        error,
      });
      results.push({ platform, status: "failed", error });
    }
  }

  // Durum özeti: daha önce başarılı olanlar da hesaba katılır, yoksa tek
  // platformu yeniden denerken post "failed"e düşerdi.
  const succeeded = new Set([
    ...alreadyOk,
    ...results.filter((r) => r.status === "success").map((r) => r.platform),
  ]);
  const attempted = new Set([...post.targets, ...targets]);
  const anyFailed = results.some((r) => r.status === "failed");

  let status: PostStatus;
  if (succeeded.size === 0) status = "failed";
  else if (anyFailed || succeeded.size < attempted.size) status = "partial";
  else status = "published";

  // Site hedefi yoksa da post "yayınlandı" sayılır; publishedAt ilk başarılı
  // yayında sabitlenir, yeniden denemede geri alınmaz.
  const publishedAt = post.publishedAt
    ? undefined
    : succeeded.size > 0
      ? new Date()
      : undefined;

  await markPostStatus(postId, status, publishedAt);

  return { postId, status, results };
}

/**
 * Yayın öncesi ön kontroller — API'ye gidip oradan hata almaktansa burada
 * anlaşılır mesaj vermek daha iyi.
 */
function validateForPublish(post: SocialPostView, targets: Platform[]): void {
  if (!post.title.trim()) throw new Error("Başlık boş olamaz");
  if (!post.excerpt.trim()) throw new Error("Özet boş olamaz");

  if (targets.includes("site") && !post.slug) {
    throw new Error("Gündem'de yayınlamak için slug gerekli");
  }

  if (targets.includes("instagram")) {
    const img = resolveImageUrl(post);
    if (!img) throw new Error("Instagram için görsel zorunlu");
    // Meta görseli kendi sunucusundan indirir; localhost/göreli adres çekilemez.
    if (!absoluteUrl(img).startsWith("https://")) {
      throw new Error("Instagram görselinin herkese açık HTTPS adresi olmalı");
    }
  }
}

/**
 * "Site" yayını dış API çağırmaz: post'un kendisi zaten içeriktir, yapılan
 * iş onu Gündem'de görünür kılmaktır (durum güncellemesi publishPost'un
 * sonunda toplu yapılır). Burada yalnızca kalıcı adresi kaydediyoruz.
 */
async function publishToSite(post: SocialPostView): Promise<{ externalId?: string; externalUrl?: string }> {
  if (!post.slug) throw new SocialPublishError("site", "slug yok", false);
  // Gündem sorgusu status="published" filtreliyor; post'u hemen görünür yap ki
  // sonraki platformların paylaştığı link 404 vermesin.
  await markPostStatus(post.id, "published", post.publishedAt ? undefined : new Date());
  return {
    externalId: post.slug,
    externalUrl: `https://www.erpide.com/gundem/${post.slug}`,
  };
}

async function publishToPlatform(
  post: SocialPostView,
  platform: Platform,
  imageUrl: string | null,
): Promise<{ externalId?: string; externalUrl?: string }> {
  if (!isExternalPlatform(platform)) {
    throw new SocialPublishError(platform, "bilinmeyen platform", false);
  }
  const creds = await resolveCredentials(platform);
  const payload = buildPayload(post, platform, imageUrl);
  return ADAPTERS[platform].publish(payload, creds);
}

async function recordPublication(
  postId: string,
  platform: Platform,
  data: {
    status: PublicationStatus;
    externalId: string | null;
    externalUrl: string | null;
    error: string | null;
  },
): Promise<void> {
  const now = new Date();
  const prisma = getPrisma();

  // upsert KULLANMA: Prisma onu transaction'a sarıyor, Neon HTTP adapter'ı
  // transaction desteklemiyor ("Transactions are not supported in HTTP mode").
  // Önce var mı diye bak, sonra tek satırlık update veya create yap.
  const existing = (await prisma.socialPublication.findUnique({
    where: { postId_platform: { postId, platform } },
    select: { id: true },
  })) as { id: string } | null;

  if (existing) {
    await prisma.socialPublication.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        externalId: data.externalId,
        externalUrl: data.externalUrl,
        error: data.error,
        attempts: { increment: 1 },
        attemptedAt: now,
        ...(data.status === "success" ? { publishedAt: now } : {}),
      } as never,
    });
    return;
  }

  await prisma.socialPublication.create({
    data: {
      postId,
      platform,
      status: data.status,
      externalId: data.externalId,
      externalUrl: data.externalUrl,
      error: data.error,
      attempts: 1,
      attemptedAt: now,
      publishedAt: data.status === "success" ? now : null,
    } as never,
  });
}
