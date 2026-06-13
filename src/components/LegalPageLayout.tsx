import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { LEGAL_UPDATED } from "@/lib/company-info";

export default function LegalPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
          >
            &larr; Ana sayfa
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">{title}</span>
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Son güncelleme: {LEGAL_UPDATED}
          </p>
          <article className="prose-legal text-gray-300 leading-relaxed space-y-6">
            {children}
          </article>
          <div className="mt-16 pt-8 border-t border-white/5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-gray-400 hover:text-blue-400 transition"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const LEGAL_LINKS = [
  { href: "/sozlesmeler/kullanim-kosullari", label: "Kullanım Koşulları" },
  { href: "/sozlesmeler/gizlilik-politikasi", label: "Gizlilik Politikası" },
  { href: "/sozlesmeler/kvkk", label: "KVKK Aydınlatma Metni" },
  { href: "/sozlesmeler/cagri-kayit", label: "Çağrı Kayıt Aydınlatma" },
  { href: "/sozlesmeler/mesafeli-satis", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/sozlesmeler/on-bilgilendirme", label: "Ön Bilgilendirme Formu" },
  { href: "/sozlesmeler/iade-iptal", label: "İade ve İptal Politikası" },
  { href: "/sozlesmeler/cerez-politikasi", label: "Çerez Politikası" },
];
