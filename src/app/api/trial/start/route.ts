/**
 * POST /api/trial/start  { skuId }
 *
 * 14 günlük ücretsiz deneme başlatır. Kod üretip müşteriye yapıştırtmaz:
 * TRIAL statüsünde bir sipariş açılır, ürün tarafı lisansı license-service
 * üzerinden görür ve müşteri erpide.com hesabıyla doğrudan içeri girer.
 *
 * Deneme KARTLIDIR. Süre dolduğunda tahsilatın kendiliğinden yapılabilmesi
 * için kart saklanır; müşteri iptal etmezse abonelik otomatik başlar.
 * iyzico ödeme yapılmadan kart saklamadığı için ₺1'lik bir doğrulama işlemi
 * alınır ve callback'te aynı gün iptal edilir (ekstreye çoğu bankada hiç
 * yansımaz). Müşterinin kayıtlı kartı zaten varsa bu adım atlanır.
 *
 * Kurallar:
 *   - Giriş yapmış olmak şart (deneme kimliğe bağlı)
 *   - SKU başına ÖMÜR BOYU tek deneme (hasUsedTrialForSku) — süresi dolmuş
 *     denemeyi tekrar başlatabilmek "sonsuz ücretsiz kullanım" demekti
 *   - noTrial ürünleri reddedilir (AI kontör gibi her kullanımda gerçek para
 *     yakanlar), satıştan kalkmış SKU'lar da öyle
 *   - Zaten aktif denemesi varsa yeni açmaz, mevcudu döner (çift tıklama)
 *
 * Deneme bitince renew-subscriptions cron'u saklı karttan gerçek tutarı çeker
 * ve sipariş PAID'e geçer. İptal edilmişse ya da kart yoksa tahsilat denenmez;
 * license-service süresi geçmiş lisansı zaten kapatır.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  findUserByEmail,
  createOrder,
  findActiveTrialForUserSku,
  hasUsedTrialForSku,
  type OrderItem,
} from "@/lib/auth/user-store";
import { getSku, getProductOfSku } from "@/lib/products";
import { priceForCharge } from "@/lib/currency";
import { generateLicenseKey } from "@/lib/payments/license";
import { initCheckoutMulti } from "@/app/api/checkout/route";
import { provisionFinanserpideSku } from "@/lib/payments/finanserpide-provision";
import { invalidateRemoteLicenseCache } from "@/lib/payments/license-service-invalidate";

export const runtime = "nodejs";

export const TRIAL_DAYS = 14;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId || !session.email) {
    return NextResponse.json({ error: "Denemeyi başlatmak için giriş yapmalısın." }, { status: 401 });
  }

  let body: { skuId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  const skuId = (body.skuId || "").trim();
  const sku = skuId ? getSku(skuId) : null;
  const product = sku ? getProductOfSku(skuId) : null;
  if (!sku || !product) {
    return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
  }
  if (product.noTrial) {
    return NextResponse.json(
      { error: `${product.name} için ücretsiz deneme sunulmuyor.` },
      { status: 403 }
    );
  }
  if (sku.legacy) {
    return NextResponse.json({ error: "Bu paket artık satışta değil." }, { status: 410 });
  }

  const user = await findUserByEmail(session.email);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Çift tıklama / geri gelme: yeni deneme açmak yerine mevcudu döndür.
  const active = await findActiveTrialForUserSku(user.id, sku.id);
  if (active) {
    return NextResponse.json({
      ok: true,
      alreadyActive: true,
      orderId: active.id,
      expiresAt: active.trialExpiresAt,
    });
  }

  if (await hasUsedTrialForSku(user.id, sku.id)) {
    return NextResponse.json(
      { error: "Bu paketin ücretsiz denemesini daha önce kullandın. Devam etmek için satın alabilirsin.", used: true },
      { status: 409 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  // Deneme kart ister: süre dolduğunda tahsilat kendiliğinden yapılabilsin.
  // Müşterinin kayıtlı kartı yoksa ₺1'lik bir doğrulama işlemiyle iyzico'ya
  // kart kaydettiriyoruz; o ₺1 callback'te aynı gün iptal ediliyor (iyzico
  // ödeme yapılmadan kart saklamıyor).
  const hasSavedCard = !!(user.iyzicoCardUserKey && user.iyzicoCardToken);

  const item: OrderItem = {
    skuId: sku.id,
    productId: product.id,
    productName: product.name,
    skuName: sku.name,
    price: 0,
    licenseKey: generateLicenseKey(product.id),
  };

  // Deneme bitince çekilecek tutar siparişte duruyor; checkout'ta yalnızca
  // ₺1 doğrulama alınıyor.
  const chargeAfterTrial = priceForCharge(sku).price;
  const conversationId = `trial-${sku.id}-${now.getTime()}`;

  const order = await createOrder({
    userId: user.id,
    items: [{ ...item, price: chargeAfterTrial }],
    totalPrice: chargeAfterTrial,
    currency: "TRY",
    conversationId,
    // Kart zaten varsa deneme hemen başlar; yoksa ödeme dönüşünde TRIAL'a çevrilir.
    status: hasSavedCard ? "TRIAL" : "PENDING",
    isTrial: true,
    trialExpiresAt: expiresAt.toISOString(),
    billingCycle: sku.cycle === "yearly" ? "yearly" : "monthly",
    // Denemenin tamamı otomatik geçiş içindir — müşteri iptal etmezse devam eder.
    autoRenewEnabled: true,
  });

  if (!hasSavedCard) {
    const origin = req.headers.get("origin") || "https://erpide.com";
    const checkout = await initCheckoutMulti({
      conversationId,
      callbackUrl: `${origin}/api/payments/callback`,
      totalPrice: 1,
      currency: "TRY",
      buyer: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        gsmNumber: user.gsmNumber || "+905000000000",
        identityNumber: user.identityNumber || user.taxNumber || "11111111111",
        registrationAddress: user.address || "Türkiye",
        city: user.city || "İstanbul",
        country: "Turkey",
        ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "85.34.78.112",
      },
      basketItems: [{
        id: `trial-${sku.id}`,
        name: `${product.name} ${sku.name} — ${TRIAL_DAYS} gün deneme (kart doğrulama)`,
        category1: product.name,
        itemType: "VIRTUAL",
        price: "1.00",
      }],
      basketId: order.id,
      cardUserKey: user.iyzicoCardUserKey,
    });

    if (checkout.status !== "success") {
      return NextResponse.json(
        { error: checkout.errorMessage || "Kart doğrulama başlatılamadı" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      needsCard: true,
      paymentPageUrl: checkout.paymentPageUrl,
      orderId: order.id,
      trialDays: TRIAL_DAYS,
    });
  }

  // Ürün tarafında aboneliği aç — satın almadaki akışın aynısı. Başarısız
  // olursa denemeyi geri almıyoruz: lisans state'inin tek doğru kaynağı
  // license-service ve o bu siparişi zaten görüyor.
  if (product.id === "finanserpide") {
    const prov = await provisionFinanserpideSku({
      buyerEmail: user.email,
      paymentId: `trial-${order.id}`,
      sku,
      quantity: 1,
    });
    if (!prov.ok) console.error("[trial] finanserpide provision failed:", prov.error);
  }

  // Ürün tarafı 5 dk cache'liyor — deneme hemen görünsün.
  await invalidateRemoteLicenseCache(user.email).catch(() => {});

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    expiresAt: expiresAt.toISOString(),
    trialDays: TRIAL_DAYS,
  });
}
