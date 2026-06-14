# ERPIDE — Pazarlama & SEO Stratejisi (Master Plan)

**Son güncelleme:** 2026-06-14
**Sahip:** Ali Murat El (ERPIDE Yazılım A.Ş. kurucu)

Bu dokümanın amacı: ERPIDE markasını ve 8 ürünü globalde ölçeklendirecek pazarlama + SEO + içerik stratejisinin **tek doğru kaynağı** olmak. Her ürünün hedef pazarı, kanalları, mesajları, KPI'ları burada toplanır. Yapılacaklar listesi sondaki "Aksiyon Kuyruğu"nda.

---

## 1. Ürün Konumlandırma Özeti

| Ürün | Kategori | Pazar | Asıl Persona | Ana Vaat |
|---|---|---|---|---|
| **FinansERPIDE** | Web SaaS | 🇹🇷 TR | KOBİ + Anonim Şirket finans/muhasebe sorumlusu | "AI'yle konuşarak şirketini yönet — e-Fatura, bank, vergi tek panelde." |
| **PocketERPIDE** | Mobil | 🇹🇷 TR | Memur, mühendis, doktor, freelancer | "Maaşını gir, faturanı çek — AI cüzdanını tutar." |
| **CaptchaERPIDE** | Web SaaS / API | 🌍 Global | Bot/scraper geliştiricisi, QA automation, RPA ekibi | "18+ captcha tipini tek API'den çöz — 2Captcha alternatifi, %20 daha hızlı." |
| **LingoApp** | Mobil | 🌍 Global (büyük hedef) | Çift-dilli ilişki, iş seyahati, uluslararası satış, turistik bölgeler | "Sen kendi dilinde yaz, o kendi dilinde okusun. WhatsApp gibi tanıdık." |
| **AI Asistan Kontörü** | Add-on | 🌍 Global | FinansERPIDE kullanıcısı | "AI limitin bitince devam et — kontör paketi al." |
| **1C:ERP** | Kurumsal | 🌍 Global | Orta-büyük üretici (TR + KZ) | "Türkiye'de 1C:ERP distribütörü = ERPIDE." |
| **1C:Drive** | Kurumsal | 🌍 Global | KOBİ üretim/dağıtım | "1C:Drive'ı 6-12 ay yerine 3 ayda canlıya alalım." |
| **CANIAS** | Kurumsal | 🌍 Global | TR endüstriyel firma | "TROIA özelleştirme + BPM iş akışı uzmanı." |

**Marka mesajı (umbrella):** _"ERPIDE — KOBİ'den global SaaS'e, tüm operasyonel yazılım ihtiyacın tek çatı altında."_

---

## 2. Hedef Pazar Segmentasyonu

### 2.1 Türkiye-lokal ürünler (FinansERPIDE + PocketERPIDE)

- **Coğrafya:** TR (anadil), TR'de yaşayan KZ/RU göçmenleri için sekonder
- **Dil:** Birincil **TR**, sekonder EN (yatırımcı/ortak içerik için)
- **Kanal:** Google Türkiye SEO, Türkçe YouTube, LinkedIn TR, Facebook Pages TR, Instagram, Reddit r/turkey
- **Bütçe önceliği:** SEO + içerik (uzun vade) > Google Ads (kısa vade kampanya) > influencer (mali müşavir + iş danışmanı)

### 2.2 Global ürünler (CaptchaERPIDE + LingoApp + AI Kontör + 1C/CANIAS)

- **Coğrafya:** EN-konuşan ülkeler (US, UK, IN, PH, BR), RU, ES; LingoApp için **tüm dünya**
- **Dil:** Birincil **EN**, sekonder RU, ES, PT; LingoApp için 60+ dil paketinin marketing'e yansıtılması
- **Kanal:**
  - CaptchaERPIDE: dev community kanalları (Reddit r/webscraping, r/learnpython, Hacker News Show HN, Indie Hackers, BlackHatWorld dev forumu, Discord automation communities)
  - LingoApp: Product Hunt launch, TikTok (çift-dilli ilişki içeriği viral potansiyeli yüksek), Instagram Reels, YouTube Shorts, dating app communities, expat forumlar
  - 1C/CANIAS: LinkedIn ABM (Account-Based Marketing) — direkt CFO/üretim müdürüne outreach

---

## 3. SEO Stratejisi

### 3.1 Teknik SEO (hızlı kazanım)

- **hreflang etiketleri:** `/` (TR default), `/en`, `/ru`, `/kk` — şu an i18n locale cookie/localStorage'la çalışıyor; **Google hreflang için path-based URL gerek**. Bu büyük bir teknik iş — Next.js i18n routing (`/en/urunler`, `/ru/products` vs.)
- **Sitemap.xml:** Tüm ürün sayfaları + 4 dil varyantı = `urunler` (TR) + `products` (EN) + `produkty` (RU) + `onimder` (KK)
- **robots.txt:** /admin, /api, /panel'i blokla
- **Structured data (JSON-LD):**
  - `Organization` schema (kök)
  - `SoftwareApplication` schema her ürün için (price, currency, aggregateRating)
  - `BreadcrumbList`
  - `FAQPage` (her ürün detayında — büyük SEO kazancı)
- **Core Web Vitals:** Lighthouse skoru tüm ürün sayfaları için 90+ hedef
- **Open Graph + Twitter Card:** her ürün için özel görsel (1200x630)

### 3.2 Anahtar Kelime Stratejisi

#### FinansERPIDE (TR)
- **Primary:** "ai destekli muhasebe yazılımı", "kobi erp programı", "e-fatura programı küçük şirket"
- **Long-tail:** "kobi için AI muhasebe yazılımı", "anonim şirket muhasebe takip programı"
- **Rakip kıyaslama içerikleri:** "Logo Tiger vs FinansERPIDE", "Mikro vs FinansERPIDE", "Netsis alternatifi"

#### PocketERPIDE (TR)
- **Primary:** "kişisel bütçe uygulaması", "fatura takip uygulaması", "harcama takip telefon"
- **Long-tail:** "ai ile fatura tarama", "maaş geliri otomatik takip", "memur bütçe takibi"
- **İçerik:** "Türkiye'de en iyi 5 kişisel finans uygulaması" (kendi uygulamamızı 1. sıraya koy)

#### CaptchaERPIDE (EN — global)
- **Primary:** "captcha solver api", "recaptcha v3 solver", "hcaptcha bypass api", "2captcha alternative"
- **Long-tail:** "fastest captcha solving service", "captcha api with python sdk", "cloudflare turnstile solver"
- **İçerik:** "2Captcha vs Anti-Captcha vs CaptchaERPIDE — 2026 benchmark"
- **Backlink hedefleri:** GitHub awesome lists (`awesome-scraping`), Scrapy docs PR, Playwright community

#### LingoApp (Global)
- **Primary EN:** "translation messenger app", "bilingual chat app", "real-time translation chat"
- **TR:** "çeviri uygulaması", "yabancıyla konuşma uygulaması", "anlık çeviri whatsapp"
- **RU:** "приложение для перевода чата", "общение на разных языках"
- **ES:** "app de chat con traducción automática", "hablar otro idioma chat"
- **İçerik:** "Long distance relationship apps", "Tools for international remote teams", "App for traveling abroad"

#### 1C / CANIAS (EN/RU — kurumsal)
- **Primary:** "1c erp turkey partner", "1c drive implementation", "canias erp consulting"
- **Strategy:** LinkedIn organik + ABM outreach > organik SEO (kurumsal alıcı LinkedIn'de)

### 3.3 İçerik Takvimi (3 ay)

| Ay | İçerik Türü | Adet | Kanal | Ürün |
|---|---|---|---|---|
| Ay 1 | Blog yazısı (uzun-form, 2000+ kelime) | 8 | erpide.com/blog (TR+EN) | 2x FinansERPIDE, 2x CaptchaERPIDE, 2x LingoApp, 1x PocketERPIDE, 1x kurumsal |
| Ay 1 | YouTube tutorial | 4 | YouTube ERPIDE channel | Her büyük ürün için "5dk tanıtım" |
| Ay 1 | LinkedIn post serisi | 12 | LinkedIn ERPIDE company page | "Bugün nasıl bir SaaS kurduk" formatında builder log |
| Ay 2 | Karşılaştırma sayfası | 6 | erpide.com/karsilastir/* | "FinansERPIDE vs Logo", "Captcha vs 2Captcha" vs |
| Ay 2 | Case study | 3 | erpide.com/musteri-hikayeleri | İlk kurumsal müşterilerle (ERPIDE A.Ş. kendisi öncü) |
| Ay 2 | TikTok / Reels viral seti | 30 | TikTok @lingoapp | LingoApp için "çift dilli ilişki" konseptli kısa videolar |
| Ay 3 | Webinar | 2 | YouTube Live | "AI ile şirket yönetimi" (FinansERPIDE) + "Captcha çözümü 101" (CaptchaERPIDE) |
| Ay 3 | E-kitap | 2 | Lead magnet (email gate) | "Türkiye'de KOBİ Dijital Dönüşüm Rehberi" + "Captcha Solving Cookbook" |

---

## 4. Paid Acquisition

### 4.1 Google Ads

- **FinansERPIDE TR:** "muhasebe yazılımı" anahtar kelimesi pahalı (₺15-30 CPC). Long-tail'lere odaklan: "e-fatura programı küçük", "kobi ai muhasebe". Bütçe: $500/ay test.
- **CaptchaERPIDE Global:** "captcha solver" terimi düşük rekabet (~$1-2 CPC). Bütçe: $300/ay.
- **LingoApp:** Google Ads yerine **TikTok Ads + Meta Ads** (görsel viral içerik daha etkili). Bütçe: $500/ay TikTok + $300/ay Meta.

### 4.2 App Store Optimization (ASO) — PocketERPIDE + LingoApp

- **Keyword research:** Sensor Tower / App Annie (ücretsiz tier)
- **Title formula:** `<Ürün Adı> - <Birincil Keyword>` (ör: "PocketERPIDE - Bütçe & Fatura Takip")
- **Subtitle:** ikincil keyword + temel vaat
- **Screenshots:** 6 adet, her biri bir özelliği vurgular, üzerinde 1 satır metin
- **Localization:** EN/TR/RU/KK metadata zorunlu, **DE/FR/ES/PT** opsiyonel ama LingoApp için zorunlu (global hedef)
- **Lansman:** "soft launch" — küçük bir ülkede ASO test et, sonra global

### 4.3 Influencer / Partnerships

- **TR:**
  - Mali müşavir YouTube/LinkedIn micro-influencers (5K-50K takipçi) — FinansERPIDE affiliate (%20 komisyon)
  - Kişisel finans Instagram hesapları (Para Durumu, Bütçe Koçu vs.) — PocketERPIDE
- **Global:**
  - Dev YouTuber'lar (Web scraping tutorial yapanlar — John Watson Rooney, ScrapingDog blog) — CaptchaERPIDE sponsorluğu
  - LingoApp için: dating app reviewer'lar, expat YouTuber'lar, dil öğrenme TikTokçuları

---

## 5. Topluluk & Brand Building

- **ERPIDE Blog:** Haftada 2 yazı (1 TR + 1 EN). Konular: dev guides, müşteri hikayeleri, ürün updates, sektör analizi
- **GitHub Organization:** ERPIDE açık kaynak küçük araçlar yayınla (örn. captcha test framework, e-fatura UBL parser open-source) — backlink + dev güveni
- **Discord/Slack:** CaptchaERPIDE için "Captcha Developers" Discord — community-driven destek + ürün geri bildirimi
- **Newsletter:** Aylık ERPIDE Insider — ürün updates, sektör haberleri (TR+EN), ~ConvertKit/Mailchimp free tier başlangıçta
- **Public roadmap:** roadmap.erpide.com (veya Linear/Productboard public view) — şeffaflık = güven

---

## 6. Konversiyon & Ürün-içi Pazarlama

- **Free trial mantığı:** FinansERPIDE + CaptchaERPIDE 3 gün ücretsiz (mevcut) — trial→paid dönüşüm hedef %15
- **Onboarding email serisi:** 7 günlük drip campaign, her ürün için ayrı:
  1. Hoş geldin + ilk değer (örn. "İlk faturanı 30sn'de işle")
  2. Bir özellik tanıtımı
  3. Müşteri başarı hikayesi
  4. Pro plana yükseltme önerisi
  5. Ücretsiz danışmanlık çağrısı (kurumsal lead için)
- **Referral program:** 1 arkadaşını davet et, ikiniz de 1 ay free — Q3'te lansman

---

## 7. Analitik & Ölçüm

- **Google Analytics 4** (mevcut) — funnel tracking, conversion events
- **Mixpanel veya PostHog** (free tier) — ürün-içi event tracking
- **Search Console** — SEO keyword tracking + sayfa performansı
- **Hotjar** (ücretsiz tier) — heatmap, scroll depth (özellikle ürün sayfaları)
- **Plausible / Fathom** (Vercel'in kendi Web Analytics'i — mevcut?) — KVKK/GDPR uyumlu lightweight tracking
- **KPI dashboard:** Notion veya Linear'de aylık raporlama; CAC (customer acquisition cost), LTV, churn, MRR, organik trafik, paid trafik

---

## 8. Aksiyon Kuyruğu (sıralı, kademeli)

### Sprint 1 (1-2 hafta) — Hızlı kazanımlar
- [x] Ürün katalogunu kategorize et (web/mobile/desktop/ai) ✅
- [x] Ürün açıklamalarını 4 dile çevir (EN/RU/KK) ✅
- [x] TR/GLOBAL pazar kapsamı rozeti ✅
- [ ] **Path-based i18n routing** (`/en/products`, `/ru/produkty` vs.) — Next.js i18n config
- [ ] Sitemap.xml + robots.txt
- [ ] JSON-LD structured data (Organization + SoftwareApplication)
- [ ] Open Graph görselleri (her ürün için 1200x630)

### Sprint 2 (2-4 hafta) — İçerik üretimi
- [ ] Blog kurulumu (`/blog`) — Next.js MDX
- [ ] İlk 4 blog yazısı (her ana ürün için 1)
- [ ] YouTube channel açılışı + ilk tutorial video
- [ ] LinkedIn company page'i aktive et (paylaşım takvimi)
- [ ] ConvertKit/Mailchimp newsletter setup

### Sprint 3 (1-2 ay) — Acquisition deneyleri
- [ ] Google Ads kampanyası (CaptchaERPIDE — düşük rekabet, hızlı veri)
- [ ] TikTok Ads test (LingoApp — viral içerik üretimi)
- [ ] Mali müşavir affiliate program (FinansERPIDE)
- [ ] Product Hunt lansmanı (LingoApp + CaptchaERPIDE ayrı ayrı)

### Sprint 4 (2-3 ay) — ASO + Mobil
- [ ] PocketERPIDE App Store Connect kayıt + asset üretimi (Apple Dev hesap onayı sonrası)
- [ ] LingoApp Apple TestFlight beta review onayı → public launch
- [ ] Mobil için 4 dilde ASO metadata
- [ ] Soft launch (TR) → global rollout

### Sprint 5 (3+ ay) — Kurumsal & Enterprise
- [ ] LinkedIn ABM kampanyası (1C/CANIAS — 50 kurumsal hedef)
- [ ] Webinar serisi (her ay 1)
- [ ] İlk case study (ERPIDE A.Ş.'nin kendisi, müşteri olarak)
- [ ] Conference sponsorluğu (KOBİ Sanayi Buluşması, Software İstanbul, RIW Moskova)

---

## 9. Yıllık Hedefler (2026 sonu)

| Metrik | Hedef | Şu an |
|---|---|---|
| Organik aylık trafik (erpide.com) | 50K | ~? |
| FinansERPIDE aylık aktif kullanıcı | 1000 | trial bazlı |
| CaptchaERPIDE aylık API call | 10M | <1M (test fazı) |
| PocketERPIDE mobile downloads | 50K | mağazada değil |
| LingoApp downloads | 100K | TestFlight beta |
| Aylık MRR | $25K | <$1K |
| NPS | 50+ | henüz ölçülmedi |

---

## 10. Bütçe Önerisi (Aylık)

| Kalem | Bütçe | Notu |
|---|---|---|
| Google Ads (FinansERPIDE TR) | $500 | Long-tail focus |
| Google Ads (CaptchaERPIDE Global) | $300 | Düşük CPC, hızlı veri |
| TikTok Ads (LingoApp) | $500 | Viral içerik test |
| Meta Ads (LingoApp + PocketERPIDE) | $300 | Retargeting |
| İçerik üretimi (freelance yazar) | $400 | 2 blog/hafta |
| Video üretim (Loom/CapCut + freelance editor) | $200 | YouTube + Reels |
| Influencer partnership (TR mali müşavir) | $300 | Aylık 2 mikro |
| Email marketing (ConvertKit) | $30 | <5K subscriber free |
| Analytics tools (Plausible/Hotjar) | $50 | Free tier başta yeterli |
| **TOPLAM** | **~$2580** | Lansman bütçesi |

**Not:** İlk 3 ay yatırım fazı (CAC > LTV normal). 6. ayda payback olmazsa kanal/mesaj değiştir.

---

## 11. Risk & Kıt Kaynak Yönetimi

- **Tek kurucu darboğazı:** Tüm bu çalışma 1 kişiyle yapılamaz. Önerilen sıra: önce SEO + içerik (kalıcı), sonra paid (deneysel), en son influencer (pahalı).
- **Çeviri kalitesi:** RU/KK çevirileri ilk fazda Claude/DeepL ile, sonra native speaker review (Fiverr ~$10/sayfa).
- **Telif/Hukuk:** LingoApp'in viral içeriği telif sorunu yaratabilir (popüler şarkı, klip kullanımı) — orijinal müzik / Creative Commons önceliği.
- **Bot/abuse:** CaptchaERPIDE'in "gri alan" pazarlanması Google Ads ban riski — pazarlama mesajını "QA automation" + "accessibility testing" çerçevesinde tut.

---

## 12. İlgili Memory Notları & Linkler

- `[[reference_panel_product_catalog]]` — 8 ürün + kategoriler
- `[[project_erpide_vision]]` — kurucu vizyonu
- `[[reference_erpide_company_info]]` — ERPIDE A.Ş. yasal bilgiler
- `[[project_lingochat]]` — LingoApp ürün detay + roadmap
- `[[project_finanserpide_saas]]` — FinansERPIDE SaaS
- `[[project_captcha_extension]]` — CaptchaERPIDE Chrome uzantısı

---

_Bu plan canlı dokümandır. Her sprint sonu güncelle. Veri olmadan stratejide direnme — A/B testleri ve metric'lere göre değiştir._
