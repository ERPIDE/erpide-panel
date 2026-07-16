import type { Metadata } from "next";

const SITE_URL = "https://www.erpide.com";

export const metadata: Metadata = {
  title: "Gündem — ERPIDE Haberler, Lansmanlar ve Güncellemeler",
  description:
    "ERPIDE'den haberler: yeni ürün lansmanları, şirket güncellemeleri, sektör paylaşımları ve özel gün kutlamaları. FinansERPIDE, WITMA, 1C ERP ve daha fazlası.",
  keywords: [
    "ERPIDE gündem",
    "ERPIDE haberleri",
    "ERPIDE blog",
    "yeni ürün lansmanı",
    "ERP haberleri",
    "1C ERP duyuru",
    "WITMA lansman",
    "FinansERPIDE",
  ],
  alternates: {
    canonical: "/gundem",
    languages: {
      tr: `${SITE_URL}/gundem`,
      en: `${SITE_URL}/gundem?lang=en`,
      ru: `${SITE_URL}/gundem?lang=ru`,
      kk: `${SITE_URL}/gundem?lang=kk`,
      "x-default": `${SITE_URL}/gundem`,
    },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/gundem`,
    siteName: "ERPIDE",
    title: "ERPIDE Gündem — Haberler ve Lansmanlar",
    description: "Yeni ürün lansmanları, şirket güncellemeleri ve özel gün paylaşımları.",
  },
};

const BLOG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "ERPIDE Gündem",
  url: `${SITE_URL}/gundem`,
  description: "ERPIDE'den haberler, yeni ürün lansmanları ve güncellemeler.",
  publisher: {
    "@type": "Organization",
    name: "ERPİDE Yazılım San. Tic. A.Ş.",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
  },
  inLanguage: ["tr"],
};

export default function GundemLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BLOG_JSON_LD) }}
      />
      {children}
    </>
  );
}
