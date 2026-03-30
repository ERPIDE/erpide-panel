"use client";
import { motion } from "framer-motion";
import { Settings, Database, Code2, Rocket, Headset, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const services = [
  { icon: Settings, title: "CANIAS ERP Danışmanlığı", desc: "TROIA dilinde özel geliştirme, modül entegrasyonu, raporlama ve performans optimizasyonu. CANIAS iş süreci yönetimi ve özelleştirme.", features: ["TROIA ile özel modül geliştirme", "Performans optimizasyonu (N+1 sorgu çözümü)", "Özel raporlama ve analiz ekranları", "İş süreci otomasyonu"] },
  { icon: Database, title: "1C ERP Çözümleri", desc: "1C:ERP kurulum, lokalizasyon (Türkiye/Kazakistan), muhasebe entegrasyonu ve web servis geliştirme.", features: ["1C:ERP ve 1C:Accounting entegrasyonu", "Kazakistan/Türkiye lokalizasyonu", "Web servis geliştirme (REST/SOAP)", "Muhasebe şablonu modelleme"] },
  { icon: Code2, title: "Özel Yazılım Geliştirme", desc: "Python, Node.js, React ile özel otomasyon çözümleri, bot geliştirme ve API entegrasyonu.", features: ["Python otomasyon botları", "Chrome extension geliştirme", "REST API entegrasyonları", "Özel panel ve dashboard"] },
  { icon: Rocket, title: "Dijital Dönüşüm Danışmanlığı", desc: "İş süreci analizi, teknoloji seçimi, yol haritası oluşturma ve değişim yönetimi.", features: ["Mevcut süreç analizi", "Teknoloji yol haritası", "Değişim yönetimi", "ROI analizi ve raporlama"] },
  { icon: Headset, title: "7/24 Bakım ve Destek", desc: "Proaktif izleme, hata tespit ve giderme, güncellemeler ve performans raporları.", features: ["Kesintisiz teknik destek", "Proaktif sistem izleme", "Haftalık performans raporları", "Hızlı müdahale garantisi"] },
  { icon: GraduationCap, title: "Eğitim ve Danışmanlık", desc: "Son kullanıcı eğitimleri, yönetici briefingleri ve teknik dokümantasyon.", features: ["Son kullanıcı eğitimleri", "Yönetici bilgilendirme", "Teknik dokümantasyon", "Video eğitim içerikleri"] },
];

export default function HizmetlerPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4"><span className="gradient-text">Hizmetlerimiz</span></h1>
            <p className="text-gray-400 max-w-2xl mx-auto">İşletmenizin ihtiyaçlarına özel, uçtan uca çözümler sunuyoruz.</p>
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
