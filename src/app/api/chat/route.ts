/**
 * Public chat AI endpoint for erpide.com homepage support widget.
 *
 * - Anonymous (no auth) — anyone visiting erpide.com can chat
 * - Anthropic Claude with TR+RU support
 * - Stateless: client sends full message history
 * - Rate limited per-IP via simple in-memory counter (best effort)
 *
 * NOT to be confused with FinansERPIDE's /api/ai/chat — that one is
 * tenant-scoped with full ERP tool-use. This one is marketing site
 * support only.
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;


const SYSTEM_PROMPT = `Sen ERPIDE'nin web sitesindeki yazılı destek asistanısın. ERPIDE Aydın merkezli Türk yazılım şirketidir.

ÜRÜNLER:
1. FinansERPIDE — multi-tenant ERP/finans SaaS, AI asistanlı muhasebe. Fatura fotoğrafı yükleyince AI okuyup sisteme kaydeder. Cari, fatura, stok, banka, üretim, e-Fatura, mizan. Planlar: Başlangıç 1490 TL/ay, Profesyonel 2990 TL/ay, Kurumsal 5990 TL/ay. 14 gün ücretsiz deneme.
2. CaptchaERPIDE — AI captcha çözücü REST API. Slider, text, icon, puzzle. ~28ms çözüm, %90+ doğruluk. Bot/scraper geliştiricileri için.
3. ERPIDE Yazılım Danışmanlığı — 1C ERP, CANIAS ERP, özel yazılım/otomasyon.

KURALLAR:
- Cevapları KISA tut (2-4 cümle), telefon konuşması gibi.
- Müşteri hangi dilde yazarsa o dilde cevap ver (TR veya RU). Karışık olursa kullanıcının dominant dilini seç.
- Fiyat sorulunca net söyle, gizleme.
- Demo isterse: "İletişim bilgilerinizi alabilir miyim, satış ekibimiz 24 saat içinde size demo gönderir."
- Bilmediğin soruya: "Bu konuyu satış ekibimize iletip dönüş yapayım, e-postanızı alabilir miyim?"
- "AI'yım, gerçek insan değilim" konusunda dürüst ol, ama profesyonel kal.
- Kullanıcı insan istiyorsa: "Tabii, satış ekibimize ileteyim, telefon/e-posta alabilir miyim?"
- Linkler: ürün sayfaları /urunler/finanserpide, /urunler/captchaerpide, iletişim /iletisim, WhatsApp wa.me/908504474237

İlk mesaj cevabını "Merhaba!" gibi tek selamla başlatma — direkt soruya geç.`;


// Basit per-IP throttle — aynı IP'den dakikada 20 mesaj, saatte 100 mesaj.
// Production'da Redis/Upstash istenirse upgrade edilebilir.
const ipBuckets = new Map<string, { minute: { ts: number; count: number }; hour: { ts: number; count: number } }>();
function checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const b = ipBuckets.get(ip) || { minute: { ts: now, count: 0 }, hour: { ts: now, count: 0 } };
  if (now - b.minute.ts > 60_000) b.minute = { ts: now, count: 0 };
  if (now - b.hour.ts > 3_600_000) b.hour = { ts: now, count: 0 };
  b.minute.count++; b.hour.count++;
  ipBuckets.set(ip, b);
  if (b.minute.count > 20) return { allowed: false, reason: "Çok hızlı mesaj atıyorsunuz, lütfen 1 dakika bekleyin." };
  if (b.hour.count > 100) return { allowed: false, reason: "Saatlik mesaj limitiniz doldu." };
  return { allowed: true };
}


export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: "Üzgünüz, AI destek şu an aktif değil. WhatsApp üzerinden bize ulaşabilirsiniz: wa.me/908504474237",
    }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  type MsgIn = { role: "user" | "assistant"; content: string };
  const messages = (body as { messages?: MsgIn[] })?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });
  }
  // Maks 30 mesaj history — uzun konuşmalarda eski mesajları kırp.
  const trimmed = messages.slice(-30).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",  // hızlı + ucuz — marketing site için yeterli
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");
    return NextResponse.json({
      ok: true,
      reply: text || "Üzgünüm, bir cevap üretemedim. Tekrar dener misin?",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({
      error: "AI servisinde sorun var. WhatsApp ile bize ulaşabilirsin: wa.me/908504474237",
      detail: msg,
    }, { status: 500 });
  }
}
