"use client";
import { useState, useEffect } from "react";
import {
  Users, CreditCard, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, XCircle, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Database, Globe, Mail,
  Server, Shield, ArrowUpRight, Info, BarChart3,
  DollarSign, Calendar, Zap, Package,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

type Subscriber = {
  orderId: string; userId: string; userName: string; userEmail: string;
  modules: string[]; status: "active" | "trial" | "expired" | "cancelled" | "pending";
  isTrial: boolean; billingCycle: string | null;
  subscriptionExpiresAt: string | null; trialExpiresAt: string | null;
  totalPrice: number; currency: string; createdAt: string; paidAt: string | null;
  autoRenewEnabled: boolean | null;
};
type FinansStats = {
  total: number; active: number; trial: number; expired: number; cancelled: number;
  revenueUSD: number; revenueTRY: number;
};
type AltyapiData = {
  db: {
    sizeMB: number; limitMB: number; usagePct: number;
    tableCounts: { table: string; rows: number }[];
    counts: Record<string, number>;
  };
  packages: {
    vercel:     { plan: string; monthlyCostUSD: number; bandwidthGB: number; buildMinutes: number; serverlessMB: number };
    neon:       { plan: string; monthlyCostUSD: number; storageMB: number; computeHours: number };
    resend:     { plan: string; monthlyCostUSD: number; emailsPerMonth: number; emailsPerDay: number; domains: { name: string; status: string; region: string }[] };
    cloudflare: { plan: string; monthlyCostUSD: number };
    winServer:  { plan: string; monthlyCostUSD: number };
  };
  upgrades: Record<string, { plan: string; priceUSD: number; trigger: string; newLimit?: string }>;
  usdTry: number;
};

// ── Helpers ────────────────────────────────────────────────────────

const statusCfg: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  active:    { label: "Aktif",         cls: "bg-green-500/20 text-green-400 border-green-500/30",    icon: CheckCircle2 },
  trial:     { label: "Deneme",        cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",       icon: Clock },
  expired:   { label: "Süresi Doldu",  cls: "bg-red-500/20 text-red-400 border-red-500/30",         icon: AlertTriangle },
  cancelled: { label: "İptal",         cls: "bg-gray-500/20 text-gray-400 border-gray-500/30",      icon: XCircle },
  pending:   { label: "Beklemede",     cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}
function usd(n: number) { return `$${n % 1 === 0 ? n : n.toFixed(2)}`; }
function try_(n: number) { return `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }

function UsageBar({ pct, color = "" }: { pct: number; color?: string }) {
  const c = color || (pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-400" : "bg-green-500");
  return (
    <div className="w-full bg-white/5 rounded-full h-2 mt-1.5">
      <div className={`h-2 rounded-full transition-all ${c}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

// Büyüme senaryo tablosu satırı
function ScenarioRow({
  label, subscribers, arpu, usdTry, infraUSD,
}: { label: string; subscribers: number; arpu: number; usdTry: number; infraUSD: number }) {
  const monthly = subscribers * arpu;
  const yearly  = monthly * 12;
  const weekly  = monthly / 4.33;
  const infraTRY = infraUSD * usdTry;
  const profit   = monthly - infraUSD;
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      <td className="px-4 py-3 text-sm text-gray-300 font-medium">{label}</td>
      <td className="px-4 py-3 text-sm text-white text-right">{usd(weekly)}</td>
      <td className="px-4 py-3 text-sm text-white text-right">{usd(monthly)}</td>
      <td className="px-4 py-3 text-sm text-white text-right">{usd(yearly)}</td>
      <td className="px-4 py-3 text-sm text-center">
        {infraUSD === 0
          ? <span className="text-green-400 text-xs px-2 py-0.5 rounded-full bg-green-500/10">Ücretsiz Tier</span>
          : <span className="text-yellow-400 text-xs">{usd(infraUSD)}/ay</span>}
      </td>
      <td className="px-4 py-3 text-sm font-bold text-right">
        <span className={profit >= 0 ? "text-green-400" : "text-red-400"}>
          {usd(profit)}/ay
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 text-right">{try_(monthly * usdTry)}/ay</td>
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────

type Tab = "aboneler" | "gelir" | "altyapi";

export default function FinansERPIDEAdminPage() {
  const [tab, setTab]               = useState<Tab>("aboneler");
  const [stats, setStats]           = useState<FinansStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [altyapi, setAltyapi]       = useState<AltyapiData | null>(null);
  const [altyapiLoading, setAltyapiLoading] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<"all" | "active" | "trial" | "expired" | "cancelled">("all");
  const [expanded, setExpanded]     = useState<string | null>(null);

  const loadMain = () => {
    setLoading(true);
    fetch("/api/admin/finanserpide/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d.stats); setSubscribers(d.subscribers); })
      .finally(() => setLoading(false));
  };

  const loadAltyapi = () => {
    if (altyapi) return;
    setAltyapiLoading(true);
    fetch("/api/admin/altyapi/stats")
      .then((r) => r.json())
      .then((d) => setAltyapi(d))
      .finally(() => setAltyapiLoading(false));
  };

  useEffect(loadMain, []);

  useEffect(() => {
    if (tab === "altyapi") loadAltyapi();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered    = filter === "all" ? subscribers : subscribers.filter((s) => s.status === filter);
  const arpu        = stats && stats.active > 0 ? stats.revenueUSD / stats.active : 0;
  const usdTry      = altyapi?.usdTry ?? 38;

  // altyapı için senaryo infra maliyeti hesabı
  function infraForCount(n: number): number {
    // Neon $19 → >250 abone baskısında (DB büyüyünce), Vercel Pro $20 → ekip 3+
    // Şimdilik free tier yeterli
    if (n >= 500) return 39; // Neon Launch + Resend Pro
    if (n >= 250) return 19; // Neon Launch
    return 0;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "aboneler", label: "Aboneler" },
    { id: "gelir",    label: "Gelir & Projeksiyon" },
    { id: "altyapi",  label: "Altyapı & Maliyet" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">FinansERPIDE</h1>
          <p className="text-sm text-gray-500 mt-1">Abonelik · Gelir · Altyapı</p>
        </div>
        <button
          onClick={loadMain}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 rounded-xl p-1 border border-white/5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="text-blue-400 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* ── TAB: Aboneler ──────────────────────────────────────── */}
          {tab === "aboneler" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Toplam Abone",  value: stats.total,     color: "text-blue-400",  bg: "from-blue-600/20 to-blue-600/5",  icon: Users },
                  { label: "Aktif",         value: stats.active,    color: "text-green-400", bg: "from-green-600/20 to-green-600/5", icon: CheckCircle2 },
                  { label: "Deneme",        value: stats.trial,     color: "text-blue-400",  bg: "from-blue-600/20 to-blue-600/5",  icon: Clock },
                  { label: "Süresi Doldu",  value: stats.expired,   color: "text-red-400",   bg: "from-red-600/20 to-red-600/5",   icon: AlertTriangle },
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

              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "active", "trial", "expired", "cancelled"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filter === f
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                    }`}
                  >
                    {f === "all" ? "Tümü" : statusCfg[f]?.label}
                    <span className="ml-2 text-xs opacity-60">
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
                      const cfg  = statusCfg[s.status];
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
                                {[
                                  { label: "Oluşturulma",      value: fmt(s.createdAt) },
                                  { label: "Ödeme Tarihi",     value: fmt(s.paidAt) },
                                  { label: "Bitiş",            value: s.isTrial ? fmt(s.trialExpiresAt) : fmt(s.subscriptionExpiresAt) },
                                  { label: "Otomatik Yenileme",value: s.autoRenewEnabled ? "Açık" : "Kapalı" },
                                  { label: "Order ID",         value: s.orderId, mono: true },
                                ].map((row) => (
                                  <div key={row.label}>
                                    <p className="text-xs text-gray-500">{row.label}</p>
                                    <p className={`text-sm text-white ${row.mono ? "font-mono text-xs" : ""} truncate`}>{row.value}</p>
                                  </div>
                                ))}
                                <div>
                                  <p className="text-xs text-gray-500">Modüller</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {s.modules.length > 0
                                      ? s.modules.map((m, i) => <span key={i} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs">{m}</span>)
                                      : <span className="text-xs text-gray-500">—</span>}
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
            </div>
          )}

          {/* ── TAB: Gelir & Projeksiyon ───────────────────────────── */}
          {tab === "gelir" && (
            <div className="space-y-6">
              {/* Gelir kartları */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Aylık Gelir (USD)",  value: usd(stats.revenueUSD),            icon: DollarSign, color: "text-green-400", bg: "from-green-600/20 to-green-600/5" },
                  { label: "Aylık Gelir (TRY)",  value: try_(stats.revenueTRY),           icon: CreditCard, color: "text-orange-400",bg: "from-orange-600/20 to-orange-600/5" },
                  { label: "Yıllık Gelir (USD)", value: usd(stats.revenueUSD * 12),       icon: TrendingUp, color: "text-blue-400",  bg: "from-blue-600/20 to-blue-600/5" },
                  { label: "ARPU (Ort. Gelir/Abone)", value: usd(arpu),                  icon: BarChart3,  color: "text-purple-400",bg: "from-purple-600/20 to-purple-600/5" },
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-2xl bg-[#111118] border border-white/5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center mb-3`}>
                      <s.icon size={20} className={s.color} />
                    </div>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Dönemsel gelir tablosu */}
              <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-400" />
                  <h3 className="text-sm font-medium text-gray-200">Dönemsel Gelir Özeti (Mevcut Aboneler)</h3>
                </div>
                <div className="grid grid-cols-3 divide-x divide-white/5">
                  {[
                    { label: "Haftalık", value: stats.revenueUSD / 4.33, tryVal: stats.revenueTRY / 4.33 },
                    { label: "Aylık",   value: stats.revenueUSD,         tryVal: stats.revenueTRY },
                    { label: "Yıllık",  value: stats.revenueUSD * 12,    tryVal: stats.revenueTRY * 12 },
                  ].map((d) => (
                    <div key={d.label} className="p-6 text-center">
                      <p className="text-xs text-gray-500 mb-2">{d.label}</p>
                      <p className="text-2xl font-bold text-white">{usd(d.value)}</p>
                      <p className="text-sm text-gray-400 mt-1">{try_(d.tryVal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Büyüme senaryoları */}
              <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-400" />
                  <h3 className="text-sm font-medium text-gray-200">Büyüme Senaryoları</h3>
                  <span className="ml-auto text-xs text-gray-600">ARPU: {usd(arpu || 29)}/abone</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        {["Senaryo", "Haftalık", "Aylık", "Yıllık", "Altyapı", "Net Kâr (USD)", "Net Kâr (TRY)"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 last:text-right">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[10, 25, 50, 100, 250, 500].map((n) => (
                        <ScenarioRow
                          key={n}
                          label={`${n} Abone`}
                          subscribers={n}
                          arpu={arpu || 29}
                          usdTry={38}
                          infraUSD={infraForCount(n)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01]">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info size={11} />
                    ARPU: mevcut aktif abone başına ortalama gelir. Veri yoksa $29 varsayılan kullanılır. Altyapı eşiği: 250+ abone → Neon Launch $19/ay, 500+ → +Resend Pro $20/ay.
                  </p>
                </div>
              </div>

              {/* Aktif abone detay kartı */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1"><Users size={12} />Abone Durumu Dağılımı</p>
                  <div className="space-y-2">
                    {[
                      { label: "Aktif",         value: stats.active,    total: stats.total, color: "bg-green-500" },
                      { label: "Deneme",        value: stats.trial,     total: stats.total, color: "bg-blue-500" },
                      { label: "Süresi Doldu",  value: stats.expired,   total: stats.total, color: "bg-red-500" },
                      { label: "İptal",         value: stats.cancelled, total: stats.total, color: "bg-gray-500" },
                    ].map((r) => (
                      <div key={r.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">{r.label}</span>
                          <span className="text-gray-300">{r.value} ({r.total > 0 ? Math.round(r.value / r.total * 100) : 0}%)</span>
                        </div>
                        <UsageBar pct={r.total > 0 ? r.value / r.total * 100 : 0} color={r.color} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1"><Zap size={12} />Dönüşüm & Büyüme</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Deneme → Aktif Dönüşüm</p>
                      <p className="text-xl font-bold text-white mt-0.5">
                        {stats.total > 0 ? Math.round(stats.active / stats.total * 100) : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Churn Oranı (tahmini)</p>
                      <p className="text-xl font-bold text-white mt-0.5">
                        {stats.total > 0 ? Math.round((stats.expired + stats.cancelled) / stats.total * 100) : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Şu An Ücretlendirilen</p>
                      <p className="text-xl font-bold text-green-400 mt-0.5">{stats.active}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Altyapı & Maliyet ─────────────────────────────── */}
          {tab === "altyapi" && (
            <div className="space-y-6">
              {altyapiLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 size={24} className="text-blue-400 animate-spin" />
                </div>
              ) : altyapi ? (
                <AltyapiTab data={altyapi} productRevenue={stats} />
              ) : (
                <div className="text-center py-20 text-gray-500">Altyapı verisi yüklenemedi.</div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">Veri yüklenemedi.</div>
      )}
    </div>
  );
}

// ── AltyapiTab ─────────────────────────────────────────────────────

function AltyapiTab({ data, productRevenue }: { data: AltyapiData; productRevenue: FinansStats | null }) {
  const { db, packages, upgrades, usdTry } = data;
  const totalMonthlyCostUSD = Object.values(packages).reduce((s, p) => s + p.monthlyCostUSD, 0);
  const totalMonthlyCostTRY = totalMonthlyCostUSD * usdTry;
  const netProfitUSD = (productRevenue?.revenueUSD ?? 0) - totalMonthlyCostUSD;
  const netProfitTRY = (productRevenue?.revenueTRY ?? 0) - totalMonthlyCostTRY;

  return (
    <div className="space-y-6">
      {/* Özet finansal kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Toplam Altyapı Maliyeti", value: usd(totalMonthlyCostUSD) + "/ay", sub: "(Ücretsiz tier)", icon: DollarSign, color: "text-green-400", bg: "from-green-600/20 to-green-600/5" },
          { label: "Aylık Gelir",             value: usd(productRevenue?.revenueUSD ?? 0),                     icon: TrendingUp, color: "text-blue-400",  bg: "from-blue-600/20 to-blue-600/5" },
          { label: "Net Kâr (USD)",           value: usd(netProfitUSD) + "/ay",                                icon: BarChart3,  color: "text-purple-400",bg: "from-purple-600/20 to-purple-600/5" },
          { label: "Net Kâr (TRY)",           value: try_(netProfitTRY) + "/ay",                              icon: CreditCard, color: "text-orange-400",bg: "from-orange-600/20 to-orange-600/5" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-[#111118] border border-white/5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            {s.sub && <div className="text-xs text-green-400 mt-0.5">{s.sub}</div>}
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Paket Kartları */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Package size={14} /> Aktif Paketler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PackageCard
            icon={<Globe size={18} />}
            name="Vercel" plan={packages.vercel.plan} cost={packages.vercel.monthlyCostUSD} currency="USD"
            rows={[
              { label: "Bant Genişliği",  value: `${packages.vercel.bandwidthGB} GB/ay limit`, pct: 12 },
              { label: "Build Dakikası",  value: `${packages.vercel.buildMinutes.toLocaleString()} dk/ay`, pct: 5 },
              { label: "Serverless Fn",   value: `${packages.vercel.serverlessMB} MB / fn`, pct: null },
            ]}
            upgrade={upgrades.vercel}
            upgradeNote="Ekip erişimi veya yüksek trafik gerektiğinde Pro'ya geç"
          />
          <PackageCard
            icon={<Database size={18} />}
            name="Neon Postgres" plan={packages.neon.plan} cost={packages.neon.monthlyCostUSD} currency="USD"
            rows={[
              { label: "Depolama",         value: `${db.sizeMB} MB / ${packages.neon.storageMB} MB`, pct: db.usagePct },
              { label: "Compute Hours",    value: `${packages.neon.computeHours}h/ay limit`, pct: null },
            ]}
            upgrade={upgrades.neon}
            upgradeNote="Neon console.neon.tech üzerinden compute saatlerini kontrol et"
            live
          />
          <PackageCard
            icon={<Mail size={18} />}
            name="Resend" plan={packages.resend.plan} cost={packages.resend.monthlyCostUSD} currency="USD"
            rows={[
              { label: "Aylık Email",     value: `${packages.resend.emailsPerMonth.toLocaleString()} adet limit`, pct: null },
              { label: "Günlük Limit",    value: `${packages.resend.emailsPerDay} adet/gün`, pct: null },
              { label: "Doğrulanmış Domain",
                value: packages.resend.domains.length > 0
                  ? `${packages.resend.domains[0].name} (${packages.resend.domains[0].status})`
                  : "—",
                pct: null,
                highlight: packages.resend.domains[0]?.status === "verified" ? "green" : "red"
              },
            ]}
            upgrade={upgrades.resend}
            upgradeNote="Pro'da 50K email/ay · özel domain analytics"
          />
          <PackageCard
            icon={<Shield size={18} />}
            name="Cloudflare" plan="Free" cost={0} currency="USD"
            rows={[
              { label: "CDN / DNS",        value: "Sınırsız", pct: 0 },
              { label: "Tünel",            value: "CF Tunnel (Win Server)", pct: null },
            ]}
            upgradeNote="WAF + gelişmiş analitik için Pro ($20/ay) düşünülebilir"
          />
          <PackageCard
            icon={<Server size={18} />}
            name="Win Server" plan="Şirket" cost={0} currency="TRY"
            rows={[
              { label: "Data Engine API",  value: "Python FastAPI :8000", pct: null },
              { label: "Captcha FastAPI",  value: ":8080 (Caddy proxy)", pct: null },
              { label: "1C:ERP Server",    value: "Şirket altyapısı", pct: null },
            ]}
            upgradeNote="Harici maliyet yok. Elektrik + donanım şirkete ait."
          />
        </div>
      </div>

      {/* Neon DB Tablo Sayıları */}
      <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-cyan-400" />
            <h3 className="text-sm font-medium text-gray-200">Neon DB — Canlı Kullanım</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Canlı</span>
          </div>
          <span className="text-xs text-gray-500">{db.sizeMB} MB / {db.limitMB} MB (%{db.usagePct})</span>
        </div>
        <div className="p-5">
          <UsageBar pct={db.usagePct} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
            {[
              { label: "Kullanıcılar",   value: db.counts.users },
              { label: "Siparişler",     value: db.counts.orders },
              { label: "Oturumlar",      value: db.counts.sessions },
              { label: "Ticketlar",      value: db.counts.tickets },
              { label: "Pocket Token",   value: db.counts.pocketTokens },
              { label: "DE Lisansları",  value: db.counts.dataEngineLicenses },
              { label: "Müşteriler",     value: db.counts.customers },
              { label: "Yöneticiler",    value: db.counts.admins },
              { label: "Destek Talebi",  value: db.counts.supportRequests },
              { label: "Lisans Kodu",    value: db.counts.licenseCodes },
            ].map((r) => (
              <div key={r.label} className="text-center p-3 bg-white/3 rounded-xl border border-white/5">
                <p className="text-xl font-bold text-white">{r.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.label}</p>
              </div>
            ))}
          </div>
          {db.tableCounts.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Tablo bazlı satır sayıları (pg_stat_user_tables)</p>
              <div className="flex flex-wrap gap-2">
                {db.tableCounts.map((t) => (
                  <span key={t.table} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/8">
                    {t.table}: <span className="text-white">{t.rows.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Maliyet Özet Tablosu */}
      <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <DollarSign size={16} className="text-yellow-400" />
          <h3 className="text-sm font-medium text-gray-200">Haftalık / Aylık / Yıllık Maliyet & Kâr</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Kalem", "Haftalık", "Aylık", "Yıllık", "Notlar"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { kalem: "Vercel (Hobby)",     weekly: 0,    monthly: 0,    yearly: 0,    note: "Free tier — 100GB bant, 6000dk build" },
                { kalem: "Neon Postgres",      weekly: 0,    monthly: 0,    yearly: 0,    note: "Free tier — 512MB, 191.9h compute/ay" },
                { kalem: "Resend",             weekly: 0,    monthly: 0,    yearly: 0,    note: "Free tier — 3000 email/ay, 100/gün" },
                { kalem: "Cloudflare",         weekly: 0,    monthly: 0,    yearly: 0,    note: "Free — tunnel + DNS" },
                { kalem: "Win Server",         weekly: 0,    monthly: 0,    yearly: 0,    note: "Şirket altyapısı, harici maliyet yok" },
              ].map((r) => (
                <tr key={r.kalem} className="border-b border-white/5">
                  <td className="px-5 py-3 text-sm text-gray-300">{r.kalem}</td>
                  <td className="px-5 py-3 text-sm text-white">{usd(r.weekly / 4.33)}</td>
                  <td className="px-5 py-3 text-sm text-white">{usd(r.monthly)}</td>
                  <td className="px-5 py-3 text-sm text-white">{usd(r.yearly)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{r.note}</td>
                </tr>
              ))}
              <tr className="bg-white/[0.02] border-b border-white/5 font-bold">
                <td className="px-5 py-3 text-sm text-gray-200">Toplam Maliyet</td>
                <td className="px-5 py-3 text-sm text-red-400">{usd(0)}</td>
                <td className="px-5 py-3 text-sm text-red-400">{usd(0)}/ay</td>
                <td className="px-5 py-3 text-sm text-red-400">{usd(0)}/yıl</td>
                <td className="px-5 py-3 text-xs text-gray-500">Ücretsiz tier</td>
              </tr>
              <tr className="bg-green-500/[0.03] font-bold">
                <td className="px-5 py-3 text-sm text-gray-200">Net Kâr</td>
                <td className="px-5 py-3 text-sm text-green-400">{usd((productRevenue?.revenueUSD ?? 0) / 4.33)}</td>
                <td className="px-5 py-3 text-sm text-green-400">{usd(productRevenue?.revenueUSD ?? 0)}/ay</td>
                <td className="px-5 py-3 text-sm text-green-400">{usd((productRevenue?.revenueUSD ?? 0) * 12)}/yıl</td>
                <td className="px-5 py-3 text-xs text-gray-500">{try_(productRevenue?.revenueTRY ?? 0)}/ay</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Eşikleri */}
      <div className="rounded-2xl bg-[#111118] border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-yellow-400" />
          <h3 className="text-sm font-medium text-gray-200">Upgrade Eşikleri</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(upgrades).map(([key, u]) => (
            <div key={key} className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/3 border border-white/8">
              <div>
                <p className="text-sm font-medium text-gray-200">{key.charAt(0).toUpperCase() + key.slice(1)} → <span className="text-yellow-400">{u.plan}</span></p>
                <p className="text-xs text-gray-500 mt-0.5">Tetikleyici: {u.trigger}</p>
                {u.newLimit && <p className="text-xs text-blue-400 mt-0.5">Yeni limit: {u.newLimit}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-white">${u.priceUSD}/ay</p>
                <p className="text-xs text-gray-500">{try_(u.priceUSD * usdTry)}/ay</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4 flex items-center gap-1">
          <Info size={11} />
          Tüm paketler şu an ücretsiz tier dahilinde çalışıyor. Yıllık gelirin aylık $39 altyapı maliyetini geçtiği an paketin 100% sürdürülebilir olduğu onaylanmış demektir.
        </p>
      </div>
    </div>
  );
}

// ── PackageCard ────────────────────────────────────────────────────

function PackageCard({
  icon, name, plan, cost, currency, rows, upgrade, upgradeNote, live,
}: {
  icon: React.ReactNode;
  name: string;
  plan: string;
  cost: number;
  currency: "USD" | "TRY";
  rows: { label: string; value: string; pct: number | null; highlight?: "green" | "red" }[];
  upgrade?: { plan: string; priceUSD: number; trigger: string };
  upgradeNote?: string;
  live?: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl bg-[#111118] border border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">{name}</p>
              {live && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Canlı</span>}
            </div>
            <p className="text-xs text-gray-500">{plan}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${cost === 0 ? "text-green-400" : "text-yellow-400"}`}>
            {cost === 0 ? "Ücretsiz" : `${currency === "USD" ? "$" : "₺"}${cost}/ay`}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{r.label}</span>
              <span className={
                r.highlight === "green" ? "text-green-400" :
                r.highlight === "red"   ? "text-red-400"   : "text-gray-300"
              }>{r.value}</span>
            </div>
            {r.pct !== null && <UsageBar pct={r.pct ?? 0} />}
          </div>
        ))}
      </div>
      {upgradeNote && (
        <p className="text-xs text-gray-600 border-t border-white/5 pt-2">{upgradeNote}</p>
      )}
      {upgrade && (
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-gray-600">Upgrade: {upgrade.plan}</span>
          <span className="flex items-center gap-1 text-gray-500">
            ${upgrade.priceUSD}/ay <ArrowUpRight size={10} />
          </span>
        </div>
      )}
    </div>
  );
}
