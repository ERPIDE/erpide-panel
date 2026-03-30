"use client";
import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "İhtiyaç Analizi", desc: "Mevcut iş süreçlerinizi detaylı analiz ediyoruz." },
  { n: "02", title: "Çözüm Tasarımı", desc: "Firmanıza özel mimari ve çözüm tasarlıyoruz." },
  { n: "03", title: "Geliştirme", desc: "Uzman ekibimiz kodlama ve entegrasyonu gerçekleştiriyor." },
  { n: "04", title: "Test ve Kalite", desc: "Kapsamlı test süreciyle kaliteyi garanti ediyoruz." },
  { n: "05", title: "Devreye Alma", desc: "Sorunsuz geçiş için kademeli devreye alma yapıyoruz." },
  { n: "06", title: "Destek", desc: "Sürekli destek ve optimizasyonla yanınızda oluyoruz." },
];

export default function Process() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Başarılı Proje Süreci</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 hidden md:block" />

          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`flex items-center gap-8 mb-12 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
            >
              <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                <div className="p-6 rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/20 transition">
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm">{s.desc}</p>
                </div>
              </div>

              <div className="hidden md:flex w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 items-center justify-center text-white font-bold text-sm shrink-0 z-10">
                {s.n}
              </div>

              <div className="flex-1 hidden md:block" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
