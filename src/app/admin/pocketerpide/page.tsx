"use client";
import { useState, useEffect } from "react";
import {
  Smartphone, Users, RefreshCw, Loader2, Wifi, Bell,
  Activity, ChevronDown, ChevronUp, Database, Globe, Mail,
  Server, Shield, AlertTriangle, DollarSign, TrendingUp,
  BarChart3, CreditCard, ArrowUpRight, Info, Package, CheckCircle2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

type PocketStats = {
  totalTokens: number; uniqueUsers: number; syncedUsers: number;
  pushEnabledDevices: number; platformCounts: Record<string, number>;
  paidSubscribers: number;
};
type RecentSync = { userId: string; updatedAt: string };
type PocketUser = {
  userId: string; name: string | null; email: string | null;
  registeredAt: string | null; tokens: number; hasSynced: boolean;
  lastSync: string | null; pushDevices: number; lastTokenUsed: string | null;
  isPaid: boolean;
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

function fmt(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function usd(n: number) { return `$${n % 1 === 0 ? n : n.toFixed(2)}`; }
function try_(n: number) { return `₺${n.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`; }

function UsageBar({ pct, color = "" }: { pct: number; color?: string }) {
  const c = color || (pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-400" : "bg-green-500");
  return (
    <div className="w-full bg-white/5 rounded-full h-2 mt-1.5">
      <div className={`h-2 rounded-full transition-all ${c}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function ScenarioRow({
  label, users, arpu, infraUSD, usdTry,
}: { label: string; users: number; arpu: number; infraUSD: number; usdTry: number }) {
  const monthly = users * arpu;
  const yearly  = monthly * 12;
  const weekly  = monthly / 4.33;
  const profit  = monthly - infraUSD;
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
        <span className={profit >= 0 ? "text-green-400" : "text-red-400"}>{usd(profit)}/ay</span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 text-right">{try_(monthly * usdTry)}/ay</td>
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────

type Tab = "kullanici" | "senkron" | "altyapi";

export default function PocketERPIDEAdminPage() {
  const [tab, setTab]           = useState<Tab>("kullanici");
  const [stats, setStats]       = useState<PocketStats | null>(null);
  const [pocketUsers, setPocketUsers] = useState<PocketUser[]>([]);
  const [recentSyncs, setRecentSyncs] = useState<RecentSync[]>([]);
  const [altyapi, setAltyapi]   = useState<AltyapiData | null>(null);
  const [altyapiLoading, setAltyapiLoading] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [showSyncs, setShowSyncs] = useState(true);

  const loadMain = () => {
    setLoading(true);
    fetch("/api/admin/pocketerpide/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d.stats); setPocketUsers(d.users || []); setRecentSyncs(d.recentSyncs || []); })
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
  useEffect(() => { if (tab === "altyapi") loadAltyapi(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const ARPU_DEFAULT = 19; // PocketERPIDE tahmini aylık ARPU ($)

  function infraForCount(n: number): number {
    if (n >= 500) return 39;
    if (n >= 250) return 19;
    return 0;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "kullanici", label: "Kullanıcılar" },
    { id: "senkron",   label: "Senkronizasyon" },
    { id: "altyapi",   label: "Altyapı & Maliyet" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pocket</h1>
          <p className="text-sm text-gray-500 mt-1">Mobil Kullanıcılar · Senkronizasyon · Altyapı</p>
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
              tab === t.id ? "bg-pink-600/20 text-pink-400 border border-pink-500/30" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="text-pink-400 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* ── TAB: Kullanıcılar ─────────────────────────────────── */}
          {tab === "kullanici" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Benzersiz Kullanıcı",  value: stats.uniqueUsers,        icon: Users,       color: "text-pink-400",   bg: "from-pink-600/20 to-pink-600/5" },
                  { label: "Aktif Token",           value: stats.totalTokens,        icon: Smartphone,  color: "text-rose-400",   bg: "from-rose-600/20 to-rose-600/5" },
                  { label: "Senkronize Eden",       value: stats.syncedUsers,        icon: Wifi,        color: "text-purple-400", bg: "from-purple-600/20 to-purple-600/5" },
                  { label: "Push Bildirimi Açık",   value: stats.pushEnabledDevices, icon: Bell,        color: "text-orange-400", bg: "from-orange-600/20 to-orange-600/5" },
                  { label: "Ücretli Abone",         value: stats.paidSubscribers,    icon: Activity,    color: "text-green-400",  bg: "from-green-600/20 to-green-600/5" },
                  { label: "Push Oranı",
                    value: stats.uniqueUsers > 0 ? `%${Math.round(stats.pushEnabledDevices / stats.uniqueUsers * 100)}` : "—",
                    icon: CheckCircle2, color: "text-blue-400", bg: "from-blue-600/20 to-blue-600/5" },
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

              {/* Platform Dağılımı */}
              {Object.keys(stats.platformCounts).length > 0 && (
                <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">Platform Dağılımı (Push Token)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(stats.platformCounts).map(([platform, count]) => {
                      const total = Object.values(stats.platformCounts).reduce((a, b) => a + b, 0);
                      const pct   = total > 0 ? Math.round(count / total * 100) : 0;
                      return (
                        <div key={platform} className="p-4 rounded-xl bg-white/3 border border-white/8 text-center">
                          <Smartphone size={20} className="text-pink-400 mx-auto mb-2" />
                          <p className="text-xl font-bold text-white">{count}</p>
                          <p className="text-xs text-gray-500 uppercase mt-0.5">{platform}</p>
                          <p className="text-xs text-pink-400 mt-1">%{pct}</p>
                          <UsageBar pct={pct} color="bg-pink-500" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Kullanıcı Aktivite Özeti */}
              <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Kullanıcı Aktivite Özeti</h3>
                <div className="space-y-3">
                  {[
                    { label: "Senkronizasyon Oranı",
                      value: stats.uniqueUsers > 0 ? stats.syncedUsers / stats.uniqueUsers * 100 : 0,
                      text: `${stats.syncedUsers} / ${stats.uniqueUsers} kullanıcı`, color: "bg-purple-500" },
                    { label: "Push Bildirimi Oranı",
                      value: stats.uniqueUsers > 0 ? stats.pushEnabledDevices / stats.uniqueUsers * 100 : 0,
                      text: `${stats.pushEnabledDevices} / ${stats.uniqueUsers} cihaz`, color: "bg-orange-500" },
                    { label: "Ücretli Abone Oranı",
                      value: stats.uniqueUsers > 0 ? stats.paidSubscribers / stats.uniqueUsers * 100 : 0,
                      text: `${stats.paidSubscribers} / ${stats.uniqueUsers} kullanıcı`, color: "bg-green-500" },
                  ].map((r) => (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{r.label}</span>
                        <span className="text-gray-300">{r.text} (%{Math.round(r.value)})</span>
                      </div>
                      <UsageBar pct={r.value} color={r.color} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Kullanıcı Listesi */}
              {pocketUsers.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">Kullanıcı Listesi</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 text-left">
                          <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500">Kullanıcı</th>
                          <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500">Kayıt</th>
                          <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 text-center">Token</th>
                          <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 text-center">Push</th>
                          <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500">Son Sync</th>
                          <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500">Son Aktivite</th>
                          <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 text-center">Abonelik</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pocketUsers.map((u) => (
                          <tr key={u.userId} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-3 py-3">
                              <p className="text-sm text-white font-medium">{u.name || "Bilinmeyen kullanıcı"}</p>
                              <p className="text-xs text-gray-500">{u.email || u.userId}</p>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">{u.registeredAt ? fmt(u.registeredAt) : "—"}</td>
                            <td className="px-3 py-3 text-sm text-white text-center">{u.tokens}</td>
                            <td className="px-3 py-3 text-sm text-center">
                              {u.pushDevices > 0
                                ? <span className="text-orange-400">{u.pushDevices} cihaz</span>
                                : <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-3 py-3 text-xs whitespace-nowrap">
                              {u.hasSynced && u.lastSync
                                ? <span className="text-purple-400">{fmt(u.lastSync)}</span>
                                : <span className="text-gray-600">Hiç sync yok</span>}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">{u.lastTokenUsed ? fmt(u.lastTokenUsed) : "—"}</td>
                            <td className="px-3 py-3 text-center">
                              {u.isPaid
                                ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">Ücretli</span>
                                : <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500">Ücretsiz</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {stats.uniqueUsers === 0 && (
                <div className="p-10 rounded-2xl bg-[#111118] border border-white/5 text-center">
                  <Smartphone size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Henüz kayıtlı mobil kullanıcı yok.</p>
                  <p className="text-xs text-gray-600 mt-1">TestFlight veya Play Store üzerinden kullanıcılar kaydolduktan sonra burada görünecek.</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Senkronizasyon ───────────────────────────────── */}
          {tab === "senkron" && (
            <div className="space-y-6">
              {/* Senkron kartlar */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Toplam Sync",     value: stats.syncedUsers,  color: "text-purple-400", bg: "from-purple-600/20 to-purple-600/5", icon: Wifi },
                  { label: "Sync Oranı",      value: stats.uniqueUsers > 0 ? `%${Math.round(stats.syncedUsers / stats.uniqueUsers * 100)}` : "—",
                                                                          color: "text-blue-400",   bg: "from-blue-600/20 to-blue-600/5",    icon: Activity },
                  { label: "Push Aktif",      value: stats.pushEnabledDevices, color: "text-orange-400", bg: "from-orange-600/20 to-orange-600/5", icon: Bell },
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

              {/* Son Senkronizasyonlar */}
              {recentSyncs.length > 0 ? (
                <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setShowSyncs(!showSyncs)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition"
                  >
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-purple-400" />
                      <span className="text-sm font-medium text-gray-300">Son Senkronizasyonlar</span>
                      <span className="text-xs text-gray-600">({recentSyncs.length})</span>
                    </div>
                    {showSyncs ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </button>
                  {showSyncs && (
                    <div className="divide-y divide-white/5 border-t border-white/5">
                      {recentSyncs.map((s, i) => (
                        <div key={i} className="px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">{s.userId}</span>
                          </div>
                          <span className="text-xs text-gray-500">{fmt(s.updatedAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 rounded-2xl bg-[#111118] border border-white/5 text-center">
                  <Wifi size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Henüz senkronizasyon kaydı yok.</p>
                </div>
              )}

              {/* Senkron Analizi */}
              <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
                <h3 className="text-sm font-medium text-gray-300 mb-4">Senkronizasyon Analizi</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">En Son Sync</p>
                    <p className="text-sm text-white">
                      {recentSyncs[0] ? fmt(recentSyncs[0].updatedAt) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sync Yapmayan Kullanıcı</p>
                    <p className="text-sm text-white">{stats.uniqueUsers - stats.syncedUsers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Token Başına Kullanıcı</p>
                    <p className="text-sm text-white">
                      {stats.uniqueUsers > 0 && stats.totalTokens > 0
                        ? (stats.totalTokens / stats.uniqueUsers).toFixed(1)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Push Token Oranı</p>
                    <p className="text-sm text-white">
                      {stats.totalTokens > 0
                        ? `%${Math.round(stats.pushEnabledDevices / stats.totalTokens * 100)}`
                        : "—"}
                    </p>
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
                  <Loader2 size={24} className="text-pink-400 animate-spin" />
                </div>
              ) : altyapi ? (
                <PocketAltyapiTab data={altyapi} pocketStats={stats} infraForCount={infraForCount} />
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

// ── PocketAltyapiTab ───────────────────────────────────────────────

function PocketAltyapiTab({
  data, pocketStats, infraForCount,
}: {
  data: AltyapiData;
  pocketStats: PocketStats | null;
  infraForCount: (n: number) => number;
}) {
  const { db, packages, upgrades, usdTry } = data;
  const totalMonthlyCostUSD = 0; // şu an ücretsiz tier
  const ARPU = 19; // PocketERPIDE aylık ARPU tahmini

  // Aylık gelir tahmini (ücretli abone × ARPU)
  const monthlyRevenueUSD = (pocketStats?.paidSubscribers ?? 0) * ARPU;
  const netProfitUSD = monthlyRevenueUSD - totalMonthlyCostUSD;

  return (
    <div className="space-y-6">
      {/* Özet finansal kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Altyapı Maliyeti",   value: "Ücretsiz Tier", sub: "$0/ay şu an",      icon: DollarSign, color: "text-green-400", bg: "from-green-600/20 to-green-600/5" },
          { label: "Aylık Gelir (tahmini)", value: usd(monthlyRevenueUSD),                 icon: TrendingUp, color: "text-blue-400",  bg: "from-blue-600/20 to-blue-600/5" },
          { label: "Net Kâr (USD)",      value: usd(netProfitUSD) + "/ay",                icon: BarChart3,  color: "text-purple-400",bg: "from-purple-600/20 to-purple-600/5" },
          { label: "Net Kâr (TRY)",      value: try_(netProfitUSD * usdTry) + "/ay",      icon: CreditCard, color: "text-orange-400",bg: "from-orange-600/20 to-orange-600/5" },
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
          <PkgCard icon={<Globe size={18} />} name="Vercel" plan={packages.vercel.plan} cost={0} currency="USD"
            rows={[
              { label: "Bant Genişliği", value: `${packages.vercel.bandwidthGB} GB/ay`, pct: 12 },
              { label: "Build Dakika",   value: `${packages.vercel.buildMinutes.toLocaleString()} dk/ay`, pct: 5 },
            ]}
            upgradeNote={`Pro: ekip erişimi, 1TB bant → $${upgrades.vercel.priceUSD}/ay`}
          />
          <PkgCard icon={<Database size={18} />} name="Neon Postgres" plan={packages.neon.plan} cost={0} currency="USD"
            rows={[
              { label: "Depolama",      value: `${db.sizeMB} MB / ${packages.neon.storageMB} MB`, pct: db.usagePct },
              { label: "Compute/ay",    value: `${packages.neon.computeHours}h limit`, pct: null },
            ]}
            upgradeNote={`Launch: >512MB veya >191.9h → $${upgrades.neon.priceUSD}/ay`}
            live
          />
          <PkgCard icon={<Mail size={18} />} name="Resend" plan={packages.resend.plan} cost={0} currency="USD"
            rows={[
              { label: "Aylık Email",  value: `${packages.resend.emailsPerMonth.toLocaleString()} limit`, pct: null },
              { label: "Günlük Limit", value: `${packages.resend.emailsPerDay}/gün`, pct: null },
              { label: "Domain",
                value: packages.resend.domains[0]
                  ? `${packages.resend.domains[0].name} (${packages.resend.domains[0].status})`
                  : "—",
                pct: null,
                highlight: packages.resend.domains[0]?.status === "verified" ? "green" : "red" },
            ]}
            upgradeNote={`Pro: 50K email/ay → $${upgrades.resend.priceUSD}/ay`}
          />
          <PkgCard icon={<Shield size={18} />} name="Cloudflare" plan="Free" cost={0} currency="USD"
            rows={[
              { label: "CDN / DNS",  value: "Sınırsız", pct: 0 },
              { label: "CF Tunnel",  value: "Win Server (Caddy)", pct: null },
            ]}
            upgradeNote="WAF + gelişmiş analitik için Pro düşünülebilir"
          />
          <PkgCard icon={<Server size={18} />} name="Win Server" plan="Şirket" cost={0} currency="TRY"
            rows={[
              { label: "Data Engine API", value: "FastAPI :8000", pct: null },
              { label: "Captcha FastAPI", value: "Caddy proxy", pct: null },
            ]}
            upgradeNote="Harici maliyet yok, şirket altyapısı"
          />
          <PkgCard icon={<Smartphone size={18} />} name="EAS (Expo)" plan="Free" cost={0} currency="USD"
            rows={[
              { label: "Build/ay",   value: "30 adet limit", pct: 20 },
              { label: "OTA Update", value: "Sınırsız", pct: 0 },
              { label: "Platform",   value: "iOS + Android", pct: null },
            ]}
            upgradeNote="30 build aşılırsa Production $19/ay (sınırsız build)"
          />
        </div>
      </div>

      {/* Neon DB Canlı Kullanım */}
      <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-cyan-400" />
            <h3 className="text-sm font-medium text-gray-200">Neon DB — Canlı Kullanım</h3>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Canlı</span>
          </div>
          <span className="text-xs text-gray-500">{db.sizeMB} MB / {db.limitMB} MB (%{db.usagePct})</span>
        </div>
        <div className="p-5">
          <UsageBar pct={db.usagePct} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
            {[
              { label: "Kullanıcılar",  value: db.counts.users },
              { label: "Pocket Token",  value: db.counts.pocketTokens },
              { label: "Siparişler",    value: db.counts.orders },
              { label: "Oturumlar",     value: db.counts.sessions },
              { label: "Ticketlar",     value: db.counts.tickets },
              { label: "DE Lisans",     value: db.counts.dataEngineLicenses },
              { label: "Müşteriler",    value: db.counts.customers },
              { label: "Yöneticiler",   value: db.counts.admins },
              { label: "Destek Talep",  value: db.counts.supportRequests },
              { label: "Lisans Kodu",   value: db.counts.licenseCodes },
            ].map((r) => (
              <div key={r.label} className="text-center p-3 bg-white/3 rounded-xl border border-white/5">
                <p className="text-xl font-bold text-white">{r.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dönemsel maliyet & kâr tablosu */}
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
                { k: "Vercel (Hobby)",  m: 0, note: "Free tier — 100GB bant, 6000dk build" },
                { k: "Neon Postgres",   m: 0, note: "Free tier — 512MB, 191.9h compute/ay" },
                { k: "Resend",          m: 0, note: "Free tier — 3000 email/ay" },
                { k: "EAS (Expo)",      m: 0, note: "Free tier — 30 build/ay, OTA sınırsız" },
                { k: "Cloudflare",      m: 0, note: "Free — tunnel + DNS" },
                { k: "Win Server",      m: 0, note: "Şirket altyapısı" },
              ].map((r) => (
                <tr key={r.k} className="border-b border-white/5">
                  <td className="px-5 py-3 text-sm text-gray-300">{r.k}</td>
                  <td className="px-5 py-3 text-sm text-white">{usd(0)}</td>
                  <td className="px-5 py-3 text-sm text-white">{usd(0)}</td>
                  <td className="px-5 py-3 text-sm text-white">{usd(0)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{r.note}</td>
                </tr>
              ))}
              <tr className="bg-white/[0.02] border-b border-white/5 font-bold">
                <td className="px-5 py-3 text-sm text-gray-200">Toplam Maliyet</td>
                <td className="px-5 py-3 text-sm text-green-400">{usd(0)}</td>
                <td className="px-5 py-3 text-sm text-green-400">{usd(0)}/ay</td>
                <td className="px-5 py-3 text-sm text-green-400">{usd(0)}/yıl</td>
                <td className="px-5 py-3 text-xs text-green-400">Ücretsiz tier</td>
              </tr>
              <tr className="bg-green-500/[0.03] font-bold">
                <td className="px-5 py-3 text-sm text-gray-200">Net Kâr (tahmini)</td>
                <td className="px-5 py-3 text-sm text-green-400">{usd(monthlyRevenueUSD / 4.33)}</td>
                <td className="px-5 py-3 text-sm text-green-400">{usd(monthlyRevenueUSD)}/ay</td>
                <td className="px-5 py-3 text-sm text-green-400">{usd(monthlyRevenueUSD * 12)}/yıl</td>
                <td className="px-5 py-3 text-xs text-gray-500">{try_(monthlyRevenueUSD * usdTry)}/ay</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Büyüme Senaryoları */}
      <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-400" />
          <h3 className="text-sm font-medium text-gray-200">Büyüme Senaryoları</h3>
          <span className="ml-auto text-xs text-gray-600">ARPU: {usd(ARPU)}/kullanıcı/ay (tahmini)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Senaryo", "Haftalık", "Aylık", "Yıllık", "Altyapı", "Net Kâr", "TRY"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[25, 50, 100, 250, 500, 1000].map((n) => (
                <ScenarioRow key={n} label={`${n} Kullanıcı`} users={n} arpu={ARPU}
                  infraUSD={infraForCount(n)} usdTry={usdTry} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01]">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Info size={11} />
            ARPU ${ARPU}/ay tahmini. 250+ kullanıcıda Neon Launch $19/ay, 500+'da +Resend Pro $20/ay gerekebilir.
          </p>
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
                <p className="text-sm font-medium text-gray-200">
                  {key.charAt(0).toUpperCase() + key.slice(1)} → <span className="text-yellow-400">{u.plan}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Tetikleyici: {u.trigger}</p>
                {u.newLimit && <p className="text-xs text-blue-400 mt-0.5">Yeni limit: {u.newLimit}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-white">${u.priceUSD}/ay</p>
                <p className="text-xs text-gray-500">{try_(u.priceUSD * usdTry)}/ay</p>
              </div>
            </div>
          ))}
          <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/3 border border-white/8">
            <div>
              <p className="text-sm font-medium text-gray-200">EAS → <span className="text-yellow-400">Production</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Tetikleyici: Ayda 30&apos;dan fazla native build</p>
              <p className="text-xs text-blue-400 mt-0.5">OTA update sınırsız, sadece native build sayılır</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-white">$19/ay</p>
              <p className="text-xs text-gray-500">{try_(19 * usdTry)}/ay</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PkgCard ────────────────────────────────────────────────────────

function PkgCard({
  icon, name, plan, cost, currency, rows, upgradeNote, live,
}: {
  icon: React.ReactNode; name: string; plan: string; cost: number;
  currency: "USD" | "TRY";
  rows: { label: string; value: string; pct: number | null; highlight?: "green" | "red" }[];
  upgradeNote?: string; live?: boolean;
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
        <p className={`text-sm font-bold ${cost === 0 ? "text-green-400" : "text-yellow-400"}`}>
          {cost === 0 ? "Ücretsiz" : `${currency === "USD" ? "$" : "₺"}${cost}/ay`}
        </p>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{r.label}</span>
              <span className={r.highlight === "green" ? "text-green-400" : r.highlight === "red" ? "text-red-400" : "text-gray-300"}>
                {r.value}
              </span>
            </div>
            {r.pct !== null && (
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-1">
                <div className={`h-1.5 rounded-full ${(r.pct ?? 0) > 80 ? "bg-red-500" : (r.pct ?? 0) > 50 ? "bg-yellow-400" : "bg-green-500"}`}
                  style={{ width: `${Math.min(r.pct ?? 0, 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
      {upgradeNote && (
        <p className="text-xs text-gray-600 border-t border-white/5 pt-2 flex items-start gap-1">
          <ArrowUpRight size={10} className="shrink-0 mt-0.5" /> {upgradeNote}
        </p>
      )}
    </div>
  );
}
