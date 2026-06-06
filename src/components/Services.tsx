"use client";
import { motion } from "framer-motion";
import { Settings, Database, Code2, Rocket, Headset, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { PRODUCTS } from "@/lib/products";
import { priceFor, formatPrice } from "@/lib/currency";

export default function Services() {
  const { t } = useTranslation();

  const services = [
    { icon: Settings, titleKey: "svc.canias.title", descKey: "svc.canias.desc" },
    { icon: Database, titleKey: "svc.1cerp.title", descKey: "svc.1cerp.desc" },
    { icon: Database, titleKey: "svc.1cacc.title", descKey: "svc.1cacc.desc" },
    { icon: Database, titleKey: "svc.1cdrive.title", descKey: "svc.1cdrive.desc" },
    { icon: Code2, titleKey: "svc.custom.title", descKey: "svc.custom.desc" },
    { icon: Rocket, titleKey: "svc.digital.title", descKey: "svc.digital.desc" },
    { icon: Headset, titleKey: "svc.support.title", descKey: "svc.support.desc" },
    { icon: GraduationCap, titleKey: "svc.training.title", descKey: "svc.training.desc" },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Ürünlerimiz</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">SaaS ürünlerimiz — anında üye ol, sepete ekle, aylık abone ol.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {PRODUCTS.filter((p) => p.id !== "ai-kontor").map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-[#111118] border border-blue-500/30 hover:border-blue-400/60 transition group relative"
              >
                {p.comingSoon && (
                  <span className="absolute top-6 right-6 text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    BETA
                  </span>
                )}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-5`}>
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{p.name}</h3>
                <p className="text-blue-400 text-sm mb-2">{p.tagline}</p>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{p.description}</p>
                <div className="flex items-baseline gap-2 mb-5">
                  {p.contactOnly || !p.skus[0] ? (
                    <span className="text-sm font-semibold text-blue-400">Demo + Teklif Al</span>
                  ) : (
                    <>
                      <span className="text-xs text-gray-500">Aylık</span>
                      {(() => {
                        const { price, currency } = priceFor(p.skus[0], "USD");
                        return <span className="text-xl font-bold text-white">{formatPrice(price, currency, { short: true })}&apos;dan</span>;
                      })()}
                    </>
                  )}
                </div>
                <Link
                  href={`/urunler/${p.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:opacity-90 transition"
                >
                  İncele ve Satın Al <ArrowRight size={14} />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            <span className="gradient-text">Danışmanlık ve Hizmetler</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">CANIAS, 1C ve özel yazılım projeleri — teklif isteyin.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s, i) => (
            <Link key={i} href="/hizmetler">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/30 transition h-full"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-3">
                  <s.icon size={20} className="text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-1 text-sm">{t(s.titleKey)}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{t(s.descKey)}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
