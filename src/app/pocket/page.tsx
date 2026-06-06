"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet, LayoutDashboard, CreditCard, Landmark, Trophy,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, ShoppingBag, Calendar,
} from "lucide-react";
import Logo from "@/components/Logo";
import {
  loadData, saveData, currentPeriod, prevPeriod, nextPeriod, periodLabel,
  type PocketData,
} from "./lib";
import TabGenel from "./TabGenel";
import TabKartlar from "./TabKartlar";
import TabKrediler from "./TabKrediler";
import TabAlimlar from "./TabAlimlar";

interface MeResp {
  user: { id: string; email: string; name: string; surname: string } | null;
  apps?: { pocketerpide?: boolean };
}

type TabKey = "genel" | "kartlar" | "krediler" | "alimlar";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "genel",    label: "Genel Bakış",   icon: LayoutDashboard },
  { key: "kartlar",  label: "Kredi Kartları", icon: CreditCard },
  { key: "krediler", label: "Krediler",       icon: Landmark },
  { key: "alimlar",  label: "Büyük Alımlar",  icon: Trophy },
];

export default function PocketPage() {
  const [me, setMe] = useState<MeResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PocketData>(() => ({ txs: [], salary: null, goals: [], cards: [], statements: [], loans: [], loanPayments: [], bigItems: [] }));
  const [period, setPeriod] = useState<string>(currentPeriod());
  const [tab, setTab] = useState<TabKey>("genel");

  useEffect(() => {
    fetch("/api/shop/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setMe(d); setLoading(false); });
    setData(loadData());
  }, []);

  function update(next: PocketData) {
    setData(next);
    saveData(next);
  }

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 size={28} className="text-pink-400 animate-spin" /></div>;
  }

  if (!me?.user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Wallet size={48} className="text-pink-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">PocketERPIDE</h1>
          <p className="text-gray-400 text-sm mb-6">Devam etmek için giriş yap.</p>
          <Link href="/giris?next=/pocket" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold transition">Giriş Yap</Link>
        </div>
      </div>
    );
  }

  const hasLicense = !!me.apps?.pocketerpide;
  const isCurrentMonth = period === currentPeriod();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-950/20 via-black to-black text-white">
      {/* ===== HEADER ===== */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo />
            <span className="text-gray-500">/</span>
            <span className="text-sm font-semibold text-pink-300 flex items-center gap-1.5">
              <Wallet size={14} /> PocketERPIDE
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-200 border border-pink-500/30 uppercase">MVP</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 hidden md:inline">{me.user.email}</span>
            <Link href="/hesabim" className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition">Hesabım</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ===== LISANS UYARI BANNER ===== */}
        {!hasLicense && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-100 mb-1">Demo Modu — Veriler tarayıcında saklanır</p>
              <p className="text-xs text-amber-100/80 leading-relaxed">Tam özellik (AI fatura okuma · çoklu cihaz senkron · PDF rapor) için $3/ay aboneliğini başlat.</p>
            </div>
            <Link href="/urunler/pocketerpide" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-semibold border border-amber-500/40 flex-shrink-0">
              <ShoppingBag size={12} /> Aktive Et
            </Link>
          </div>
        )}

        {/* ===== AY NAVIGASYONU ===== */}
        <div className="mb-6 p-4 rounded-2xl bg-[#0f0a13] border border-white/5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => setPeriod((p) => prevPeriod(p))} className="w-9 h-9 rounded-xl bg-black/40 hover:bg-white/5 border border-white/10 flex items-center justify-center transition">
              <ChevronLeft size={16} className="text-gray-300" />
            </button>
            <div className="px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/30 min-w-[180px] text-center">
              <p className="text-[9px] uppercase tracking-wider text-pink-300/70">Görüntülenen Ay</p>
              <p className="text-lg font-bold text-white">{periodLabel(period)}</p>
            </div>
            <button onClick={() => setPeriod((p) => nextPeriod(p))} className="w-9 h-9 rounded-xl bg-black/40 hover:bg-white/5 border border-white/10 flex items-center justify-center transition">
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          </div>
          {!isCurrentMonth && (
            <button onClick={() => setPeriod(currentPeriod())} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300">
              <Calendar size={12} /> Bu Ay&apos;a dön
            </button>
          )}
        </div>

        {/* ===== TAB BAR ===== */}
        <div className="mb-6 flex gap-1 sm:gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition flex-shrink-0 ${
                  active
                    ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-900/40"
                    : "bg-[#0f0a13] border border-white/5 text-gray-300 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ===== TAB IÇERIK ===== */}
        {tab === "genel"    && <TabGenel    data={data} period={period} update={update} />}
        {tab === "kartlar"  && <TabKartlar  data={data} period={period} update={update} />}
        {tab === "krediler" && <TabKrediler data={data} period={period} update={update} />}
        {tab === "alimlar"  && <TabAlimlar  data={data} update={update} />}

        <div className="mt-12 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-200/80 leading-relaxed">
          <strong>MVP Notu:</strong> Veriler tarayıcı belleğinde. Aboneliği başlatınca tenant DB&apos;ye taşınır,
          AI fotoğraf okuma + çoklu cihaz senkron + aylık PDF rapor + banka entegrasyonu açılır.
          Geri bildirim: <Link href="/iletisim" className="underline">iletişim</Link>.
        </div>
      </main>
    </div>
  );
}
