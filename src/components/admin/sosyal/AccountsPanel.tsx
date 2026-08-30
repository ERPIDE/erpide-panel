"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Plug, Unplug } from "lucide-react";
import { useToast } from "@/components/Toast";
import { EXTERNAL_PLATFORMS, type ExternalPlatform, type SocialAccountView } from "@/lib/social/types";
import PlatformIcon from "./PlatformIcon";

const META: Record<ExternalPlatform, {
  name: string;
  idLabel: string;
  idHint: string;
  steps: string[];
}> = {
  facebook: {
    name: "Facebook Sayfası",
    idLabel: "Sayfa ID",
    idHint: "Sayfa > Ayarlar > Sayfa şeffaflığı bölümünde yazar",
    steps: [
      "ERPIDE Facebook Sayfası'nı açın.",
      "developers.facebook.com'da uygulama oluşturun, Sayfalar ürününü ekleyin.",
      "pages_manage_posts ve pages_read_engagement izinlerini App Review'a gönderin.",
      "Uzun ömürlü Page Access Token üretip buraya yapıştırın.",
    ],
  },
  instagram: {
    name: "Instagram",
    idLabel: "Instagram hesap ID",
    idHint: "Facebook Sayfası'na bağlı Business hesabının ID'si",
    steps: [
      "Instagram hesabını Business/Creator'a çevirin.",
      "Hesabı ERPIDE Facebook Sayfası'na bağlayın (zorunlu).",
      "instagram_content_publish ve instagram_basic izinlerini App Review'a gönderin.",
      "Facebook ile aynı Page Access Token'ı kullanabilirsiniz.",
    ],
  },
  linkedin: {
    name: "LinkedIn şirket sayfası",
    idLabel: "Organizasyon ID",
    idHint: "Sayfa yönetici panelindeki sayısal ID (urn gerekmez)",
    steps: [
      "linkedin.com/developers'ta uygulama oluşturup ERPIDE sayfasıyla doğrulayın.",
      "Community Management API başvurusu yapın — w_organization_social izni buradan gelir.",
      "Onay süreci haftalar sürebilir; reddedilme ihtimali var.",
      "OAuth ile aldığınız access token'ı buraya yapıştırın (~60 gün geçerli).",
    ],
  },
};

/**
 * Platform bağlantıları. Token'lar şifreli saklanır ve panele geri
 * gönderilmez — alan boş görünüyorsa kayıtlı token korunuyor demektir.
 */
export default function AccountsPanel({
  accounts,
  tokenStorageReady,
  onChanged,
}: {
  accounts: SocialAccountView[];
  tokenStorageReady: boolean;
  onChanged: (accounts: SocialAccountView[]) => void;
}) {
  return (
    <div className="space-y-4">
      {!tokenStorageReady && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">SOCIAL_TOKEN_KEY tanımlı değil</div>
            Token şifrelemesi için ortam değişkeni gerekiyor; olmadan bağlantı kaydedilemez.
            32 baytlık bir anahtar üretip Vercel ortam değişkenlerine ekleyin:
            <code className="block mt-2 px-2 py-1 rounded bg-black/40 text-[11px] text-gray-300">
              node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;
            </code>
          </div>
        </div>
      )}

      {EXTERNAL_PLATFORMS.map((p) => (
        <AccountCard
          key={p}
          platform={p}
          account={accounts.find((a) => a.platform === p)}
          disabled={!tokenStorageReady}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}

function AccountCard({
  platform,
  account,
  disabled,
  onChanged,
}: {
  platform: ExternalPlatform;
  account: SocialAccountView | undefined;
  disabled: boolean;
  onChanged: (accounts: SocialAccountView[]) => void;
}) {
  const { toast } = useToast();
  const meta = META[platform];

  const [externalId, setExternalId] = useState(account?.externalId ?? "");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<null | "save" | "verify" | "disconnect">(null);

  const connected = account?.connected ?? false;
  const expiring = account?.tokenExpiresAt
    ? new Date(account.tokenExpiresAt).getTime() - Date.now() < 7 * 24 * 3600 * 1000
    : false;

  async function save() {
    if (!externalId.trim()) { toast("error", `${meta.idLabel} gerekli`); return; }
    setBusy("save");
    try {
      const res = await fetch("/api/admin/sosyal/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          externalId: externalId.trim(),
          ...(token.trim() ? { accessToken: token.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast("error", data.error || "Kaydedilemedi"); return; }

      onChanged(data.accounts);
      setToken("");
      if (data.verified) toast("success", `${meta.name} bağlandı`);
      else toast("warning", `Kaydedildi ama doğrulanamadı: ${data.error}`);
    } finally {
      setBusy(null);
    }
  }

  async function verify() {
    setBusy("verify");
    try {
      const res = await fetch("/api/admin/sosyal/accounts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.accounts) onChanged(data.accounts);
      if (data.ok) toast("success", `Bağlantı çalışıyor: ${data.name}`);
      else toast("error", data.error || "Bağlantı testi başarısız");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    if (!confirm(`${meta.name} bağlantısı kesilecek ve token silinecek. Emin misiniz?`)) return;
    setBusy("disconnect");
    try {
      const res = await fetch("/api/admin/sosyal/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.accounts) onChanged(data.accounts);
      toast("info", "Bağlantı kesildi");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d14] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <PlatformIcon platform={platform} size={20} />
          <div>
            <div className="font-semibold text-white text-sm">{meta.name}</div>
            {account?.displayName && (
              <div className="text-xs text-gray-500">{account.displayName}</div>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            connected
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
              : "bg-gray-500/20 text-gray-400 border-gray-400/30"
          }`}
        >
          {connected ? <CheckCircle2 size={11} /> : <Unplug size={11} />}
          {connected ? "BAĞLI" : "BAĞLI DEĞİL"}
        </span>
      </div>

      {account?.lastError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          Son hata: {account.lastError}
        </div>
      )}

      {expiring && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Token 7 gün içinde doluyor — yenilemeyi unutmayın.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-400">{meta.idLabel}</label>
          <input
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 rounded-xl bg-[#111118] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition disabled:opacity-50"
          />
          <p className="text-[11px] text-gray-600">{meta.idHint}</p>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-400">Access Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={disabled}
            placeholder={account?.hasToken ? "Kayıtlı — değiştirmek için yazın" : "Token yapıştırın"}
            className="w-full px-3 py-2 rounded-xl bg-[#111118] border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition disabled:opacity-50"
          />
          <p className="text-[11px] text-gray-600">Şifreli saklanır, panele geri gönderilmez.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={save}
          disabled={disabled || !!busy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 transition disabled:opacity-40"
        >
          {busy === "save" ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />}
          Kaydet ve bağlan
        </button>
        <button
          onClick={verify}
          disabled={!connected || !!busy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:bg-white/5 transition disabled:opacity-40"
        >
          {busy === "verify" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
          Bağlantıyı test et
        </button>
        {connected && (
          <button
            onClick={disconnect}
            disabled={!!busy}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
          >
            <Unplug size={13} /> Bağlantıyı kes
          </button>
        )}
      </div>

      <details className="group">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition">
          Kurulum adımları
        </summary>
        <ol className="mt-3 space-y-1.5 text-xs text-gray-500 list-decimal pl-4">
          {meta.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </details>
    </div>
  );
}
