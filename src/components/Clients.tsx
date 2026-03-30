"use client";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const clients = ["Sirmersan", "ATM Constructor", "YDA Group", "Marijeo"];

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
            <span className="gradient-text">Guvendikleri</span>
          </h2>
          <p className="text-gray-400">Turkiye ve Kazakistan&apos;da oncu firmalarin cozum ortagi</p>
        </motion.div>

        {/* Client logos */}
        <div className="flex justify-center gap-8 flex-wrap mb-16">
          {clients.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="px-8 py-4 rounded-xl bg-[#111118] border border-white/5 hover:border-blue-500/30 transition"
            >
              <span className="text-lg font-semibold text-gray-300">{c}</span>
            </motion.div>
          ))}
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <Quote size={40} className="text-blue-500/30 mx-auto mb-4" />
          <p className="text-lg text-gray-300 italic leading-relaxed mb-4">
            &quot;ERPIDE ile ERP sureclerimizi tamamen donusturduk. Profesyonel ekip ve kesintisiz destek
            ile is sureclerimiz cok daha verimli hale geldi.&quot;
          </p>
          <p className="text-sm text-gray-500">— Operasyon Muduru, Uretim Sektoru</p>
        </motion.div>
      </div>
    </section>
  );
}
