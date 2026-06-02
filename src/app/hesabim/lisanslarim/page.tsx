import Link from "next/link";
import { redirect } from "next/navigation";
import { Copy, ExternalLink, Clock, ShoppingCart, BookOpen, Key, Globe } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listOrdersByUserId } from "@/lib/auth/user-store";
import { getProductOfSku } from "@/lib/products";
import QuickStartTabs from "@/components/account/QuickStartTabs";

interface LicenseRow {
  productId: string;
  skuId: string;
  productName: string;
  skuName: string;
  licenseKey: string;
  orderDate: string;
  kind: "paid" | "trial-active" | "trial-expired";
  trialExpiresAt?: string;

  apiKey?: string;
  apiBaseUrl?: string;
  dashboardUrl?: string;
  maxSolvesPerDay?: number;
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
          productId: item.productId,
          skuId: item.skuId,
          productName: item.productName,
          skuName: item.skuName,
          licenseKey: item.licenseKey,
          orderDate: o.createdAt,
          kind: "paid",
          apiKey: item.apiKey,
          apiBaseUrl: item.apiBaseUrl,
          dashboardUrl: item.dashboardUrl,
          maxSolvesPerDay: item.maxSolvesPerDay,
        });
      }
    } else if (o.status === "TRIAL" && o.isTrial) {
      const expired = o.trialExpiresAt && new Date(o.trialExpiresAt).getTime() < now;
      for (const item of o.items) {
        licenses.push({
          productId: item.productId,
          skuId: item.skuId,
          productName: item.productName,
          skuName: item.skuName,
          licenseKey: item.licenseKey,
          orderDate: o.createdAt,
          kind: expired ? "trial-expired" : "trial-active",
          trialExpiresAt: o.trialExpiresAt,
          apiKey: item.apiKey,
          apiBaseUrl: item.apiBaseUrl,
          dashboardUrl: item.dashboardUrl,
          maxSolvesPerDay: item.maxSolvesPerDay,
        });
      }
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Lisanslarım</span></h1>
      <p className="text-gray-400 text-sm mb-8">Tüm ürünlerinin API anahtarları ve deneme sürümleri</p>

      {licenses.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#111118] border border-white/5 text-center">
          <p className="text-gray-400 mb-4">Henüz lisansın yok.</p>
          <Link href="/urunler" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
            Ürünleri İncele
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
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
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white text-lg">
                        {lic.productName} <span className="text-gray-400 font-normal text-base">— {lic.skuName}</span>
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
                      {!isTrial && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">
                          AKTİF
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
                      {lic.maxSolvesPerDay && (
                        <span className="ml-3 text-gray-400">
                          Günlük limit: <strong className="text-white">{lic.maxSolvesPerDay.toLocaleString("tr-TR")}</strong> istek
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
                        <BookOpen size={12} /> Belgeler
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
                    {!expired && lic.dashboardUrl && (
                      <Link
                        href={lic.dashboardUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
                      >
                        Detaylı Panel <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>

                {/* API CREDENTIALS — only shown when backend provisioned them */}
                {!expired && lic.apiKey && lic.apiBaseUrl && (
                  <div className="space-y-3">
                    <CredentialRow
                      icon={<Globe size={14} className="text-blue-400" />}
                      label="API Endpoint"
                      value={lic.apiBaseUrl}
                      copy
                    />
                    <CredentialRow
                      icon={<Key size={14} className="text-emerald-400" />}
                      label="API Key"
                      value={lic.apiKey}
                      copy
                      monospace
                    />
                    <QuickStartTabs apiBaseUrl={lic.apiBaseUrl} apiKey={lic.apiKey} productId={lic.productId} />
                  </div>
                )}

                {/* PROVISION FAILED — explain why no key is here */}
                {!expired && !lic.apiKey && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                    API anahtarın hazırlanıyor. Birkaç dakika sonra sayfayı yenile —
                    eğer hala görünmüyorsa{" "}
                    <Link href="/iletisim" className="underline">iletişimden</Link> bize yaz.
                  </div>
                )}

                {/* LEGACY license key display (informational) */}
                {!expired && lic.licenseKey && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">Sipariş referans kodu</p>
                    <code className="text-xs font-mono text-gray-500 break-all">{lic.licenseKey}</code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}


function CredentialRow({
  icon, label, value, copy, monospace,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copy?: boolean;
  monospace?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-[#0d0d14] border border-white/5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
          </div>
          <code className={`block break-all text-sm ${monospace ? "font-mono text-emerald-300" : "text-blue-300"}`}>
            {value}
          </code>
        </div>
        {copy && <CopyButton text={value} />}
      </div>
    </div>
  );
}


function CopyButton({ text }: { text: string }) {
  return (
    <button
      data-copy={text}
      className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition flex-shrink-0"
      title="Kopyala"
    >
      <Copy size={14} />
    </button>
  );
}
