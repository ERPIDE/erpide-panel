"use client";
import { motion } from "framer-motion";
import { Target, Shield, Lightbulb, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const values = [
  { icon: Target, title: "Uzmanlik", desc: "CANIAS ve 1C ERP alaninda derin teknik bilgi ve deneyim." },
  { icon: Shield, title: "Guvenilirlik", desc: "Projelerimizi zamaninda ve kaliteli teslim ediyoruz." },
  { icon: Lightbulb, title: "Yenilikcilik", desc: "En guncel teknolojilerle yenilikci cozumler uretiyoruz." },
  { icon: Users, title: "Musteri Odaklilik", desc: "Her musterimizin ihtiyacina ozel yaklasim sunuyoruz." },
];

const team = [
  { name: "Ali Murat El", role: "Kurucu & CEO", desc: "ERP ve yazilim gelistirme alaninda 12+ yil deneyim." },
  { name: "Kidemli Danismanlar", role: "ERP Danismanligi", desc: "CANIAS ve 1C platformlarinda uzman kadro." },
  { name: "Gelistirme Ekibi", role: "Yazilim Gelistirme", desc: "Full-stack gelistirme ve otomasyon uzmanlari." },
  { name: "Proje Ekibi", role: "Proje Yonetimi", desc: "Profesyonel proje yonetimi ve koordinasyon." },
];

export default function HakkimizdaPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4"><span className="gradient-text">Hakkimizda</span></h1>
          </motion.div>

          {/* Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto text-center mb-20"
          >
            <p className="text-lg text-gray-300 leading-relaxed">
              ERPIDE YAZILIM A.S. olarak, isletmelerin dijital donusum yolculugunda guvenilir cozum ortagi olmayi hedefliyoruz.
              CANIAS ERP ve 1C ERP alaninda uzman kadromuzla Turkiye ve Kazakistan&apos;da hizmet veriyoruz.
              Ozel yazilim gelistirme, otomasyon ve entegrasyon cozumleriyle musterilerimizin verimliligini en ust duzeye cikartiyoruz.
            </p>
          </motion.div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Degerlerimiz</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {values.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-6 rounded-2xl bg-[#111118] border border-white/5 text-center hover:border-blue-500/30 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-4">
                    <v.icon size={24} className="text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{v.title}</h3>
                  <p className="text-gray-400 text-sm">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Deneyimli Ekibimiz</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {team.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-6 rounded-2xl bg-[#111118] border border-white/5 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 text-white font-bold text-lg">
                    {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <p className="text-blue-400 text-sm mb-2">{t.role}</p>
                  <p className="text-gray-400 text-sm">{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
