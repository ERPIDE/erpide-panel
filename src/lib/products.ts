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
  /** Optional live demo URL. Shown as a "Demoyu İncele" button on the product card. */
  demoUrl?: string;
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
    tagline: "AI Destekli Captcha Çözüm API",
    description:
      "Bot geliştiriciler için hızlı, doğru, uygun fiyatlı captcha çözüm servisi. 28ms ortalama süre, %90+ başarı, basit REST API.",
    longDescription:
      "CaptchaERPIDE; slider, text, icon ve puzzle captcha tiplerini AI ile çözen REST API hizmetidir. Bot geliştiricilerin web otomasyonlarında karşılaştıkları captcha bariyerlerini aşması için tasarlandı. 28ms ortalama çözüm süresi, %90+ doğruluk oranı, kullanım dostu REST API. Gerçek zamanlı dashboard, kullanım takibi, lisans key yönetimi.",
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
          "Tüm captcha tipleri",
          "REST API erişimi",
          "30ms ortalama süre",
          "Gerçek zamanlı dashboard",
          "E-mail destek",
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
          "Tüm captcha tipleri",
          "REST API erişimi",
          "Öncelikli işleme (15ms)",
          "Webhook bildirimleri",
          "Öncelikli destek",
        ],
        highlight: true,
      },
      {
        id: "captchaerpide-enterprise-monthly",
        productId: "captchaerpide",
        name: "Enterprise",
        description: "Yüksek hacim",
        price: 89.99,
        currency: "TRY",
        prices: { USD: 89.99 },
        cycle: "monthly",
        features: [
          "Sınırsız çözüm",
          "Tüm captcha tipleri + özel",
          "Dedicated worker pool",
          "10ms hedef süre",
          "SLA garantisi",
          "Telefon destek",
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
    tagline: "Kurumsal ERP Çözümü — Üretim, Lojistik, Finans",
    description:
      "1C:ERP; orta ve büyük ölçekli üretim/lojistik firmaları için tam kapsamlı kurumsal kaynak planlama. Üretim planlama, MRP, depo yönetimi, finans, bütçeleme — hepsi tek platformda. ERPIDE olarak kurulum, eğitim, yerelleştirme ve destek sunarız.",
    longDescription:
      "1C:ERP, üretim odaklı orta-büyük şirketler için Rusya ve Türk Cumhuriyetleri pazarında en yaygın kullanılan ERP'lerden biridir. Modüller: üretim planlama (MPS), malzeme ihtiyaç planlama (MRP), tedarik zinciri, depo, satış, finans, bütçeleme, regulated raporlama. ERPIDE; lisanslama, kurulum, yerelleştirme (TR/KZ vergi mevzuatı), kullanıcı eğitimi, özelleştirme ve canlı destek hizmetleri sunar. Fiyatlandırma şirket büyüklüğüne, kullanıcı sayısına ve modül ihtiyacına göre değişir — detay için iletişime geçin.",
    icon: Boxes,
    color: "from-indigo-600 to-blue-700",
    domain: "1c-erp.erpide.com",
    contactOnly: true,
    demoUrl: "https://app902777.1capp.net/ERPWEDemo/en_US/",
    skus: [],
  },
  {
    id: "1c-drive",
    name: "1C:Drive",
    tagline: "KOBİ İçin Hızlı ERP — Operasyon, CRM, Stok",
    description:
      "1C:Drive; küçük ve orta ölçekli işletmeler için hazır bulut ERP. Satış, satınalma, stok, hizmet yönetimi, müşteri ilişkileri, basit muhasebe — kısa sürede devreye alın. ERPIDE'den kurulum + destek paketleri ile sıfırdan operasyonel olun.",
    longDescription:
      "1C:Drive; KOBİ'ler için hızlı devreye alınan, operasyon odaklı bulut ERP'dir. Satış sürecinin başından sonuna (teklif, sipariş, sevkiyat, fatura), satınalma, stok takibi, depo, basit muhasebe, müşteri/tedarikçi ilişkileri ve hizmet yönetimi kapsanır. ERPIDE; demo kurulum, veri taşıma, kullanıcı eğitimi ve aylık destek paketleri sunar. Fiyatlandırma kullanıcı sayısı ve eklenecek modüllere göre değişir — iletişime geçin, ihtiyacınıza özel teklif hazırlayalım.",
    icon: Truck,
    color: "from-cyan-600 to-teal-600",
    domain: "1c-drive.erpide.com",
    contactOnly: true,
    demoUrl: "https://app.1c-demo.de/drive_demo_loc_tr/tr/",
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
