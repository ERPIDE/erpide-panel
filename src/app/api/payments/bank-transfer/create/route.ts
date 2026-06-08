/**
 * POST /api/payments/bank-transfer/create
 *
 * Kullanıcı checkout'ta "Havale" seçince çağrılır. Sepetteki SKU'ların toplamını
 * günün TCMB USD/TRY satış kuruyla TL'ye çevirir, alta yuvarlar, unique kod
 * üretir, BankTransferRequest kaydı oluşturur. Kullanıcı /odeme/havale/{code}
 * sayfasına yönlendirilir (IBAN, tutar, açıklama kodu gösterilir).
 *
 * Body: { skuIds: string[] }
 */
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/user-store";
import { getSku, getProductOfSku } from "@/lib/products";
import { convertUSDToTRYRounded } from "@/lib/fx-tcmb";
import { createBankTransferRequest } from "@/lib/auth/user-store";
import { COMPANY } from "@/lib/company-info";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

function generateBankTransferCode(): string {
  // HAV-XXXXXXXX (8 char, base32 Crockford'a yakın)
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return "HAV-" + Array.from(bytes).map((b) => ALPHA[b % ALPHA.length]).join("");
}

export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Önce giriş yapın" }, { status: 401 });
  const user = await findUserById(session.userId!);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });

  let body: { skuIds?: string[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const skuIds = Array.isArray(body.skuIds) ? body.skuIds : [];
  if (skuIds.length === 0) return NextResponse.json({ error: "Sepet boş" }, { status: 400 });

  // SKU'ları doğrula + USD toplamını hesapla
  let totalUSD = 0;
  const skuNames: string[] = [];
  let productId: string | null = null;
  for (const id of skuIds) {
    const sku = getSku(id);
    if (!sku) return NextResponse.json({ error: `SKU bulunamadı: ${id}` }, { status: 400 });
    const product = getProductOfSku(id);
    if (!product) return NextResponse.json({ error: `Ürün bulunamadı: ${id}` }, { status: 500 });
    if (!productId) productId = product.id;
    // Aynı havale isteğinde farklı ürünlerden SKU varsa şu an reddet — basitlik
    if (productId !== product.id) {
      return NextResponse.json({ error: "Farklı ürünlerin SKU'ları aynı havale isteğine konamaz. Ayrı ödeme yap." }, { status: 400 });
    }
    const usd = sku.prices?.USD || sku.price || 0;
    totalUSD += usd;
    skuNames.push(sku.name);
  }
  if (totalUSD <= 0) return NextResponse.json({ error: "Toplam tutar sıfır" }, { status: 400 });

  const fx = await convertUSDToTRYRounded(totalUSD);

  // Unique kod (3 deneme — pratik olarak çakışmaz)
  const ibanUsed = process.env.BANK_IBAN_TRY || "TR00 0000 0000 0000 0000 0000 00";
  const ibanHolder = process.env.BANK_HOLDER || COMPANY.bank.accountHolder;

  let code = generateBankTransferCode();
  let attempt = 0;
  let req2: Awaited<ReturnType<typeof createBankTransferRequest>> | null = null;
  while (attempt < 3 && !req2) {
    try {
      req2 = await createBankTransferRequest({
        code,
        userId: user.id,
        userEmail: user.email,
        productId: productId!,
        skuIds,
        skuNames,
        amountUSD: totalUSD,
        fxRate: fx.fxRate,
        fxRateDate: fx.fxRateDate,
        amountTRY: fx.amountTRY,
        ibanUsed,
        ibanHolder,
        expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(), // 7 gün
      });
    } catch {
      attempt++;
      code = generateBankTransferCode();
    }
  }
  if (!req2) return NextResponse.json({ error: "Kod üretilemedi, tekrar deneyin" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    code: req2.code,
    amountUSD: req2.amountUSD,
    amountTRY: req2.amountTRY,
    fxRate: req2.fxRate,
    fxRateDate: req2.fxRateDate,
    iban: req2.ibanUsed,
    ibanHolder: req2.ibanHolder,
    redirectUrl: `/odeme/havale/${req2.code}`,
  });
}
