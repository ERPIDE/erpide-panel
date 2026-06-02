"use client";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";

interface Initial { address: string; district: string; city: string; postalCode: string }

export default function AddressForm({ initial }: { initial: Initial }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/shop/account/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setMsg({ ok: false, text: data.error || "Güncellenemedi" });
      else setMsg({ ok: true, text: "Adres bilgileri güncellendi." });
    } catch (e) {
      setMsg({ ok: false, text: "Bağlantı hatası: " + String(e) });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="p-6 rounded-2xl bg-[#111118] border border-white/5">
        <h2 className="font-semibold text-white mb-4">Fatura / Teslimat Adresi</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-400 mb-1.5">Açık Adres</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
              placeholder="Mahalle, sokak, bina no, daire no..."
            />
          </div>
          <Field label="İlçe" value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
          <Field label="İl" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Posta Kodu" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} maxLength={10} />
        </div>
      </section>

      {msg && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${msg.ok ? "bg-green-500/10 border border-green-500/20 text-green-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
          {msg.ok && <Check size={14} />}
          {msg.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (v: string) => void; maxLength?: number }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
      />
    </div>
  );
}
