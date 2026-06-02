import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listOrdersByUserId, findUserById } from "@/lib/auth/user-store";
import { Package, Key, User as UserIcon, Mail, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";

export default async function HesabimPage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim");

  const user = await findUserById(session.userId!);
  const orders = await listOrdersByUserId(session.userId!);
  const now = Date.now();
  const allLicenses = orders.flatMap((o) => o.items.map((item) => ({ ...item, orderDate: o.createdAt, orderStatus: o.status, isTrial: !!o.isTrial, trialExpiresAt: o.trialExpiresAt })));
  const paidLicenseCount = orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + o.items.length, 0);
  const activeTrialCount = orders.filter((o) => o.status === "TRIAL" && o.isTrial && (!o.trialExpiresAt || new Date(o.trialExpiresAt).getTime() > now)).reduce((sum, o) => sum + o.items.length, 0);
  const totalActive = paidLicenseCount + activeTrialCount;

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">Özet</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Hoş geldin {user?.name || session.email} — siparişlerini, lisanslarını ve profil bilgilerini buradan yönet.
        </p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat icon={Package} label="Sipariş Sayısı" value={orders.length.toString()} />
        <Stat icon={Key} label="Aktif Lisans" value={totalActive.toString()} sub={activeTrialCount > 0 ? `${activeTrialCount} deneme` : undefined} />
        <Stat icon={UserIcon} label="Üyelik" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("tr-TR") : "—"} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <NavCard href="/hesabim/profil" icon={UserIcon} title="Profil" desc="Ad, telefon, TC kimlik" tone="blue" />
        <NavCard href="/hesabim/lisanslarim" icon={Key} title="Lisanslarım" desc={`${totalActive} aktif`} tone="emerald" />
        <NavCard href="/hesabim/siparislerim" icon={ShoppingBag} title="Siparişlerim" desc={`${orders.length} sipariş`} tone="purple" />
        <NavCard href="/urunler" icon={Sparkles} title="Yeni Ürün" desc="Trial başlat ya da satın al" tone="amber" />
      </div>

      {!user?.emailVerified && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
          <Mail className="text-amber-400 mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-200 mb-1">E-postanı doğrula</p>
            <p className="text-xs text-gray-400">Bazı işlemler (deneme başlatma, ödeme) için e-postanı doğrulaman gerekiyor. Mailini bulamıyorsan tekrar gönderebilirsin.</p>
          </div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Son Lisanslar</h2>
          {allLicenses.length > 0 && (
            <Link href="/hesabim/lisanslarim" className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1">
              Tümü <ArrowRight size={12} />
            </Link>
          )}
        </div>
        {allLicenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Key size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz lisansın yok.</p>
            <Link href="/urunler" className="text-blue-400 hover:underline text-sm">Ürünleri incele →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {allLicenses.slice(0, 5).map((lic, i) => {
              const expired = lic.isTrial && lic.trialExpiresAt && new Date(lic.trialExpiresAt).getTime() < now;
              const label = lic.orderStatus === "PAID" ? "Aktif" : lic.isTrial && !expired ? "Deneme" : expired ? "Süresi Doldu" : "Beklemede";
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
  const t = toneClass[tone] || toneClass.blue;
  const [borderCls, , iconCls] = t.split(" ");
  return (
    <Link href={href} className={`block p-5 rounded-2xl bg-[#111118] border transition ${borderCls} hover:bg-white/[0.02]`}>
      <Icon size={22} className={iconCls + " mb-3"} />
      <h3 className="font-semibold text-white mb-0.5">{title}</h3>
      <p className="text-xs text-gray-400">{desc}</p>
    </Link>
  );
}
