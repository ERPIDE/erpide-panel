"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet, TrendingUp, TrendingDown, Sparkles, Plus, Receipt, Camera,
  Calendar, PiggyBank, Target, LogOut, AlertCircle, ShoppingBag, Loader2,
} from "lucide-react";
import Logo from "@/components/Logo";

interface MeResp {
  user: { id: string; email: string; name: string; surname: string } | null;
  apps?: { pocketerpide?: boolean };
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string; // ISO
}

const CATEGORIES = {
  income:  ["Maaş", "Ek Gelir", "Kira Geliri", "Yatırım Getirisi", "Diğer"],
  expense: ["Market", "Kira", "Fatura", "Ulaşım", "Yemek", "Sağlık", "Eğlence", "Giyim", "Eğitim", "Diğer"],
};

export default function PocketDashboardPage() {
  const [me, setMe] = useState<MeResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState<"income" | "expense" | null>(null);

  // MVP: localStorage tabanlı persistence. Production'a alırken tenant DB'ye taşınacak.
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [salary, setSalary] = useState<{ gross: number; net: number } | null>(null);
  const [goal, setGoal] = useState<{ target: number; deadline: string } | null>(null);

  useEffect(() => {
    fetch("/api/shop/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setMe(d); setLoading(false); });

    try {
      const raw = localStorage.getItem("pocket:txs");
      if (raw) setTxs(JSON.parse(raw));
      const sal = localStorage.getItem("pocket:salary");
      if (sal) setSalary(JSON.parse(sal));
      const g = localStorage.getItem("pocket:goal");
      if (g) setGoal(JSON.parse(g));
    } catch {}
  }, []);

  function saveTx(t: Transaction) {
    const next = [t, ...txs];
    setTxs(next);
    try { localStorage.setItem("pocket:txs", JSON.stringify(next)); } catch {}
  }

  function saveSalary(gross: number, net: number) {
    const s = { gross, net };
    setSalary(s);
    try { localStorage.setItem("pocket:salary", JSON.stringify(s)); } catch {}
  }

  function saveGoal(target: number, deadline: string) {
    const g = { target, deadline };
    setGoal(g);
    try { localStorage.setItem("pocket:goal", JSON.stringify(g)); } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={28} className="text-pink-400 animate-spin" />
      </div>
    );
  }

  if (!me?.user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Wallet size={48} className="text-pink-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">PocketERPIDE</h1>
          <p className="text-gray-400 text-sm mb-6">Devam etmek için giriş yap.</p>
          <Link href="/giris?next=/pocket" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold transition">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  const hasLicense = !!me.apps?.pocketerpide;

  // Aylık özet — bu ayın işlemleri
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTxs = txs.filter((t) => t.date.startsWith(monthKey));
  const monthIncome = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
                    + (salary?.net || 0);
  const monthExpense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthNet = monthIncome - monthExpense;
  const savingRate = monthIncome > 0 ? Math.round((monthNet / monthIncome) * 100) : 0;

  // Kategori bazlı gider
  const expenseByCat: Record<string, number> = {};
  for (const t of monthTxs) {
    if (t.type === "expense") expenseByCat[t.category] = (expenseByCat[t.category] || 0) + t.amount;
  }
  const topCats = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-950/20 via-black to-black text-white">
      {/* ===== HEADER ===== */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-gray-500">/</span>
            <span className="text-sm font-semibold text-pink-300 flex items-center gap-1.5">
              <Wallet size={14} /> PocketERPIDE
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-200 border border-pink-500/30 uppercase">
              MVP
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 hidden sm:inline">{me.user.email}</span>
            <Link href="/hesabim" className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition">
              Hesabım
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ===== LISANS UYARISI ===== */}
        {!hasLicense && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle size={22} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-base font-bold text-amber-100 mb-1">Demo Modu — Lisans Aktif Değil</h2>
              <p className="text-sm text-amber-100/80 leading-relaxed mb-3">
                PocketERPIDE&apos;nin tüm özelliklerini (AI fatura okuma, otomatik kategorize, çoklu hesap, dışa aktarma) kullanmak için
                $3/ay aboneliğini başlat. Şu an verilerin tarayıcında saklanır.
              </p>
              <Link href="/urunler/pocketerpide" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-sm font-semibold border border-amber-500/40 transition">
                <ShoppingBag size={14} /> Aboneliği Başlat — $3/ay
              </Link>
            </div>
          </div>
        )}

        {/* ===== AY ÖZETİ ===== */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Bu Ay</h2>
            <span className="text-xs text-gray-500 font-mono">{now.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</span>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            <Stat icon={<TrendingUp size={14} />} label="Gelir" value={fmt(monthIncome)} tone="emerald" />
            <Stat icon={<TrendingDown size={14} />} label="Gider" value={fmt(monthExpense)} tone="red" />
            <Stat icon={<PiggyBank size={14} />} label="Kalan" value={fmt(monthNet)} tone={monthNet >= 0 ? "blue" : "red"} />
            <Stat icon={<Sparkles size={14} />} label="Tasarruf Oranı" value={`%${savingRate}`} tone={savingRate >= 20 ? "emerald" : savingRate >= 0 ? "amber" : "red"} />
          </div>
        </section>

        {/* ===== ANA AKSIYONLAR ===== */}
        <section className="mb-8 grid sm:grid-cols-3 gap-3">
          <ActionCard
            icon={<Plus size={20} />}
            title="Gelir Ekle"
            desc="Manuel gelir kaydı"
            onClick={() => setShowAdd("income")}
            tone="emerald"
          />
          <ActionCard
            icon={<Receipt size={20} />}
            title="Gider Ekle"
            desc="Manuel gider kaydı"
            onClick={() => setShowAdd("expense")}
            tone="red"
          />
          <ActionCard
            icon={<Camera size={20} />}
            title="AI ile Fatura Çek"
            desc={hasLicense ? "Fotoğraf at, AI okusun (yakında)" : "Sadece abonelerde"}
            disabled
            tone="purple"
          />
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* SOL: SON İŞLEMLER */}
          <section className="lg:col-span-2 p-6 rounded-2xl bg-[#0f0a13] border border-white/5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-pink-400" /> Son İşlemler
            </h3>
            {monthTxs.length === 0 ? (
              <p className="text-sm text-gray-500 py-12 text-center">
                Henüz işlem yok — yukarıdan Gelir/Gider ekle.
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {monthTxs.slice(0, 10).map((t) => (
                  <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        t.type === "income" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                      }`}>
                        {t.type === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{t.note || t.category}</p>
                        <p className="text-xs text-gray-500">{t.category} · {new Date(t.date).toLocaleDateString("tr-TR")}</p>
                      </div>
                    </div>
                    <span className={`font-mono font-bold text-sm ${t.type === "income" ? "text-emerald-300" : "text-red-300"}`}>
                      {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* SAĞ: MAAŞ + HEDEF + KATEGORI */}
          <aside className="space-y-4">
            <SalaryCard salary={salary} onSave={saveSalary} />
            <GoalCard goal={goal} current={monthNet} onSave={saveGoal} />
            {topCats.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
                <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <Target size={14} className="text-pink-400" /> En Çok Harcama
                </h3>
                <ul className="space-y-2">
                  {topCats.map(([cat, amt]) => {
                    const pct = monthExpense > 0 ? (amt / monthExpense) * 100 : 0;
                    return (
                      <li key={cat}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-300">{cat}</span>
                          <span className="font-mono text-gray-400">{fmt(amt)} <span className="text-gray-600">({Math.round(pct)}%)</span></span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
                          <div className="h-full bg-pink-500" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </aside>
        </div>

        <div className="mt-12 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-200/80 leading-relaxed">
          <p>
            <strong>MVP Notu:</strong> Bu sürüm tarayıcı belleğini kullanıyor. Aboneliğini başlatınca verilerin senin&apos;e bağlı izole DB&apos;ye taşınır,
            AI fotoğraf okuma, çoklu cihaz senkron, otomatik kategorize ve aylık PDF rapor açılır. Geri bildirim için <Link href="/iletisim" className="underline">iletişim</Link>.
          </p>
        </div>
      </main>

      {/* ===== ADD MODAL ===== */}
      {showAdd && (
        <AddTxModal
          type={showAdd}
          onClose={() => setShowAdd(null)}
          onSave={(t) => { saveTx(t); setShowAdd(null); }}
        />
      )}
    </div>
  );
}


function fmt(n: number): string {
  return `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}


function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "emerald" | "red" | "blue" | "amber" }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/5 border-emerald-500/20 text-emerald-300",
    red:     "bg-red-500/5 border-red-500/20 text-red-300",
    blue:    "bg-blue-500/5 border-blue-500/20 text-blue-300",
    amber:   "bg-amber-500/5 border-amber-500/20 text-amber-300",
  };
  return (
    <div className={`p-4 rounded-2xl border ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-80 mb-1">
        {icon} {label}
      </div>
      <p className="text-2xl font-bold font-mono text-white">{value}</p>
    </div>
  );
}


function ActionCard({ icon, title, desc, onClick, tone, disabled }: {
  icon: React.ReactNode; title: string; desc: string;
  onClick?: () => void; tone: "emerald" | "red" | "purple"; disabled?: boolean;
}) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20",
    red:     "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20",
    purple:  "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-5 rounded-2xl border text-left transition ${tones[tone]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-black/30 flex items-center justify-center">{icon}</div>
        <div>
          <h4 className="font-semibold text-white text-sm">{title}</h4>
          <p className="text-xs opacity-80 mt-0.5">{desc}</p>
        </div>
      </div>
    </button>
  );
}


function SalaryCard({ salary, onSave }: { salary: { gross: number; net: number } | null; onSave: (g: number, n: number) => void }) {
  const [editing, setEditing] = useState(!salary);
  const [gross, setGross] = useState(salary?.gross.toString() || "");
  const [net, setNet] = useState(salary?.net.toString() || "");

  function commit() {
    const g = parseFloat(gross) || 0;
    const n = parseFloat(net) || 0;
    if (n > 0) { onSave(g, n); setEditing(false); }
  }

  if (!editing && salary) {
    return (
      <div className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
          <Wallet size={14} className="text-pink-400" /> Aylık Maaş
        </h3>
        <p className="text-2xl font-bold text-white font-mono">{fmt(salary.net)}</p>
        <p className="text-[11px] text-gray-500 mt-1">Brüt: {fmt(salary.gross)}</p>
        <button onClick={() => setEditing(true)} className="mt-3 text-[11px] text-pink-300 hover:text-pink-200 underline">
          Düzenle
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
      <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
        <Wallet size={14} className="text-pink-400" /> Aylık Maaşını Gir
      </h3>
      <div className="space-y-2">
        <input
          type="number"
          placeholder="Brüt maaş"
          value={gross}
          onChange={(e) => setGross(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-pink-500 outline-none"
        />
        <input
          type="number"
          placeholder="Net maaş (eline geçen)"
          value={net}
          onChange={(e) => setNet(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-pink-500 outline-none"
        />
        <button onClick={commit} className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold">
          Kaydet
        </button>
      </div>
    </div>
  );
}


function GoalCard({ goal, current, onSave }: { goal: { target: number; deadline: string } | null; current: number; onSave: (t: number, d: string) => void }) {
  const [editing, setEditing] = useState(!goal);
  const [target, setTarget] = useState(goal?.target.toString() || "");
  const [deadline, setDeadline] = useState(goal?.deadline || "");

  if (!editing && goal) {
    const pct = Math.min(100, Math.max(0, (current / goal.target) * 100));
    return (
      <div className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
          <Target size={14} className="text-pink-400" /> Tasarruf Hedefi
        </h3>
        <p className="text-[11px] text-gray-500 mb-1">Hedef: <strong className="text-white">{fmt(goal.target)}</strong> · {new Date(goal.deadline).toLocaleDateString("tr-TR")}</p>
        <div className="h-2 rounded-full bg-black/40 overflow-hidden my-2">
          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400">Bu ay: {fmt(current)} ({Math.round(pct)}%)</p>
        <button onClick={() => setEditing(true)} className="mt-3 text-[11px] text-pink-300 hover:text-pink-200 underline">
          Düzenle
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
      <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
        <Target size={14} className="text-pink-400" /> Hedef Belirle
      </h3>
      <div className="space-y-2">
        <input
          type="number"
          placeholder="Hedef tutar (TL)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-pink-500 outline-none"
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-pink-500 outline-none"
        />
        <button
          onClick={() => {
            const t = parseFloat(target);
            if (t > 0 && deadline) { onSave(t, deadline); setEditing(false); }
          }}
          className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold"
        >
          Kaydet
        </button>
      </div>
    </div>
  );
}


function AddTxModal({ type, onClose, onSave }: { type: "income" | "expense"; onClose: () => void; onSave: (t: Transaction) => void }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[type][0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onSave({
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      type, amount: amt, category, note, date,
    });
  }

  const isIncome = type === "income";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-[#0f0a13] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isIncome ? <TrendingUp size={18} className="text-emerald-400" /> : <TrendingDown size={18} className="text-red-400" />}
            {isIncome ? "Gelir Ekle" : "Gider Ekle"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Tutar (₺)</label>
            <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-base font-mono focus:border-pink-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-pink-500 outline-none">
              {CATEGORIES[type].map((c) => <option key={c} value={c} className="bg-[#0f0a13]">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Açıklama (opsiyonel)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn: A101 alışveriş"
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-pink-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-pink-500 outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-medium">
            İptal
          </button>
          <button type="submit" className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition ${
            isIncome ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
          }`}>
            Ekle
          </button>
        </div>
      </form>
    </div>
  );
}
