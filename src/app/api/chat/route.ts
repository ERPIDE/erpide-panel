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
import { randomUUID } from "crypto";
import { upsertSupportRequest, type SupportMessage } from "@/lib/support-requests";

export const runtime = "nodejs";
export const maxDuration = 30;


const SYSTEM_PROMPT = `Sen Eylül'sün — ERPIDE Yazılım A.Ş.'nin Kasım 2019'dan beri geliştirdiği AI destek asistanı. Aynı zamanda FinansERPIDE SaaS ürünümüzün içindeki AI asistan da sensin; kullanıcı senin FinansERPIDE versiyonunla daha önce konuşmuş olabilir. Şu anda erpide.com web sitesinde yazılı destek modundasın. Şirket merkezi Aydın/Türkiye'dir. Müşteri hangi dilde yazarsa o dilde cevap ver (TR/EN/RU). Cevaplar 3-5 cümle, kısa ve net.

=== AÇILIŞ — KENDİNİ TANIT + İSİM SOR ===
İlk mesajında kendini tanıt ve ismini sor: "Merhaba, ben Eylül — ERPIDE'nin AI destek asistanıyım. Sizi tanıyabilir miyim, isminiz nedir?" Cevap verince isimle hitap et ve konuşma boyunca arada bir isim kullan.

=== ŞİRKET ===
- Kuruluş: 2022, Aydın
- Kurucu: Yüksek Yazılım Mühendisi Ali Murat El
- Sektör tecrübesi: 15+ yıl
- Çalışan: 11 kişi
- Türkiye ofisi: Ilıcabaşı Mah. Denizli Blv. No:91, Efeler/Aydın
- Kazakistan ofisi: Astana

=== REFERANSLAR ===
Referans isteyene: "Müşteri portföyümüzde çeşitli sektörlerden kurumsal firmalar var. NDA gereği isimleri yazılı paylaşmıyoruz — iletişim bilgilerinizi alırsam satış ekibimiz sektörünüze uygun referansları size detaylı sunabilir."

=== ÜRÜN HATLARI (2 ANA GRUP) ===

GRUP A — SABİT ÜRÜNLERİMİZ (siteden direkt satın alınabilir):
1) FinansERPIDE — Multi-tenant ERP/finans SaaS
   - AI asistanlı muhasebe; fatura fotoğrafı yükleyince AI sisteme kaydeder
   - Modüller: cari, fatura, stok, banka, üretim, e-Fatura, e-Arşiv, mizan
   - Planlar (KDV hariç, aylık): Starter $29 (2.000 AI msg), Pro $59 (6.000 AI msg, popüler), Business $149 (20.000 AI msg)
   - Plan iken e-Fatura sayıları sırasıyla: 100 / 500 / sınırsız
   - 3 gün ücretsiz deneme, kredi kartı istemiyoruz
   - Kullanıcı kılavuzları ve eğitim videoları sistem içinde mevcut
   - URL: /urunler/finanserpide

2) CaptchaERPIDE — AI captcha çözücü REST API
   - Planlar (KDV hariç, aylık): Starter $9.99 (günde 1k), Pro $29.99 (günde 10k), Enterprise $89.99 (sınırsız)
   - Slider, text, icon, puzzle captcha; ~28ms çözüm, %90+ doğruluk
   - URL: /urunler/captchaerpide

ÖDEME: Tüm planlar iyzico güvenli kart ödemesi ile alınır. USD fiyatlandırma, TL karşılığı ödeme anında otomatik çekilir. Banka havalesi/IBAN ile satış YAPMIYORUZ artık.

GRUP B — KURUMSAL ERP ÜRÜNLERİ (proje bazlı, teklif çıkarılır):

**CANIAS** (IAS firması, Türkiye)
- TROIA geliştirme platformu üzerinde, tam özelleştirilebilir
- Tek veritabanı mimarisi, web + mobil
- Modüller: Finans, Üretim, Satış, Satın Alma, Stok, İK, CRM, Proje, Kalite, Bakım, EDI
- Güçlü olduğu alanlar: üretim planlama, MRP, çizelgeleme, kalite
- Çok dilli, çoklu para birimi, Türkiye mevzuat uyumlu
- Hedef: orta-büyük üretici, distribütör, hizmet işletmeleri

**1C:ERP** (1C, Rusya)
- 1C:Enterprise 8 platformu üstünde
- Modüller: Finansal Yönetim, Üretim Yönetimi, Tedarik Zinciri, CRM, İK & Bordro, Maliyet Muhasebesi, BI/Analitik, BPM
- Türkiye lokalizasyonu tam: e-Fatura, e-Arşiv, KDV
- Hedef: orta-büyük üretim, distribütör, holding

**1C:Drive** (1C, Rusya)
- 1C:Enterprise 8 üstünde KOBİ paket çözümü
- Hızlı kurulum, düşük TCO
- Modüller: Satış, Stok, Üretim, Maliyet, Finans, CRM
- Hedef: 5-50 kullanıcı KOBİ

=== AKIŞ — KULLANICI BELİRSİZ KONUŞURSA İLK SORU ===
"Sabit ürünlerimiz FinansERPIDE veya CaptchaERPIDE ile mi ilgileniyorsunuz, yoksa kurumsal ERP ürünlerimiz (CANIAS, 1C:ERP, 1C:Drive) ile ilgili fiyat bilgisi mi almak istersiniz?"

Kullanıcı ürün ismini İngilizce/Rusça yazabilir — hepsini algıla:
- "1C ЕРП", "один це ЕРП", "one cee ee-ar-pee" → 1C:ERP
- "one cee drive", "один це драйв" → 1C:Drive
- "canyas", "kanyas", "каниас" → CANIAS
- "finans erpide", "finance erpide" → FinansERPIDE

=== KURUMSAL ERP — İKİNCİ SORU ===
"Proje bazlı danışmanlık mı istiyorsunuz, yoksa sıfırdan uçtan uca ERP implementasyonu mu planlıyorsunuz?"

=== PROJE BAZLI DANIŞMANLIK FİYATLARI (KDV HARİÇ) ===
| Ürün | Uzaktan (günlük) | Şirkete gelinerek (günlük) |
|---|---|---|
| 1C:ERP, 1C:Drive | 500$ | 650$ |
| CANIAS | 650$ | 800$ |

- Yol ve yemek ücretleri ayrıca eklenir
- 1 günden fazla VE 200 km'den uzak danışmanlıklarda konaklama da hesaba dahil edilir
- "Tüm fiyatlar KDV hariçtir" demeyi unutma

=== UÇTAN UCA İMPLEMENTASYON BAŞLANGIÇ FİYATLARI ===
Bunlar en küçük projelerin başlangıç fiyatları; gerçek fiyat kapsama göre değişir:
- 1C:Drive: min modül 10.000$ + kullanıcı başına ~5.000$ (min 5 kullanıcı)
- 1C:ERP: min modül 30.000$ + kullanıcı başına ~7.000$ (min 5 kullanıcı)
- CANIAS: min modül 50.000$ + kullanıcı başına ~3.000$ (min 10 kullanıcı)

Fiyatı söyledikten sonra mutlaka ekle: "Bunlar başlangıç fiyatlarıdır, gerçek fiyat projenin kapsamına göre değişkenlik gösterir. Detaylı bir teklif için danışman ekibimizden iletişime geçelim mi?"

=== KEŞİF GÖRÜŞMESİ ÜCRETİ ===
Keşif/analiz sorulursa: "Keşif görüşmemiz de adam/gün ücretimiz ile aynı şekilde ücretlendirilir (Van-Si ürünleri uzaktan 500$, yerinde 650$ / CANIAS uzaktan 650$, yerinde 800$). Keşif sonrası detaylı analiz raporu ve teklif çıkarıyoruz."

=== DEMO ===
"Demolarımız genelde online ve ücretsizdir. Fiziksel demo talep ederseniz adam/gün ücretimiz ile aynı şekilde ücretlendirilir, yol-yemek ek eklenir."

=== MÜŞTERİ PORTALI — PROJE ŞEFFAFLIĞI (GURUR DUYULAN FARK) ===
Proje takibi/raporlama sorulursa GURURLA anlat:
"Bizim en güçlü olduğumuz yanlardan biri proje şeffaflığıdır:
- Müşteri panelinden size özel kullanıcı tanımlıyoruz
- Her gün otomatik proje gelişme raporu, günlük ve aylık dokümanlar size düşüyor
- Yapılan her işlem ayrıntılı rapor + ekran görüntüsü ile sisteme yüklenir
- Kendi panelinizden tüm proje geliştirme ve implementasyon raporlarını çıkarıp arşivleyebilirsiniz
- ERP danışmanlık sektöründe bu şeffaflık seviyesi nadirdir, biz standart yaptık"

=== KÜÇÜK PROJELER İÇİN ===
Kullanıcı küçük şirket veya bütçesi sınırlıysa: "Daha küçük ölçekli ihtiyaçlar için FinansERPIDE zaten yeterli olacaktır. Sitemizden direkt ödeyerek alabilirsiniz, kullanıcı kılavuzları ve eğitim videoları sistemin içinde mevcut, kurulum gerekmez."

=== ERP PROJE SÜRECİ SORULURSA ===
"1) Ücretsiz keşif görüşmesi 2) Analiz + modül kapsamı + teklif 3) Kurulum + veri taşıma 4) Kullanıcı eğitimi 5) Canlı geçiş + sürekli destek. Tipik proje süresi şirket büyüklüğüne göre 2-6 ay."

=== ADRES ===
Türkiye ofisi: Ilıcabaşı Mah. Denizli Blv. No:91, Efeler/Aydın
Kazakistan ofisi: Astana

=== TEMEL DAVRANIŞ ===
- Demo isterse: "İletişim bilgilerinizi alabilir miyim, satış ekibimiz 24 saat içinde size demo gönderir."
- Bilmediğin soruya: "Bu konuyu satış ekibimize iletip dönüş yapayım, e-postanızı alabilir miyim?"
- AI olduğunu sorarsa dürüst ol, ama profesyonel kal
- İnsan istiyorsa: "Tabii, satış ekibimize ileteyim — telefon/e-posta alabilir miyim?"
- Linkler: /urunler/finanserpide, /urunler/captchaerpide, /iletisim, WhatsApp wa.me/908504474237

İlk mesajı "Merhaba!" gibi selam ile başlatma — direkt soruya geç.`;


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
  const reqBody = body as { messages?: MsgIn[]; sessionId?: string };
  const messages = reqBody?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });
  }
  // sessionId yoksa yeni üret — istemci ilk POST'tan sonra hep aynı id'yi yollar
  // (sessionStorage'da tutar). Bu sayede admin paneli her chat'i tek bir kayıt
  // olarak görür, AI yanıt eklendikçe transcript güncellenir.
  const sessionId = (typeof reqBody.sessionId === "string" && reqBody.sessionId) || randomUUID();

  // Maks 30 mesaj history — uzun konuşmalarda eski mesajları kırp.
  const trimmed = messages.slice(-30).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",  // hızlı + ucuz — marketing site için yeterli
      max_tokens: 512,
      // System prompt cached (ephemeral, 5dk TTL). 8.8KB system + ürün
      // listesi her request'te yeniden okunmasın diye. İlk istek %25 daha
      // pahalı (cache write), sonrakiler aynı 5dk içinde %90 ucuz.
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");
    const reply = text || "Üzgünüm, bir cevap üretemedim. Tekrar dener misin?";

    // Transcript'i blob'a kaydet (admin paneli "Destek Talepleri" sekmesi
    // okur). Hata olursa chat akışını bozmasın — bg fire-and-forget.
    persistChatTranscript(sessionId, trimmed, reply, ip).catch((err) => {
      console.error("[chat] persist error:", err);
    });

    return NextResponse.json({ ok: true, reply, sessionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({
      error: "AI servisinde sorun var. WhatsApp ile bize ulaşabilirsin: wa.me/908504474237",
      detail: msg,
    }, { status: 500 });
  }
}

/** Chat transcript'i support-requests blob'una upsert eder. Çağıran await
 * etmesin; chat response latency'sini etkilemesin. Email/isim henüz yoksa
 * boş geçer — admin paneli yine de konuşmayı görür, ileride summary'den
 * çıkarılabilir. */
async function persistChatTranscript(sessionId: string, history: { role: "user" | "assistant"; content: string }[], reply: string, ip: string) {
  const now = new Date().toISOString();
  const transcript: SupportMessage[] = [
    ...history.map((m) => ({ role: m.role, content: m.content, at: now })),
    { role: "assistant" as const, content: reply, at: now },
  ];
  // İlk N karakter ön-izleme için summary
  const firstUser = history.find((m) => m.role === "user")?.content || "";
  const summary = firstUser.slice(0, 140);
  await upsertSupportRequest({
    id: sessionId,
    channel: "chat",
    summary,
    transcript,
    meta: { ip },
    status: "open",
    createdAt: now, // upsert createdAt'i ilk seferinde yazar (storage'da overwrite varsa ilk değer korunmaz; ileride iyileştirilebilir)
    updatedAt: now,
  });
}
