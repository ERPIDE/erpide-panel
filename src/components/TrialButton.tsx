"use client";
/**
 * "14 Gün Ücretsiz Dene" butonu.
 *
 * Hem ürün listesinde hem paket seçim ekranında aynı davranış gerekiyordu;
 * iki yere ayrı kopya yazmak, birinde düzeltilip diğerinde unutulan bir akış
 * demekti.
 *
 * Deneme açılır açılmaz müşteriyi ürüne sokuyoruz — kod yapıştırma, şifre
 * belirleme ya da "mailine bak" adımı yok.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  skuId: string;
  productId: string;
  /** Deneme sonrası dönülecek yer; verilmezse ürünün kendi giriş yolu. */
  returnTo?: string;
  className?: string;
  compact?: boolean;
}

/** Deneme açıldıktan sonra müşteriyi nereye gönderiyoruz. */
function entryPointFor(productId: string): string {
  switch (productId) {
    // SSO: erpide.com oturumuyla doğrudan içeri girer, kod girmez.
    case "finanserpide": return "/api/sso/finanserpide";
    case "captchaerpide": return "/hesabim/lisanslarim";
    default: return "/hesabim/lisanslarim";
  }
}

export default function TrialButton({ skuId, productId, returnTo, className, compact }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "started" | "error">("idle");
  const [error, setError] = useState("");

  async function start() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        // Giriş yoksa üyeliğe yolla; dönüşte kaldığı sayfaya geri gelsin.
        const back = returnTo || `/urunler/${productId}`;
        router.push(`/giris?next=${encodeURIComponent(back)}`);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Deneme başlatılamadı.");
        setState("error");
        return;
      }
      setState("started");
      // Kartı yoksa iyzico'nun kart doğrulama sayfasına gidiyor; kartı varsa
      // deneme çoktan başladı, doğrudan ürüne alıyoruz.
      window.location.href = data.needsCard && data.paymentPageUrl
        ? data.paymentPageUrl
        : entryPointFor(productId);
    } catch {
      setError("Bağlantı hatası. Tekrar dener misin?");
      setState("error");
    }
  }

  const busy = state === "loading" || state === "started";

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className={
          className ||
          `w-full flex items-center justify-center gap-1.5 rounded-xl font-semibold transition bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 disabled:opacity-50 ${
            compact ? "py-2.5 text-sm" : "py-3.5"
          }`
        }
      >
        {state === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {state === "loading"
          ? "Başlatılıyor..."
          : state === "started"
            ? "Yönlendiriliyorsun..."
            : "14 Gün Ücretsiz Dene"}
      </button>
      {error && (
        <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed">
          {error}
        </div>
      )}
    </>
  );
}
