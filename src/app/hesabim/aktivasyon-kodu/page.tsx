"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Key, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const DATE_LOCALE: Record<string, string> = {
  en: "en-US", tr: "tr-TR", ru: "ru-RU", kk: "kk-KZ",
};

export default function AktivasyonKoduPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    productName: string; skuName: string; expiresAt: string; orderId: string;
  } | null>(null);

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
        setError(data.error || t("activation.code_invalid"));
        return;
      }
      setSuccess(data);
      setCode("");
    } catch (e) {
      setError(t("auth.connection_error") + String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">{t("nav.activation_code")}</span></h1>
      <p className="text-gray-400 text-sm mb-8">
        {t("activation.subtitle")}
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
            <h2 className="text-xl font-bold text-white mb-1">{t("activation.success_title")}</h2>
            <p className="text-sm text-gray-400 mb-5">
              {t("activation.success_desc")
                .replace("{product}", success.productName)
                .replace("{sku}", success.skuName)}
            </p>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 mb-5 text-left">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{t("activation.end_date")}</p>
              <p className="text-lg font-bold text-white">
                {new Date(success.expiresAt).toLocaleString(DATE_LOCALE[locale] || "en-US")}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/hesabim/lisanslarim"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
              >
                {t("activation.see_licenses")} <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => { setSuccess(null); setCode(""); }}
                className="px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition text-sm"
              >
                {t("activation.new_code")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">
                {t("activation.code_label")}
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
                {t("activation.code_hint")}
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
              {loading ? t("activation.verifying") : t("activation.activate_button")}
            </button>
          </form>
        )}
      </motion.div>

      <div className="mt-8 max-w-xl p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
        <p className="text-xs text-blue-200/80 leading-relaxed">
          <strong>{t("activation.how_to_get_title")}</strong> {t("activation.how_to_get_desc")}
        </p>
        <p className="text-xs text-blue-200/60 mt-2">
          {t("activation.contact_hint").split(/\{contact_link\}/).map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <button onClick={() => router.push("/iletisim")} className="underline">{t("activation.contact_link")}</button>
              )}
            </span>
          ))}
        </p>
      </div>
    </>
  );
}
