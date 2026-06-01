"use client";
import { useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ShoppingCart, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProduct } from "@/lib/products";
import { useCart } from "@/components/CartProvider";

function Inner({ productId }: { productId: string }) {
  const product = getProduct(productId);
  const router = useRouter();
  const sp = useSearchParams();
  const initialSku = sp.get("sku");
  const { addItem, lines } = useCart();
  const [selectedSku, setSelectedSku] = useState(initialSku || product?.skus.find((s) => s.highlight)?.id || product?.skus[0].id || "");
  const [adding, setAdding] = useState(false);

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 px-6 min-h-screen text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Ürün bulunamadı</h1>
          <Link href="/urunler" className="text-blue-400 hover:underline">Ürünlere dön</Link>
        </main>
        <Footer />
      </>
    );
  }

  const Icon = product.icon;
  const currentSku = product.skus.find((s) => s.id === selectedSku) || product.skus[0];
  const inCartQty = lines.find((l) => l.skuId === currentSku.id)?.quantity || 0;

  async function handleAdd() {
    setAdding(true);
    addItem(currentSku.id, 1);
    await new Promise((r) => setTimeout(r, 300));
    setAdding(false);
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Link href="/urunler" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
            <ArrowLeft size={14} /> Ürünlere dön
          </Link>

          <div className="grid lg:grid-cols-[1fr_400px] gap-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-5 mb-6">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={36} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{product.name}</h1>
                    {product.comingSoon && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">BETA</span>
                    )}
                  </div>
                  <p className="text-blue-400">{product.tagline}</p>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-8">{product.longDescription}</p>

              <h2 className="text-xl font-bold text-white mb-4">Plan Seçin</h2>
              <div className="space-y-3 mb-8">
                {product.skus.map((sku) => (
                  <button
                    key={sku.id}
                    onClick={() => setSelectedSku(sku.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition ${
                      selectedSku === sku.id
                        ? "border-blue-500/60 bg-blue-500/5"
                        : "border-white/10 bg-[#111118] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{sku.name}</h3>
                          {sku.highlight && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">POPÜLER</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{sku.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{sku.price.toLocaleString("tr-TR")} {sku.currency}</p>
                        <p className="text-xs text-gray-500">/ay</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <h2 className="text-xl font-bold text-white mb-4">{currentSku.name} Plan Özellikleri</h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {currentSku.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:sticky lg:top-24 h-fit">
              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Seçtiğin plan</p>
                <h3 className="text-xl font-bold text-white mb-1">{product.name} {currentSku.name}</h3>
                <p className="text-sm text-gray-400 mb-5">{currentSku.description}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-white">{currentSku.price.toLocaleString("tr-TR")}</span>
                  <span className="text-gray-400">{currentSku.currency}/ay</span>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 mb-2"
                >
                  {adding ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                  {adding ? "Ekleniyor..." : inCartQty > 0 ? `Sepete Ekle (zaten ${inCartQty}x var)` : "Sepete Ekle"}
                </button>
                {inCartQty > 0 && (
                  <button
                    onClick={() => router.push("/sepet")}
                    className="w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition text-sm"
                  >
                    Sepete Git →
                  </button>
                )}
                <p className="text-xs text-gray-500 text-center mt-4">
                  İstediğin zaman iptal edebilirsin.<br />
                  Ödeme güvenli iyzico altyapısı ile alınır.
                </p>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Inner productId={productId} />
    </Suspense>
  );
}
