"use client";
import { motion } from "framer-motion";
import { FileText, Download, Calendar } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Raporlar</h1>
        <p className="text-sm text-gray-500 mt-1">Haftalik gelistirme dokumleri ve proje raporlari</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-[#111118] border border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <FileText size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Sirmersan Haftalik Dokum</h3>
              <p className="text-xs text-gray-500">CANIAS ERP</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">Son donem: 09.03.2026 - 28.03.2026</p>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 text-sm hover:bg-blue-600/20 transition">
            <Download size={14} /> Rapor Olustur
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-[#111118] border border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <FileText size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">ATM Constructor Haftalik Dokum</h3>
              <p className="text-xs text-gray-500">1C ERP</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">Deadline: 30 Nisan 2026 | 18 task kaldi</p>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/10 text-purple-400 text-sm hover:bg-purple-600/20 transition">
            <Download size={14} /> Rapor Olustur
          </button>
        </motion.div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-blue-400" /> Gecmis Raporlar
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#111118] border border-white/5">
            <div>
              <p className="text-sm text-white">Sirmersan Haftalik Dokum</p>
              <p className="text-xs text-gray-500">09.03.2026 - 28.03.2026</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400">Gonderildi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
