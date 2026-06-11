"use client";

/**
 * Hesabımdaki tek tıklı "3 Gün Ücretsiz Dene" başlatma kartı.
 *
 * Neden ayrı bir component:
 *  Ürün detay sayfasındaki Trial butonu, normal SKU seçimi/sepete ekle
 *  akışıyla karışıyor — yeni kullanıcı "Sepete Ekle"ye basıp neden ücret
 *  istendiğini anlamıyor. Bu kart hesabıma açar açmaz başlatma seçeneği
 *  sunar; tek POST + router refresh.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  productId: string;
  productName: string;
  skuId: string;
  /** SKU/plan kısa adı — "Temel Paket", "Starter" vb. */
  planName: string;
  /** Kart üstünde gösterilecek 1-2 cümle özet */
  description: string;
  /** Tailwind gradient — "from-blue-600 to-purple-600" gibi */
  gradient: string;
}

export default function QuickTrialCard({ productId, productName, skuId, planName, description, gradient }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Deneme başlatılamadı");
        setLoading(false);
        return;
      }
      setDone(true);
      // 1.2 sn sonra refresh — kullanıcı "Başlatıldı" mesajını görebilsin
      setTimeout(() => {
        router.refresh();
        router.push("/hesabim/lisanslarim");
      }, 1200);
    } catch (e) {
      setError("Bağlantı hatası: " + String(e));
      setLoading(false);
    }
  }

  return (
    <div className="p-5 rounded-2xl bg-[#111118] border border-white/5 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-white text-base">{productName}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{planName}</p>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed flex-1">{description}</p>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={start}
        disabled={loading || done}
        className={`w-full py-2.5 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2 text-sm ${
          done
            ? "bg-emerald-600/80 cursor-default"
            : `bg-gradient-to-r ${gradient} hover:opacity-90 disabled:opacity-50`
        }`}
        data-product={productId}
      >
        {done ? (
          <>
            <CheckCircle2 size={14} /> Başlatıldı — Lisanslarına yönlendiriliyorsun…
          </>
        ) : loading ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Başlatılıyor…
          </>
        ) : (
          <>
            <Sparkles size={14} /> 3 Gün Ücretsiz Dene
          </>
        )}
      </button>
      <p className="text-[10px] text-gray-500 text-center -mt-1">Kart bilgisi gerekmez · İstediğin zaman iptal</p>
    </div>
  );
}
