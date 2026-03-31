"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Calendar,
  Mail,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  MessageSquare,
  ChevronDown,
  FileDown,
  Send,
  Loader2,
} from "lucide-react";
import { Task, statusConfig, priorityConfig, labelConfig } from "@/lib/store";
import Logo from "@/components/Logo";

interface PastReport {
  id: string;
  title: string;
  dateRange: string;
  status: "sent" | "draft";
}

const pastReports: PastReport[] = [
  {
    id: "pr1",
    title: "Sirmersan Haftalık Döküm",
    dateRange: "09.03.2026 - 28.03.2026",
    status: "sent",
  },
  {
    id: "pr2",
    title: "ATM Constructor Aylık Rapor",
    dateRange: "Mart 2026",
    status: "sent",
  },
];

const clientOptions = [
  { value: "all", label: "Tüm Müşteriler", project: "" },
  { value: "Sirmersan", label: "Sirmersan — CANIAS", project: "CANIAS" },
  { value: "ATM Constructor", label: "ATM Constructor — 1C ERP", project: "1C ERP" },
];

export default function ReportsPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("2026-03-09");
  const [endDate, setEndDate] = useState("2026-03-30");
  const [selectedClient, setSelectedClient] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data: Task[]) => {
        setAllTasks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const taskDate = new Date(task.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const inRange = taskDate >= start && taskDate <= end;

      if (!inRange) return false;
      if (selectedClient !== "all" && task.client !== selectedClient) return false;
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      return true;
    });
  }, [allTasks, startDate, endDate, selectedClient, statusFilter]);

  const pdfTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === "done");
  }, [filteredTasks]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status === "done").length;
    const inProgress = filteredTasks.filter((t) => t.status === "in_progress").length;
    const waiting = filteredTasks.filter((t) => t.status === "todo").length;
    return { total, completed, inProgress, waiting };
  }, [filteredTasks]);

  const clientLabel = clientOptions.find((c) => c.value === selectedClient)?.label ?? "Tüm Müşteriler";

  const formatDateTR = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleGenerate = () => {
    setShowReport(true);
  };

  const getLatestDevComment = (task: Task) => {
    const devComments = task.comments.filter((c) => c.authorRole === "developer");
    if (devComments.length === 0) return null;
    return devComments[devComments.length - 1];
  };

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
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Raporlar</h1>
        <p className="text-sm text-gray-500 mt-1">
          Haftalık geliştirme dökümanları ve proje raporları oluşturun
        </p>
      </motion.div>

      {/* 1. Report Configuration Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="p-6 rounded-2xl bg-[#111118] border border-white/5"
      >
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <Filter size={18} className="text-blue-400" />
          Rapor Yapılandırması
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Başlangıç Tarihi</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 transition [color-scheme:dark]"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Bitiş Tarihi</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 transition [color-scheme:dark]"
            />
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Müşteri / Proje</label>
            <div className="relative">
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 transition appearance-none [color-scheme:dark]"
              >
                {clientOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#111118] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Durum</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 transition appearance-none [color-scheme:dark]"
              >
                <option value="all" className="bg-[#111118] text-white">Tüm Durumlar</option>
                <option value="done" className="bg-[#111118] text-white">Tamamlanan</option>
                <option value="in_progress" className="bg-[#111118] text-white">Devam Eden</option>
                <option value="todo" className="bg-[#111118] text-white">Bekleyen</option>
                <option value="review" className="bg-[#111118] text-white">İncelemede</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
            >
              <FileText size={15} />
              Rapor Oluştur
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Generated Report Preview */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-4"
          >
            {/* Action Buttons */}
            <div className="flex items-center gap-3 print:hidden">
              <button
                onClick={() => {
                  // Remove old iframe if exists
                  const oldFrame = document.getElementById("print-frame");
                  if (oldFrame) oldFrame.remove();

                  const iframe = document.createElement("iframe");
                  iframe.id = "print-frame";
                  iframe.style.position = "fixed";
                  iframe.style.right = "0";
                  iframe.style.bottom = "0";
                  iframe.style.width = "0";
                  iframe.style.height = "0";
                  iframe.style.border = "0";
                  document.body.appendChild(iframe);

                  const win = iframe.contentWindow;
                  if (!win) return;
                  win.document.open();
                  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ERPIDE Rapor - ${clientLabel}</title><style>
                    @page { margin: 20mm 15mm; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; background: #fff; font-size: 11pt; line-height: 1.6; }
                    .report-header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 15px; margin-bottom: 20px; }
                    .report-header h1 { font-size: 14pt; font-weight: bold; letter-spacing: 2px; margin-bottom: 2px; }
                    .report-header .logo-text { font-size: 22pt; font-weight: bold; letter-spacing: 4px; }
                    .report-header .logo-text span { color: #3b82f6; }
                    .report-header .tagline { font-size: 7pt; letter-spacing: 3px; color: #666; text-transform: uppercase; }
                    .report-header .subtitle { font-size: 12pt; margin-top: 8px; }
                    .report-header .date-range { font-size: 9pt; color: #666; margin-top: 3px; }
                    .stats-row { display: flex; gap: 15px; margin: 15px 0; }
                    .stat-box { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; }
                    .stat-box .val { font-size: 18pt; font-weight: bold; }
                    .stat-box .lbl { font-size: 8pt; color: #666; }
                    .task-item { border: 1px solid #eee; border-radius: 6px; padding: 12px; margin-bottom: 10px; page-break-inside: avoid; }
                    .task-item h3 { font-size: 11pt; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; }
                    .task-item .field { margin-bottom: 4px; font-size: 10pt; }
                    .task-item .field .label { font-weight: 600; color: #444; }
                    .task-item .dev-note { background: #f0f7ff; border-left: 3px solid #3b82f6; padding: 8px 10px; margin-top: 6px; font-size: 9pt; border-radius: 3px; }
                    .badge { display: inline-block; padding: 1px 8px; border-radius: 3px; font-size: 8pt; font-weight: 600; }
                    .badge-done { background: #dcfce7; color: #166534; }
                    .badge-progress { background: #fef9c3; color: #854d0e; }
                    .badge-todo { background: #f3f4f6; color: #4b5563; }
                    .badge-review { background: #dbeafe; color: #1e40af; }
                    .badge-critical { background: #fee2e2; color: #991b1b; }
                    .badge-high { background: #ffedd5; color: #9a3412; }
                    .badge-medium { background: #fef9c3; color: #854d0e; }
                    .badge-low { background: #f3f4f6; color: #4b5563; }
                    .report-footer { text-align: center; border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 25px; font-size: 8pt; color: #666; }
                  </style></head><body>`);

                  const statusLabels: Record<string, string> = { todo: "Bekliyor", in_progress: "Devam Ediyor", review: "İncelemede", done: "Tamamlandı" };
                  const priorityLabels: Record<string, string> = { critical: "Kritik", high: "Yüksek", medium: "Orta", low: "Düşük" };

                  win.document.write(`
                    <div class="report-header">
                      <svg viewBox="0 0 200 55" width="200" height="55" style="margin:0 auto 5px;display:block;">
                        <defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3b82f6"/><stop offset="100%" style="stop-color:#8b5cf6"/></linearGradient></defs>
                        <path d="M78 15L85 6L92 12L100 0L108 12L115 6L122 15" stroke="url(#g1)" stroke-width="2" fill="none" stroke-linecap="round"/>
                        <circle cx="85" cy="5.5" r="1.5" fill="url(#g1)"/><circle cx="100" cy="0" r="1.5" fill="url(#g1)"/><circle cx="115" cy="5.5" r="1.5" fill="url(#g1)"/>
                        <line x1="60" y1="20" x2="140" y2="20" stroke="#1a1a1a" stroke-width="0.8" opacity="0.3"/>
                        <text x="88" y="42" font-family="Georgia,serif" font-size="24" font-weight="bold" fill="#1a1a1a" text-anchor="end" letter-spacing="3">ERP</text>
                        <text x="90" y="42" font-family="Georgia,serif" font-size="18" font-weight="bold" fill="url(#g1)" letter-spacing="2">IDE</text>
                        <line x1="60" y1="47" x2="140" y2="47" stroke="#1a1a1a" stroke-width="0.8" opacity="0.3"/>
                      </svg>
                      <div class="tagline">ERP Çözümleri Hakkında Her Şey</div>
                      <div class="subtitle">Haftalık Geliştirme Dökümanı</div>
                      <div class="date-range">${formatDateTR(startDate)} — ${formatDateTR(endDate)} | ${clientLabel}</div>
                    </div>
                    <div class="stats-row">
                      <div class="stat-box"><div class="val">${stats.total}</div><div class="lbl">Toplam</div></div>
                      <div class="stat-box"><div class="val" style="color:#16a34a">${stats.completed}</div><div class="lbl">Tamamlanan</div></div>
                      <div class="stat-box"><div class="val" style="color:#ca8a04">${stats.inProgress}</div><div class="lbl">Devam Eden</div></div>
                      <div class="stat-box"><div class="val" style="color:#6b7280">${stats.waiting}</div><div class="lbl">Bekleyen</div></div>
                    </div>
                  `);

                  const tasksForPdf = filteredTasks.filter(t => t.status === "done");
                  if (tasksForPdf.length === 0) {
                    win.document.write('<p style="text-align:center;color:#999;padding:30px;">Seçilen tarih aralığında tamamlanmış görev bulunamadı.</p>');
                  }
                  tasksForPdf.forEach((task, i) => {
                    const devComments = task.comments.filter(c => c.authorRole === "developer");
                    const devComment = devComments.length > 0 ? devComments[devComments.length - 1] : null;
                    const statusBadge = task.status === "done" ? "badge-done" : task.status === "in_progress" ? "badge-progress" : task.status === "review" ? "badge-review" : "badge-todo";
                    const priorityBadge = `badge-${task.priority}`;

                    const attachmentHtml = (task.attachments && task.attachments.length > 0)
                      ? `<div class="field" style="margin-top:8px">
                          <span class="label">Ekler:</span>
                          <div style="margin-top:6px">${task.attachments.map(a =>
                            a.type === "image"
                              ? `<div style="margin-bottom:8px"><img src="${a.url}" alt="${a.name}" style="max-width:100%;max-height:300px;border:1px solid #ddd;border-radius:6px" /><br><small style="color:#666">${a.name}</small></div>`
                              : `<div style="margin-bottom:4px"><a href="${a.url}" style="color:#2563eb">${a.name}</a></div>`
                          ).join("")}</div>
                        </div>`
                      : "";

                    win.document.write(`
                      <div class="task-item">
                        <h3>Sorun ${i + 1}: ${task.title}</h3>
                        <div class="field"><span class="label">Açıklama:</span> ${task.description}</div>
                        <div class="field"><span class="label">Çözüm:</span> ${task.devNote || "<em style='color:#999'>Çözüm bekleniyor</em>"}</div>
                        <div class="field">
                          <span class="label">Durum:</span> <span class="badge ${statusBadge}">${statusLabels[task.status] || task.status}</span>
                          &nbsp;&nbsp;<span class="label">Öncelik:</span> <span class="badge ${priorityBadge}">${priorityLabels[task.priority] || task.priority}</span>
                        </div>
                        ${devComment ? `<div class="dev-note"><strong>Geliştirmeci Notu:</strong> ${devComment.text}</div>` : ""}
                        ${attachmentHtml}
                      </div>
                    `);
                  });

                  win.document.write(`
                    <div class="report-footer">
                      <strong>ERPIDE YAZILIM A.Ş.</strong><br>
                      info@erpide.com — 0554 694 34 09<br>
                      www.erpide.com
                    </div>
                  </body></html>`);
                  win.document.close();
                  setTimeout(() => {
                    try { win.print(); } catch(e) { window.print(); }
                  }, 600);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 text-sm hover:bg-blue-600/20 transition border border-blue-500/10"
              >
                <FileDown size={15} />
                PDF İndir / Yazdır
              </button>
              <button
                onClick={() => alert("Email gönderme özelliği yakında aktif olacak.\ninfo@erpide.com adresine bildirim gönderilecek.")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/10 text-purple-400 text-sm hover:bg-purple-600/20 transition border border-purple-500/10"
              >
                <Send size={15} />
                Email Gönder
              </button>
            </div>

            {/* Report Document */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-[#16161e] border border-white/5 overflow-hidden"
            >
              {/* Report Header */}
              <div className="p-8 border-b border-white/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <Logo size="default" />
                    <div className="ml-4">
                      <h2 className="text-xl font-bold text-white">Haftalık Geliştirme Dökümanı</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        {formatDateTR(startDate)} — {formatDateTR(endDate)}
                      </p>
                      <p className="text-sm text-blue-400 mt-0.5">{clientLabel}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-8 border-b border-white/5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 text-center"
                >
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-gray-400 mt-1">Toplam Görev</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 text-center"
                >
                  <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 size={12} /> Tamamlanan
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-center"
                >
                  <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                    <Clock size={12} /> Devam Eden
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-xl bg-gray-500/5 border border-gray-500/10 text-center"
                >
                  <div className="text-2xl font-bold text-gray-400">{stats.waiting}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                    <AlertCircle size={12} /> Bekleyen
                  </div>
                </motion.div>
              </div>

              {/* Task Details */}
              <div className="p-8 space-y-6">
                {filteredTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Seçilen tarih aralığında görev bulunamadı.
                  </p>
                ) : (
                  filteredTasks.map((task, index) => {
                    const devComment = getLatestDevComment(task);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.04 }}
                        className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3"
                      >
                        {/* Task Title */}
                        <h3 className="text-sm font-semibold text-white">
                          Sorun {index + 1}: {task.title}
                        </h3>

                        {/* Description */}
                        <div className="text-sm text-gray-400">
                          <span className="text-gray-500 font-medium">Açıklama: </span>
                          {task.description}
                        </div>

                        {/* Solution */}
                        <div className="text-sm text-gray-400">
                          <span className="text-gray-500 font-medium">Çözüm: </span>
                          <span className={task.devNote ? "text-blue-300" : "text-gray-500 italic"}>
                            {task.devNote || "Çözüm bekleniyor"}
                          </span>
                        </div>

                        {/* Status & Priority Row */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">Durum:</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md ${statusConfig[task.status].bg} ${statusConfig[task.status].color}`}
                            >
                              {statusConfig[task.status].label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">Öncelik:</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].color}`}
                            >
                              {priorityConfig[task.priority].label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">Etiket:</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md ${labelConfig[task.label].bg} ${labelConfig[task.label].color}`}
                            >
                              {labelConfig[task.label].label}
                            </span>
                          </div>
                        </div>

                        {/* Developer Comment */}
                        {devComment && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                            <MessageSquare size={13} className="text-blue-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs text-blue-400 font-medium">Geliştirmeci Notu:</span>
                              <p className="text-xs text-gray-300 mt-0.5">{devComment.text}</p>
                              <p className="text-[10px] text-gray-600 mt-1">
                                {devComment.author} — {formatDateTR(devComment.date)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Attachments */}
                        {task.attachments.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Paperclip size={12} className="text-gray-500" />
                              <span className="text-xs text-gray-500">Ekler ({task.attachments.length})</span>
                            </div>
                            {task.attachments.map((att) => (
                              att.type === "image" ? (
                                <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="block">
                                  <img src={att.url} alt={att.name} className="max-w-full max-h-48 rounded-lg border border-white/10" />
                                  <span className="text-[10px] text-gray-500 mt-1 block">{att.name}</span>
                                </a>
                              ) : (
                                <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded bg-white/5 text-blue-400 border border-white/5 inline-block">
                                  {att.name}
                                </a>
                              )
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Report Footer */}
              <div className="px-8 py-5 border-t border-white/5 text-center">
                <p className="text-xs text-gray-600">
                  ERPIDE YAZILIM A.Ş. — info@erpide.com — 0554 694 34 09
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Past Reports Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-blue-400" />
          Geçmiş Raporlar
        </h2>
        <div className="space-y-2">
          {pastReports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-center justify-between p-4 rounded-xl bg-[#111118] border border-white/5 hover:border-white/10 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <FileText size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{report.title}</p>
                  <p className="text-xs text-gray-500">{report.dateRange}</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/10">
                Gönderildi
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
