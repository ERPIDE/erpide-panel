import type { Metadata } from "next";

const SITE_URL = "https://www.erpide.com";

export const metadata: Metadata = {
  title: "Ürünler — ERP SaaS, 1C ERP, CANIAS",
  description:
    "ERPIDE ürün portföyü: ERPIDE AI muhasebe SaaS, Pocket bireysel cüzdan, WITMA çeviri-mesajlaşma, 1C:ERP / 1C:Drive / CANIAS ERP distribütörlüğü. Aboneliklerle anında kullanmaya başla.",
  keywords: [
    "ERPIDE ürünler",
    "ERP SaaS",
    "1C ERP Türkiye",
    "1C Drive",
    "CANIAS ERP",
    "AI muhasebe",
    "Pocket",
    "WITMA",
  ],
  alternates: {
    canonical: "/urunler",
    languages: {
      tr: `${SITE_URL}/urunler`,
      en: `${SITE_URL}/urunler?lang=en`,
      ru: `${SITE_URL}/urunler?lang=ru`,
      kk: `${SITE_URL}/urunler?lang=kk`,
      "x-default": `${SITE_URL}/urunler`,
    },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/urunler`,
    siteName: "ERPIDE",
    title: "ERPIDE Ürünleri — ERP SaaS, 1C, CANIAS",
    description: "Tüm ürün portföyümüz: AI destekli SaaS + kurumsal ERP distribütörlüğü.",
    locale: "tr_TR",
    alternateLocale: ["en_US", "ru_RU", "kk_KZ"],
  },
};

export default function UrunlerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
