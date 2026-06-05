"use client";
/**
 * erpide.com sağ-alt destek widget'ı — iki yan yana buton:
 *   🎤 Bizi Ara (Vapi voice call — TR/RU multilingual)
 *   💬 Yazılı Destek (Anthropic Claude chat — TR/RU)
 *
 * Voice ve chat ayrı paneller. Voice Vapi başarısız olursa chat fallback
 * olarak hep çalışır (kendi API key'imiz, kendi prompt'umuz).
 *
 * Env (NEXT_PUBLIC_VAPI_*): yoksa voice butonu hiç render edilmez.
 * Chat butonu daima görünür (server-side ANTHROPIC_API_KEY kullanır).
 */
import { useState, useRef, useEffect } from "react";
import { Mic, MessageSquare, PhoneOff, Loader2, X, Send, Bot } from "lucide-react";

type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";
type Panel = null | "voice" | "chat";

interface VoiceLine { role: "user" | "assistant"; text: string }
interface ChatMsg { role: "user" | "assistant"; content: string }


export default function SupportWidget() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const vapiReady = !!(publicKey && assistantId);

  const [panel, setPanel] = useState<Panel>(null);

  // ===== VOICE (Vapi) =====
  const [voiceStatus, setVoiceStatus] = useState<CallStatus>("idle");
  const [voiceError, setVoiceError] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState<VoiceLine[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);

  useEffect(() => {
    if (!vapiReady) return;
    let cancelled = false;
    (async () => {
      try {
        const { default: Vapi } = await import("@vapi-ai/web");
        if (cancelled) return;
        const v = new Vapi(publicKey!);
        vapiRef.current = v;
        v.on("call-start", () => { setVoiceStatus("active"); setVoiceError(""); });
        v.on("call-end", () => { setVoiceStatus("ended"); setIsSpeaking(false); });
        v.on("speech-start", () => setIsSpeaking(true));
        v.on("speech-end", () => setIsSpeaking(false));
        v.on("error", (e: unknown) => {
          // Vapi error event — JSON serialize ederek tüm field'ları yakala.
          let msg = "Sesli arama başlatılamadı";
          if (e instanceof Error) msg = e.message;
          else if (typeof e === "string") msg = e;
          else if (typeof e === "object" && e !== null) {
            const ee = e as Record<string, unknown>;
            msg = (typeof ee.errorMsg === "string" && ee.errorMsg) || (typeof ee.message === "string" && ee.message) || (typeof ee.error === "string" && ee.error) || JSON.stringify(e).slice(0, 200);
          }
          console.error("[Vapi error]", e);
          setVoiceError(msg);
          setVoiceStatus("error");
        });
        v.on("message", (m: { type: string; role?: string; transcript?: string; transcriptType?: string }) => {
          if (m.type === "transcript" && m.transcriptType === "final" && m.transcript && m.role) {
            setVoiceTranscript((prev) => [...prev, { role: m.role === "assistant" ? "assistant" : "user", text: m.transcript || "" }]);
          }
        });
      } catch (e) {
        console.error("[Vapi SDK load]", e);
      }
    })();
    return () => { cancelled = true; try { vapiRef.current?.stop?.(); } catch { /* noop */ } };
  }, [vapiReady, publicKey]);

  async function startVoice() {
    setPanel("voice");
    if (!vapiRef.current || !assistantId) {
      setVoiceError("AI sesli destek aktif değil — yazılı sohbetten devam edebilirsin.");
      setVoiceStatus("error");
      return;
    }
    setVoiceStatus("connecting"); setVoiceError(""); setVoiceTranscript([]);
    try {
      // Mikrofon iznini açıkça iste — bazı browser'lar Vapi'nin getUserMedia
      // çağrısını sessizce reddediyor.
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await vapiRef.current.start(assistantId);
    } catch (e) {
      let msg = "Mikrofon erişimi reddedildi veya bağlantı kurulamadı.";
      if (e instanceof Error) {
        if (e.name === "NotAllowedError") msg = "Mikrofon izni vermedin. Tarayıcı adres çubuğundan izin ver, sonra tekrar dene.";
        else if (e.name === "NotFoundError") msg = "Mikrofon bulunamadı. Cihaz bağlı mı kontrol et.";
        else msg = e.message;
      }
      console.error("[Voice start]", e);
      setVoiceError(msg);
      setVoiceStatus("error");
    }
  }
  function stopVoice() {
    try { vapiRef.current?.stop?.(); } catch { /* noop */ }
    setVoiceStatus("idle");
  }

  // ===== CHAT (Anthropic) =====
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMsgs, chatSending]);

  function openChat() {
    setPanel("chat");
    setChatError("");
    if (chatMsgs.length === 0) {
      setChatMsgs([{ role: "assistant", content: "Merhaba! ERPIDE'ye hoş geldin. Sana nasıl yardımcı olabilirim?" }]);
    }
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatSending) return;
    setChatInput("");
    setChatError("");
    const next = [...chatMsgs, { role: "user" as const, content: text }];
    setChatMsgs(next);
    setChatSending(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m.role === "user" || m.role === "assistant") }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setChatError(data.error || `Hata (${r.status})`);
        return;
      }
      setChatMsgs([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Bağlantı hatası");
    } finally {
      setChatSending(false);
    }
  }

  function resetChat() {
    if (chatMsgs.length > 1 && !confirm("Sohbeti baştan başlat?")) return;
    setChatMsgs([{ role: "assistant", content: "Merhaba! ERPIDE'ye hoş geldin. Sana nasıl yardımcı olabilirim?" }]);
    setChatError("");
  }

  return (
    <>
      {/* === VOICE PANEL === */}
      {panel === "voice" && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] max-h-[60vh] bg-[#0d0d14] border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-600/10 to-blue-600/10">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${voiceStatus === "active" ? "bg-green-400 animate-pulse" : voiceStatus === "connecting" ? "bg-amber-400 animate-pulse" : voiceStatus === "error" ? "bg-red-400" : "bg-gray-500"}`} />
              <span className="text-sm font-semibold text-white">
                {voiceStatus === "active" ? "Konuşma aktif" : voiceStatus === "connecting" ? "Bağlanıyor..." : voiceStatus === "ended" ? "Çağrı bitti" : voiceStatus === "error" ? "Hata" : "Hazır"}
              </span>
            </div>
            <button onClick={() => setPanel(null)} className="p-1 text-gray-400 hover:text-white" aria-label="Kapat"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 thin-scrollbar">
            {voiceStatus === "error" && voiceError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <p className="font-semibold mb-1">Sesli arama açılamadı</p>
                <p className="opacity-80 break-words">{voiceError}</p>
                <button onClick={openChat} className="mt-2 text-blue-300 underline">Yazılı sohbetten devam et →</button>
              </div>
            )}
            {voiceTranscript.length === 0 && voiceStatus !== "error" ? (
              <div className="text-center text-xs text-gray-500 py-8">
                {voiceStatus === "active"
                  ? <>Mikrofonun açık — konuş, ben dinliyorum.{isSpeaking && <p className="text-purple-300 mt-2">🔊 Yanıt veriyor...</p>}</>
                  : voiceStatus === "connecting" ? "Bağlanıyor, mikrofon iznini ver..." : "Konuşma başlayınca metin burada görünür."}
              </div>
            ) : (
              voiceTranscript.map((t, i) => (
                <div key={i} className={`text-xs ${t.role === "assistant" ? "" : "text-right"}`}>
                  <span className={`inline-block px-2.5 py-1.5 rounded-xl max-w-[85%] ${t.role === "assistant" ? "bg-[#111118] border border-purple-500/20 text-gray-200" : "bg-blue-500/15 border border-blue-500/30 text-white"}`}>{t.text}</span>
                </div>
              ))
            )}
          </div>
          {voiceStatus === "active" && (
            <button onClick={stopVoice} className="mx-3 mb-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/25 transition">
              <PhoneOff size={14} /> Çağrıyı Bitir
            </button>
          )}
          {voiceStatus === "error" && (
            <button onClick={startVoice} className="mx-3 mb-3 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-sm font-semibold hover:bg-purple-500/25 transition">
              Tekrar Dene
            </button>
          )}
        </div>
      )}

      {/* === CHAT PANEL === */}
      {panel === "chat" && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] h-[70vh] max-h-[600px] bg-[#0d0d14] border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-cyan-600/10">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-blue-300" />
              <span className="text-sm font-semibold text-white">Yazılı Destek</span>
              <span className="text-[10px] text-gray-500">AI</span>
            </div>
            <div className="flex items-center gap-1">
              {chatMsgs.length > 1 && (
                <button onClick={resetChat} className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded transition">Sıfırla</button>
              )}
              <button onClick={() => setPanel(null)} className="p-1 text-gray-400 hover:text-white" aria-label="Kapat"><X size={16} /></button>
            </div>
          </div>
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 thin-scrollbar">
            {chatMsgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                <div className={`inline-block max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-blue-500/15 border border-blue-500/30 text-white" : "bg-[#111118] border border-white/5 text-gray-200"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatSending && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 size={12} className="animate-spin" /> Yazıyor...
              </div>
            )}
            {chatError && (
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">{chatError}</div>
            )}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); sendChat(); }}
            className="p-2 border-t border-white/5 flex items-end gap-2"
          >
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Sorunuzu yazın..."
              rows={1}
              disabled={chatSending}
              className="flex-1 px-3 py-2 bg-[#111118] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-blue-500/40 max-h-24"
              style={{ minHeight: "36px" }}
            />
            <button type="submit" disabled={chatSending || !chatInput.trim()} className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition hover:opacity-90">
              {chatSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      )}

      {/* === LAUNCHER BUTTONS === */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2">
        <button
          onClick={openChat}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition transform hover:scale-105 ${
            panel === "chat" ? "bg-blue-600 text-white" : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:opacity-90"
          }`}
          title="Yazılı destek — AI asistan size cevap verir"
          aria-label="Yazılı destek"
        >
          <MessageSquare size={18} />
          <span className="hidden sm:inline text-sm font-semibold">Yazılı Destek</span>
        </button>
        {vapiReady && (
          <button
            onClick={startVoice}
            disabled={voiceStatus === "connecting"}
            className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition transform hover:scale-105 ${
              voiceStatus === "active" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" :
              voiceStatus === "connecting" ? "bg-amber-500 text-white" :
              voiceStatus === "error" ? "bg-red-500 text-white" :
              "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
            } disabled:cursor-not-allowed`}
            title="Sesli arama — mikrofonla AI asistanla konuş"
            aria-label="Bizi ara"
          >
            {voiceStatus === "connecting"
              ? <><Loader2 size={18} className="animate-spin" /><span className="hidden sm:inline text-sm font-semibold">Bağlanıyor</span></>
              : voiceStatus === "active"
                ? <><Mic size={18} /><span className="hidden sm:inline text-sm font-semibold">Konuşuyor</span></>
                : <><Mic size={18} /><span className="hidden sm:inline text-sm font-semibold">Bizi Ara</span></>}
            {voiceStatus === "active" && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
}
