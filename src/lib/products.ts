import { Shield, Briefcase, Boxes, Truck, Sparkles, Wallet, Database, MessageCircle, type LucideIcon } from "lucide-react";
import type { Locale } from "./translations";

/**
 * Ürünün pazar kapsamı — UI'da rozet olarak gösterilir.
 *
 *   "TR"     → Türkiye vergi sistemine ve mevzuatına özel
 *              (KDV, e-Fatura, MUHSGK, brüt-net hesabı, vs.)
 *              Şu an: FinansERPIDE, PocketERPIDE
 *   "GLOBAL" → Dünya çapında kullanılır, lokalizasyon-bağımsız.
 *              Şu an: CaptchaERPIDE, LingoApp, AI Kontör,
 *                     1C:ERP, 1C:Drive, CANIAS
 */
export type MarketScope = "TR" | "GLOBAL";

export type ProductId =
  | "finanserpide"
  | "captchaerpide"
  | "ai-kontor"
  | "pocketerpide"
  | "lingoapp"
  | "1c-erp"
  | "1c-drive"
  | "canias";
export type BillingCycle = "monthly" | "yearly";
export type Currency = "TRY" | "USD";

/**
 * Urun kategorisi — site genelinde (urunler sayfasi, navbar dropdown, footer)
 * tutarli gruplandirma icin. Tek kaynak burasi; degisiklik yaparsan
 * `CATEGORIES` sabit listesini de guncelle.
 *
 *   "web"                  → Tarayicidan erisilen SaaS (FinansERPIDE, CaptchaERPIDE)
 *   "mobile"               → Mobil mağaza uygulamalari (PocketERPIDE, LingoApp)
 *   "desktop-enterprise"   → Distributoru oldugumuz kurumsal cozumler
 *                            (1C:Drive, 1C:ERP, CANIAS — bayilik, proje bazli kurulum)
 *   "ai-credits"           → Diger urunlerin AI'sini besleyen kontor paketleri
 */
export type ProductCategory = "web" | "mobile" | "desktop-enterprise" | "ai-credits";

export const CATEGORIES: {
  id: ProductCategory;
  /** Locale → ekranda gösterilecek başlık */
  label: Record<Locale, string>;
  /** Locale → kategori başlığının altındaki kısa açıklama */
  subtitle: Record<Locale, string>;
}[] = [
  {
    id: "web",
    label: {
      tr: "Web Uygulamaları",
      en: "Web Apps",
      ru: "Веб-приложения",
      kk: "Веб-қосымшалар",
    },
    subtitle: {
      tr: "Tarayıcıdan eriş, abonelikle çalışan SaaS ürünlerimiz",
      en: "Browser-based SaaS — subscribe and use instantly",
      ru: "Браузерные SaaS-продукты — подпишись и используй сразу",
      kk: "Браузерден қол жетімді, жазылым моделімен жұмыс істейтін SaaS өнімдеріміз",
    },
  },
  {
    id: "mobile",
    label: {
      tr: "Mobil Uygulamalar",
      en: "Mobile Apps",
      ru: "Мобильные приложения",
      kk: "Мобильді қосымшалар",
    },
    subtitle: {
      tr: "App Store ve Google Play'den indirilen, telefonda kullanılan uygulamalarımız",
      en: "Download from App Store & Google Play",
      ru: "Скачивайте из App Store и Google Play",
      kk: "App Store және Google Play дүкендерінен жүктеңіз",
    },
  },
  {
    id: "ai-credits",
    label: {
      tr: "AI Kontör",
      en: "AI Credits",
      ru: "AI-кредиты",
      kk: "AI несиелері",
    },
    subtitle: {
      tr: "Uygulamalarımızın AI asistanları için ek mesaj paketi",
      en: "Top-up credits for the AI assistants in our apps",
      ru: "Пакеты сообщений для AI-ассистентов в наших приложениях",
      kk: "Қосымшаларымыздағы AI көмекшілеріне арналған хабарлама пакеттері",
    },
  },
  {
    id: "desktop-enterprise",
    label: {
      tr: "Kurumsal ERP (Distribütör)",
      en: "Enterprise ERP (Distributor)",
      ru: "Корпоративные ERP (Дистрибьютор)",
      kk: "Корпоративтік ERP (Дистрибьютор)",
    },
    subtitle: {
      tr: "Distribütörü olduğumuz, proje bazlı kurulan kurumsal çözümler",
      en: "Enterprise platforms we distribute — project-based onboarding",
      ru: "Корпоративные платформы, которые мы распространяем — внедрение проектами",
      kk: "Біз дистрибьюторы болатын, жоба негізінде ендірілетін корпоративтік шешімдер",
    },
  },
];

/**
 * SKU.kind — sepetin "Plan Konfigüratörü" UI'ında SKU'ları nasıl gruplayacağı:
 *   "base"      → Plan'ın temel paketi (1 tane alınır, modüller bunun üstüne)
 *   "module"    → Opsiyonel modül add-on'u ($10 her biri)
 *   "seat"      → Ek kullanıcı koltuğu (quantity ile sepete eklenir)
 *   "credit"    → Tüketilen kontör (AI mesaj kontörü gibi)
 *   "standalone"→ Tek paket ürün (PocketERPIDE, CaptchaERPIDE Starter/Pro/Ent)
 */
export type SKUKind = "base" | "module" | "seat" | "credit" | "standalone";

export interface SKU {
  id: string;
  productId: ProductId;
  name: string;
  description: string;
  /** @deprecated read SKU.prices[currency] instead; kept so legacy callers
   *  still compile until the rollout is complete. */
  price: number;
  /** @deprecated currency is derived from buyer locale now */
  currency: "TRY";
  /** Per-currency pricing. Optional override; when missing for a currency,
   *  callers fall back to `price` (TRY). FinansERPIDE is TR-only so its
   *  SKUs don't set this; CaptchaERPIDE targets global buyers so its SKUs
   *  publish both TRY and USD. */
  prices?: Partial<Record<Currency, number>>;
  cycle: BillingCycle;
  features: string[];
  highlight?: boolean;
  kind?: SKUKind;
  /**
   * Modül SKU'su finanserpide tarafında hangi route prefix'ine erişim verir.
   * Örn. ["/muhasebe"] → muhasebe modülü; ["/uretim"] → üretim.
   * Base SKU her zaman ["/satis","/satinalma","/stok","/finans"] kapsar.
   */
  grantsModules?: string[];
  /** kind="credit" SKU'sunun aldığı kontör/mesaj adedi (örn. 500, 1000, 2000, 10000). */
  creditsGranted?: number;
}

/** Per-locale ürün metni overrides. Eksik alanlar default (üst seviyedeki TR)
 *  değere düşer. en/ru/kk en azından name+tagline+description doldurulmalı —
 *  longDescription opsiyonel, eksikse description gösterilir. */
export interface ProductI18n {
  name?: string;
  tagline?: string;
  description?: string;
  longDescription?: string;
}

export interface Product {
  id: ProductId;
  /** Default (TR) ad. EN/RU/KK için `i18n[locale].name` set edilir. */
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  /** Locale-bazlı çeviri override'ları. Default `name`/`tagline`/`description`/
   *  `longDescription` zaten TR; i18n yalnız diğer dilleri ezer. */
  i18n?: Partial<Record<Locale, ProductI18n>>;
  /** Ürünün pazar kapsamı — UI'da TR/GLOBAL rozeti olarak gösterilir. */
  marketScope: MarketScope;
  icon: LucideIcon;
  color: string;
  domain: string;
  /** Hangi kategoride listelenir (site genelinde). */
  category: ProductCategory;
  comingSoon?: boolean;
  /** When true, no public price tiers — buyer talks to sales (AI call center
   *  + WhatsApp). Skus can stay empty. */
  contactOnly?: boolean;
  /** When true, "3 Gün Ücretsiz Dene" CTA is hidden and the trial start API
   *  rejects with 403. Use for products where free usage would burn real cost
   *  (e.g. AI credit packs hitting Claude API). */
  noTrial?: boolean;
  /** Optional live demo URL. Shown as a "Demoyu İncele" button on the product card. */
  demoUrl?: string;
  /** Optional official product page (external — e.g. 1ci.com). Shown as
   *  "Resmi Üretici Sayfası" button alongside demoUrl. */
  officialUrl?: string;

  // ----- Mobil mağaza alanları (sadece category="mobile") -----
  /** Apple App Store link (canlı satışta veya TestFlight) */
  iosAppStoreUrl?: string;
  /** Google Play Store link */
  androidPlayStoreUrl?: string;
  /** Chrome Web Store (uzantı/eklenti) */
  chromeWebStoreUrl?: string;
  /** TestFlight public link — mağazada henüz değilse */
  testFlightUrl?: string;
  /** Doğrudan APK indirme linki (Play Store dışı dağıtım, geçici) */
  apkDirectUrl?: string;
  /** Mobil uygulamalar için: masaüstünden indirme DEVRE DIŞI (QR kod göster). */
  mobileOnlyDownload?: boolean;

  skus: SKU[];
}

export const PRODUCTS: Product[] = [
  {
    id: "finanserpide",
    name: "FinansERPIDE",
    tagline: "AI Destekli Çok Şirketli ERP SaaS",
    description:
      "Çok şirketli, AI destekli ERP SaaS. e-Fatura, banka mutabakatı, vergi hesabı, cari takibi — hepsi tek panelde. Şirketinizi AI ile sohbet ederek yönetin.",
    longDescription:
      "FinansERPIDE; KOBİ ve A.Ş.'lerin tüm finans/muhasebe süreçlerini AI ile yöneten yeni nesil ERP. Her şirket için izole veritabanı (multi-tenant), QNB eFinans entegrasyonu, otomatik banka mutabakatı, KDV ve geçici vergi tutar hesabı, cari takibi, personel/SGK. Fatura fotoğrafını WhatsApp'tan at, AI okuyup sisteme kaydetsin. \"Bu ay zarar mı kar mı?\" diye sor, anında raporla cevaplasın.",
    icon: Briefcase,
    color: "from-orange-500 to-pink-600",
    domain: "finans.erpide.com",
    category: "web",
    marketScope: "TR",
    i18n: {
      en: {
        name: "FinansERPIDE",
        tagline: "AI-Powered Multi-Company ERP SaaS (Türkiye-localized)",
        description: "Multi-company AI-powered ERP for Turkish businesses. e-Invoice, bank reconciliation, VAT/tax calculation, AR/AP — all in one panel. Operate your company by chatting with AI. Built for Turkish tax law (VAT, MUHSGK, e-İrsaliye, brüt-net payroll).",
      },
      ru: {
        name: "FinansERPIDE",
        tagline: "ERP SaaS с AI для нескольких компаний (локализован для Турции)",
        description: "Многокомпанийный ERP с AI для турецкого бизнеса. Электронные счета-фактуры, банковская сверка, расчёт НДС и налогов, учёт контрагентов — всё в одной панели. Соответствует турецкому налоговому законодательству.",
      },
      kk: {
        name: "FinansERPIDE",
        tagline: "AI-көмекшісі бар көпкомпаниялы ERP SaaS (Түркия үшін локализацияланған)",
        description: "Түрік бизнесіне арналған, AI көмекшісі бар көпкомпаниялы ERP. e-Фактура, банк салыстырмасы, ҚҚС/салық есептеу, контрагенттер — барлығы бір панельде. Түрік салық заңнамасына сәйкес.",
      },
    },
    comingSoon: true,
    skus: [
      {
        id: "finanserpide-base-monthly",
        productId: "finanserpide",
        name: "Temel Paket",
        description: "Satış · Satınalma · Stok · Finans (her zaman dahil)",
        price: 20,
        currency: "TRY",
        prices: { USD: 20 },
        cycle: "monthly",
        kind: "base",
        grantsModules: ["/satis", "/satinalma", "/stok", "/finans", "/cari", "/faturalar", "/dashboard"],
        features: [
          "Satış (teklif, sipariş, irsaliye, fatura)",
          "Satınalma (talep, sipariş, irsaliye, fatura)",
          "Stok yönetimi (ürün, depo, hareket)",
          "Finans (banka, e-Süreçler, raporlar)",
          "1 şirket (VKN bazlı izole DB)",
          "1 owner kullanıcı",
          "Sınırsız fatura",
          "e-Fatura / e-Arşiv (QNB eFinans)",
        ],
        highlight: true,
      },
      {
        id: "finanserpide-module-muhasebe-monthly",
        productId: "finanserpide",
        name: "Muhasebe Modülü",
        description: "Yevmiye, mizan, hesap planı, KDV, defter-i kebir",
        price: 10,
        currency: "TRY",
        prices: { USD: 10 },
        cycle: "monthly",
        kind: "module",
        grantsModules: ["/muhasebe"],
        features: [
          "Hesap planı (TR muhasebe)",
          "Otomatik yevmiye girişi",
          "Mizan + defter-i kebir",
          "KDV / Stopaj hesabı",
          "Muhasebe raporları (bilanço, gelir tablosu)",
        ],
      },
      {
        id: "finanserpide-module-ik-monthly",
        productId: "finanserpide",
        name: "İnsan Kaynakları Modülü",
        description: "Personel, devam takip, bordro, izin",
        price: 10,
        currency: "TRY",
        prices: { USD: 10 },
        cycle: "monthly",
        kind: "module",
        grantsModules: ["/ik"],
        features: [
          "Personel kartoteks (SGK, banka, sözleşme)",
          "Devam takip (PDKS entegrasyonu)",
          "Bordro hesabı + e-Bordro",
          "İzin yönetimi + onay akışı",
          "MUHSGK XML üretim",
        ],
      },
      {
        id: "finanserpide-module-uretim-monthly",
        productId: "finanserpide",
        name: "Üretim Modülü",
        description: "BOM (reçete), üretim emri, maliyetlendirme",
        price: 10,
        currency: "TRY",
        prices: { USD: 10 },
        cycle: "monthly",
        kind: "module",
        grantsModules: ["/uretim"],
        features: [
          "Çoklu seviye reçete (BOM)",
          "Üretim emirleri",
          "Standart vs gerçek maliyet",
          "İşçilik + GÜG hesabı",
          "Sipariş bazlı kar marjı",
        ],
      },
      {
        id: "finanserpide-module-sabitkiymet-monthly",
        productId: "finanserpide",
        name: "Sabit Kıymet Modülü",
        description: "Demirbaş, duran varlıklar, otomatik amortisman",
        price: 10,
        currency: "TRY",
        prices: { USD: 10 },
        cycle: "monthly",
        kind: "module",
        grantsModules: ["/sabitkiymet"],
        features: [
          "Demirbaş kartoteks (alış tarihi, oran, yöntem)",
          "Aylık otomatik amortisman hesaplama",
          "Toplu yevmiye: 770 Gen. Yön. Gid. / 257 Birikmiş Amort.",
          "Birikmiş + net defter değeri raporu",
          "Bekleyen amortisman alarmı (dashboard)",
        ],
      },
      {
        id: "finanserpide-extra-user-monthly",
        productId: "finanserpide",
        name: "Ek Kullanıcı",
        description: "Sisteme +1 ek kullanıcı koltuğu (istediğin kadar al)",
        price: 10,
        currency: "TRY",
        prices: { USD: 10 },
        cycle: "monthly",
        kind: "seat",
        features: [
          "+1 kullanıcı koltuğu",
          "Rol ve yetki ataması",
          "Owner panelinden anında eklenip çıkarılabilir",
        ],
      },
    ],
  },
  {
    id: "captchaerpide",
    name: "CaptchaERPIDE",
    tagline: "18 Captcha Tipini Tek API'den Çöz",
    description:
      "reCAPTCHA v2/v3/Enterprise, hCaptcha, Cloudflare Turnstile, AWS WAF, FunCaptcha, DataDome, GeeTest, slider/puzzle/text — hepsi tek REST API. 28ms ortalama, %90+ doğruluk, BYOK desteği.",
    longDescription:
      "CaptchaERPIDE; bot geliştiricilerin karşılaştığı 18 farklı captcha tipini tek bir REST API'den çözer. Native AI solver'lar (slider, icon, puzzle, text, math, GeeTest) + agregatör entegrasyonları (CapMonster + 2Captcha) ile reCAPTCHA v2/v3/Enterprise, hCaptcha, Cloudflare Turnstile, AWS WAF, FunCaptcha/Arkose, DataDome dahil pazardaki tüm yaygın captcha çeşitlerini destekler. 28ms ortalama çözüm süresi, %90+ doğruluk oranı, BYOK (Bring-Your-Own-Key) desteği, gerçek zamanlı kullanım dashboard'u, webhook bildirimleri, multi-tenant lisans yönetimi.",
    icon: Shield,
    color: "from-green-600 to-teal-600",
    domain: "captcha.erpide.com",
    category: "web",
    marketScope: "GLOBAL",
    i18n: {
      en: {
        name: "CaptchaERPIDE",
        tagline: "Solve 18+ Captcha Types Through a Single API",
        description: "reCAPTCHA v2/v3/Enterprise, hCaptcha, Cloudflare Turnstile, AWS WAF, FunCaptcha, DataDome, GeeTest, slider/puzzle/text — all through one REST API. 28ms avg, 90%+ accuracy, BYOK supported.",
      },
      ru: {
        name: "CaptchaERPIDE",
        tagline: "Решайте 18+ типов капчи через один API",
        description: "reCAPTCHA v2/v3/Enterprise, hCaptcha, Cloudflare Turnstile, AWS WAF, FunCaptcha, DataDome, GeeTest, slider/puzzle/text — все через единый REST API. 28мс в среднем, 90%+ точность, поддержка BYOK.",
      },
      kk: {
        name: "CaptchaERPIDE",
        tagline: "18+ капча түрін бір API арқылы шешіңіз",
        description: "reCAPTCHA v2/v3/Enterprise, hCaptcha, Cloudflare Turnstile, AWS WAF, FunCaptcha, DataDome, GeeTest, слайдер/пазл/мәтін — барлығы бір REST API арқылы. Орташа 28мс, 90%+ дәлдік, BYOK қолдауы.",
      },
    },
    skus: [
      {
        id: "captchaerpide-starter-monthly",
        productId: "captchaerpide",
        name: "Starter",
        description: "Bot geliştiriciler için",
        price: 9.99,
        currency: "TRY",
        prices: { USD: 9.99 },
        cycle: "monthly",
        features: [
          "Günde 1.000 çözüm",
          "18 captcha tipi — image + token tabanlı",
          "Native solver'lar (slider/puzzle/text/icon)",
          "BYOK desteği — kendi 2Captcha/CapMonster key'in",
          "REST API + 30ms ortalama süre",
          "Gerçek zamanlı dashboard + e-mail destek",
        ],
      },
      {
        id: "captchaerpide-pro-monthly",
        productId: "captchaerpide",
        name: "Pro",
        description: "Profesyonel kullanım",
        price: 29.99,
        currency: "TRY",
        prices: { USD: 29.99 },
        cycle: "monthly",
        features: [
          "Günde 10.000 çözüm",
          "Tüm 18 captcha tipi (reCAPTCHA v2/v3/Enterprise, hCaptcha, Turnstile, AWS WAF, FunCaptcha, DataDome, GeeTest…)",
          "Öncelikli işleme (15ms)",
          "Webhook bildirimleri + retry kuyruğu",
          "Multi-tenant lisans yönetimi",
          "Öncelikli destek",
        ],
        highlight: true,
      },
      {
        id: "captchaerpide-enterprise-monthly",
        productId: "captchaerpide",
        name: "Enterprise",
        description: "Yüksek hacim + SLA",
        price: 89.99,
        currency: "TRY",
        prices: { USD: 89.99 },
        cycle: "monthly",
        features: [
          "Sınırsız çözüm",
          "Tüm tipler + custom captcha tanımı",
          "Dedicated worker pool + 10ms hedef süre",
          "%99.5 uptime SLA garantisi",
          "Public accuracy + p95 latency dashboard",
          "Telefon destek + onboarding",
        ],
      },
    ],
  },
  {
    id: "ai-kontor",
    name: "AI Asistan Kontörü",
    tagline: "FinansERPIDE AI Asistanına Ek Mesaj Kontörü",
    description:
      "FinansERPIDE planında kalan AI mesaj limitinizi aştığınızda kontör paketi alarak kesintisiz devam edin. Tek seferlik satın alma — paket bitmeden tekrar dolmaz, yenisini alabilirsiniz.",
    longDescription:
      "FinansERPIDE'nin yerleşik AI asistanı (Claude tabanlı) plan limitiniz dolduğunda 429 döner. Bu pakete yatırım yaparak fatura okuma, hesaplama, raporlama, veri girişi gibi AI işlemlerine kesintisiz devam edebilirsiniz. Kontörler hesabınıza anında işlenir, sadece tüketildikçe düşer; aylık plan limitinizin üstüne eklenir, bir sonraki aya devreder.",
    icon: Sparkles,
    color: "from-amber-500 to-orange-600",
    domain: "finans.erpide.com",
    category: "ai-credits",
    marketScope: "GLOBAL",
    i18n: {
      en: {
        name: "AI Assistant Credits",
        tagline: "Top-up message pack for FinansERPIDE's AI assistant",
        description: "When your plan's AI message quota runs out, buy a credit pack to keep going. One-time purchase — credits roll over month-to-month until consumed.",
      },
      ru: {
        name: "AI-кредиты ассистента",
        tagline: "Дополнительный пакет сообщений для AI-ассистента FinansERPIDE",
        description: "Когда ваш месячный лимит AI-сообщений заканчивается, купите пакет кредитов и продолжайте без перебоев. Разовая покупка — кредиты переходят на следующий месяц.",
      },
      kk: {
        name: "AI көмекшісі несиелері",
        tagline: "FinansERPIDE AI көмекшісіне арналған қосымша хабарлама пакеті",
        description: "Жоспардағы AI хабарлама лимиті бітсе, несие пакетін сатып алыңыз. Бір реттік сатып алу — несиелер келесі айға ауысады.",
      },
    },
    // Her AI mesaji Claude API'de gercek dolar yakar; ucretsiz deneme verirsek
    // 3 gunde binlerce mesaj atilip bizi zarara sokabilirler. Sadece aktif
    // FinansERPIDE plani olan musteriler sepete ekleyebilir (aiKontorBlocked).
    noTrial: true,
    skus: [
      {
        id: "ai-kontor-500",
        productId: "ai-kontor",
        name: "500 Kontör",
        description: "Küçük takviye — kısa süreli yoğun kullanım",
        price: 5,
        currency: "TRY",
        prices: { USD: 5 },
        cycle: "monthly",
        kind: "credit",
        creditsGranted: 500,
        features: [
          "500 AI mesaj kontörü",
          "Firma havuzuna anında tanımlanır",
          "Plan limitinden ayrıdır — devreder",
          "Mesaj başı $0.010",
        ],
      },
      {
        id: "ai-kontor-1000",
        productId: "ai-kontor",
        name: "1.000 Kontör",
        description: "Standart kullanım için",
        price: 10,
        currency: "TRY",
        prices: { USD: 10 },
        cycle: "monthly",
        kind: "credit",
        creditsGranted: 1000,
        features: [
          "1.000 AI mesaj kontörü",
          "Mesaj başı $0.010 (aynı oran)",
          "Firma havuzuna anında tanımlanır",
          "Plan limitinden ayrıdır — devreder",
        ],
      },
      {
        id: "ai-kontor-2000",
        productId: "ai-kontor",
        name: "2.000 Kontör",
        description: "Aylık yedek — orta yoğunluk",
        price: 20,
        currency: "TRY",
        prices: { USD: 20 },
        cycle: "monthly",
        kind: "credit",
        creditsGranted: 2000,
        features: [
          "2.000 AI mesaj kontörü",
          "Mesaj başı $0.010",
          "Toplu fatura işleme için ideal",
          "Plan limitinden ayrıdır — devreder",
        ],
        highlight: true,
      },
      {
        id: "ai-kontor-10000",
        productId: "ai-kontor",
        name: "10.000 Kontör",
        description: "Yoğun kullanım — büyük takım",
        price: 80,
        currency: "TRY",
        prices: { USD: 80 },
        cycle: "monthly",
        kind: "credit",
        creditsGranted: 10000,
        features: [
          "10.000 AI mesaj kontörü",
          "%20 indirimli paket (mesaj başı $0.008)",
          "Toplu işleme için en uygun",
          "Plan limitinden ayrıdır — devreder",
        ],
      },
    ],
  },
  {
    id: "pocketerpide",
    name: "PocketERPIDE",
    tagline: "Bireysel Kullanıcı için AI Destekli Cüzdan & Bütçe",
    description:
      "Maaşını gir, faturalarını AI'a söyle, otomatik kaydedilsin. Memur, mühendis, doktor — gelir/gider takip eden herkes için tasarlandı. ERP karmaşıklığı yok, sade cüzdan deneyimi.",
    longDescription:
      "PocketERPIDE; bireysel kullanıcılar için yapılmış, AI asistanlı kişisel finans takip uygulamasıdır. Maaşını (brüt veya net) bir kez tanımla, sistem her ay otomatik gelir olarak kaydetsin. Fatura geldikçe AI'a fotoğraf at veya yazılı olarak söyle — kategorize edilip cüzdanına işlensin. Aylık özet, kategori bazlı harcama analizi, hedef bütçe takibi, vergi iadesi hesaplama. Şirket muhasebesi karmaşıklığı yok; herkesin kullanabildiği sade bir kişisel bütçe uygulaması.",
    icon: Wallet,
    color: "from-pink-500 to-rose-600",
    domain: "pocket.erpide.com",
    category: "mobile",
    marketScope: "TR",
    i18n: {
      en: {
        name: "PocketERPIDE",
        tagline: "AI-Powered Personal Wallet & Budget (Türkiye-localized)",
        description: "Define your salary, snap a photo of your bills — AI categorizes and saves them. For employees, engineers, doctors — anyone tracking personal income/expenses. No ERP complexity, just a clean wallet. Built for Turkish tax brackets (brüt-net) and TR-specific expense categories.",
      },
      ru: {
        name: "PocketERPIDE",
        tagline: "Личный кошелёк и бюджет с AI (локализован для Турции)",
        description: "Введите зарплату, сфотографируйте счета — AI распознает и сохранит. Для сотрудников, инженеров, врачей — всех, кто ведёт личные доходы/расходы. Без сложности ERP. Соответствует турецким налоговым ставкам.",
      },
      kk: {
        name: "PocketERPIDE",
        tagline: "AI-көмекшісі бар жеке әмиян мен бюджет (Түркия үшін локализацияланған)",
        description: "Жалақыңызды енгізіңіз, шот-фактураның фотосын түсіріңіз — AI оларды санаттарға бөліп сақтайды. Қызметкерлерге, инженерлерге, дәрігерлерге — жеке кірісі/шығысын бақылайтын барлық адамға.",
      },
    },
    comingSoon: true,
    // PocketERPIDE sadece mobil mağaza üzerinden satılır — fiyatlandırma
    // App Store / Google Play in-app purchase ile yapılır. Site sepetinden
    // alınmaz, panelden lisans verilmez. SKU listesi BİLEREK boş; bu sayede
    // /urunler/[productId] sayfası MobileAppStoreCard view'ına düşer.
    // Mağaza linkleri eklendiğinde aşağıya doldurulacak.
    // iosAppStoreUrl: "https://apps.apple.com/app/pocketerpide/idXXXXXXXXXX",
    // androidPlayStoreUrl: "https://play.google.com/store/apps/details?id=com.erpide.pocketerpide",
    mobileOnlyDownload: true,
    skus: [],
  },
  {
    id: "1c-erp",
    name: "1C:ERP",
    tagline: "Üretim İçin Esnek Kurumsal ERP — MRP, Tedarik, Finans",
    description:
      "1C:ERP, kesikli ve sürekli üretim süreçlerini destekleyen, orta ve büyük ölçekli üretim firmaları için yüksek fonksiyonlu kurumsal ERP. ERPIDE olarak Türkiye'de lisanslama, kurulum, yerelleştirme, eğitim ve destek sunarız.",
    longDescription:
      "1C:ERP; binlerce kullanıcılı orta-büyük üretim firmalarında make-to-order, make-to-stock, kesikli ve sürekli tüm üretim stratejilerini destekler. Çekirdek modüller: Planlama (MPS), Üretim, Satınalma, Depo, Tahsilat/Tediye ve Maliyet Hesaplama. KPI dashboard'ları ve veriye dayalı karar için görsel analitik. 1C:Enterprise platformu üstünde tek bir entegre çözüm — birbiriyle 'konuşmayan' ayrı uygulamalar değil. ERPIDE; lisanslama, TR/KZ yerelleştirme, kurulum, eğitim, özelleştirme ve canlı destek paketleri sunar.",
    icon: Boxes,
    color: "from-indigo-600 to-blue-700",
    domain: "1c-erp.erpide.com",
    category: "desktop-enterprise",
    marketScope: "GLOBAL",
    i18n: {
      en: {
        name: "1C:ERP",
        tagline: "Flexible Enterprise ERP for Manufacturing — MRP, Supply, Finance",
        description: "1C:ERP supports both discrete and continuous manufacturing for medium-to-large producers. As ERPIDE we provide licensing, deployment, localization, training and support in Türkiye.",
      },
      ru: {
        name: "1C:ERP",
        tagline: "Гибкая корпоративная ERP для производства — MRP, снабжение, финансы",
        description: "1C:ERP поддерживает дискретное и непрерывное производство для средних и крупных предприятий. ERPIDE — официальный партнёр в Турции: лицензирование, внедрение, локализация, обучение и поддержка.",
      },
      kk: {
        name: "1C:ERP",
        tagline: "Өндіріске арналған икемді корпоративтік ERP — MRP, жабдықтау, қаржы",
        description: "1C:ERP орта және ірі өндіріс компанияларына арналған дискретті және үздіксіз өндіріс типтерін қолдайды. ERPIDE Түркияда лицензиялау, ендіру, локализация, оқыту және қолдау ұсынады.",
      },
    },
    contactOnly: true,
    demoUrl: "https://app902777.1capp.net/ERPWEDemo/en_US/",
    officialUrl: "https://www.1ci.com/applications/1c-erp/",
    skus: [],
  },
  {
    id: "1c-drive",
    name: "1C:Drive",
    tagline: "KOBİ İçin Tam Kapsamlı ERP — Üretim, Stok, CRM, Mobil",
    description:
      "1C:Drive, küçük ve orta ölçekli şirketler için tam kapsamlı bir ERP. MRP destekli üretim, çok seviyeli BOM, gerçek zamanlı sipariş takibi, mobil uygulama. ERPIDE'den kurulum + destek paketleri ile hızlı operasyonel olun.",
    longDescription:
      "1C:Drive; satıştan satınalmaya, üretimden stoğa kadar tüm operasyonu gerçek zamanlı izlemenizi sağlar. Çok seviyeli BOM ile reçete + iş merkezi yüklemesi + tedarik planlama tek ekranda. Sipariş/finans/stok/maliyet raporları esnek ve özelleştirilebilir. Mobil app ile sahada da erişim. 1C:Drive Lite ise tamamen bulut tabanlı, 700.000+ firmanın güvendiği teknolojiyle ön-muhasebe için ideal. Lisans ve kurulum maliyetleri KOBİ bütçesine uygun, şirketinizle birlikte büyür. ERPIDE; demo kurulum, veri taşıma, eğitim ve aylık destek paketleri sunar.",
    icon: Truck,
    color: "from-cyan-600 to-teal-600",
    domain: "1c-drive.erpide.com",
    category: "desktop-enterprise",
    marketScope: "GLOBAL",
    i18n: {
      en: {
        name: "1C:Drive",
        tagline: "Full-Stack ERP for SMBs — Manufacturing, Inventory, CRM, Mobile",
        description: "1C:Drive is a complete ERP for small and mid-sized businesses. MRP-driven production, multi-level BOM, real-time order tracking, mobile app. Get up and running fast with ERPIDE's deployment + support packages.",
      },
      ru: {
        name: "1C:Drive",
        tagline: "Полнофункциональная ERP для МСБ — Производство, Склад, CRM, Мобильное",
        description: "1C:Drive — полная ERP для малого и среднего бизнеса. Производство на основе MRP, многоуровневые спецификации, отслеживание заказов в реальном времени, мобильное приложение. ERPIDE — внедрение и поддержка.",
      },
      kk: {
        name: "1C:Drive",
        tagline: "ШОБ үшін толық қызметті ERP — Өндіріс, Қойма, CRM, Мобильді",
        description: "1C:Drive — шағын және орта бизнеске арналған толық ERP. MRP негізіндегі өндіріс, көп деңгейлі BOM, тапсырыстарды нақты уақытта бақылау, мобильді қосымша. ERPIDE — ендіру және қолдау.",
      },
    },
    contactOnly: true,
    // Önceki demoUrl (app.1c-demo.de) cevap vermiyor — 1ci.com sayfasını yönlendir.
    demoUrl: "https://drive-lite.1ci.com/",
    officialUrl: "https://www.1ci.com/applications/1c-drive/",
    skus: [],
  },
  {
    id: "canias",
    name: "CANIAS ERP",
    tagline: "Türkiye'nin En Köklü Endüstriyel ERP'lerinden Biri",
    description:
      "CANIAS ERP; orta-büyük ölçekli üretim ve dağıtım şirketleri için tüm operasyonel süreçleri (MRP, üretim, satınalma, depo, satış, finans, IK) tek platformda yöneten Türk üretimi kurumsal ERP. ERPIDE; bayilik, danışmanlık, kurulum, özelleştirme ve canlı destek hizmetleri sunar.",
    longDescription:
      "CANIAS; 25+ yıllık Türk ERP markası IAS'in geliştirdiği endüstriyel ERP. Kendi düşük-kod platformu (TROIA) sayesinde yoğun özelleştirme yapan üretim firmalarının ilk tercihi. Ana modüller: Malzeme/Stok, Üretim Planlama (MRP/MRP II), Üretim Yürütme, Satınalma, Satış, Depo, Finans, Maliyet, IK/Bordro, Kalite. Çok şirketli, çok dilli, çok para birimli. Kurulum tipik 6-18 ay proje süresi alır. ERPIDE; lisanslama, gap-analiz, TROIA özelleştirme, BPM iş akışları (örn. satınalma onayı), Logo/diğer sistem entegrasyonu, canlı destek paketleri sunar.",
    icon: Database,
    color: "from-slate-600 to-zinc-700",
    domain: "canias.erpide.com",
    category: "desktop-enterprise",
    marketScope: "GLOBAL",
    i18n: {
      en: {
        name: "CANIAS ERP",
        tagline: "One of Türkiye's Most Established Industrial ERPs",
        description: "CANIAS ERP runs all operational processes (MRP, production, purchasing, warehouse, sales, finance, HR) on one platform for mid-to-large manufacturers and distributors — a Türkiye-made enterprise ERP. ERPIDE provides reselling, consulting, deployment, customization and ongoing support.",
      },
      ru: {
        name: "CANIAS ERP",
        tagline: "Одна из самых известных индустриальных ERP Турции",
        description: "CANIAS ERP объединяет все операционные процессы (MRP, производство, закупки, склад, продажи, финансы, HR) на единой платформе для средних и крупных производителей. ERPIDE — продажи, консалтинг, внедрение, кастомизация и поддержка.",
      },
      kk: {
        name: "CANIAS ERP",
        tagline: "Түркияның ең көрнекті индустриялық ERP-терінің бірі",
        description: "CANIAS ERP барлық операциялық процестерді (MRP, өндіріс, сатып алу, қойма, сату, қаржы, HR) бір платформада басқарады — орта және ірі өндірушілер үшін. ERPIDE сату, кеңес беру, ендіру, бейімдеу және қолдау ұсынады.",
      },
    },
    contactOnly: true,
    officialUrl: "https://www.caniaserp.com/",
    skus: [],
  },
  {
    id: "lingoapp",
    name: "LingoApp",
    tagline: "Çift Dilli Çeviri-Chat — Sen TR Yaz, O RU Görsün",
    description:
      "WhatsApp tarzı sohbet uygulaması, ama her kullanıcı kendi dilinde yazıp kendi dilinde okur. Mesajlar anlık çevrilir. Sesli arama içinde de canlı altyazı. 60+ dil destekli, uçtan uca şifreli, KVKK/GDPR uyumlu.",
    longDescription:
      "LingoApp; iki kişinin her birinin kendi dilinde yazıp kendi dilinde okuduğu, çevirinin tamamen otomatik yapıldığı modern sohbet uygulaması. Sen Türkçe yazarsın, karşıdaki Rusça görür; o Rusça yazar, sen Türkçe görürsün. Telefon numarası veya gizli kod ile sohbet. Mesajlar uçtan uca şifreli (ECDH/Curve25519); sunucu sadece şifreli veriye bakar. Sesli/görüntülü arama içinde de canlı çeviri altyazı çıkar. 60+ dil destekli. Mağazadan indir, App Store/Google Play üzerinden ücreti öde — web/masaüstüne kurulum yok.",
    icon: MessageCircle,
    color: "from-blue-600 to-sky-500",
    domain: "lingoapp.erpide.com",
    category: "mobile",
    marketScope: "GLOBAL",
    i18n: {
      en: {
        name: "LingoApp",
        tagline: "Bilingual Translation Chat — You Write in EN, They See in ZH",
        description: "WhatsApp-style messenger where each user writes in their own language and reads in their own language. Messages translate instantly. Live captions in voice calls too. 60+ languages, end-to-end encrypted, GDPR/KVKK compliant. Built for the whole world.",
      },
      ru: {
        name: "LingoApp",
        tagline: "Двуязычный переводчик-чат — Пишите по-русски, они видят на своём языке",
        description: "WhatsApp-подобный мессенджер: каждый пишет на своём языке и читает на своём языке. Мгновенный перевод. Живые субтитры в голосовых звонках. 60+ языков, сквозное шифрование, соответствие GDPR/KVKK. Создан для всего мира.",
      },
      kk: {
        name: "LingoApp",
        tagline: "Қос тілді аударма-чат — Сіз қазақша жазасыз, олар өз тілінде көреді",
        description: "WhatsApp стиліндегі мессенджер: әр пайдаланушы өз тілінде жазып, өз тілінде оқиды. Хабарламалар лезде аударылады. Дауыстық қоңырауларда тірі субтитрлер. 60+ тіл, ұштан-ұшқа шифрлеу, GDPR/KVKK сәйкестігі. Бүкіл әлемге арналған.",
      },
    },
    comingSoon: true,
    // iOS TestFlight beta review aşamasında (2026-06-13 itibarıyla pending). Onaylanınca
    // public link aktif; o zamana kadar internal-only. Henüz App Store CANLI satışta değil.
    testFlightUrl: "https://testflight.apple.com/join/3S1JyZuU",
    // Android: APK preview build var ama Play Store yayını ERPIDE A.Ş. organizasyon hesabına
    // geçiş sonrasına bırakıldı. Yayınlanınca buraya store link gelir.
    // androidPlayStoreUrl: "https://play.google.com/store/apps/details?id=com.erpide.lingoapp",
    mobileOnlyDownload: true,
    skus: [],
  },
];

/** Locale-aware ürün metin getter. Locale çevirisi yoksa default (TR) döner. */
export function getProductText(
  product: Product,
  locale: Locale,
  field: keyof ProductI18n,
): string {
  const i18n = product.i18n?.[locale];
  const v = i18n?.[field];
  if (v) return v;
  // longDescription locale'de yoksa default longDescription, o da yoksa description
  if (field === "longDescription") return product.longDescription || product.description;
  return product[field] || product.name;
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getSku(id: string): SKU | undefined {
  for (const p of PRODUCTS) {
    const s = p.skus.find((s) => s.id === id);
    if (s) return s;
  }
  return undefined;
}

export function getProductOfSku(skuId: string): Product | undefined {
  return PRODUCTS.find((p) => p.skus.some((s) => s.id === skuId));
}

/** Verilen kategoriye ait urunleri PRODUCTS listesindeki orijinal sirayla doner. */
export function getProductsByCategory(cat: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === cat);
}
