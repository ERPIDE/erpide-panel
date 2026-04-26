"use client";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

const clients = [
  "Sirmersan", "ATM Constructor", "YDA Group",
  "LC Waikiki", "LUKOIL", "OKT TRAILER",
  "Gelisim OFSET", "CAST ANB",
];

export default function Clients() {
  const { t } = useTranslation();

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
            <span className="gradient-text">{t("clients.title")}</span>
          </h2>
          <p className="text-gray-400">{t("clients.subtitle")}</p>
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
