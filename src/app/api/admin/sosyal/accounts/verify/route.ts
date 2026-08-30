/**
 * /api/admin/sosyal/accounts/verify — "Bağlantıyı test et".
 *
 * Token'ın hâlâ geçerli olduğunu ve hesabın yazma yetkisi taşıdığını canlı
 * olarak kontrol eder. Meta token'ları sessizce süresi dolabildiği için
 * yayın gününden önce buradan bakılması önerilir.
 */
import { NextRequest, NextResponse } from "next/server";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { HAS_DB } from "@/lib/db";
import { listAccounts, verifyAccount } from "@/lib/social/accounts";
import { EXTERNAL_PLATFORMS } from "@/lib/social/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as { platform?: string } | null;
  const platform = EXTERNAL_PLATFORMS.find((p) => p === body?.platform);
  if (!platform) return NextResponse.json({ error: "Geçersiz platform" }, { status: 400 });

  const result = await verifyAccount(platform);
  return NextResponse.json({
    ok: result.ok,
    name: result.ok ? result.name : null,
    error: result.ok ? null : result.error,
    accounts: await listAccounts(),
  });
}
