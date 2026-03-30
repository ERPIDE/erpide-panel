"use client";
import { motion, useMotionValue, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) {
      const ctrl = animate(0, value, {
        duration: 2,
        onUpdate: (v) => setDisplay(Math.floor(v)),
      });
      return () => ctrl.stop();
    }
  }, [isInView, value]);

  return (
    <motion.div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white">
        {display}{suffix}
      </div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
      {/* Floating orbs */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1.1, 0.9, 1.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            İşletmenizi{" "}
            <span className="gradient-text">Geleceğe</span>{" "}
            Taşıyoruz
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10"
        >
          CANIAS ERP, 1C ERP ve özel yazılım çözümleriyle işletmenizi dijital çağa hazırlıyoruz.
          Türkiye ve Kazakistan&apos;da güvenilir çözüm ortağınız.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
        >
          <Link
            href="/hizmetler"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition text-lg"
          >
            Hizmetlerimizi İnceleyin <ArrowRight size={20} />
          </Link>
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition text-lg"
          >
            <Phone size={20} /> Bize Ulaşın
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-white/5"
        >
          <AnimatedStat value={150} suffix="+" label="Tamamlanan Proje" />
          <AnimatedStat value={12} suffix="+" label="Yıllık Deneyim" />
          <AnimatedStat value={50} suffix="+" label="Mutlu Müşteri" />
          <AnimatedStat value={7} suffix="/24" label="Destek" />
        </motion.div>
      </div>
    </section>
  );
}
