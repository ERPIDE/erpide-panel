import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PocketERPIDE — Bireysel Cüzdan",
  description: "Memur, mühendis, doktor için AI destekli kişisel cüzdan ve bütçe takibi.",
};

export default function PocketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
