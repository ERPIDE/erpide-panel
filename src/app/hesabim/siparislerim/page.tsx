import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { listOrdersByUserId } from "@/lib/auth/user-store";

export default async function SiparislerimPage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim/siparislerim");

  const orders = await listOrdersByUserId(session.userId!);

  return (
    <>
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Siparişlerim</span></h1>
      <p className="text-gray-400 text-sm mb-8">{orders.length} sipariş</p>

      {orders.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#111118] border border-white/5 text-center">
          <p className="text-gray-400 mb-4">Henüz siparişin yok.</p>
          <Link href="/urunler" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-5 rounded-2xl bg-[#111118] border border-white/5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-mono mb-1">{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{order.totalPrice === 0 ? "Ücretsiz" : `${order.totalPrice.toLocaleString("tr-TR")} ${order.currency}`}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <div className="border-t border-white/5 pt-4 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-white">{item.productName} <span className="text-gray-500">— {item.skuName}</span></span>
                    <span className="text-gray-400 font-mono">{order.isTrial ? "deneme" : `${item.price.toLocaleString("tr-TR")} ₺`}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Beklemede", cls: "bg-yellow-500/15 text-yellow-400" },
    PAID: { label: "Ödendi", cls: "bg-green-500/15 text-green-400" },
    FAILED: { label: "Başarısız", cls: "bg-red-500/15 text-red-400" },
    CANCELLED: { label: "İptal", cls: "bg-gray-500/15 text-gray-400" },
    TRIAL: { label: "Deneme", cls: "bg-emerald-500/15 text-emerald-300" },
  };
  const m = map[status] || { label: status, cls: "bg-gray-500/15 text-gray-400" };
  return <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full mt-1 ${m.cls}`}>{m.label}</span>;
}
