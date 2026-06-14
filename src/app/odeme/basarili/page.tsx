import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, Mail, ArrowRight, ExternalLink, Sparkles, MessageSquare, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { findOrderById, listOrdersByUserId } from "@/lib/auth/user-store";
import { getProductOfSku, getSku } from "@/lib/products";
import { getServerTranslations } from "@/lib/i18n-server";

interface Props { searchParams: Promise<{ order?: string }> }

async function Inner({ orderId }: { orderId?: string }) {
  const order = orderId ? await findOrderById(orderId) : null;
  const { t, dateLocale } = await getServerTranslations();

  // Order'da AI Kontor paketi var mi + kullaninin aktif FinansERPIDE plani
  // var mi? (Kontor tek basina ise yaramaz — Eylul'e gitmesi gerek)
  const aiKontorItems = order ? order.items.filter((it) => it.productId === "ai-kontor") : [];
  const otherItems = order ? order.items.filter((it) => it.productId !== "ai-kontor") : [];
  const aiKontorTotal = aiKontorItems.reduce((s, it) => {
    const sku = getSku(it.skuId);
    return s + (sku?.creditsGranted ?? 0);
  }, 0);

  let hasActiveFinansERPIDE = false;
  if (order && aiKontorItems.length > 0) {
    const userOrders = await listOrdersByUserId(order.userId);
    const now = Date.now();
    hasActiveFinansERPIDE = userOrders.some(
      (o) =>
        o.status === "PAID" &&
        o.items.some((i) => i.productId === "finanserpide") &&
        (!o.subscriptionExpiresAt || new Date(o.subscriptionExpiresAt).getTime() > now)
    );
  }

  return (
    <main className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex w-20 h-20 rounded-full bg-green-500/10 items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-green-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{t("payment.success_title")}</h1>
        <p className="text-gray-400 mb-8">
          {order
            ? t("payment.success_items").replace("{count}", String(order.items.length))
            : t("payment.success_subscription")}
          {" "}
          {t("payment.success_keys_sent")}
        </p>

        {/* AI Kontor banner — sadece order'da AI Kontor varsa */}
        {aiKontorItems.length > 0 && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#111118] to-orange-500/10 border border-amber-500/30 text-left">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">
                  {aiKontorTotal.toLocaleString(dateLocale)} kontör hesabına işlendi
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Eylül (FinansERPIDE AI asistanı) artık bu kontörden harcayabilir.
                </p>
              </div>
            </div>
            {hasActiveFinansERPIDE ? (
              <Link
                href="https://finans.erpide.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:opacity-90 transition"
              >
                <MessageSquare size={16} /> Eylül ile Sohbete Dön <ExternalLink size={13} />
              </Link>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-200 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-100">Aktif FinansERPIDE planın yok.</strong> Kontörler hesabında bekliyor — Eylül&apos;ü kullanabilmen için önce bir FinansERPIDE planına ihtiyaç var. Kontörler kaybolmaz, plan alır almaz hazır.
                  </div>
                </div>
                <Link
                  href="/urunler/finanserpide"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
                >
                  FinansERPIDE Planı Al <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Diger urunlerin license/credential listesi — AI Kontor zaten yukarida */}
        {order && otherItems.length > 0 && (
          <div className="space-y-3 text-left mb-8">
            {otherItems.map((item, i) => {
              const product = getProductOfSku(item.skuId);
              return (
                <div key={i} className="p-5 rounded-2xl bg-[#111118] border border-blue-500/30">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{item.productName} <span className="text-gray-400 font-normal">— {item.skuName}</span></h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("payment.price_per_month_tr").replace("{price}", item.price.toLocaleString(dateLocale))}
                      </p>
                    </div>
                    {product && (
                      <Link
                        href={`https://${product.domain}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
                      >
                        {t("payment.open_panel")} <ExternalLink size={11} />
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
            <span>{t("payment.email_note")}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/hesabim/lisanslarim" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
            {t("payment.manage_licenses")} <ArrowRight size={16} />
          </Link>
          <Link href="/urunler" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition">
            {t("payment.other_products")}
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
