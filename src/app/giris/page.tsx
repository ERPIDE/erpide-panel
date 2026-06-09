"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, MailWarning, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { useTranslation } from "@/lib/i18n";

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { t } = useTranslation();
  const next = sp.get("next") || "/hesabim";
  const expiredApp = sp.get("expired");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResendMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shop/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
        }
        setError(data.error || t("auth.login_failed"));
        setLoading(false);
        return;
      }
      router.push(next);
    } catch (e) {
      setError(t("auth.connection_error") + String(e));
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setResendMsg({ ok: false, text: t("auth.enter_email_first") });
      return;
    }
    setResending(true);
    setResendMsg(null);
    try {
      const res = await fetch("/api/shop/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendMsg({ ok: false, text: data.error || t("auth.send_failed") });
      } else {
        setResendMsg({ ok: true, text: t("auth.verification_sent") });
      }
    } catch (e) {
      setResendMsg({ ok: false, text: t("auth.connection_error") + String(e) });
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">{t("auth.login_title")}</span></h1>
          <p className="text-gray-400 text-sm mb-8">{t("auth.login_desc")}</p>

          {expiredApp && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="font-semibold">{t("auth.license_expired_title")}</p>
              </div>
              <p className="text-amber-100/80 text-xs leading-relaxed">
                {t("auth.license_expired_desc")}
              </p>
            </div>
          )}

          <div className="p-8 rounded-2xl bg-[#111118] border border-white/5">
            <GoogleAuthButton label={t("auth.google_signin")} />
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-gray-500 uppercase tracking-wider">{t("auth.or_email")}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          <form onSubmit={handleSubmit} noValidate autoComplete="on" className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">{t("auth.email_label")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">{t("auth.password_label")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
              />
            </div>

            {error && (
              <div className={`p-3 rounded-lg border text-sm ${needsVerification ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                {needsVerification && <MailWarning size={14} className="inline mr-1.5 -mt-0.5" />}
                {error}
                {needsVerification && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-200 text-xs font-medium transition flex items-center justify-center gap-2"
                    >
                      {resending && <Loader2 size={12} className="animate-spin" />}
                      {resending ? t("auth.sending") : t("auth.resend_verification")}
                    </button>
                    {resendMsg && (
                      <p className={`mt-2 text-xs ${resendMsg.ok ? "text-green-300" : "text-red-300"}`}>{resendMsg.text}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? t("auth.logging_in") : t("auth.login_button")}
            </button>

            <div className="pt-4 border-t border-white/5 text-center text-sm space-y-2">
              <div>
                <span className="text-gray-400">{t("auth.new_user")} </span>
                <Link href={`/uye-ol?next=${encodeURIComponent(next)}`} className="text-blue-400 hover:underline">{t("auth.signup_link")}</Link>
              </div>
            </div>
          </form>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Inner />
    </Suspense>
  );
}
