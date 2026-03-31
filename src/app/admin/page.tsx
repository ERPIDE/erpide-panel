"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { AdminUser, initialAdmins } from "@/lib/store";

function getAdmins(): AdminUser[] {
  try {
    const saved = localStorage.getItem("erpide_admins");
    return saved ? JSON.parse(saved) : [...initialAdmins];
  } catch { return [...initialAdmins]; }
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const admins = getAdmins();
    const user = admins.find(a => a.email === email && a.password === password);
    if (user) {
      localStorage.setItem("erpide_current_user", JSON.stringify({ name: user.name, email: user.email, role: user.role }));
      router.push("/admin/dashboard");
    } else {
      setError("Hatalı email veya şifre!");
    }
  };

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
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition">
            <Lock size={16} /> Giriş Yap
          </button>
        </form>
        <Link href="/" className="inline-block mt-4 text-sm text-gray-500 hover:text-white transition">&larr; Ana Sayfaya Dön</Link>
      </motion.div>
    </div>
  );
}
