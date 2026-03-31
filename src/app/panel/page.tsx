"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  AlertCircle,
  CheckCircle2,
  Clock,
  ListTodo,
  Search,
  X,
  MessageSquare,
  Paperclip,
  Send,
  Plus,
  LogOut,
  ChevronRight,
  CalendarDays,
  Loader2,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  Task,
  priorityConfig,
  statusConfig,
  labelConfig,
  Comment,
  Priority,
  Status,
  Label,
} from "@/lib/store";

const defaultCustomers: Record<
  string,
  { password: string; name: string; project: string }
> = {
  SIRMERSAN: {
    password: "sirmersan2024",
    name: "Sirmersan",
    project: "CANIAS",
  },
  ATM: {
    password: "atm2024",
    name: "ATM Constructor",
    project: "1C ERP",
  },
};

function getCustomers(): Record<string, { password: string; name: string; project: string }> {
  try {
    const saved = localStorage.getItem("erpide_customers");
    if (saved) {
      const list = JSON.parse(saved);
      const map: Record<string, { password: string; name: string; project: string }> = {};
      for (const c of list) {
        map[c.code] = { password: c.password, name: c.name, project: c.project };
      }
      return map;
    }
  } catch {}
  return defaultCustomers;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PanelPage() {
  const [customers] = useState(() => getCustomers());
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState<string | null>(null);

  // Dashboard state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [labelFilter, setLabelFilter] = useState<Label | "all">("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [taskComments, setTaskComments] = useState<Comment[]>([]);

  // New ticket form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newLabel, setNewLabel] = useState<Label>("feature");

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { url: string; name: string; type: string; date: string }[]>>({});

  const customerData = loggedIn ? customers[loggedIn] : null;

  // Fetch tasks after login
  useEffect(() => {
    if (!loggedIn) return;
    setLoadingTasks(true);
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data: Task[]) => {
        setTasks(data);
        setLoadingTasks(false);
      })
      .catch(() => setLoadingTasks(false));
  }, [loggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers[code.toUpperCase()];
    if (customer && customer.password === password) {
      setLoggedIn(code.toUpperCase());
      setError("");
    } else {
      setError("Hatali musteri kodu veya sifre!");
    }
  };

  const customerTasks = useMemo(() => {
    if (!customerData) return [];
    return tasks.filter((t) => t.client === customerData.name);
  }, [tasks, customerData]);

  async function uploadFile(task: Task, file: File) {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", String(task.id));
      formData.append("project", task.project);
      if (task.repo) formData.append("repo", task.repo);

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
    } catch {
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

  const filteredTasks = useMemo(() => {
    return customerTasks.filter((t) => {
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (labelFilter !== "all" && t.label !== labelFilter) return false;
      return true;
    });
  }, [customerTasks, searchQuery, statusFilter, priorityFilter, labelFilter]);

  const stats = useMemo(() => {
    const total = customerTasks.length;
    const todo = customerTasks.filter((t) => t.status === "todo").length;
    const inProgress = customerTasks.filter((t) => t.status === "in_progress" || t.status === "review").length;
    const done = customerTasks.filter((t) => t.status === "done").length;
    return { total, todo, inProgress, done };
  }, [customerTasks]);

  const progressPercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const deadline = useMemo(() => {
    const withDeadline = customerTasks.filter((t) => t.deadline);
    if (withDeadline.length === 0) return null;
    withDeadline.sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    return withDeadline[0].deadline!;
  }, [customerTasks]);

  // Open task detail: fetch comments from API
  const handleOpenTask = async (task: Task) => {
    setSelectedTask(task);
    setTaskComments([]);
    if (task.repo && task.id) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/tasks/comments?repo=${encodeURIComponent(task.repo)}&issue=${task.id}`);
        if (res.ok) {
          const data = await res.json();
          setTaskComments(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask || !customerData) return;
    setSubmittingComment(true);
    try {
      const res = await fetch("/api/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: selectedTask.repo,
          issueNumber: selectedTask.id,
          comment: newComment.trim(),
          author: customerData.name,
        }),
      });
      if (res.ok) {
        const comment: Comment = {
          id: `c-${Date.now()}`,
          author: customerData.name,
          authorRole: "customer",
          text: newComment.trim(),
          date: new Date().toISOString().split("T")[0],
        };
        setTaskComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch {
      // silently fail
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !customerData) return;
    setSubmittingTicket(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          project: customerData.project,
          client: customerData.name,
          label: newLabel,
          priority: newPriority,
          createdBy: customerData.name,
        }),
      });
      if (res.ok) {
        // Refresh tasks
        const refreshRes = await fetch("/api/tasks");
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setTasks(data);
        }
        setNewTitle("");
        setNewDescription("");
        setNewPriority("medium");
        setNewLabel("feature");
        setShowCreateForm(false);
      }
    } catch {
      // silently fail
    } finally {
      setSubmittingTicket(false);
    }
  };

  // LOGIN SCREEN
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#08080c]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-8 rounded-2xl bg-[#111118] border border-white/5 text-center"
        >
          <div className="flex justify-center mb-6">
            <Logo size="large" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Musteri Paneli</h1>
          <p className="text-gray-400 text-sm mb-6">
            Proje durumu, task takibi ve raporlar
          </p>

          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              placeholder="Musteri Kodu"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
            />
            <input
              placeholder="Sifre"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <Lock size={16} /> Giris Yap
            </button>
          </form>
          <Link
            href="/"
            className="inline-block mt-4 text-sm text-gray-500 hover:text-white transition"
          >
            &larr; Ana Sayfaya Don
          </Link>
        </motion.div>
      </div>
    );
  }

  // LOADING STATE
  if (loadingTasks) {
    return (
      <div className="min-h-screen bg-[#08080c] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="text-blue-400 animate-spin" />
          <p className="text-sm text-gray-500">Tasklar yukleniyor...</p>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#08080c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="small" />
            <div className="h-8 w-px bg-white/10" />
            <div>
              <h1 className="text-lg font-bold">{customerData!.name}</h1>
              <p className="text-xs text-gray-500">{customerData!.project}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setLoggedIn(null);
              setSelectedTask(null);
              setShowCreateForm(false);
              setSearchQuery("");
              setStatusFilter("all");
              setPriorityFilter("all");
              setLabelFilter("all");
              setTasks([]);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition"
          >
            <LogOut size={14} /> Cikis
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { icon: ListTodo, label: "Toplam Task", value: stats.total, color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: Clock, label: "Bekliyor", value: stats.todo, color: "text-gray-400", bg: "bg-gray-500/10" },
            { icon: Loader2, label: "Devam Ediyor", value: stats.inProgress, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { icon: CheckCircle2, label: "Tamamlandi", value: stats.done, color: "text-green-400", bg: "bg-green-500/10" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-[#111118] border border-white/5 hover:border-white/10 transition"
            >
              <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-xl bg-[#111118] border border-white/5 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Genel Ilerleme</h3>
            <span className="text-sm font-bold text-blue-400">%{progressPercent}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {stats.done} / {stats.total} task tamamlandi
            </span>
            {deadline && (
              <span className="flex items-center gap-1">
                <CalendarDays size={12} />
                Deadline: {formatDate(deadline)}
                {daysUntil(deadline) > 0 ? (
                  <span className="text-yellow-400 ml-1">({daysUntil(deadline)} gun kaldi)</span>
                ) : daysUntil(deadline) === 0 ? (
                  <span className="text-red-400 ml-1">(Bugun!)</span>
                ) : (
                  <span className="text-red-500 ml-1">({Math.abs(daysUntil(deadline))} gun gecti!)</span>
                )}
              </span>
            )}
          </div>
        </motion.div>

        {/* Filter Bar + Create Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              placeholder="Task ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111118] border border-white/5 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none text-sm transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
            className="px-4 py-2.5 rounded-xl bg-[#111118] border border-white/5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor-pointer transition"
          >
            <option value="all">Tum Durumlar</option>
            {(Object.entries(statusConfig) as [Status, { label: string }][]).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
            className="px-4 py-2.5 rounded-xl bg-[#111118] border border-white/5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor-pointer transition"
          >
            <option value="all">Tum Oncelikler</option>
            {(Object.entries(priorityConfig) as [Priority, { label: string }][]).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value as Label | "all")}
            className="px-4 py-2.5 rounded-xl bg-[#111118] border border-white/5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor-pointer transition"
          >
            <option value="all">Tum Etiketler</option>
            {(Object.entries(labelConfig) as [Label, { label: string }][]).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition whitespace-nowrap"
          >
            <Plus size={16} /> Yeni Talep
          </button>
        </motion.div>

        {/* Task List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Filtrelere uygun task bulunamadi.</p>
            </div>
          ) : (
            filteredTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleOpenTask(task)}
                className="flex items-center gap-4 p-4 rounded-xl bg-[#111118] border border-white/5 hover:border-white/10 cursor-pointer group transition"
              >
                {/* Priority Indicator */}
                <div
                  className={`w-1 h-10 rounded-full ${
                    task.priority === "critical"
                      ? "bg-red-500"
                      : task.priority === "high"
                      ? "bg-orange-400"
                      : task.priority === "medium"
                      ? "bg-yellow-400"
                      : "bg-gray-500"
                  }`}
                />
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${labelConfig[task.label].bg} ${labelConfig[task.label].color}`}
                    >
                      {labelConfig[task.label].label}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusConfig[task.status].bg} ${statusConfig[task.status].color}`}
                    >
                      {statusConfig[task.status].label}
                    </span>
                    {task.deadline && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <CalendarDays size={10} />
                        {formatDate(task.deadline)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Right side */}
                <div className="flex items-center gap-3">
                  {(task.commentsCount ?? task.comments.length) > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageSquare size={12} /> {task.commentsCount ?? task.comments.length}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition" />
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </main>

      {/* Task Detail Slide-Over */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#0c0c12] border-l border-white/5 z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
                  >
                    <ArrowLeft size={16} /> Geri
                  </button>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-2 rounded-lg hover:bg-white/5 transition"
                  >
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>

                {/* Task Info */}
                <h2 className="text-xl font-bold mb-4">{selectedTask.title}</h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${priorityConfig[selectedTask.priority].bg} ${priorityConfig[selectedTask.priority].color}`}>
                    {priorityConfig[selectedTask.priority].label} Oncelik
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusConfig[selectedTask.status].bg} ${statusConfig[selectedTask.status].color}`}>
                    {statusConfig[selectedTask.status].label}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${labelConfig[selectedTask.label].bg} ${labelConfig[selectedTask.label].color}`}>
                    {labelConfig[selectedTask.label].label}
                  </span>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-gray-500 mb-1">Proje</div>
                    <div className="text-sm font-medium">{selectedTask.project}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-gray-500 mb-1">Olusturan</div>
                    <div className="text-sm font-medium">{selectedTask.createdBy}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-gray-500 mb-1">Olusturma Tarihi</div>
                    <div className="text-sm font-medium">{formatDate(selectedTask.createdAt)}</div>
                  </div>
                  {selectedTask.deadline && (
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="text-[10px] text-gray-500 mb-1">Deadline</div>
                      <div className="text-sm font-medium">{formatDate(selectedTask.deadline)}</div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Aciklama</h3>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-gray-400 leading-relaxed">
                    {selectedTask.description || "Aciklama eklenmemis."}
                  </div>
                </div>

                {/* Developer Notes (read-only) */}
                {selectedTask.devNote && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Gelistirici Notu</h3>
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-sm text-blue-300 leading-relaxed">
                      {selectedTask.devNote}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <Paperclip size={14} /> Ekler ({selectedTask.attachments.length + (uploadedFiles[`${selectedTask.project}-${selectedTask.id}`]?.length ?? 0)})
                  </h3>
                  {selectedTask.attachments.length === 0 && (uploadedFiles[`${selectedTask.project}-${selectedTask.id}`]?.length ?? 0) === 0 ? (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-gray-500 text-center">
                      Henuz ek bulunmuyor.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedTask.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition text-sm"
                        >
                          <FileText size={16} className="text-gray-400" />
                          <span className="text-gray-300">{att.name}</span>
                          <span className="text-[10px] text-gray-500 ml-auto">{att.date}</span>
                        </a>
                      ))}
                      {(uploadedFiles[`${selectedTask.project}-${selectedTask.id}`] ?? []).map((f, i) => (
                        <a
                          key={`uploaded-${i}`}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10 hover:border-green-500/20 transition text-sm"
                        >
                          {f.type === "image" ? (
                            <img src={f.url} alt={f.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <FileText size={16} className="text-green-400" />
                          )}
                          <span className="text-gray-300">{f.name}</span>
                          <span className="text-[10px] text-green-400 ml-auto">Yuklendi</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => handleFileSelect(selectedTask)}
                    disabled={uploading}
                    className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-blue-500/30 text-gray-400 hover:text-white text-sm transition disabled:opacity-50 w-full justify-center"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                    {uploading ? "Yukleniyor..." : "Dosya Yukle"}
                  </button>
                  <p className="text-[10px] text-gray-600 mt-1 text-center">PNG, JPEG, PDF, Word, Excel - Maks. 10MB</p>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <MessageSquare size={14} /> Yorumlar ({taskComments.length})
                  </h3>

                  {loadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="text-blue-400 animate-spin" />
                    </div>
                  ) : taskComments.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {taskComments.map((c) => (
                        <div
                          key={c.id}
                          className={`p-3 rounded-xl border text-sm ${
                            c.authorRole === "customer"
                              ? "bg-purple-500/5 border-purple-500/10"
                              : c.authorRole === "developer"
                              ? "bg-blue-500/5 border-blue-500/10"
                              : "bg-white/[0.02] border-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-300">{c.author}</span>
                            <span className="text-[10px] text-gray-500">{formatDate(c.date)}</span>
                          </div>
                          <p className="text-gray-400 leading-relaxed">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-4" />
                  )}

                  {/* Add comment */}
                  <div className="flex gap-2">
                    <input
                      placeholder="Yorum yazin..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition disabled:opacity-30"
                    >
                      {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateForm(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#111118] border border-white/5 rounded-2xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Yeni Talep Olustur</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Baslik</label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Talep basligi..."
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none text-sm transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Aciklama</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Detayli aciklama..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none text-sm resize-none transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Oncelik</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as Priority)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor-pointer transition"
                    >
                      {(Object.entries(priorityConfig) as [Priority, { label: string }][]).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Etiket</label>
                    <select
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value as Label)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor-pointer transition"
                    >
                      {(Object.entries(labelConfig) as [Label, { label: string }][]).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-gray-500 mb-1">Proje</div>
                    <div className="text-sm font-medium">{customerData!.project}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-gray-500 mb-1">Musteri</div>
                    <div className="text-sm font-medium">{customerData!.name}</div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingTicket ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {submittingTicket ? "Olusturuluyor..." : "Talep Olustur"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
