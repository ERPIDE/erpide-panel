/**
 * Abonelik iptal endpoint'i.
 *
 * Davranış:
 *   - Otomatik yenileme kapatılır (autoRenewEnabled=false)
 *   - cancelledAt + cancelledBy + cancellationReason set edilir
 *   - status="PAID" KALIR — kullanıcı subscriptionExpiresAt'a kadar kullanmaya devam
 *     eder (parasını ödedi). Süre dolunca cron status'u EXPIRED yapar.
 *   - Lisans servisi cache invalidate edilir → FinansERPIDE bir sonraki istekte
 *     "cancelled" state'i öğrenir (kalan süre bitene kadar hala ACTIVE, ama UI'da
 *     iptal edildiği görünür).
 *
 * Geri alma: kullanıcı tekrar auto-renew açarsa veya yeniden satın alırsa iptal
 * temizlenir (yeni order yaratılır, eskisi expire olur).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { findOrderById, findUserById, updateOrder } from "@/lib/auth/user-store";
import { invalidateRemoteLicenseCache } from "@/lib/payments/license-service-invalidate";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }
  const { orderId } = await params;

  let body: unknown = {};
  try { body = await req.json(); } catch { /* boş body OK */ }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const order = await findOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  if (order.userId !== session.userId) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }
  if (order.status !== "PAID" && order.status !== "TRIAL") {
    return NextResponse.json(
      { error: "Sadece aktif abonelikler iptal edilebilir" },
      { status: 400 }
    );
  }
  if (order.cancelledAt) {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }

  await updateOrder(orderId, {
    autoRenewEnabled: false,
    cancelledAt: new Date().toISOString(),
    cancelledBy: "USER",
    cancellationReason: parsed.data.reason,
  });

  // Lisans servisi cache invalidation — FinansERPIDE (ve diğer ürünler) iptal
  // state'ini hemen öğrensin. Best-effort: hata olursa loglar, request fail
  // etmez (kullanıcı iptal etti, lisans servisi cache 5dk içinde nasılsa
  // expire olur).
  try {
    const user = await findUserById(session.userId);
    if (user?.email) await invalidateRemoteLicenseCache(user.email);
  } catch (e) {
    console.warn("[cancel] license cache invalidation failed:", e);
  }

  return NextResponse.json({
    ok: true,
    cancelledAt: new Date().toISOString(),
    validUntil: order.subscriptionExpiresAt,
  });
}
