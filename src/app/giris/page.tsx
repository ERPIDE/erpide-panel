"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, MailWarning, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleAuthButton from "@/components/GoogleAuthButton";

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/hesabim";
  const expiredApp = sp.get("expired"); // "finanserpide" | "captchaerpide" | "1"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResendMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shop/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
        }
        setError(data.error || "Giriş başarısız");
        setLoading(false);
        return;
      }
      router.push(next);
    } catch (e) {
      setError("Bağlantı hatası: " + String(e));
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setResendMsg({ ok: false, text: "Önce e-mail adresini gir" });
      return;
    }
    setResending(true);
    setResendMsg(null);
    try {
      const res = await fetch("/api/shop/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendMsg({ ok: false, text: data.error || "Gönderilemedi" });
      } else {
        setResendMsg({ ok: true, text: "Doğrulama bağlantısı gönderildi. Mailini kontrol et." });
      }
    } catch (e) {
      setResendMsg({ ok: false, text: "Bağlantı hatası: " + String(e) });
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Giriş Yap</span></h1>
          <p className="text-gray-400 text-sm mb-8">ERPIDE hesabınla devam et.</p>

          {expiredApp && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="font-semibold">Lisansınızın süresi doldu</p>
              </div>
              <p className="text-amber-100/80 text-xs leading-relaxed">
                Giriş yaptıktan sonra <strong>Hesabım → Lisanslarım</strong> sayfasından <strong>&quot;Lisansı Uzat&quot;</strong> butonu ile aboneliğinizi yenileyebilirsiniz. Otomatik ödeme talimatı aktifse bir sonraki tahsilat döngüsünde otomatik yenilenir.
              </p>
            </div>
          )}

          <div className="p-8 rounded-2xl bg-[#111118] border border-white/5">
            <GoogleAuthButton label="Google ile giriş yap" />
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-gray-500 uppercase tracking-wider">veya e-mail ile</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          <form onSubmit={handleSubmit} noValidate autoComplete="on" className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
              />
            </div>

            {error && (
              <div className={`p-3 rounded-lg border text-sm ${needsVerification ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                {needsVerification && <MailWarning size={14} className="inline mr-1.5 -mt-0.5" />}
                {error}
                {needsVerification && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-200 text-xs font-medium transition flex items-center justify-center gap-2"
                    >
                      {resending && <Loader2 size={12} className="animate-spin" />}
                      {resending ? "Gönderiliyor..." : "Tekrar Doğrulama Maili Gönder"}
                    </button>
                    {resendMsg && (
                      <p className={`mt-2 text-xs ${resendMsg.ok ? "text-green-300" : "text-red-300"}`}>{resendMsg.text}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>

            <div className="pt-4 border-t border-white/5 text-center text-sm space-y-2">
              <div>
                <span className="text-gray-400">Yeni misin? </span>
                <Link href={`/uye-ol?next=${encodeURIComponent(next)}`} className="text-blue-400 hover:underline">Üye ol</Link>
              </div>
            </div>
          </form>
          </div>
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
