"use client";
import { motion } from "framer-motion";
import { Settings, Database, Code2, Rocket, Headset, GraduationCap, Globe, Smartphone, Plug } from "lucide-react";

const services = [
  { icon: Settings, title: "CANIAS ERP Danışmanlığı", desc: "TROIA diliyle özel geliştirme, modül entegrasyonu, performans optimizasyonu ve raporlama çözümleri." },
  { icon: Database, title: "1C ERP Çözümleri", desc: "1C:ERP kurulum, lokalizasyon, muhasebe entegrasyonu, web servis geliştirme ve ACC senkronizasyonu." },
  { icon: Code2, title: "Özel Yazılım Geliştirme", desc: "Python, Node.js, React ile özel otomasyon, bot geliştirme ve API entegrasyon çözümleri." },
  { icon: Globe, title: "Web Sitesi Geliştirme", desc: "Kurumsal web siteleri, e-ticaret platformları, müşteri panelleri ve yönetim dashboardları." },
  { icon: Smartphone, title: "Mobil Uygulama", desc: "iOS ve Android için native ve cross-platform mobil uygulama geliştirme çözümleri." },
  { icon: Plug, title: "API Entegrasyonları", desc: "Üçüncü parti sistemlerle REST/SOAP API entegrasyonu, veri senkronizasyonu ve otomasyon." },
  { icon: Rocket, title: "Dijital Dönüşüm", desc: "İş süreçlerinizi dijitalleştirin. Verimlilik artışı ve maliyet optimizasyonu sağlayalım." },
  { icon: Headset, title: "7/24 Bakım ve Destek", desc: "Kesintisiz teknik destek, proaktif izleme, hızlı müdahale ve düzeltici aksiyonlar." },
  { icon: GraduationCap, title: "Eğitim ve Danışmanlık", desc: "Son kullanıcı eğitimleri, süreç danışmanlığı ve teknik dokümantasyon hizmetleri." },
];

export default function Services() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Çözümlerimiz</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            İşletmenizin ihtiyaçlarına özel, uçtan uca ERP ve yazılım çözümleri sunuyoruz.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="p-6 rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/30 hover:glow-blue transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-4 group-hover:from-blue-600/40 group-hover:to-purple-600/40 transition">
                <s.icon size={24} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
