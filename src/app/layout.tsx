import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERPIDE - Kurumsal ERP Çözümleri ve Yazılım Danışmanlığı",
  description: "ERPIDE Yazılım A.Ş. - CANIAS ERP, 1C ERP, özel yazılım geliştirme, otomasyon ve dijital dönüşüm çözümleri.",
  keywords: ["ERP", "CANIAS", "1C ERP", "yazılım danışmanlığı", "dijital dönüşüm"],
  openGraph: {
    title: "ERPIDE - Kurumsal ERP Çözümleri",
    description: "İşletmenizi dijital çağa taşıyoruz.",
    url: "https://www.erpide.com",
    siteName: "ERPIDE",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
