import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "ERPIDE - Enterprise ERP Solutions & Software Consulting",
  description: "ERPIDE Software - CANIAS ERP, 1C ERP, ERPIDE Captcha, ERPocket, custom software development, automation and digital transformation solutions.",
  keywords: ["ERP", "CANIAS", "1C ERP", "software consulting", "digital transformation", "captcha solver", "ERPocket", "1C Accounting"],
  openGraph: {
    title: "ERPIDE - Enterprise ERP Solutions",
    description: "Empowering your business for the digital age.",
    url: "https://www.erpide.com",
    siteName: "ERPIDE",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
