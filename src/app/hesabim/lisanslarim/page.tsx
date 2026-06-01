import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { requireUser } from "@/lib/auth/session";
import { listOrdersByUserId } from "@/lib/auth/user-store";
import { getProductOfSku } from "@/lib/products";

export default async function LisanslarimPage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim/lisanslarim");

  const orders = await listOrdersByUserId(session.userId!);
  const licenses = orders
    .filter((o) => o.status === "PAID")
    .flatMap((o) => o.items.map((item) => ({ ...item, orderDate: o.createdAt })));

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <Link href="/hesabim" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
            <ArrowLeft size={14} /> Hesabıma dön
          </Link>
          <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Lisanslarım</span></h1>
          <p className="text-gray-400 text-sm mb-8">Tüm ürünlerinin lisans anahtarları</p>

          {licenses.length === 0 ? (
            <div className="p-16 rounded-2xl bg-[#111118] border border-white/5 text-center">
              <p className="text-gray-400 mb-4">Henüz aktif lisansın yok.</p>
              <Link href="/urunler" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
                Ürünleri İncele
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {licenses.map((lic, i) => {
                const product = getProductOfSku(lic.skuId);
                return (
                  <div key={i} className="p-5 rounded-2xl bg-[#111118] border border-white/5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="font-semibold text-white">{lic.productName} <span className="text-gray-400 font-normal">— {lic.skuName}</span></h3>
                        <p className="text-xs text-gray-500 mt-1">Alındı: {new Date(lic.orderDate).toLocaleDateString("tr-TR")}</p>
                      </div>
                      {product && (
                        <Link
                          href={`https://${product.domain}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
                        >
                          Panele Git <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-[#0d0d14] border border-blue-500/20 flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono text-blue-400 break-all">{lic.licenseKey}</code>
                      <CopyButton text={lic.licenseKey} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      data-copy={text}
      className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition"
      // Server component - actual copy happens via inline script
    >
      <Copy size={14} />
    </button>
  );
}
