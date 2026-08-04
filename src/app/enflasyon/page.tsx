"use client";

/**
 * /enflasyon — ERPIDE Gerçek Enflasyon Raporu (halka açık ürün sayfası).
 *
 * Herkese: manşet kartları + hissedilen bileşenleri + kriz senaryoları (viral kısım).
 * Üyelere: 14 sınıf profili, kompozit katmanlar, 283 parametrelik tam döküm ve
 * tek tıkla aylık e-posta aboneliği. Yönetim /admin/enflasyon'da kalır.
 *
 * Not: Rapor Türkiye'ye özgü ve Türkçe bir üründür — sayfa metinleri bilinçli
 * olarak tek dilde tutuldu (parametre adları/registry zaten Türkçe).
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp, Lock, Mail, Loader2, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface LayerResult {
  key: string;
  label: string;
  value: number | null;
  weight: number;
  effectiveWeight: number | null;
  detail?: string;
}

interface ParamResult {
  key: string;
  label: string;
  category: string;
  unit: string;
  status: string;
  value: number | null;
  extra?: string;
  note?: string;
}

interface Profile {
  key: string;
  label: string;
  group?: "kriz" | "hane" | "is";
  value: number | null;
}

interface ApiPayload {
  ready: boolean;
  member: boolean;
  subscribed: boolean;
  period: string;
  computedAt: string;
  headline: { felt?: number | null; real: number | null; official: number | null; enag: number; gap: number | null };
  stats: { total: number; live: number; static: number; derived: number; pending: number };
  feltLayers: LayerResult[];
  krizProfiles: Profile[];
  profiles?: Profile[];
  layers?: LayerResult[];
  params?: ParamResult[];
  notes?: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  kompozit: "Kompozit Endeks",
  resmi: "Resmi Göstergeler",
  kur: "Döviz Kurları",
  partner: "Ticaret Ortağı Enflasyonu",
  ticaret: "Dış Ticaret Payları",
  "ithal-katki": "İthal Enflasyon Katkısı",
  "gecim-grup": "Geçim: TÜFE Ana Grupları",
  "gecim-madde": "Geçim: 50 Temel Kalem",
  varlik: "Varlık Fiyatları",
  kredi: "Kredi & Bankacılık",
  gelir: "Gelir & Alım Gücü",
  tasarruf: "Tasarruf Araçları",
  alternatif: "Alternatif Ölçümler",
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

export default function EnflasyonPublicPage() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [subBusy, setSubBusy] = useState(false);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/enflasyon", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleSubscription() {
    if (!data) return;
    setSubBusy(true);
    try {
      const res = await fetch("/api/enflasyon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: data.subscribed ? "unsubscribe" : "subscribe" }),
      });
      if (res.ok) {
        const json = await res.json();
        setData((d) => (d ? { ...d, subscribed: json.subscribed } : d));
      }
    } finally {
      setSubBusy(false);
    }
  }

  const h = data?.headline;
  const grouped: Record<string, ParamResult[]> = {};
  for (const p of data?.params ?? []) (grouped[p.category] ||= []).push(p);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-sm mb-5">
              <TrendingUp size={15} /> Her ayın 5&apos;inde otomatik güncellenir
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Gerçek Enflasyon Raporu</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Resmi rakam ile cebindeki gerçek arasındaki fark. TCMB, EVDS, Eurostat, World Bank ve
              market verilerinden beslenen <b className="text-gray-300">{data?.stats?.total ?? 283} parametreli</b> bağımsız
              endeks — {data ? periodLabel(data.period) : ""} dönemi.
            </p>
          </motion.div>

          {loading && (
            <div className="min-h-[30vh] flex items-center justify-center">
              <Loader2 size={24} className="text-blue-400 animate-spin" />
            </div>
          )}

          {!loading && data?.ready === false && (
            <p className="text-center text-gray-500">Rapor hazırlanıyor — kısa süre sonra tekrar bak.</p>
          )}

          {!loading && data?.ready && h && (
            <>
              {/* Manşet kartları — herkese açık */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "HİSSEDİLEN ENFLASYON", value: h.felt != null ? `%${h.felt.toLocaleString("tr-TR")}` : "—", cls: "text-red-400", sub: "borçlu-kiracı hane sepeti", ana: true },
                  { label: "Resmi TÜFE", value: h.official != null ? `%${h.official.toLocaleString("tr-TR")}` : "—", cls: "text-blue-400", sub: "TÜİK yıllık", ana: false },
                  { label: "ENAG E-TÜFE", value: `%${h.enag.toLocaleString("tr-TR")}`, cls: "text-purple-400", sub: "bağımsız raf ölçümü", ana: false },
                  { label: "Fark", value: h.gap != null ? `+${h.gap.toLocaleString("tr-TR")} puan` : "—", cls: "text-red-400", sub: "hissedilen − resmi", ana: false },
                ].map((c) => (
                  <div key={c.label} className={`bg-[#111118] border rounded-2xl p-5 ${c.ana ? "border-red-500/40" : "border-white/5"}`}>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{c.label}</p>
                    <p className={`${c.ana ? "text-4xl" : "text-3xl"} font-bold mt-2 ${c.cls}`}>{c.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{c.sub}</p>
                  </div>
                ))}
              </div>

              {/* Kriz senaryoları — herkese açık (viral kısım) */}
              {data.krizProfiles.length > 0 && (
                <div className="bg-[#111118] border border-red-500/25 rounded-2xl p-6 mb-8">
                  <h2 className="text-white font-semibold flex items-center gap-2 mb-1">
                    <AlertTriangle size={17} className="text-red-400" /> Enflasyonun en sert vurduğu senaryolar
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">Aynı veri, farklı hayatlar — enflasyon herkese aynı oranda dokunmuyor.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {data.krizProfiles.map((p) => (
                      <div key={p.key} className="bg-red-500/[0.06] border border-red-500/25 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-bold text-red-400">{p.value != null ? `%${p.value.toLocaleString("tr-TR")}` : "—"}</p>
                        <p className="text-xs text-gray-400 mt-1">{p.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hissedilen bileşenleri — herkese açık */}
              {data.feltLayers.length > 0 && (
                <div className="bg-[#111118] border border-white/5 rounded-2xl p-6 mb-8">
                  <h2 className="text-white font-semibold mb-4">Hissedilen Enflasyonun Bileşenleri</h2>
                  <div className="space-y-2">
                    {data.feltLayers.map((l) => (
                      <div key={l.key} className="flex items-center gap-3 text-sm">
                        <span className="w-52 shrink-0 text-gray-300">{l.label}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          {l.value != null && (
                            <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: `${Math.min(100, Math.max(2, (l.value / 80) * 100))}%` }} />
                          )}
                        </div>
                        <span className="w-16 text-right font-semibold text-white">{l.value != null ? `%${l.value.toLocaleString("tr-TR")}` : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Üye değilse: kilit + CTA */}
              {!data.member && (
                <div className="relative mb-8">
                  <div className="bg-[#111118] border border-white/5 rounded-2xl p-8 text-center">
                    <Lock size={28} className="text-blue-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Raporun tamamı üyelere ücretsiz</h2>
                    <p className="text-gray-400 max-w-xl mx-auto mb-6">
                      14 sınıf profili (kiracı, kredi çeviren, esnaf, üretici, holding...), kompozit katmanlar,
                      {" "}{data.stats.total} parametrenin tam dökümü ve her ay e-postana gelen rapor — hepsi ücretsiz üyelikle.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link href="/uye-ol?next=/enflasyon" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-sm text-white font-semibold hover:opacity-90 transition">
                        Ücretsiz Üye Ol
                      </Link>
                      <Link href="/giris?next=/enflasyon" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition">
                        Giriş Yap
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Üye: abonelik + tam içerik */}
              {data.member && (
                <>
                  <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Mail size={20} className="text-blue-400" />
                      <div>
                        <p className="text-white font-semibold">Aylık rapor e-postası</p>
                        <p className="text-xs text-gray-400">Her ayın 5&apos;inde bu raporun özeti hesabının e-posta adresine gelir.</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleSubscription}
                      disabled={subBusy}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                        data.subscribed
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500"
                      }`}
                    >
                      {subBusy ? <Loader2 size={15} className="animate-spin" /> : data.subscribed ? <CheckCircle2 size={15} /> : <Mail size={15} />}
                      {data.subscribed ? "Abonesin — çıkmak için tıkla" : "Aylık Raporu Mail Al"}
                    </button>
                  </div>

                  {/* Tüm profiller */}
                  {(data.profiles?.length ?? 0) > 0 && (
                    <div className="bg-[#111118] border border-white/5 rounded-2xl p-6 mb-8">
                      <h2 className="text-white font-semibold mb-4">Senin Enflasyonun Kaç? — Sınıf Profilleri</h2>
                      {([
                        { g: "hane", title: "Hane profilleri", cls: "text-red-300" },
                        { g: "is", title: "İş dünyası — maliyet enflasyonu", cls: "text-amber-300" },
                      ] as const).map(({ g, title, cls }) => {
                        const items = data.profiles!.filter((p) => (p.group ?? "hane") === g);
                        if (items.length === 0) return null;
                        return (
                          <div key={g} className="mb-4">
                            <p className="text-xs text-gray-500 mb-3">{title}</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                              {items.map((p) => (
                                <div key={p.key} className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-center">
                                  <p className={`text-lg font-bold ${cls}`}>{p.value != null ? `%${p.value.toLocaleString("tr-TR")}` : "—"}</p>
                                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{p.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Kompozit katmanlar */}
                  {(data.layers?.length ?? 0) > 0 && (
                    <div className="bg-[#111118] border border-white/5 rounded-2xl p-6 mb-8">
                      <h2 className="text-white font-semibold mb-4">
                        Genel Kompozit Katmanları {h.real != null && <span className="text-gray-500 text-sm font-normal">(ekonomi geneli: %{h.real.toLocaleString("tr-TR")})</span>}
                      </h2>
                      <div className="space-y-2">
                        {data.layers!.map((l) => (
                          <div key={l.key} className="flex items-center gap-3 text-sm">
                            <span className="w-44 shrink-0 text-gray-300">{l.label}</span>
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              {l.value != null && (
                                <div className="h-full bg-gradient-to-r from-blue-500 to-red-500 rounded-full" style={{ width: `${Math.min(100, Math.max(2, (l.value / 80) * 100))}%` }} />
                              )}
                            </div>
                            <span className="w-16 text-right font-semibold text-white">{l.value != null ? `%${l.value.toLocaleString("tr-TR")}` : "—"}</span>
                            <span className="w-14 text-right text-xs text-gray-500">{l.effectiveWeight != null ? `ağ. %${Math.round(l.effectiveWeight * 100)}` : "—"}</span>
                          </div>
                        ))}
                      </div>
                      {(data.notes?.length ?? 0) > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
                          {data.notes!.map((n, i) => <p key={i} className="text-xs text-gray-600">• {n}</p>)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tam parametre dökümü */}
                  {Object.keys(grouped).length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-white font-semibold mb-4 border-l-4 border-blue-500/40 pl-4">Tam Parametre Dökümü ({data.stats.total})</h2>
                      <div className="space-y-4">
                        {Object.keys(CATEGORY_LABELS).map((cat) => {
                          const items = grouped[cat];
                          if (!items?.length) return null;
                          const open = !!openCats[cat];
                          const filled = items.filter((p) => p.value != null).length;
                          return (
                            <div key={cat} className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden">
                              <button onClick={() => setOpenCats((s) => ({ ...s, [cat]: !s[cat] }))} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition">
                                <span className="text-white font-medium flex items-center gap-2">
                                  {open ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                                  {CATEGORY_LABELS[cat]}
                                </span>
                                <span className="text-xs text-gray-500">{filled}/{items.length} dolu</span>
                              </button>
                              {open && (
                                <div className="px-5 pb-4 overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <tbody>
                                      {items.map((p) => (
                                        <tr key={p.key} className="border-t border-white/5">
                                          <td className="py-2 pr-3 text-gray-300">{p.label}</td>
                                          <td className="py-2 pr-3 text-right font-semibold text-white whitespace-nowrap">{fmtValue(p)}</td>
                                          <td className="py-2 text-xs text-gray-500 whitespace-nowrap">{p.extra || ""}</td>
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
                    </div>
                  )}
                </>
              )}

              <p className="text-center text-xs text-gray-600">
                {data.stats.live} canlı veri kaynağı · ERPIDE Yazılım A.Ş. tarafından her ay otomatik hesaplanır ·
                Metodoloji ve tüm kaynaklar raporun içinde şeffaftır. Yatırım tavsiyesi değildir.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
