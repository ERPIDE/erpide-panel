import { Shield, Briefcase, type LucideIcon } from "lucide-react";

export type ProductId = "finanserpide" | "captchaerpide";
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
