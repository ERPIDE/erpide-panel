import type { Metadata } from "next";
import { getProduct, PRODUCTS } from "@/lib/products";

const SITE_URL = "https://www.erpide.com";
const LOCALES = ["tr", "en", "ru", "kk"] as const;

// Ürün detay sayfası client component olduğu için per-product metadata bu
// layout'tan server-side üretiliyor. Hidden ürünler (ai-kontor) için noindex
// + minimal metadata. Her ürün için JSON-LD SoftwareApplication / Product
// schema da yayınlanıyor → Google rich result eligibility.

type Params = { productId: string };

export async function generateStaticParams() {
  return PRODUCTS.filter((p) => !p.hiddenFromPublic).map((p) => ({ productId: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { productId } = await params;
  const product = getProduct(productId);

  if (!product || product.hiddenFromPublic) {
    return {
      title: "Ürün bulunamadı",
      robots: { index: false, follow: false },
    };
  }

  const path = `/urunler/${product.id}`;
  const url = `${SITE_URL}${path}`;
  const ogImage = product.logoImage ? `${SITE_URL}${product.logoImage}` : `${SITE_URL}/logo-wide.png`;

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = loc === "tr" ? url : `${url}?lang=${loc}`;
  }

  return {
    title: `${product.name} — ${product.tagline}`,
    description: product.description.slice(0, 200),
    keywords: [product.name, product.tagline, "ERPIDE", "ERP", product.category],
    alternates: {
      canonical: path,
      languages: { ...languages, "x-default": url },
    },
    openGraph: {
      type: "website",
      url,
      siteName: "ERPIDE",
      title: `${product.name} — ${product.tagline}`,
      description: product.description.slice(0, 200),
      images: [{ url: ogImage, alt: `${product.name} logo` }],
      locale: "tr_TR",
      alternateLocale: ["en_US", "ru_RU", "kk_KZ"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — ${product.tagline}`,
      description: product.description.slice(0, 200),
      images: [ogImage],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { productId } = await params;
  const product = getProduct(productId);

  // Hidden veya bulunamayan ürünler için JSON-LD yayınlama
  if (!product || product.hiddenFromPublic) return <>{children}</>;

  const url = `${SITE_URL}/urunler/${product.id}`;
  const image = product.logoImage ? `${SITE_URL}${product.logoImage}` : `${SITE_URL}/logo-wide.png`;

  // Aylık fiyat olan SKU varsa offers'a dahil et. ContactOnly ürünler için
  // offers verilmez, isQuotation true gibi alanlar Google'ın tanıdığı şema
  // değil — boş bırakıp brand sinyali öne çıkarılır.
  const monthlySkus = product.skus.filter((s) => s.cycle === "monthly" && (s.kind === "base" || s.kind === "standalone" || !s.kind));
  const offers = monthlySkus.length > 0
    ? monthlySkus.map((s) => ({
        "@type": "Offer",
        name: s.name,
        price: s.prices?.USD ?? s.price,
        priceCurrency: s.prices?.USD ? "USD" : "TRY",
        url,
        availability: "https://schema.org/InStock",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: s.prices?.USD ?? s.price,
          priceCurrency: s.prices?.USD ? "USD" : "TRY",
          billingIncrement: 1,
          unitText: "MONTH",
        },
      }))
    : undefined;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.longDescription,
    url,
    image,
    applicationCategory: product.category === "mobile" ? "MobileApplication" : "BusinessApplication",
    operatingSystem: product.category === "mobile" ? "iOS, Android" : "Web",
    inLanguage: ["tr", "en", "ru", "kk"],
    brand: { "@type": "Brand", name: "ERPIDE", url: SITE_URL },
    publisher: { "@type": "Organization", name: "ERPİDE Yazılım San. Tic. A.Ş.", url: SITE_URL },
  };
  if (offers) productJsonLd.offers = offers;
  if (product.officialUrl) productJsonLd.sameAs = [product.officialUrl];

  // Breadcrumb — Anasayfa → Ürünler → [Ürün Adı]. Google sitelinks içinde
  // breadcrumb gösterir.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Ürünler", item: `${SITE_URL}/urunler` },
      { "@type": "ListItem", position: 3, name: product.name, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
