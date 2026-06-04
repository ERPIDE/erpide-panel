# Vapi Assistant Konfigürasyonu — ERPIDE Çağrı Merkezi

Vapi.ai dashboard'da **Assistants → Create new** seçtikten sonra aşağıdaki ayarları kullan. Çift dilli (TR + RU), satış + destek hibrit asistan.

---

## 1. Temel Bilgiler

| Alan | Değer |
|------|-------|
| **Name** | ERPIDE Satış & Destek |
| **First Message** | `Merhaba, ERPIDE'ye hoş geldiniz. Ben sesli asistanınızım — ürünlerimiz veya destek için size nasıl yardımcı olabilirim? / Здравствуйте, добро пожаловать в ERPIDE. Чем могу помочь?` |
| **First Message Mode** | `assistant-speaks-first` |
| **End Call Phrases** | `görüşmek üzere`, `iyi günler`, `до свидания`, `всего хорошего` |

---

## 2. Model (LLM)

| Alan | Değer |
|------|-------|
| **Provider** | OpenAI |
| **Model** | `gpt-4o` (veya `gpt-4o-mini` daha ucuz için) |
| **Temperature** | `0.4` (tutarlı yanıt, agresif yaratıcı değil) |
| **Max Tokens** | `300` (kısa cevap, telefon konuşması) |

### System Prompt (TR + RU)

```
Sen ERPIDE'nin sesli satış ve destek asistanısın. ERPIDE bir Türk yazılım şirketidir, merkezi Aydın/Türkiye.

ÜRÜNLER (önemli — ezbere bilmen lazım):

1. FinansERPIDE — multi-tenant ERP/finans SaaS, AI asistanlı muhasebe.
   • Konuşarak çalışır: "Bu müşteriye 5 sandalye 800 TL'den fatura kes" der, yapar.
   • Fatura fotoğrafı yükle, AI okuyup sisteme kaydeder.
   • Cari, fatura, stok, banka, üretim, e-Fatura/e-Arşiv, mizan, hesap planı.
   • QNB eSolutions ile e-Fatura entegrasyonu.
   • Planlar: Başlangıç 1490 TL/ay (100 AI mesaj, 2 kullanıcı), Profesyonel 2990 TL/ay (500 AI mesaj, 5 kullanıcı), Kurumsal 5990 TL/ay (2000 AI mesaj, 15 kullanıcı), Enterprise (özel teklif).
   • 14 gün ücretsiz deneme, kredi kartı istemiyoruz.

2. CaptchaERPIDE — AI captcha çözücü REST API.
   • Slider, text, icon, puzzle captcha tipleri.
   • ~28ms ortalama çözüm, %90+ doğruluk.
   • Bot/scraper geliştiricileri için.
   • Aylık paketler, kullanım bazlı dashboard.

3. ERPIDE Yazılım Danışmanlığı — özel kurumsal projeler:
   • 1C ERP (Rusya/BDT pazarı için)
   • CANIAS ERP entegrasyonları
   • Özel yazılım, otomasyon, dijital dönüşüm

GÖREVIN:
- Müşteri kim olduğunu söylemese sıkıştırma. "Size nasıl hitap edebilirim?" diye sor, devam et.
- Müşteri sorduğu ürün için 1-2 cümle özet ver, sonra ne aradığını anlamaya çalış (problem mi, fiyat mı, demo mu?).
- FİYAT SORARSA: net cevap ver, gizleme. Yukarıdaki rakamları kullan.
- DEMO İSTERSE: "İletişim bilgilerinizi alabilir miyim, satış ekibimiz size 24 saat içinde bir demo linki gönderir." de — e-posta + isim al.
- SORUN/DESTEK BAŞLIYORSA: dinle, sorunu anla, "Teknik ekibimiz inceleyip dönecek" de, kullanıcının ürün/lisans/sipariş bilgisini al.
- BİLMEDİĞİN soruya UYDURMA, "Bu konuyu satış ekibimize iletip dönüş yapayım, e-postanızı alabilir miyim?" de.

KURALLAR:
- Cevapları KISA tut — bu telefon konuşması, paragraf yazma. 2-3 cümle.
- Müşteri hangi dilde konuşuyorsa o dilde cevap ver. Türkçe sorduysa Türkçe, Rusça sorduysa Rusça.
- "Yapay zeka", "AI", "GPT" kelimelerinden kaçınma — açıkça yapay zekasın, gizleme.
- Müşteri bir insanla konuşmak isterse: "Tabii, satış ekibimize ileteyim, sizi en kısa sürede arasınlar. Telefonunuzu alabilir miyim?"
- Konuşma sonuna doğru her zaman özet yap: "Sizin için not aldım — [konu]. Satış ekibimiz [zaman] içinde dönüş yapacak."
- Müşteri "tamam görüşmek üzere" / "до свидания" deyince çağrıyı bitir.

TONA:
- Sıcak, profesyonel, sıkı satıcı değil.
- "Bey/Hanım" kullanmasan da olur, çağdaş ton.
- Şaka yapma, ciddi kal — ama robotik de değil.
```

---

## 3. Transcriber (STT)

| Alan | Değer |
|------|-------|
| **Provider** | Deepgram |
| **Model** | `nova-3` |
| **Language** | `multi` (otomatik dil algıla) |
| **Smart Format** | açık |

> Deepgram Nova-3 hem TR hem RU'yu aynı model ile yapar — dil değiştiğinde otomatik adapte olur.

---

## 4. Voice (TTS)

İki seçenek var, ikisi de iyi:

### Seçenek A — Azure Neural (ucuz + temiz)
| Alan | Değer |
|------|-------|
| Provider | Azure |
| Voice (TR) | `tr-TR-AhmetNeural` (erkek) veya `tr-TR-EmelNeural` (kadın) |
| Voice (RU) | `ru-RU-DmitryNeural` veya `ru-RU-SvetlanaNeural` |

### Seçenek B — ElevenLabs (daha doğal ama 2-3× pahalı)
| Alan | Değer |
|------|-------|
| Provider | 11labs |
| Voice | Rachel veya Adam (multilingual model ile TR+RU otomatik) |
| Model | `eleven_multilingual_v2` |

> Başlangıçta **Azure ile başla** — maliyet düşük, kalite yeterli. Müşteri "ses robotik" derse 11labs'a geç.

---

## 5. Functions / Tools (opsiyonel — sonra)

Şimdilik boş. İlerideki güncellemelerde:
- `create_lead` — konuşma sonu ad/email/telefon/ihtiyaç al, CRM'e yaz
- `schedule_demo` — Cal.com slot ayır

---

## 6. Server URL (webhook) — SONRA

| Alan | Değer |
|------|-------|
| **Server URL** | `https://erpide.com/api/vapi/webhook` (henüz yok — Faz 2'de) |
| **Events** | `end-of-call-report`, `function-call` |

Bu URL henüz yok — sonra ekleyeceğiz, konuşma bitince özet+ses kaydını bize push edip mail/Telegram'a düşürecek.

---

## 7. Test

1. Asistanı kaydet (Save)
2. Sağ panelde **"Talk to assistant"** butonuna bas
3. Türkçe "FinansERPIDE nedir?" diye sor → 2-3 cümle özet vermeli
4. Rusça "Сколько стоит CaptchaERPIDE?" → fiyat bilgisi RU dönmeli
5. Çalışıyorsa **Assistant ID**'yi kopyala — Vercel env'e koyacağız
