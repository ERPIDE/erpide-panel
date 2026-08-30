import { Shield, Briefcase, Boxes, Truck, Sparkles, Wallet, Database, MessageCircle, TrendingUp, type LucideIcon } from "lucide-react";
import type { Locale } from "./translations";

/**
 * Ürünün pazar kapsamı — UI'da rozet olarak gösterilir.
 *
 *   "TR"     → Türkiye vergi sistemine ve mevzuatına özel
 *              (KDV, e-Fatura, MUHSGK, brüt-net hesabı, vs.)
 *              Şu an: FinansERPIDE, PocketERPIDE
 *   "GLOBAL" → Dünya çapında kullanılır, lokalizasyon-bağımsız.
 *              Şu an: CaptchaERPIDE, WITMA, AI Kontör,
 *                     1C:ERP, 1C:Drive, CANIAS
 */
export type MarketScope = "TR" | "GLOBAL";

export type ProductId =
  | "finanserpide"
  | "captchaerpide"
  | "ai-kontor"
  | "pocketerpide"
  | "witma"
  | "dataengine"
  | "1c-erp"
  | "1c-drive"
  | "canias"
  | "enflasyon-raporu";
export type BillingCycle = "monthly" | "yearly";
export type Currency = "TRY" | "USD";

/**
 * Urun kategorisi — site genelinde (urunler sayfasi, navbar dropdown, footer)
 * tutarli gruplandirma icin. Tek kaynak burasi; degisiklik yaparsan
 * `CATEGORIES` sabit listesini de guncelle.
 *
 *   "web"                  → Tarayicidan erisilen SaaS (FinansERPIDE, CaptchaERPIDE)
 *   "mobile"               → Mobil mağaza uygulamalari (PocketERPIDE, WITMA)
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
  // NOT: "ai-credits" kategorisi public CATEGORIES listesinden 2026-06'da
  // çıkarıldı (iyzico üye işyeri başvurusu — "kredi/jeton/kontör modeli"
  // satılmaması talebi). Kategori tip tanımında durmaya devam ediyor çünkü
  // `ai-kontor` ürünü mevcut müşteriler için backend'de hâlâ aktif; sadece
  // halka açık liste/filtre/navigasyon'dan gizli. Yeniden açılırsa burayı geri
  // ekle + ai-kontor.hiddenFromPublic'i kaldır.
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
export type SKUKind = "base" | "module" | "seat" | "credit" | "standalone" | "ai-plan";

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
  /**
   * kind="ai-plan": aylık AI mesaj hakkı. Kontörden farkı devretmemesi —
   * her ay sıfırlanır. Müşteri "kaç kontörüm kaldı" diye takip etmek yerine
   * paketini seçip kullanıyor.
   */
  aiMessagesPerMonth?: number;
  /** Bundle SKU: tek kod/tek satın alma ile gelen ek kullanıcı koltuğu sayısı. */
  seatsIncluded?: number;
  /**
   * Kullanıcı sayısı sınırsız. FinansERPIDE paketleri 2026-07'den beri böyle:
   * ek kullanıcı bize kayda değer maliyet yazmıyor (maliyet işlem hacminden
   * geliyor), rakipler de sınırsız veriyor. Koltuk satmak müşteriyi kapıda
   * kaybettiriyordu.
   */
  unlimitedSeats?: boolean;
  /**
   * Satışa kapalı eski SKU. Yeni müşteriye gösterilmez ama license-service
   * çözmeye devam eder — mevcut abonelikler aynen çalışır.
   */
  legacy?: boolean;
  /** Locale overrides. Default `name`/`description`/`features` TR; i18n yalnız
   *  diğer dilleri ezer. AI Kontör + CaptchaERPIDE gibi global ürünlerin
   *  SKU'larında dolu, FinansERPIDE/TR-only ürünlerde opsiyonel. */
  i18n?: Partial<Record<Locale, { name?: string; description?: string; features?: string[] }>>;
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
  /** Ürünün orjinal logosu (vendor/marka logosu). Varsa render katmanı
   *  (Services anasayfa, /urunler liste, /urunler/[id] detay, Navbar dropdown)
   *  Lucide ikon yerine bu görseli gösterir. Yoksa fallback `icon` Lucide
   *  bileşeni `color` gradient'ın üstünde çizilir. Beyaz/şeffaf zeminli
   *  logolar dark UI'da yine okunabilir kalsın diye render component'i
   *  arka plana beyaz padding uygular.
   *  Dosyalar: `public/products/<id>/...`. Örn. `/products/canias/logo.jpg`. */
  logoImage?: string;
  /** Logo'nun arka plan davranışı. Default: "white" — Apple Human Interface
   *  app-icon estetiği; tüm logolar tutarlı görünür, kenarlardaki grunge/
   *  transparent border'lar overflow-hidden ile clip edilir. İstisnai
   *  durumlarda (örn. zaten gradient zeminli neon logo, beyaz card içinde
   *  garip duracak) "transparent" set edilebilir. */
  logoBackground?: "transparent" | "white";
  /** Kart background rengini özelleştir. Logo dosyasının kendi arka plan
   *  rengi ile kartı eşleştirir → kare-olmayan logolarda object-contain'in
   *  bıraktığı şerit kaybolur (örn. 1Ci 800x600 navy logosu için
   *  `#091e42`). Set edilirse bg-white'ı override eder, padding 0'a düşer
   *  (logo dosyasının kendi padding'i zaten yeterli). `logoBackground:
   *  "transparent"` ile birlikte kullanılmaz (transparent öncelikli). */
  logoBackgroundColor?: string;
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
  /** When true, ürün halka açık liste sayfalarında (/urunler, /urunler/[id], Footer
   *  kategori linkleri, Services anasayfa grid'i) gösterilmez. Backend ve mevcut
   *  müşteri akışları (hesabim/lisanslarim, ödeme callback, license-service)
   *  çalışmaya devam eder. iyzico üye işyeri süreci için "AI Kontör" tarzı kredi
   *  satışını site'den gizlerken mevcut kullanıcı bakiyesini korumak amacıyla
   *  eklendi (2026-06). */
  hiddenFromPublic?: boolean;
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
  /** Web tanıtım/marketing sitesi — mobil uygulamanın yanı sıra (WITMA gibi
   *  bir landing page'i olan ürünlerde). MobileAppStoreCard'ın altında
   *  "Web sitesini ziyaret et" butonu olarak görünür. */
  webUrl?: string;

  /** Sıkça Sorulan Sorular — opsiyonel. Doldurulursa product detail layout
   *  FAQPage JSON-LD üretir, Google'da rich result çıkar (accordion). En az
   *  3 soru olmalı ki Google işe yarar bulsun. TR varsayılan; i18n ileride.
   *  Soru-cevap'lar canlı destek kayıtlarından (SupportRequest tablosu)
   *  beslenebilir. */
  faqs?: Array<{ q: string; a: string }>;
  /** Mobil uygulamalar için: masaüstünden indirme DEVRE DIŞI (QR kod göster). */
  mobileOnlyDownload?: boolean;

  skus: SKU[];
}

export const PRODUCTS: Product[] = [
  {
    id: "finanserpide",
    name: "FinansERPIDE",
    tagline: "AI Destekli Çok Şirketli ERP SaaS — Self-Service Banka & e-Fatura Entegrasyonu",
    description:
      "Çok şirketli, AI destekli ERP SaaS. 15+ Türk bankası + 13 e-fatura entegratörünü kendi panelinden bağla; banka hareketleri saatlik otomatik düşsün, gelen faturalar AI ile sınıflandırılıp muhasebe fişine geçsin. Şirketini AI ile sohbet ederek yönet.",
    longDescription:
      "FinansERPIDE; KOBİ ve A.Ş.'lerin tüm finans/muhasebe süreçlerini AI ile yöneten yeni nesil ERP. Her şirket için izole veritabanı (multi-tenant), AES-256-GCM ile şifrelenmiş credential saklama. \"Integration Hub\": QNB Finansbank, Garanti BBVA, İş Bankası, Akbank, Yapı Kredi, DenizBank, TEB, HSBC, ING, Ziraat, VakıfBank, Halkbank, Şekerbank, Kuveyt Türk, Albaraka — self-service API key gir, hesap hareketleri saatlik cron ile otomatik aksın. E-fatura tarafında QNB eSolutions, Mikro, Logo, Veriban, Foriba, Uyumsoft, TÜRKKEP, Türk Telekom, DigitalPlanet — gelen fatura inbox'u poll'lensin, AI %90+ confidence ile auto-post yapsın (muhasebe fişi tek tıkla onay). KDV ve geçici vergi tutar hesabı, cari mutabakat, personel/SGK. Fatura fotoğrafını WhatsApp'tan at, AI okuyup sisteme kaydetsin. \"Bu ay zarar mı kar mı?\" diye sor, anında raporla cevaplasın.",
    icon: Briefcase,
    color: "from-orange-500 to-pink-600",
    domain: "finans.erpide.com",
    category: "web",
    marketScope: "TR",
    i18n: {
      en: {
        name: "FinansERPIDE",
        tagline: "AI-Powered Multi-Company ERP SaaS — Self-Service Bank & e-Invoice Integrations",
        description: "Multi-company AI-powered ERP for Turkish businesses. Connect 15+ Turkish banks + 13 e-invoice integrators self-service from your own panel; bank transactions sync hourly, incoming invoices are AI-classified and auto-posted to journal entries. Operate your company by chatting with AI. Built for Turkish tax law (VAT, MUHSGK, e-İrsaliye, brüt-net payroll).",
      },
      ru: {
        name: "FinansERPIDE",
        tagline: "ERP SaaS с AI для нескольких компаний — самостоятельные интеграции банков и э-фактуры",
        description: "Многокомпанийный ERP с AI для турецкого бизнеса. Подключите 15+ турецких банков и 13 операторов э-фактуры самостоятельно из своей панели; банковские операции синхронизируются ежечасно, входящие счета классифицируются AI и автоматически проводятся в журнале. Соответствует турецкому налоговому законодательству.",
      },
      kk: {
        name: "FinansERPIDE",
        tagline: "AI-көмекшісі бар көпкомпаниялы ERP SaaS — Өздігінен банк және e-фактура интеграциялары",
        description: "Түрік бизнесіне арналған, AI көмекшісі бар көпкомпаниялы ERP. 15+ түрік банкі мен 13 е-фактура операторын өз панеліңізден өздігінен қосыңыз; банк операциялары сағат сайын синхрондалады, кіріс фактуралар AI-мен жіктеліп, бухгалтерлік жазбаларға автоматты түрде енгізіледі. Түрік салық заңнамасына сәйкес.",
      },
    },
    comingSoon: true,
    skus: [
      // ===== SATIŞTAKİ PAKETLER =====
      //
      // İki paket, ikisinde de SINIRSIZ KULLANICI. Fiyat TL — FinansERPIDE
      // Türkiye'ye özel bir ürün (TR mevzuatı, TR bankaları, TR e-fatura),
      // müşterisi TL düşünüyor. Dolar gösterip kurdan çevirmek hem kafa
      // karıştırıyordu hem de kur güncellenmeyince sessizce marj yiyordu.
      // Enflasyon karşısında liste fiyatı yıllık gözden geçirilir.
      //
      // Fiyatlama kuralı: liste fiyatı = doğrudan maliyet × 2,36.
      // (iyzico %3,49 komisyon KDV dahil tutardan kesiliyor + %25 kurumlar
      // vergisi → vergi sonrası %40 net kâr.) KDV maliyet değildir; tahsil
      // edip devlete yatırıyoruz, fiyatın üstüne eklenir.
      //
      // Rakip (bizimhesap.com, 07/2026): Temel ₺870 · Tam ₺1.100 + KDV.
      {
        id: "finanserpide-temel-monthly",
        productId: "finanserpide",
        name: "İşletme",
        description: "Satış, satınalma, stok, cari, banka ve e-fatura — sınırsız kullanıcı",
        price: 1249,
        currency: "TRY",
        cycle: "monthly",
        kind: "base",
        unlimitedSeats: true,
        grantsModules: ["/satis", "/satinalma", "/stok", "/finans", "/cari", "/faturalar", "/dashboard"],
        features: [
          "Sınırsız kullanıcı",
          "Satış — teklif, sipariş, irsaliye, fatura",
          "Satınalma — talep, sipariş, irsaliye, fatura",
          "Stok — ürün, depo, hareket, ağırlıklı ortalama maliyet",
          "Cari hesap + mutabakat mektubu",
          "Banka entegrasyonu — hareketler otomatik düşer, faturayla eşleşir",
          "e-Fatura / e-Arşiv (QNB eSolutions)",
          "Sınırsız fatura, 1 şirket (izole veritabanı)",
          "Mobil erişim",
        ],
        i18n: {
          en: {
            name: "Business",
            description: "Sales, purchasing, stock, contacts, banking and e-invoicing — unlimited users",
            features: [
              "Unlimited users",
              "Sales — quote, order, dispatch, invoice",
              "Purchasing — request, order, dispatch, invoice",
              "Stock — items, warehouses, movements, weighted-average cost",
              "Customer/supplier accounts + reconciliation letter",
              "Bank integration — transactions sync and match to invoices",
              "e-Invoice / e-Archive (QNB eSolutions)",
              "Unlimited invoices, 1 company (isolated database)",
              "Mobile access",
            ],
          },
          ru: {
            name: "Бизнес",
            description: "Продажи, закупки, склад, контрагенты, банк и э-фактура — без ограничения пользователей",
            features: [
              "Неограниченное число пользователей",
              "Продажи — предложение, заказ, накладная, счет",
              "Закупки — заявка, заказ, накладная, счет",
              "Склад — товары, склады, движения, средняя себестоимость",
              "Контрагенты + акт сверки",
              "Банковская интеграция — операции сопоставляются со счетами",
              "Э-фактура / э-архив (QNB eSolutions)",
              "Неограниченные счета, 1 компания (изолированная база)",
              "Мобильный доступ",
            ],
          },
          kk: {
            name: "Бизнес",
            description: "Сату, сатып алу, қойма, контрагенттер, банк және э-шот — шексіз пайдаланушы",
            features: [
              "Шексіз пайдаланушы",
              "Сату — ұсыныс, тапсырыс, жүкқұжат, шот",
              "Сатып алу — өтінім, тапсырыс, жүкқұжат, шот",
              "Қойма — тауар, қойма, қозғалыс, орташа өзіндік құн",
              "Контрагенттер + салыстыру актісі",
              "Банк интеграциясы — операциялар шоттармен салыстырылады",
              "Э-шот / э-мұрағат (QNB eSolutions)",
              "Шексіз шот, 1 компания (оқшауланған дерекқор)",
              "Мобильді қолжетімділік",
            ],
          },
        },
      },
      {
        id: "finanserpide-tam-monthly",
        productId: "finanserpide",
        name: "Kurumsal",
        description: "Resmi muhasebe, üretim ve personel dahil tam ERP — sınırsız kullanıcı",
        price: 1799,
        currency: "TRY",
        cycle: "monthly",
        kind: "base",
        unlimitedSeats: true,
        grantsModules: [
          "/satis", "/satinalma", "/stok", "/finans", "/cari", "/faturalar", "/dashboard",
          "/muhasebe", "/sabitkiymet", "/uretim", "/ik",
        ],
        features: [
          "İşletme paketindeki her şey",
          "Muhasebe — TDHP hesap planı, otomatik yevmiye, mizan, defter-i kebir",
          "Bilanço, gelir tablosu, KDV ve stopaj hesabı",
          "Sabit kıymet — demirbaş kartı, amortisman planı",
          "Üretim — BOM reçeteleri, üretim emri, maliyetlendirme",
          "İnsan Kaynakları — personel, devam takibi, izin",
          "Bordro — SGK kesintileri, otomatik personel ödemesi",
          "Eylül AI asistanı (aylık mesaj hakkı)",
          "Öncelikli destek",
        ],
        highlight: true,
        i18n: {
          en: {
            name: "Enterprise",
            description: "Full ERP including statutory accounting, manufacturing and payroll — unlimited users",
            features: [
              "Everything in Business",
              "Accounting — Turkish chart of accounts, automatic journal entries, trial balance, general ledger",
              "Balance sheet, income statement, VAT and withholding calculation",
              "Fixed assets — asset cards, depreciation schedule",
              "Manufacturing — BOM recipes, work orders, costing",
              "HR — employees, attendance, leave",
              "Payroll — social security deductions, automatic staff payments",
              "Eylül AI assistant (monthly message allowance)",
              "Priority support",
            ],
          },
          ru: {
            name: "Корпоративный",
            description: "Полный ERP с бухгалтерией, производством и расчетом зарплаты — без ограничения пользователей",
            features: [
              "Все из базового пакета",
              "Бухгалтерия — план счетов, автоматические проводки, оборотная ведомость, главная книга",
              "Баланс, отчет о прибылях, расчет НДС и удержаний",
              "Основные средства — карточки, график амортизации",
              "Производство — спецификации, производственные заказы, себестоимость",
              "Кадры — сотрудники, учет времени, отпуска",
              "Зарплата — отчисления, автоматические выплаты",
              "AI-ассистент Eylül (месячный лимит сообщений)",
              "Приоритетная поддержка",
            ],
          },
          kk: {
            name: "Корпоративтік",
            description: "Бухгалтерия, өндіріс және жалақыны қамтитын толық ERP — шексіз пайдаланушы",
            features: [
              "Негізгі пакеттегінің бәрі",
              "Бухгалтерия — шоттар жоспары, автоматты жазбалар, айналым ведомосы, бас кітап",
              "Баланс, пайда есебі, ҚҚС және ұстау есебі",
              "Негізгі құралдар — карточкалар, амортизация кестесі",
              "Өндіріс — спецификация, өндіріс тапсырысы, өзіндік құн",
              "Кадрлар — қызметкерлер, есеп, демалыс",
              "Жалақы — аударымдар, автоматты төлемдер",
              "Eylül AI көмекшісі (айлық хабарлама лимиті)",
              "Басым қолдау",
            ],
          },
        },
      },

      // Yillik: 12 ay yerine 10 ay odenir (2 ay bedava). Pesin tahsilat nakit
      // akisini rahatlatiyor, musteri de indirimi somut goruyor.
      {
        id: "finanserpide-temel-yearly",
        productId: "finanserpide",
        name: "İşletme — Yıllık",
        description: "Satış, satınalma, stok, cari, banka ve e-fatura — sınırsız kullanıcı · yıllık ödemede yarı fiyat",
        price: 7490,
        currency: "TRY",
        cycle: "yearly",
        kind: "base",
        unlimitedSeats: true,
        grantsModules: ["/satis", "/satinalma", "/stok", "/finans", "/cari", "/faturalar", "/dashboard"],
        features: [
          "İşletme paketinin tamamı",
          "Aylık ödemeye göre %50 tasarruf",
          "Yıl boyunca fiyat sabit (zamdan etkilenmez)",
          "Sınırsız kullanıcı",
        ],
        i18n: {
          en: {
            name: "Business — Annual",
            description: "Everything in Essential Commerce — unlimited users · 50% off",
            features: ["Everything in Business", "50% cheaper than paying monthly", "Price locked for a year", "Unlimited users"],
          },
          ru: {
            name: "Бизнес — год",
            description: "Все из базового пакета — без ограничения пользователей · скидка 50%",
            features: ["Все из базового пакета", "На 50% дешевле помесячной оплаты", "Цена зафиксирована на год", "Неограниченное число пользователей"],
          },
          kk: {
            name: "Бизнес — жылдық",
            description: "Негізгі пакеттегінің бәрі — шексіз пайдаланушы · 50% жеңілдік",
            features: ["Негізгі пакеттегінің бәрі", "Айлық төлемнен 50% арзан", "Жыл бойы баға тұрақты", "Шексіз пайдаланушы"],
          },
        },
      },
      {
        id: "finanserpide-tam-yearly",
        productId: "finanserpide",
        name: "Kurumsal — Yıllık",
        description: "Muhasebe, üretim ve personel dahil tam ERP — sınırsız kullanıcı · yıllık ödemede yarı fiyat",
        price: 12490,
        currency: "TRY",
        cycle: "yearly",
        kind: "base",
        unlimitedSeats: true,
        grantsModules: [
          "/satis", "/satinalma", "/stok", "/finans", "/cari", "/faturalar", "/dashboard",
          "/muhasebe", "/sabitkiymet", "/uretim", "/ik",
        ],
        features: [
          "Kurumsal paketin tamamı",
          "Aylık ödemeye göre %50 tasarruf",
          "Yıl boyunca fiyat sabit (zamdan etkilenmez)",
          "Sınırsız kullanıcı",
          "Öncelikli destek",
        ],
        i18n: {
          en: {
            name: "Enterprise — Annual",
            description: "Full ERP with accounting, manufacturing and payroll — unlimited users · 50% off",
            features: ["Everything in Enterprise", "50% cheaper than paying monthly", "Price locked for a year", "Unlimited users", "Priority support"],
          },
          ru: {
            name: "Корпоративный — год",
            description: "Полный ERP с бухгалтерией и производством — без ограничения пользователей · скидка 50%",
            features: ["Все из полного пакета", "На 50% дешевле помесячной оплаты", "Цена зафиксирована на год", "Неограниченное число пользователей", "Приоритетная поддержка"],
          },
          kk: {
            name: "Корпоративтік — жылдық",
            description: "Бухгалтерия мен өндірісті қамтитын толық ERP — шексіз пайдаланушы · 50% жеңілдік",
            features: ["Толық пакеттегінің бәрі", "Айлық төлемнен 50% арзан", "Жыл бойы баға тұрақты", "Шексіз пайдаланушы", "Басым қолдау"],
          },
        },
      },

      // ===== EMEKLİ SKU'LAR =====
      // Satışa kapalı. Silinmiyor: mevcut abonelikler bu id'lere bağlı ve
      // license-service sipariş geçmişini bunlarla çözüyor.
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
        legacy: true,
        unlimitedSeats: true, // koltuk satisi kalkti — eski paketler de sinirsiz
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
        legacy: true,
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
        legacy: true,
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
        legacy: true,
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
        legacy: true,
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
        id: "finanserpide-full-monthly",
        productId: "finanserpide",
        name: "Tam Paket (4 Kullanıcı)",
        description: "Tüm modüller + 4 kullanıcı — tek kodla aktivasyon",
        price: 90,
        currency: "TRY",
        prices: { USD: 90 },
        cycle: "monthly",
        kind: "base",
        legacy: true,
        unlimitedSeats: true, // koltuk satisi kalkti — eski paketler de sinirsiz
        // Base modüller + tüm modül eklentileri tek SKU'da
        grantsModules: [
          "/satis", "/satinalma", "/stok", "/finans", "/cari", "/faturalar", "/dashboard",
          "/muhasebe", "/ik", "/uretim", "/sabitkiymet",
        ],
        seatsIncluded: 3, // owner + 3 = 4 kullanıcı
        features: [
          "Temel Paket (Satış · Satınalma · Stok · Finans)",
          "Muhasebe Modülü (yevmiye, mizan, KDV, defter-i kebir)",
          "İnsan Kaynakları Modülü (personel, devam, bordro)",
          "Üretim Modülü (BOM, üretim emri, maliyetlendirme)",
          "Sabit Kıymet Modülü (demirbaş, amortisman)",
          "4 kullanıcı koltuğu",
          "e-Fatura / e-Arşiv (QNB eFinans)",
          "Tek aktivasyon kodu ile hepsi",
        ],
        highlight: true,
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
        legacy: true,
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
    // Public site'ten çekildi (2026-07): CaptchaERPIDE artık satılan bir ürün
    // olarak listelenmiyor; yalnızca captcha.erpide.com server'ında kendi
    // kullanımımız için çalışıyor. Backend (captcha-provision, license-service,
    // admin Captcha Paneli) mevcut lisanslar için olduğu gibi korunuyor.
    hiddenFromPublic: true,
    noTrial: true,
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
          "Aboneliğe dahil: günlük 1.000 çözüm kapasitesi",
          "18 captcha tipi — image + token tabanlı",
          "Native solver'lar (slider/puzzle/text/icon)",
          "BYOK desteği — kendi 2Captcha/CapMonster key'in",
          "REST API + 30ms ortalama süre",
          "Gerçek zamanlı dashboard + e-mail destek",
        ],
        i18n: {
          en: {
            description: "For bot developers",
            features: ["Included in subscription: 1,000 daily solves capacity", "18 captcha types — image + token based", "Native solvers (slider/puzzle/text/icon)", "BYOK support — your own 2Captcha/CapMonster key", "REST API + 30ms avg response", "Real-time dashboard + email support"],
          },
          ru: {
            description: "Для разработчиков ботов",
            features: ["В подписку входит: ёмкость 1 000 решений в день", "18 типов капчи — image + токен", "Нативные решатели (slider/puzzle/text/icon)", "BYOK — ваш собственный 2Captcha/CapMonster ключ", "REST API + среднее 30 мс", "Дашборд в реальном времени + email поддержка"],
          },
          kk: {
            description: "Бот әзірлеушілерге арналған",
            features: ["Жазылымға кіреді: күніне 1 000 шешім сыйымдылығы", "18 капча түрі — image + токен негізді", "Жергілікті шешушілер (slider/puzzle/text/icon)", "BYOK — өз 2Captcha/CapMonster кілтіңіз", "REST API + орташа 30 мс", "Нақты уақыттағы дашборд + email қолдау"],
          },
        },
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
          "Aboneliğe dahil: günlük 10.000 çözüm kapasitesi",
          "Tüm 18 captcha tipi (reCAPTCHA v2/v3/Enterprise, hCaptcha, Turnstile, AWS WAF, FunCaptcha, DataDome, GeeTest…)",
          "Öncelikli işleme (15ms)",
          "Webhook bildirimleri + retry kuyruğu",
          "Multi-tenant lisans yönetimi",
          "Öncelikli destek",
        ],
        highlight: true,
        i18n: {
          en: {
            description: "Professional usage",
            features: ["Included in subscription: 10,000 daily solves capacity", "All 18 captcha types (reCAPTCHA v2/v3/Enterprise, hCaptcha, Turnstile, AWS WAF, FunCaptcha, DataDome, GeeTest…)", "Priority processing (15ms)", "Webhook callbacks + retry queue", "Multi-tenant license management", "Priority support"],
          },
          ru: {
            description: "Профессиональное использование",
            features: ["В подписку входит: ёмкость 10 000 решений в день", "Все 18 типов капчи (reCAPTCHA v2/v3/Enterprise, hCaptcha, Turnstile, AWS WAF, FunCaptcha, DataDome, GeeTest…)", "Приоритетная обработка (15 мс)", "Webhook-уведомления + очередь повторов", "Управление лицензиями для нескольких клиентов", "Приоритетная поддержка"],
          },
          kk: {
            description: "Кәсіби пайдалану",
            features: ["Жазылымға кіреді: күніне 10 000 шешім сыйымдылығы", "Барлық 18 капча түрі (reCAPTCHA v2/v3/Enterprise, hCaptcha, Turnstile, AWS WAF, FunCaptcha, DataDome, GeeTest…)", "Басымдықпен өңдеу (15 мс)", "Webhook хабарламалары + қайталау кезегі", "Көп-арендатор лицензия басқару", "Басымдықты қолдау"],
          },
        },
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
          "Aboneliğe dahil: sınırsız çözüm kapasitesi",
          "Tüm tipler + custom captcha tanımı",
          "Dedicated worker pool + 10ms hedef süre",
          "%99.5 uptime SLA garantisi",
          "Public accuracy + p95 latency dashboard",
          "Telefon destek + onboarding",
        ],
        i18n: {
          en: {
            description: "High volume + SLA",
            features: ["Included in subscription: unlimited solves capacity", "All types + custom captcha definitions", "Dedicated worker pool + 10ms target latency", "99.5% uptime SLA guarantee", "Public accuracy + p95 latency dashboard", "Phone support + onboarding"],
          },
          ru: {
            description: "Большие объёмы + SLA",
            features: ["В подписку входит: безлимитная ёмкость решений", "Все типы + кастомные определения капчи", "Выделенный пул воркеров + цель 10 мс", "Гарантия SLA 99.5% uptime", "Публичный дашборд точности + p95 latency", "Телефонная поддержка + онбординг"],
          },
          kk: {
            description: "Үлкен көлем + SLA",
            features: ["Жазылымға кіреді: шектеусіз шешім сыйымдылығы", "Барлық түрлер + арнайы капча анықтамасы", "Бөлінген worker пулы + 10 мс мақсат", "99.5% uptime SLA кепілдігі", "Ашық дәлдік + p95 latency дашборд", "Телефонмен қолдау + онбординг"],
          },
        },
      },
    ],
  },
  {
    id: "ai-kontor",
    name: "Eylül AI",
    tagline: "FinansERPIDE'yi konuşarak yönetin",
    description:
      "Eylül, FinansERPIDE'nin yapay zekâ asistanı. Fatura kes, cari aç, rapor sor, mutabakat hazırlat — hepsini yazarak yaptır. Her FinansERPIDE hesabında ayda 10 mesaj ücretsiz; daha fazlası için aylık paket seçin.",
    longDescription:
      "Eylül sisteminizin içinde çalışır: \"Ahmet Ticaret'e 12.000 TL danışmanlık faturası kes\" dediğinizde faturayı oluşturur, KDV'sini hesaplar, yevmiyesini yazar. Cari bakiyeleri, stok durumu, vadesi geçen alacaklar, aylık kâr-zarar — hepsini sorabilirsiniz. Türk muhasebe ve vergi mevzuatını bilir; \"bu masrafı hangi hesaba yazayım\" gibi soruları da yanıtlar. Paketler aylıktır ve her ay yenilenir; kullanılmayan hak devretmez.",
    icon: Sparkles,
    color: "from-amber-500 to-orange-600",
    domain: "finans.erpide.com",
    category: "ai-credits",
    marketScope: "GLOBAL",

    i18n: {
      en: {
        name: "Eylül AI Assistant",
        tagline: "Monthly AI assistant plan for FinansERPIDE",
        description: "Every FinansERPIDE account includes 10 free AI messages per month. Choose a monthly plan for more — plans renew each month and unused messages do not carry over.",
      },
      ru: {
        name: "AI-ассистент Eylül",
        tagline: "Месячный тариф AI-ассистента для FinansERPIDE",
        description: "Каждый аккаунт FinansERPIDE включает 10 бесплатных AI-сообщений в месяц. Для большего объёма выберите месячный тариф — он продлевается ежемесячно, неиспользованные сообщения не переносятся.",
      },
      kk: {
        name: "Eylül AI көмекшісі",
        tagline: "FinansERPIDE үшін айлық AI көмекшісі жоспары",
        description: "Әрбір FinansERPIDE тіркелгісінде айына 10 тегін AI хабарлама бар. Көбірек қажет болса, айлық жоспарды таңдаңыз. Жоспар ай сайын жаңарады; пайдаланылмаған хабарламалар келесі айға өтпейді.",
      },
    },
    // Her AI mesaji Claude API'de gercek dolar yakar; ucretsiz deneme verirsek
    // 3 gunde binlerce mesaj atilip bizi zarara sokabilirler. Sadece aktif
    // FinansERPIDE plani olan musteriler sepete ekleyebilir (aiKontorBlocked).
    noTrial: true,
    /**
     * YENI SATISA KAPALI — 2026-08-30.
     *
     * Eylul, ERPIDE'nin Anthropic anahtariyla calisan "managed" modelden,
     * musterinin KENDI yapay zekasini bagladigi connector modeline geciyor
     * (karar kaydi: erpide-finanserpide/docs/AI-HUKUKI-MIMARI.md).
     *
     * Managed modelde AI cagrisini ERPIDE yapiyor, yani musterinin fatura/cari/
     * bordro verisini yurt disina fiilen AKTARAN taraf ERPIDE oluyor. Bu KVKK
     * md.9 geregi standart sozlesme + imzadan itibaren 5 is gunu icinde Kurul'a
     * bildirim zorunlulugu doguruyor. 1 Eylul 2024'ten beri surekli (arizi
     * olmayan) aktarimlarda ACIK RIZA TEK BASINA GECERSIZ — yani onay kutusu
     * bu yukumlulugu kaldirmiyor.
     *
     * Su an odeme yapan musteri YOK (yalniz ERPIDE'nin kendi verisi + Maendros
     * pilotu), dolayisiyla gecisin maliyeti sifir. Ama bu sayfa aciktan
     * satilabilir kaldigi surece tek bir satin alma bizi terk ettigimiz modele
     * geri sokar ve iptal ettigimiz tum yukumlulukleri geri getirir.
     *
     * NOT: `category: "ai-credits"` zaten public CATEGORIES'ten cikarilmisti
     * (bkz. satir 80), ama o yalnizca LISTE sayfasini gizliyordu. Bu bayrak
     * olmadan dogrudan URL (/urunler/ai-kontor) calisiyor ve urun sitemap'e
     * giriyordu. Kapali olmasi gereken sey satin alinabilirlikti.
     *
     * Backend (kota, havuz, kontor tuketimi) MEVCUT ic kullanim icin calisir
     * durumda birakildi; kapatilan sey yalnizca yeni satis.
     */
    hiddenFromPublic: true,
    skus: [
      // ===== AYLIK AI PAKETLERI =====
      // Kontor (tek seferlik, devreden) modeli birakildi: musteri "kac kontorum
      // kaldi" diye takip etmek zorunda kaliyordu. Artik aylik hak; her ay
      // yenilenir, devretmez. Her FinansERPIDE hesabinda ayda 10 mesaj zaten
      // ucretsiz — paketler bunun ustune gecer, eklenmez.
      //
      // Fiyatlama: mesaj maliyeti ~₺1,5 (arac sonuclari kirpildiktan sonra).
      // Hacim buyudukce mesaj basi fiyat dusuyor.
      {
        id: "eylul-junior-monthly",
        productId: "ai-kontor",
        name: "Junior",
        description: "Ayda 100 mesaj — gunluk birkac islem",
        price: 349,
        currency: "TRY",
        cycle: "monthly",
        kind: "ai-plan",
        aiMessagesPerMonth: 100,
        features: [
          "Ayda 100 AI mesajı",
          "Fatura kesme, cari açma, rapor sorgulama",
          "Türk muhasebe ve vergi mevzuatı bilgisi",
          "Firma geneli — tüm kullanıcılar ortak havuzdan harcar",
          "Mesaj başı ≈ ₺3,49",
        ],
        i18n: {
          en: { name: "Junior", description: "100 messages/month — a few operations a day", features: ["100 AI messages per month", "Create invoices, add contacts, query reports", "Knows Turkish accounting and tax rules", "Company-wide shared pool", "≈ ₺3.49 per message"] },
          ru: { name: "Junior", description: "100 сообщений в месяц — несколько операций в день", features: ["100 AI-сообщений в месяц", "Счета, контрагенты, отчеты", "Знает турецкий учет и налоги", "Общий пул на компанию", "≈ ₺3,49 за сообщение"] },
          kk: { name: "Junior", description: "Айына 100 хабарлама", features: ["Айына 100 AI хабарлама", "Шот, контрагент, есеп", "Түрік есебі мен салығын біледі", "Компания бойынша ортақ пул", "≈ ₺3,49 хабарлама"] },
        },
      },
      {
        id: "eylul-standart-monthly",
        productId: "ai-kontor",
        name: "Standart",
        description: "Ayda 300 mesaj — gunluk duzenli kullanim",
        price: 899,
        currency: "TRY",
        cycle: "monthly",
        kind: "ai-plan",
        aiMessagesPerMonth: 300,
        highlight: true,
        features: [
          "Ayda 300 AI mesajı",
          "Junior'daki her şey",
          "Toplu işlemler (gelen faturaları sınıflandır, mutabakat hazırla)",
          "Firma geneli — tüm kullanıcılar ortak havuzdan harcar",
          "Mesaj başı ≈ ₺3,00",
        ],
        i18n: {
          en: { name: "Standard", description: "300 messages/month — regular daily use", features: ["300 AI messages per month", "Everything in Junior", "Bulk operations (classify incoming invoices, prepare reconciliation)", "Company-wide shared pool", "≈ ₺3.00 per message"] },
          ru: { name: "Стандарт", description: "300 сообщений в месяц", features: ["300 AI-сообщений в месяц", "Все из Junior", "Массовые операции", "Общий пул на компанию", "≈ ₺3,00 за сообщение"] },
          kk: { name: "Стандарт", description: "Айына 300 хабарлама", features: ["Айына 300 AI хабарлама", "Junior-дағының бәрі", "Топтық операциялар", "Компания бойынша ортақ пул", "≈ ₺3,00 хабарлама"] },
        },
      },
      {
        id: "eylul-plus-monthly",
        productId: "ai-kontor",
        name: "Plus",
        description: "Ayda 750 mesaj — yogun kullanim, birkac kisi",
        price: 1999,
        currency: "TRY",
        cycle: "monthly",
        kind: "ai-plan",
        aiMessagesPerMonth: 750,
        features: [
          "Ayda 750 AI mesajı",
          "Standart'taki her şey",
          "Muhasebe ekibi için toplu yevmiye ve mizan analizi",
          "Firma geneli — tüm kullanıcılar ortak havuzdan harcar",
          "Mesaj başı ≈ ₺2,67",
        ],
        i18n: {
          en: { name: "Plus", description: "750 messages/month — heavy use, small team", features: ["750 AI messages per month", "Everything in Standard", "Bulk journal and trial-balance analysis", "Company-wide shared pool", "≈ ₺2.67 per message"] },
          ru: { name: "Plus", description: "750 сообщений в месяц", features: ["750 AI-сообщений в месяц", "Все из Стандарта", "Массовый анализ проводок", "Общий пул на компанию", "≈ ₺2,67 за сообщение"] },
          kk: { name: "Plus", description: "Айына 750 хабарлама", features: ["Айына 750 AI хабарлама", "Стандарттағының бәрі", "Топтық талдау", "Компания бойынша ортақ пул", "≈ ₺2,67 хабарлама"] },
        },
      },
      {
        id: "eylul-pro-monthly",
        productId: "ai-kontor",
        name: "Pro",
        description: "Ayda 2.000 mesaj — Eylul'u surekli calistiran firmalar",
        price: 4799,
        currency: "TRY",
        cycle: "monthly",
        kind: "ai-plan",
        aiMessagesPerMonth: 2000,
        features: [
          "Ayda 2.000 AI mesajı",
          "Plus'taki her şey",
          "Öncelikli işlem sırası",
          "Firma geneli — tüm kullanıcılar ortak havuzdan harcar",
          "Mesaj başı ≈ ₺2,40",
        ],
        i18n: {
          en: { name: "Pro", description: "2,000 messages/month — teams running Eylül all day", features: ["2,000 AI messages per month", "Everything in Plus", "Priority processing", "Company-wide shared pool", "≈ ₺2.40 per message"] },
          ru: { name: "Pro", description: "2 000 сообщений в месяц", features: ["2 000 AI-сообщений в месяц", "Все из Plus", "Приоритетная обработка", "Общий пул на компанию", "≈ ₺2,40 за сообщение"] },
          kk: { name: "Pro", description: "Айына 2 000 хабарлама", features: ["Айына 2 000 AI хабарлама", "Plus-тағының бәрі", "Басым өңдеу", "Компания бойынша ортақ пул", "≈ ₺2,40 хабарлама"] },
        },
      },


      /**
       * KONTOR PAKETLERI KALDIRILDI — 2026-08-30.
       *
       * Burada 4 adet kind:"credit" SKU vardi (500/1.000/2.000/10.000 kontor;
       * ₺1.450 / ₺2.800 / ₺5.500 / ₺26.000). Tek seferlik alinip aydan aya
       * DEVREDEN kontor modeliydi.
       *
       * Neden kaldirildi: iyzico uye isyeri surecinde "kredi/jeton/kontor
       * modeli" satilmamasi istenmisti (bkz. satir ~80'deki not). Kategoriyi
       * public listeden cikarmak yetmiyordu — mekanizmanin kendisi kredi
       * modeliydi, adini degistirmek sorunu cozmezdi.
       *
       * Yerine ne var: yukaridaki kind:"ai-plan" AYLIK paketler (Junior 100 /
       * Standart 300 / Plus 750 / Pro 2.000 mesaj). Her ay yenilenir,
       * devretmez. Ayni ihtiyaci karsiliyor.
       *
       * Backend tarafi (api/internal/credits-consume, payments/callback,
       * finanserpide-provision, user-store) BILEREK BIRAKILDI: kontor
       * ureten SKU kalmadigi icin atil durumda ve odeme akisini sokup
       * cikarmak sifir fayda icin yuksek riskti. Mevcut bakiyesi olan biri
       * varsa harcamaya devam edebilir.
       *
       * Geri acilacaksa once iyzico onayi alinmali.
       */
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
    logoImage: "/products/pocketerpide/icon.png",
    logoBackgroundColor: "#db2777",
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
    logoImage: "/products/1c/logo.webp",
    logoBackgroundColor: "#091e42",
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
    logoImage: "/products/1c/logo.webp",
    logoBackgroundColor: "#091e42",
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
    logoImage: "/products/canias/logo.jpg",
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
    id: "dataengine",
    name: "Data Engine",
    tagline: "ERP Geçişlerinde Veri Doğrulama Komuta Merkezi",
    description:
      "Eski sistemden yeniye veri taşırken kayıp/uyumsuzluğu canlı izle. ERP_TO_ACC, ACC_TO_ERP veya iki yönlü senkron — her belge tipi için kaynak/hedef satır sayısı, fark ve yapışıp kalan kayıtlar tek dashboard'da. Müşterinin kendi server'ına kurulur, finans verisi şirketin sınırından çıkmaz.",
    longDescription:
      "Data Engine; 1C, CANIAS, Logo, SAP veya başka bir ERP'den ERP'ye geçiş projelerinde \"go-live öncesi veri doğrulama\" işini saatlerden saniyelere indirir. Kaynak ve hedef veritabanlarına doğrudan bağlanır (SQL/ODBC), her belge tipini (satınalma, satış, fatura, stok hareketi, OS kartı, mizan...) çift taraflı kıyaslar; ERP'de 1.247 satır var, ACC'ye 1.243 düşmüş — fark 4, hangileri? Tek tıkla göster. Stuck/error/done KPI'ları, 7 günlük trend grafiği, modül bazlı yığılma, drill-down belge listesi. Mizan ve hesap bakiyesi karşılaştırması: \"opening + dönem hareketi = closing\" eşitliği bozulan hesapları otomatik flag'ler. Müşterinin kendi Windows Server'ına kurulur, Cloudflare Tunnel üzerinden danışman ekibi nereden olursa olsun bağlanabilir — finansal veri şirket sınırından çıkmaz. ERPIDE; kurulum, kaynak/hedef tablo eşleştirme, kustom belge tipi tanımı, eğitim ve canlı destek sunar.",
    icon: Database,
    logoImage: "/products/dataengine/logo.png",
    logoBackgroundColor: "#000000",
    color: "from-blue-600 to-purple-600",
    domain: "dataengine.erpide.com",
    category: "desktop-enterprise",
    marketScope: "GLOBAL",
    i18n: {
      en: {
        name: "Data Engine",
        tagline: "Mission Control for ERP Migration Data Validation",
        description: "Watch data loss/mismatch live while you move from old to new. ERP_TO_ACC, ACC_TO_ERP or two-way sync — source/target row counts, diffs and stuck records for every document type on one dashboard. Deployed on the customer's own server; financial data never leaves the building.",
      },
      ru: {
        name: "Data Engine",
        tagline: "Командный центр проверки данных при переходе ERP",
        description: "Отслеживайте потери и несоответствия данных в реальном времени при переходе со старой системы на новую. ERP_TO_ACC, ACC_TO_ERP или двусторонняя синхронизация — счётчики строк источника/приёмника, разница и застрявшие записи для каждого типа документов на одной панели. Устанавливается на сервер заказчика; финансовые данные не покидают периметр.",
      },
      kk: {
        name: "Data Engine",
        tagline: "ERP көшу жобаларында деректерді валидациялау командалық орталығы",
        description: "Ескі жүйеден жаңасына көшу барысында деректер жоғалуын/сәйкессіздігін нақты уақытта бақылаңыз. ERP_TO_ACC, ACC_TO_ERP немесе екі жақты синхрондау — әр құжат түрі үшін көз/мақсат жол саны, айырмашылық пен жабысып қалған жазбалар бір дашбордта. Тапсырыс берушінің өз серверіне орнатылады; қаржы деректері ұйым шегінен шықпайды.",
      },
    },
    contactOnly: true,
    noTrial: true,
    demoUrl: "https://dataengine.erpide.com",
    skus: [],
  },
  {
    // Ücretsiz veri ürünü: satış akışı yok (contactOnly + skus boş), detay
    // sayfası /enflasyon'a yönlendirir. Aylık rapor aboneliği üyelikle gelir.
    id: "enflasyon-raporu",
    name: "Gerçek Enflasyon Raporu",
    tagline: "Türkiye'nin hissedilen enflasyonu — 283 parametreli bağımsız endeks",
    description:
      "Resmi rakam ile cebindeki gerçek arasındaki farkı ölçen aylık rapor: hissedilen enflasyon, ENAG ve TÜİK karşılaştırması, 14 sınıf profili (kiracı, kredi çeviren, esnaf, üretici, holding...) ve 283 parametrelik tam döküm. TCMB, EVDS, Eurostat, World Bank ve zincir market verileriyle her ay otomatik hesaplanır. Üyelere tamamen ücretsiz — aylık e-posta raporu dahil.",
    longDescription:
      "ERPIDE Gerçek Enflasyon Raporu, tek bir resmi orana mahkum kalmadan enflasyonu katman katman ölçer: döviz kurları ve ticaret ortağı enflasyonlarından ithal fiyat baskısı, gerçek kira ve gıda endeksleri, borçlanma maliyeti, varlık fiyatları ve tasarruf araçlarının reel getirisi. ENAG kalibrasyonu ile serbest piyasa kalemleri bağımsız ölçüm seviyesine çekilir; elektrik-doğalgaz gibi tarifeli kalemler resmi verisiyle kalır. Sonuç: her sınıfın kendi enflasyonunu gördüğü, tamamen şeffaf ve her ayın 5'inde kendini güncelleyen bir endeks.",
    icon: TrendingUp,
    color: "from-red-500 via-orange-500 to-amber-400",
    domain: "erpide.com/enflasyon",
    category: "web",
    marketScope: "TR",
    contactOnly: true,
    skus: [],
    i18n: {
      en: {
        name: "Real Inflation Report",
        tagline: "Türkiye's felt inflation — an independent 283-parameter index",
        description:
          "A monthly report measuring the gap between the official figure and what people actually experience: felt inflation, ENAG vs TUIK comparison, 14 class-based profiles and a full 283-parameter breakdown. Auto-computed monthly from TCMB, EVDS, Eurostat, World Bank and retail chain data. Free for members, monthly e-mail included.",
      },
      ru: {
        name: "Отчёт о реальной инфляции",
        tagline: "Ощущаемая инфляция Турции — независимый индекс из 283 параметров",
        description:
          "Ежемесячный отчёт о разнице между официальной цифрой и реальной жизнью: ощущаемая инфляция, сравнение ENAG и TUIK, 14 классовых профилей и полная сводка из 283 параметров. Рассчитывается автоматически. Бесплатно для участников.",
      },
      kk: {
        name: "Нақты инфляция есебі",
        tagline: "Түркияның сезілетін инфляциясы — 283 параметрлік тәуелсіз индекс",
        description:
          "Ресми көрсеткіш пен нақты өмір арасындағы айырманы өлшейтін ай сайынғы есеп: сезілетін инфляция, ENAG пен TUIK салыстыруы, 14 таптық профиль және 283 параметрлік толық талдау. Мүшелерге тегін.",
      },
    },
  },
  {
    // Rebrand 2026-06-15: LingoApp → WITMA. Id de "witma"ya geçti; eski
    // /urunler/lingoapp URL'leri next.config redirect ile yeni id'ye 308.
    id: "witma",
    name: "WITMA",
    tagline: "Understand Everything — Dil Engelsiz Sohbet, Arama ve Çeviri",
    description:
      "Sonsuz iletişim. WITMA; mesajlaşma, sesli/görüntülü arama ve canlı altyazılı çeviriyi tek uygulamada birleştirir. Sen kendi dilinde yaz, karşıdaki kendi dilinde okur — anlık çeviri, uçtan uca şifreli. Tek dünya, sonsuz konuşma.",
    longDescription:
      "WITMA; \"Understand Everything\" felsefesiyle tasarlanmış küresel iletişim platformu. İki kişinin her birinin kendi dilinde yazıp kendi dilinde okuduğu, çevirinin tamamen otomatik yapıldığı modern sohbet uygulaması. Sen Türkçe yazarsın, karşıdaki Rusça/Japonca/İngilizce görür; o kendi dilinde yazar, sen Türkçe görürsün. Mesajlar uçtan uca şifreli (ECDH/Curve25519); sunucu sadece şifreli veriye bakar. Sesli ve görüntülü aramada canlı altyazı + dublaj. 60+ dil, KVKK/GDPR uyumlu. iOS App Store ve Google Play'den indir — web/masaüstüne kurulum yok.",
    icon: MessageCircle,
    logoImage: "/products/witma/icon.png",
    logoBackgroundColor: "#0a0f1f",
    color: "from-purple-500 via-pink-500 to-cyan-400",
    // Şimdilik Vercel preview — witma.app domain DNS yönlendirmesi yapılınca
    // burayı "witma.app"a çevir.
    domain: "witma-site.vercel.app",
    category: "mobile",
    marketScope: "GLOBAL",
    i18n: {
      en: {
        name: "WITMA",
        tagline: "Understand Everything — Messaging, Calls and Live Translation Without Borders",
        description: "Infinite connection. WITMA combines messaging, voice/video calls and live-captioned translation in a single app. You write in your language, they read in theirs — instant translation, end-to-end encrypted. One world, infinite conversations.",
      },
      ru: {
        name: "WITMA",
        tagline: "Understand Everything — мессенджер, звонки и живой перевод без границ",
        description: "Бесконечная связь. WITMA объединяет сообщения, голосовые и видеозвонки и живой перевод с субтитрами в одном приложении. Вы пишете на своём языке, собеседник читает на своём — мгновенный перевод, сквозное шифрование. Один мир — бесконечные разговоры.",
      },
      kk: {
        name: "WITMA",
        tagline: "Understand Everything — Тілдік шектеусіз чат, қоңырау және тірі аударма",
        description: "Шексіз байланыс. WITMA хабарламаларды, дауыстық/бейне қоңырауларды және тірі субтитрлі аударманы бір қосымшада біріктіреді. Сіз өз тіліңізде жазасыз, әріптесіңіз өз тілінде оқиды — лезде аударма, ұштан-ұшқа шифрлеу. Бір әлем, шексіз сөйлесулер.",
      },
    },
    comingSoon: true,
    // iOS TestFlight beta review aşamasında (ASC App ID 6779907292 — LingoApp
    // adıyla açılmıştı, rebrand sonrası ASC tarafında "WITMA" olarak rename
    // edildi; Bundle ID ve TestFlight join link KORUNUR).
    testFlightUrl: "https://testflight.apple.com/join/3S1JyZuU",
    webUrl: "https://witma-site.vercel.app",
    // Android: APK preview build var ama Play Store yayını ERPIDE A.Ş. organizasyon hesabına
    // geçiş sonrasına bırakıldı. Yayınlanınca buraya store link gelir.
    // androidPlayStoreUrl: "https://play.google.com/store/apps/details?id=com.aelteam.witma",
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

/** SKU.name veya SKU.description için locale-aware getter. Çevirisi yoksa
 *  default (TR) değere düşer. */
export function getSkuText(sku: SKU, locale: Locale, field: "name" | "description"): string {
  const i18n = sku.i18n?.[locale];
  const v = i18n?.[field];
  if (v) return v;
  return sku[field];
}

/** SKU.features için locale-aware getter (array). Çevirisi yoksa default
 *  (TR) array döner. */
export function getSkuFeatures(sku: SKU, locale: Locale): string[] {
  const i18n = sku.i18n?.[locale];
  if (i18n?.features && i18n.features.length > 0) return i18n.features;
  return sku.features;
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
