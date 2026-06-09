"use client";
import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Mic, RefreshCw, CheckCircle2, Clock, ExternalLink, User } from "lucide-react";

interface SupportMessage {
  role: "user" | "assistant";
  content: string;
  at?: string;
}
interface SupportRequest {
  id: string;
  channel: "chat" | "voice";
  customerName?: string;
  customerEmail?: string;
  summary?: string;
  transcript: SupportMessage[];
  meta?: Record<string, unknown>;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
  externalId?: string;
}

export default function SupportRequestsPage() {
  const [items, setItems] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SupportRequest | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "resolved" | "chat" | "voice">("open");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/admin/support-requests", { cache: "no-store" });
      const data = await r.json();
      if (r.ok && Array.isArray(data.items)) setItems(data.items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(req: SupportRequest) {
    const newStatus = req.status === "open" ? "resolved" : "open";
    const r = await fetch("/api/admin/support-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: req.id, status: newStatus }),
    });
    if (r.ok) {
      setItems((prev) => prev.map((i) => (i.id === req.id ? { ...i, status: newStatus } : i)));
      if (selected?.id === req.id) setSelected({ ...req, status: newStatus });
    }
  }

  const filtered = items.filter((i) => {
    if (filter === "open") return i.status === "open";
    if (filter === "resolved") return i.status === "resolved";
    if (filter === "chat") return i.channel === "chat";
    if (filter === "voice") return i.channel === "voice";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Destek Talepleri</h1>
          <p className="text-sm text-gray-400">
            Canlı Destek (Eylül chat) ve Bizi Ara (Vapi voice) üzerinden gelen tüm konuşmalar.
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111118] border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition disabled:opacity-50"
        >
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Yenile
        </button>
      </header>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { key: "open", label: `Açık (${items.filter((i) => i.status === "open").length})` },
          { key: "resolved", label: `Çözüldü (${items.filter((i) => i.status === "resolved").length})` },
          { key: "chat", label: `Chat (${items.filter((i) => i.channel === "chat").length})` },
          { key: "voice", label: `Voice (${items.filter((i) => i.channel === "voice").length})` },
          { key: "all", label: `Tümü (${items.length})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === f.key
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                : "bg-[#111118] text-gray-400 border border-white/5 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* LIST */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto thin-scrollbar pr-1">
          {filtered.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#111118] border border-white/5 text-center text-sm text-gray-500">
              Bu filtrede talep yok.
            </div>
          ) : (
            filtered.map((req) => {
              const isActive = selected?.id === req.id;
              const dateLbl = new Date(req.updatedAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
              const ChannelIcon = req.channel === "chat" ? MessageSquare : Mic;
              return (
                <button
                  key={req.id}
                  onClick={() => setSelected(req)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    isActive
                      ? "bg-blue-500/10 border-blue-500/40"
                      : "bg-[#111118] border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <ChannelIcon
                        size={14}
                        className={req.channel === "chat" ? "text-blue-400 flex-shrink-0" : "text-purple-400 flex-shrink-0"}
                      />
                      <span className="text-xs font-medium text-white truncate">
                        {req.customerName || (req.channel === "voice" ? (req.meta?.phone as string) || "Anonim arama" : "Anonim ziyaretçi")}
                      </span>
                    </div>
                    {req.status === "open" ? (
                      <Clock size={12} className="text-amber-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate mb-1">{req.summary || "Konuşma özeti yok"}</p>
                  <p className="text-[10px] text-gray-600">{dateLbl}</p>
                </button>
              );
            })
          )}
        </div>

        {/* DETAIL */}
        <div className="lg:sticky lg:top-6 h-fit max-h-[80vh] overflow-y-auto thin-scrollbar">
          {!selected ? (
            <div className="p-12 rounded-2xl bg-[#111118] border border-white/5 text-center text-sm text-gray-500">
              Sol listeden bir talep seç.
            </div>
          ) : (
            <div className="rounded-2xl bg-[#111118] border border-white/5">
              <header className="p-4 border-b border-white/5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {selected.channel === "chat" ? (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          Chat
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          Voice
                        </span>
                      )}
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                          selected.status === "open"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {selected.status === "open" ? "Açık" : "Çözüldü"}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      <User size={14} className="text-gray-500" />
                      {selected.customerName || (selected.channel === "voice" ? (selected.meta?.phone as string) || "Anonim arama" : "Anonim ziyaretçi")}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(selected.createdAt).toLocaleString("tr-TR")} → {new Date(selected.updatedAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleStatus(selected)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      selected.status === "open"
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                    }`}
                  >
                    {selected.status === "open" ? "Çözüldü işaretle" : "Yeniden aç"}
                  </button>
                </div>
                {selected.summary && (
                  <div className="mt-3 p-3 rounded-lg bg-[#0a0a0f] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Özet</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{selected.summary}</p>
                  </div>
                )}
                {selected.channel === "voice" && selected.meta && (
                  <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px] text-gray-500">
                    {typeof selected.meta.cost === "number" && (
                      <span>Maliyet: ${(selected.meta.cost as number).toFixed(3)}</span>
                    )}
                    {typeof selected.meta.endedReason === "string" && (
                      <span>Bitiş: {selected.meta.endedReason as string}</span>
                    )}
                    {typeof selected.meta.recordingUrl === "string" && (
                      <a
                        href={selected.meta.recordingUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        Ses kaydı <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}
              </header>

              <div className="p-4 space-y-3">
                {selected.transcript.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">Transcript boş.</p>
                ) : (
                  selected.transcript.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                          m.role === "user"
                            ? "bg-blue-500/15 border border-blue-500/30 text-white"
                            : "bg-[#0a0a0f] border border-white/5 text-gray-200"
                        }`}
                      >
                        <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
                          {m.role === "user" ? "Müşteri" : "Eylül"}
                        </p>
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
