"use client";

/**
 * Client-side verify driver.
 *
 * Why client + POST instead of SSR + auto-consume:
 *  Gmail/Outlook/Microsoft Defender/spam scanners prefetch every link in a
 *  message to render previews and screen for phishing. If the verify endpoint
 *  consumes the token on GET, the scanner burns it before the real user
 *  clicks — and the real user then sees "invalid/used link".
 *
 *  The scanners do NOT execute JavaScript. By rendering an inert page on the
 *  server and POSTing the token from useEffect, only a real browser triggers
 *  the consume call. Mail scanners see the placeholder UI and move on.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, MailWarning, Loader2 } from "lucide-react";
import ResendVerificationForm from "@/components/ResendVerificationForm";

type State =
  | { kind: "verifying" }
  | { kind: "ok" }
  | { kind: "already" }
  | { kind: "missing" }
  | { kind: "invalid" }
  | { kind: "expired"; email?: string }
  | { kind: "error"; message: string };

interface Props {
  token: string;
  t: Record<string, string>;
}

export default function VerifyClient({ token, t }: Props) {
  const [state, setState] = useState<State>(() =>
    token ? { kind: "verifying" } : { kind: "missing" }
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && data.ok) {
          setState({ kind: data.alreadyVerified ? "already" : "ok" });
        } else if (res.status === 410) {
          setState({ kind: "expired", email: data.expiredUserEmail });
        } else if (res.status === 404 || res.status === 400) {
          setState({ kind: "invalid" });
        } else {
          setState({ kind: "error", message: String(data.error || "Doğrulama başarısız") });
        }
      } catch (e) {
        if (cancelled) return;
        setState({ kind: "error", message: String(e) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Success → 1.5 sn sonra /hesabim'e otomatik yönlendir
  useEffect(() => {
    if (state.kind === "ok" || state.kind === "already") {
      const tm = setTimeout(() => {
        window.location.href = "/hesabim";
      }, 1500);
      return () => clearTimeout(tm);
    }
  }, [state.kind]);

  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-[#111118] border border-white/5 text-center">
      {state.kind === "verifying" && <Verifying t={t} />}
      {state.kind === "ok" && <Success t={t} />}
      {state.kind === "already" && <Already t={t} />}
      {state.kind === "missing" && (
        <Invalid
          t={t}
          icon="x"
          title={t["verify.invalid_link_title"]}
          desc={t["verify.invalid_link_desc"]}
        />
      )}
      {state.kind === "invalid" && (
        <Invalid
          t={t}
          icon="warn"
          title={t["verify.used_link_title"]}
          desc={t["verify.used_link_desc"]}
          showResend
          showLogin
        />
      )}
      {state.kind === "expired" && (
        <Invalid
          t={t}
          icon="warn"
          title={t["verify.expired_link_title"]}
          desc={t["verify.expired_link_desc"]}
          showResend
          defaultEmail={state.email}
        />
      )}
      {state.kind === "error" && (
        <Invalid
          t={t}
          icon="x"
          title={t["verify.error_title"] || "Bir sorun oluştu"}
          desc={`${t["verify.error_desc"] || "Lütfen birkaç dakika sonra tekrar deneyin."} (${state.message})`}
          showResend
          showLogin
        />
      )}
    </div>
  );
}

function Verifying({ t }: { t: Record<string, string> }) {
  return (
    <>
      <Loader2 size={56} className="mx-auto mb-4 text-blue-400 animate-spin" />
      <h1 className="text-2xl font-bold text-white mb-2">
        {t["verify.verifying_title"] || "E-postan doğrulanıyor…"}
      </h1>
      <p className="text-sm text-gray-400">
        {t["verify.verifying_desc"] || "Birkaç saniye sürebilir, lütfen sayfayı kapatma."}
      </p>
    </>
  );
}

function Success({ t }: { t: Record<string, string> }) {
  return (
    <>
      <CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" />
      <h1 className="text-2xl font-bold text-white mb-2">{t["verify.success_title"]}</h1>
      <p className="text-sm text-gray-400 mb-6">{t["verify.success_desc"]}</p>
      <Link
        href="/hesabim"
        className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
      >
        {t["verify.go_to_account"]}
      </Link>
      <p className="text-xs text-gray-500 mt-4">{t["verify.redirecting"] || "Otomatik olarak yönlendiriliyorsun…"}</p>
    </>
  );
}

function Already({ t }: { t: Record<string, string> }) {
  return (
    <>
      <CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" />
      <h1 className="text-2xl font-bold text-white mb-2">{t["verify.already_title"]}</h1>
      <p className="text-sm text-gray-400 mb-6">{t["verify.already_desc"]}</p>
      <Link
        href="/hesabim"
        className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
      >
        {t["verify.go_to_account"]}
      </Link>
      <p className="text-xs text-gray-500 mt-4">{t["verify.redirecting"] || "Otomatik olarak yönlendiriliyorsun…"}</p>
    </>
  );
}

function Invalid({
  t,
  icon,
  title,
  desc,
  showResend,
  showLogin,
  defaultEmail,
}: {
  t: Record<string, string>;
  icon: "x" | "warn";
  title: string;
  desc: string;
  showResend?: boolean;
  showLogin?: boolean;
  defaultEmail?: string;
}) {
  return (
    <>
      {icon === "warn" ? (
        <MailWarning size={56} className="mx-auto mb-4 text-amber-400" />
      ) : (
        <XCircle size={56} className="mx-auto mb-4 text-red-400" />
      )}
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-gray-400 mb-6">{desc}</p>
      {showLogin && (
        <Link
          href="/giris"
          className="block w-full px-6 py-3 mb-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition text-center"
        >
          {t["auth.login_button"]}
        </Link>
      )}
      {showResend && <ResendVerificationForm defaultEmail={defaultEmail} />}
      {!showLogin && (
        <Link href="/giris" className="text-sm text-blue-400 hover:underline">
          {t["verify.back_to_signin"]}
        </Link>
      )}
    </>
  );
}
