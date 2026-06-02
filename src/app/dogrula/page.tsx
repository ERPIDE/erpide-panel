import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ResendVerificationForm from "@/components/ResendVerificationForm";
import { CheckCircle2, XCircle, MailWarning } from "lucide-react";
import { findUserByVerificationToken, updateUser } from "@/lib/auth/user-store";
import { isTokenExpired } from "@/lib/auth/email-verification";
import { getSession } from "@/lib/auth/session";

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
  const result = await verify(token);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#111118] border border-white/5 text-center">
          {result.kind === "ok" && <Success />}
          {result.kind === "already" && <Already />}
          {result.kind === "missing" && <Invalid title="Geçersiz bağlantı" desc="Doğrulama bağlantısı eksik. Mailindeki linke tıkladığından emin ol." />}
          {result.kind === "invalid" && <Invalid title="Bağlantı geçersiz" desc="Bu bağlantı kullanılmış veya hatalı. Yeni bir doğrulama mail'i gönderebilirsin." showResend />}
          {result.kind === "expired" && <Invalid title="Bağlantının süresi dolmuş" desc="Doğrulama bağlantısı 24 saat geçerliydi. Tekrar gönderebiliriz." showResend defaultEmail={result.email} />}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Success() {
  return (
    <>
      <CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" />
      <h1 className="text-2xl font-bold text-white mb-2">E-postan doğrulandı</h1>
      <p className="text-sm text-gray-400 mb-6">Hesabın artık aktif. ERPIDE'ye hoş geldin.</p>
      <Link href="/hesabim" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
        Hesabıma Git
      </Link>
    </>
  );
}

function Already() {
  return (
    <>
      <CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" />
      <h1 className="text-2xl font-bold text-white mb-2">Zaten doğrulanmış</h1>
      <p className="text-sm text-gray-400 mb-6">Bu hesap daha önce doğrulanmıştı. Devam edebilirsin.</p>
      <Link href="/hesabim" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition">
        Hesabıma Git
      </Link>
    </>
  );
}

function Invalid({ title, desc, showResend, defaultEmail }: { title: string; desc: string; showResend?: boolean; defaultEmail?: string }) {
  return (
    <>
      {showResend ? (
        <MailWarning size={56} className="mx-auto mb-4 text-amber-400" />
      ) : (
        <XCircle size={56} className="mx-auto mb-4 text-red-400" />
      )}
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-gray-400 mb-6">{desc}</p>
      {showResend && <ResendVerificationForm defaultEmail={defaultEmail} />}
      <Link href="/giris" className="text-sm text-blue-400 hover:underline">Giriş sayfasına dön</Link>
    </>
  );
}
