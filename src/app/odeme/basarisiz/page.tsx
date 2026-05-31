"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function Inner() {
  const sp = useSearchParams();
  const reason = sp.get("reason") || "Bilinmeyen hata";

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto text-center"
        >
          <div className="inline-flex w-20 h-20 rounded-full bg-red-500/10 items-center justify-center mb-6">
            <XCircle size={48} className="text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Ödeme Tamamlanamadı</h1>
          <p className="text-gray-400 mb-2">Bir sorun oldu, ödemen alınmadı.</p>
          <p className="text-sm text-gray-500 mb-8">Sebep: {decodeURIComponent(reason)}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/fiyatlandirma"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
            >
              <ArrowLeft size={16} /> Planlara Dön
            </Link>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition"
            >
              Destek Al
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-8">
            Kart bilgilerinde yanlışlık olabilir, ya da bankan işlemi onaylamamış olabilir.
            Yardım için <a href="mailto:info@erpide.com" className="text-blue-400 hover:underline">info@erpide.com</a>
          </p>
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
