"use client";
import { useState, useEffect, useRef } from "react";
import {
  Ticket, RefreshCw, Loader2, Send, CheckCircle2, Clock,
  AlertTriangle, XCircle, ChevronRight, MessageSquare, User,
} from "lucide-react";

type TicketMessage = {
  id: string;
  ticketId: string;
  role: "user" | "admin";
  authorName: string | null;
  content: string;
  createdAt: string;
};

type TicketUser = {
  id: string;
  name: string;
  surname: string;
  email: string;
} | null;

type TicketItem = {
  id: string;
  userId: string;
  productId: string | null;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  user: TicketUser;
};

const statusConfig: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  open:        { label: "Açık",       cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",     icon: Clock },
  in_progress: { label: "İşlemde",    cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertTriangle },
  closed:      { label: "Kapalı",     cls: "bg-gray-500/20 text-gray-400 border-gray-500/30",     icon: XCircle },
};

const priorityConfig: Record<string, { label: string; cls: string }> = {
  normal: { label: "Normal", cls: "text-gray-400" },
  urgent: { label: "Acil", cls: "text-red-400" },
};

function fmtTime(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TicketItem | null>(null);
  const [filter, setFilter] = useState("all");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    const q = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/admin/tickets${q}`)
      .then((r) => r.json())
      .then((data: TicketItem[]) => {
        setTickets(data);
        // Seçili ticket varsa güncelle
        if (selected) {
          const updated = data.find((t) => t.id === selected.id);
          if (updated) setSelected(updated);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages?.length]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const res = await fetch(`/api/admin/tickets/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply }),
    });
    if (res.ok) {
      setReply("");
      load();
    }
    setSending(false);
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    await fetch(`/api/admin/tickets/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const filtered = tickets; // filtering done server-side via query param

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Destek Ticketları</h1>
          <p className="text-sm text-gray-500 mt-1">Kullanıcı destek talepleri</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "all", label: "Tümü" },
          { key: "open", label: "Açık" },
          { key: "in_progress", label: "İşlemde" },
          { key: "closed", label: "Kapalı" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setSelected(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f.key
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4" style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}>
        {/* Ticket List */}
        <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="text-blue-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <Ticket size={24} className="mx-auto mb-2 text-gray-600" />
              Ticket bulunamadı.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((t) => {
                const cfg = statusConfig[t.status] || statusConfig.open;
                const Icon = cfg.icon;
                const isSelected = selected?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`w-full px-4 py-3.5 text-left transition ${
                      isSelected ? "bg-blue-600/10 border-l-2 border-blue-500" : "hover:bg-white/[0.02] border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {t.user ? `${t.user.name} ${t.user.surname}` : t.userId}
                        </p>
                        {t.productId && (
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                            {t.productId}
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.cls}`}>
                          <Icon size={9} /> {cfg.label}
                        </span>
                        <span className="text-[10px] text-gray-600">{fmtTime(t.updatedAt)}</span>
                      </div>
                    </div>
                    {t.messages.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1.5 truncate">
                        {t.messages[t.messages.length - 1]?.content}
                      </p>
                    )}
                    {t.priority === "urgent" && (
                      <span className="mt-1 inline-block text-[10px] text-red-400 font-medium">⚡ Acil</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="rounded-2xl bg-[#111118] border border-white/5 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
              <ChevronRight size={32} className="text-gray-600" />
              <p className="text-sm">Sol taraftan bir ticket seçin</p>
            </div>
          ) : (
            <>
              {/* Ticket Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{selected.subject}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {selected.user && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <User size={11} />
                        {selected.user.name} {selected.user.surname} · {selected.user.email}
                      </span>
                    )}
                    {selected.productId && (
                      <span className="text-xs text-purple-400">{selected.productId}</span>
                    )}
                    <span className={`text-xs font-medium ${priorityConfig[selected.priority]?.cls || "text-gray-400"}`}>
                      {priorityConfig[selected.priority]?.label}
                    </span>
                  </div>
                </div>
                {/* Status Actions */}
                <div className="flex gap-2 shrink-0">
                  {selected.status !== "in_progress" && (
                    <button
                      onClick={() => updateStatus("in_progress")}
                      className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs hover:bg-yellow-500/20 transition"
                    >
                      İşleme Al
                    </button>
                  )}
                  {selected.status !== "closed" && (
                    <button
                      onClick={() => updateStatus("closed")}
                      className="px-3 py-1.5 rounded-lg bg-gray-500/10 text-gray-400 text-xs hover:bg-gray-500/20 transition"
                    >
                      Kapat
                    </button>
                  )}
                  {selected.status === "closed" && (
                    <button
                      onClick={() => updateStatus("open")}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition"
                    >
                      Yeniden Aç
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selected.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] ${msg.role === "admin" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className="flex items-center gap-2">
                        {msg.role === "user" ? (
                          <User size={12} className="text-gray-500" />
                        ) : (
                          <MessageSquare size={12} className="text-blue-400" />
                        )}
                        <span className="text-xs text-gray-500">{msg.authorName || (msg.role === "admin" ? "ERPIDE Destek" : "Kullanıcı")}</span>
                        <span className="text-[10px] text-gray-600">{fmtTime(msg.createdAt)}</span>
                      </div>
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm ${
                          msg.role === "admin"
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

              {/* Reply Box */}
              {selected.status !== "closed" ? (
                <div className="px-5 py-4 border-t border-white/5">
                  <div className="flex gap-3">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply(); }}
                      rows={3}
                      placeholder="Yanıtınızı yazın... (Cmd/Ctrl+Enter ile gönder)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim() || sending}
                      className="self-end px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4 border-t border-white/5 text-center text-sm text-gray-600">
                  Bu ticket kapalı. Yanıtlamak için önce yeniden açın.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
