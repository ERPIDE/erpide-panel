"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/hesabim";
  const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", passwordConfirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.passwordConfirm) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/shop/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kayıt başarısız");
        setLoading(false);
        return;
      }
      router.push(next);
    } catch (e) {
      setError("Bağlantı hatası: " + String(e));
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Üye Ol</span></h1>
          <p className="text-gray-400 text-sm mb-8">ERPIDE hesabını oluştur, tüm ürünlerini tek hesaptan yönet.</p>

          <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-[#111118] border border-white/5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ad" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Soyad" value={form.surname} onChange={(v) => setForm({ ...form, surname: v })} required />
            </div>
            <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Field label="Şifre (min. 8 karakter, harf+rakam)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
            <Field label="Şifre (tekrar)" type="password" value={form.passwordConfirm} onChange={(v) => setForm({ ...form, passwordConfirm: v })} required />

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Hesap oluşturuluyor..." : "Üye Ol"}
            </button>

            <p className="text-xs text-gray-500 text-center pt-2">
              Üye olarak <Link href="/sozlesmeler/kullanim-kosullari" target="_blank" className="text-blue-400 hover:underline">Kullanım Koşulları</Link>'nı ve{" "}
              <Link href="/sozlesmeler/gizlilik-politikasi" target="_blank" className="text-blue-400 hover:underline">Gizlilik Politikası</Link>'nı kabul etmiş olursun.
            </p>

            <div className="pt-4 border-t border-white/5 text-center text-sm">
              <span className="text-gray-400">Hesabın var mı? </span>
              <Link href={`/giris?next=${encodeURIComponent(next)}`} className="text-blue-400 hover:underline">Giriş yap</Link>
            </div>
          </form>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Inner />
    </Suspense>
  );
}
