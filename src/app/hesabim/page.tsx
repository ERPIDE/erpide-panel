import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listOrdersByUserId, findUserById, hasUsedTrialForSku } from "@/lib/auth/user-store";
import { Package, Key, User as UserIcon, Mail, ShoppingBag, Sparkles, ArrowRight, Wallet, Shield, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerTranslations } from "@/lib/i18n-server";
import QuickTrialCard from "@/components/account/QuickTrialCard";

export const dynamic = "force-dynamic";

interface TrialOffer {
  productId: string;
  productName: string;
  skuId: string;
  planName: string;
  description: string;
  gradient: string;
}

// Hesabıma açar açmaz tek tıklı trial başlatma için sunulan ürünler.
// hasUsedTrialForSku/active license kontrolüyle her ürünün kartı yalnızca
// uygunsa render edilir.
const TRIAL_OFFERS: TrialOffer[] = [
  {
    productId: "finanserpide",
    productName: "FinansERPIDE",
    skuId: "finanserpide-base-monthly",
    planName: "Temel Paket",
    description: "Çok şirketli ERP — e-Fatura, banka mutabakatı, vergi, cari, fatura. 3 gün boyunca tam erişim.",
    gradient: "from-blue-600 to-purple-600",
  },
  {
    productId: "captchaerpide",
    productName: "CaptchaERPIDE",
    skuId: "captchaerpide-starter-monthly",
    planName: "Starter",
    description: "Captcha çözüm API'si — reCAPTCHA, hCaptcha, image-to-text. 3 gün boyunca günlük 500 çözüm.",
    gradient: "from-emerald-600 to-teal-600",
  },
];

export default async function HesabimPage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim");

  const { t, dateLocale } = await getServerTranslations();
  const user = await findUserById(session.userId!, true);
  const orders = await listOrdersByUserId(session.userId!);
  const now = Date.now();
  const allLicenses = orders.flatMap((o) => o.items.map((item) => ({ ...item, orderDate: o.createdAt, orderStatus: o.status, isTrial: !!o.isTrial, trialExpiresAt: o.trialExpiresAt })));
  const paidLicenseCount = orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + o.items.length, 0);
  const activeTrialCount = orders.filter((o) => o.status === "TRIAL" && o.isTrial && (!o.trialExpiresAt || new Date(o.trialExpiresAt).getTime() > now)).reduce((sum, o) => sum + o.items.length, 0);
  const totalActive = paidLicenseCount + activeTrialCount;

  const activeProductIds = new Set<string>();
  const activeSkuIds = new Set<string>();
  for (const o of orders) {
    if (o.status === "PAID") {
      const exp = o.subscriptionExpiresAt && new Date(o.subscriptionExpiresAt).getTime() < now;
      if (!exp) o.items.forEach((it) => { activeProductIds.add(it.productId); activeSkuIds.add(it.skuId); });
    } else if (o.status === "TRIAL" && o.isTrial) {
      const exp = o.trialExpiresAt && new Date(o.trialExpiresAt).getTime() < now;
      if (!exp) o.items.forEach((it) => { activeProductIds.add(it.productId); activeSkuIds.add(it.skuId); });
    }
  }
  const hasAnyApp = activeProductIds.size > 0;

  // Trial başlatabileceği ürünler — aktif lisansı/aktif trial'ı olmayan
  // VE bu SKU için daha önce trial almamış olanlar.
  const offerableTrials: TrialOffer[] = [];
  for (const offer of TRIAL_OFFERS) {
    if (activeProductIds.has(offer.productId)) continue;
    const used = await hasUsedTrialForSku(session.userId!, offer.skuId);
    if (!used) offerableTrials.push(offer);
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">{t("sidebar.summary")}</span>
        </h1>
        <p className="text-gray-400 text-sm">
          {t("account.welcome_desc").replace("{name}", user?.name || session.email || "")}
        </p>
      </header>

      {hasAnyApp && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{t("account.my_apps")}</h2>
            <span className="text-[11px] text-gray-500">{t("account.click_to_go")}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {activeProductIds.has("finanserpide") && (
              <AppLaunchCard
                href="https://finans.erpide.com/giris"
                icon={Wallet}
                title="FinansERPIDE"
                desc={t("account.app_finanserpide_desc")}
                tone="blue"
                activeLabel={t("account.app_active_badge")}
                openLabel={t("account.app_open")}
              />
            )}
            {activeProductIds.has("captchaerpide") && (
              <AppLaunchCard
                href="https://captcha.erpide.com/dashboard"
                icon={Shield}
                title="CaptchaERPIDE"
                desc={t("account.app_captcha_desc")}
                tone="emerald"
                activeLabel={t("account.app_active_badge")}
                openLabel={t("account.app_open")}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat icon={Package} label={t("account.stat_orders")} value={orders.length.toString()} />
        <Stat
          icon={Key}
          label={t("account.stat_active_licenses")}
          value={totalActive.toString()}
          sub={activeTrialCount > 0 ? t("account.stat_trial_count").replace("{count}", String(activeTrialCount)) : undefined}
        />
        <Stat icon={UserIcon} label={t("account.stat_membership")} value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(dateLocale) : "—"} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <NavCard href="/hesabim/profil" icon={UserIcon} title={t("account.nav_profile")} desc={t("account.nav_profile_desc")} tone="blue" />
        <NavCard href="/hesabim/lisanslarim" icon={Key} title={t("sidebar.licenses")} desc={t("account.nav_licenses_desc").replace("{count}", String(totalActive))} tone="emerald" />
        <NavCard href="/hesabim/siparislerim" icon={ShoppingBag} title={t("sidebar.orders")} desc={t("account.nav_orders_desc").replace("{count}", String(orders.length))} tone="purple" />
        <NavCard href="/hesabim/aktivasyon-kodu" icon={Key} title={t("nav.activation_code")} desc={t("account.nav_activation_desc")} tone="amber" />
        <NavCard href="/hesabim/adres" icon={UserIcon} title={t("account.nav_addresses")} desc={t("account.nav_addresses_desc")} tone="blue" />
        <NavCard href="/urunler" icon={Sparkles} title={t("account.nav_new_product")} desc={t("account.nav_new_product_desc")} tone="purple" />
      </div>

      {user && user.emailVerified === false && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
          <Mail className="text-amber-400 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-200 mb-1">{t("account.verify_email")}</p>
            <p className="text-xs text-gray-400">{t("account.verify_email_desc")}</p>
          </div>
        </div>
      )}

      {/* Trial CTA paneli — lisansı yokken ön plana çıkar; her durumda uygun
          ürünler için tek tık başlatma sunar (eğer henüz denemediyse). */}
      {offerableTrials.length > 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-emerald-300" size={18} />
            <h2 className="font-semibold text-white">3 Gün Ücretsiz Dene</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Kart bilgisi gerekmez. Tıkla, lisansın anında oluşur ve uygulamayı kullanmaya başla.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {offerableTrials.map((o) => (
              <QuickTrialCard
                key={o.skuId}
                productId={o.productId}
                productName={o.productName}
                skuId={o.skuId}
                planName={o.planName}
                description={o.description}
                gradient={o.gradient}
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">{t("account.recent_licenses")}</h2>
          {allLicenses.length > 0 && (
            <Link href="/hesabim/lisanslarim" className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1">
              {t("account.see_all")} <ArrowRight size={12} />
            </Link>
          )}
        </div>
        {allLicenses.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Key size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-1">{t("account.no_licenses")}</p>
            <p className="text-xs text-gray-600 mb-3">
              {offerableTrials.length > 0
                ? "Yukarıdaki '3 Gün Ücretsiz Dene' kartından başla."
                : "Ürünleri inceleyip satın al."}
            </p>
            <Link href="/urunler" className="text-blue-400 hover:underline text-sm">{t("account.browse_products")} →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {allLicenses.slice(0, 5).map((lic, i) => {
              const expired = lic.isTrial && lic.trialExpiresAt && new Date(lic.trialExpiresAt).getTime() < now;
              const label = lic.orderStatus === "PAID"
                ? t("account.lic_status_active")
                : lic.isTrial && !expired
                  ? t("account.lic_status_trial")
                  : expired
                    ? t("account.lic_status_expired")
                    : t("account.lic_status_pending");
              const tone = lic.orderStatus === "PAID"
                ? "bg-green-500/15 text-green-400"
                : lic.isTrial && !expired
                  ? "bg-emerald-500/15 text-emerald-300"
                  : expired
                    ? "bg-red-500/15 text-red-300"
                    : "bg-yellow-500/15 text-yellow-400";
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d14] border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{lic.productName} {lic.skuName}</p>
                    <p className="text-xs font-mono text-blue-400 truncate">{lic.licenseKey}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${tone}`}>{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
      <Icon size={18} className="text-gray-500 mb-3" />
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] text-emerald-300 mt-0.5">{sub}</p>}
    </div>
  );
}

const toneClass: Record<string, string> = {
  blue: "border-blue-500/20 hover:border-blue-500/40 text-blue-400",
  emerald: "border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400",
  purple: "border-purple-500/20 hover:border-purple-500/40 text-purple-400",
  amber: "border-amber-500/20 hover:border-amber-500/40 text-amber-400",
};

function NavCard({ href, icon: Icon, title, desc, tone }: { href: string; icon: React.ComponentType<{ size?: number; className?: string }>; title: string; desc: string; tone: string }) {
  const tc = toneClass[tone] || toneClass.blue;
  const [borderCls, , iconCls] = tc.split(" ");
  return (
    <Link href={href} className={`block p-5 rounded-2xl bg-[#111118] border transition ${borderCls} hover:bg-white/[0.02]`}>
      <Icon size={22} className={iconCls + " mb-3"} />
      <h3 className="font-semibold text-white mb-0.5">{title}</h3>
      <p className="text-xs text-gray-400">{desc}</p>
    </Link>
  );
}


function AppLaunchCard({
  href, icon: Icon, title, desc, tone, activeLabel, openLabel,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  tone: "blue" | "emerald";
  activeLabel: string;
  openLabel: string;
}) {
  const cls = tone === "blue"
    ? "from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50 text-blue-300"
    : "from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br border transition ${cls}`}
    >
      <div className="flex-shrink-0 p-3 rounded-xl bg-white/5 border border-white/5">
        <Icon size={28} className={tone === "blue" ? "text-blue-300" : "text-emerald-300"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-white text-base">{title}</h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-300 border border-green-500/30">{activeLabel}</span>
        </div>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1 text-sm font-semibold opacity-80 group-hover:opacity-100">
        {openLabel} <ExternalLink size={14} />
      </div>
    </a>
  );
}
