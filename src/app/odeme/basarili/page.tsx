import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, Mail, ArrowRight, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { findOrderById } from "@/lib/auth/user-store";
import { getProductOfSku } from "@/lib/products";

interface Props { searchParams: Promise<{ order?: string }> }

async function Inner({ orderId }: { orderId?: string }) {
  const order = orderId ? await findOrderById(orderId) : null;

  return (
    <main className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex w-20 h-20 rounded-full bg-green-500/10 items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-green-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Ödeme Başarılı!</h1>
        <p className="text-gray-400 mb-8">
          {order ? `${order.items.length} ürün için ödemeniz alındı.` : "Aboneliğin aktif."} Lisans anahtarların aşağıda ve e-mail ile gönderildi.
        </p>

        {order && (
          <div className="space-y-3 text-left mb-8">
            {order.items.map((item, i) => {
              const product = getProductOfSku(item.skuId);
              return (
                <div key={i} className="p-5 rounded-2xl bg-[#111118] border border-blue-500/30">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{item.productName} <span className="text-gray-400 font-normal">— {item.skuName}</span></h3>
                      <p className="text-xs text-gray-500 mt-1">{item.price.toLocaleString("tr-TR")} TRY / ay</p>
                    </div>
                    {product && (
                      <Link
                        href={`https://${product.domain}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
                      >
                        Panele Git <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-[#0d0d14] border border-white/5">
                    <code className="text-sm font-mono text-blue-400 break-all">{item.licenseKey}</code>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 mb-8 text-left">
          <p className="text-sm text-blue-300 flex items-start gap-2">
            <Mail size={16} className="flex-shrink-0 mt-0.5" />
            <span>Tüm lisanslar <strong>e-mail kutuna</strong> da gönderildi. Spam klasörünü kontrol et.</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/hesabim/lisanslarim" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
            Lisanslarımı Yönet <ArrowRight size={16} />
          </Link>
          <Link href="/urunler" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition">
            Diğer Ürünler
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen" />}>
        <Inner orderId={sp.order} />
      </Suspense>
      <Footer />
    </>
  );
}
