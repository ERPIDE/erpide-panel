import type { MetadataRoute } from "next";

// Next.js native robots.txt generator. Build sırasında erpide.com/robots.txt
// olarak yayınlanır. AI scraper'ları (GPTBot, ClaudeBot, Google-Extended)
// allow ediyoruz; gizli/işlevsel route'ları (api, admin, hesabim, sepet,
// ödeme akışı, kullanıcı doğrulama) disallow.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/hesabim/",
          "/sepet",
          "/odeme/",
          "/giris",
          "/uye-ol",
          "/dogrula",
          "/sifremi-unuttum",
          "/onay-ver",
          "/_next/",
        ],
      },
    ],
    sitemap: "https://www.erpide.com/sitemap.xml",
    host: "https://www.erpide.com",
  };
}
