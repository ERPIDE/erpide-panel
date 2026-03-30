"use client";
import { motion } from "framer-motion";
import { Settings, Database, Code2, Rocket, Headset, GraduationCap } from "lucide-react";

const services = [
  { icon: Settings, title: "CANIAS ERP Danismanligi", desc: "TROIA diliyle ozel gelistirme, modul entegrasyonu, performans optimizasyonu ve raporlama cozumleri." },
  { icon: Database, title: "1C ERP Cozumleri", desc: "1C:ERP kurulum, lokalizasyon, muhasebe entegrasyonu, web servis gelistirme ve ACC senkronizasyonu." },
  { icon: Code2, title: "Ozel Yazilim Gelistirme", desc: "Python, Node.js, React ile ozel otomasyon, bot gelistirme ve API entegrasyon cozumleri." },
  { icon: Rocket, title: "Dijital Donusum", desc: "Is sureclerinizi dijitallestirin. Verimlilik artisi ve maliyet optimizasyonu saglayalim." },
  { icon: Headset, title: "7/24 Bakim ve Destek", desc: "Kesintisiz teknik destek, proaktif izleme, hizli mudahale ve duzeltici aksiyonlar." },
  { icon: GraduationCap, title: "Egitim ve Danismanlik", desc: "Son kullanici egitimleri, surec danismanligi ve teknik dokumantasyon hizmetleri." },
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
            <span className="gradient-text">Cozumlerimiz</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Isletmenizin ihtiyaclarina ozel, uctan uca ERP ve yazilim cozumleri sunuyoruz.
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
