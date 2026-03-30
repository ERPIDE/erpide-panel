"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, AlertCircle, CheckCircle2, Clock, ListTodo } from "lucide-react";
import Link from "next/link";

const customers: Record<string, { password: string; name: string; project: string; tasks: { title: string; status: string }[] }> = {
  "SIRMERSAN": {
    password: "sirmersan2024",
    name: "Sirmersan",
    project: "CANIAS ERP",
    tasks: [
      { title: "SIRPRD05: Parti numarası detay ve performans", status: "Bekliyor" },
      { title: "DSG Malzeme kartı parti numarası kurgusu", status: "Bekliyor" },
      { title: "SIRSTOK2: CREATEVARCOLUMNS hızlandırma", status: "Bekliyor" },
      { title: "SALT01: İrsaliye çift rezervasyon", status: "Bekliyor" },
      { title: "SIRPRD02: Performans iyileştirme", status: "Bekliyor" },
    ]
  },
  "ATM": {
    password: "atm2024",
    name: "ATM Constructor",
    project: "1C ERP",
    tasks: [
      { title: "İthalat masraf dağılımı web servisi", status: "Bekliyor" },
      { title: "Belgesiz stok düşüm web servisi", status: "Bekliyor" },
      { title: "Ödeme talepleri workflow onay", status: "Bekliyor" },
      { title: "Hol bazlı karlılık raporu", status: "Bekliyor" },
      { title: "Kar ve Zarar raporu", status: "Bekliyor" },
    ]
  }
};

export default function PanelPage() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers[code.toUpperCase()];
    if (customer && customer.password === password) {
      setLoggedIn(code.toUpperCase());
      setError("");
    } else {
      setError("Hatalı müşteri kodu veya şifre!");
    }
  };

  if (loggedIn) {
    const c = customers[loggedIn];
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <img src="/logo.png" alt="ERPIDE" className="h-10 mb-2" />
              <h1 className="text-2xl font-bold">{c.name} - Müşteri Paneli</h1>
              <p className="text-sm text-gray-500">{c.project}</p>
            </div>
            <button onClick={() => setLoggedIn(null)} className="text-sm text-gray-500 hover:text-white transition">Çıkış</button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-[#111118] border border-white/5">
              <ListTodo size={20} className="text-blue-400 mb-2" />
              <div className="text-xl font-bold">{c.tasks.length}</div>
              <div className="text-xs text-gray-500">Toplam Task</div>
            </div>
            <div className="p-4 rounded-xl bg-[#111118] border border-white/5">
              <Clock size={20} className="text-yellow-400 mb-2" />
              <div className="text-xl font-bold">{c.tasks.filter(t => t.status === "Bekliyor").length}</div>
              <div className="text-xs text-gray-500">Devam Eden</div>
            </div>
            <div className="p-4 rounded-xl bg-[#111118] border border-white/5">
              <CheckCircle2 size={20} className="text-green-400 mb-2" />
              <div className="text-xl font-bold">0</div>
              <div className="text-xs text-gray-500">Tamamlanan</div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4">Aktif Görevler</h2>
          <div className="space-y-2">
            {c.tasks.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#111118] border border-white/5">
                <span className="text-sm text-white">{t.title}</span>
                <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400">{t.status}</span>
              </div>
            ))}
          </div>
        </div>
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
        <img src="/logo.png" alt="ERPIDE" className="h-16 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">Müşteri Paneli</h1>
        <p className="text-gray-400 text-sm mb-6">Proje durumu, task takibi ve raporlar</p>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <input placeholder="Müşteri Kodu" value={code} onChange={(e) => { setCode(e.target.value); setError(""); }}
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
