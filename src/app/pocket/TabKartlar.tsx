"use client";
import { useState } from "react";
import {
  CreditCard, Plus, TrendingUp, AlertCircle, Check, X, Receipt, Calendar, Percent,
} from "lucide-react";
import { PocketData, CreditCard as CardModel, CardStatement, fmt, uid, periodLabel } from "./lib";

type Card = CardModel;

export default function TabKartlar({ data, period, update }: { data: PocketData; period: string; update: (d: PocketData) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editStatement, setEditStatement] = useState<{ cardId: string } | null>(null);

  function addCard(c: Card) {
    update({ ...data, cards: [...data.cards, c] });
    setShowAdd(false);
  }

  function delCard(id: string) {
    if (!confirm("Bu kartı silmek istediğinden emin misin? Geçmiş ekstre kayıtları da silinir.")) return;
    update({
      ...data,
      cards: data.cards.filter((c) => c.id !== id),
      statements: data.statements.filter((s) => s.cardId !== id),
    });
  }

  function saveStatement(s: CardStatement) {
    const existing = data.statements.find((x) => x.cardId === s.cardId && x.period === s.period);
    const statements = existing
      ? data.statements.map((x) => (x.id === existing.id ? { ...s, id: existing.id } : x))
      : [...data.statements, s];
    update({ ...data, statements });
    setEditStatement(null);
  }

  // Bu ay tüm kartlardan toplam
  const monthStatements = data.statements.filter((s) => s.period === period);
  const totalSpent = monthStatements.reduce((sum, s) => sum + s.totalSpent, 0);
  const totalInterest = monthStatements.reduce((sum, s) => sum + s.interestCharged, 0);
  const totalDue = monthStatements.reduce((sum, s) => sum + s.totalDue, 0);
  const totalPaid = monthStatements.reduce((sum, s) => sum + s.paidAmount, 0);

  // Kart bazlı bu ay verisi
  const cardData = data.cards.map((card) => {
    const stmt = monthStatements.find((s) => s.cardId === card.id);
    const spent = stmt?.totalSpent || 0;
    const available = Math.max(0, card.limit - spent);
    const utilization = card.limit > 0 ? (spent / card.limit) * 100 : 0;
    return { card, stmt, spent, available, utilization };
  });

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Kredi Kartları</h2>
          <p className="text-sm text-gray-400 mt-0.5">Limit, harcama, ödenen tutar, asgari ve faiz takibi.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-semibold hover:opacity-90">
          <Plus size={14} /> Kart Ekle
        </button>
      </div>

      {/* Üst stat */}
      {data.cards.length > 0 && (
        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Bu Ay Harcama" value={fmt(totalSpent)} tone="red" />
          <Stat label="Toplam Borç" value={fmt(totalDue)} tone="amber" />
          <Stat label="Ödenen" value={fmt(totalPaid)} tone="emerald" />
          <Stat label="İşletilen Faiz" value={fmt(totalInterest)} tone="red" hint="Bankaya kayıp" />
        </div>
      )}

      {data.cards.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0f0a13] border border-white/5 text-center">
          <CreditCard size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Henüz kart eklemedin.</p>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/15 text-pink-300 border border-pink-500/30 text-sm font-medium">
            <Plus size={14} /> İlk kartını ekle
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {cardData.map(({ card, stmt, spent, available, utilization }) => {
            const utilTone = utilization > 80 ? "red" : utilization > 50 ? "amber" : "emerald";
            const utilColor = utilTone === "red" ? "bg-red-500" : utilTone === "amber" ? "bg-amber-500" : "bg-emerald-500";
            return (
              <div key={card.id} className="rounded-2xl border border-white/5 overflow-hidden">
                {/* Kart gradient header */}
                <div className={`p-5 bg-gradient-to-br ${card.color || "from-pink-600 to-rose-700"} relative`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/70">Kart</p>
                      <h3 className="text-lg font-bold text-white">{card.name}</h3>
                    </div>
                    <button onClick={() => delCard(card.id)} className="text-white/60 hover:text-white" title="Kartı sil"><X size={16} /></button>
                  </div>
                  <p className="text-base font-mono text-white tracking-widest">•••• •••• •••• {card.last4}</p>
                  <div className="flex items-center gap-4 mt-4 text-[10px] text-white/80">
                    <span>Kesim: ayın {card.statementDay}&apos;i</span>
                    <span>Son Öd: ayın {card.dueDay}&apos;i</span>
                    <span><Percent size={9} className="inline -mt-0.5" /> {card.interestRate.toFixed(2)}/ay</span>
                  </div>
                </div>

                {/* İstatistik */}
                <div className="p-5 bg-[#0f0a13] space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Bu Ay Kullanım</span>
                      <span className="font-mono text-white">{fmt(spent)} / {fmt(card.limit)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                      <div className={`h-full transition-all ${utilColor}`} style={{ width: `${Math.min(100, utilization)}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Kalan limit: <strong className="text-white">{fmt(available)}</strong> ({Math.round(100 - utilization)}%)</p>
                  </div>

                  {stmt ? (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                      <Mini label="Toplam Borç" value={fmt(stmt.totalDue)} />
                      <Mini label="Asgari" value={fmt(stmt.minimumPayment)} />
                      <Mini label="Ödenen" value={fmt(stmt.paidAmount)} tone={stmt.paidAmount >= stmt.minimumPayment ? "emerald" : "red"} />
                      <Mini label="Faiz" value={fmt(stmt.interestCharged)} tone={stmt.interestCharged > 0 ? "red" : "gray"} />
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 pt-2 border-t border-white/5">
                      {periodLabel(period)} için ekstre kaydı yok.
                    </p>
                  )}

                  <button
                    onClick={() => setEditStatement({ cardId: card.id })}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/30 hover:bg-pink-500/20 text-xs font-medium"
                  >
                    <Receipt size={12} /> {stmt ? "Ekstreyi Düzenle" : "Ekstre Ekle"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onSave={addCard} />}
      {editStatement && (() => {
        const card = data.cards.find((c) => c.id === editStatement.cardId);
        const existing = data.statements.find((s) => s.cardId === editStatement.cardId && s.period === period);
        if (!card) return null;
        return <StatementModal card={card} period={period} existing={existing} onClose={() => setEditStatement(null)} onSave={saveStatement} />;
      })()}
    </>
  );
}


function Stat({ label, value, tone, hint }: { label: string; value: string; tone: "emerald" | "red" | "amber"; hint?: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/5 border-emerald-500/20",
    red:     "bg-red-500/5 border-red-500/20",
    amber:   "bg-amber-500/5 border-amber-500/20",
  };
  return (
    <div className={`p-4 rounded-2xl border ${tones[tone]}`}>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono text-white">{value}</p>
      {hint && <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "red" | "gray" }) {
  const t: Record<string, string> = {
    emerald: "text-emerald-300",
    red:     "text-red-300",
    gray:    "text-gray-300",
  };
  return (
    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
      <p className="text-[9px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-sm font-mono font-bold ${tone ? t[tone] : "text-white"}`}>{value}</p>
    </div>
  );
}


function AddCardModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Card) => void }) {
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [limit, setLimit] = useState("");
  const [statementDay, setStatementDay] = useState("1");
  const [dueDay, setDueDay] = useState("11");
  const [interestRate, setInterestRate] = useState("4.42");
  const [color, setColor] = useState("from-pink-600 to-rose-700");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lim = parseFloat(limit);
    if (!lim || lim <= 0) return;
    onSave({
      id: uid("card"),
      name: name.trim(),
      last4: last4.replace(/\D/g, "").slice(0, 4),
      limit: lim,
      statementDay: parseInt(statementDay, 10),
      dueDay: parseInt(dueDay, 10),
      interestRate: parseFloat(interestRate) || 0,
      color,
    });
  }

  const COLORS = [
    { v: "from-pink-600 to-rose-700",     name: "Pembe" },
    { v: "from-blue-600 to-indigo-700",   name: "Mavi" },
    { v: "from-emerald-600 to-teal-700",  name: "Yeşil" },
    { v: "from-orange-500 to-red-600",    name: "Turuncu" },
    { v: "from-purple-600 to-fuchsia-700",name: "Mor" },
    { v: "from-gray-700 to-gray-900",     name: "Siyah" },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-[#0f0a13] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><CreditCard size={18} className="text-pink-400" /> Yeni Kredi Kartı</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Kart Adı</label>
            <input required placeholder="Garanti Bonus" value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Son 4 Hane</label>
              <input required maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))} placeholder="1234" className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Limit (₺)</label>
              <input required type="number" min="0" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="25000" className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Kesim Günü</label>
              <input type="number" min="1" max="28" value={statementDay} onChange={(e) => setStatementDay(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Son Ödeme</label>
              <input type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Aylık Faiz %</label>
              <input type="number" step="0.01" min="0" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Renk</label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((c) => (
                <button key={c.v} type="button" onClick={() => setColor(c.v)} className={`h-10 rounded-lg bg-gradient-to-br ${c.v} ${color === c.v ? "ring-2 ring-white" : ""}`} title={c.name} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm">İptal</button>
          <button type="submit" className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"><Check size={14} /> Kaydet</button>
        </div>
      </form>
    </div>
  );
}


function StatementModal({ card, period, existing, onClose, onSave }: { card: Card; period: string; existing?: CardStatement; onClose: () => void; onSave: (s: CardStatement) => void }) {
  const [totalSpent, setTotalSpent]     = useState(existing?.totalSpent.toString() || "");
  const [minimumPayment, setMinimum]    = useState(existing?.minimumPayment.toString() || "");
  const [totalDue, setTotalDue]         = useState(existing?.totalDue.toString() || "");
  const [paidAmount, setPaid]           = useState(existing?.paidAmount.toString() || "");
  const [interestCharged, setInterest]  = useState(existing?.interestCharged.toString() || "0");
  const [paidDate, setPaidDate]         = useState(existing?.paidDate || "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: existing?.id || uid("stmt"),
      cardId: card.id,
      period,
      totalSpent:      parseFloat(totalSpent) || 0,
      minimumPayment:  parseFloat(minimumPayment) || 0,
      totalDue:        parseFloat(totalDue) || 0,
      paidAmount:      parseFloat(paidAmount) || 0,
      interestCharged: parseFloat(interestCharged) || 0,
      paidDate:        paidDate || undefined,
    });
  }

  const paid = parseFloat(paidAmount) || 0;
  const min = parseFloat(minimumPayment) || 0;
  const due = parseFloat(totalDue) || 0;
  const remaining = due - paid;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-[#0f0a13] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Receipt size={18} className="text-pink-400" /> {card.name} — {periodLabel(period)}</h2>
          <p className="text-xs text-gray-500 mt-1">**** {card.last4} ekstre kaydı</p>
        </div>
        <div className="space-y-3">
          <FieldNum label="Bu Ay Toplam Harcama" value={totalSpent} onChange={setTotalSpent} hint="Ekstrede kesilen tüm harcamalar" />
          <FieldNum label="Toplam Borç" value={totalDue} onChange={setTotalDue} hint="Devredenler dahil bakiye" />
          <FieldNum label="Asgari Ödeme Tutarı" value={minimumPayment} onChange={setMinimum} hint="Bankanın istediği minimum" />
          <FieldNum label="Ödenen Tutar" value={paidAmount} onChange={setPaid} hint="Bu hesaplama dönemi için gerçek ödediğin" />
          <FieldNum label="İşletilen Faiz" value={interestCharged} onChange={setInterest} hint="Sadece asgari ödedinse buraya banka faiz işletir" />
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1"><Calendar size={11} /> Ödeme Tarihi (opsiyonel)</label>
            <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
          </div>
        </div>

        {/* Özet & uyarı */}
        {due > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-black/30 border border-white/5 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-gray-400">Kalan borç</span><span className={`font-mono font-bold ${remaining > 0 ? "text-amber-300" : "text-emerald-300"}`}>{fmt(remaining)}</span></div>
            {paid > 0 && paid < min && (
              <p className="text-red-300 text-[11px] mt-2 inline-flex items-start gap-1"><AlertCircle size={11} className="mt-0.5" /> Asgari altında ödedin — banka faiz işletecek.</p>
            )}
            {paid >= due && (
              <p className="text-emerald-300 text-[11px] mt-2 inline-flex items-start gap-1"><Check size={11} className="mt-0.5" /> Tamamı ödendi, faiz yok.</p>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm">İptal</button>
          <button type="submit" className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"><Check size={14} /> Kaydet</button>
        </div>
      </form>
    </div>
  );
}

function FieldNum({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <input type="number" step="0.01" min="0" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm font-mono focus:border-pink-500 outline-none" />
      {hint && <p className="text-[10px] text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
