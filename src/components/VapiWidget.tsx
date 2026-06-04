"use client";
/**
 * Vapi.ai web çağrı widget'ı — erpide.com'un her sayfasında sağ altta
 * sabit mikrofon butonu. Tıklanınca AI asistanla sesli konuşma başlar.
 *
 * Public key NEXT_PUBLIC_VAPI_PUBLIC_KEY env değişkeninden okunur — key
 * yoksa widget hiç render edilmez (build kırılmaz, dev'de sessiz geçer).
 * Assistant ID NEXT_PUBLIC_VAPI_ASSISTANT_ID env'inden.
 *
 * UX:
 *   - İdle: 56px gradient mavi buton (mikrofon ikon, "Bizi Ara" yazısı hover)
 *   - Connecting: spinner + "Bağlanıyor..."
 *   - Active call: kırmızı stop butonu + ses dalga animasyonu + transkript paneli
 *   - Hata: 5s kırmızı toast, sonra idle'a döner
 *
 * Mobil: sağ alt yine, ama tek ikon (yazı sığmaz)
 */
import { useEffect, useRef, useState } from "react";
import { Mic, PhoneOff, Loader2, X, MessageSquare } from "lucide-react";

type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

interface TranscriptLine {
  role: "user" | "assistant";
  text: string;
  ts: number;
}

export default function VapiWidget() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Vapi client tekil — useRef'te tut, sayfa unmount'ta cleanup yapacağız.
  // any: @vapi-ai/web tip tanımı kullanırken constructor + event listenerlar
  // dynamic import edildiği için TS'in tam dar tipi pratik değil.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null);

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    (async () => {
      const { default: Vapi } = await import("@vapi-ai/web");
      if (cancelled) return;
      const v = new Vapi(publicKey);
      vapiRef.current = v;

      v.on("call-start", () => { setStatus("active"); setError(""); });
      v.on("call-end", () => { setStatus("ended"); setIsSpeaking(false); });
      v.on("speech-start", () => setIsSpeaking(true));
      v.on("speech-end", () => setIsSpeaking(false));
      v.on("error", (e: Error | { message?: string } | unknown) => {
        const msg = e instanceof Error ? e.message : (typeof e === "object" && e && "message" in e ? String((e as { message: string }).message) : "Bağlantı hatası");
        setError(msg);
        setStatus("error");
        window.setTimeout(() => setStatus("idle"), 5000);
      });
      v.on("message", (m: { type: string; role?: string; transcript?: string; transcriptType?: string }) => {
        // Sadece final transkript satırlarını biriktir (interim olanları bypass et)
        if (m.type === "transcript" && m.transcriptType === "final" && m.transcript && m.role) {
          setTranscript((prev) => [...prev, {
            role: m.role === "assistant" ? "assistant" : "user",
            text: m.transcript || "",
            ts: Date.now(),
          }]);
        }
      });
    })();
    return () => {
      cancelled = true;
      try { vapiRef.current?.stop?.(); } catch { /* noop */ }
    };
  }, [publicKey]);

  async function startCall() {
    if (!vapiRef.current || !assistantId) {
      setError("AI asistan henüz aktif değil");
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 4000);
      return;
    }
    setStatus("connecting");
    setTranscript([]);
    setPanelOpen(true);
    try {
      await vapiRef.current.start(assistantId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mikrofon erişimi gerekli");
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 4000);
    }
  }

  function stopCall() {
    try { vapiRef.current?.stop(); } catch { /* noop */ }
    setStatus("idle");
  }

  // Key yoksa widget gizli — env tanımlanmadıkça production sayfasında
  // sessizce no-op olur.
  if (!publicKey || !assistantId) return null;

  return (
    <>
      {/* Transkript paneli — açıkken sağ altta yukarı doğru açılır */}
      {panelOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] max-h-[60vh] bg-[#0d0d14] border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-600/10 to-blue-600/10">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === "active" ? "bg-green-400 animate-pulse" : status === "connecting" ? "bg-amber-400 animate-pulse" : "bg-gray-500"}`} />
              <span className="text-sm font-semibold text-white">
                {status === "active" ? "Konuşuyor" : status === "connecting" ? "Bağlanıyor..." : status === "ended" ? "Çağrı bitti" : "Hazır"}
              </span>
            </div>
            <button onClick={() => setPanelOpen(false)} className="p-1 text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 thin-scrollbar">
            {transcript.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-8">
                {status === "active"
                  ? <>Mikrofon açık — konuş, ben dinliyorum.{isSpeaking && <p className="text-purple-300 mt-2">🔊 Yanıt veriyor...</p>}</>
                  : <>Konuşma başlayınca metin burada görünür.</>}
              </div>
            ) : (
              transcript.map((t, i) => (
                <div key={i} className={`text-xs ${t.role === "assistant" ? "" : "text-right"}`}>
                  <span className={`inline-block px-2.5 py-1.5 rounded-xl max-w-[85%] ${
                    t.role === "assistant"
                      ? "bg-[#111118] border border-purple-500/20 text-gray-200"
                      : "bg-blue-500/15 border border-blue-500/30 text-white"
                  }`}>{t.text}</span>
                </div>
              ))
            )}
          </div>
          {status === "active" && (
            <button
              onClick={stopCall}
              className="mx-3 mb-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/25 transition"
            >
              <PhoneOff size={14} /> Çağrıyı Bitir
            </button>
          )}
        </div>
      )}

      {/* Hata toast */}
      {status === "error" && error && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs shadow-xl">
          {error}
        </div>
      )}

      {/* Ana buton — sağ alt sabit */}
      <button
        onClick={status === "active" ? () => setPanelOpen(true) : startCall}
        disabled={status === "connecting"}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition transform hover:scale-105 ${
          status === "active"
            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            : status === "connecting"
              ? "bg-amber-500 text-white"
              : status === "error"
                ? "bg-red-500 text-white"
                : "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
        } disabled:cursor-not-allowed`}
        title={status === "active" ? "Çağrı aktif — transkripti göster" : status === "connecting" ? "Bağlanıyor..." : "AI Asistanla konuş"}
        aria-label="AI çağrı merkezi"
      >
        {status === "active"
          ? <><MessageSquare size={18} /><span className="hidden sm:inline text-sm font-semibold">Konuşuyor</span></>
          : status === "connecting"
            ? <><Loader2 size={18} className="animate-spin" /><span className="hidden sm:inline text-sm font-semibold">Bağlanıyor</span></>
            : <><Mic size={18} /><span className="hidden sm:inline text-sm font-semibold">Bizi Ara</span></>}
        {status === "active" && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        )}
      </button>
    </>
  );
}
