/**
 * GET /api/admin/finanserpide/stats
 * FinansERPIDE abonelikleri ve gelir özeti. Sadece admin role.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerSession, SESSION_COOKIE } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return await getOwnerSession(token);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const prisma = getPrisma();

  // Tüm orderları çek, istemci tarafında filtrele (admin panel — traffic düşük)
  const allOrders = await prisma.order.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  // FinansERPIDE ile ilgili orderları bul
  const finansOrders = allOrders.filter((o) => {
    const items = o.items as Array<{ productId?: string }>;
    return items.some((item) => item.productId === "finanserpide");
  });

  // Her order için aktif durumu hesapla
  const subscribers = finansOrders.map((o) => {
    const items = o.items as Array<{ skuId?: string; productId?: string; productName?: string; skuName?: string }>;
    const finansItems = items.filter((i) => i.productId === "finanserpide");
    const modules = finansItems.map((i) => i.skuName || i.skuId || "").filter(Boolean);

    let subStatus: "active" | "trial" | "expired" | "cancelled" | "pending";
    if (o.status === "cancelled" || o.cancelledAt) {
      subStatus = "cancelled";
    } else if (o.isTrial) {
      subStatus = o.trialExpiresAt && o.trialExpiresAt < now ? "expired" : "trial";
    } else if (o.subscriptionExpiresAt && o.subscriptionExpiresAt < now) {
      subStatus = "expired";
    } else if (o.status === "paid" || o.status === "active") {
      subStatus = "active";
    } else {
      subStatus = "pending";
    }

    return {
      orderId: o.id,
      userId: o.userId,
      userName: o.user.name + " " + o.user.surname,
      userEmail: o.user.email,
      modules,
      status: subStatus,
      isTrial: o.isTrial,
      billingCycle: o.billingCycle,
      subscriptionExpiresAt: o.subscriptionExpiresAt,
      trialExpiresAt: o.trialExpiresAt,
      totalPrice: o.totalPrice,
      currency: o.currency,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      autoRenewEnabled: o.autoRenewEnabled,
    };
  });

  // Özet istatistikler
  const stats = {
    total: subscribers.length,
    active: subscribers.filter((s) => s.status === "active").length,
    trial: subscribers.filter((s) => s.status === "trial").length,
    expired: subscribers.filter((s) => s.status === "expired").length,
    cancelled: subscribers.filter((s) => s.status === "cancelled").length,
    revenueUSD: subscribers
      .filter((s) => s.status === "active" && s.currency === "USD")
      .reduce((sum, s) => sum + s.totalPrice, 0),
    revenueTRY: subscribers
      .filter((s) => s.status === "active" && s.currency === "TRY")
      .reduce((sum, s) => sum + s.totalPrice, 0),
  };

  return NextResponse.json({ stats, subscribers });
}
