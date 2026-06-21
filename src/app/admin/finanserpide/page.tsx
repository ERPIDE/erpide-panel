"use client";
import { useState, useEffect } from "react";
import {
  Users, CreditCard, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, XCircle, RefreshCw, Loader2,
  ChevronDown, ChevronUp,
} from "lucide-react";

type Subscriber = {
  orderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  modules: string[];
  status: "active" | "trial" | "expired" | "cancelled" | "pending";
  isTrial: boolean;
  billingCycle: string | null;
  subscriptionExpiresAt: string | null;
  trialExpiresAt: string | null;
  totalPrice: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  autoRenewEnabled: boolean | null;
};

type Stats = {
  total: number;
  active: number;
  trial: number;
  expired: number;
  cancelled: number;
  revenueUSD: number;
  revenueTRY: number;
};

const statusConfig: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  active:    { label: "Aktif",     cls: "bg-green-500/20 text-green-400 border-green-500/30",    icon: CheckCircle2 },
  trial:     { label: "Deneme",    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",       icon: Clock },
  expired:   { label: "Süresi Doldu", cls: "bg-red-500/20 text-red-400 border-red-500/30",      icon: AlertTriangle },
  cancelled: { label: "İptal",     cls: "bg-gray-500/20 text-gray-400 border-gray-500/30",      icon: XCircle },
  pending:   { label: "Beklemede", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export default function FinansERPIDEAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "trial" | "expired" | "cancelled">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/finanserpide/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setSubscribers(data.subscribers);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = filter === "all" ? subscribers : subscribers.filter((s) => s.status === filter);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">FinansERPIDE</h1>
          <p className="text-sm text-gray-500 mt-1">Abonelik ve gelir yönetimi</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="text-blue-400 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Toplam Abone", value: stats.total, icon: Users, color: "text-blue-400", bg: "from-blue-600/20 to-blue-600/5" },
              { label: "Aktif", value: stats.active, icon: CheckCircle2, color: "text-green-400", bg: "from-green-600/20 to-green-600/5" },
              { label: "Deneme", value: stats.trial, icon: Clock, color: "text-blue-400", bg: "from-blue-600/20 to-blue-600/5" },
              { label: "Süresi Doldu", value: stats.expired, icon: AlertTriangle, color: "text-red-400", bg: "from-red-600/20 to-red-600/5" },
            ].map((s) => (
              <div key={s.label} className="p-5 rounded-2xl bg-[#111118] border border-white/5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Revenue */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-400" />
                <span className="text-sm text-gray-400">Aylık Gelir (USD)</span>
              </div>
              <div className="text-2xl font-bold text-white">${stats.revenueUSD.toFixed(2)}</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={16} className="text-orange-400" />
                <span className="text-sm text-gray-400">Aylık Gelir (TRY)</span>
              </div>
              <div className="text-2xl font-bold text-white">₺{stats.revenueTRY.toFixed(2)}</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "active", "trial", "expired", "cancelled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  filter === f
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                }`}
              >
                {f === "all" ? "Tümü" : statusConfig[f]?.label}
                <span className="ml-2 text-xs opacity-70">
                  {f === "all" ? subscribers.length : subscribers.filter((s) => s.status === f).length}
                </span>
              </button>
            ))}
          </div>

          {/* Subscriber Table */}
          <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">Bu filtreye uygun abone yok.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map((s) => {
                  const cfg = statusConfig[s.status];
                  const Icon = cfg.icon;
                  const isOpen = expanded === s.orderId;
                  return (
                    <div key={s.orderId}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : s.orderId)}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{s.userName}</p>
                          <p className="text-xs text-gray-500 truncate">{s.userEmail}</p>
                        </div>
                        <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-sm text-white">{s.totalPrice} {s.currency}</p>
                          <p className="text-xs text-gray-500">{s.billingCycle || "—"}</p>
                        </div>
                        {isOpen ? <ChevronUp size={16} className="text-gray-500 shrink-0" /> : <ChevronDown size={16} className="text-gray-500 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 bg-white/[0.01] border-t border-white/5">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                            <div>
                              <p className="text-xs text-gray-500">Oluşturulma</p>
                              <p className="text-sm text-white">{fmt(s.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Ödeme Tarihi</p>
                              <p className="text-sm text-white">{fmt(s.paidAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Bitiş</p>
                              <p className="text-sm text-white">
                                {s.isTrial ? fmt(s.trialExpiresAt) : fmt(s.subscriptionExpiresAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Otomatik Yenileme</p>
                              <p className="text-sm text-white">{s.autoRenewEnabled ? "Açık" : "Kapalı"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Order ID</p>
                              <p className="text-xs text-gray-400 font-mono truncate">{s.orderId}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Modüller</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {s.modules.length > 0
                                  ? s.modules.map((m, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs">{m}</span>
                                    ))
                                  : <span className="text-xs text-gray-500">—</span>
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">Veri yüklenemedi.</div>
      )}
    </div>
  );
}
