"use client";
import { useState } from "react";
import { Loader2, Check, MailCheck, MailWarning } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Initial {
  name: string;
  surname: string;
  email: string;
  emailVerified: boolean;
  gsmNumber: string;
  identityNumber: string;
  companyName: string;
  taxNumber: string;
}

export default function ProfileForm({ initial }: { initial: Initial }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: initial.name,
    surname: initial.surname,
    gsmNumber: initial.gsmNumber,
    identityNumber: initial.identityNumber,
    companyName: initial.companyName,
    taxNumber: initial.taxNumber,
  });
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
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || t("profile.update_failed") });
      } else {
        setMsg({ ok: true, text: t("profile.profile_updated") });
      }
    } catch (e) {
      setMsg({ ok: false, text: t("auth.connection_error") + String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="p-6 rounded-2xl bg-[#111118] border border-white/5">
        <h2 className="font-semibold text-white mb-4">{t("profile.personal_info")}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t("auth.name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label={t("auth.surname")} value={form.surname} onChange={(v) => setForm({ ...form, surname: v })} required />
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-400 mb-1.5">{t("auth.email_label")}</label>
            <div className="flex items-center gap-2">
              <input value={initial.email} disabled className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm opacity-60" />
              {initial.emailVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-[11px]">
                  <MailCheck size={11} /> {t("profile.email_verified")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                  <MailWarning size={11} /> {t("profile.email_unverified")}
                </span>
              )}
            </div>
          </div>
          <Field label={t("profile.gsm_label")} value={form.gsmNumber} onChange={(v) => setForm({ ...form, gsmNumber: v })} placeholder={t("profile.gsm_placeholder")} />
          <Field label={t("profile.identity_label")} value={form.identityNumber} onChange={(v) => setForm({ ...form, identityNumber: v })} maxLength={11} />
        </div>
      </section>

      <section className="p-6 rounded-2xl bg-[#111118] border border-white/5">
        <h2 className="font-semibold text-white mb-1">{t("profile.company_info")}</h2>
        <p className="text-xs text-gray-500 mb-4">{t("profile.company_info_desc")}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t("profile.company_name_label")} value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
          <Field label={t("profile.tax_number_label")} value={form.taxNumber} onChange={(v) => setForm({ ...form, taxNumber: v })} maxLength={10} />
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
          {loading ? t("profile.saving") : t("profile.save_button")}
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, required, placeholder, maxLength }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; maxLength?: number }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
      />
    </div>
  );
}
