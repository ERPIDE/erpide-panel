import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/user-store";
import AddressManager from "@/components/account/AddressManager";

export default async function AdresPage() {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim/adres");
  const user = await findUserById(session.userId!);
  if (!user) redirect("/giris");

  return (
    <>
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Adres Bilgileri</span></h1>
      <p className="text-gray-400 text-sm mb-8">
        Fatura ve teslimat adreslerini yönet. Bireysel (TC kimlik) veya kurumsal (VKN) olarak ekleyebilirsin.
      </p>
      <AddressManager initialAddresses={user.savedAddresses || []} />
    </>
  );
}
