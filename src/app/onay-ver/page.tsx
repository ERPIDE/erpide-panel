import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/auth/session";
import OAuthConsentForm from "@/components/OAuthConsentForm";

export default async function OnayVerPage() {
  const session = await getSession();
  const pending = session.pendingOAuth;
  if (!pending) redirect("/giris");

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Son adım</span></h1>
          <p className="text-gray-400 text-sm mb-8">
            <strong className="text-white">{pending!.email}</strong> ile devam etmek için onaylaman gereken birkaç şey var.
          </p>
          <OAuthConsentForm
            email={pending!.email}
            firstName={pending!.firstName}
            lastName={pending!.lastName}
            avatarUrl={pending!.avatarUrl}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
