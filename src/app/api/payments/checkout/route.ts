import { NextResponse } from "next/server";
import { initCheckout } from "@/lib/payments/iyzico";
import { getPlan } from "@/lib/payments/plans";
import { generateReferenceCode } from "@/lib/payments/license";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, buyer } = body;

    if (!planId || !buyer) {
      return NextResponse.json({ error: "planId ve buyer zorunlu" }, { status: 400 });
    }

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Geçersiz plan" }, { status: 404 });
    }

    const conversationId = generateReferenceCode();
    const origin = req.headers.get("origin") || "https://erpide.com";
    const callbackUrl = `${origin}/api/payments/callback`;

    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0].trim() || "85.34.78.112";

    const result = await initCheckout({
      plan,
      conversationId,
      callbackUrl,
      buyer: {
        id: buyer.email,
        name: buyer.name || "Müşteri",
        surname: buyer.surname || "Kullanıcı",
        email: buyer.email,
        gsmNumber: buyer.gsmNumber || "+905555555555",
        identityNumber: buyer.identityNumber || "11111111111",
        registrationAddress: buyer.address || "Türkiye",
        city: buyer.city || "İstanbul",
        country: "Turkey",
        ip,
      },
    });

    if (result.status !== "success") {
      return NextResponse.json(
        { error: result.errorMessage || "Ödeme başlatılamadı", code: result.errorCode },
        { status: 502 }
      );
    }

    return NextResponse.json({
      paymentPageUrl: result.paymentPageUrl,
      token: result.token,
      conversationId,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
