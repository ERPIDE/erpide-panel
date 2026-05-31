"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Briefcase, Shield, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PLANS, type ProductId } from "@/lib/payments/plans";

export default function FiyatlandirmaPage() {
  const [product, setProduct] = useState<ProductId>("finanserpide");
  const productPlans = PLANS.filter((p) => p.productId === product);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Planlar ve Fiyatlandırma</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              İhtiyacın olan kadarını öde. İstediğin zaman planı değiştir veya iptal et.
            </p>
          </motion.div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 rounded-2xl bg-[#0d0d14] border border-white/5">
              <button
                onClick={() => setProduct("finanserpide")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition ${
                  product === "finanserpide"
                    ? "bg-gradient-to-r from-orange-500 to-pink-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Briefcase size={16} /> FinansERPIDE
              </button>
              <button
                onClick={() => setProduct("captchaerpide")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition ${
                  product === "captchaerpide"
                    ? "bg-gradient-to-r from-green-600 to-teal-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Shield size={16} /> CaptchaERPIDE
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {productPlans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 rounded-2xl bg-[#111118] border transition-all ${
                  plan.highlight
                    ? "border-blue-500/50 ring-2 ring-blue-500/20"
                    : "border-white/5"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold">
                    <Sparkles size={12} /> EN POPÜLER
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">{plan.price.toLocaleString("tr-TR")}</span>
                  <span className="text-gray-400 ml-1">{plan.currency}/ay</span>
                </div>
                <Link
                  href={`/odeme/${plan.id}`}
                  className={`block text-center py-3 rounded-xl font-semibold transition mb-6 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                      : "border border-white/10 text-white hover:bg-white/5"
                  }`}
                >
                  Hemen Başla
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center p-8 rounded-2xl bg-[#0d0d14] border border-white/5">
            <h3 className="text-xl font-semibold text-white mb-2">Sorun mu var? Özel teklif mi istiyorsun?</h3>
            <p className="text-gray-400 mb-6">
              Kurumsal müşteriler için özel fiyatlandırma ve entegrasyon paketleri sunuyoruz.
            </p>
            <Link
              href="/iletisim"
              className="inline-block px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition"
            >
              Bizimle İletişime Geç
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
