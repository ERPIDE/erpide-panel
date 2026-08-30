import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/products";
import { listPublished } from "@/lib/social/store";

// Next.js native sitemap.xml generator. Build sırasında erpide.com/sitemap.xml
// olarak yayınlanır. Statik public route'lar + dinamik ürün detayları + 4 dil
// hreflang alternate'leri. Hidden ürünler (ai-kontor gibi) atlanır.
const SITE_URL = "https://www.erpide.com";
const LOCALES = ["tr", "en", "ru", "kk"] as const;

// Gündem post'ları artık DB'den geliyor: panelden yayınlanan bir yazının
// sitemap'e girmesi için deploy beklenmesin diye saatlik yeniden üretim.
export const revalidate = 3600;

function localizedAlternates(path: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const loc of LOCALES) {
    entries[loc] = loc === "tr" ? `${SITE_URL}${path}` : `${SITE_URL}${path}${path.includes("?") ? "&" : "?"}lang=${loc}`;
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Halka açık statik sayfalar — değişim sıklığına göre öncelik atanır.
  const staticRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/urunler", priority: 0.9, changeFrequency: "weekly" },
    { path: "/hizmetler", priority: 0.8, changeFrequency: "monthly" },
    { path: "/hakkimizda", priority: 0.7, changeFrequency: "monthly" },
    { path: "/iletisim", priority: 0.7, changeFrequency: "monthly" },
    { path: "/fiyatlandirma", priority: 0.8, changeFrequency: "weekly" },
    { path: "/gundem", priority: 0.85, changeFrequency: "daily" },
    { path: "/enflasyon", priority: 0.9, changeFrequency: "weekly" },
    { path: "/kunye", priority: 0.3, changeFrequency: "yearly" },
    { path: "/docs", priority: 0.6, changeFrequency: "weekly" },
    { path: "/docs/finanserpide", priority: 0.6, changeFrequency: "weekly" },
    // Sözleşmeler — yasal zorunluluk, indexlenmeli ama düşük priority
    { path: "/sozlesmeler/kvkk", priority: 0.3, changeFrequency: "yearly" },
    { path: "/sozlesmeler/gizlilik-politikasi", priority: 0.3, changeFrequency: "yearly" },
    { path: "/sozlesmeler/kullanim-kosullari", priority: 0.3, changeFrequency: "yearly" },
    { path: "/sozlesmeler/cerez-politikasi", priority: 0.3, changeFrequency: "yearly" },
    { path: "/sozlesmeler/mesafeli-satis", priority: 0.3, changeFrequency: "yearly" },
    { path: "/sozlesmeler/on-bilgilendirme", priority: 0.3, changeFrequency: "yearly" },
    // Play, hesap silme sayfasinin herkese acik olmasini sart kosuyor.
    { path: "/hesap-silme", priority: 0.3, changeFrequency: "yearly" },
    { path: "/sozlesmeler/iade-iptal", priority: 0.3, changeFrequency: "yearly" },
    { path: "/sozlesmeler/cagri-kayit", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    alternates: { languages: localizedAlternates(r.path) },
  }));

  // Ürün detay sayfaları (hidden olanlar atlanır — ai-kontor gibi)
  const productEntries: MetadataRoute.Sitemap = PRODUCTS.filter((p) => !p.hiddenFromPublic).map((p) => ({
    url: `${SITE_URL}/urunler/${p.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
    alternates: { languages: localizedAlternates(`/urunler/${p.id}`) },
  }));

  // Gündem post'ları — her post kendi detay sayfasıyla indexlenir, lastModified
  // yayın tarihinden alınır (Google "Article" rich result'ta tarihi gösterir).
  // İçerik DB'den gelir; slug'ı olmayan (yalnızca sosyal medyaya giden) postlar
  // sitemap'e girmez.
  const published = await listPublished();
  const newsEntries: MetadataRoute.Sitemap = published
    .filter((post) => !!post.slug)
    .map((post) => ({
      url: `${SITE_URL}/gundem/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
      changeFrequency: "monthly",
      priority: 0.65,
      alternates: { languages: localizedAlternates(`/gundem/${post.slug}`) },
    }));

  return [...staticEntries, ...productEntries, ...newsEntries];
}
