import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PRODUCTS } from "@/lib/products";
import { BookOpen, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Dökümantasyon | ERPIDE",
  description: "ERPIDE SaaS ürünleri için kurulum ve entegrasyon kılavuzları.",
};

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-12">
            <BookOpen className="mx-auto mb-4 text-blue-400" size={40} />
            <h1 className="text-4xl font-bold mb-2"><span className="gradient-text">Dökümantasyon</span></h1>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              ERPIDE ürünlerini nasıl kullanacağına dair kurulum ve entegrasyon kılavuzları.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-4">
            {PRODUCTS.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.id}
                  href={`/docs/${p.id}`}
                  className="group p-6 rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/30 transition"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{p.name}</h2>
                  <p className="text-sm text-gray-400 mb-4">{p.tagline}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-blue-400 group-hover:gap-2 transition-all">
                    Kılavuza git <ArrowRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
