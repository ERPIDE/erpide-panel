import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["iyzipay"],

  // Rebrand redirect'leri — eski paylaşılmış URL'ler 404 yememeli, yeni
  // id'ye 308 permanent redirect. SEO için önemli; backlink değeri taşır.
  async redirects() {
    return [
      // LingoApp → WITMA (rebrand 2026-06-15)
      { source: "/urunler/lingoapp", destination: "/urunler/witma", permanent: true },
    ];
  },
};

export default nextConfig;
