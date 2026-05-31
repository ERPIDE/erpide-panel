"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Mail, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPlan } from "@/lib/payments/plans";

function Inner() {
  const sp = useSearchParams();
  const licenseKey = sp.get("license") || "";
  const planId = sp.get("plan") || "";
  const plan = planId ? getPlan(planId) : undefined;
  const [copied, setCopied] = useState(false);

  const portalUrl =
    plan?.productId === "finanserpide"
      ? "https://finans.erpide.com/lisans"
      : "https://captcha.erpide.com/login";

  function copy() {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex w-20 h-20 rounded-full bg-green-500/10 items-center justify-center mb-6">
            <CheckCircle2 size={48} className="text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Ödeme Başarılı!</h1>
          <p className="text-gray-400 mb-8">
            {plan ? `${plan.productName} ${plan.name} aboneliğin aktif edildi.` : "Aboneliğin aktif."}
            {" "}Lisans anahtarın aşağıda ve e-mail ile de gönderildi.
          </p>

          {licenseKey && (
            <div className="p-6 rounded-2xl bg-[#111118] border-2 border-dashed border-blue-500/40 mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Lisans Anahtarın</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-lg md:text-xl font-mono text-blue-400 break-all">{licenseKey}</code>
                <button
                  onClick={copy}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                  title="Kopyala"
                >
                  <Copy size={16} />
                </button>
              </div>
              {copied && <p className="text-xs text-green-400 mt-2">Kopyalandı!</p>}
            </div>
          )}

          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 mb-8 text-left">
            <p className="text-sm text-blue-300 flex items-start gap-2">
              <Mail size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                Lisans anahtarın ve fatura bilgilerin <strong>e-mail kutuna</strong> gönderildi.
                Spam klasörüne de bakmayı unutma.
              </span>
            </p>
          </div>

          <Link
            href={portalUrl}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
          >
            Ürüne Git ve Lisansı Aktive Et <ArrowRight size={16} />
          </Link>

          <p className="text-xs text-gray-500 mt-8">
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
