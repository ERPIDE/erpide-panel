import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import PasswordForm from "@/components/account/PasswordForm";

export default async function SifrePage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim/sifre");

  return (
    <>
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Şifre Değiştir</span></h1>
      <p className="text-gray-400 text-sm mb-8">Güvenliğin için periyodik olarak şifreni güncellemen önerilir.</p>
      <PasswordForm />
    </>
  );
}
