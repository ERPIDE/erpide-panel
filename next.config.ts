import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" — Next.js 16.2.x'in workStore bug'ı bu modda
  // /_global-error prerender'ı kırıyor. Vercel deploy'da standalone'a
  // ihtiyacımız yok, kaldırdık.
  serverExternalPackages: ["iyzipay"],
};

export default nextConfig;
