"use client";
import { useState } from "react";
import {
  TrendingUp, TrendingDown, PiggyBank, Sparkles, Plus, Receipt, Camera,
  Calendar, Target, Wallet, AlertCircle, Check, X,
} from "lucide-react";
import { PocketData, Transaction, fmt, uid, TX_CATEGORIES, periodLabel } from "./lib";

export default function TabGenel({
  data, period, update,
}: {
  data: PocketData; period: string; update: (d: PocketData) => void;
}) {
  const [showAdd, setShowAdd] = useState<"income" | "expense" | null>(null);

  const monthTxs = data.txs.filter((t) => t.date.startsWith(period));
  // Maaş bu ayda otomatik gelir sayılır
  const salaryNet = data.salary?.net || 0;
  const monthIncome = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) + salaryNet;
  const monthExpense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthNet = monthIncome - monthExpense;
  const savingRate = monthIncome > 0 ? Math.round((monthNet / monthIncome) * 100) : 0;

  // Kategori bazlı gider
  const expenseByCat: Record<string, number> = {};
  for (const t of monthTxs) {
    if (t.type === "expense") expenseByCat[t.category] = (expenseByCat[t.category] || 0) + t.amount;
  }
  const topCats = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]).slice(0, 5);

  function addTx(t: Transaction) {
    update({ ...data, txs: [t, ...data.txs] });
    setShowAdd(null);
  }

  function delTx(id: string) {
    update({ ...data, txs: data.txs.filter((t) => t.id !== id) });
  }

  function saveSalary(gross: number, net: number) {
    update({ ...data, salary: { gross, net, payDay: data.salary?.payDay || 1 } });
  }

  function saveGoal(target: number, deadline: string, title?: string) {
    update({ ...data, goals: [{ target, deadline, title }] });
  }

  return (
    <>
      <section className="mb-6">
        <div className="grid sm:grid-cols-4 gap-3">
          <Stat icon={<TrendingUp size={14} />} label="Gelir" value={fmt(monthIncome)} tone="emerald" hint={salaryNet > 0 ? `Maaş +${fmt(salaryNet)}` : undefined} />
          <Stat icon={<TrendingDown size={14} />} label="Gider" value={fmt(monthExpense)} tone="red" />
          <Stat icon={<PiggyBank size={14} />} label="Kalan" value={fmt(monthNet)} tone={monthNet >= 0 ? "blue" : "red"} />
          <Stat icon={<Sparkles size={14} />} label="Tasarruf Oranı" value={`%${savingRate}`} tone={savingRate >= 20 ? "emerald" : savingRate >= 0 ? "amber" : "red"} />
        </div>
      </section>

      <section className="mb-6 grid sm:grid-cols-3 gap-3">
        <ActionCard icon={<Plus size={20} />} title="Gelir Ekle" desc={`${periodLabel(period)} için gelir kaydı`} onClick={() => setShowAdd("income")} tone="emerald" />
        <ActionCard icon={<Receipt size={20} />} title="Gider Ekle" desc={`${periodLabel(period)} için gider kaydı`} onClick={() => setShowAdd("expense")} tone="red" />
        <ActionCard icon={<Camera size={20} />} title="AI ile Fatura Çek" desc="Yakında (lisanslı)" disabled tone="purple" />
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 p-6 rounded-2xl bg-[#0f0a13] border border-white/5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-pink-400" /> {periodLabel(period)} İşlemleri
          </h3>
          {monthTxs.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center">Bu ayda işlem yok — yukarıdan Gelir/Gider ekle.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {monthTxs.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === "income" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                      {t.type === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{t.note || t.category}</p>
                      <p className="text-xs text-gray-500">{t.category} · {new Date(t.date).toLocaleDateString("tr-TR")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`font-mono font-bold text-sm ${t.type === "income" ? "text-emerald-300" : "text-red-300"}`}>
                      {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                    </span>
                    <button onClick={() => delTx(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition" title="Sil">
                      <X size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <SalaryCard salary={data.salary} onSave={saveSalary} />
          <GoalCard goal={data.goals[0]} current={monthNet} onSave={saveGoal} />
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

      {showAdd && <AddTxModal type={showAdd} period={period} onClose={() => setShowAdd(null)} onSave={addTx} />}
    </>
  );
}


function Stat({ icon, label, value, tone, hint }: { icon: React.ReactNode; label: string; value: string; tone: "emerald" | "red" | "blue" | "amber"; hint?: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/5 border-emerald-500/20 text-emerald-300",
    red:     "bg-red-500/5 border-red-500/20 text-red-300",
    blue:    "bg-blue-500/5 border-blue-500/20 text-blue-300",
    amber:   "bg-amber-500/5 border-amber-500/20 text-amber-300",
  };
  return (
    <div className={`p-4 rounded-2xl border ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-80 mb-1">{icon} {label}</div>
      <p className="text-2xl font-bold font-mono text-white">{value}</p>
      {hint && <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, tone, disabled }: { icon: React.ReactNode; title: string; desc: string; onClick?: () => void; tone: "emerald" | "red" | "purple"; disabled?: boolean }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20",
    red:     "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20",
    purple:  "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`p-5 rounded-2xl border text-left transition ${tones[tone]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
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

  if (!editing && salary) {
    return (
      <div className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2"><Wallet size={14} className="text-pink-400" /> Aylık Maaş</h3>
        <p className="text-2xl font-bold text-white font-mono">{fmt(salary.net)}</p>
        <p className="text-[11px] text-gray-500 mt-1">Brüt: {fmt(salary.gross)} · Otomatik aylık gelir</p>
        <button onClick={() => setEditing(true)} className="mt-3 text-[11px] text-pink-300 hover:text-pink-200 underline">Düzenle</button>
      </div>
    );
  }
  return (
    <div className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
      <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2"><Wallet size={14} className="text-pink-400" /> Aylık Maaşını Gir</h3>
      <div className="space-y-2">
        <input type="number" placeholder="Brüt maaş" value={gross} onChange={(e) => setGross(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-pink-500 outline-none" />
        <input type="number" placeholder="Net maaş (eline geçen)" value={net} onChange={(e) => setNet(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-pink-500 outline-none" />
        <button onClick={() => { const g = parseFloat(gross) || 0; const n = parseFloat(net) || 0; if (n > 0) { onSave(g, n); setEditing(false); } }} className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold">Kaydet</button>
      </div>
    </div>
  );
}

function GoalCard({ goal, current, onSave }: { goal: { target: number; deadline: string; title?: string } | undefined; current: number; onSave: (t: number, d: string, title?: string) => void }) {
  const [editing, setEditing] = useState(!goal);
  const [target, setTarget] = useState(goal?.target.toString() || "");
  const [deadline, setDeadline] = useState(goal?.deadline || "");
  const [title, setTitle] = useState(goal?.title || "");

  if (!editing && goal) {
    const pct = Math.min(100, Math.max(0, (current / goal.target) * 100));
    return (
      <div className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2"><Target size={14} className="text-pink-400" /> {goal.title || "Tasarruf Hedefi"}</h3>
        <p className="text-[11px] text-gray-500 mb-1">Hedef: <strong className="text-white">{fmt(goal.target)}</strong> · {new Date(goal.deadline).toLocaleDateString("tr-TR")}</p>
        <div className="h-2 rounded-full bg-black/40 overflow-hidden my-2">
          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400">Bu ay: {fmt(current)} ({Math.round(pct)}%)</p>
        <button onClick={() => setEditing(true)} className="mt-3 text-[11px] text-pink-300 hover:text-pink-200 underline">Düzenle</button>
      </div>
    );
  }
  return (
    <div className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
      <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2"><Target size={14} className="text-pink-400" /> Hedef Belirle</h3>
      <div className="space-y-2">
        <input placeholder="Hedef adı (örn: Tatil)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
        <input type="number" placeholder="Hedef tutar (TL)" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
        <button onClick={() => { const t = parseFloat(target); if (t > 0 && deadline) { onSave(t, deadline, title); setEditing(false); } }} className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold">Kaydet</button>
      </div>
    </div>
  );
}

function AddTxModal({ type, period, onClose, onSave }: { type: "income" | "expense"; period: string; onClose: () => void; onSave: (t: Transaction) => void }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(TX_CATEGORIES[type][0]);
  const [note, setNote] = useState("");
  // Görüntülenen ayın ilk günü default
  const defaultDate = `${period}-${new Date().getMonth() + 1 === parseInt(period.split("-")[1]) ? String(new Date().getDate()).padStart(2, "0") : "01"}`;
  const [date, setDate] = useState(defaultDate);
  const isIncome = type === "income";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onSave({ id: uid("tx"), type, amount: amt, category, note, date });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-[#0f0a13] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isIncome ? <TrendingUp size={18} className="text-emerald-400" /> : <TrendingDown size={18} className="text-red-400" />}
            {isIncome ? "Gelir Ekle" : "Gider Ekle"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Tutar (₺)</label>
            <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-base font-mono focus:border-pink-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm">
              {TX_CATEGORIES[type].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Açıklama (opsiyonel)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm">İptal</button>
          <button type="submit" className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold ${isIncome ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}>Ekle</button>
        </div>
      </form>
    </div>
  );
}
