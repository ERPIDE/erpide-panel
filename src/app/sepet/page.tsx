"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartProvider";

export default function SepetPage() {
  const { getLineWithSku, updateQuantity, removeItem, total, itemCount } = useCart();
  const router = useRouter();
  const items = getLineWithSku();
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meData = await meRes.json();
      if (!meData.user) {
        router.push("/giris?next=/sepet/odeme");
        return;
      }
      router.push("/sepet/odeme");
    } catch {
      router.push("/giris?next=/sepet/odeme");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2"><span className="gradient-text">Sepetim</span></h1>
          <p className="text-gray-400 text-sm mb-8">{itemCount} ürün</p>

          {items.length === 0 ? (
            <div className="p-16 rounded-2xl bg-[#111118] border border-white/5 text-center">
              <ShoppingCart size={48} className="mx-auto mb-4 text-gray-600" />
              <h2 className="text-xl font-semibold text-white mb-2">Sepetin boş</h2>
              <p className="text-gray-400 mb-6">Ürünlere göz at, dilediğin SaaS aboneliğini sepete ekle.</p>
              <Link
                href="/urunler"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
              >
                Ürünleri İncele <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_360px] gap-6">
              <div className="space-y-3">
                {items.map(({ line, sku }) => (
                  <motion.div
                    key={sku.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-[#111118] border border-white/5 flex items-center gap-4 flex-wrap"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <Link href={`/urunler/${sku.productId}`} className="font-semibold text-white hover:text-blue-400 transition">
                        {sku.productId === "finanserpide" ? "FinansERPIDE" : "CaptchaERPIDE"} {sku.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">{sku.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{sku.price.toLocaleString("tr-TR")} {sku.currency}/ay</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(sku.id, line.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center justify-center transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-white font-medium">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(sku.id, line.quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center justify-center transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="font-bold text-white">{(sku.price * line.quantity).toLocaleString("tr-TR")} {sku.currency}</p>
                      <p className="text-xs text-gray-500">/ay</p>
                    </div>

                    <button
                      onClick={() => removeItem(sku.id)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>

              <aside className="lg:sticky lg:top-24 h-fit">
                <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                  <h3 className="font-semibold text-white mb-4">Sipariş Özeti</h3>
                  <div className="space-y-2 mb-4">
                    {items.map(({ line, sku }) => (
                      <div key={sku.id} className="flex justify-between text-sm">
                        <span className="text-gray-400 truncate">{sku.productId === "finanserpide" ? "Finans" : "Captcha"} {sku.name} × {line.quantity}</span>
                        <span className="text-gray-300 font-mono">{(sku.price * line.quantity).toLocaleString("tr-TR")} ₺</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/5 mb-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-white font-semibold">Aylık Toplam</span>
                      <span className="text-2xl font-bold text-white">{total.toLocaleString("tr-TR")} ₺</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">KDV dahil • istediğin zaman iptal</p>
                  </div>
                  <button
                    onClick={startCheckout}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    {loading ? "Hazırlanıyor..." : "Ödemeye Geç"}
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                    <ShieldCheck size={12} /> iyzico güvenli ödeme
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
