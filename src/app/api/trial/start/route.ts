import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSku, getProductOfSku } from "@/lib/products";
import { generateLicenseKey } from "@/lib/payments/license";
import { createOrder, hasUsedTrialForSku, findUserById, type OrderItem } from "@/lib/auth/user-store";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const TRIAL_DAYS = 3;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }

  // forceFresh: kullanıcı az önce OAuth ile kaydolmuş olabilir, cache stale
  // sebebiyle emailVerified=false sayıp deneme başlatmayı bloklamayalım.
  const user = await findUserById(session.userId, true);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
  if (user.emailVerified === false) {
    return NextResponse.json(
      { error: "Deneme başlatmak için önce e-postanı doğrulaman gerekiyor.", needsVerification: true },
      { status: 403 }
    );
  }

  let body: { skuId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const skuId = body.skuId;
  if (!skuId) return NextResponse.json({ error: "skuId gerekli" }, { status: 400 });

  const sku = getSku(skuId);
  const product = getProductOfSku(skuId);
  if (!sku || !product) {
    return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
  }

  const already = await hasUsedTrialForSku(session.userId, skuId);
  if (already) {
    return NextResponse.json(
      { error: "Bu ürün için zaten bir deneme sürümü kullandınız" },
      { status: 409 }
    );
  }

  const licenseKey = generateLicenseKey(product.id);
  const expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const item: OrderItem = {
    skuId: sku.id,
    productId: product.id,
    productName: product.name,
    skuName: sku.name,
    price: 0,
    licenseKey,
  };

  const order = await createOrder({
    userId: session.userId,
    items: [item],
    totalPrice: 0,
    currency: "TRY",
    conversationId: `TRIAL-${randomUUID()}`,
    status: "TRIAL",
    isTrial: true,
    trialExpiresAt: expiresAt,
  });

  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      licenseKey,
      productName: product.name,
      skuName: sku.name,
      trialExpiresAt: expiresAt,
      trialDays: TRIAL_DAYS,
    },
  });
}
