import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { findUserById, listOrdersByUserId } from "@/lib/auth/user-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ user: null });
  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ user: null });

  const orders = await listOrdersByUserId(user.id);
  const now = Date.now();
  type AppState = "active" | "expired" | "none";
  const states: Record<string, AppState> = { finanserpide: "none", captchaerpide: "none", pocketerpide: "none" };
  const trialedProductIds = new Set<string>();
  // productId → şu an aktif PAID SKU (varsa). UI "MEVCUT PLANINIZ" rozeti için.
  const activeSkuByProduct: Record<string, string> = {};
  // productId → son alınan/denenmiş SKU (expired olsa bile). UI "Lisansı Uzat" akışı için.
  // Sıralama önemli: aynı productId için createdAt sıralanmış orders'ı taradığımızda
  // son ekleme = en güncel olur.
  const lastSkuByProduct: Record<string, string> = {};
  // listOrdersByUserId default eski→yeni mi yoksa yeni→eski mi bilmiyoruz; emniyetli sıralayalım.
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const o of sortedOrders) {
    if (o.status === "TRIAL" || o.isTrial) {
      for (const it of o.items) trialedProductIds.add(it.productId);
    }
    let productIds: string[] = [];
    let expired = false;
    if (o.status === "PAID") {
      productIds = o.items.map((it) => it.productId);
      expired = !!o.subscriptionExpiresAt && new Date(o.subscriptionExpiresAt).getTime() < now;
      if (!expired) {
        for (const it of o.items) activeSkuByProduct[it.productId] = it.skuId;
      }
      // PAID son alınan SKU — uzat akışında bu skuId kullanılır (trial üstüne PAID gelmiş olsa
      // bile son tercih PAID olsun).
      for (const it of o.items) lastSkuByProduct[it.productId] = it.skuId;
    } else if (o.status === "TRIAL" && o.isTrial) {
      productIds = o.items.map((it) => it.productId);
      expired = !!o.trialExpiresAt && new Date(o.trialExpiresAt).getTime() < now;
      // Trial SKU — sadece henüz hiç PAID yoksa son SKU say.
      for (const it of o.items) {
        if (!lastSkuByProduct[it.productId]) lastSkuByProduct[it.productId] = it.skuId;
      }
    } else {
      continue;
    }
    for (const pid of productIds) {
      if (!expired) states[pid] = "active";
      else if (states[pid] === "none") states[pid] = "expired";
    }
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, surname: user.surname },
    apps: {
      // Legacy boolean (true = aktif lisans). Yeni kod `appStates` kullansın.
      finanserpide: states.finanserpide === "active",
      captchaerpide: states.captchaerpide === "active",
      pocketerpide: states.pocketerpide === "active",
    },
    appStates: states,
    trialedProducts: Array.from(trialedProductIds),
    activeSkuByProduct,
    lastSkuByProduct,
  });
}
