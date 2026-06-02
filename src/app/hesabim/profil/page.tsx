import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/user-store";
import ProfileForm from "@/components/account/ProfileForm";

export default async function ProfilePage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim/profil");
  const user = await findUserById(session.userId!);
  if (!user) redirect("/giris");

  return (
    <>
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Profil Bilgileri</span></h1>
      <p className="text-gray-400 text-sm mb-8">Hesabınla ilgili kişisel ve iletişim bilgilerini güncelle.</p>
      <ProfileForm
        initial={{
          name: user.name,
          surname: user.surname,
          email: user.email,
          emailVerified: !!user.emailVerified,
          gsmNumber: user.gsmNumber || "",
          identityNumber: user.identityNumber || "",
          companyName: user.companyName || "",
          taxNumber: user.taxNumber || "",
        }}
      />
    </>
  );
}
