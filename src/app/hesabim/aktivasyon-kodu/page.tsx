"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Key, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function AktivasyonKoduPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    productName: string; skuName: string; expiresAt: string; orderId: string;
  } | null>(null);

  // Kullanıcının yazdığı kod büyük harfe ve XXXX-XXXX-XXXX maskeye yakın çevrilir.
  function onChangeCode(raw: string) {
    let v = raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (v.length > 19) v = v.slice(0, 19);
    setCode(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(null); setLoading(true);
    try {
      const res = await fetch("/api/shop/license-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kod doğrulanamadı");
        return;
      }
      setSuccess(data);
      setCode("");
    } catch (e) {
      setError("Bağlantı hatası: " + String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Aktivasyon Kodu</span></h1>
      <p className="text-gray-400 text-sm mb-8">
        ERPIDE e-pin kodunu, kurumsal lisans kodunuzu veya promosyon kodunuzu burada aktif edin.
        Aktif edildikten sonra ürün hesabınıza tanımlanır.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl p-8 rounded-2xl bg-[#111118] border border-white/5"
      >
        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Lisans Aktive Edildi 🎉</h2>
            <p className="text-sm text-gray-400 mb-5">
              <strong className="text-white">{success.productName}</strong> &mdash;{" "}
              <strong className="text-white">{success.skuName}</strong>{" "}
              hesabınıza tanımlandı.
            </p>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 mb-5 text-left">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Bitiş Tarihi</p>
              <p className="text-lg font-bold text-white">
                {new Date(success.expiresAt).toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/hesabim/lisanslarim"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
              >
                Lisanslarımı Gör <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => { setSuccess(null); setCode(""); }}
                className="px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition text-sm"
              >
                Yeni Kod
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">
                Aktivasyon Kodu
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={code}
                  onChange={(e) => onChangeCode(e.target.value)}
                  required
                  placeholder="ERP-XXXX-XXXX-XXXX"
                  autoFocus
                  spellCheck={false}
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-black/50 border border-white/10 text-white font-mono uppercase tracking-wider focus:border-blue-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Kodlar &quot;ERP&quot; ile başlar, tire ile ayrılmış 12 karakterlidir. Büyük/küçük harf önemli değildir.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300 flex items-start gap-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Doğrulanıyor..." : "Lisansı Aktive Et"}
            </button>
          </form>
        )}
      </motion.div>

      <div className="mt-8 max-w-xl p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
        <p className="text-xs text-blue-200/80 leading-relaxed">
          💡 <strong>Kod nasıl edinilir?</strong> Hepsiburada/N11 gibi pazaryerlerinden satın aldığınız
          ERPIDE e-pin&apos;in kutusunda veya elektronik teslimde mail/SMS ile size gelen kod.
          Kurumsal müşterilerimize toplu lisans dağıtımı için satış ekibimiz de aktivasyon kodu üretebilir.
        </p>
        <p className="text-xs text-blue-200/60 mt-2">
          Sorun yaşıyorsanız <button onClick={() => router.push("/iletisim")} className="underline">iletişim formundan</button> bize yazın.
        </p>
      </div>
    </>
  );
}
