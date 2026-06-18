"use client";
import { useState, useEffect, useCallback } from "react";
import { Database, Plus, Power, Copy, Check, RefreshCw, X } from "lucide-react";

interface License {
  key: string;
  customer: string;
  productId: string;
  expiresAt: string | null;
  active: boolean;
  note: string | null;
  activeFingerprint: string | null;
  firstSeenAt: string | null;
  lastValidatedAt: string | null;
  lastClientVersion: string | null;
  lastSeenIp: string | null;
  createdAt: string;
  createdBy: string | null;
}

export default function DataEngineAdminPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch("/api/dataengine/license/admin/list", { cache: "no-store" });
      if (!r.ok) throw new Error((await r.json()).error || r.statusText);
      const data = await r.json();
      setLicenses(data.licenses || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);  // 15 sn'de bir refresh
    return () => clearInterval(t);
  }, [load]);

  async function toggle(key: string, active: boolean) {
    if (!confirm(active ? `${key} tekrar aktive edilecek. Devam edilsin mi?` : `${key} ASKIYA ALINACAK — müşteri exe'si bir sonraki validate'de duracak. Devam?`)) return;
    const r = await fetch("/api/dataengine/license/admin/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, active }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert("Hata: " + (e.error || r.statusText));
      return;
    }
    load();
  }

  function copy(s: string) {
    navigator.clipboard.writeText(s);
    setCopied(s);
    setTimeout(() => setCopied(null), 1500);
  }

  const active = licenses.filter((l) => l.active).length;
  const recentlySeen = licenses.filter((l) => {
    if (!l.lastValidatedAt) return false;
    return Date.now() - new Date(l.lastValidatedAt).getTime() < 24 * 3600 * 1000;
  }).length;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database size={24} className="text-blue-400" /> Data Engine Lisansları
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Müşteri sunucularında çalışan dataengine.exe'ler buradan kontrol edilir.
            Askıya alınan bir lisans bir sonraki phone-home'da çalışmayı durdurur.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            title="Yenile"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => { setShowCreate(true); setCreatedKey(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
          >
            <Plus size={16} /> Yeni Lisans
          </button>
        </div>
      </header>

      {err && <div className="rounded-xl p-3 bg-pink-500/10 text-pink-400 text-sm">{err}</div>}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Toplam Lisans" value={licenses.length} />
        <StatCard label="Aktif" value={active} tone="ok" />
        <StatCard label="Son 24 saatte görülen" value={recentlySeen} tone="info" />
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0d0d14] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-normal">Key</th>
              <th className="px-4 py-3 text-left font-normal">Müşteri</th>
              <th className="px-4 py-3 text-left font-normal">Bitiş</th>
              <th className="px-4 py-3 text-left font-normal">Durum</th>
              <th className="px-4 py-3 text-left font-normal">Son Görüldü</th>
              <th className="px-4 py-3 text-left font-normal">Versiyon · IP</th>
              <th className="px-4 py-3 text-right font-normal">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Yükleniyor…</td></tr>
            ) : licenses.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Lisans yok</td></tr>
            ) : licenses.map((l) => {
              const exp = l.expiresAt ? new Date(l.expiresAt) : null;
              const expired = exp ? exp < new Date() : false;
              const lastSeen = l.lastValidatedAt ? new Date(l.lastValidatedAt) : null;
              const lastSeenAgo = lastSeen ? humanAgo(lastSeen) : "—";
              return (
                <tr key={l.key} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copy(l.key)}
                      className="font-mono text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      title="Kopyala"
                    >
                      {l.key}
                      {copied === l.key ? <Check size={12} /> : <Copy size={12} className="opacity-50" />}
                    </button>
                    {l.note && <div className="text-[10px] text-gray-500 mt-1 max-w-xs truncate">{l.note}</div>}
                  </td>
                  <td className="px-4 py-3 text-white">{l.customer}</td>
                  <td className="px-4 py-3 text-xs">
                    {exp ? (
                      <span className={expired ? "text-pink-400" : "text-gray-300"}>
                        {exp.toLocaleDateString("tr-TR")}
                        {expired && <div className="text-[10px] text-pink-400">SÜRESI DOLDU</div>}
                      </span>
                    ) : (
                      <span className="text-gray-500">Süresiz</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {l.active ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Aktif</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400">Askıda</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{lastSeenAgo}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>{l.lastClientVersion || "—"}</div>
                    <div className="font-mono text-[10px]">{l.lastSeenIp || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(l.key, !l.active)}
                      className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition ${l.active
                        ? "text-pink-400 hover:bg-pink-500/10"
                        : "text-green-400 hover:bg-green-500/10"
                      }`}
                    >
                      <Power size={12} />
                      {l.active ? "Askıya Al" : "Aktive Et"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(key) => { setCreatedKey(key); load(); }}
          createdKey={createdKey}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "ok" | "info" }) {
  const color = tone === "ok" ? "text-green-400" : tone === "info" ? "text-blue-400" : "text-white";
  return (
    <div className="rounded-xl p-4 border border-white/5 bg-[#0d0d14]">
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function humanAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} sn önce`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} gün önce`;
  return d.toLocaleDateString("tr-TR");
}

function CreateModal({
  onClose,
  onCreated,
  createdKey,
}: {
  onClose: () => void;
  onCreated: (key: string) => void;
  createdKey: string | null;
}) {
  const [customer, setCustomer] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [durationDays, setDurationDays] = useState<number | "">(365);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = { customer };
      if (customerCode.trim()) body.customerCode = customerCode.trim();
      if (durationDays) body.durationDays = Number(durationDays);
      if (note.trim()) body.note = note.trim();
      const r = await fetch("/api/dataengine/license/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      onCreated(j.license.key);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  function copyKey() {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-2xl border border-white/10 bg-[#0d0d14] w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{createdKey ? "Lisans Oluşturuldu" : "Yeni Lisans"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        {createdKey ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              Yeni lisans key — müşterinin <code className="text-blue-400">.env</code> dosyasındaki <code className="text-blue-400">LICENSE_KEY=</code> satırına yaz:
            </div>
            <div className="rounded-lg bg-black/50 p-4 font-mono text-sm text-white text-center break-all">
              {createdKey}
            </div>
            <button
              onClick={copyKey}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center justify-center gap-2"
            >
              {copied ? <><Check size={14} /> Kopyalandı</> : <><Copy size={14} /> Kopyala</>}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field label="Müşteri Adı *">
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="ATM Construction Kazakhstan"
              />
            </Field>
            <Field label="Müşteri Kodu (4 char, opsiyonel)">
              <input
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value.toUpperCase().slice(0, 4))}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white"
                placeholder="ATMC"
              />
              <div className="text-[10px] text-gray-500 mt-1">Verilirse key'in 2. segmenti bu olur (örn DE-<b>ATMC</b>-XXXX-...)</div>
            </Field>
            <Field label="Süre (gün)">
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="365 (boş = süresiz)"
              />
            </Field>
            <Field label="Not (opsiyonel)">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="ATM Win Server 192.168.60.42"
              />
            </Field>

            {err && <div className="text-xs text-pink-400 bg-pink-500/10 rounded-lg px-3 py-2">{err}</div>}

            <button
              type="submit"
              disabled={busy || !customer.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
            >
              {busy ? "Oluşturuluyor…" : "Lisansı Oluştur"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
