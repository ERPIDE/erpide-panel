import type { Metadata } from "next";
import { getNewsPost, getNewsSorted } from "@/lib/news";

const SITE_URL = "https://www.erpide.com";
const LOCALES = ["tr", "en", "ru", "kk"] as const;

type Params = { slug: string };

export async function generateStaticParams() {
  return getNewsSorted().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getNewsPost(slug);
  if (!post) {
    return { title: "Bulunamadı", robots: { index: false, follow: false } };
  }
  const path = `/gundem/${post.slug}`;
  const url = `${SITE_URL}${path}`;
  const ogImage = post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/logo-wide.png`;
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = loc === "tr" ? url : `${url}?lang=${loc}`;
  }
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: path, languages: { ...languages, "x-default": url } },
    openGraph: {
      type: "article",
      url,
      siteName: "ERPIDE",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      images: [{ url: ogImage, alt: post.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

export default async function GundemPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getNewsPost(slug);
  if (!post) return <>{children}</>;

  const url = `${SITE_URL}/gundem/${post.slug}`;
  const image = post.image ? `${SITE_URL}${post.image}` : `${SITE_URL}/logo-wide.png`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    url,
    image,
    author: { "@type": "Organization", name: "ERPIDE", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "ERPİDE Yazılım San. Tic. A.Ş.",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Gündem", item: `${SITE_URL}/gundem` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
