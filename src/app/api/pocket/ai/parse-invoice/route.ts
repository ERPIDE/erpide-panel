/**
 * POST /api/pocket/ai/parse-invoice
 *
 * Mobile uygulamasından fatura/fiş fotoğrafı yüklenir, Claude Vision ile
 * yapısal alanlara ayrıştırılır. Mobile sonucu tx modal'a prefill eder,
 * kullanıcı onaylar → kayıt eder.
 *
 * Body: { imageBase64: string, mediaType?: "image/jpeg" | "image/png" | "image/webp" | "image/gif" }
 * Response (200): {
 *   amount: number,             // TL cinsinden toplam
 *   vendor?: string,            // satıcı adı (Migros, BIM, Shell...)
 *   category: string,           // TR sabit kategoriler listesinden bir tanesi
 *   date?: string,              // YYYY-MM-DD (yoksa bugün)
 *   note?: string,              // kısa özet (kalem listesi, kategori detayı)
 *   confidence: "high"|"medium"|"low",
 * }
 *
 * Auth: Bearer pkt_xxx (sync ile aynı). License: PocketERPIDE aktif olmalı.
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { authenticateMobile } from "@/lib/pocket-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXPENSE_CATEGORIES = [
  "Market", "Kira", "Fatura", "Ulaşım", "Yemek", "Sağlık",
  "Eğlence", "Giyim", "Eğitim", "Kart Ödemesi", "Kredi Taksiti",
  "Big Item Alım", "Diğer",
] as const;

const bodySchema = z.object({
  imageBase64: z.string().min(100, "Image too small"),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]).default("image/jpeg"),
});

const SYSTEM_PROMPT = `Sen PocketERPIDE içinde fatura/fiş okuma asistanısın. Kullanıcının yüklediği fişten/faturadan harcama detaylarını çıkar.

ÇOK ÖNEMLİ KURALLAR:
1. SADECE JSON döndür — başka hiçbir metin yok, açıklama yok, markdown yok, kod bloğu yok.
2. Eğer görüntü bir fiş/fatura DEĞİL ise: {"error": "not_invoice", "reason": "..."} formatında 1 satırlık JSON döndür.
3. Amount alanı her zaman fişin GENEL TOPLAM tutarı olsun (KDV dahil, indirim sonrası). Sayı olarak yaz (ör: 1234.56), TL veya ₺ yazma.
4. Date alanı YYYY-MM-DD formatında. Yoksa null bırak.
5. Category alanı tam olarak şu listeden seç (büyük/küçük harf ve harfler tıpatıp aynı):
   ${EXPENSE_CATEGORIES.join(", ")}
   Karar veremiyorsan "Diğer" yaz.
6. Vendor satıcı/firma adı (Migros, BIM, Shell, Akaryakıt, McDonald's vs).
7. Note kısa olsun — 1-2 cümle, kalem detayı ya da harcama özeti.
8. Confidence: "high" = tüm alanlar net okundu, "medium" = bazıları eksik/şüpheli, "low" = sadece tahmin.

JSON şema:
{
  "amount": <number>,
  "vendor": <string|null>,
  "category": <one of category list>,
  "date": <"YYYY-MM-DD"|null>,
  "note": <string|null>,
  "confidence": <"high"|"medium"|"low">
}`;

interface ParsedInvoice {
  amount: number;
  vendor: string | null;
  category: string;
  date: string | null;
  note: string | null;
  confidence: "high" | "medium" | "low";
}

interface ParseError {
  error: "not_invoice" | "parse_failed";
  reason?: string;
}

export async function POST(req: Request) {
  const auth = await authenticateMobile(req);
  if (!auth.ok) return auth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI servisi yapılandırılmamış" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz görsel", detail: parsed.error.message },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let aiText: string;
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: parsed.data.mediaType,
                data: parsed.data.imageBase64,
              },
            },
            {
              type: "text",
              text: "Bu fişten/faturadan harcama detaylarını JSON olarak çıkar.",
            },
          ],
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return NextResponse.json({ error: "AI cevap dönmedi" }, { status: 502 });
    }
    aiText = block.text.trim();
  } catch (e) {
    return NextResponse.json({ error: "AI hatası: " + String(e) }, { status: 502 });
  }

  // Markdown fence varsa temizle
  if (aiText.startsWith("```")) {
    aiText = aiText.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();
  }

  let result: ParsedInvoice | ParseError;
  try {
    result = JSON.parse(aiText) as ParsedInvoice | ParseError;
  } catch {
    return NextResponse.json(
      { error: "AI cevabı parse edilemedi", rawText: aiText.slice(0, 200) },
      { status: 502 }
    );
  }

  if ("error" in result) {
    return NextResponse.json(
      { error: "Bu bir fatura/fiş değil — fotoğrafı tekrar çekin", detail: result.reason },
      { status: 422 }
    );
  }

  // Sanity check + normalize
  if (typeof result.amount !== "number" || !Number.isFinite(result.amount) || result.amount <= 0) {
    return NextResponse.json({ error: "Tutar okunamadı, fotoğrafı tekrar çekin" }, { status: 422 });
  }
  const validCategory: string = (EXPENSE_CATEGORIES as readonly string[]).includes(result.category)
    ? result.category
    : "Diğer";

  return NextResponse.json({
    amount: result.amount,
    vendor: result.vendor || null,
    category: validCategory,
    date: result.date || new Date().toISOString().slice(0, 10),
    note: result.note || null,
    confidence: result.confidence || "medium",
  });
}
