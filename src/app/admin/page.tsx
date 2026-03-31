"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => { if (res.ok) router.replace("/admin/dashboard"); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, type: "admin" }),
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Hatalı email veya şifre!");
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 rounded-2xl bg-[#111118] border border-white/5 text-center"
      >
        <div className="flex justify-center mb-6"><Logo size="default" /></div>
        <h1 className="text-2xl font-bold mb-2">Yönetim Paneli</h1>
        <p className="text-gray-400 text-sm mb-6">Proje yönetimi, task takibi ve raporlama</p>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <input placeholder="Email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none" />
          <input placeholder="Şifre" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
            className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none" />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
        <Link href="/" className="inline-block mt-4 text-sm text-gray-500 hover:text-white transition">&larr; Ana Sayfaya Dön</Link>
      </motion.div>
    </div>
  );
}
