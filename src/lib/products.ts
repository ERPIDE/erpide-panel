import { Shield, Briefcase, Boxes, Truck, Sparkles, Wallet, type LucideIcon } from "lucide-react";

export type ProductId =
  | "finanserpide"
  | "captchaerpide"
  | "ai-kontor"
  | "pocketerpide"
  | "1c-erp"
  | "1c-drive";
export type BillingCycle = "monthly" | "yearly";
export type Currency = "TRY" | "USD";

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

export interface Product {
  id: ProductId;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  icon: LucideIcon;
  color: string;
  domain: string;
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
    comingSoon: true,
    skus: [
      {
        id: "pocketerpide-personal-monthly",
        productId: "pocketerpide",
        name: "Personal",
        description: "Bireysel kullanıcılar için tek paket — sınırsız özellik",
        price: 3,
        currency: "TRY",
        prices: { USD: 3 },
        cycle: "monthly",
        kind: "standalone",
        features: [
          "Brüt/Net maaş tanımı (TR vergi diliminden net hesabı)",
          "Periyodik gelir (maaş, kira, ek iş)",
          "AI ile fatura kayıt (yaz / söyle / fotoğraf at)",
          "Kategori bazlı harcama analizi",
          "Aylık özet + kalan bütçe",
          "Hedef bütçe (örn 'ayda 5000 TL biriktir')",
          "Vergi iadesi hesabı (yıl sonu)",
          "Mobil + web — her yerden eriş",
        ],
        highlight: true,
      },
    ],
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
    contactOnly: true,
    // Önceki demoUrl (app.1c-demo.de) cevap vermiyor — 1ci.com sayfasını yönlendir.
    demoUrl: "https://drive-lite.1ci.com/",
    officialUrl: "https://www.1ci.com/applications/1c-drive/",
    skus: [],
  },
];

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
