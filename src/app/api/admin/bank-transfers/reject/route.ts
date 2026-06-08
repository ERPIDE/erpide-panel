/**
 * POST /api/admin/bank-transfers/reject
 * Body: { code: string, reason: string }
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { rejectBankTransferRequest } from "@/lib/auth/user-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const session = await getSession(token);
  if (!session || session.userType !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: { code?: string; reason?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const code = (body.code || "").trim();
  const reason = (body.reason || "").trim();
  if (!code || !reason) return NextResponse.json({ error: "Kod ve sebep gerekli" }, { status: 400 });

  try {
    const rec = await rejectBankTransferRequest(code, session.userName, reason);
    return NextResponse.json({ ok: true, status: rec.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 400 });
  }
}
