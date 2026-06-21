"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Activity, RefreshCw, MessageSquare, Phone,
  Globe, Wifi, WifiOff, Crown, Smartphone, Radio,
  TrendingUp, Languages, AlertCircle,
} from "lucide-react";

const CURRENT_OTA = "v51";
const OTA_DATE = "2026-06-21";

type Tab = "genel" | "kullanicilar" | "aktivite";
type Period = "today" | "week" | "month";

type StatsResponse = {
  hasServiceKey: boolean;
  totalUsers: number | null;
  onlineNow: number | null;
  todayMsgs: number | null;   weekMsgs: number | null;   monthMsgs: number | null;
  todayCalls: number | null;  weekCalls: number | null;  monthCalls: number | null;
  todayOpens: number | null;  weekOpens: number | null;  monthOpens: number | null;
  todayTranslates: number | null; monthTranslates: number | null;
  premiumUsers: number | null;
  profiles: any[];
  events: any[];
};

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  user_open:   { label: "Açılış",     color: "text-blue-400 bg-blue-500/10" },
  msg_sent:    { label: "Mesaj",      color: "text-green-400 bg-green-500/10" },
  call_start:  { label: "Arama",      color: "text-purple-400 bg-purple-500/10" },
  call_end:    { label: "Arama Sonu", color: "text-indigo-400 bg-indigo-500/10" },
  translate:   { label: "Çeviri",     color: "text-cyan-400 bg-cyan-500/10" },
  ai_chat:     { label: "AI Sohbet",  color: "text-pink-400 bg-pink-500/10" },
  tts:         { label: "TTS",        color: "text-yellow-400 bg-yellow-500/10" },
  error:       { label: "Hata",       color: "text-red-400 bg-red-500/10" },
};

function EventBadge({ event }: { event: string }) {
  const e = EVENT_LABELS[event] || { label: event, color: "text-gray-400 bg-white/5" };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${e.color}`}>
      {e.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-white",
}: {
  icon: typeof Users;
  label: string;
  value: string | number | null;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-[#111118] border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-gray-500" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        {value === null ? <span className="text-gray-600 text-base">—</span> : value}
      </div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function PeriodBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
        active ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "text-gray-500 hover:text-white hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

export default function WitmaAdminPage() {
  const [tab, setTab] = useState<Tab>("genel");
  const [period, setPeriod] = useState<Period>("today");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/witma");
      if (!res.ok) throw new Error("API error");
      setData(await res.json());
    } catch {
      // sessiz hata
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const d = data;

  const msgs   = period === "today" ? d?.todayMsgs  : period === "week" ? d?.weekMsgs  : d?.monthMsgs;
  const calls  = period === "today" ? d?.todayCalls : period === "week" ? d?.weekCalls : d?.monthCalls;
  const opens  = period === "today" ? d?.todayOpens : period === "week" ? d?.weekOpens : d?.monthOpens;
  const translates = period === "today" ? d?.todayTranslates : d?.monthTranslates;

  const periodLabel = period === "today" ? "Bugün" : period === "week" ? "Bu Hafta" : "Bu Ay";

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "genel",        label: "Genel Bakış",  icon: Activity },
    { key: "kullanicilar", label: "Kullanıcılar", icon: Users },
    { key: "aktivite",     label: "Aktivite",     icon: Radio },
  ];

  const filteredProfiles = (d?.profiles || []).filter(
    (p) =>
      !search ||
      (p.phone || "").includes(search) ||
      (p.name  || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = eventFilter === "all"
    ? (d?.events || [])
    : (d?.events || []).filter((e) => e.event === eventFilter);

  const eventTypes = Array.from(new Set((d?.events || []).map((e: any) => e.event)));

  const hasServiceKey = d?.hasServiceKey ?? true;

  return (
    <div className="space-y-6">
      {/* Service key uyarısı */}
      {d && !hasServiceKey && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <AlertCircle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="text-yellow-300 font-medium">Servis key eksik — </span>
            <span className="text-yellow-500/80">
              Vercel → Environment Variables → <code className="font-mono text-yellow-400">WITMA_SUPABASE_SERVICE_KEY</code> ekle ve redeploy yap.
              Eksik olmadan Çevrimiçi, Arama, Açılış ve Aktivite verileri gelmiyor.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare size={22} className="text-pink-400" /> WITMA
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Mesajlaşma · Sesli/Görüntülü · Canlı Çeviri
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition text-sm flex items-center gap-1.5 disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Yenile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition ${
              tab === t.key
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* === GENEL BAKIŞ === */}
      {tab === "genel" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Sabit istatistikler */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}      label="Toplam Kullanıcı" value={d?.totalUsers   ?? null} color="text-white" />
            <StatCard icon={Crown}      label="Premium Üye"      value={d?.premiumUsers ?? null} color="text-yellow-400" />
            <StatCard icon={Wifi}       label="Şu An Çevrimiçi" value={d?.onlineNow    ?? null} sub="son 5 dakika" color="text-green-400" />
            <StatCard icon={Smartphone} label="Free Üye"
              value={d && d.totalUsers !== null && d.premiumUsers !== null ? d.totalUsers - d.premiumUsers : null}
              color="text-gray-300"
            />
          </div>

          {/* Period seçici */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Dönemsel İstatistikler</span>
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              <PeriodBtn active={period === "today"} onClick={() => setPeriod("today")} label="Bugün" />
              <PeriodBtn active={period === "week"}  onClick={() => setPeriod("week")}  label="Bu Hafta" />
              <PeriodBtn active={period === "month"} onClick={() => setPeriod("month")} label="Bu Ay" />
            </div>
          </div>

          {/* Dönemsel istatistikler */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={MessageSquare} label={`${periodLabel} Mesaj`}   value={msgs    ?? null} color="text-blue-400" />
            <StatCard icon={Phone}         label={`${periodLabel} Arama`}   value={calls   ?? null} color="text-purple-400" />
            <StatCard icon={Globe}         label={`${periodLabel} Açılış`}  value={opens   ?? null} color="text-cyan-400" />
            <StatCard icon={Languages}     label={`${periodLabel} Çeviri`}  value={translates ?? null} color="text-teal-400" />
          </div>

          {/* OTA Info */}
          <div className="p-5 rounded-xl bg-[#111118] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Güncel OTA</div>
              <div className="text-lg font-bold text-green-400">{CURRENT_OTA}</div>
              <div className="text-xs text-gray-500 mt-0.5">EAS Production · {OTA_DATE}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Canlı</span>
            </div>
          </div>

          {/* Son Aktiviteler */}
          {(d?.events || []).length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Son Aktiviteler</div>
              <div className="rounded-xl bg-[#111118] border border-white/5 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0d0d14]">
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Olay</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Kullanıcı</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Zaman</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d?.events || []).slice(0, 10).map((e: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-2.5"><EventBadge event={e.event} /></td>
                        <td className="px-4 py-2.5 text-xs text-gray-400 font-mono truncate max-w-[180px]">{e.user_id || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">
                          {e.created_at ? new Date(e.created_at).toLocaleTimeString("tr-TR") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(d?.events || []).length === 0 && !loading && (
            <div className="p-5 rounded-xl bg-[#111118] border border-white/5 text-center">
              <WifiOff size={24} className="text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aktivite verisi alınamadı</p>
              {!hasServiceKey && (
                <p className="text-xs text-gray-600 mt-1">
                  Servis key eksik — yukarıdaki uyarıyı incele
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* === KULLANICILAR === */}
      {tab === "kullanicilar" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Telefon veya isim ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-pink-500/50"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {filteredProfiles.length} / {d?.profiles?.length ?? 0} kullanıcı
            </span>
          </div>

          <div className="rounded-xl bg-[#111118] border border-white/5 overflow-hidden">
            {loading ? (
              <div className="px-4 py-12 text-center text-gray-500 text-sm">Yükleniyor...</div>
            ) : filteredProfiles.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Users size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{search ? "Sonuç bulunamadı" : "Henüz kullanıcı yok"}</p>
                {!hasServiceKey && (
                  <p className="text-xs text-gray-600 mt-2">Servis key eksik olabilir</p>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d0d14]">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Telefon</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">İsim</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Plan Bitiş</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Güncelleme</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((u: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm font-mono text-gray-300">{u.phone || "—"}</td>
                      <td className="px-4 py-3 text-sm text-white">{u.name || <span className="text-gray-600">—</span>}</td>
                      <td className="px-4 py-3">
                        {u.plan === "premium" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-medium flex items-center gap-1 w-fit">
                            <Crown size={9} /> Premium
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500">Free</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.plan_expires_at ? new Date(u.plan_expires_at).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.updated_at ? new Date(u.updated_at).toLocaleDateString("tr-TR") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {/* === AKTİVİTE === */}
      {tab === "aktivite" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Event type filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setEventFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                eventFilter === "all" ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "text-gray-500 hover:text-white bg-white/5"
              }`}
            >
              Tümü {d?.events?.length ? `(${d.events.length})` : ""}
            </button>
            {eventTypes.map((type) => {
              const info = EVENT_LABELS[type] || { label: type, color: "text-gray-400 bg-white/5" };
              const count = (d?.events || []).filter((e: any) => e.event === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setEventFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    eventFilter === type ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "text-gray-500 hover:text-white bg-white/5"
                  }`}
                >
                  {info.label} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="p-8 rounded-xl bg-[#111118] border border-white/5 text-center text-gray-500 text-sm">Yükleniyor...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#111118] border border-white/5 text-center">
              <WifiOff size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Aktivite verisi yok</p>
              {!hasServiceKey && (
                <p className="text-xs text-gray-600 mt-1">
                  Servis key eksik — yukarıdaki uyarıyı incele
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-[#111118] border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d0d14]">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Olay</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Kullanıcı</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Meta</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Zaman</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((e: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5"><EventBadge event={e.event} /></td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 font-mono truncate max-w-[180px]">{e.user_id || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[160px] truncate">
                        {e.meta ? JSON.stringify(e.meta) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {e.created_at
                          ? new Date(e.created_at).toLocaleString("tr-TR", {
                              month: "2-digit", day: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
