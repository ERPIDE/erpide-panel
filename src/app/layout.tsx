import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { CartProvider } from "@/components/CartProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import VapiWidgetMount from "@/components/VapiWidgetMount";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

const SITE_URL = "https://www.erpide.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ERPIDE — Kurumsal ERP Çözümleri ve Yazılım Danışmanlığı",
    template: "%s | ERPIDE",
  },
  description:
    "ERPIDE; AI destekli ERP SaaS (FinansERPIDE), captcha çözüm API'si (CaptchaERPIDE), 1C:ERP/1C:Drive ve CANIAS ERP distribütörlüğü, özel yazılım geliştirme. Türkiye + Kazakistan ofisleriyle kurumsal dijital dönüşüm partneri.",
  keywords: [
    "ERP yazılım",
    "1C ERP Türkiye",
    "1C ERP Kazakistan",
    "1C:Drive",
    "CANIAS ERP",
    "FinansERPIDE",
    "CaptchaERPIDE",
    "captcha çözücü API",
    "ERP entegrasyon",
    "AI muhasebe",
    "e-Fatura",
    "ERP danışmanlık",
    "Aydın yazılım",
    "İzmir ERP",
    "Astana ERP",
    "Kazakistan Türk şirket ERP",
    "üretim ERP",
    "MRP",
    "SaaS muhasebe",
    "digital transformation",
  ],
  authors: [{ name: "ERPİDE Yazılım San. Tic. A.Ş." }],
  creator: "ERPİDE Yazılım San. Tic. A.Ş.",
  publisher: "ERPİDE Yazılım San. Tic. A.Ş.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Search Console (Google) ve Bing Webmaster doğrulamaları. Token'lar env
  // vars'tan geldiği için kod'da plain duruyor — yine de meta tag olarak
  // public, secret değil. Eksik olduklarında metadata bu alanı atlar.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_VERIFICATION || undefined,
    other: process.env.BING_VERIFICATION
      ? { "msvalidate.01": process.env.BING_VERIFICATION }
      : undefined,
  },
  alternates: {
    canonical: "/",
    languages: {
      tr: "/",
      en: "/?lang=en",
      ru: "/?lang=ru",
      kk: "/?lang=kk",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "ERPIDE",
    title: "ERPIDE — Kurumsal ERP Çözümleri ve Yazılım Danışmanlığı",
    description:
      "AI destekli ERP SaaS, captcha çözüm API, 1C ERP & CANIAS distribütörlüğü, özel yazılım geliştirme. Türkiye + Kazakistan.",
    locale: "tr_TR",
    alternateLocale: ["en_US", "ru_RU", "kk_KZ"],
    images: [
      {
        url: "/logo-wide.png",
        width: 1200,
        height: 630,
        alt: "ERPIDE Kurumsal ERP Çözümleri",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ERPIDE — Kurumsal ERP Çözümleri",
    description:
      "AI destekli ERP SaaS, captcha çözüm API, 1C ERP & CANIAS distribütörlüğü. Türkiye + Kazakistan.",
    images: ["/logo-wide.png"],
  },
  category: "technology",
};

// JSON-LD: Google Knowledge Graph'a kurumsal kimliği taşıyan structured data.
// Aydın ana ofis + Astana KZ ofisi, ürün portföyü, iletişim. SEO için kritik
// çünkü "ERPIDE" araması ve "Kazakistan ERP" gibi local intent araması için
// rich result eligibility sağlar.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Corporation",
  name: "ERPİDE Yazılım San. Tic. A.Ş.",
  alternateName: ["ERPIDE", "ERPIDE Software"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo-wide.png`,
  description:
    "Kurumsal ERP çözümleri, AI destekli SaaS ürünleri, captcha çözüm API, 1C ERP & CANIAS ERP distribütörlüğü ve özel yazılım geliştirme hizmetleri sunan teknoloji şirketi.",
  foundingDate: "2022",
  foundingLocation: {
    "@type": "Place",
    name: "Aydın, Türkiye",
  },
  taxID: "3680528472",
  vatID: "3680528472",
  numberOfEmployees: { "@type": "QuantitativeValue", value: 11 },
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
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+90-850-447-42-37",
      contactType: "customer service",
      areaServed: ["TR", "KZ"],
      availableLanguage: ["Turkish", "English", "Russian", "Kazakh"],
    },
  ],
  sameAs: [
    "https://www.linkedin.com/company/erpide",
    "https://www.instagram.com/erpide",
  ],
  knowsAbout: [
    "Enterprise Resource Planning",
    "1C:ERP",
    "1C:Drive",
    "CANIAS ERP",
    "AI-powered SaaS",
    "Captcha Solving API",
    "e-Fatura",
    "Multi-tenant SaaS",
    "Software Consulting",
    "Digital Transformation",
  ],
  brand: {
    "@type": "Brand",
    name: "ERPIDE",
    logo: `${SITE_URL}/logo.png`,
  },
  makesOffer: [
    { "@type": "Offer", itemOffered: { "@type": "SoftwareApplication", name: "FinansERPIDE", applicationCategory: "BusinessApplication" } },
    { "@type": "Offer", itemOffered: { "@type": "SoftwareApplication", name: "CaptchaERPIDE", applicationCategory: "WebApplication" } },
    { "@type": "Offer", itemOffered: { "@type": "SoftwareApplication", name: "Pocket", applicationCategory: "FinanceApplication" } },
    { "@type": "Offer", itemOffered: { "@type": "SoftwareApplication", name: "WITMA", applicationCategory: "CommunicationApplication" } },
    { "@type": "Offer", itemOffered: { "@type": "Product", name: "1C:ERP", category: "ERP Software" } },
    { "@type": "Offer", itemOffered: { "@type": "Product", name: "1C:Drive", category: "ERP Software" } },
    { "@type": "Offer", itemOffered: { "@type": "Product", name: "CANIAS ERP", category: "ERP Software" } },
  ],
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ERPIDE",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/urunler?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: ["tr", "en", "ru", "kk"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // GA4 sadece NEXT_PUBLIC_GA_MEASUREMENT_ID set olduğunda yüklenir —
  // local dev'de analytics noise olmasın diye opt-in. Production'da Vercel
  // env'inde G-XXXXXXXXXX formatında set edilir.
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', { anonymize_ip: true });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={inter.className}>
        <I18nProvider>
          <CurrencyProvider>
            <CartProvider>{children}</CartProvider>
          </CurrencyProvider>
        </I18nProvider>
        <VapiWidgetMount />
      </body>
    </html>
  );
}
