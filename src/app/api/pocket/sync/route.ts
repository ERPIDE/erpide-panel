/**
 * /api/pocket/sync — mobile app'in offline-first sync endpoint'i.
 *
 * GET   → kullanıcının buluttaki en son PocketData snapshot'unu döner.
 *         { updatedAt, data }
 * POST  → mobile'in lokal PocketData'sını overwrite eder (last-write-wins).
 *         body: { data: PocketData }
 *         Response: { updatedAt }
 *
 * Auth: Authorization: Bearer pkt_xxx (login endpoint'inden alınır).
 * License: PocketERPIDE aktif değilse 403.
 */
import { NextResponse } from "next/server";
import { authenticateMobile } from "@/lib/pocket-auth";
import { getUserData, setUserData } from "@/lib/pocket-store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateMobile(req);
  if (!auth.ok) return auth.response;

  const rec = await getUserData(auth.userId);
  if (!rec) {
    return NextResponse.json({ updatedAt: null, data: null });
  }
  return NextResponse.json({ updatedAt: rec.updatedAt, data: rec.data });
}

export async function POST(req: Request) {
  const auth = await authenticateMobile(req);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("data" in body)
  ) {
    return NextResponse.json({ error: "Missing 'data' field" }, { status: 400 });
  }
  const data = (body as { data: unknown }).data;
  if (typeof data !== "object" || data === null) {
    return NextResponse.json({ error: "'data' must be an object" }, { status: 400 });
  }

  const rec = await setUserData(auth.userId, data);
  return NextResponse.json({ updatedAt: rec.updatedAt });
}
