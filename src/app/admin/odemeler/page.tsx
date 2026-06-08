"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Banknote, Key, CheckCircle2, XCircle, Copy, Check, Loader2, Plus, Download, AlertCircle, Clock } from "lucide-react";

interface BankTransferReq {
  code: string;
  userId: string;
  userEmail: string;
  productId: string;
  skuIds: string[];
  skuNames?: string[];
  amountUSD: number;
  fxRate: number;
  amountTRY: number;
  ibanUsed: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  approvedBy?: string;
  approvedAt?: string;
  orderId?: string;
}

interface LicenseCode {
  code: string;
  skuId: string;
  productId: string;
  durationDays: number;
  createdAt: string;
  redeemedBy?: string;
  redeemedAt?: string;
  note?: string;
  batchId?: string;
}

export default function AdminOdemelerPage() {
  const [tab, setTab] = useState<"havale" | "epin">("havale");

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">Ödeme Yönetimi</span></h1>
        <p className="text-gray-400 text-sm">Havale onayları ve e-pin (aktivasyon kodu) havuzu.</p>
      </header>

      <div className="flex gap-2 mb-6 border-b border-white/5">
        <TabBtn active={tab === "havale"} onClick={() => setTab("havale")} icon={<Banknote size={14} />}>
          Havale Bekleyenler
        </TabBtn>
        <TabBtn active={tab === "epin"} onClick={() => setTab("epin")} icon={<Key size={14} />}>
          E-Pin Havuzu
        </TabBtn>
      </div>

      {tab === "havale" ? <BankTransferList /> : <LicenseCodePool />}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
        active ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function BankTransferList() {
  const [requests, setRequests] = useState<BankTransferReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/bank-transfers?status=${filter}`, { cache: "no-store" });
      const d = await r.json();
      setRequests(d.requests || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  async function approve(code: string) {
    if (!confirm(`${code} kodunu ONAYLA — sipariş PAID'e geçecek ve lisans aktif edilecek?`)) return;
    setBusy(code);
    try {
      const r = await fetch("/api/admin/bank-transfers/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (!r.ok) alert("Hata: " + (d.error || "Onaylanamadı"));
      else { alert("Onaylandı. Order ID: " + d.orderId); await load(); }
    } finally { setBusy(null); }
  }

  async function reject(code: string) {
    const reason = prompt("Reddetme sebebi (kullanıcıya gösterilecek):");
    if (!reason) return;
    setBusy(code);
    try {
      const r = await fetch("/api/admin/bank-transfers/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, reason }),
      });
      if (!r.ok) { const d = await r.json(); alert("Hata: " + (d.error || "Reddedilemedi")); }
      else await load();
    } finally { setBusy(null); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex gap-2 mb-4">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === s ? "bg-blue-500/20 text-blue-200 border border-blue-500/40" : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >{s === "ALL" ? "Tümü" : s === "PENDING" ? "Bekleyen" : s === "APPROVED" ? "Onaylanmış" : "Reddedilmiş"}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-blue-400" size={24} /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">Bu filtrede kayıt yok.</div>
      ) : (
        <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#0d0d14] text-xs text-gray-500 uppercase">
                <th className="text-left px-4 py-3">Kod</th>
                <th className="text-left px-4 py-3">Kullanıcı</th>
                <th className="text-left px-4 py-3">Ürün</th>
                <th className="text-right px-4 py-3">Tutar TL</th>
                <th className="text-right px-4 py-3">Tutar USD</th>
                <th className="text-left px-4 py-3">Tarih</th>
                <th className="text-right px-4 py-3">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.code} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{r.code}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{r.userEmail}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{(r.skuNames || []).join(", ")}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{r.amountTRY.toLocaleString("tr-TR")} ₺</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-gray-400">${r.amountUSD.toFixed(2)} · {r.fxRate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.createdAt).toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "PENDING" ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => approve(r.code)} disabled={busy === r.code}
                          className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30 disabled:opacity-50 inline-flex items-center gap-1">
                          {busy === r.code ? <Loader2 className="animate-spin" size={10} /> : <CheckCircle2 size={10} />} Onayla
                        </button>
                        <button onClick={() => reject(r.code)} disabled={busy === r.code}
                          className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs hover:bg-red-500/30 disabled:opacity-50 inline-flex items-center gap-1">
                          <XCircle size={10} /> Red
                        </button>
                      </div>
                    ) : (
                      <StatusBadge status={r.status} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold inline-flex items-center gap-1"><CheckCircle2 size={9} /> ONAYLI</span>;
  if (status === "REJECTED") return <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-semibold inline-flex items-center gap-1"><XCircle size={9} /> REDDEDİLDİ</span>;
  if (status === "EXPIRED") return <span className="px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/30 text-[10px] font-semibold inline-flex items-center gap-1"><Clock size={9} /> SÜRESİ DOLDU</span>;
  return <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold inline-flex items-center gap-1"><Clock size={9} /> BEKLİYOR</span>;
}

function LicenseCodePool() {
  const [codes, setCodes] = useState<LicenseCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/license-codes/list", { cache: "no-store" });
      const d = await r.json();
      setCodes(d.codes || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function exportCSV() {
    const unused = codes.filter((c) => !c.redeemedBy);
    const csv = ["code,skuId,productId,durationDays,batchId,note,createdAt"]
      .concat(unused.map((c) => [c.code, c.skuId, c.productId, c.durationDays, c.batchId || "", (c.note || "").replace(/,/g, ";"), c.createdAt].join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `e-pinler-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const total = codes.length;
  const redeemed = codes.filter((c) => c.redeemedBy).length;
  const available = total - redeemed;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Toplam" value={total} cls="text-white" />
        <Stat label="Kullanılmamış" value={available} cls="text-emerald-300" />
        <Stat label="Kullanılmış" value={redeemed} cls="text-gray-400" />
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setShowGenerate(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold flex items-center gap-2">
          <Plus size={14} /> Toplu Üret
        </button>
        <button onClick={exportCSV} disabled={available === 0} className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm hover:bg-white/10 disabled:opacity-40 flex items-center gap-2">
          <Download size={14} /> Kullanılmamışları CSV İndir ({available})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-blue-400" size={24} /></div>
      ) : codes.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">Henüz e-pin üretilmemiş.</div>
      ) : (
        <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#0d0d14] text-xs text-gray-500 uppercase">
                <th className="text-left px-4 py-3">Kod</th>
                <th className="text-left px-4 py-3">Ürün/SKU</th>
                <th className="text-right px-4 py-3">Süre</th>
                <th className="text-left px-4 py-3">Üretim</th>
                <th className="text-left px-4 py-3">Not / Batch</th>
                <th className="text-left px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {codes.slice(0, 200).map((c) => (
                <tr key={c.code} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-blue-300"><CopyableCode code={c.code} /></td>
                  <td className="px-4 py-3 text-xs text-gray-300">{c.productId} / {c.skuId}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400">{c.durationDays}g</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{c.note || c.batchId || "—"}</td>
                  <td className="px-4 py-3">
                    {c.redeemedBy ? (
                      <span className="text-[10px] text-gray-500">Kullanıldı {c.redeemedAt ? new Date(c.redeemedAt).toLocaleDateString("tr-TR") : ""}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 size={9} /> Hazır</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {codes.length > 200 && (
            <p className="text-xs text-gray-500 text-center py-3 border-t border-white/5">İlk 200 satır gösteriliyor — tamamı için CSV indir.</p>
          )}
        </div>
      )}

      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onDone={() => { setShowGenerate(false); load(); }} />}
    </motion.div>
  );
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 hover:text-blue-100 transition">
      {code} {copied ? <Check size={10} /> : <Copy size={10} className="opacity-40" />}
    </button>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="p-4 rounded-2xl bg-[#111118] border border-white/5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold font-mono ${cls}`}>{value.toLocaleString("tr-TR")}</p>
    </div>
  );
}

function GenerateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [skuId, setSkuId] = useState("");
  const [count, setCount] = useState(10);
  const [durationDays, setDurationDays] = useState(30);
  const [note, setNote] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<string[] | null>(null);
  const [error, setError] = useState("");

  async function submit() {
    if (!skuId.trim()) { setError("SKU ID gerekli"); return; }
    if (!adminToken.trim()) { setError("Admin token gerekli (ADMIN_BOOTSTRAP_TOKEN)"); return; }
    setError(""); setBusy(true);
    try {
      const r = await fetch("/api/admin/license-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken.trim() },
        body: JSON.stringify({ skuId: skuId.trim(), count, durationDays, note: note.trim() || undefined }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Üretilemedi"); return; }
      setGenerated(d.codes);
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold text-white mb-4">Toplu E-Pin Üret</h3>

        {generated ? (
          <div>
            <p className="text-sm text-emerald-300 mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} /> {generated.length} kod üretildi
            </p>
            <textarea
              readOnly
              className="w-full h-48 bg-black/50 border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-gray-300"
              value={generated.join("\n")}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => navigator.clipboard.writeText(generated.join("\n"))} className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-white text-sm hover:bg-white/10 flex items-center justify-center gap-2">
                <Copy size={14} /> Tümünü Kopyala
              </button>
              <button onClick={onDone} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold">
                Tamam
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <FormField label="SKU ID (örn: finanserpide-base-monthly)">
              <input value={skuId} onChange={(e) => setSkuId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Adet">
                <input type="number" value={count} onChange={(e) => setCount(Math.max(1, Math.min(500, +e.target.value || 1)))} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </FormField>
              <FormField label="Süre (gün)">
                <input type="number" value={durationDays} onChange={(e) => setDurationDays(Math.max(1, Math.min(3650, +e.target.value || 30)))} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </FormField>
            </div>
            <FormField label="Not (opsiyonel — örn: Hepsiburada Q3 2026)">
              <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            </FormField>
            <FormField label="ADMIN_BOOTSTRAP_TOKEN">
              <input type="password" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono" />
            </FormField>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10">İptal</button>
              <button onClick={submit} disabled={busy} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {busy ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                {busy ? "Üretiliyor..." : `${count} Adet Üret`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
