import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ResendVerificationForm from "@/components/ResendVerificationForm";
import { CheckCircle2, XCircle, MailWarning } from "lucide-react";
import { findUserByVerificationToken, updateUser } from "@/lib/auth/user-store";
import { isTokenExpired } from "@/lib/auth/email-verification";
import { getSession } from "@/lib/auth/session";
import { getServerTranslations } from "@/lib/i18n-server";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

async function verify(token: string | undefined): Promise<
  | { kind: "ok" | "already" }
  | { kind: "missing" }
  | { kind: "invalid" }
  | { kind: "expired"; email?: string }
> {
  if (!token) return { kind: "missing" };
  const user = await findUserByVerificationToken(token);
  if (!user) return { kind: "invalid" };
  if (user.emailVerified) {
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = `${user.name} ${user.surname}`;
    await session.save();
    return { kind: "already" };
  }
  if (isTokenExpired(user.verificationTokenExpiresAt)) {
    return { kind: "expired", email: user.email };
  }
  await updateUser(user.id, {
    emailVerified: true,
    verificationToken: undefined,
    verificationTokenExpiresAt: undefined,
  });
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = `${user.name} ${user.surname}`;
  await session.save();
  return { kind: "ok" };
}

export default async function DogrulaPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const [result, { t }] = await Promise.all([
    verify(token),
    getServerTranslations(),
  ]);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#111118] border border-white/5 text-center">
          {result.kind === "ok" && <Success t={t} />}
          {result.kind === "already" && <Already t={t} />}
          {result.kind === "missing" && (
            <Invalid t={t} title={t("verify.invalid_link_title")} desc={t("verify.invalid_link_desc")} />
          )}
          {result.kind === "invalid" && (
            <Invalid t={t} title={t("verify.used_link_title")} desc={t("verify.used_link_desc")} showResend showLogin />
          )}
          {result.kind === "expired" && (
            <Invalid t={t} title={t("verify.expired_link_title")} desc={t("verify.expired_link_desc")} showResend defaultEmail={result.email} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Success({ t }: { t: (k: string) => string }) {
  return (
    <>
      <CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" />
      <h1 className="text-2xl font-bold text-white mb-2">{t("verify.success_title")}</h1>
      <p className="text-sm text-gray-400 mb-6">{t("verify.success_desc")}</p>
      <Link href="/hesabim" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
        {t("verify.go_to_account")}
      </Link>
    </>
  );
}

function Already({ t }: { t: (k: string) => string }) {
  return (
    <>
      <CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" />
      <h1 className="text-2xl font-bold text-white mb-2">{t("verify.already_title")}</h1>
      <p className="text-sm text-gray-400 mb-6">{t("verify.already_desc")}</p>
      <Link href="/hesabim" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
        {t("verify.go_to_account")}
      </Link>
    </>
  );
}

function Invalid({ t, title, desc, showResend, showLogin, defaultEmail }: { t: (k: string) => string; title: string; desc: string; showResend?: boolean; showLogin?: boolean; defaultEmail?: string }) {
  return (
    <>
      {showResend ? (
        <MailWarning size={56} className="mx-auto mb-4 text-amber-400" />
      ) : (
        <XCircle size={56} className="mx-auto mb-4 text-red-400" />
      )}
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-gray-400 mb-6">{desc}</p>
      {showLogin && (
        <Link href="/giris" className="block w-full px-6 py-3 mb-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition text-center">
          {t("auth.login_button")}
        </Link>
      )}
      {showResend && <ResendVerificationForm defaultEmail={defaultEmail} />}
      {!showLogin && <Link href="/giris" className="text-sm text-blue-400 hover:underline">{t("verify.back_to_signin")}</Link>}
    </>
  );
}
