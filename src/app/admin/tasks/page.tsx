"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Plus,
  X,
  MessageSquare,
  Paperclip,
  Upload,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  Flame,
  ChevronDown,
  CalendarDays,
  User,
  Tag,
  FileText,
  StickyNote,
  Filter,
  BarChart3,
  ListTodo,
  Loader2,
} from "lucide-react";
import {
  Task,
  Status,
  Priority,
  Label,
  Comment,
  priorityConfig,
  statusConfig,
  labelConfig,
} from "@/lib/store";

/* ─── constants ─── */
const statuses: Status[] = ["todo", "in_progress", "review", "done"];
const priorities: Priority[] = ["critical", "high", "medium", "low"];
const labels: Label[] = ["bug", "feature", "improvement", "docs", "urgent"];
const projects = ["CANIAS", "1C ERP"] as const;

const statusIcons: Record<Status, typeof Circle> = {
  todo: Circle,
  in_progress: Clock,
  review: Eye,
  done: CheckCircle2,
};

const priorityIcons: Record<Priority, typeof Flame> = {
  critical: Flame,
  high: ArrowUpCircle,
  medium: MinusCircle,
  low: ArrowDownCircle,
};

const roleBadge: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: "Admin", color: "text-purple-400", bg: "bg-purple-500/10" },
  customer: { label: "Musteri", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  developer: { label: "Gelistirici", color: "text-green-400", bg: "bg-green-500/10" },
};

const clientMap: Record<string, string> = {
  CANIAS: "Sirmersan",
  "1C ERP": "ATM Constructor",
};

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/* ─── main component ─── */
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [fProject, setFProject] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fPriority, setFPriority] = useState("all");
  const [fLabel, setFLabel] = useState("all");

  // comment state
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentPosting, setCommentPosting] = useState(false);

  // file upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { url: string; name: string; type: string; date: string }[]>>({});

  // notification state
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState("");

  // create form
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    project: "CANIAS" as string,
    label: "feature" as Label,
    priority: "medium" as Priority,
    deadline: "",
  });

  /* ─── fetch tasks on mount ─── */
  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data: Task[] = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  /* ─── fetch comments when task detail opens ─── */
  async function fetchComments(task: Task) {
    if (!task.repo) {
      setComments(task.comments ?? []);
      return;
    }
    try {
      setCommentsLoading(true);
      const res = await fetch(`/api/tasks/comments?repo=${encodeURIComponent(task.repo)}&issue=${task.id}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data: Comment[] = await res.json();
      setComments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments(task.comments ?? []);
    } finally {
      setCommentsLoading(false);
    }
  }

  function openTaskDetail(task: Task) {
    setSelectedTask(task);
    setCommentText("");
    setComments([]);
    fetchComments(task);
  }

  /* ─── post comment ─── */
  async function addComment(task: Task) {
    if (!commentText.trim() || !task.repo) return;
    try {
      setCommentPosting(true);
      const res = await fetch("/api/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: task.repo,
          issueNumber: task.id,
          comment: commentText.trim(),
          author: "ERPIDE Admin",
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      setCommentText("");
      // refresh comments
      await fetchComments(task);
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setCommentPosting(false);
    }
  }

  /* ─── create task ─── */
  async function createTask() {
    if (!newTask.title.trim()) return;
    try {
      setCreating(true);
      const body = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        project: newTask.project,
        client: clientMap[newTask.project] ?? "",
        label: newTask.label,
        priority: newTask.priority,
        deadline: newTask.deadline || undefined,
      };
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create task");
      setNewTask({ title: "", description: "", project: "CANIAS", label: "feature", priority: "medium", deadline: "" });
      setShowCreateModal(false);
      // refresh the list
      await fetchTasks();
    } catch (err) {
      console.error("Error creating task:", err);
    } finally {
      setCreating(false);
    }
  }

  /* ─── upload file ─── */
  async function uploadFile(task: Task, file: File) {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", String(task.id));
      formData.append("project", task.project);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Dosya yuklenemedi");
        return;
      }

      const result = await res.json();
      const key = `${task.project}-${task.id}`;
      setUploadedFiles((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), result],
      }));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Dosya yuklenemedi");
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(task: Task) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadFile(task, file);
    };
    input.click();
  }

  /* ─── send notification ─── */
  async function sendNotification(type: string, task: Task, extra?: { comment?: string; status?: string }) {
    try {
      setNotifying(true);
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          taskTitle: task.title,
          taskId: task.id,
          project: task.project,
          ...extra,
        }),
      });

      if (res.ok) {
        setNotifySuccess("Email gonderildi!");
        setTimeout(() => setNotifySuccess(""), 3000);
      } else {
        const err = await res.json();
        console.error("Notify error:", err.error);
      }
    } catch (err) {
      console.error("Notify error:", err);
    } finally {
      setNotifying(false);
    }
  }

  /* ─── derived ─── */
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (fProject !== "all" && t.project !== fProject) return false;
      if (fStatus !== "all" && t.status !== fStatus) return false;
      if (fPriority !== "all" && t.priority !== fPriority) return false;
      if (fLabel !== "all" && t.label !== fLabel) return false;
      return true;
    });
  }, [tasks, search, fProject, fStatus, fPriority, fLabel]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const byStatus: Record<Status, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
    let overdue = 0;
    tasks.forEach((t) => {
      byStatus[t.status]++;
      if (t.status !== "done" && isOverdue(t.deadline)) overdue++;
    });
    return { total, byStatus, overdue };
  }, [tasks]);

  /* keep selectedTask in sync with tasks array */
  const activeTask = useMemo(() => {
    if (!selectedTask) return null;
    return tasks.find((t) => t.id === selectedTask.id) ?? null;
  }, [tasks, selectedTask]);

  /* ─── loading spinner ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 size={40} className="text-blue-500 animate-spin" />
          <p className="text-sm text-gray-400">Gorevler yukleniyor...</p>
        </motion.div>
      </div>
    );
  }

  /* ─── render ─── */
  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Toplam", value: stats.total, icon: ListTodo, color: "text-white", bg: "bg-white/5" },
          { label: statusConfig.todo.label, value: stats.byStatus.todo, icon: Circle, color: statusConfig.todo.color, bg: statusConfig.todo.bg },
          { label: statusConfig.in_progress.label, value: stats.byStatus.in_progress, icon: Clock, color: statusConfig.in_progress.color, bg: statusConfig.in_progress.bg },
          { label: statusConfig.review.label, value: stats.byStatus.review, icon: Eye, color: statusConfig.review.color, bg: statusConfig.review.bg },
          { label: statusConfig.done.label, value: stats.byStatus.done, icon: CheckCircle2, color: statusConfig.done.color, bg: statusConfig.done.bg },
          { label: "Gecikmis", value: stats.overdue, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-3 p-3.5 rounded-xl bg-[#111118] border border-white/5`}>
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            placeholder="Gorev ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition"
          />
        </div>
        {/* filters */}
        <div className="flex flex-wrap gap-2">
          <select value={fProject} onChange={(e) => setFProject(e.target.value)} className="px-3 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm focus:border-blue-500/50 focus:outline-none transition cursor-pointer">
            <option value="all">Tum Projeler</option>
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm focus:border-blue-500/50 focus:outline-none transition cursor-pointer">
            <option value="all">Tum Durumlar</option>
            {statuses.map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
          </select>
          <select value={fPriority} onChange={(e) => setFPriority(e.target.value)} className="px-3 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm focus:border-blue-500/50 focus:outline-none transition cursor-pointer">
            <option value="all">Tum Oncelikler</option>
            {priorities.map((p) => <option key={p} value={p}>{priorityConfig[p].label}</option>)}
          </select>
          <select value={fLabel} onChange={(e) => setFLabel(e.target.value)} className="px-3 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm focus:border-blue-500/50 focus:outline-none transition cursor-pointer">
            <option value="all">Tum Etiketler</option>
            {labels.map((l) => <option key={l} value={l}>{labelConfig[l].label}</option>)}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
          >
            <Plus size={16} /> Yeni Gorev
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Filter size={12} />
        <span>{filtered.length} gorev listeleniyor</span>
        {(search || fProject !== "all" || fStatus !== "all" || fPriority !== "all" || fLabel !== "all") && (
          <button
            onClick={() => { setSearch(""); setFProject("all"); setFStatus("all"); setFPriority("all"); setFLabel("all"); }}
            className="text-blue-400 hover:text-blue-300 transition ml-1"
          >
            Filtreleri temizle
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {filtered.map((t) => {
            const sc = statusConfig[t.status];
            const lc = labelConfig[t.label];
            const pc = priorityConfig[t.priority];
            const StatusIcon = statusIcons[t.status];
            const PriorityIcon = priorityIcons[t.priority];
            const overdue = t.status !== "done" && isOverdue(t.deadline);

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                onClick={() => openTaskDetail(t)}
                className="flex items-center gap-3 p-4 rounded-xl bg-[#111118] border border-white/5 hover:border-blue-500/20 cursor-pointer transition group"
              >
                {/* status icon (read-only) */}
                <div className="shrink-0" title={`Durum: ${sc.label}`}>
                  <StatusIcon size={20} className={`${sc.color} transition-colors`} />
                </div>

                {/* main content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${t.status === "done" ? "text-gray-500 line-through" : "text-white group-hover:text-blue-100"} transition`}>
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* project */}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                      {t.project}
                    </span>
                    {/* label */}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${lc.bg} ${lc.color}`}>
                      {lc.label}
                    </span>
                    {/* priority */}
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${pc.bg} ${pc.color} flex items-center gap-1`}>
                      <PriorityIcon size={10} />
                      {pc.label}
                    </span>
                    {/* deadline */}
                    {t.deadline && (
                      <span className={`text-[11px] flex items-center gap-1 ${overdue ? "text-red-400 font-medium" : "text-gray-500"}`}>
                        <CalendarDays size={10} />
                        {formatDate(t.deadline)}
                        {overdue && <AlertTriangle size={10} className="text-red-400" />}
                      </span>
                    )}
                  </div>
                </div>

                {/* right side */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* comment count */}
                  {(t.commentsCount ?? t.comments?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageSquare size={12} />
                      {t.commentsCount ?? t.comments?.length ?? 0}
                    </span>
                  )}
                  {/* attachments count */}
                  {(t.attachments?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Paperclip size={12} />
                      {t.attachments.length}
                    </span>
                  )}
                  {/* status badge */}
                  <span className={`text-[11px] px-2.5 py-1 rounded-lg hidden sm:block ${sc.bg} ${sc.color} font-medium`}>
                    {sc.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <ListTodo size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Gorev bulunamadi</p>
          </div>
        )}
      </div>

      {/* Task Detail Slide-Over */}
      <AnimatePresence>
        {activeTask && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedTask(null); setCommentText(""); setComments([]); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0a0a12] border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                        {activeTask.project}
                      </span>
                      <span className="text-[11px] text-gray-600">#{activeTask.id}</span>
                      <span className="text-[11px] text-gray-600">|</span>
                      <span className="text-[11px] text-gray-500">{activeTask.client}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-white leading-snug">{activeTask.title}</h2>
                  </div>
                  <button
                    onClick={() => { setSelectedTask(null); setCommentText(""); setComments([]); }}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* status */}
                  <div className="p-3 rounded-xl bg-[#111118] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Durum</p>
                    <span className={`text-sm font-medium ${statusConfig[activeTask.status].color}`}>
                      {statusConfig[activeTask.status].label}
                    </span>
                  </div>
                  {/* priority */}
                  <div className="p-3 rounded-xl bg-[#111118] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Oncelik</p>
                    <span className={`text-sm font-medium ${priorityConfig[activeTask.priority].color}`}>
                      {priorityConfig[activeTask.priority].label}
                    </span>
                  </div>
                  {/* label */}
                  <div className="p-3 rounded-xl bg-[#111118] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Etiket</p>
                    <span className={`text-sm font-medium ${labelConfig[activeTask.label].color}`}>
                      {labelConfig[activeTask.label].label}
                    </span>
                  </div>
                  {/* deadline */}
                  <div className="p-3 rounded-xl bg-[#111118] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Son Tarih</p>
                    <span className={`text-sm font-medium ${activeTask.deadline ? (isOverdue(activeTask.deadline) && activeTask.status !== "done" ? "text-red-400" : "text-white") : "text-gray-600"}`}>
                      {activeTask.deadline ? formatDate(activeTask.deadline) : "Belirtilmemis"}
                    </span>
                  </div>
                  {/* created */}
                  <div className="p-3 rounded-xl bg-[#111118] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Olusturulma</p>
                    <span className="text-sm text-white">{formatDate(activeTask.createdAt)}</span>
                  </div>
                  {/* created by */}
                  <div className="p-3 rounded-xl bg-[#111118] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Olusturan</p>
                    <span className="text-sm text-white">{activeTask.createdBy}</span>
                  </div>
                </div>

                {/* description */}
                <div className="p-4 rounded-xl bg-[#111118] border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-gray-500" />
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Aciklama</p>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {activeTask.description || "Aciklama eklenmemis."}
                  </p>
                </div>

                {/* dev note */}
                <div className="p-4 rounded-xl bg-[#111118] border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote size={14} className="text-yellow-500/60" />
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Gelistirici Notu</p>
                  </div>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${activeTask.devNote ? "text-yellow-200/80" : "text-gray-600 italic"}`}>
                    {activeTask.devNote || "Henuz gelistirici notu yok."}
                  </p>
                </div>

                {/* status display (read-only) */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Durum</p>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((s) => {
                      const cfg = statusConfig[s];
                      const Icon = statusIcons[s];
                      const active = activeTask.status === s;
                      return (
                        <div
                          key={s}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border ${
                            active
                              ? `${cfg.bg} ${cfg.color} border-current`
                              : "bg-[#111118] text-gray-600 border-white/5"
                          }`}
                        >
                          <Icon size={14} />
                          {cfg.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* priority display (read-only) */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Oncelik</p>
                  <div className="flex flex-wrap gap-2">
                    {priorities.map((p) => {
                      const cfg = priorityConfig[p];
                      const Icon = priorityIcons[p];
                      const active = activeTask.priority === p;
                      return (
                        <div
                          key={p}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border ${
                            active
                              ? `${cfg.bg} ${cfg.color} border-current`
                              : "bg-[#111118] text-gray-600 border-white/5"
                          }`}
                        >
                          <Icon size={14} />
                          {cfg.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* comments */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-gray-500" />
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                      Yorumlar ({comments.length})
                    </p>
                    {commentsLoading && <Loader2 size={12} className="text-blue-400 animate-spin" />}
                  </div>

                  {commentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="text-blue-400 animate-spin" />
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {comments.map((c) => {
                        const badge = roleBadge[c.authorRole] ?? roleBadge.customer;
                        return (
                          <div key={c.id} className="p-3.5 rounded-xl bg-[#111118] border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                <User size={12} className="text-gray-400" />
                              </div>
                              <span className="text-sm font-medium text-white">{c.author}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.bg} ${badge.color} font-medium`}>
                                {badge.label}
                              </span>
                              <span className="text-[10px] text-gray-600 ml-auto">{formatDate(c.date)}</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed pl-8">{c.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mb-4 italic">Henuz yorum yok.</p>
                  )}

                  {/* add comment */}
                  <div className="flex gap-2">
                    <textarea
                      placeholder="Yorum ekle..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                      className="flex-1 p-3 rounded-xl bg-[#111118] border border-white/10 text-white text-sm placeholder-gray-500 focus:border-blue-500/50 focus:outline-none resize-none transition"
                    />
                    <button
                      onClick={() => addComment(activeTask)}
                      disabled={!commentText.trim() || commentPosting}
                      className="self-end px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium transition flex items-center gap-2"
                    >
                      {commentPosting && <Loader2 size={14} className="animate-spin" />}
                      Gonder
                    </button>
                  </div>
                </div>

                {/* attachments */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip size={14} className="text-gray-500" />
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                      Ekler ({(activeTask.attachments?.length ?? 0) + (uploadedFiles[`${activeTask.project}-${activeTask.id}`]?.length ?? 0)})
                    </p>
                  </div>

                  {/* existing attachments from GitHub */}
                  {(activeTask.attachments?.length ?? 0) > 0 && (
                    <div className="space-y-2 mb-3">
                      {activeTask.attachments.map((a) => (
                        <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-[#111118] border border-white/5 hover:border-blue-500/20 transition">
                          <Paperclip size={14} className="text-gray-500 shrink-0" />
                          <span className="text-sm text-white truncate flex-1">{a.name}</span>
                          <span className="text-[10px] text-gray-500">{a.type}</span>
                          <span className="text-[10px] text-gray-600">{formatDate(a.date)}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* uploaded files via Vercel Blob */}
                  {(uploadedFiles[`${activeTask.project}-${activeTask.id}`]?.length ?? 0) > 0 && (
                    <div className="space-y-2 mb-3">
                      {uploadedFiles[`${activeTask.project}-${activeTask.id}`].map((f, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#111118] border border-green-500/20">
                          {f.type === "image" ? (
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
                              <img src={f.url} alt={f.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                              <span className="text-sm text-white truncate">{f.name}</span>
                            </a>
                          ) : (
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
                              <Paperclip size={14} className="text-green-400 shrink-0" />
                              <span className="text-sm text-white truncate">{f.name}</span>
                            </a>
                          )}
                          <span className="text-[10px] text-green-400">Yuklendi</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(activeTask.attachments?.length ?? 0) === 0 && (uploadedFiles[`${activeTask.project}-${activeTask.id}`]?.length ?? 0) === 0 && (
                    <p className="text-xs text-gray-600 mb-3 italic">Henuz ek dosya yok.</p>
                  )}

                  <button
                    onClick={() => handleFileSelect(activeTask)}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 hover:border-blue-500/30 text-gray-400 hover:text-white text-sm transition disabled:opacity-50"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? "Yukleniyor..." : "Dosya Yukle"}
                  </button>
                  <p className="text-[10px] text-gray-600 mt-1.5">PNG, JPEG, PDF, Word, Excel - Maks. 10MB</p>
                </div>

                {/* email notification */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={14} className="text-gray-500" />
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Bildirimler</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => sendNotification("task_completed", activeTask)}
                      disabled={notifying}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600/10 border border-green-500/20 text-green-400 hover:bg-green-600/20 text-xs font-medium transition disabled:opacity-50"
                    >
                      {notifying ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Tamamlandi Bildirimi
                    </button>
                    <button
                      onClick={() => sendNotification("status_change", activeTask, { status: activeTask.status })}
                      disabled={notifying}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-600/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-600/20 text-xs font-medium transition disabled:opacity-50"
                    >
                      {notifying ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                      Durum Bildirimi
                    </button>
                  </div>
                  {notifySuccess && (
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                      <CheckCircle2 size={12} /> {notifySuccess}
                    </p>
                  )}
                </div>

                {/* GitHub link */}
                {activeTask.url && (
                  <div className="pt-2 border-t border-white/5">
                    <a
                      href={activeTask.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      GitHub Issue &rarr;
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-lg bg-[#0a0a12] border border-white/10 rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Yeni Gorev Olustur</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
                    <X size={18} />
                  </button>
                </div>

                {/* form */}
                <div className="space-y-4">
                  {/* title */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Baslik</label>
                    <input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Gorev basligi..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition"
                    />
                  </div>

                  {/* description */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Aciklama</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Detayli aciklama..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm placeholder-gray-500 focus:border-blue-500/50 focus:outline-none resize-none transition"
                    />
                  </div>

                  {/* project + client */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Proje</label>
                      <select
                        value={newTask.project}
                        onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer transition"
                      >
                        {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Musteri</label>
                      <input
                        value={clientMap[newTask.project] ?? ""}
                        readOnly
                        className="w-full px-4 py-2.5 rounded-xl bg-[#111118] border border-white/5 text-gray-400 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* label + priority + deadline */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Etiket</label>
                      <select
                        value={newTask.label}
                        onChange={(e) => setNewTask({ ...newTask, label: e.target.value as Label })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer transition"
                      >
                        {labels.map((l) => <option key={l} value={l}>{labelConfig[l].label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Oncelik</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer transition"
                      >
                        {priorities.map((p) => <option key={p} value={p}>{priorityConfig[p].label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Son Tarih</label>
                      <input
                        type="date"
                        value={newTask.deadline}
                        onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm focus:border-blue-500/50 focus:outline-none transition [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition"
                  >
                    Iptal
                  </button>
                  <button
                    onClick={createTask}
                    disabled={!newTask.title.trim() || creating}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium transition flex items-center gap-2"
                  >
                    {creating && <Loader2 size={14} className="animate-spin" />}
                    Olustur
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
