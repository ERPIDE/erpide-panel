import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { COMPANY } from "@/lib/company-info";

export const metadata: Metadata = {
  title: "Künye | ERPIDE",
  description: "ERPİDE YAZILIM SAN. TİC. A.Ş. resmi şirket bilgileri.",
};

export default function KunyePage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="gradient-text">Künye</span>
            </h1>
            <p className="text-gray-400 text-sm">
              6563 sayılı Elektronik Ticaret Kanunu ve Mesafeli Sözleşmeler Yönetmeliği kapsamında hizmet sağlayıcı bilgileri.
            </p>
          </header>

          <section className="p-6 rounded-2xl bg-[#111118] border border-white/5 mb-6">
            <h2 className="font-semibold text-white mb-4">Ünvan ve Sicil</h2>
            <Row label="Ticari Ünvan" value={COMPANY.name} />
            <Row label="Marka" value={COMPANY.brand} />
            <Row label="Vergi Dairesi" value={COMPANY.taxOffice} />
            <Row label="Vergi Kimlik No (VKN)" value={COMPANY.taxNumber} />
            <Row label="MERSİS No" value={COMPANY.mersisNumber} />
            <Row label="Ticaret Sicil No" value={COMPANY.tradeRegistryNumber} />
            <Row label="NACE Faaliyet Kodu" value={COMPANY.activityCode} />
            <Row label="Tescil Tarihi" value={COMPANY.registrationDate} />
          </section>

          <section className="p-6 rounded-2xl bg-[#111118] border border-white/5 mb-6">
            <h2 className="font-semibold text-white mb-4">Adres</h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              {COMPANY.address.street}<br />
              {COMPANY.address.district} / {COMPANY.address.city} {COMPANY.address.postalCode}<br />
              {COMPANY.address.country}
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-[#111118] border border-white/5">
            <h2 className="font-semibold text-white mb-4">İletişim</h2>
            <Row label="E-posta" value={<a href={`mailto:${COMPANY.email}`} className="text-blue-400 hover:underline">{COMPANY.email}</a>} />
            <Row label="Telefon" value={COMPANY.phone} />
            <Row label="KEP Adresi" value={COMPANY.kepAddress.startsWith("TODO") ? <span className="text-gray-500 italic">Yakında</span> : COMPANY.kepAddress} />
            <Row label="Web" value={<a href={COMPANY.website} className="text-blue-400 hover:underline">{COMPANY.website}</a>} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-200 font-mono">{value}</span>
    </div>
  );
}
