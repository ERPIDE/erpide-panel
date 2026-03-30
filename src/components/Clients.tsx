"use client";
import { motion } from "framer-motion";

const clients = [
  "Sirmersan", "ATM Constructor", "YDA Group",
  "LC Waikiki", "LUKOIL", "OKT TRAILER",
  "Gelişim OFSET", "CAST ANB",
];

export default function Clients() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Çözüm Ortakları</span>
          </h2>
          <p className="text-gray-400">Türkiye ve Kazakistan&apos;da öncü firmaların güvenilir teknoloji ortağı</p>
        </motion.div>

        <div className="flex justify-center gap-6 flex-wrap">
          {clients.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="px-8 py-4 rounded-xl bg-[#111118] border border-white/5 hover:border-blue-500/30 hover:glow-blue transition-all duration-300"
            >
              <span className="text-lg font-semibold text-gray-300">{c}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
