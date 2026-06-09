"use client";
import { Fragment, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { useTranslation } from "@/lib/i18n";

/** Helper: i18n string'i içindeki {key} placeholder'larını ReactNode'larla
 * değiştirip JSX array döner. Consent checkbox'larındaki linkler gibi
 * rich-text interpolation için. */
function renderWithSlots(text: string, slots: Record<string, React.ReactNode>): React.ReactNode[] {
  const keys = Object.keys(slots);
  if (!keys.length) return [text];
  const re = new RegExp(`\\{(${keys.join("|")})\\}`, "g");
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<Fragment key={`${m.index}-${m[1]}`}>{slots[m[1]]}</Fragment>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Inner() {
  const sp = useSearchParams();
  const { t } = useTranslation();
  const next = sp.get("next") || "/hesabim";
  const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", passwordConfirm: "" });
  const [consents, setConsents] = useState({ terms: false, kvkk: false, marketing: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ email: string; skipped: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    if (form.password !== form.passwordConfirm) {
      setError(t("auth.passwords_mismatch"));
      return;
    }
    if (!consents.terms) {
      setError(t("auth.terms_required"));
      return;
    }
    if (!consents.kvkk) {
      setError(t("auth.kvkk_required"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/shop/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          surname: form.surname,
          email: form.email,
          password: form.password,
          acceptTerms: consents.terms,
          acceptKvkk: consents.kvkk,
          marketingConsent: consents.marketing,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("auth.signup_failed"));
        setLoading(false);
        return;
      }
      setSuccess({ email: data.email || form.email, skipped: data.emailSendSkipped === true });
      setLoading(false);
    } catch (e) {
      setError(t("auth.connection_error") + String(e));
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-20 px-6 min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center p-8 rounded-2xl bg-[#111118] border border-emerald-500/20">
            {success.skipped ? (
              <>
                <CheckCircle2 size={56} className="mx-auto mb-4 text-amber-400" />
                <h1 className="text-2xl font-bold text-white mb-2">{t("auth.account_created")}</h1>
                <p className="text-sm text-gray-400 mb-6">
                  {renderWithSlots(t("auth.email_unsent_desc"), {
                    email: <strong className="text-white">{success.email}</strong>,
                    contact_link: <Link href="/iletisim" className="text-blue-400 hover:underline">{t("auth.email_unsent_contact_link")}</Link>,
                  })}
                </p>
              </>
            ) : (
              <>
                <Mail size={56} className="mx-auto mb-4 text-emerald-400" />
                <h1 className="text-2xl font-bold text-white mb-2">{t("auth.check_email_title")}</h1>
                <p className="text-sm text-gray-300 mb-2">
                  {renderWithSlots(t("auth.check_email_desc"), {
                    email: <strong className="text-white">{success.email}</strong>,
                  })}
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  {t("auth.spam_check")}
                </p>
              </>
            )}
            <Link href={`/giris?next=${encodeURIComponent(next)}`} className="inline-block px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition text-sm">
              {t("auth.go_to_signin")}
            </Link>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">{t("auth.signup_title")}</span></h1>
          <p className="text-gray-400 text-sm mb-8">{t("auth.signup_desc")}</p>

          <div className="p-8 rounded-2xl bg-[#111118] border border-white/5">
            <GoogleAuthButton label={t("auth.google_continue")} />
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-gray-500 uppercase tracking-wider">{t("auth.or_email")}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          <form onSubmit={handleSubmit} noValidate autoComplete="on" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("auth.name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required autoComplete="given-name" />
              <Field label={t("auth.surname")} value={form.surname} onChange={(v) => setForm({ ...form, surname: v })} required autoComplete="family-name" />
            </div>
            <Field label={t("auth.email_label")} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required autoComplete="email" />
            <Field label={t("auth.password_field")} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required autoComplete="new-password" />
            <Field label={t("auth.password_confirm")} type="password" value={form.passwordConfirm} onChange={(v) => setForm({ ...form, passwordConfirm: v })} required autoComplete="new-password" />

            <div className="space-y-2.5 pt-2 border-t border-white/5">
              <ConsentCheckbox
                checked={consents.terms}
                onChange={(v) => setConsents({ ...consents, terms: v })}
                required
              >
                {renderWithSlots(t("auth.consent_terms"), {
                  terms: <Link href="/sozlesmeler/kullanim-kosullari" target="_blank" className="text-blue-400 hover:underline">{t("auth.consent_terms_link")}</Link>,
                  privacy: <Link href="/sozlesmeler/gizlilik-politikasi" target="_blank" className="text-blue-400 hover:underline">{t("auth.consent_privacy_link")}</Link>,
                })}
              </ConsentCheckbox>
              <ConsentCheckbox
                checked={consents.kvkk}
                onChange={(v) => setConsents({ ...consents, kvkk: v })}
                required
              >
                {renderWithSlots(t("auth.consent_kvkk"), {
                  kvkk: <Link href="/sozlesmeler/kvkk" target="_blank" className="text-blue-400 hover:underline">{t("auth.consent_kvkk_link")}</Link>,
                })}
              </ConsentCheckbox>
              <ConsentCheckbox
                checked={consents.marketing}
                onChange={(v) => setConsents({ ...consents, marketing: v })}
              >
                {t("auth.consent_marketing")}
              </ConsentCheckbox>
            </div>

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? t("auth.creating_account") : t("auth.signup_button")}
            </button>

            <div className="pt-4 border-t border-white/5 text-center text-sm">
              <span className="text-gray-400">{t("auth.have_account")} </span>
              <Link href={`/giris?next=${encodeURIComponent(next)}`} className="text-blue-400 hover:underline">{t("auth.signin_link")}</Link>
            </div>
          </form>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, value, onChange, type = "text", required = false, autoComplete }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; autoComplete?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
      />
    </div>
  );
}

function ConsentCheckbox({ checked, onChange, required, children }: { checked: boolean; onChange: (v: boolean) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500 cursor-pointer flex-shrink-0"
      />
      <span className="text-xs text-gray-300 leading-relaxed group-hover:text-white transition">
        {required && <span className="text-red-400 mr-1">*</span>}
        {children}
      </span>
    </label>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Inner />
    </Suspense>
  );
}
