import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERPIDE - Kurumsal ERP Cozumleri ve Yazilim Danismanligi",
  description: "ERPIDE Yazilim A.S. - CANIAS ERP, 1C ERP, ozel yazilim gelistirme, otomasyon ve dijital donusum cozumleri.",
  keywords: ["ERP", "CANIAS", "1C ERP", "yazilim danismanligi", "dijital donusum"],
  openGraph: {
    title: "ERPIDE - Kurumsal ERP Cozumleri",
    description: "Isletmenizi dijital caga tasiyoruz.",
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
