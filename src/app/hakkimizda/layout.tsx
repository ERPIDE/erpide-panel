import type { Metadata } from "next";

const SITE_URL = "https://www.erpide.com";

export const metadata: Metadata = {
  title: "Hakkımızda — ERPİDE Yazılım Hikayesi",
  description:
    "ERPİDE Yazılım San. Tic. A.Ş. — 2022'de Aydın'da kurulan, 15+ yıllık ERP tecrübesine sahip yazılım firması. Türkiye ve Kazakistan ofisleriyle AI destekli SaaS ve kurumsal ERP çözümleri sunuyoruz. 11 kişilik ekibimizle.",
  alternates: {
    canonical: "/hakkimizda",
    languages: {
      tr: `${SITE_URL}/hakkimizda`,
      en: `${SITE_URL}/hakkimizda?lang=en`,
      ru: `${SITE_URL}/hakkimizda?lang=ru`,
      kk: `${SITE_URL}/hakkimizda?lang=kk`,
      "x-default": `${SITE_URL}/hakkimizda`,
    },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/hakkimizda`,
    siteName: "ERPIDE",
    title: "ERPIDE Hakkında — 15+ yıl ERP tecrübesi, TR + KZ ofis",
    description: "2022 Aydın kuruluşlu yazılım firması. AI destekli SaaS + kurumsal ERP.",
  },
};

const ABOUT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "ERPIDE Hakkımızda",
  url: `${SITE_URL}/hakkimizda`,
  mainEntity: {
    "@type": "Corporation",
    name: "ERPİDE Yazılım San. Tic. A.Ş.",
    url: SITE_URL,
    foundingDate: "2022",
    foundingLocation: { "@type": "Place", name: "Aydın, Türkiye" },
    numberOfEmployees: { "@type": "QuantitativeValue", value: 11 },
    founder: {
      "@type": "Person",
      name: "Ali Murat El",
      jobTitle: "Kurucu / Y. Yazılım Mühendisi",
    },
  },
};

export default function HakkimizdaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_JSON_LD) }}
      />
      {children}
    </>
  );
}
