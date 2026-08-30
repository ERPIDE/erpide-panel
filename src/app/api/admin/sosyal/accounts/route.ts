/**
 * /api/admin/sosyal/accounts — platform bağlantıları.
 *
 * GET    → üç platformun bağlantı durumu (token ASLA dönmez)
 * POST   → bağlantı kaydet { platform, externalId, accessToken?, ... }
 * DELETE → bağlantıyı kes ve token'ları sil { platform }
 *
 * Kaydetme sonrası bağlantı otomatik test edilir; başarısızsa hata mesajı
 * kullanıcıya döner ama kayıt silinmez (ID yazım hatası düzeltilebilsin).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { HAS_DB } from "@/lib/db";
import { disconnectAccount, listAccounts, saveAccount, verifyAccount } from "@/lib/social/accounts";
import { HAS_TOKEN_KEY } from "@/lib/social/crypto";
import { EXTERNAL_PLATFORMS } from "@/lib/social/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(req: NextRequest) {
  return getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
}

const saveSchema = z.object({
  platform: z.enum(EXTERNAL_PLATFORMS),
  externalId: z.string().trim().min(1, "Hesap/sayfa ID'si gerekli"),
  accessToken: z.string().trim().min(1).optional(),
  refreshToken: z.string().trim().min(1).optional(),
  /** ISO datetime — token son kullanma tarihi biliniyorsa. */
  tokenExpiresAt: z.string().datetime().nullish(),
  displayName: z.string().trim().nullish(),
});

export async function GET(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  return NextResponse.json({
    accounts: await listAccounts(),
    // Panel, anahtar yoksa token alanlarını kilitleyip uyarı gösterir.
    tokenStorageReady: HAS_TOKEN_KEY,
  });
}

export async function POST(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const parsed = saveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  try {
    await saveAccount({
      platform: input.platform,
      externalId: input.externalId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiresAt: input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : undefined,
      displayName: input.displayName ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bağlantı kaydedilemedi" },
      { status: 400 },
    );
  }

  // Kaydettikten sonra canlı doğrula — kullanıcı yayın anında sürpriz yaşamasın.
  const check = await verifyAccount(input.platform);
  return NextResponse.json({
    accounts: await listAccounts(),
    verified: check.ok,
    error: check.ok ? null : check.error,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as { platform?: string } | null;
  const platform = EXTERNAL_PLATFORMS.find((p) => p === body?.platform);
  if (!platform) return NextResponse.json({ error: "Geçersiz platform" }, { status: 400 });

  await disconnectAccount(platform);
  return NextResponse.json({ accounts: await listAccounts() });
}
