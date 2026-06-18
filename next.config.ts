import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

// Sentry wrapper. Source map upload için SENTRY_AUTH_TOKEN gerekli (CI'de
// set edilince stack trace satırları okunabilir hale gelir). Token YOKKEN
// build başarılı olur, sadece source map'siz hatalar görürsün — sonradan
// token ekleyince geçmişe dönük source map yüklenmez ama yeni deploy'lar
// hizalanır.
export default withSentryConfig(nextConfig, {
  org: "erpide-yazilim-sanayi-ticaret",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  // Ad-blocker'lar ingest.sentry.io'yu blokluyor; client'tan gelen
  // event'ler /monitoring proxy üzerinden gönderilir.
  tunnelRoute: "/monitoring",
  disableLogger: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
