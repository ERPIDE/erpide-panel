import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

const VALID_KEY_RE = /^(FRP|CAP)-\d{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/i;

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const licenseKey = String(body.licenseKey || "").trim().toUpperCase();
    const signature = req.headers.get("x-signature");
    const secret = process.env.LICENSE_SHARED_SECRET;

    if (!secret) {
      // Dev mode: HMAC bypass + accept any FRP/CAP formatted key as valid.
      // In production, LICENSE_SHARED_SECRET MUST be set and signature MUST be verified.
      if (!VALID_KEY_RE.test(licenseKey)) {
        return NextResponse.json({ valid: false, reason: "Geçersiz format" }, { status: 400 });
      }
      const productId = licenseKey.startsWith("FRP") ? "finanserpide" : "captchaerpide";
      return NextResponse.json({
        valid: true,
        productId,
        planId: `${productId}-starter-monthly`,
        buyerEmail: "dev@erpide.com",
        issuedAt: new Date().toISOString(),
        mode: "DEV_NO_SECRET",
      });
    }

    if (!signature) {
      return NextResponse.json({ valid: false, reason: "İmza eksik" }, { status: 401 });
    }
    const expected = createHmac("sha256", secret).update(licenseKey).digest("hex");
    if (!safeEqualHex(signature, expected)) {
      return NextResponse.json({ valid: false, reason: "Geçersiz imza" }, { status: 401 });
    }

    if (!VALID_KEY_RE.test(licenseKey)) {
      return NextResponse.json({ valid: false, reason: "Geçersiz format" }, { status: 400 });
    }

    // TODO (production): Vercel KV / Postgres'ten lisansı bul ve durumunu döndür.
    // Şu an iyzico callback console.log'a yazıyor, kalıcı DB gelene kadar
    // yapı doğrulamasıyla yetiniyoruz (HMAC imza zaten authenticity sağlıyor).
    const productId = licenseKey.startsWith("FRP") ? "finanserpide" : "captchaerpide";
    return NextResponse.json({
      valid: true,
      productId,
      planId: `${productId}-starter-monthly`,
      buyerEmail: "verified@erpide.com",
      issuedAt: new Date().toISOString(),
      mode: "HMAC_VERIFIED",
    });
  } catch (e) {
    return NextResponse.json({ valid: false, reason: String(e) }, { status: 500 });
  }
}
