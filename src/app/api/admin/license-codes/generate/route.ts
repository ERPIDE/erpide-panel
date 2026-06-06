/**
 * POST /api/admin/license-codes/generate
 * Header: x-admin-token: <ADMIN_BOOTSTRAP_TOKEN>
 * Body:   { skuId: string, count?: number, durationDays?: number, note?: string }
 *
 * Toplu aktivasyon kodu üretir. Hepsiburada/N11/dağıtıcılara e-pin olarak
 * verilecek kodlar için. Üretilen kodları döner — bir daha plain text
 * sorgulanamaz (hash değil, ama listelemekle aynı şey değil — yine de
 * kayıt yapıldığı için tekrar listeyle döner).
 */
import { NextResponse } from "next/server";
import { createLicenseCode } from "@/lib/auth/user-store";
import { getSku, getProductOfSku } from "@/lib/products";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

function generateCode(): string {
  // ERP-XXXX-XXXX-XXXX → 12 char + 3 tire = 15, base32 (Crockford'a yakın)
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // I, O, 0, 1 yok (karışıklık önler)
  const bytes = randomBytes(12);
  const chars = Array.from(bytes).map((b) => ALPHA[b % ALPHA.length]).join("");
  return `ERP-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_BOOTSTRAP_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { skuId?: string; count?: number; durationDays?: number; note?: string; expiresAt?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const skuId = String(body.skuId || "");
  const count = Math.max(1, Math.min(500, Number(body.count) || 1));
  const durationDays = Math.max(1, Math.min(3650, Number(body.durationDays) || 30));

  const sku = getSku(skuId);
  if (!sku) return NextResponse.json({ error: "SKU bulunamadı" }, { status: 404 });
  const product = getProductOfSku(skuId);
  if (!product) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 500 });

  const batchId = `batch-${Date.now()}`;
  const generated: { code: string; skuId: string; productId: string; durationDays: number }[] = [];
  for (let i = 0; i < count; i++) {
    // Çakışma olursa tekrar üret (alfabe ~5e17 kombinasyon, pratik olarak çarpışmaz).
    let code = generateCode();
    let tries = 0;
    while (tries < 3) {
      try {
        const rec = await createLicenseCode({
          code,
          skuId,
          productId: product.id,
          durationDays,
          batchId,
          note: body.note,
          expiresAt: body.expiresAt,
        });
        generated.push({
          code: rec.code,
          skuId: rec.skuId,
          productId: rec.productId,
          durationDays: rec.durationDays,
        });
        break;
      } catch (e) {
        tries++;
        if (tries >= 3) throw e;
        code = generateCode();
      }
    }
  }

  return NextResponse.json({
    ok: true,
    batchId,
    productName: product.name,
    skuName: sku.name,
    durationDays,
    codes: generated.map((g) => g.code),
  });
}
