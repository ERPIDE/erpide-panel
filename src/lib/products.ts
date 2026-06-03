import { Shield, Briefcase, Boxes, Truck, type LucideIcon } from "lucide-react";

export type ProductId = "finanserpide" | "captchaerpide" | "1c-erp" | "1c-drive";
export type BillingCycle = "monthly" | "yearly";
export type Currency = "TRY" | "USD";

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
        id: "finanserpide-starter-monthly",
        productId: "finanserpide",
        name: "Starter",
        description: "Tek şirket, küçük ekipler için",
        price: 999,
        currency: "TRY",
        cycle: "monthly",
        features: [
          "1 şirket (VKN bazlı izole DB)",
          "1 owner + 2 çalışan kullanıcı",
          "Aylık 100 fatura",
          "e-Fatura/e-Arşiv (eFinans)",
          "Banka mutabakatı (manuel)",
          "Cari takip + kar/zarar",
          "E-mail destek",
        ],
      },
      {
        id: "finanserpide-pro-monthly",
        productId: "finanserpide",
        name: "Pro",
        description: "Büyüyen şirketler için",
        price: 1999,
        currency: "TRY",
        cycle: "monthly",
        features: [
          "1 şirket (izole DB)",
          "5 kullanıcı",
          "Sınırsız fatura",
          "e-Fatura/e-Arşiv (eFinans)",
          "Banka mutabakatı (otomatik QNB)",
          "Vergi raporları (KDV/geçici/KV)",
          "Personel + SGK XML",
          "Öncelikli destek (24 saat)",
        ],
        highlight: true,
      },
      {
        id: "finanserpide-enterprise-monthly",
        productId: "finanserpide",
        name: "Enterprise",
        description: "Holdingler ve büyük şirketler",
        price: 4999,
        currency: "TRY",
        cycle: "monthly",
        features: [
          "Sınırsız şirket (multi-tenant)",
          "Sınırsız kullanıcı",
          "Sınırsız fatura",
          "Tüm modüller dahil",
          "Özel API entegrasyonları",
          "Dedicated müşteri yöneticisi",
          "Telefon destek (mesai içi)",
          "SLA garantisi",
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
        price: 299,
        currency: "TRY",
        prices: { TRY: 299, USD: 9.99 },
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
        price: 999,
        currency: "TRY",
        prices: { TRY: 999, USD: 29.99 },
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
        price: 2999,
        currency: "TRY",
        prices: { TRY: 2999, USD: 89.99 },
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
