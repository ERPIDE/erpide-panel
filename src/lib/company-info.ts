export const COMPANY = {
  name: "ERPIDE YAZILIM ANONİM ŞİRKETİ",
  shortName: "ERPIDE YAZILIM A.Ş.",
  brand: "ERPIDE",
  taxOffice: "TODO: VERGI DAIRESI",
  taxNumber: "TODO: VKN",
  mersisNumber: "TODO: MERSIS NO",
  tradeRegistryNumber: "TODO: TICARET SICIL NO",
  kepAddress: "TODO: KEP@hs01.kep.tr",
  address: {
    street: "TODO: Cadde/Sokak No",
    district: "TODO: İlçe",
    city: "İstanbul",
    postalCode: "TODO: Posta Kodu",
    country: "Türkiye",
    full: "TODO: Tam adres bilgisi (Vergi levhanızdaki adres)",
  },
  phone: "+7 771 138 66 35",
  email: "info@erpide.com",
  website: "https://erpide.com",
  supportEmail: "info@erpide.com",
  legalEmail: "info@erpide.com",
  kvkkContact: "info@erpide.com",
  bank: {
    name: "QNB Finansbank",
    accountHolder: "ERPIDE YAZILIM A.Ş.",
    iban: "TODO: TR00 0000 0000 0000 0000 0000 00",
  },
} as const;

export const PRODUCTS = {
  finanserpide: {
    name: "FinansERPIDE",
    description: "Multi-tenant ERP SaaS",
    domain: "finans.erpide.com",
  },
  captchaerpide: {
    name: "CaptchaERPIDE",
    description: "AI Captcha Solver API",
    domain: "captcha.erpide.com",
  },
} as const;

export const LEGAL_UPDATED = "31 Mayıs 2026";
