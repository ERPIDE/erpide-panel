"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, Circle, Clock } from "lucide-react";

type Task = { id: number; title: string; project: string; label: string; status: "todo" | "in_progress" | "done"; deadline?: string };

const initTasks: Task[] = [
  { id: 1, title: "SIRPRD05: Parti numarasi detay ve performans", project: "CANIAS", label: "bug", status: "todo" },
  { id: 2, title: "DSG Malzeme karti parti numarasi kurgusu", project: "CANIAS", label: "feature", status: "todo" },
  { id: 3, title: "SIRSTOK2: CREATEVARCOLUMNS hizlandirma", project: "CANIAS", label: "improvement", status: "todo" },
  { id: 4, title: "Kayit anahtarlari revizesi - Bordro", project: "CANIAS", label: "improvement", status: "todo" },
  { id: 5, title: "SALT01: Irsaliye cift rezervasyon", project: "CANIAS", label: "bug", status: "todo" },
  { id: 6, title: "SALT04: Iskonto 611.01.001 hesap", project: "CANIAS", label: "feature", status: "todo" },
  { id: 7, title: "Kalem bazli tevkifat muhasebe fisi", project: "CANIAS", label: "bug", status: "todo" },
  { id: 8, title: "SIRPRD02: Performans iyilestirme", project: "CANIAS", label: "improvement", status: "todo" },
  { id: 9, title: "FINT64: KDV listesi hatali rakamlar", project: "CANIAS", label: "bug", status: "todo" },
  { id: 10, title: "ACTT09: Karlilik analiz raporu", project: "CANIAS", label: "feature", status: "todo" },
  { id: 11, title: "Ithalat masraf dagilimi web servisi", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 12, title: "Belgesiz stok dusum web servisi", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 13, title: "Uretim asamasi stok rapor ekrani", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 14, title: "PT numarasina gore PITI otomatik", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 15, title: "Banka odemelerinde bagimsiz avans", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 16, title: "Banka komisyon masraf servisi", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 17, title: "Odeme talebine otomatik nakit akisi", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 18, title: "Sabit kiymet faydali omur girisleri", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 19, title: "Sabit kiymet ilk tahakkuk belgeleri", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 20, title: "Idareten stok artirim PT eslemesi", project: "1C ERP", label: "improvement", status: "todo", deadline: "30 Nisan" },
  { id: 21, title: "HFE Holu Hata Talep Listesi", project: "1C ERP", label: "bug", status: "todo", deadline: "30 Nisan" },
  { id: 22, title: "Odeme Talepleri Raporu ATM logo", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 23, title: "2024-2025 devir acilis bakiyeleri", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 24, title: "Recete PT numaralari FIFO otomatik", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 25, title: "Odeme talepleri workflow onay", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 26, title: "Fason sureci test", project: "1C ERP", label: "improvement", status: "todo", deadline: "30 Nisan" },
  { id: 27, title: "Hol bazli karlilik raporu", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
  { id: 28, title: "Kar ve Zarar raporu", project: "1C ERP", label: "feature", status: "todo", deadline: "30 Nisan" },
];

const labelCfg: Record<string, { color: string; bg: string }> = {
  bug: { color: "text-red-400", bg: "bg-red-500/10" },
  feature: { color: "text-green-400", bg: "bg-green-500/10" },
  improvement: { color: "text-yellow-400", bg: "bg-yellow-500/10" },
};

const statusCfg = {
  todo: { icon: Circle, color: "text-gray-400", label: "Bekliyor" },
  in_progress: { icon: Clock, color: "text-yellow-400", label: "Devam Ediyor" },
  done: { icon: CheckCircle2, color: "text-green-400", label: "Tamamlandi" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState(initTasks);
  const [search, setSearch] = useState("");
  const [fProject, setFProject] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (fProject !== "all" && t.project !== fProject) return false;
    if (fStatus !== "all" && t.status !== fStatus) return false;
    return true;
  });

  const cycle = (id: number) => setTasks(p => p.map(t => t.id !== id ? t : {
    ...t, status: (["todo", "in_progress", "done"] as const)[(["todo", "in_progress", "done"].indexOf(t.status) + 1) % 3]
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input placeholder="Task ara..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none" />
        </div>
        <select value={fProject} onChange={(e) => setFProject(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm">
          <option value="all">Tum Projeler</option>
          <option value="CANIAS">CANIAS ERP</option>
          <option value="1C ERP">1C ERP</option>
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm">
          <option value="all">Tum Durumlar</option>
          <option value="todo">Bekliyor</option>
          <option value="in_progress">Devam Ediyor</option>
          <option value="done">Tamamlandi</option>
        </select>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((t) => {
            const sc = statusCfg[t.status];
            const lc = labelCfg[t.label] || labelCfg.feature;
            return (
              <motion.div key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-white/5 hover:border-blue-500/20 transition">
                <button onClick={() => cycle(t.id)} className="shrink-0">
                  <sc.icon size={20} className={sc.color} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${t.status === "done" ? "text-gray-500 line-through" : "text-white"}`}>{t.title}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{t.project}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lc.bg} ${lc.color}`}>{t.label}</span>
                    {t.deadline && <span className="text-xs text-gray-500">{t.deadline}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg hidden sm:block ${
                  t.status === "done" ? "bg-green-500/10 text-green-400" :
                  t.status === "in_progress" ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-gray-500/10 text-gray-400"
                }`}>{sc.label}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
