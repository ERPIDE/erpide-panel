import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountSidebar from "@/components/AccountSidebar";
import { requireUser } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/user-store";

export const dynamic = "force-dynamic";

export default async function HesabimLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  if (!session) redirect("/giris?next=/hesabim");
  const user = await findUserById(session.userId!);
  const displayName = user ? `${user.name} ${user.surname}` : session.email || "Hesabım";

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[260px_1fr] gap-6">
          <AccountSidebar userName={displayName} />
          <div className="min-w-0">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
