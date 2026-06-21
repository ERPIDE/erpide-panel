"use client";
import { useState, useEffect } from "react";
import {
  Smartphone, Users, RefreshCw, Loader2, Wifi, Bell,
  Activity, ChevronDown, ChevronUp,
} from "lucide-react";

type Stats = {
  totalTokens: number;
  uniqueUsers: number;
  syncedUsers: number;
  pushEnabledDevices: number;
  platformCounts: Record<string, number>;
  paidSubscribers: number;
};

type RecentSync = {
  userId: string;
  updatedAt: string;
};

export default function PocketERPIDEAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<RecentSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSyncs, setShowSyncs] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/pocketerpide/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setRecentSyncs(data.recentSyncs || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  function fmt(d: string) {
    return new Date(d).toLocaleString("tr-TR", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">PocketERPIDE</h1>
          <p className="text-sm text-gray-500 mt-1">Mobil kullanıcı ve senkronizasyon istatistikleri</p>
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
          <Loader2 size={28} className="text-pink-400 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Benzersiz Kullanıcı", value: stats.uniqueUsers, icon: Users, color: "text-pink-400", bg: "from-pink-600/20 to-pink-600/5" },
              { label: "Aktif Token", value: stats.totalTokens, icon: Smartphone, color: "text-rose-400", bg: "from-rose-600/20 to-rose-600/5" },
              { label: "Senkronize Eden", value: stats.syncedUsers, icon: Wifi, color: "text-purple-400", bg: "from-purple-600/20 to-purple-600/5" },
              { label: "Push Bildirimi Açık", value: stats.pushEnabledDevices, icon: Bell, color: "text-orange-400", bg: "from-orange-600/20 to-orange-600/5" },
              { label: "Ücretli Abone", value: stats.paidSubscribers, icon: Activity, color: "text-green-400", bg: "from-green-600/20 to-green-600/5" },
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

          {/* Platform Breakdown */}
          {Object.keys(stats.platformCounts).length > 0 && (
            <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Platform Dağılımı (Push Token)</h3>
              <div className="flex gap-4">
                {Object.entries(stats.platformCounts).map(([platform, count]) => (
                  <div key={platform} className="flex items-center gap-2">
                    <Smartphone size={14} className="text-pink-400" />
                    <span className="text-sm text-white font-medium">{count}</span>
                    <span className="text-xs text-gray-500 uppercase">{platform}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Syncs */}
          {recentSyncs.length > 0 && (
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
                      <span className="text-xs text-gray-500 font-mono truncate max-w-[180px]">{s.userId}</span>
                      <span className="text-xs text-gray-400">{fmt(s.updatedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {stats.uniqueUsers === 0 && (
            <div className="p-10 rounded-2xl bg-[#111118] border border-white/5 text-center">
              <Smartphone size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Henüz kayıtlı mobil kullanıcı yok.</p>
              <p className="text-xs text-gray-600 mt-1">TestFlight veya Play Store üzerinden kullanıcılar kaydolduktan sonra burada görünecek.</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">Veri yüklenemedi.</div>
      )}
    </div>
  );
}
