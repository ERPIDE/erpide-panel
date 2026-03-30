"use client";
import { motion } from "framer-motion";
import { ListTodo, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, FolderGit2 } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Toplam Task", value: "28", icon: ListTodo, color: "text-blue-400", bg: "from-blue-600/20 to-blue-600/5" },
  { label: "Tamamlanan", value: "0", icon: CheckCircle2, color: "text-green-400", bg: "from-green-600/20 to-green-600/5" },
  { label: "Devam Eden", value: "0", icon: Clock, color: "text-yellow-400", bg: "from-yellow-600/20 to-yellow-600/5" },
  { label: "Bekleyen", value: "28", icon: AlertTriangle, color: "text-red-400", bg: "from-red-600/20 to-red-600/5" },
];

const projects = [
  { name: "CANIAS ERP", repo: "erpide-canias-erp", tasks: 10, done: 0, client: "Sirmersan", color: "border-blue-500/30" },
  { name: "1C ERP", repo: "erpide-1c-erp", tasks: 18, done: 0, client: "ATM Constructor", color: "border-purple-500/30" },
  { name: "Python Botlari", repo: "erpide-python-bots", tasks: 0, done: 0, client: "Marijeo", color: "border-green-500/30" },
  { name: "Kripto Botu", repo: "erpide-crypto-bot", tasks: 0, done: 0, client: "Skynet", color: "border-orange-500/30" },
];

const recentTasks = [
  { title: "SIRPRD05: Parti numarasi detay ve performans", project: "CANIAS", label: "bug" },
  { title: "Ithalat faturasi masraf dagilimi belgesi", project: "1C ERP", label: "feature" },
  { title: "Odeme talepleri hiyerarsik workflow", project: "1C ERP", label: "feature" },
  { title: "FINT64: Indirilecek KDV listesi hatasi", project: "CANIAS", label: "bug" },
  { title: "Hol bazli karlilik raporu", project: "1C ERP", label: "feature" },
];

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl bg-[#111118] border border-white/5"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderGit2 size={18} className="text-blue-400" /> Projeler
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`p-5 rounded-2xl bg-[#111118] border-l-4 ${p.color} border border-white/5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">{p.client}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">{p.tasks} task</span>
                  <span className="text-green-400">{p.done} tamamlandi</span>
                </div>
                {p.tasks > 0 && (
                  <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                      style={{ width: `${(p.done / p.tasks) * 100}%` }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ListTodo size={18} className="text-blue-400" /> Son Tasklar
          </h2>
          <div className="space-y-3">
            {recentTasks.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="p-4 rounded-xl bg-[#111118] border border-white/5 hover:border-blue-500/20 transition cursor-pointer"
              >
                <p className="text-sm text-white mb-2 leading-snug">{t.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{t.project}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.label === "bug" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                  }`}>{t.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <Link href="/admin/tasks" className="block mt-4 text-sm text-blue-400 hover:text-blue-300 transition text-center">
            Tum tasklari gor →
          </Link>
        </div>
      </div>
    </div>
  );
}
