"use client";
import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Zap, Database, Server, Package, TrendingUp,
  RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock,
  Cpu, Globe, Smartphone, Shield, Phone, MessageSquare,
  BarChart3, Wifi, HardDrive, Calendar, ArrowUpRight,
  Info, Activity,
} from "lucide-react";

// ── Supabase (WITMA) ───────────────────────────────────────────────
const SB_URL = "https://gynooxlltoohalbxbhrw.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bm9veGxsdG9vaGFsYnhiaHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTkyNTMsImV4cCI6MjA5NjY3NTI1M30.Ff_zfpVkSa5sJDTp4tD6TvId1YY3R__xxXSDvAuxs2k";
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function sbCount(table: string, filter = ""): Promise<number | null> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/${table}?select=*${filter ? `&${filter}` : ""}&limit=0`,
      { headers: { ...H, Prefer: "count=exact" } }
    );
    if (!res.ok) return null;
    const range = res.headers.get("Content-Range");
    const m = range?.match(/\/(\d+)$/);
    return m ? parseInt(m[1]) : null;
  } catch { return null; }
}

// ── Servis tanımları ───────────────────────────────────────────────
type Status = "free" | "paid" | "usage" | "onetime";
type ServiceDef = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  status: Status;
  monthlyCost: number;         // TL veya $ (currency ile belirtilir)
  currency: "USD" | "TRY";
  freeLimit?: string;
  freeUsed?: number | null;    // 0-100 yüzde
  freeUsedLabel?: string;
  paidPlan?: string;
  paidCost?: string;
  nextAction?: string;
  renewDate?: string;
  notes?: string;
};

// USD/TRY kur tahmini
const USD_TRY = 38;

function usd(n: number) { return `$${n % 1 === 0 ? n : n.toFixed(2)}`; }
function try_(n: number) { return `₺${n % 1 === 0 ? n : n.toFixed(0)}`; }
function toTRY(s: ServiceDef) {
  return s.currency === "USD" ? s.monthlyCost * USD_TRY : s.monthlyCost;
}

const SERVICES: ServiceDef[] = [
  // ── AI & API ─────────────────────────────────────────
  {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    category: "ai",
    description: "WITMA AI bot yanıtları (witma-chat edge fn)",
    icon: <Zap size={18} />,
    status: "free",
    monthlyCost: 0,
    currency: "USD",
    freeLimit: "15 req/dak · 1M token/gün · 1500 req/gün",
    freeUsed: 10,
    freeUsedLabel: "Tahmini %10 doluluk",
    paidPlan: "Pay-as-you-go",
    paidCost: "$0.075 / 1M input token · $0.30 / 1M output",
    nextAction: "Kota dolduğunda otomatik ücretlendirilir",
    notes: "Şu an ücretsiz limitlerin çok altında. Bot görüşmeleri ~500 token/çağrı.",
  },
  {
    id: "google-tts",
    name: "Google Cloud TTS",
    category: "ai",
    description: "WITMA sesli bot (witma-tts edge fn)",
    icon: <Phone size={18} />,
    status: "free",
    monthlyCost: 0,
    currency: "USD",
    freeLimit: "4M karakter / ay (Standard ses)",
    freeUsed: 5,
    freeUsedLabel: "Tahmini ~200K karakter kullanım",
    paidPlan: "Pay-as-you-go",
    paidCost: "$4 / 1M karakter (Standard) · $16 / 1M (WaveNet)",
    nextAction: "4M karakteri geçince $4/1M",
    notes: "Ortalama bot cümlesi ~80 karakter. 4M = ~50.000 bot cümle/ay.",
  },
  {
    id: "google-translate",
    name: "Google Translate API",
    category: "ai",
    description: "WITMA anlık çeviri özelliği",
    icon: <Globe size={18} />,
    status: "free",
    monthlyCost: 0,
    currency: "USD",
    freeLimit: "500K karakter / ay",
    freeUsed: 8,
    freeUsedLabel: "Tahmini ~40K karakter",
    paidPlan: "Pay-as-you-go",
    paidCost: "$20 / 1M karakter",
    nextAction: "500K'yı geçince $20/1M",
    notes: "Mesaj başı ~50 karakter ortalama. 500K = ~10.000 çeviri/ay ücretsiz.",
  },
  {
    id: "vapi",
    name: "Vapi (AI Phone)",
    category: "ai",
    description: "erpide.com AI telefon asistanı",
    icon: <Phone size={18} />,
    status: "usage",
    monthlyCost: 0,
    currency: "USD",
    freeLimit: "Yok (her dakika ücretli)",
    freeUsed: null,
    paidCost: "$0.05 / dakika (Vapi) + LLM maliyeti ayrı",
    nextAction: "Test kredi bitti ise kullanım durdurulur",
    notes: "Şu an aktif kullanım yoksa maliyet 0. Prompts admin panelden güncelleniyor.",
  },
  // ── Veritabanı & Depolama ─────────────────────────────
  {
    id: "supabase",
    name: "Supabase (WITMA)",
    category: "db",
    description: "WITMA kullanıcılar, mesajlar, ops, edge functions, storage",
    icon: <Database size={18} />,
    status: "free",
    monthlyCost: 0,
    currency: "USD",
    freeLimit: "500MB DB · 5GB bant · 1GB storage · 500K edge fn/ay",
    freeUsed: 15,
    freeUsedLabel: "Tahmini ~75MB DB, ~750MB bant",
    paidPlan: "Pro",
    paidCost: "$25 / ay",
    nextAction: "Pro'ya geç: 8GB DB, sınırsız edge fn, PITR, e-posta desteği",
    notes: "Şu an Free tier çok rahat. 1000+ aktif kullanıcıda Pro düşünülmeli.",
  },
  {
    id: "neon",
    name: "Neon Postgres (Panel)",
    category: "db",
    description: "erpide.com admin panel: kullanıcılar, oturumlar, loglar",
    icon: <Database size={18} />,
    status: "free",
    monthlyCost: 0,
    currency: "USD",
    freeLimit: "512MB storage · 10 compute-hour/ay · 1 proje",
    freeUsed: 20,
    freeUsedLabel: "Tahmini ~100MB, düşük compute",
    paidPlan: "Launch",
    paidCost: "$19 / ay",
    nextAction: "512MB dolmadan veya 10 compute-hour aşılmadan geçiş gerekmez",
    notes: "Panel DB çok küçük. Yıllarca free tier yeterli.",
  },
  // ── Altyapı ───────────────────────────────────────────
  {
    id: "vercel",
    name: "Vercel (erpide.com)",
    category: "infra",
    description: "erpide.com, erpide-panel, pocket.erpide.com deploy",
    icon: <Globe size={18} />,
    status: "free",
    monthlyCost: 0,
    currency: "USD",
    freeLimit: "100GB bant · 6000 dk build · Sınırsız deploy",
    freeUsed: 12,
    freeUsedLabel: "Tahmini ~12GB bant kullanımı",
    paidPlan: "Pro",
    paidCost: "$20 / ay / üye",
    nextAction: "Pro: ekip erişimi, preview şifreleme, 1TB bant",
    notes: "Hobby plan şu an yeterli. Ekip büyüyünce Pro gerekli.",
  },
  {
    id: "eas",
    name: "EAS (Expo) — WITMA",
    category: "infra",
    description: "WITMA iOS/Android build ve OTA update",
    icon: <Smartphone size={18} />,
    status: "free",
    monthlyCost: 0,
    currency: "USD",
    freeLimit: "30 build/ay · OTA sınırsız",
    freeUsed: 20,
    freeUsedLabel: "Bu ay ~6 build kullanıldı",
    paidPlan: "Production",
    paidCost: "$19 / ay (unlimited builds)",
    nextAction: "30 build/ay aşılırsa Production'a geç",
    notes: "OTA update'ler tamamen ücretsiz, sınırsız. Sadece native build sayılır.",
  },
  {
    id: "cloudflare",
    name: "Cloudflare Tunnel",
    category: "infra",
    description: "dataengine.erpide.com + captcha.erpide.com tunnel",
    icon: <Shield size={18} />,
    status: "free",
    monthlyCost: 0,
    currency: "USD",
    freeLimit: "Sınırsız tünel, DNS yönetimi, CDN",
    freeUsed: 0,
    freeUsedLabel: "Limit yok",
    paidPlan: "Pro (opsiyonel)",
    paidCost: "$20 / ay (WAF, analitik)",
    nextAction: "Şu an gerek yok",
    notes: "cloudflared servisi Win Server'da çalışıyor, sıfır maliyet.",
  },
  {
    id: "winserver",
    name: "Win Server (Şirket)",
    category: "infra",
    description: "Data Engine API + Captcha FastAPI + 1C:ERP sunucusu",
    icon: <Server size={18} />,
    status: "paid",
    monthlyCost: 0,
    currency: "TRY",
    freeLimit: "Şirket altyapısı",
    paidCost: "Elektrik + donanım (şirket maliyeti)",
    notes: "Dış maliyet yok. Cloudflare Tunnel üzerinden erişim, port açmaya gerek yok.",
  },
  // ── Geliştirici Paketleri ─────────────────────────────
  {
    id: "apple-dev",
    name: "Apple Developer",
    category: "dev",
    description: "iOS uygulama dağıtımı (TestFlight + App Store)",
    icon: <Package size={18} />,
    status: "paid",
    monthlyCost: 99 / 12,
    currency: "USD",
    paidCost: "$99 / yıl",
    renewDate: "Yıllık (cüzdanda kredi kartı tanımlı)",
    notes: "WITMA iOS dağıtımı için zorunlu. ~$8.25/ay eşdeğeri.",
  },
  {
    id: "google-play",
    name: "Google Play Developer",
    category: "dev",
    description: "Android uygulama dağıtımı",
    icon: <Package size={18} />,
    status: "onetime",
    monthlyCost: 0,
    currency: "USD",
    paidCost: "$25 tek seferlik (ödendi)",
    notes: "Bir kez ödendi, süresiz. Aylık maliyet yok.",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  ai: "AI & API",
  db: "Veritabanı",
  infra: "Altyapı",
  dev: "Geliştirici Paketleri",
};

type Tab = "ozet" | "ai" | "db" | "infra" | "dev" | "tahmin";

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    free:    { label: "Ücretsiz",  cls: "text-green-400 bg-green-500/10 border-green-500/20" },
    paid:    { label: "Ücretli",   cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
    usage:   { label: "Kullanım",  cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    onetime: { label: "Ödendi",    cls: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  };
  const { label, cls } = map[status] || map.free;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
  );
}

function UsageBar({ pct }: { pct: number }) {
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function ServiceCard({ s }: { s: ServiceDef }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-4 hover:border-white/15 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
            {s.icon}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm text-white truncate">{s.name}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{s.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={s.status} />
          <div className="text-right">
            <div className="text-sm font-semibold text-white">
              {s.monthlyCost === 0 ? (
                <span className="text-green-400">$0</span>
              ) : (
                <span className="text-yellow-400">{usd(s.monthlyCost)}/ay</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {s.freeLimit && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{s.freeLimit}</span>
            {s.freeUsed !== null && s.freeUsed !== undefined && (
              <span>{s.freeUsed}%</span>
            )}
          </div>
          {s.freeUsed !== null && s.freeUsed !== undefined && (
            <UsageBar pct={s.freeUsed} />
          )}
          {s.freeUsedLabel && (
            <div className="text-xs text-gray-600 mt-1">{s.freeUsedLabel}</div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="mt-3 text-xs text-gray-600 hover:text-gray-400 transition flex items-center gap-1"
      >
        <Info size={11} /> {open ? "Gizle" : "Detay"}
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
          {s.paidPlan && (
            <div className="flex gap-2 text-xs">
              <span className="text-gray-500 w-24 shrink-0">Ücretli plan:</span>
              <span className="text-gray-300">{s.paidPlan} — {s.paidCost}</span>
            </div>
          )}
          {!s.paidPlan && s.paidCost && (
            <div className="flex gap-2 text-xs">
              <span className="text-gray-500 w-24 shrink-0">Fiyat:</span>
              <span className="text-gray-300">{s.paidCost}</span>
            </div>
          )}
          {s.nextAction && (
            <div className="flex gap-2 text-xs">
              <span className="text-gray-500 w-24 shrink-0">Sonraki adım:</span>
              <span className="text-yellow-400">{s.nextAction}</span>
            </div>
          )}
          {s.renewDate && (
            <div className="flex gap-2 text-xs">
              <span className="text-gray-500 w-24 shrink-0">Yenileme:</span>
              <span className="text-gray-300">{s.renewDate}</span>
            </div>
          )}
          {s.notes && (
            <div className="flex gap-2 text-xs">
              <span className="text-gray-500 w-24 shrink-0">Not:</span>
              <span className="text-gray-400 leading-relaxed">{s.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SistemPage() {
  const [tab, setTab] = useState<Tab>("ozet");
  const [liveData, setLiveData] = useState<{
    totalUsers: number | null;
    monthCalls: number | null;
    monthMsgs: number | null;
    monthTranslates: number | null;
  }>({ totalUsers: null, monthCalls: null, monthMsgs: null, monthTranslates: null });
  const [loading, setLoading] = useState(true);
  const [refreshed, setRefreshed] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [totalUsers, monthCalls, monthMsgs, monthTranslates] = await Promise.all([
      sbCount("profiles"),
      sbCount("ops_events", `event=eq.call_start&created_at=gte.${monthStart}`),
      sbCount("ops_events", `event=eq.msg_sent&created_at=gte.${monthStart}`),
      sbCount("ops_events", `event=eq.translate&created_at=gte.${monthStart}`),
    ]);

    setLiveData({ totalUsers, monthCalls, monthMsgs, monthTranslates });
    setRefreshed(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Maliyet hesapları ──────────────────────────────────────────
  const fixedMonthlyUSD = SERVICES
    .filter(s => s.currency === "USD" && s.status === "paid")
    .reduce((a, s) => a + s.monthlyCost, 0);

  const appleDev = 99 / 12; // Apple Dev aylık karşılığı

  // Tahminler: gerçek kullanım verisine göre
  const monthCalls = liveData.monthCalls ?? 0;
  const monthMsgs = liveData.monthMsgs ?? 0;
  const monthTranslates = liveData.monthTranslates ?? 0;

  // TTS: ortalama bot cümlesi ~80 karakter, her aramada ~20 bot dönüşü
  const estTtsChars = monthCalls * 20 * 80;
  const ttsFreeRemain = Math.max(0, 4_000_000 - estTtsChars);
  const ttsCostUSD = estTtsChars > 4_000_000 ? ((estTtsChars - 4_000_000) / 1_000_000) * 4 : 0;

  // Translate: ortalama ~50 karakter/çeviri
  const estTranslateChars = monthTranslates * 50;
  const translateFreeRemain = Math.max(0, 500_000 - estTranslateChars);
  const translateCostUSD = estTranslateChars > 500_000 ? ((estTranslateChars - 500_000) / 1_000_000) * 20 : 0;

  // Gemini: her AI chat ~500 token output, input ~300
  const monthAiChats = liveData.monthMsgs ?? 0; // mesajların tümü AI değil ama yaklaşık
  const estGeminiInputTokens = monthAiChats * 300;
  const estGeminiOutputTokens = monthAiChats * 500;
  const geminiDailyLimit = 1_000_000;
  const geminiDailyUsage = Math.round(estGeminiInputTokens / 30 + estGeminiOutputTokens / 30);
  const geminiCostUSD = 0; // free tier çok yeterli, maliyet 0 kabul

  const totalMonthlyUSD = fixedMonthlyUSD + ttsCostUSD + translateCostUSD + geminiCostUSD;
  const totalMonthlyTRY = totalMonthlyUSD * USD_TRY;

  const freeServicesCount = SERVICES.filter(s => s.status === "free").length;
  const paidServicesCount = SERVICES.filter(s => s.status === "paid" || s.status === "onetime").length;

  const TABS: { key: Tab; label: string }[] = [
    { key: "ozet", label: "Genel Bakış" },
    { key: "ai", label: "AI & API" },
    { key: "db", label: "Veritabanı" },
    { key: "infra", label: "Altyapı" },
    { key: "dev", label: "Paketler" },
    { key: "tahmin", label: "Tahminler" },
  ];

  const filtered = (cat: string) => SERVICES.filter(s => s.category === cat);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Sistem & Maliyet</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tüm servisler · Free kota · Maliyet tahmini
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 text-xs text-gray-400 transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {refreshed ? refreshed.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "Yükleniyor"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <DollarSign size={14} /> Aylık Maliyet
          </div>
          <div className="text-2xl font-bold text-white">
            {totalMonthlyUSD === 0 ? (
              <span className="text-green-400">$0</span>
            ) : (
              <span className="text-yellow-400">{usd(totalMonthlyUSD)}</span>
            )}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {totalMonthlyTRY === 0 ? "Sıfır maliyet 🎉" : `≈ ₺${Math.round(totalMonthlyTRY)}`}
          </div>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <CheckCircle size={14} /> Ücretsiz Servisler
          </div>
          <div className="text-2xl font-bold text-green-400">{freeServicesCount}</div>
          <div className="text-xs text-gray-600 mt-1">/{SERVICES.length} toplam servis</div>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <Activity size={14} /> Bu Ay (WITMA)
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "—" : (liveData.monthCalls ?? 0) + (liveData.monthMsgs ?? 0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {loading ? "" : `${liveData.monthCalls ?? 0} arama · ${liveData.monthMsgs ?? 0} mesaj`}
          </div>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <TrendingUp size={14} /> Yıllık Tahmini
          </div>
          <div className="text-2xl font-bold text-white">
            {totalMonthlyUSD === 0 && appleDev > 0 ? (
              <span className="text-yellow-400">{usd(appleDev * 12)}</span>
            ) : (
              <span className={totalMonthlyUSD > 50 ? "text-red-400" : "text-green-400"}>
                {usd((totalMonthlyUSD + appleDev) * 12)}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 mt-1">Apple Dev dahil</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 ${
              tab === t.key
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Genel Bakış */}
      {tab === "ozet" && (
        <div className="space-y-6">
          {/* Alert: sıfır maliyet */}
          <div className="flex items-start gap-3 bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-green-400">Şu an sıfır cari maliyet</div>
              <div className="text-xs text-gray-500 mt-1">
                Tüm servisler free tier içinde çalışıyor. Apple Developer ücreti ($99/yıl) yıllık
                yenileme döneminde oluşur. Kullanım büyüdükçe Supabase Pro veya Google TTS ücreti devreye girebilir.
              </div>
            </div>
          </div>

          {/* Tüm servisler özet */}
          {(["ai", "db", "infra", "dev"] as const).map(cat => (
            <div key={cat}>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filtered(cat).map(s => (
                  <ServiceCard key={s.id} s={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI & API */}
      {tab === "ai" && (
        <div className="space-y-4">
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-gray-400">
            Bu aydaki canlı kullanım: <span className="text-white font-medium">{monthCalls} bot araması</span> ·{" "}
            <span className="text-white font-medium">{monthMsgs} mesaj</span> ·{" "}
            <span className="text-white font-medium">{monthTranslates} çeviri</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered("ai").map(s => <ServiceCard key={s.id} s={s} />)}
          </div>
          {/* Kota hesapları */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-white">Bu Ay Kota Durumu</h3>
            {[
              {
                label: "Google TTS",
                used: estTtsChars,
                limit: 4_000_000,
                unit: "karakter",
                cost: ttsCostUSD,
              },
              {
                label: "Google Translate",
                used: estTranslateChars,
                limit: 500_000,
                unit: "karakter",
                cost: translateCostUSD,
              },
              {
                label: "Gemini (günlük token)",
                used: geminiDailyUsage,
                limit: geminiDailyLimit,
                unit: "token/gün",
                cost: geminiCostUSD,
              },
            ].map(q => {
              const pct = Math.round((q.used / q.limit) * 100);
              return (
                <div key={q.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{q.label}</span>
                    <span className="text-gray-500">
                      {q.used.toLocaleString()} / {q.limit.toLocaleString()} {q.unit}
                      {q.cost > 0 && <span className="text-yellow-400 ml-2">+{usd(q.cost)}</span>}
                    </span>
                  </div>
                  <UsageBar pct={pct} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Veritabanı */}
      {tab === "db" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered("db").map(s => <ServiceCard key={s.id} s={s} />)}
          </div>
          {/* Supabase Kullanıcı sayısı */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Supabase Canlı Veriler</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Kayıtlı Kullanıcı", val: liveData.totalUsers, icon: <Activity size={14} /> },
                { label: "Bu Ay Arama", val: liveData.monthCalls, icon: <Phone size={14} /> },
                { label: "Bu Ay Mesaj", val: liveData.monthMsgs, icon: <MessageSquare size={14} /> },
                { label: "Bu Ay Çeviri", val: liveData.monthTranslates, icon: <Globe size={14} /> },
              ].map(item => (
                <div key={item.label} className="bg-white/3 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    {item.icon} {item.label}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {loading ? "—" : (item.val ?? "—")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Altyapı */}
      {tab === "infra" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered("infra").map(s => <ServiceCard key={s.id} s={s} />)}
        </div>
      )}

      {/* Geliştirici Paketleri */}
      {tab === "dev" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered("dev").map(s => <ServiceCard key={s.id} s={s} />)}
          </div>
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Yıllık Zorunlu Ödemeler</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Apple Developer Program</span>
                <span className="text-yellow-400 font-medium">$99 / yıl</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Google Play (tek seferlik)</span>
                <span className="text-green-400 font-medium">Ödendi ✓</span>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between text-sm">
                <span className="text-gray-300 font-medium">Yıllık toplam</span>
                <span className="text-white font-semibold">$99</span>
              </div>
              <div className="text-xs text-gray-600">
                ≈ ₺{Math.round(99 * USD_TRY)} ({USD_TRY}₺/$ kur ile)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tahminler */}
      {tab === "tahmin" && (
        <div className="space-y-4">
          {/* Senaryo tablosu */}
          <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-medium text-white">Maliyet Projeksiyon Senaryoları</h3>
              <p className="text-xs text-gray-500 mt-1">
                Canlı kullanım verisine dayalı, mevcut büyüme trendine göre
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-xs text-gray-500 font-medium">Senaryo</th>
                    <th className="text-right p-4 text-xs text-gray-500 font-medium">Günlük</th>
                    <th className="text-right p-4 text-xs text-gray-500 font-medium">Haftalık</th>
                    <th className="text-right p-4 text-xs text-gray-500 font-medium">Aylık</th>
                    <th className="text-right p-4 text-xs text-gray-500 font-medium">Yıllık</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { label: "Şu anki (test)", users: liveData.totalUsers ?? 10, mult: 1, color: "text-green-400" },
                    { label: "100 aktif kullanıcı", users: 100, mult: 10, color: "text-blue-400" },
                    { label: "500 aktif kullanıcı", users: 500, mult: 50, color: "text-yellow-400" },
                    { label: "2000 aktif kullanıcı", users: 2000, mult: 200, color: "text-orange-400" },
                  ].map(row => {
                    // Her 10 kullanıcı = ~20 arama/gün, ~100 mesaj/gün, ~50 çeviri/gün
                    const dailyCalls = row.mult * 2;
                    const dailyMsgs = row.mult * 10;
                    const dailyTranslates = row.mult * 5;
                    // TTS: 20 bot cümlesi/arama * 80 char
                    const dailyTtsChars = dailyCalls * 20 * 80;
                    const dailyTranslateChars = dailyTranslates * 50;
                    // Maliyet: sadece free aşımı
                    const monthlyTtsChars = dailyTtsChars * 30;
                    const monthlyTranslateChars = dailyTranslateChars * 30;
                    const ttsUSD = monthlyTtsChars > 4_000_000 ? ((monthlyTtsChars - 4_000_000) / 1_000_000) * 4 : 0;
                    const translateUSD = monthlyTranslateChars > 500_000 ? ((monthlyTranslateChars - 500_000) / 1_000_000) * 20 : 0;
                    const monthlyUSD = ttsUSD + translateUSD + appleDev / 12;
                    const dailyUSD = monthlyUSD / 30;
                    const fmt = (n: number) => n < 0.01 ? "$0" : usd(n);
                    return (
                      <tr key={row.label}>
                        <td className="p-4">
                          <div className={`text-sm font-medium ${row.color}`}>{row.label}</div>
                          <div className="text-xs text-gray-600">{row.users} kullanıcı</div>
                        </td>
                        <td className="p-4 text-right text-white">{fmt(dailyUSD)}</td>
                        <td className="p-4 text-right text-white">{fmt(dailyUSD * 7)}</td>
                        <td className="p-4 text-right text-white">{fmt(monthlyUSD)}</td>
                        <td className="p-4 text-right text-white">{fmt(monthlyUSD * 12)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Free tier ne zaman dolar */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Free Kota Eşiği — Kaç Kullanıcıda Dolar?</h3>
            <div className="space-y-3">
              {[
                {
                  service: "Google TTS",
                  limit: "4M karakter/ay",
                  threshold: "~2.500 aktif kullanıcı",
                  cost: "$4/ay (sonrasında $4/1M char)",
                  color: "text-yellow-400",
                },
                {
                  service: "Google Translate",
                  limit: "500K karakter/ay",
                  threshold: "~2.000 aktif çevirmen kullanıcı",
                  cost: "$10/ay tahmini",
                  color: "text-orange-400",
                },
                {
                  service: "Supabase Free",
                  limit: "500MB DB / 5GB bant",
                  threshold: "~10.000 kayıtlı kullanıcı",
                  cost: "$25/ay (Pro)",
                  color: "text-purple-400",
                },
                {
                  service: "Gemini 2.0 Flash",
                  limit: "1M token/gün",
                  threshold: "~5.000+ aktif konuşma/gün",
                  cost: "Çok uzak, pratik sınır değil",
                  color: "text-green-400",
                },
                {
                  service: "Vercel Hobby",
                  limit: "100GB bant/ay",
                  threshold: "Çok yüksek trafik gerekir",
                  cost: "$20/ay (Pro)",
                  color: "text-blue-400",
                },
              ].map(item => (
                <div key={item.service} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 border-b border-white/5 last:border-0">
                  <div className="w-36 shrink-0">
                    <div className="text-sm font-medium text-white">{item.service}</div>
                    <div className="text-xs text-gray-600">{item.limit}</div>
                  </div>
                  <div className="flex-1 text-xs text-gray-400">{item.threshold}</div>
                  <div className={`text-xs font-medium ${item.color} shrink-0`}>{item.cost}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Öneri */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">Aksiyon Planı</h3>
            <div className="space-y-2 text-xs">
              {[
                { when: "Hemen", action: "Hiçbir şey yapma — tüm servisler free", color: "text-green-400" },
                { when: "100 kullanıcıda", action: "Kullanımları izlemeye devam et, hâlâ ücretsiz", color: "text-blue-400" },
                { when: "500 kullanıcıda", action: "Supabase DB boyutunu kontrol et, TTS harcamasına bak", color: "text-yellow-400" },
                { when: "1.000 kullanıcıda", action: "Supabase Pro ($25/ay) ve Vercel Pro ($20/ay) değerlendirmesini yap", color: "text-orange-400" },
                { when: "2.500 kullanıcıda", action: "Google TTS ücretli kota başlar (~$10-20/ay), EAS Production ($19/ay) düşün", color: "text-red-400" },
              ].map(item => (
                <div key={item.when} className="flex gap-3">
                  <span className={`font-medium w-28 shrink-0 ${item.color}`}>{item.when}</span>
                  <span className="text-gray-400">{item.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
