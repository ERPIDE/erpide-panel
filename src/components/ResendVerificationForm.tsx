"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ResendVerificationForm({ defaultEmail }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/shop/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Gönderilemedi" });
      } else {
        setMsg({ ok: true, text: "E-postanı kontrol et — doğrulama bağlantısı gönderildi." });
      }
    } catch (e) {
      setMsg({ ok: false, text: "Bağlantı hatası: " + String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handle} className="mb-4 text-left">
      <label className="block text-xs text-gray-400 mb-1.5">E-mail</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition mb-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-50 transition text-sm font-medium flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Gönderiliyor..." : "Tekrar Doğrulama Maili Gönder"}
      </button>
      {msg && (
        <div className={`mt-3 p-2.5 rounded-lg text-xs ${msg.ok ? "bg-green-500/10 border border-green-500/20 text-green-300" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
          {msg.text}
        </div>
      )}
    </form>
  );
}
