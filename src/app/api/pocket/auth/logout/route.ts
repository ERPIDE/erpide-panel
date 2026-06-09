/**
 * POST /api/pocket/auth/logout
 * Authorization: Bearer pkt_xxx
 *
 * Token'ı revoke eder. Mobile uygulama lokal token'ı siler.
 */
import { NextResponse } from "next/server";
import { revokeToken } from "@/lib/pocket-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }
  await revokeToken(m[1].trim());
  return NextResponse.json({ ok: true });
}
