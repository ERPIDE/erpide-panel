"use client";
import { motion } from "framer-motion";
import { Settings, Database, Code2, Rocket, Headset, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const services = [
  { icon: Settings, title: "CANIAS ERP Danismanligi", desc: "TROIA dilinde ozel gelistirme, modul entegrasyonu, raporlama ve performans optimizasyonu. CANIAS is sureci yonetimi ve ozellestirme.", features: ["TROIA ile ozel modul gelistirme", "Performans optimizasyonu (N+1 sorgu cozumu)", "Ozel raporlama ve analiz ekranlari", "Is sureci otomasyonu"] },
  { icon: Database, title: "1C ERP Cozumleri", desc: "1C:ERP kurulum, lokalizasyon (Turkiye/Kazakistan), muhasebe entegrasyonu ve web servis gelistirme.", features: ["1C:ERP ve 1C:Accounting entegrasyonu", "Kazakistan/Turkiye lokalizasyonu", "Web servis gelistirme (REST/SOAP)", "Muhasebe sablonu modelleme"] },
  { icon: Code2, title: "Ozel Yazilim Gelistirme", desc: "Python, Node.js, React ile ozel otomasyon cozumleri, bot gelistirme ve API entegrasyonu.", features: ["Python otomasyon botlari", "Chrome extension gelistirme", "REST API entegrasyonlari", "Ozel panel ve dashboard"] },
  { icon: Rocket, title: "Dijital Donusum Danismanligi", desc: "Is sureci analizi, teknoloji secimi, yol haritasi olusturma ve degisim yonetimi.", features: ["Mevcut surec analizi", "Teknoloji yol haritasi", "Degisim yonetimi", "ROI analizi ve raporlama"] },
  { icon: Headset, title: "7/24 Bakim ve Destek", desc: "Proaktif izleme, hata tespit ve giderme, guncellemeler ve performans raporlari.", features: ["Kesintisiz teknik destek", "Proaktif sistem izleme", "Haftalik performans raporlari", "Hizli mudahale garantisi"] },
  { icon: GraduationCap, title: "Egitim ve Danismanlik", desc: "Son kullanici egitimleri, yonetici briefingleri ve teknik dokumantasyon.", features: ["Son kullanici egitimleri", "Yonetici bilgilendirme", "Teknik dokumantasyon", "Video egitim icerikleri"] },
];

export default function HizmetlerPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4"><span className="gradient-text">Hizmetlerimiz</span></h1>
            <p className="text-gray-400 max-w-2xl mx-auto">Isletmenizin ihtiyaclarina ozel, uctan uca cozumler sunuyoruz.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/30 transition group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-5">
                  <s.icon size={28} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{s.desc}</p>
                <ul className="space-y-2">
                  {s.features.map((f, j) => (
                    <li key={j} className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
