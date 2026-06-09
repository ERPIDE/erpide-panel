"use client";
import { useState } from "react";
import { Loader2, Check, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function PasswordForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (form.newPassword !== form.newPasswordConfirm) {
      setMsg({ ok: false, text: t("password.new_mismatch") });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/shop/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) setMsg({ ok: false, text: data.error || t("password.change_failed") });
      else {
        setMsg({ ok: true, text: t("password.changed") });
        setForm({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
      }
    } catch (e) {
      setMsg({ ok: false, text: t("auth.connection_error") + String(e) });
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <section className="p-6 rounded-2xl bg-[#111118] border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck size={14} className="text-emerald-400" /> {t("password.requirements")}
        </div>
        <Field label={t("password.current_label")} type="password" value={form.currentPassword} onChange={(v) => setForm({ ...form, currentPassword: v })} autoComplete="current-password" />
        <Field label={t("password.new_label")} type="password" value={form.newPassword} onChange={(v) => setForm({ ...form, newPassword: v })} autoComplete="new-password" />
        <Field label={t("password.new_confirm_label")} type="password" value={form.newPasswordConfirm} onChange={(v) => setForm({ ...form, newPasswordConfirm: v })} autoComplete="new-password" />
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
          {loading ? t("password.updating") : t("password.update_button")}
        </button>
      </div>
    </form>
  );
}

function Field({ label, type, value, onChange, autoComplete }: { label: string; type: string; value: string; onChange: (v: string) => void; autoComplete?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
      />
    </div>
  );
}
