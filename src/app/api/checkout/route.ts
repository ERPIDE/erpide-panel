import { NextResponse } from "next/server";
import { type BuyerInfo } from "@/lib/payments/iyzico";
import { getSku, getProductOfSku } from "@/lib/products";
import { generateReferenceCode, generateLicenseKey } from "@/lib/payments/license";
import { getSession } from "@/lib/auth/session";
import { findUserById, createOrder, updateUser, type OrderItem } from "@/lib/auth/user-store";

export const runtime = "nodejs";

interface CartItemInput {
  skuId: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: "Giriş yapmalısın" }, { status: 401 });

    const user = await findUserById(session.userId);
    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    if (user.emailVerified === false) {
      return NextResponse.json(
        { error: "Ödeme yapmak için önce e-postanı doğrulaman gerekiyor.", needsVerification: true },
        { status: 403 }
      );
    }

    const body = await req.json();
    const items: CartItemInput[] = body.items;
    const billingAddressId: string | undefined = body.billingAddressId;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Sepet boş" }, { status: 400 });
    }

    const addresses = user.savedAddresses || [];
    let billingAddress = billingAddressId ? addresses.find((a) => a.id === billingAddressId) : undefined;
    if (!billingAddress) billingAddress = addresses.find((a) => a.isBillingDefault) || addresses[0];
    if (!billingAddress) {
      return NextResponse.json(
        { error: "Fatura için kayıtlı bir adres seç. Hesabım > Adres Bilgileri'nden ekleyebilirsin.", needsAddress: true },
        { status: 400 }
      );
    }

    // For digital goods we still need a TC kimlik / VKN on the iyzico request.
    // Pull it off the chosen address so the user never has to retype.
    const taxId = billingAddress.type === "individual"
      ? billingAddress.identityNumber
      : billingAddress.taxNumber;
    if (!taxId) {
      return NextResponse.json({ error: "Seçili adreste TC kimlik no veya VKN bulunamadı" }, { status: 400 });
    }

    let totalPrice = 0;
    const orderItems: OrderItem[] = [];
    for (const ci of items) {
      const sku = getSku(ci.skuId);
      if (!sku) return NextResponse.json({ error: `Geçersiz ürün: ${ci.skuId}` }, { status: 400 });
      const product = getProductOfSku(sku.id);
      if (!product) return NextResponse.json({ error: `Ürün bulunamadı: ${ci.skuId}` }, { status: 400 });
      for (let i = 0; i < ci.quantity; i++) {
        const licenseKey = generateLicenseKey(sku.productId);
        orderItems.push({
          skuId: sku.id,
          productId: sku.productId,
          productName: product.name,
          skuName: sku.name,
          price: sku.price,
          licenseKey,
        });
        totalPrice += sku.price;
      }
    }

    // Sync convenience fields onto the user record so older callers keep working
    await updateUser(user.id, {
      gsmNumber: billingAddress.phone,
      identityNumber: billingAddress.identityNumber,
      address: billingAddress.fullAddress,
      city: billingAddress.city,
      district: billingAddress.district,
      postalCode: billingAddress.postalCode,
      companyName: billingAddress.companyName,
      taxNumber: billingAddress.taxNumber,
    });

    const conversationId = generateReferenceCode();
    const order = await createOrder({
      userId: user.id,
      items: orderItems,
      totalPrice,
      currency: "TRY",
      conversationId,
      status: "PENDING",
    });

    const origin = req.headers.get("origin") || "https://erpide.com";
    const callbackUrl = `${origin}/api/payments/callback`;
    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0].trim() || "85.34.78.112";

    const buyerInfo: BuyerInfo = {
      id: user.id,
      name: billingAddress.firstName,
      surname: billingAddress.lastName,
      email: user.email,
      gsmNumber: billingAddress.phone,
      identityNumber: taxId,
      registrationAddress: billingAddress.fullAddress,
      city: billingAddress.city,
      country: billingAddress.country || "Turkey",
      ip,
    };

    const basketItems = orderItems.map((item) => ({
      id: `${item.skuId}-${item.licenseKey.slice(-8)}`,
      name: `${item.productName} ${item.skuName} (Aylık)`,
      category1: item.productName,
      itemType: "VIRTUAL",
      price: item.price.toFixed(2),
    }));

    const result = await initCheckoutMulti({
      conversationId,
      callbackUrl,
      totalPrice,
      buyer: buyerInfo,
      basketItems,
      basketId: order.id,
    });

    if (result.status !== "success") {
      return NextResponse.json({ error: result.errorMessage || "Ödeme başlatılamadı" }, { status: 502 });
    }

    return NextResponse.json({
      paymentPageUrl: result.paymentPageUrl,
      token: result.token,
      orderId: order.id,
      conversationId,
    });
  } catch (e) {
    console.error("[checkout]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

async function initCheckoutMulti(opts: {
  conversationId: string;
  callbackUrl: string;
  totalPrice: number;
  buyer: BuyerInfo;
  basketItems: Array<{ id: string; name: string; category1: string; itemType: string; price: string }>;
  basketId: string;
}) {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) {
    return {
      status: "success" as const,
      token: `MOCK-${opts.conversationId}`,
      paymentPageUrl: `${opts.callbackUrl}?mock=true&token=MOCK-${opts.conversationId}&conversationId=${opts.conversationId}`,
    };
  }

  const Iyzipay = require("iyzipay");
  const client = new Iyzipay({ apiKey, secretKey, uri });
  const price = opts.totalPrice.toFixed(2);

  return new Promise<{ status: "success" | "failure"; token?: string; paymentPageUrl?: string; errorMessage?: string }>((resolve) => {
    client.checkoutFormInitialize.create(
      {
        locale: "tr",
        conversationId: opts.conversationId,
        price,
        paidPrice: price,
        currency: "TRY",
        basketId: opts.basketId,
        paymentGroup: "PRODUCT",
        callbackUrl: opts.callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: opts.buyer,
        shippingAddress: {
          contactName: `${opts.buyer.name} ${opts.buyer.surname}`,
          city: opts.buyer.city,
          country: opts.buyer.country,
          address: opts.buyer.registrationAddress,
        },
        billingAddress: {
          contactName: `${opts.buyer.name} ${opts.buyer.surname}`,
          city: opts.buyer.city,
          country: opts.buyer.country,
          address: opts.buyer.registrationAddress,
        },
        basketItems: opts.basketItems,
      },
      (err: unknown, result: Record<string, unknown>) => {
        if (err) { resolve({ status: "failure", errorMessage: String(err) }); return; }
        if (result.status === "success") {
          resolve({ status: "success", token: result.token as string, paymentPageUrl: result.paymentPageUrl as string });
        } else {
          resolve({ status: "failure", errorMessage: result.errorMessage as string });
        }
      }
    );
  });
}
