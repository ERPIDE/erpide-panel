"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Activity, RefreshCw, MessageSquare, Phone,
  Globe, Wifi, WifiOff, Crown, Smartphone, Radio,
} from "lucide-react";

const SB_URL = "https://gynooxlltoohalbxbhrw.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bm9veGxsdG9vaGFsYnhiaHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTkyNTMsImV4cCI6MjA5NjY3NTI1M30.Ff_zfpVkSa5sJDTp4tD6TvId1YY3R__xxXSDvAuxs2k";

const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function sbCount(table: string, filter = ""): Promise<number | null> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${table}?select=*${filter ? `&${filter}` : ""}&limit=0`,
      { headers: { ...H, Prefer: "count=exact" } }
    );
    if (!res.ok) return null;
    const range = res.headers.get("Content-Range");
    const m = range?.match(/\/(\d+)$/);
    return m ? parseInt(m[1]) : null;
  } catch {
    return null;
  }
}

async function sbRows<T>(table: string, select: string, extra = "", limit = 50): Promise<T[]> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${table}?select=${select}${extra ? `&${extra}` : ""}&limit=${limit}&order=created_at.desc`,
      { headers: H }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const CURRENT_OTA = "v51";
const OTA_DATE = "2026-06-21";

type Tab = "genel" | "kullanicilar" | "aktivite";

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

export default function WitmaAdminPage() {
  const [tab, setTab] = useState<Tab>("genel");
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [onlineNow, setOnlineNow] = useState<number | null>(null);
  const [todayMsgs, setTodayMsgs] = useState<number | null>(null);
  const [todayCalls, setTodayCalls] = useState<number | null>(null);
  const [todayOpens, setTodayOpens] = useState<number | null>(null);
  const [premiumUsers, setPremiumUsers] = useState<number | null>(null);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const load = useCallback(async () => {
    setLoading(true);
    const [tu, on, tm, tc, to, pu, prof, evts] = await Promise.all([
      sbCount("profiles"),
      sbCount("ops_presence", `last_seen=gte.${fiveMinAgo}`),
      sbCount("messages", `created_at=gte.${todayISO}`),
      sbCount("ops_events", `event=eq.call_start&created_at=gte.${todayISO}`),
      sbCount("ops_events", `event=eq.user_open&created_at=gte.${todayISO}`),
      sbCount("profiles", "plan=eq.premium"),
      sbRows<any>("profiles", "phone,name,plan,plan_expires_at,updated_at", "", 200),
      sbRows<any>("ops_events", "id,event,user_id,meta,created_at", "", 100),
    ]);
    setTotalUsers(tu);
    setOnlineNow(on);
    setTodayMsgs(tm);
    setTodayCalls(tc);
    setTodayOpens(to);
    setPremiumUsers(pu);
    setProfiles(prof);
    setEvents(evts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredProfiles = profiles.filter(
    (p) =>
      !search ||
      (p.phone || "").includes(search) ||
      (p.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "genel", label: "Genel Bakış", icon: Activity },
    { key: "kullanicilar", label: "Kullanıcılar", icon: Users },
    { key: "aktivite", label: "Aktivite", icon: Radio },
  ];

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={Users} label="Toplam Kullanıcı" value={totalUsers} color="text-white" />
            <StatCard
              icon={Wifi}
              label="Şu An Çevrimiçi"
              value={onlineNow}
              sub="son 5 dakika"
              color="text-green-400"
            />
            <StatCard
              icon={Crown}
              label="Premium Üye"
              value={premiumUsers}
              color="text-yellow-400"
            />
            <StatCard
              icon={MessageSquare}
              label="Bugün Mesaj"
              value={todayMsgs}
              color="text-blue-400"
            />
            <StatCard
              icon={Phone}
              label="Bugün Arama"
              value={todayCalls}
              color="text-purple-400"
            />
            <StatCard
              icon={Smartphone}
              label="Bugün Açılış"
              value={todayOpens}
              color="text-cyan-400"
            />
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

          {/* Recent events preview */}
          {events.length > 0 && (
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
                    {events.slice(0, 10).map((e, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-2.5"><EventBadge event={e.event} /></td>
                        <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{e.user_id || "—"}</td>
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

          {events.length === 0 && !loading && (
            <div className="p-5 rounded-xl bg-[#111118] border border-white/5 text-center">
              <WifiOff size={24} className="text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aktivite verisi alınamadı</p>
              <p className="text-xs text-gray-600 mt-1">ops_events tablosu için Supabase service key gerekebilir</p>
            </div>
          )}
        </motion.div>
      )}

      {/* === KULLANICILAR === */}
      {tab === "kullanicilar" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <input
            type="text"
            placeholder="Telefon veya isim ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-pink-500/50"
          />

          <div className="rounded-xl bg-[#111118] border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-[#0d0d14]">
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Telefon</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">İsim</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Plan Bitiş</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Son Güncelleme</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((u, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                    <td className="px-4 py-3 text-sm font-mono text-gray-300">{u.phone}</td>
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
                      {u.plan_expires_at
                        ? new Date(u.plan_expires_at).toLocaleDateString("tr-TR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.updated_at
                        ? new Date(u.updated_at).toLocaleDateString("tr-TR")
                        : "—"}
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                      {loading ? "Yükleniyor..." : search ? "Sonuç bulunamadı" : "Henüz kullanıcı yok"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-600 text-right">
            {filteredProfiles.length} kullanıcı {search && `(${profiles.length} içinden)`}
          </div>
        </motion.div>
      )}

      {/* === AKTİVİTE === */}
      {tab === "aktivite" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {events.length === 0 && !loading ? (
            <div className="p-8 rounded-xl bg-[#111118] border border-white/5 text-center">
              <WifiOff size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">ops_events verisi alınamadı</p>
              <p className="text-xs text-gray-600 mt-1">
                Supabase RLS kısıtlaması — service key Vercel env'e eklenince erişim açılır
              </p>
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
                  {events.map((e, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5"><EventBadge event={e.event} /></td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{e.user_id || "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[200px] truncate">
                        {e.meta ? JSON.stringify(e.meta) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">
                        {e.created_at
                          ? new Date(e.created_at).toLocaleString("tr-TR", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
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
