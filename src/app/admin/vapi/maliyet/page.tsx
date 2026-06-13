"use client";
import { useEffect, useState } from "react";
import { Loader2, Phone, ArrowLeft, BarChart3, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Stats {
  ok?: boolean;
  days: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalCostUsd: number;
  totalMinutes: number;
  avgCostPerCall: number;
  avgMinutesPerCall: number;
  costPerMinute: number;
  costByType: { transport: number; stt: number; llm: number; tts: number; vapi: number };
  languageMix: Record<string, number>;
  endReasons: Record<string, number>;
  dailySeries: Array<{ date: string; calls: number; cost: number; minutes: number }>;
  recentTop: Array<{ id: string; startedAt?: string; minutes: number; cost: number; summary?: string; endedReason?: string }>;
  error?: string;
}


export default function VapiCostPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  async function load(d: number) {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/vapi/maliyet?days=${d}`, { cache: "no-store" });
      const data: Stats = await r.json();
      setStats(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(days); }, [days]);

  if (loading || !stats) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-400" />
          <div>
            <h2 className="font-semibold text-amber-200 mb-2">Vapi verilerine ulaşılamadı</h2>
            <p className="text-sm text-amber-100/80">{stats.error === "vapi_not_configured" ? "VAPI_PRIVATE_KEY env'i tanımlı değil." : stats.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const maxDaily = Math.max(1, ...stats.dailySeries.map(d => d.calls));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Link href="/admin/vapi" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
          <ArrowLeft size={14} /> Eylül Prompt
        </Link>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                days === d ? "bg-purple-500/20 border border-purple-500/40 text-purple-200" : "bg-[#111118] border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              Son {d} gün
            </button>
          ))}
        </div>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <BarChart3 size={26} className="text-purple-400" />
          Vapi Maliyet Paneli
        </h1>
        <p className="text-sm text-gray-400">Son {stats.days} günlük çağrı, süre ve maliyet özeti.</p>
      </header>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Toplam Çağrı" value={stats.totalCalls.toString()} sub={`${stats.successfulCalls} başarılı, ${stats.failedCalls} kısa/hatalı`} />
        <Stat label="Toplam Süre" value={`${stats.totalMinutes.toFixed(1)} dk`} sub={`Ortalama ${stats.avgMinutesPerCall.toFixed(2)} dk/çağrı`} />
        <Stat label="Toplam Maliyet" value={`$${stats.totalCostUsd.toFixed(2)}`} sub={`$${stats.avgCostPerCall.toFixed(4)} / çağrı`} accent="text-purple-300" />
        <Stat label="Dakika Maliyeti" value={`$${stats.costPerMinute.toFixed(4)}`} sub="Vapi total / talk minute" accent="text-blue-300" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Günlük grafik */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Günlük Çağrı Hacmi</h3>
          {stats.dailySeries.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">Bu periyotta çağrı yok.</div>
          ) : (
            <div className="space-y-1">
              {stats.dailySeries.map(d => (
                <div key={d.date} className="flex items-center gap-3 text-xs">
                  <div className="text-gray-500 w-20 font-mono">{d.date.slice(5)}</div>
                  <div className="flex-1 bg-[#0a0a0f] rounded h-5 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded"
                      style={{ width: `${(d.calls / maxDaily) * 100}%` }}
                    />
                  </div>
                  <div className="text-gray-300 w-12 text-right font-mono">{d.calls}</div>
                  <div className="text-purple-300 w-16 text-right font-mono">${d.cost.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maliyet kalemleri */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Maliyet Dağılımı</h3>
          {Object.entries(stats.costByType).map(([k, v]) => {
            const total = Object.values(stats.costByType).reduce((s, n) => s + n, 0);
            const pct = total > 0 ? (v / total) * 100 : 0;
            const labels: Record<string, string> = {
              transport: "Telefon (carrier)", stt: "Konuşma → Metin (STT)", llm: "Model (LLM)", tts: "Metin → Konuşma (TTS)", vapi: "Vapi platform"
            };
            return (
              <div key={k} className="flex items-center gap-2 text-xs mb-2">
                <div className="text-gray-500 w-40">{labels[k] || k}</div>
                <div className="flex-1 bg-[#0a0a0f] rounded h-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-gray-300 w-16 text-right font-mono">${v.toFixed(3)}</div>
                <div className="text-gray-500 w-10 text-right">%{pct.toFixed(0)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Dil dağılımı */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Dil Dağılımı (Tahmini)</h3>
          {Object.keys(stats.languageMix).length === 0 ? (
            <p className="text-xs text-gray-500">Veri yok.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.languageMix).map(([lang, count]) => (
                <div key={lang} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-200 text-sm font-medium">
                  {lang === "TR" && "🇹🇷"} {lang === "RU" && "🇷🇺"} {lang === "EN" && "🇬🇧"} {lang === "?" && "❓"} {lang}: <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* End reasons */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Çağrı Bitiş Sebepleri</h3>
          {Object.entries(stats.endReasons).length === 0 ? (
            <p className="text-xs text-gray-500">Veri yok.</p>
          ) : (
            <div className="space-y-1.5">
              {Object.entries(stats.endReasons).sort((a, b) => b[1] - a[1]).map(([r, c]) => (
                <div key={r} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{r}</span>
                  <span className="font-mono text-gray-300">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Son çağrılar */}
      {stats.recentTop.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#111118] border border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Phone size={14} /> Son Çağrılar
          </h3>
          <div className="space-y-2">
            {stats.recentTop.map(c => (
              <div key={c.id} className="p-3 rounded-lg bg-[#0a0a0f] border border-white/5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 font-mono">{c.startedAt ? new Date(c.startedAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—"}</span>
                  <span className="text-purple-300 font-mono">${c.cost.toFixed(4)} · {c.minutes.toFixed(2)}dk</span>
                </div>
                <div className="text-sm text-gray-300">{c.summary || <span className="text-gray-600 italic">özet yok</span>}</div>
                {c.endedReason && <div className="text-[11px] text-gray-500 mt-1">↳ {c.endedReason}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="p-4 rounded-2xl bg-[#111118] border border-white/5">
      <div className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent || "text-white"}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-1">{sub}</div>
    </div>
  );
}
