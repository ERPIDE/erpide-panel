"use client";
import { useState } from "react";
import {
  Landmark, Plus, Check, X, Percent, Calendar, AlertCircle, Banknote, TrendingDown,
} from "lucide-react";
import {
  PocketData, Loan, LoanPayment, fmt, uid, periodLabel, LOAN_TYPE_LABEL, loanRemainingPrincipal,
} from "./lib";

export default function TabKrediler({ data, period, update }: { data: PocketData; period: string; update: (d: PocketData) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editPayment, setEditPayment] = useState<{ loanId: string } | null>(null);

  function addLoan(l: Loan) {
    update({ ...data, loans: [...data.loans, l] });
    setShowAdd(false);
  }

  function delLoan(id: string) {
    if (!confirm("Bu krediyi silmek istediğinden emin misin? Ödeme kayıtları da silinir.")) return;
    update({
      ...data,
      loans: data.loans.filter((l) => l.id !== id),
      loanPayments: data.loanPayments.filter((p) => p.loanId !== id),
    });
  }

  function savePayment(p: LoanPayment) {
    const existing = data.loanPayments.find((x) => x.loanId === p.loanId && x.period === p.period);
    const next = existing
      ? data.loanPayments.map((x) => (x.id === existing.id ? { ...p, id: existing.id } : x))
      : [...data.loanPayments, p];
    update({ ...data, loanPayments: next });
    setEditPayment(null);
  }

  // Bu ay tüm krediler toplamı
  const monthPayments = data.loanPayments.filter((p) => p.period === period);
  const monthTotalPaid = monthPayments.reduce((s, p) => s + p.totalPaid, 0);
  const monthTotalInterest = monthPayments.reduce((s, p) => s + p.interestPart, 0);
  const monthTotalPrincipal = monthPayments.reduce((s, p) => s + p.principalPart, 0);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Krediler</h2>
          <p className="text-sm text-gray-400 mt-0.5">Konut, taşıt, ihtiyaç kredilerinde anapara/faiz takibi.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-semibold hover:opacity-90">
          <Plus size={14} /> Kredi Ekle
        </button>
      </div>

      {data.loans.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <Stat label="Bu Ay Toplam Ödeme" value={fmt(monthTotalPaid)} tone="red" />
          <Stat label="Anapara Kısmı" value={fmt(monthTotalPrincipal)} tone="emerald" hint="Borcu azaltan kısım" />
          <Stat label="Faiz Kısmı" value={fmt(monthTotalInterest)} tone="amber" hint="Bankaya kayıp" />
        </div>
      )}

      {data.loans.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0f0a13] border border-white/5 text-center">
          <Landmark size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Henüz aktif kredin yok.</p>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/15 text-pink-300 border border-pink-500/30 text-sm font-medium">
            <Plus size={14} /> Kredi ekle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.loans.map((loan) => {
            const paymentsForLoan = data.loanPayments.filter((p) => p.loanId === loan.id);
            const totalPaidEver = paymentsForLoan.reduce((s, p) => s + p.totalPaid, 0);
            const totalInterestEver = paymentsForLoan.reduce((s, p) => s + p.interestPart, 0);
            const totalPrincipalEver = paymentsForLoan.reduce((s, p) => s + p.principalPart, 0);
            const remaining = Math.max(0, loan.principal - totalPrincipalEver);
            const progressPct = loan.principal > 0 ? (totalPrincipalEver / loan.principal) * 100 : 0;
            const monthsPaid = paymentsForLoan.length;
            const monthsLeft = Math.max(0, loan.termMonths - monthsPaid);
            const stmt = data.loanPayments.find((p) => p.loanId === loan.id && p.period === period);

            return (
              <div key={loan.id} className="p-5 rounded-2xl bg-[#0f0a13] border border-white/5">
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center flex-shrink-0">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{loan.name}</h3>
                      <p className="text-xs text-gray-400">{loan.lender} · {LOAN_TYPE_LABEL[loan.type]}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                        <span><Calendar size={9} className="inline -mt-0.5" /> Başlangıç: {new Date(loan.startDate).toLocaleDateString("tr-TR")}</span>
                        <span><Percent size={9} className="inline -mt-0.5" /> {loan.interestRate.toFixed(2)}/ay</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => delLoan(loan.id)} className="text-gray-500 hover:text-red-400" title="Sil"><X size={16} /></button>
                </div>

                <div className="grid sm:grid-cols-4 gap-2 mb-4">
                  <Mini label="Anapara" value={fmt(loan.principal)} />
                  <Mini label="Kalan" value={fmt(remaining)} tone="amber" />
                  <Mini label="Ödenen Toplam" value={fmt(totalPaidEver)} />
                  <Mini label="Ödenen Faiz" value={fmt(totalInterestEver)} tone="red" />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Anapara İlerlemesi</span>
                    <span className="font-mono text-white">{monthsPaid} / {loan.termMonths} ay</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.min(100, progressPct)}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Aylık taksit: <strong className="text-white">{fmt(loan.monthlyPayment)}</strong> · Kalan: {monthsLeft} ay</p>
                </div>

                {stmt ? (
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5 mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{periodLabel(period)} ödemesi</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-gray-400">Anapara: </span><span className="text-emerald-300 font-mono">{fmt(stmt.principalPart)}</span></div>
                      <div><span className="text-gray-400">Faiz: </span><span className="text-amber-300 font-mono">{fmt(stmt.interestPart)}</span></div>
                      <div><span className="text-gray-400">Toplam: </span><span className="text-white font-mono font-bold">{fmt(stmt.totalPaid)}</span></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 mb-3">{periodLabel(period)} için ödeme kaydedilmedi.</p>
                )}

                <button
                  onClick={() => setEditPayment({ loanId: loan.id })}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/30 hover:bg-pink-500/20 text-xs font-medium"
                >
                  <Banknote size={12} /> {stmt ? "Ödemeyi Düzenle" : "Aylık Ödeme Gir"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddLoanModal onClose={() => setShowAdd(false)} onSave={addLoan} />}
      {editPayment && (() => {
        const loan = data.loans.find((l) => l.id === editPayment.loanId);
        const existing = data.loanPayments.find((p) => p.loanId === editPayment.loanId && p.period === period);
        if (!loan) return null;
        const remaining = loanRemainingPrincipal(loan, period, data.loanPayments);
        return <LoanPaymentModal loan={loan} period={period} existing={existing} remainingPrincipal={remaining} onClose={() => setEditPayment(null)} onSave={savePayment} />;
      })()}
    </>
  );
}


function Stat({ label, value, tone, hint }: { label: string; value: string; tone: "red" | "emerald" | "amber"; hint?: string }) {
  const tones: Record<string, string> = {
    red:     "bg-red-500/5 border-red-500/20",
    emerald: "bg-emerald-500/5 border-emerald-500/20",
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

function Mini({ label, value, tone }: { label: string; value: string; tone?: "amber" | "red" }) {
  const t: Record<string, string> = { amber: "text-amber-300", red: "text-red-300" };
  return (
    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
      <p className="text-[9px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-sm font-mono font-bold ${tone ? t[tone] : "text-white"}`}>{value}</p>
    </div>
  );
}


function AddLoanModal({ onClose, onSave }: { onClose: () => void; onSave: (l: Loan) => void }) {
  const [name, setName] = useState("");
  const [lender, setLender] = useState("");
  const [type, setType] = useState<Loan["type"]>("ihtiyac");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setRate] = useState("3.5");
  const [monthlyPayment, setMonthly] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [termMonths, setTerm] = useState("36");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(principal);
    const m = parseFloat(monthlyPayment);
    if (!p || !m) return;
    onSave({
      id: uid("loan"),
      name: name.trim(), lender: lender.trim(), type,
      principal: p,
      interestRate: parseFloat(interestRate) || 0,
      monthlyPayment: m,
      startDate,
      termMonths: parseInt(termMonths, 10) || 1,
    });
  }

  // Otomatik taksit hesabı (basit annüite)
  function suggestMonthly() {
    const p = parseFloat(principal) || 0;
    const r = (parseFloat(interestRate) || 0) / 100;
    const n = parseInt(termMonths, 10) || 0;
    if (p <= 0 || r <= 0 || n <= 0) return;
    const payment = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    setMonthly(payment.toFixed(2));
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-[#0f0a13] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Landmark size={18} className="text-pink-400" /> Yeni Kredi</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Kredi Adı</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Konut Kredisi #1" className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Banka</label>
              <input required value={lender} onChange={(e) => setLender(e.target.value)} placeholder="Garanti BBVA" className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Tür</label>
              <select value={type} onChange={(e) => setType(e.target.value as Loan["type"])} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm">
                {Object.entries(LOAN_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Çekilen Anapara (₺)</label>
              <input required type="number" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="500000" className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Aylık Faiz %</label>
              <input type="number" step="0.01" min="0" value={interestRate} onChange={(e) => setRate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Vade (Ay)</label>
              <input type="number" min="1" value={termMonths} onChange={(e) => setTerm(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Aylık Taksit (₺)</label>
              <div className="flex gap-1">
                <input required type="number" min="0" value={monthlyPayment} onChange={(e) => setMonthly(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm font-mono" />
                <button type="button" onClick={suggestMonthly} title="Anapara/faiz/vade'den hesapla" className="px-2 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/30 text-[10px]">Hesapla</button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Başlangıç Tarihi</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
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


function LoanPaymentModal({ loan, period, existing, remainingPrincipal, onClose, onSave }: { loan: Loan; period: string; existing?: LoanPayment; remainingPrincipal: number; onClose: () => void; onSave: (p: LoanPayment) => void }) {
  // Otomatik öneri: aylık faiz x kalan anapara
  const suggestedInterest = remainingPrincipal * (loan.interestRate / 100);
  const suggestedPrincipal = loan.monthlyPayment - suggestedInterest;

  const [principalPart, setPP] = useState(existing?.principalPart.toString() || suggestedPrincipal.toFixed(2));
  const [interestPart, setIP]  = useState(existing?.interestPart.toString() || suggestedInterest.toFixed(2));
  const [paidDate, setPaidDate] = useState(existing?.paidDate || `${period}-01`);

  const totalPaid = (parseFloat(principalPart) || 0) + (parseFloat(interestPart) || 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: existing?.id || uid("lpay"),
      loanId: loan.id, period,
      principalPart: parseFloat(principalPart) || 0,
      interestPart: parseFloat(interestPart) || 0,
      totalPaid,
      paidDate,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-[#0f0a13] border border-white/10 rounded-2xl p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Banknote size={18} className="text-pink-400" /> {loan.name} — {periodLabel(period)}</h2>
          <p className="text-xs text-gray-500 mt-1">Kalan anapara: <strong className="text-white">{fmt(remainingPrincipal)}</strong></p>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-200 mb-3 flex items-start gap-2">
          <TrendingDown size={12} className="mt-0.5 flex-shrink-0" />
          Önerilen: Bu ay faiz <strong>{fmt(suggestedInterest)}</strong>, anapara <strong>{fmt(suggestedPrincipal)}</strong>. Banka kağıdından farklıysa düzelt.
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Anapara Kısmı (₺)</label>
            <input required type="number" step="0.01" min="0" value={principalPart} onChange={(e) => setPP(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Faiz Kısmı (₺)</label>
            <input required type="number" step="0.01" min="0" value={interestPart} onChange={(e) => setIP(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Ödeme Tarihi</label>
            <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
          </div>
          <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs">
            <div className="flex justify-between"><span className="text-gray-400">Toplam Ödeme</span><span className="font-mono font-bold text-white">{fmt(totalPaid)}</span></div>
            {Math.abs(totalPaid - loan.monthlyPayment) > 0.01 && (
              <p className="text-amber-300 text-[10px] mt-1.5 inline-flex items-start gap-1"><AlertCircle size={10} className="mt-0.5" /> Beklenen taksit: {fmt(loan.monthlyPayment)}</p>
            )}
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
