import type { Metadata } from "next";

const SITE_URL = "https://www.erpide.com";

export const metadata: Metadata = {
  title: "Hizmetlerimiz — ERP Danışmanlık, Yazılım Geliştirme, Entegrasyon",
  description:
    "ERPIDE yazılım danışmanlığı: 1C ERP kurulum & yerelleştirme, CANIAS ERP entegrasyon, AI destekli özel yazılım geliştirme, e-Fatura entegrasyonu, dijital dönüşüm. Türkiye + Kazakistan ofislerimizden bölgesel destek.",
  alternates: {
    canonical: "/hizmetler",
    languages: {
      tr: `${SITE_URL}/hizmetler`,
      en: `${SITE_URL}/hizmetler?lang=en`,
      ru: `${SITE_URL}/hizmetler?lang=ru`,
      kk: `${SITE_URL}/hizmetler?lang=kk`,
      "x-default": `${SITE_URL}/hizmetler`,
    },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/hizmetler`,
    siteName: "ERPIDE",
    title: "ERPIDE Hizmetleri — ERP Danışmanlık & Yazılım Geliştirme",
    description: "1C ERP kurulum, CANIAS entegrasyon, özel yazılım, dijital dönüşüm.",
  },
};

const SERVICE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "ERPIDE Yazılım Danışmanlık Hizmetleri",
  description: "1C ERP, CANIAS ERP kurulum, yerelleştirme, eğitim ve özel yazılım geliştirme.",
  provider: { "@type": "Organization", name: "ERPİDE Yazılım San. Tic. A.Ş.", url: SITE_URL },
  areaServed: [
    { "@type": "Country", name: "Türkiye" },
    { "@type": "Country", name: "Kazakistan" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Hizmetler",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "1C ERP Kurulum ve Yerelleştirme" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "CANIAS ERP Entegrasyon" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Özel Yazılım Geliştirme" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "e-Fatura Entegrasyonu" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Dijital Dönüşüm Danışmanlığı" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "ERP Eğitim ve Destek" } },
    ],
  },
};

export default function HizmetlerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_JSON_LD) }}
      />
      {children}
    </>
  );
}
