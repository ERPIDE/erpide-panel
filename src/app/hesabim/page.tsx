import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { requireUser } from "@/lib/auth/session";
import { listOrdersByUserId, findUserById } from "@/lib/auth/user-store";
import { Package, Key, User as UserIcon, LogOut } from "lucide-react";

export default async function HesabimPage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim");

  const user = await findUserById(session.userId!);
  const orders = await listOrdersByUserId(session.userId!);
  const allLicenses = orders.flatMap((o) => o.items.map((item) => ({ ...item, orderDate: o.createdAt, orderStatus: o.status })));
  const paidLicenseCount = orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + o.items.length, 0);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="gradient-text">Hesabım</span>
            </h1>
            <p className="text-gray-400 text-sm">
              Hoş geldin {user?.name || session.email} — siparişlerini ve lisanslarını buradan yönet.
            </p>
          </header>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Stat icon={Package} label="Sipariş Sayısı" value={orders.length.toString()} />
            <Stat icon={Key} label="Aktif Lisans" value={paidLicenseCount.toString()} />
            <Stat icon={UserIcon} label="Üyelik" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("tr-TR") : "—"} />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <NavCard href="/hesabim/lisanslarim" icon={Key} title="Lisanslarım" desc={`${paidLicenseCount} aktif lisans anahtarı`} />
            <NavCard href="/hesabim/siparislerim" icon={Package} title="Siparişlerim" desc={`${orders.length} sipariş geçmişi`} />
          </div>

          <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
            <h2 className="font-semibold text-white mb-4">Son Lisanslar</h2>
            {allLicenses.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Key size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Henüz lisansın yok.</p>
                <Link href="/urunler" className="text-blue-400 hover:underline text-sm">Ürünleri incele →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {allLicenses.slice(0, 5).map((lic, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d14] border border-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{lic.productName} {lic.skuName}</p>
                      <p className="text-xs font-mono text-blue-400 truncate">{lic.licenseKey}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${lic.orderStatus === "PAID" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {lic.orderStatus === "PAID" ? "Aktif" : "Beklemede"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form action="/api/shop/auth/logout" method="POST" className="mt-8 text-center">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition">
              <LogOut size={14} /> Çıkış Yap
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
      <Icon size={18} className="text-gray-500 mb-3" />
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function NavCard({ href, icon: Icon, title, desc }: { href: string; icon: React.ComponentType<{ size?: number; className?: string }>; title: string; desc: string }) {
  return (
    <Link href={href} className="block p-6 rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/30 transition">
      <Icon size={24} className="text-blue-400 mb-3" />
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </Link>
  );
}
