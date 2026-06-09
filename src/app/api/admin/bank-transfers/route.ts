/**
 * GET /api/admin/bank-transfers?status=PENDING|APPROVED|REJECTED|ALL
 * Admin için: gelen havale isteklerini listele.
 *
 * Auth: cookie üzerinden session.userType === "admin"
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerSession, SESSION_COOKIE } from "@/lib/auth";
import { listBankTransferRequests, type BankTransferRequest } from "@/lib/auth/user-store";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return await getOwnerSession(token);
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const opts: { status?: BankTransferRequest["status"] } = {};
  if (status && status !== "ALL" && ["PENDING", "APPROVED", "REJECTED", "EXPIRED"].includes(status)) {
    opts.status = status as BankTransferRequest["status"];
  }
  const requests = await listBankTransferRequests(opts);
  return NextResponse.json({ requests });
}
