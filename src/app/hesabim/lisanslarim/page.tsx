import Link from "next/link";
import { redirect } from "next/navigation";
import { Copy, ExternalLink, Clock, ShoppingCart, BookOpen, Key, Globe } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listOrdersByUserId } from "@/lib/auth/user-store";
import { getProductOfSku, getSku } from "@/lib/products";
import QuickStartTabs from "@/components/account/QuickStartTabs";
import AutoRenewToggle from "@/components/account/AutoRenewToggle";
import CancelSubscriptionButton from "@/components/account/CancelSubscriptionButton";
import AiKontorOverview from "@/components/account/AiKontorOverview";
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

/** Lisans → uygulamaya yönlendirme URL'i.
 *  - FinansERPIDE: lisans kodunu prefill ederek /lisans?key=XXX sayfasına
 *    gönderiyoruz — adam kodu manuel kopyalamasın, lisans otomatik
 *    doğrulansın, /uye-ol akışına geçsin.
 *  - CaptchaERPIDE: provision sırasında random şifre üretildiği için adam
 *    dashboard'a şifre ile giremez. /sso?api_key=XXX → backend api key'i
 *    doğrular, access token mint eder, dashboard'a yönlendirir. */
function defaultAppUrl(productId: string, licenseKey?: string, apiKey?: string): string | null {
  switch (productId) {
    case "pocketerpide":  return "/pocket";
    case "finanserpide":  return licenseKey
      ? `https://finans.erpide.com/lisans?key=${encodeURIComponent(licenseKey)}`
      : "https://finans.erpide.com/lisans";
    case "captchaerpide": return apiKey
      ? `https://captcha.erpide.com/sso?api_key=${encodeURIComponent(apiKey)}`
      : "https://captcha.erpide.com/dashboard";
    default:              return null;
  }
}

/** API anahtarı/dashboard credential mantığı yalnızca CaptchaERPIDE için
 *  geçerli (ERPIDE ve Pocket'da API key yok). "API anahtarın
 *  hazırlanıyor" gibi mesajlar bu ürünlerde yanıltıcı. */
function productNeedsApiCredentials(productId: string): boolean {
  return productId === "captchaerpide";
}

/** Aynı SKU için birden fazla aktif trial varsa (geçmiş cache yarışı
 *  yüzünden oluşmuş duplicate'ler), kronolojik olarak en eskisini tut.
 *  forceFresh fix sonrası yeni duplicate oluşmaz, bu dedup geçmiş kayıtları
 *  UI'da gizler — backend'de kalır ve 3 günde expire olur. */
function dedupActiveTrials(rows: LicenseRow[]): LicenseRow[] {
  const seen = new Set<string>();
  const result: LicenseRow[] = [];
  const sorted = rows.slice().sort((a, b) => a.orderDate.localeCompare(b.orderDate));
  for (const r of sorted) {
    if (r.kind === "trial-active") {
      if (seen.has(r.skuId)) continue;
      seen.add(r.skuId);
    }
    result.push(r);
  }
  return result;
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
  // AI Kontör paketleri "lisans" değil "bakiye"; sayfa basinda tek ozet kartta
  // toplanir (AiKontorOverview), asagidaki lisans listesinde tekrar gosterilmez.
  const aiKontorOrders: Array<{
    orderId: string;
    createdAt: string;
    skuId: string;
    skuName: string;
    granted: number;
    consumed: number;
    expiresAt: string | null;
  }> = [];
  const now = Date.now();
  for (const o of orders) {
    if (o.status === "PAID") {
      const expired = !!o.subscriptionExpiresAt && new Date(o.subscriptionExpiresAt).getTime() < now;
      for (const item of o.items) {
        // AI Kontor paketleri overview kartina yaz, lisans listesinde gosterme.
        if (item.productId === "ai-kontor") {
          const sku = getSku(item.skuId);
          aiKontorOrders.push({
            orderId: o.id,
            createdAt: o.createdAt,
            skuId: item.skuId,
            skuName: item.skuName,
            granted: sku?.creditsGranted ?? 0,
            // Order seviyesinde tek consumed sayaci — birden fazla item olabilir
            // ama panelde uygulamada hep tek paket aliniyor; cogul olursa hepsi
            // bu tek sayaci paylasir, ozet kartin toplami yine dogru.
            consumed: o.creditsConsumed ?? 0,
            expiresAt: o.subscriptionExpiresAt ?? null,
          });
          continue;
        }
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

  // Aktif FinansERPIDE plani var mi? (Eylul AI butonunu acmak icin gerekli)
  const hasActiveFinansERPIDE = licenses.some(
    (l) => l.productId === "finanserpide" && l.kind === "paid-active"
  );

  return (
    <>
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">{t("sidebar.licenses")}</span></h1>
      <p className="text-gray-400 text-sm mb-8">{t("license.subtitle")}</p>

      {aiKontorOrders.length > 0 && (
        <div className="mb-6">
          <AiKontorOverview
            orders={aiKontorOrders}
            hasActiveFinansERPIDE={hasActiveFinansERPIDE}
            dateLocale={dateLocale}
          />
        </div>
      )}

      {licenses.length === 0 && aiKontorOrders.length === 0 ? (
        <EmptyLicenses session={session} t={t} />
      ) : licenses.length === 0 ? (
        // Sadece AI Kontor var, baska lisans yok — yine ek dene CTA goster
        <EmptyLicenses session={session} t={t} />
      ) : (
        <div className="space-y-4">
          {dedupActiveTrials(licenses).map((lic, i) => {
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
                      // CaptchaERPIDE için backend'in döndürdüğü dashboardUrl
                      // (/dashboard) yerine SSO URL'i tercih et — adam şifre
                      // bilmeden dashboard'a girer.
                      const computedUrl = defaultAppUrl(lic.productId, lic.licenseKey, lic.apiKey);
                      const url = lic.productId === "captchaerpide"
                        ? (computedUrl || lic.dashboardUrl)
                        : (lic.dashboardUrl || computedUrl);
                      if (!url) return null;
                      const isExternal = url.startsWith("http");
                      const label =
                        lic.productId === "pocketerpide" ? t("license.open_wallet")
                        : lic.productId === "finanserpide" ? "Şirket Hesabımı Kur / Aç"
                        : lic.productId === "captchaerpide" ? "Dashboard'a Tek Tıkla Gir"
                        : t("license.open_app");
                      return (
                        <Link
                          href={url}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition font-medium"
                        >
                          {label}
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

                {/* PROVISION FAILED — only show for products that actually
                    need API credentials (CaptchaERPIDE). FinansERPIDE and
                    PocketERPIDE don't issue API keys, so this warning would
                    be misleading there. */}
                {!expired && !lic.apiKey && productNeedsApiCredentials(lic.productId) && (
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

                {/* FinansERPIDE için yönlendirme + lisans key prominent.
                    Adam butonu kullanmayıp manuel /lisans sayfasına gitse de
                    burada kopyalayabilsin. CredentialRow zaten kopya butonu
                    sağlıyor. */}
                {!expired && lic.productId === "finanserpide" && (
                  <div className="space-y-3">
                    <CredentialRow
                      icon={<Key size={14} className="text-emerald-400" />}
                      label="LİSANS ANAHTARI"
                      value={lic.licenseKey}
                      copyLabel={t("license.copy_button")}
                      copy
                      monospace
                    />
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-200/90">
                      <strong className="text-blue-300">İlk kez mi gidiyorsun?</strong> &quot;Şirket Hesabımı Kur&quot; tıkla,
                      lisans kodun otomatik doğrulanacak. Sonra VKN + şirket
                      bilgilerini girip yeni bir şifre belirleyeceksin (erpide.com
                      şifrenden farklı). Hesap kurulduktan sonra aynı buton
                      doğrudan FinansERPIDE&apos;i açar.
                      <br /><br />
                      <span className="text-blue-300/70">Veya:</span> yukarıdaki anahtarı kopyalayıp
                      finans.erpide.com/lisans sayfasına manuel yapıştırabilirsin.
                    </div>
                  </div>
                )}

                {/* LEGACY license key display — FinansERPIDE için yukarıda
                    prominent CredentialRow'da zaten gösterdik, tekrar etme.
                    Diğer ürünler için referans olarak küçük gri kalsın. */}
                {!expired && lic.licenseKey && lic.productId !== "finanserpide" && (
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


function EmptyLicenses({ t }: { session: { userId?: string }; t: (k: string) => string }) {
  return (
    <div className="p-10 rounded-2xl bg-[#111118] border border-white/5 text-center">
      <p className="text-gray-400 mb-4">{t("account.no_licenses")}</p>
      <Link href="/urunler" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
        {t("cart.browse_products")}
      </Link>
    </div>
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
