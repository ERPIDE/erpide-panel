import Link from "next/link";
import { redirect } from "next/navigation";
import { Copy, ExternalLink, Clock, ShoppingCart, BookOpen } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listOrdersByUserId } from "@/lib/auth/user-store";
import { getProductOfSku } from "@/lib/products";

interface LicenseRow {
  skuId: string;
  productName: string;
  skuName: string;
  licenseKey: string;
  orderDate: string;
  kind: "paid" | "trial-active" | "trial-expired";
  trialExpiresAt?: string;
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Süresi doldu";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days} gün ${hours} saat kaldı`;
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}s ${minutes}dk kaldı`;
}

export default async function LisanslarimPage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim/lisanslarim");

  const orders = await listOrdersByUserId(session.userId!);
  const licenses: LicenseRow[] = [];
  const now = Date.now();
  for (const o of orders) {
    if (o.status === "PAID") {
      for (const item of o.items) {
        licenses.push({
          skuId: item.skuId,
          productName: item.productName,
          skuName: item.skuName,
          licenseKey: item.licenseKey,
          orderDate: o.createdAt,
          kind: "paid",
        });
      }
    } else if (o.status === "TRIAL" && o.isTrial) {
      const expired = o.trialExpiresAt && new Date(o.trialExpiresAt).getTime() < now;
      for (const item of o.items) {
        licenses.push({
          skuId: item.skuId,
          productName: item.productName,
          skuName: item.skuName,
          licenseKey: item.licenseKey,
          orderDate: o.createdAt,
          kind: expired ? "trial-expired" : "trial-active",
          trialExpiresAt: o.trialExpiresAt,
        });
      }
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Lisanslarım</span></h1>
      <p className="text-gray-400 text-sm mb-8">Tüm ürünlerinin lisans anahtarları ve deneme sürümleri</p>

      {licenses.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#111118] border border-white/5 text-center">
          <p className="text-gray-400 mb-4">Henüz lisansın yok.</p>
          <Link href="/urunler" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
            Ürünleri İncele
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {licenses.map((lic, i) => {
            const product = getProductOfSku(lic.skuId);
            const isTrial = lic.kind !== "paid";
            const expired = lic.kind === "trial-expired";
            return (
              <div
                key={i}
                className={`p-5 rounded-2xl bg-[#111118] border ${
                  expired ? "border-red-500/20" : isTrial ? "border-emerald-500/25" : "border-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white">
                        {lic.productName} <span className="text-gray-400 font-normal">— {lic.skuName}</span>
                      </h3>
                      {isTrial && !expired && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          DENEME
                        </span>
                      )}
                      {expired && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                          SÜRESİ DOLDU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Alındı: {new Date(lic.orderDate).toLocaleDateString("tr-TR")}
                      {isTrial && lic.trialExpiresAt && (
                        <span className={`ml-3 inline-flex items-center gap-1 ${expired ? "text-red-400" : "text-emerald-300"}`}>
                          <Clock size={11} /> {formatRemaining(lic.trialExpiresAt)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {product && (
                      <Link
                        href={`/docs/${product.id}`}
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
                      >
                        <BookOpen size={12} /> Nasıl Kullanırım?
                      </Link>
                    )}
                    {isTrial && (
                      <Link
                        href={`/urunler/${product?.id ?? ""}?sku=${lic.skuId}`}
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition"
                      >
                        <ShoppingCart size={12} /> Satın Al
                      </Link>
                    )}
                    {product && !expired && (
                      <Link
                        href={`https://${product.domain}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
                      >
                        Panele Git <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>
                <div className={`mt-4 p-3 rounded-lg bg-[#0d0d14] border flex items-center gap-2 ${expired ? "border-red-500/15 opacity-60" : "border-blue-500/20"}`}>
                  <code className="flex-1 text-sm font-mono text-blue-400 break-all">{lic.licenseKey}</code>
                  <CopyButton text={lic.licenseKey} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      data-copy={text}
      className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition"
    >
      <Copy size={14} />
    </button>
  );
}
