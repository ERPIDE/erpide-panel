"use client";
import { useState, useEffect, useRef } from "react";
import {
  Ticket, Plus, Send, ChevronLeft, Loader2,
  Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare, User,
} from "lucide-react";

type TicketMessage = {
  id: string;
  role: "user" | "admin";
  authorName: string | null;
  content: string;
  createdAt: string;
};

type TicketItem = {
  id: string;
  productId: string | null;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

const PRODUCTS = [
  { id: "finanserpide", label: "FinansERPIDE" },
  { id: "captchaerpide", label: "CaptchaERPIDE" },
  { id: "pocketerpide", label: "PocketERPIDE" },
  { id: "dataengine", label: "Data Engine" },
  { id: "", label: "Genel / Diğer" },
];

const statusConfig: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  open:        { label: "Açık",    cls: "bg-blue-500/20 text-blue-400",   icon: Clock },
  in_progress: { label: "İşlemde", cls: "bg-yellow-500/20 text-yellow-400", icon: AlertTriangle },
  closed:      { label: "Kapalı",  cls: "bg-gray-500/20 text-gray-400",   icon: XCircle },
};

function fmtTime(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtFull(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function DestekPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "detail" | "new">("list");
  const [selected, setSelected] = useState<TicketItem | null>(null);
  const [newReply, setNewReply] = useState("");
  const [sending, setSending] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [productId, setProductId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTickets(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (view === "detail" && selected) {
      fetch(`/api/tickets/${selected.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.id) {
            setSelected(data);
            setTickets((prev) => prev.map((t) => (t.id === data.id ? data : t)));
          }
        });
    }
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages?.length]);

  const openDetail = (t: TicketItem) => {
    setSelected(t);
    setView("detail");
  };

  const sendReply = async () => {
    if (!selected || !newReply.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newReply }),
    });
    if (res.ok) {
      setNewReply("");
      // Güncelle
      const updated = await fetch(`/api/tickets/${selected.id}`).then((r) => r.json());
      if (updated.id) {
        setSelected(updated);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }
    }
    setSending(false);
  };

  const createTicket = async () => {
    setError("");
    if (!subject.trim() || !content.trim()) {
      setError("Konu ve mesaj alanları zorunludur.");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, content, productId: productId || null, priority }),
    });
    if (res.ok) {
      const newTicket = await res.json();
      setTickets((prev) => [newTicket, ...prev]);
      setSubject(""); setContent(""); setProductId(""); setPriority("normal");
      setSelected(newTicket);
      setView("detail");
    } else {
      const data = await res.json();
      setError(data.error || "Bir hata oluştu.");
    }
    setCreating(false);
  };

  // ── LIST ──────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Destek Talepleri</h2>
            <p className="text-sm text-gray-500 mt-0.5">Sorularınızı ve sorunlarınızı bize iletebilirsiniz.</p>
          </div>
          <button
            onClick={() => setView("new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
          >
            <Plus size={16} /> Yeni Ticket
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-blue-400 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl bg-[#111118] border border-white/5 p-12 text-center">
            <Ticket size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Henüz destek talebiniz yok.</p>
            <p className="text-sm text-gray-600 mt-1">Bir sorun yaşıyorsanız yeni ticket açabilirsiniz.</p>
            <button
              onClick={() => setView("new")}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm transition"
            >
              İlk Ticketı Aç
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden divide-y divide-white/5">
            {tickets.map((t) => {
              const cfg = statusConfig[t.status] || statusConfig.open;
              const Icon = cfg.icon;
              const lastMsg = t.messages[t.messages.length - 1];
              const hasAdminReply = t.messages.some((m) => m.role === "admin");
              return (
                <button
                  key={t.id}
                  onClick={() => openDetail(t)}
                  className="w-full px-5 py-4 text-left hover:bg-white/[0.02] transition flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.cls}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                      {t.priority === "urgent" && <span className="text-[10px] text-red-400">⚡ Acil</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {t.productId && (
                        <span className="text-xs text-purple-400">{PRODUCTS.find((p) => p.id === t.productId)?.label || t.productId}</span>
                      )}
                      <span className="text-xs text-gray-600">{fmtTime(t.updatedAt)}</span>
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {lastMsg.role === "admin" ? "💬 ERPIDE: " : ""}{lastMsg.content}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                    {hasAdminReply && <span className="text-[10px] text-green-400">Yanıtlandı</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── DETAIL ────────────────────────────────────────────────────────
  if (view === "detail" && selected) {
    const cfg = statusConfig[selected.status] || statusConfig.open;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView("list"); setSelected(null); }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
          >
            <ChevronLeft size={16} /> Geri
          </button>
          <h2 className="text-lg font-bold text-white truncate">{selected.subject}</h2>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
        </div>

        <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden flex flex-col" style={{ minHeight: "500px" }}>
          {/* Messages */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
            {selected.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2">
                    {msg.role === "admin"
                      ? <MessageSquare size={12} className="text-blue-400" />
                      : <User size={12} className="text-gray-500" />
                    }
                    <span className="text-xs text-gray-500">
                      {msg.role === "admin" ? (msg.authorName || "ERPIDE Destek") : "Siz"}
                    </span>
                    <span className="text-[10px] text-gray-600">{fmtFull(msg.createdAt)}</span>
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600/20 text-blue-50 rounded-tr-sm"
                        : "bg-white/5 text-gray-200 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply */}
          {selected.status !== "closed" ? (
            <div className="px-5 py-4 border-t border-white/5">
              <div className="flex gap-3">
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply(); }}
                  rows={3}
                  placeholder="Ek bilgi veya güncelleme ekleyin... (Cmd/Ctrl+Enter)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={!newReply.trim() || sending}
                  className="self-end px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 border-t border-white/5 text-center text-sm text-gray-600">
              Bu destek talebi kapatılmıştır. Yeni bir sorun için <button onClick={() => setView("new")} className="text-blue-400 hover:underline">yeni ticket açın</button>.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── NEW TICKET ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
        >
          <ChevronLeft size={16} /> Geri
        </button>
        <h2 className="text-xl font-bold text-white">Yeni Destek Talebi</h2>
      </div>

      <div className="rounded-2xl bg-[#111118] border border-white/5 p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Product */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Ürün</label>
          <div className="flex flex-wrap gap-2">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProductId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-sm border transition ${
                  productId === p.id
                    ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                    : "bg-white/5 text-gray-400 border-transparent hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Öncelik</label>
          <div className="flex gap-2">
            {[
              { key: "normal", label: "Normal" },
              { key: "urgent", label: "⚡ Acil" },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPriority(p.key)}
                className={`px-3 py-1.5 rounded-xl text-sm border transition ${
                  priority === p.key
                    ? p.key === "urgent"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-white/10 text-white border-white/20"
                    : "bg-white/5 text-gray-400 border-transparent hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Konu <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Sorununuzu kısaca özetleyin"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Mesaj <span className="text-red-400">*</span></label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Sorununuzu detaylı açıklayın. Hata mesajlarını veya adımları ekleyin."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setView("list")}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition"
          >
            İptal
          </button>
          <button
            onClick={createTicket}
            disabled={creating || !subject.trim() || !content.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium transition"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
            Talebi Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
