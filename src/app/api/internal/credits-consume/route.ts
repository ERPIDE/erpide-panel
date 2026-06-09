/**
 * AI Kontör tüketim webhook — ürünler (özellikle FinansERPIDE) plan limitini
 * aştıklarında ek kontör paketinden harcamak için panel'e POST atar.
 *
 * POST /api/internal/credits-consume
 *   Header: x-license-secret: <LICENSE_SERVICE_SECRET>
 *   Body:   { email: string, amount?: number = 1 }
 *
 * Yanıt:
 *   200 { ok: true, consumed: number, remaining: number, orderId: string }
 *   402 { error: "no_credits", remaining: 0 }
 *   401 unauthorized
 *
 * Akış:
 *   1. email ile user bul
 *   2. PAID + active ai-kontor order'larını listele (creditsGranted > creditsConsumed)
 *   3. İlk uygun order'dan amount kadar düş
 *   4. Order tükendiyse cron sonradan EXPIRED yapar (bu endpoint sadece tüketim)
 *
 * Bu endpoint istek başına 1 (veya N) kontör düşer; AI mesajının token sayısı
 * ile değil sabit "mesaj başına 1 kontör" modeliyle. (İleride token tabanlı
 * fiyatlamaya geçilirse amount parametresi devreye girer.)
 */
import { NextResponse } from "next/server";
import {
  findUserByEmail,
  listOrdersByUserId,
  updateOrder,
  type OrderRecord,
} from "@/lib/auth/user-store";
import { getSku } from "@/lib/products";

export const runtime = "nodejs";

function totalGranted(order: OrderRecord): number {
  let g = 0;
  for (const item of order.items) {
    const sku = getSku(item.skuId);
    if (sku?.kind === "credit" && sku.productId === "ai-kontor") {
      g += sku.creditsGranted ?? 0;
    }
  }
  return g;
}

function isActiveAiKontorOrder(order: OrderRecord, now: number): boolean {
  if (order.status !== "PAID") return false;
  if (order.subscriptionExpiresAt && new Date(order.subscriptionExpiresAt).getTime() < now) return false;
  // En az bir ai-kontor credit SKU içermeli
  return order.items.some((i) => {
    const sku = getSku(i.skuId);
    return sku?.kind === "credit" && sku.productId === "ai-kontor";
  });
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-license-secret");
  const expected = process.env.LICENSE_SERVICE_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "LICENSE_SERVICE_SECRET not configured" }, { status: 503 });
  }
  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { email?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const amount = Math.max(1, Math.floor(body.amount ?? 1));
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const orders = await listOrdersByUserId(user.id);
  const now = Date.now();

  // Toplam kalan = sum(granted - consumed) tüm aktif kontör order'larında
  let totalRemaining = 0;
  const candidates: { order: OrderRecord; granted: number; consumed: number; remaining: number }[] = [];
  for (const o of orders) {
    if (!isActiveAiKontorOrder(o, now)) continue;
    const granted = totalGranted(o);
    const consumed = o.creditsConsumed ?? 0;
    const remaining = Math.max(0, granted - consumed);
    if (remaining > 0) {
      candidates.push({ order: o, granted, consumed, remaining });
      totalRemaining += remaining;
    }
  }

  if (totalRemaining < amount) {
    return NextResponse.json(
      { error: "no_credits", remaining: totalRemaining },
      { status: 402 }
    );
  }

  // İlk uygun order'dan düş — eski order önce. Birden fazla order'ı kapsasa
  // bile peş peşe POST'larla absorb edilir (mesaj başına 1 amount norm).
  candidates.sort((a, b) => new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime());
  let remainingToConsume = amount;
  let consumedFromOrderId: string | null = null;
  let lastOrderRemaining = 0;

  for (const c of candidates) {
    if (remainingToConsume <= 0) break;
    const fromThis = Math.min(c.remaining, remainingToConsume);
    const newConsumed = c.consumed + fromThis;
    await updateOrder(c.order.id, { creditsConsumed: newConsumed });
    remainingToConsume -= fromThis;
    consumedFromOrderId = c.order.id;
    lastOrderRemaining = c.granted - newConsumed;
  }

  return NextResponse.json({
    ok: true,
    consumed: amount,
    remaining: totalRemaining - amount,
    orderId: consumedFromOrderId,
    orderRemaining: lastOrderRemaining,
  });
}
