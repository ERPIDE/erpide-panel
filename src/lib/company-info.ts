export const COMPANY = {
  name: "ERPİDE YAZILIM SANAYİ TİCARET ANONİM ŞİRKETİ",
  shortName: "ERPİDE YAZILIM SAN. TİC. A.Ş.",
  brand: "ERPIDE",
  taxOffice: "Güzelhisar",
  taxNumber: "3680528472",
  mersisNumber: "0368052847200001",
  tradeRegistryNumber: "21990 (Aydın Ticaret Sicili Müdürlüğü)",
  activityCode: "621000 - Bilgisayar Programlama Faaliyetleri",
  registrationDate: "13.06.2023",
  kepAddress: "TODO: erpide@hs01.kep.tr (kullanıcı verecek)",
  address: {
    street: "Ilıcabaşı Mahallesi, Denizli Bulvarı No: 91",
    district: "Efeler",
    city: "Aydın",
    postalCode: "09100",
    country: "Türkiye",
    full: "Ilıcabaşı Mah. Denizli Bulvarı No: 91, Efeler / Aydın",
  },
  phone: "+7 771 138 66 35",
  phoneTR: "TODO: Türkiye iletişim numarası (kullanıcı verecek)",
  email: "info@erpide.com",
  website: "https://erpide.com",
  supportEmail: "info@erpide.com",
  legalEmail: "info@erpide.com",
  kvkkContact: "info@erpide.com",
  bank: {
    name: "QNB Finansbank",
    accountHolder: "ERPİDE YAZILIM SAN. TİC. A.Ş.",
    iban: "TODO: TR.. (yalnızca dahili kullanım, müşteriye gösterilmez)",
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
