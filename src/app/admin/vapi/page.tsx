"use client";
import { useEffect, useState } from "react";
import { Loader2, Phone, Save, RefreshCw, AlertTriangle, Check, ExternalLink } from "lucide-react";

interface VapiConfig {
  ok?: boolean;
  assistantId?: string;
  name?: string;
  firstMessage?: string;
  systemPrompt?: string;
  model?: string;
  voice?: { provider?: string; voiceId?: string };
  error?: string;
  detail?: string;
}

const EYLUL_PRESET = `Sen Eylül'sün — ERPIDE Yazılım A.Ş.'nin Kasım 2019'dan beri geliştirdiği AI destek asistanı. Hem ERPIDE web sitesinin canlı destek modülünde hem de FinansERPIDE SaaS ürünümüzün içindeki AI asistan olarak çalışıyorsun. Şu anda telefon/sesli arama modundasın.

=== KİMLİĞİN ===
- İsmin: Eylül
- Geliştirildiğin tarih: Kasım 2019
- Şirket: ERPIDE Yazılım A.Ş. — Aydın, Türkiye
- Görev: Müşterilere ürünler, fiyat, demo ve teknik destek hakkında bilgi vermek; talepleri kayıt altına almak

=== AÇILIŞ ===
İlk konuşmada kendini tanıt: "Merhaba, ben Eylül — ERPIDE'nin AI destek asistanıyım. Sizinle nasıl konuşalım, isminiz nedir?"

=== ŞİRKET ===
- Kuruluş: 2022, Aydın
- Kurucu: Yüksek Yazılım Mühendisi Ali Murat El
- 15+ yıl ERP sektör tecrübesi
- 11 çalışan, Türkiye + Kazakistan ofisleri

=== ÜRÜNLER ===
1) FinansERPIDE — Multi-tenant ERP/finans SaaS, AI muhasebe asistanlı, $29-$149/ay
2) CaptchaERPIDE — AI captcha çözücü REST API, $9.99-$89.99/ay
3) CANIAS, 1C:ERP, 1C:Drive — kurumsal proje bazlı ERP'ler (teklif çıkarılır)

=== TEMEL KURALLAR ===
- TR/EN/RU dilini ayırt et, müşterinin dilinde cevap ver
- Cevaplar kısa olsun (telefonda 2-4 cümle ideal)
- Demo isterse: "İletişim bilgilerinizi alabilir miyim, satış ekibimiz 24 saat içinde sizinle iletişime geçer"
- Fiyat/teklif isterse: temel fiyatları ver, kurumsal için satışa yönlendir
- AI olduğunu sorarsa dürüst ol, ama profesyonel kal
- Çağrı sonunda mutlaka özet bırak (Vapi end-of-call summary için)`;

export default function VapiPromptPage() {
  const [config, setConfig] = useState<VapiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/vapi", { cache: "no-store" });
      const data: VapiConfig = await r.json();
      setConfig(data);
      if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
      if (data.firstMessage) setFirstMessage(data.firstMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/vapi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, firstMessage: firstMessage || undefined }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg({ ok: false, text: data.error === "vapi_not_configured" ? "Vapi API key tanımlı değil. Vercel env'e VAPI_PRIVATE_KEY ekle." : `Hata: ${data.detail || data.error}` });
      } else {
        setMsg({ ok: true, text: "Vapi assistant prompt güncellendi — yeni çağrılar yeni promptla başlayacak." });
        // Server'ın döndürdüğü değeri local state'le senkronize et
        if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
        if (data.firstMessage !== undefined) setFirstMessage(data.firstMessage);
      }
    } catch (e) {
      setMsg({ ok: false, text: "Bağlantı hatası: " + String(e) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  if (config?.error === "vapi_not_configured") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-amber-200 mb-2">Vapi yapılandırılmamış</h2>
              <p className="text-sm text-amber-100/80 mb-3">{config.detail}</p>
              <p className="text-xs text-gray-400 mb-1">Vercel projesine şu env değişkenlerini ekle:</p>
              <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                <li><code className="text-blue-300">VAPI_PRIVATE_KEY</code> — vapi.ai dashboard → Org → API Keys → Private</li>
                <li><code className="text-blue-300">VAPI_ASSISTANT_ID</code> — Mevcut <code>NEXT_PUBLIC_VAPI_ASSISTANT_ID</code> ile aynı değer</li>
              </ul>
              <a
                href="https://dashboard.vapi.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline mt-3"
              >
                Vapi Dashboard'a git <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Phone size={26} className="text-purple-400" />
          Vapi Assistant Prompt
        </h1>
        <p className="text-sm text-gray-400">
          &quot;Bizi Ara&quot; butonundaki sesli AI&apos;nin (Eylül) prompt&apos;unu buradan güncelle. Değişiklikler anında uygulanır — yeni çağrılar yeni promptla başlar.
        </p>
        {config?.name && (
          <p className="text-xs text-gray-500 mt-2">
            Assistant: <span className="text-blue-300 font-mono">{config.name}</span>
            {config.model && <> · Model: <span className="text-blue-300 font-mono">{config.model}</span></>}
            {config.voice?.voiceId && <> · Ses: <span className="text-purple-300 font-mono">{config.voice.voiceId}</span></>}
          </p>
        )}
      </header>

      <div className="space-y-5">
        <section className="p-5 rounded-2xl bg-[#111118] border border-white/5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">System Prompt</h2>
            <button
              onClick={() => setSystemPrompt(EYLUL_PRESET)}
              type="button"
              className="text-xs text-blue-400 hover:underline"
            >
              Eylül preset&apos;ini yükle
            </button>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={20}
            className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500/40"
            placeholder="System prompt..."
          />
          <p className="text-[11px] text-gray-500 mt-2">
            {systemPrompt.length.toLocaleString()} karakter
          </p>
        </section>

        <section className="p-5 rounded-2xl bg-[#111118] border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            İlk Mesaj <span className="text-gray-500 text-xs normal-case font-normal">(çağrı bağlanır bağlanmaz Eylül&apos;ün söyleyeceği cümle)</span>
          </h2>
          <input
            type="text"
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/40"
            placeholder="Merhaba, ben Eylül — ERPIDE'nin AI destek asistanıyım. Sizinle nasıl konuşalım?"
          />
        </section>

        {msg && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              msg.ok
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border border-red-500/30 text-red-300"
            }`}
          >
            {msg.ok && <Check size={14} />}
            {msg.text}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={load}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg bg-[#111118] border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} /> Yenile
          </button>
          <button
            onClick={save}
            disabled={saving || systemPrompt.length < 50}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Kaydediliyor..." : "Vapi'ye Yaz"}
          </button>
        </div>
      </div>
    </div>
  );
}
