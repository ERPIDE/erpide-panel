import type { Metadata } from "next";

const SITE_URL = "https://www.erpide.com";

export const metadata: Metadata = {
  title: "İletişim — ERPIDE Destek, Satış, Demo Talep",
  description:
    "ERPIDE iletişim: Türkiye Aydın merkez ofis, Kazakistan Astana ofisi. WhatsApp 0850 447 42 37, e-posta info@erpide.com. ERP kurulum, demo talep, satış öncesi danışmanlık için 7/24 AI asistanımıza yazabilirsiniz.",
  alternates: {
    canonical: "/iletisim",
    languages: {
      tr: `${SITE_URL}/iletisim`,
      en: `${SITE_URL}/iletisim?lang=en`,
      ru: `${SITE_URL}/iletisim?lang=ru`,
      kk: `${SITE_URL}/iletisim?lang=kk`,
      "x-default": `${SITE_URL}/iletisim`,
    },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/iletisim`,
    siteName: "ERPIDE",
    title: "ERPIDE İletişim — TR + KZ ofis, 7/24 destek",
    description: "Aydın + Astana ofis, WhatsApp, AI asistan, demo talep.",
  },
};

const CONTACT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "ERPIDE İletişim",
  url: `${SITE_URL}/iletisim`,
  mainEntity: {
    "@type": "Organization",
    name: "ERPİDE Yazılım San. Tic. A.Ş.",
    url: SITE_URL,
    telephone: "+90-850-447-42-37",
    address: [
      {
        "@type": "PostalAddress",
        streetAddress: "Ilıcabaşı Mah. Denizli Blv. No:91",
        addressLocality: "Efeler",
        addressRegion: "Aydın",
        postalCode: "09020",
        addressCountry: "TR",
      },
      {
        "@type": "PostalAddress",
        addressLocality: "Astana",
        addressCountry: "KZ",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-850-447-42-37",
      contactType: "customer service",
      areaServed: ["TR", "KZ"],
      availableLanguage: ["Turkish", "English", "Russian", "Kazakh"],
    },
  },
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(CONTACT_JSON_LD) }}
      />
      {children}
    </>
  );
}
