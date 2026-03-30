"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderGit2,
  CalendarClock,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Flame,
  MessageSquare,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  Task,
  priorityConfig,
  statusConfig,
} from "@/lib/store";

// ── helpers ──────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function deadlineBadge(days: number) {
  if (days < 0) return { text: `${Math.abs(days)} gun gecikme`, cls: "bg-red-500/20 text-red-400" };
  if (days === 0) return { text: "Bugun!", cls: "bg-red-500/20 text-red-400" };
  if (days < 7) return { text: `${days} gun`, cls: "bg-red-500/20 text-red-400" };
  if (days < 14) return { text: `${days} gun`, cls: "bg-yellow-500/20 text-yellow-400" };
  return { text: `${days} gun`, cls: "bg-green-500/20 text-green-400" };
}

// ── animation variants ───────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const child = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ── main component ───────────────────────────────────────────────────
export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data: Task[]) => {
        setTasks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Stats
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress" || t.status === "review").length;
  const criticalUrgent = tasks.filter(
    (t) => t.priority === "critical" || t.label === "urgent"
  ).length;

  // Project aggregation
  const projectData = useMemo(() => {
    const canias = tasks.filter((t) => t.project === "CANIAS");
    const oneC = tasks.filter((t) => t.project === "1C ERP");
    return [
      {
        name: "CANIAS ERP",
        client: "Sirmersan",
        color: "from-blue-500 to-cyan-500",
        border: "border-blue-500/30",
        tasks: canias,
        total: canias.length,
        done: canias.filter((t) => t.status === "done").length,
        deadline: null as string | null,
      },
      {
        name: "1C ERP",
        client: "ATM Constructor",
        color: "from-purple-500 to-pink-500",
        border: "border-purple-500/30",
        tasks: oneC,
        total: oneC.length,
        done: oneC.filter((t) => t.status === "done").length,
        deadline: "2026-04-30",
      },
      {
        name: "Python Botlari",
        client: "Marijeo",
        color: "from-green-500 to-emerald-500",
        border: "border-green-500/30",
        tasks: [],
        total: 0,
        done: 0,
        deadline: null as string | null,
      },
      {
        name: "Kripto Botu",
        client: "Skynet",
        color: "from-orange-500 to-amber-500",
        border: "border-orange-500/30",
        tasks: [],
        total: 0,
        done: 0,
        deadline: null as string | null,
      },
    ];
  }, [tasks]);

  // Deadline tracker
  const deadlineTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.deadline && t.status !== "done")
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()),
    [tasks]
  );

  // Recent activity (comments across all tasks, sorted by date desc)
  const recentActivity = useMemo(() => {
    const activities: {
      author: string;
      action: string;
      taskTitle: string;
      taskId: number;
      date: string;
    }[] = [];

    for (const t of tasks) {
      for (const c of t.comments) {
        activities.push({
          author: c.author,
          action: `yorum birakti: "${c.text.slice(0, 60)}${c.text.length > 60 ? "..." : ""}"`,
          taskTitle: t.title,
          taskId: t.id,
          date: c.date,
        });
      }
      if (t.devNote) {
        activities.push({
          author: "ERPIDE Dev",
          action: `gelistirici notu ekledi`,
          taskTitle: t.title,
          taskId: t.id,
          date: t.createdAt,
        });
      }
    }

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [tasks]);

  // Priority breakdown
  const priorityBreakdown = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of tasks) counts[t.priority]++;
    const barColors = {
      critical: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-gray-500",
    };
    return (Object.keys(counts) as Array<keyof typeof counts>).map((key) => ({
      key,
      label: priorityConfig[key].label,
      count: counts[key],
      pct: total > 0 ? (counts[key] / total) * 100 : 0,
      barColor: barColors[key],
      textColor: priorityConfig[key].color,
    }));
  }, [tasks, total]);

  // Stat cards definition
  const stats = [
    {
      label: "Toplam Task",
      value: total,
      icon: ListTodo,
      color: "text-blue-400",
      bg: "from-blue-600/20 to-blue-600/5",
      trend: null as string | null,
      trendUp: true,
    },
    {
      label: "Tamamlanan",
      value: done,
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "from-green-600/20 to-green-600/5",
      trend: total > 0 ? `%${Math.round((done / total) * 100)}` : "%0",
      trendUp: done > 0,
    },
    {
      label: "Devam Eden",
      value: inProgress,
      icon: Clock,
      color: "text-yellow-400",
      bg: "from-yellow-600/20 to-yellow-600/5",
      trend: `${inProgress} aktif`,
      trendUp: true,
    },
    {
      label: "Kritik / Acil",
      value: criticalUrgent,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "from-red-600/20 to-red-600/5",
      trend: criticalUrgent > 0 ? "dikkat" : "temiz",
      trendUp: criticalUrgent === 0,
    },
  ];

  // ── Loading State ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="text-blue-400 animate-spin" />
          <p className="text-sm text-gray-500">Veriler yukleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ─── 1. Stats Row ─────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {stats.map((s, i) => (
          <motion.div
            key={i}
            variants={child}
            className="relative overflow-hidden p-5 rounded-2xl bg-[#111118] border border-white/5 group hover:border-white/10 transition-all"
          >
            {/* subtle glow */}
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${s.bg} opacity-40 blur-2xl group-hover:opacity-60 transition`} />
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon size={20} className={s.color} />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{s.value}</span>
                {s.trend && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${
                      s.trendUp ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {s.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {s.trend}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── 2. Project Cards (2x2) ──────────────────────────────── */}
      <motion.section {...fadeUp(0.2)}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FolderGit2 size={18} className="text-blue-400" /> Projeler
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {projectData.map((p, i) => {
            const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
            const hasDeadline = !!p.deadline;
            const daysLeft = hasDeadline ? daysUntil(p.deadline!) : null;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`p-5 rounded-2xl bg-[#111118] border-l-4 ${p.border} border border-white/5 hover:border-white/10 transition-all group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-400 font-medium">
                    {p.client}
                  </span>
                </div>

                {p.total > 0 ? (
                  <>
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <span className="text-gray-400">{p.total} task</span>
                      <span className="text-green-400">{p.done} tamamlandi</span>
                      <span className="ml-auto text-xs text-gray-500">{pct}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${p.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 2)}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                      />
                    </div>
                    {hasDeadline && daysLeft !== null && (
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <CalendarClock size={13} className="text-gray-500" />
                        <span className="text-gray-400">
                          Deadline: {new Date(p.deadline!).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                        </span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold ${deadlineBadge(daysLeft).cls}`}>
                          {deadlineBadge(daysLeft).text}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 mt-1">0 aktif task</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ─── 3 & 4. Deadline Tracker + Recent Activity ───────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Deadline Tracker */}
        <motion.section {...fadeUp(0.35)}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarClock size={18} className="text-orange-400" /> Deadline Takibi
          </h2>
          <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
            {deadlineTasks.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 text-center">
                Deadline&apos;i olan aktif task yok.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {deadlineTasks.map((t, i) => {
                  const days = daysUntil(t.deadline!);
                  const badge = deadlineBadge(days);
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.04 }}
                      className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                            {t.project}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {new Date(t.deadline!).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.cls}`}
                      >
                        {badge.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section {...fadeUp(0.4)}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-green-400" /> Son Aktivite
          </h2>
          <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 text-center">Henuz aktivite yok.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentActivity.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 flex items-center justify-center shrink-0">
                        <MessageSquare size={13} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">
                          <span className="text-white font-medium">{a.author}</span>{" "}
                          {a.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {a.taskTitle}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-600 shrink-0 mt-0.5">
                        {a.date}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/admin/tasks"
            className="mt-3 flex items-center justify-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition"
          >
            Tum tasklari gor <ArrowRight size={14} />
          </Link>
        </motion.section>
      </div>

      {/* ─── 5. Priority Breakdown ───────────────────────────────── */}
      <motion.section {...fadeUp(0.5)}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-purple-400" /> Oncelik Dagilimi
        </h2>
        <div className="rounded-2xl bg-[#111118] border border-white/5 p-6">
          {/* Combined bar */}
          <div className="h-4 rounded-full overflow-hidden flex bg-white/5 mb-6">
            {priorityBreakdown.map((p) =>
              p.pct > 0 ? (
                <motion.div
                  key={p.key}
                  className={`${p.barColor} first:rounded-l-full last:rounded-r-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${p.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                />
              ) : null
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {priorityBreakdown.map((p) => (
              <div
                key={p.key}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className={`w-3 h-3 rounded-full ${p.barColor}`} />
                <div>
                  <span className={`text-sm font-semibold ${p.textColor}`}>{p.count}</span>
                  <span className="text-xs text-gray-500 ml-1.5">{p.label}</span>
                </div>
                <span className="ml-auto text-xs text-gray-600">
                  %{Math.round(p.pct)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
