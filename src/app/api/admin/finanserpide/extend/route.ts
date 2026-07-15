/**
 * POST /api/admin/finanserpide/extend
 * Body: { orderId: string, extendDays?: number }
 *
 * FinansERPIDE aboneliğinin bitiş tarihini uzatır (admin manuel uzatma).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerSession, SESSION_COOKIE } from "@/lib/auth";
import { findOrderById, findUserById, updateOrder, type OrderRecord } from "@/lib/auth/user-store";
import { invalidateRemoteLicenseCache } from "@/lib/payments/license-service-invalidate";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return await getOwnerSession(token);
}

function isFinansOrder(order: OrderRecord): boolean {
  return order.items.some((item) => item.productId === "finanserpide");
}

function computeExtendedExpiry(currentIso: string | undefined, extendDays: number): Date {
  const now = new Date();
  const current = currentIso ? new Date(currentIso) : null;
  const base = current && current.getTime() > now.getTime() ? current : now;
  return new Date(base.getTime() + extendDays * 86_400_000);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: { orderId?: string; extendDays?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const orderId = (body.orderId || "").trim();
  const extendDays = Math.max(1, Math.min(3650, Number(body.extendDays) || 30));
  if (!orderId) return NextResponse.json({ error: "orderId gerekli" }, { status: 400 });

  const order = await findOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  if (!isFinansOrder(order)) {
    return NextResponse.json({ error: "Bu sipariş FinansERPIDE aboneliği değil" }, { status: 400 });
  }

  const user = await findUserById(order.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const isTrial = order.status === "TRIAL" || !!order.isTrial;
  const patch: Partial<OrderRecord> = {};

  if (isTrial) {
    const newExpiry = computeExtendedExpiry(order.trialExpiresAt, extendDays);
    patch.trialExpiresAt = newExpiry.toISOString();
    patch.status = "TRIAL";
    patch.isTrial = true;
  } else {
    const newExpiry = computeExtendedExpiry(order.subscriptionExpiresAt, extendDays);
    patch.subscriptionExpiresAt = newExpiry.toISOString();
    patch.status = "PAID";
    if (!order.paidAt) patch.paidAt = new Date().toISOString();
  }

  const updated = await updateOrder(orderId, patch);
  if (!updated) return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });

  await invalidateRemoteLicenseCache(user.email);

  const newExpiresAt = isTrial ? updated.trialExpiresAt : updated.subscriptionExpiresAt;
  return NextResponse.json({
    ok: true,
    orderId: updated.id,
    userEmail: user.email,
    extendDays,
    expiresAt: newExpiresAt,
    extendedBy: admin.userName,
  });
}
