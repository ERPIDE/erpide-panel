import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBankTransferRequest } from "@/lib/auth/user-store";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BankTransferDetails from "./BankTransferDetails";

export const dynamic = "force-dynamic";

export default async function HavaleOdemePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getSession();
  if (!session.userId) redirect(`/giris?next=/odeme/havale/${code}`);

  const req = await getBankTransferRequest(code);
  if (!req) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 px-6 min-h-screen text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Havale isteği bulunamadı</h1>
          <p className="text-gray-400 text-sm mb-6">Kod yanlış olabilir veya istek silinmiş.</p>
          <Link href="/urunler" className="text-blue-400 hover:underline">Ürünlere dön →</Link>
        </main>
        <Footer />
      </>
    );
  }
  if (req.userId !== session.userId) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 px-6 min-h-screen text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Bu istek size ait değil</h1>
          <Link href="/hesabim" className="text-blue-400 hover:underline">Hesabıma dön →</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <BankTransferDetails req={JSON.parse(JSON.stringify(req))} />
        </div>
      </main>
      <Footer />
    </>
  );
}
