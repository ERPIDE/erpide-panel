"use client";
import { motion } from "framer-motion";
import { LayoutDashboard, Lock } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 rounded-2xl bg-[#111118] border border-white/5 text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-6">
          <LayoutDashboard size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">ERPIDE Yonetim Paneli</h1>
        <p className="text-gray-400 text-sm mb-6">Proje yonetimi, task takibi ve raporlama</p>
        <div className="space-y-3">
          <input placeholder="Email" type="email" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none" />
          <input placeholder="Sifre" type="password" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none" />
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition">
            <Lock size={16} /> Giris Yap
          </button>
        </div>
        <Link href="/" className="inline-block mt-4 text-sm text-gray-500 hover:text-white transition">← Ana Sayfaya Don</Link>
      </motion.div>
    </div>
  );
}
