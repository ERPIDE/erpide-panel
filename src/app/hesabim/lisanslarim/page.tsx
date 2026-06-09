import Link from "next/link";
import { redirect } from "next/navigation";
import { Copy, ExternalLink, Clock, ShoppingCart, BookOpen, Key, Globe } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listOrdersByUserId } from "@/lib/auth/user-store";
import { getProductOfSku } from "@/lib/products";
import QuickStartTabs from "@/components/account/QuickStartTabs";
import AutoRenewToggle from "@/components/account/AutoRenewToggle";
import CancelSubscriptionButton from "@/components/account/CancelSubscriptionButton";
import { getServerTranslations } from "@/lib/i18n-server";

interface LicenseRow {
  orderId: string;
  productId: string;
  skuId: string;
  productName: string;
  skuName: string;
  licenseKey: string;
  orderDate: string;
  kind: "paid-active" | "paid-expired" | "trial-active" | "trial-expired";
  expiresAt?: string;
  autoRenewEnabled?: boolean;
  billingCycle?: "monthly" | "yearly";
  cancelledAt?: string;

  apiKey?: string;
  apiBaseUrl?: string;
  dashboardUrl?: string;
  maxSolvesPerDay?: number;
}

function defaultAppUrl(productId: string): string | null {
  switch (productId) {
    case "pocketerpide":  return "/pocket";
    case "finanserpide":  return "https://finans.erpide.com/giris";
    case "captchaerpide": return "https://captcha.erpide.com/dashboard";
    default:              return null;
  }
}

/** Kalan süreyi locale'e göre formatla — i18n string'leri "{days}", "{hours}",
 * "{minutes}" placeholder'larıyla 4 dilde tanımlı. */
function formatRemaining(expiresAt: string, t: (k: string) => string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return t("license.expired");
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) {
    return t("license.remaining_days_hours")
      .replace("{days}", String(days))
      .replace("{hours}", String(hours));
  }
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return t("license.remaining_hours_minutes")
    .replace("{hours}", String(hours))
    .replace("{minutes}", String(minutes));
}

export default async function LisanslarimPage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim/lisanslarim");

  const { t, dateLocale } = await getServerTranslations();
  const orders = await listOrdersByUserId(session.userId!);
  const licenses: LicenseRow[] = [];
  const now = Date.now();
  for (const o of orders) {
    if (o.status === "PAID") {
      const expired = !!o.subscriptionExpiresAt && new Date(o.subscriptionExpiresAt).getTime() < now;
      for (const item of o.items) {
        licenses.push({
          orderId: o.id,
          productId: item.productId,
          skuId: item.skuId,
          productName: item.productName,
          skuName: item.skuName,
          licenseKey: item.licenseKey,
          orderDate: o.createdAt,
          kind: expired ? "paid-expired" : "paid-active",
          expiresAt: o.subscriptionExpiresAt,
          autoRenewEnabled: o.autoRenewEnabled,
          billingCycle: o.billingCycle,
          cancelledAt: o.cancelledAt,
          apiKey: item.apiKey,
          apiBaseUrl: item.apiBaseUrl,
          dashboardUrl: item.dashboardUrl,
          maxSolvesPerDay: item.maxSolvesPerDay,
        });
      }
    } else if (o.status === "TRIAL" && o.isTrial) {
      const expired = !!o.trialExpiresAt && new Date(o.trialExpiresAt).getTime() < now;
      for (const item of o.items) {
        licenses.push({
          orderId: o.id,
          productId: item.productId,
          skuId: item.skuId,
          productName: item.productName,
          skuName: item.skuName,
          licenseKey: item.licenseKey,
          orderDate: o.createdAt,
          kind: expired ? "trial-expired" : "trial-active",
          expiresAt: o.trialExpiresAt,
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
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">{t("sidebar.licenses")}</span></h1>
      <p className="text-gray-400 text-sm mb-8">{t("license.subtitle")}</p>

      {licenses.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#111118] border border-white/5 text-center">
          <p className="text-gray-400 mb-4">{t("account.no_licenses")}</p>
          <Link href="/urunler" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
            {t("cart.browse_products")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {licenses.map((lic, i) => {
            const product = getProductOfSku(lic.skuId);
            const isTrial = lic.kind === "trial-active" || lic.kind === "trial-expired";
            const expired = lic.kind === "trial-expired" || lic.kind === "paid-expired";
            const needsRenewSoon = !expired && lic.expiresAt && new Date(lic.expiresAt).getTime() - now < 3 * 24 * 60 * 60 * 1000;
            return (
              <div
                key={i}
                className={`p-5 rounded-2xl bg-[#111118] border ${
                  expired ? "border-red-500/20" : isTrial ? "border-emerald-500/25" : needsRenewSoon ? "border-amber-500/25" : "border-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white text-lg">
                        {lic.productName} <span className="text-gray-400 font-normal text-base">— {lic.skuName}</span>
                      </h3>
                      {lic.kind === "trial-active" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {t("license.trial_badge")}
                        </span>
                      )}
                      {expired && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                          {t("license.expired_badge")}
                        </span>
                      )}
                      {lic.kind === "paid-active" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">
                          {lic.billingCycle === "yearly" ? t("license.active_yearly") : t("license.active_monthly")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {t("license.purchased_at").replace("{date}", new Date(lic.orderDate).toLocaleDateString(dateLocale))}
                      {lic.expiresAt && (
                        <span className={`ml-3 inline-flex items-center gap-1 ${expired ? "text-red-400" : needsRenewSoon ? "text-amber-300" : isTrial ? "text-emerald-300" : "text-gray-400"}`}>
                          <Clock size={11} /> {formatRemaining(lic.expiresAt, t)}
                        </span>
                      )}
                      {lic.maxSolvesPerDay && (
                        <span className="ml-3 text-gray-400">
                          {t("license.daily_limit").replace("{limit}", lic.maxSolvesPerDay.toLocaleString(dateLocale))}
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
                        <BookOpen size={12} /> {t("license.docs_button")}
                      </Link>
                    )}
                    {(isTrial || expired) && (
                      <Link
                        href={`/urunler/${product?.id ?? ""}?sku=${lic.skuId}`}
                        className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg text-white hover:opacity-90 transition ${
                          lic.kind === "paid-expired"
                            ? "bg-gradient-to-r from-amber-500 to-orange-600"
                            : "bg-gradient-to-r from-blue-600 to-purple-600"
                        }`}
                      >
                        <ShoppingCart size={12} />
                        {lic.kind === "paid-expired" ? t("products.renew_license") : t("license.purchase_button")}
                      </Link>
                    )}
                    {(() => {
                      if (expired) return null;
                      const url = lic.dashboardUrl || defaultAppUrl(lic.productId);
                      if (!url) return null;
                      const isExternal = url.startsWith("http");
                      return (
                        <Link
                          href={url}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition font-medium"
                        >
                          {lic.productId === "pocketerpide" ? t("license.open_wallet") : t("license.open_app")}
                          {isExternal ? <ExternalLink size={12} /> : null}
                        </Link>
                      );
                    })()}
                  </div>
                </div>

                {/* AUTO-RENEW TOGGLE — only for paid-active orders */}
                {lic.kind === "paid-active" && (
                  <AutoRenewToggle
                    orderId={lic.orderId}
                    initial={lic.autoRenewEnabled !== false}
                    cycleLabel={lic.billingCycle === "yearly" ? t("license.cycle_year") : t("license.cycle_month")}
                  />
                )}

                {/* CANCEL — only for active paid orders. Cancelled view inside component. */}
                {lic.kind === "paid-active" && (
                  <CancelSubscriptionButton
                    orderId={lic.orderId}
                    productName={lic.productName}
                    subscriptionExpiresAt={lic.expiresAt}
                    alreadyCancelled={!!lic.cancelledAt}
                  />
                )}

                {/* API CREDENTIALS — only shown when backend provisioned them */}
                {!expired && lic.apiKey && lic.apiBaseUrl && (
                  <div className="space-y-3">
                    <CredentialRow
                      icon={<Globe size={14} className="text-blue-400" />}
                      label={t("license.api_endpoint")}
                      value={lic.apiBaseUrl}
                      copyLabel={t("license.copy_button")}
                      copy
                    />
                    <CredentialRow
                      icon={<Key size={14} className="text-emerald-400" />}
                      label={t("license.api_key")}
                      value={lic.apiKey}
                      copyLabel={t("license.copy_button")}
                      copy
                      monospace
                    />
                    <QuickStartTabs apiBaseUrl={lic.apiBaseUrl} apiKey={lic.apiKey} productId={lic.productId} />
                  </div>
                )}

                {/* PROVISION FAILED — explain why no key is here */}
                {!expired && !lic.apiKey && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                    {t("license.api_pending").split(/\{contact_link\}/).map((part, idx, arr) => (
                      <span key={idx}>
                        {part}
                        {idx < arr.length - 1 && (
                          <Link href="/iletisim" className="underline">{t("license.api_pending_contact_link")}</Link>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* LEGACY license key display (informational) */}
                {!expired && lic.licenseKey && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">{t("license.order_ref_code")}</p>
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
  icon, label, value, copy, copyLabel, monospace,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copy?: boolean;
  copyLabel: string;
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
        {copy && <CopyButton text={value} title={copyLabel} />}
      </div>
    </div>
  );
}


function CopyButton({ text, title }: { text: string; title: string }) {
  return (
    <button
      data-copy={text}
      className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition flex-shrink-0"
      title={title}
    >
      <Copy size={14} />
    </button>
  );
}
