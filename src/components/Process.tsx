"use client";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

export default function Process() {
  const { t } = useTranslation();

  const steps = [
    { n: "01", titleKey: "process.s1.title", descKey: "process.s1.desc" },
    { n: "02", titleKey: "process.s2.title", descKey: "process.s2.desc" },
    { n: "03", titleKey: "process.s3.title", descKey: "process.s3.desc" },
    { n: "04", titleKey: "process.s4.title", descKey: "process.s4.desc" },
    { n: "05", titleKey: "process.s5.title", descKey: "process.s5.desc" },
    { n: "06", titleKey: "process.s6.title", descKey: "process.s6.desc" },
  ];

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
            <span className="gradient-text">{t("process.title")}</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">{t("process.subtitle")}</p>
        </motion.div>

        <div className="relative">
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
                  <h3 className="text-lg font-semibold text-white mb-2">{t(s.titleKey)}</h3>
                  <p className="text-gray-400 text-sm">{t(s.descKey)}</p>
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
