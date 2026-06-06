"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, ExternalLink, MessageCircle, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PRODUCTS } from "@/lib/products";
import { priceFor, formatPrice } from "@/lib/currency";

export default function UrunlerPage() {
  const [trialedProducts, setTrialedProducts] = useState<Set<string>>(new Set());
  const [activeSkuByProduct, setActiveSkuByProduct] = useState<Record<string, string>>({});
  const [lastSkuByProduct, setLastSkuByProduct] = useState<Record<string, string>>({});
  const [appStates, setAppStates] = useState<Record<string, "active" | "expired" | "none">>({});

  useEffect(() => {
    fetch("/api/shop/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.trialedProducts)) setTrialedProducts(new Set(d.trialedProducts));
        if (d?.activeSkuByProduct && typeof d.activeSkuByProduct === "object") setActiveSkuByProduct(d.activeSkuByProduct);
        if (d?.lastSkuByProduct && typeof d.lastSkuByProduct === "object") setLastSkuByProduct(d.lastSkuByProduct);
        if (d?.appStates && typeof d.appStates === "object") setAppStates(d.appStates);
      })
      .catch(() => {});
  }, []);

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
              // Liste sayfasında "module" ve "seat" tipi SKU'lar gizlenir — onlar detay sayfasının
              // konfigüratöründen seçilir. base/standalone/credit kart olarak gösterilir.
              const visibleSkus = product.skus.filter((s) => !s.kind || s.kind === "base" || s.kind === "standalone" || s.kind === "credit");
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

                  {product.contactOnly ? (
                    <ContactCTA product={product} />
                  ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {visibleSkus.map((sku, i) => {
                      const { price, currency } = priceFor(sku, "USD");
                      return (
                      <motion.div
                        key={sku.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className={`relative p-6 rounded-2xl bg-[#111118] border transition ${
                          activeSkuByProduct[product.id] === sku.id
                            ? "border-emerald-500/50 ring-2 ring-emerald-500/20"
                            : appStates[product.id] === "expired" && lastSkuByProduct[product.id] === sku.id
                            ? "border-amber-500/50 ring-2 ring-amber-500/20"
                            : sku.highlight ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-white/5"
                        }`}
                      >
                        {activeSkuByProduct[product.id] === sku.id ? (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-semibold">
                            MEVCUT PLANINIZ
                          </div>
                        ) : appStates[product.id] === "expired" && lastSkuByProduct[product.id] === sku.id ? (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold">
                            SÜRESİ DOLDU
                          </div>
                        ) : sku.highlight ? (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold">
                            EN POPÜLER
                          </div>
                        ) : null}
                        <h3 className="text-xl font-bold text-white mb-1">{sku.name}</h3>
                        <p className="text-xs text-gray-400 mb-4">{sku.description}</p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-white">{formatPrice(price, currency, { short: true })}</span>
                          <span className="text-gray-400 ml-1 text-sm">/ay</span>
                        </div>
                        <div className="space-y-2 mb-4">
                          {(() => {
                            const isCurrent = activeSkuByProduct[product.id] === sku.id;
                            const hasActiveOnProduct = !!activeSkuByProduct[product.id];
                            const hasTrialed = trialedProducts.has(product.id);
                            const isExpiredProduct = appStates[product.id] === "expired";
                            const isLastSku = lastSkuByProduct[product.id] === sku.id;

                            if (isCurrent) {
                              return (
                                <Link
                                  href={`/urunler/${product.id}?sku=${sku.id}`}
                                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                >
                                  <Check size={14} /> Aktif Plan — Detayı Gör
                                </Link>
                              );
                            }

                            // Expired lisansı olan kullanıcı: son SKU'su ise "Uzat", diğerleri "Yükselt"
                            if (isExpiredProduct) {
                              return (
                                <Link
                                  href={`/urunler/${product.id}?sku=${sku.id}`}
                                  className={`block text-center py-2.5 rounded-xl font-semibold transition text-sm ${
                                    isLastSku
                                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90"
                                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                                  }`}
                                >
                                  {isLastSku ? "Lisansı Uzat" : "Bu Plana Yükselt"}
                                </Link>
                              );
                            }

                            // Hiç aktif/expired lisansı yok — yeni kullanıcı veya ilk satın alma akışı.
                            return (
                              <>
                                {!hasTrialed && !hasActiveOnProduct && (
                                  <Link
                                    href={`/urunler/${product.id}?sku=${sku.id}&trial=1`}
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90 transition"
                                  >
                                    <Sparkles size={14} /> 3 Gün Ücretsiz Dene
                                  </Link>
                                )}
                                <Link
                                  href={`/urunler/${product.id}?sku=${sku.id}`}
                                  className={`block text-center py-2.5 rounded-xl font-semibold transition text-sm ${
                                    hasActiveOnProduct
                                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90"
                                      : sku.highlight
                                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                                      : "border border-white/10 text-white hover:bg-white/5"
                                  }`}
                                >
                                  {hasActiveOnProduct ? "Bu Plana Yükselt" : "Sepete Ekle"}
                                </Link>
                              </>
                            );
                          })()}
                        </div>
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
                      );
                    })}
                  </div>
                  )}
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


function ContactCTA({ product }: { product: { id: string; name: string; demoUrl?: string } }) {
  // No public price for 1C:ERP/Drive — customer must talk to sales (AI call
  // center / WhatsApp / contact form). Demo URL opens in new tab so they can
  // poke around before deciding.
  const waMsg = encodeURIComponent(`Merhaba, ${product.name} hakkında bilgi almak istiyorum.`);
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {product.demoUrl && (
        <a
          href={product.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-2xl bg-[#111118] border border-blue-500/30 hover:border-blue-500/60 transition group"
        >
          <ExternalLink size={20} className="text-blue-400 mb-3" />
          <h3 className="font-bold text-white mb-1">Canlı Demo</h3>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            Resmi demo ortamında {product.name}'i kurulum gerekmeden deneyimle.
          </p>
          <span className="text-xs text-blue-400 group-hover:underline">Demoyu Aç →</span>
        </a>
      )}
      <Link
        href={`/iletisim?konu=${product.id}`}
        className="p-6 rounded-2xl bg-[#111118] border border-purple-500/30 hover:border-purple-500/60 transition group"
      >
        <MessageCircle size={20} className="text-purple-400 mb-3" />
        <h3 className="font-bold text-white mb-1">AI Asistan ile Konuş</h3>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          Fiyat, modül seçimi ve ihtiyaç analizini AI asistanımız üzerinden hızlıca yap.
        </p>
        <span className="text-xs text-purple-400 group-hover:underline">Sohbet Başlat →</span>
      </Link>
      <a
        href={`https://wa.me/908504474237?text=${waMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-6 rounded-2xl bg-[#111118] border border-emerald-500/30 hover:border-emerald-500/60 transition group"
      >
        <Phone size={20} className="text-emerald-400 mb-3" />
        <h3 className="font-bold text-white mb-1">WhatsApp Hattı</h3>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          Doğrudan satış ekibimize WhatsApp üzerinden ulaş, ihtiyacına özel teklif al.
        </p>
        <span className="text-xs text-emerald-400 group-hover:underline">Mesaj Gönder →</span>
      </a>
    </div>
  );
}
