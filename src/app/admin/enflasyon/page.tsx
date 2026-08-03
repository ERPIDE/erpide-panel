"use client";

/**
 * /admin/enflasyon — ERPIDE Gerçek Enflasyon Raporu paneli.
 *
 * Manşet kartları (Gerçek / Resmi / ENAG / Fark), kompozit katmanları,
 * kategori bazlı tam parametre dökümü, abone listesi yönetimi ve
 * "Hesapla" / "Gönder" butonları. Aylık cron ayın 5'inde otomatik koşar.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, RefreshCw, Send, TrendingUp, Mail, Trash2, Plus,
  ChevronDown, ChevronRight, AlertTriangle, Calculator, PenLine,
} from "lucide-react";
import { useToast } from "@/components/Toast";

// ── API JSON tipleri ─────────────────────────────────────────────

interface ParamResult {
  key: string;
  label: string;
  category: string;
  unit: string;
  status: "live" | "static" | "derived" | "waiting-key" | "no-data" | "pending";
  value: number | null;
  extra?: string;
  note?: string;
}

interface LayerResult {
  key: string;
  label: string;
  value: number | null;
  weight: number;
  effectiveWeight: number | null;
  detail?: string;
}

interface RunData {
  period: string;
  computedAt: string;
  headline: { real: number | null; official: number | null; enag: number; gap: number | null };
  layers: LayerResult[];
  params: ParamResult[];
  stats: { total: number; live: number; static: number; derived: number; waitingKey: number; pending: number; noData: number };
  notes: string[];
}

interface RunRow {
  id: string;
  period: string;
  trigger: string;
  realRate: number | null;
  officialRate: number | null;
  createdAt: string;
  sentAt: string | null;
  sentCount: number;
  liveParams: number;
  totalParams: number;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  createdAt: string;
}

interface ApiPayload {
  latest: (RunRow & { data: RunData }) | null;
  runs: RunRow[];
  subscribers: Subscriber[];
  env: { evdsKey: boolean; resendKey: boolean };
}

interface ManualEntry {
  yearly: number;
  monthly: number;
  period: string;
}

interface ManualPayload {
  tuik: ManualEntry | null;
  enag: ManualEntry | null;
  defaults: { tuik: ManualEntry; enag: ManualEntry };
}

const CATEGORY_LABELS: Record<string, string> = {
  kompozit: "Kompozit Endeks",
  resmi: "Resmi Göstergeler",
  kur: "Döviz Kurları",
  partner: "Ticaret Ortağı Enflasyonu",
  ticaret: "Dış Ticaret Payları (TÜİK 2024)",
  "ithal-katki": "İthal Enflasyon Katkısı",
  "gecim-grup": "Geçim: TÜFE Ana Grupları",
  "gecim-madde": "Geçim: 50 Temel Kalem",
  varlik: "Varlık Fiyatları",
  kredi: "Kredi & Bankacılık",
  gelir: "Gelir & Alım Gücü",
  tasarruf: "Tasarruf Araçları",
  alternatif: "Alternatif Ölçümler",
};

const STATUS_BADGE: Record<ParamResult["status"], { label: string; cls: string }> = {
  live:          { label: "Canlı",            cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  static:        { label: "Resmi statik",     cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  derived:       { label: "Türetilmiş",       cls: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  "waiting-key": { label: "EVDS bekliyor",    cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  "no-data":     { label: "Veri yok",         cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  pending:       { label: "Bağlanacak",       cls: "bg-white/5 text-gray-400 border-white/10" },
};

const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function periodLabel(period: string): string {
  const [y, m] = period.split("-").map((x) => parseInt(x, 10));
  return `${MONTHS_TR[(m || 1) - 1]} ${y}`;
}

function fmtValue(p: { value: number | null; unit: string }): string {
  if (p.value == null) return "—";
  const n = (d: number) => p.value!.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
  switch (p.unit) {
    case "%": return `%${n(1)}`;
    case "TRY": return `${n(2)} ₺`;
    case "USD": return `$${n(0)}`;
    case "adet": return n(0);
    default: return n(1);
  }
}

export default function EnflasyonPage() {
  const { toast } = useToast();
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [sending, setSending] = useState(false);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ kompozit: true });
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  // Aylık bülten girişi formu — key bazlı alan değerleri string tutulur (input).
  const [manualForm, setManualForm] = useState<Record<string, { yearly: string; monthly: string; period: string }>>({});
  const [manualSaving, setManualSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/enflasyon", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setPayload(await res.json());
      const mres = await fetch("/api/admin/enflasyon/manuel", { cache: "no-store" });
      if (mres.ok) {
        const m = (await mres.json()) as ManualPayload;
        const toForm = (e: ManualEntry) => ({ yearly: String(e.yearly), monthly: String(e.monthly), period: e.period });
        setManualForm({
          tuik: toForm(m.tuik ?? m.defaults.tuik),
          enag: toForm(m.enag ?? m.defaults.enag),
        });
      }
    } catch {
      toast("error", "Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleRun() {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/enflasyon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast("success", `Hesaplandı — Gerçek Enflasyon: %${json.headline.real ?? "?"} (${json.stats.live} canlı parametre)`);
      await load();
    } catch (e) {
      toast("error", e instanceof Error && e.message ? e.message : "Hesaplama başarısız");
    } finally {
      setRunning(false);
    }
  }

  async function handleSend() {
    const activeCount = payload?.subscribers.filter((s) => s.active).length ?? 0;
    if (activeCount === 0) { toast("error", "Aktif abone yok — önce e-posta ekle"); return; }
    if (!confirm(`Rapor ${activeCount} aboneye gönderilecek. Onaylıyor musun?`)) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/enflasyon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.skipped) toast("error", `Gönderilemedi: ${json.skipped}`);
      else toast("success", `${json.sent} aboneye gönderildi${json.failed ? `, ${json.failed} hata` : ""}`);
      await load();
    } catch (e) {
      toast("error", e instanceof Error && e.message ? e.message : "Gönderim başarısız");
    } finally {
      setSending(false);
    }
  }

  async function handleAddSubscriber(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      const res = await fetch("/api/admin/enflasyon/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, name: newName || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNewEmail(""); setNewName("");
      toast("success", "Abone eklendi");
      await load();
    } catch (e) {
      toast("error", e instanceof Error && e.message ? e.message : "Eklenemedi");
    }
  }

  async function handleManualSave(key: "tuik" | "enag") {
    const f = manualForm[key];
    if (!f) return;
    setManualSaving(key);
    try {
      const res = await fetch("/api/admin/enflasyon/manuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          yearly: parseFloat(f.yearly.replace(",", ".")),
          monthly: parseFloat(f.monthly.replace(",", ".")),
          period: f.period.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast("success", `${key === "tuik" ? "TÜİK" : "ENAG"} değerleri kaydedildi — sonraki hesaplamada kullanılır`);
    } catch (e) {
      toast("error", e instanceof Error && e.message ? e.message : "Kaydedilemedi");
    } finally {
      setManualSaving(null);
    }
  }

  async function handleToggle(sub: Subscriber) {
    await fetch("/api/admin/enflasyon/subscribers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sub.id, active: !sub.active }),
    });
    await load();
  }

  async function handleDelete(sub: Subscriber) {
    if (!confirm(`${sub.email} listeden silinsin mi?`)) return;
    await fetch("/api/admin/enflasyon/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sub.id }),
    });
    toast("success", "Abone silindi");
    await load();
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  const latest = payload?.latest;
  const data = latest?.data;
  const h = data?.headline;

  // Kategori → parametre grubu
  const grouped: Record<string, ParamResult[]> = {};
  for (const p of data?.params ?? []) (grouped[p.category] ||= []).push(p);

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="text-blue-400" size={28} />
            Gerçek Enflasyon
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {data ? `${data.stats.total} parametreli kompozit analiz · ${periodLabel(data.period)} dönemi` : "Henüz hesaplama koşusu yok — ilk hesaplamayı başlat."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition disabled:opacity-50 text-sm font-medium"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
            {running ? "Hesaplanıyor..." : "Yeniden Hesapla"}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !latest}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition disabled:opacity-50 text-sm font-medium"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Raporu Gönder
          </button>
        </div>
      </header>

      {/* Ortam uyarıları */}
      {payload && (!payload.env.evdsKey || !payload.env.resendKey) && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200/90 space-y-1">
            {!payload.env.evdsKey && (
              <p><b>EVDS_API_KEY tanımlı değil</b> — TÜFE endeksi, konut endeksi ve faiz serileri beklemede. evds2.tcmb.gov.tr'den ücretsiz anahtar alınıp Vercel env'e eklenince bu parametreler otomatik canlanır.</p>
            )}
            {!payload.env.resendKey && <p><b>RESEND_API_KEY yok</b> — mail gönderimi çalışmaz.</p>}
          </div>
        </div>
      )}

      {/* Manşet kartları */}
      {h && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "ERPIDE Gerçek Enflasyon", value: h.real != null ? `%${h.real.toLocaleString("tr-TR")}` : "—", cls: "text-red-400", sub: "6 katmanlı kompozit, yıllık" },
            { label: "Resmi TÜFE", value: h.official != null ? `%${h.official.toLocaleString("tr-TR")}` : "—", cls: "text-blue-400", sub: "TÜİK yıllık" },
            { label: "ENAG E-TÜFE", value: `%${h.enag.toLocaleString("tr-TR")}`, cls: "text-purple-400", sub: "bağımsız ölçüm" },
            { label: "Fark (Gerçek − Resmi)", value: h.gap != null ? `${h.gap > 0 ? "+" : ""}${h.gap.toLocaleString("tr-TR")} puan` : "—", cls: h.gap != null && h.gap > 0 ? "text-red-400" : "text-emerald-400", sub: "makas" },
          ].map((c) => (
            <div key={c.label} className="bg-[#111118] border border-white/5 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{c.label}</p>
              <p className={`text-3xl font-bold mt-2 ${c.cls}`}>{c.value}</p>
              <p className="text-xs text-gray-600 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Sol: katmanlar + parametre dökümü */}
        <div className="space-y-6">
          {data && (
            <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
              <h2 className="text-white font-semibold mb-4">Kompozit Katmanları</h2>
              <div className="space-y-2">
                {data.layers.map((l) => (
                  <div key={l.key} className="flex items-center gap-3 text-sm">
                    <span className="w-44 shrink-0 text-gray-300">{l.label}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      {l.value != null && (
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-red-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(2, (l.value / 80) * 100))}%` }}
                        />
                      )}
                    </div>
                    <span className="w-16 text-right font-semibold text-white">{l.value != null ? `%${l.value.toLocaleString("tr-TR")}` : "—"}</span>
                    <span className="w-14 text-right text-xs text-gray-500">{l.effectiveWeight != null ? `ağ. %${Math.round(l.effectiveWeight * 100)}` : "devre dışı"}</span>
                  </div>
                ))}
              </div>
              {data.notes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
                  {data.notes.map((n, i) => <p key={i} className="text-xs text-gray-500">• {n}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Kategori accordion'ları */}
          {data && Object.keys(CATEGORY_LABELS).map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            const open = !!openCats[cat];
            const liveCount = items.filter((p) => p.value != null).length;
            return (
              <div key={cat} className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenCats((s) => ({ ...s, [cat]: !s[cat] }))}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition"
                >
                  <span className="text-white font-medium flex items-center gap-2">
                    {open ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-xs text-gray-500">{liveCount}/{items.length} dolu</span>
                </button>
                {open && (
                  <div className="px-5 pb-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {items.map((p) => (
                          <tr key={p.key} className="border-t border-white/5">
                            <td className="py-2 pr-3 text-gray-300">{p.label}</td>
                            <td className="py-2 pr-3 text-right font-semibold text-white whitespace-nowrap">{fmtValue(p)}</td>
                            <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{p.extra || ""}</td>
                            <td className="py-2 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${STATUS_BADGE[p.status].cls}`}>
                                {STATUS_BADGE[p.status].label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sağ: aboneler + koşu geçmişi */}
        <div className="space-y-6">
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Mail size={16} className="text-blue-400" /> Rapor Aboneleri
              <span className="text-xs text-gray-500 font-normal">({payload?.subscribers.filter((s) => s.active).length ?? 0} aktif)</span>
            </h2>
            <form onSubmit={handleAddSubscriber} className="space-y-2 mb-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e-posta adresi"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="isim (opsiyonel)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition text-sm"
                >
                  <Plus size={14} /> Ekle
                </button>
              </div>
            </form>
            <div className="space-y-2 max-h-72 overflow-y-auto thin-scrollbar">
              {payload?.subscribers.length === 0 && <p className="text-sm text-gray-600">Henüz abone yok.</p>}
              {payload?.subscribers.map((s) => (
                <div key={s.id} className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2">
                  <button
                    onClick={() => handleToggle(s)}
                    title={s.active ? "Pasifleştir" : "Aktifleştir"}
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.active ? "bg-emerald-400" : "bg-gray-600"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${s.active ? "text-gray-200" : "text-gray-500 line-through"}`}>{s.email}</p>
                    {s.name && <p className="text-xs text-gray-500 truncate">{s.name}</p>}
                  </div>
                  <button onClick={() => handleDelete(s)} className="text-gray-600 hover:text-red-400 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-1">
              <PenLine size={16} className="text-blue-400" /> Aylık Bülten Girişi
            </h2>
            <p className="text-xs text-gray-500 mb-4">TÜİK ve ENAG her ayın 3&apos;ünde açıklar — buraya gir, deploy gerekmez.</p>
            {(["tuik", "enag"] as const).map((key) => {
              const f = manualForm[key];
              if (!f) return null;
              const set = (field: "yearly" | "monthly" | "period", v: string) =>
                setManualForm((s) => ({ ...s, [key]: { ...s[key], [field]: v } }));
              const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50";
              return (
                <div key={key} className="mb-3 bg-white/[0.03] rounded-xl p-3">
                  <p className="text-sm font-medium text-gray-200 mb-2">{key === "tuik" ? "TÜİK TÜFE" : "ENAG E-TÜFE"}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Yıllık %</label>
                      <input value={f.yearly} onChange={(e) => set("yearly", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Aylık %</label>
                      <input value={f.monthly} onChange={(e) => set("monthly", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Dönem</label>
                      <input value={f.period} onChange={(e) => set("period", e.target.value)} placeholder="2026-07" className={inputCls} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleManualSave(key)}
                    disabled={manualSaving === key}
                    className="mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition text-xs disabled:opacity-50"
                  >
                    {manualSaving === key ? <Loader2 size={12} className="animate-spin" /> : null} Kaydet
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-[#111118] border border-white/5 rounded-2xl p-5">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <RefreshCw size={16} className="text-blue-400" /> Koşu Geçmişi
            </h2>
            <div className="space-y-2">
              {payload?.runs.length === 0 && <p className="text-sm text-gray-600">Henüz koşu yok.</p>}
              {payload?.runs.map((r) => (
                <div key={r.id} className="bg-white/[0.03] rounded-xl px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200">{periodLabel(r.period)}</span>
                    <span className="font-semibold text-white">{r.realRate != null ? `%${r.realRate.toLocaleString("tr-TR")}` : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>{new Date(r.createdAt).toLocaleString("tr-TR")} · {r.trigger === "cron" ? "otomatik" : "manuel"}</span>
                    <span>{r.sentAt ? `${r.sentCount} aboneye gitti` : "gönderilmedi"}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">Otomatik gönderim: her ayın 5'i, 12:00 (TR)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
