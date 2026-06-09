"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Props {
  orderId: string;
  productName: string;
  /** ISO date — bu tarihe kadar kullanım devam eder (parası ödendi). */
  subscriptionExpiresAt?: string;
  /** Mevcut iptal durumu. true ise butonu disable et + "İptal edildi" göster. */
  alreadyCancelled?: boolean;
}

const DATE_LOCALE: Record<string, string> = {
  en: "en-US",
  tr: "tr-TR",
  ru: "ru-RU",
  kk: "kk-KZ",
};

export default function CancelSubscriptionButton({
  orderId,
  productName,
  subscriptionExpiresAt,
  alreadyCancelled,
}: Props) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(DATE_LOCALE[locale] ?? "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (alreadyCancelled) {
    return (
      <div className="mb-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-0.5">{t("account.cancelled_title")}</p>
          <p className="text-amber-200/70">
            {subscriptionExpiresAt
              ? t("account.cancelled_continues_until").replace("{date}", fmtDate(subscriptionExpiresAt))
              : t("account.cancelled_no_date")}
          </p>
        </div>
      </div>
    );
  }

  async function confirm() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      router.refresh();
      setOpen(false);
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-red-400 underline transition mt-2"
      >
        {t("account.cancel_button")}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="max-w-md w-full bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-white">{t("account.cancel_subscription")}</h3>
              <button
                type="button"
                onClick={() => !submitting && setOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-100">
              <p className="font-semibold mb-1">
                ⚠ {t("account.cancel_modal_warning").replace("{product}", productName)}
              </p>
              <p className="text-xs text-amber-200/80">
                {subscriptionExpiresAt
                  ? t("account.cancel_modal_until").replace("{date}", fmtDate(subscriptionExpiresAt))
                  : t("account.cancel_modal_no_date")}
              </p>
            </div>

            <label className="block mb-4">
              <span className="text-xs text-gray-400 block mb-1.5">{t("account.cancel_reason_label")}</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
                rows={3}
                maxLength={500}
                placeholder={t("account.cancel_reason_placeholder")}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40"
              />
            </label>

            {err && (
              <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {t("common.error")}: {err}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition"
              >
                {t("account.cancel_dismiss")}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-sm text-white font-medium transition flex items-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {t("account.cancel_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
