export type ProductId = "finanserpide" | "captchaerpide";
export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: string;
  productId: ProductId;
  productName: string;
  name: string;
  description: string;
  price: number;
  currency: "TRY";
  cycle: BillingCycle;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "finanserpide-starter-monthly",
    productId: "finanserpide",
    productName: "FinansERPIDE",
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
    productName: "FinansERPIDE",
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
    productName: "FinansERPIDE",
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
  {
    id: "captchaerpide-starter-monthly",
    productId: "captchaerpide",
    productName: "CaptchaERPIDE",
    name: "Starter",
    description: "Bot geliştiriciler için",
    price: 299,
    currency: "TRY",
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
    productName: "CaptchaERPIDE",
    name: "Pro",
    description: "Profesyonel kullanım",
    price: 999,
    currency: "TRY",
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
    productName: "CaptchaERPIDE",
    name: "Enterprise",
    description: "Yüksek hacim",
    price: 2999,
    currency: "TRY",
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
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function getPlansByProduct(productId: ProductId): Plan[] {
  return PLANS.filter((p) => p.productId === productId);
}
