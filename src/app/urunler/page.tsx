"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PRODUCTS } from "@/lib/products";

export default function UrunlerPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Ürünler</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              ERPIDE SaaS ürünleri. Üye ol, sepete ekle, aylık abone ol. İstediğin zaman iptal et.
            </p>
          </motion.div>

          <div className="space-y-16">
            {PRODUCTS.map((product) => {
              const Icon = product.icon;
              return (
                <motion.section
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-white">{product.name}</h2>
                        {product.comingSoon && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
                            BETA
                          </span>
                        )}
                      </div>
                      <p className="text-blue-400 text-sm mb-2">{product.tagline}</p>
                      <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">{product.description}</p>
                      <Link
                        href={`/urunler/${product.id}`}
                        className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:text-blue-300 transition"
                      >
                        Detaylı incele <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {product.skus.map((sku, i) => (
                      <motion.div
                        key={sku.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className={`relative p-6 rounded-2xl bg-[#111118] border transition ${
                          sku.highlight ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-white/5"
                        }`}
                      >
                        {sku.highlight && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold">
                            EN POPÜLER
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-white mb-1">{sku.name}</h3>
                        <p className="text-xs text-gray-400 mb-4">{sku.description}</p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-white">{sku.price.toLocaleString("tr-TR")}</span>
                          <span className="text-gray-400 ml-1 text-sm">{sku.currency}/ay</span>
                        </div>
                        <Link
                          href={`/urunler/${product.id}?sku=${sku.id}`}
                          className={`block text-center py-2.5 rounded-xl font-semibold transition mb-4 text-sm ${
                            sku.highlight
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                              : "border border-white/10 text-white hover:bg-white/5"
                          }`}
                        >
                          Sepete Ekle
                        </Link>
                        <ul className="space-y-1.5">
                          {sku.features.slice(0, 5).map((f, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-gray-300">
                              <Check size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                          {sku.features.length > 5 && (
                            <li className="text-xs text-gray-600 pl-4">+ {sku.features.length - 5} özellik daha</li>
                          )}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
