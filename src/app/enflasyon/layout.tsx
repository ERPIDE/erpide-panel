import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gerçek Enflasyon Raporu — Türkiye'nin Hissedilen Enflasyonu | ERPIDE",
  description:
    "283 parametreli bağımsız enflasyon analizi: hissedilen enflasyon, resmi TÜFE ve ENAG karşılaştırması, 14 sınıf profili (kiracı, borçlu, esnaf, üretici...), aylık ücretsiz e-posta raporu. TCMB, EVDS, Eurostat ve market verileriyle her ay otomatik hesaplanır.",
  alternates: { canonical: "https://erpide.com/enflasyon" },
  openGraph: {
    title: "Türkiye'nin Gerçek (Hissedilen) Enflasyonu — ERPIDE Raporu",
    description: "Resmi rakam ile cebindeki gerçek arasındaki fark: 283 parametreli bağımsız endeks, sınıf sınıf enflasyon profilleri.",
    url: "https://erpide.com/enflasyon",
  },
};

export default function EnflasyonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
