"use client";
import Link from "next/link";
import { Sparkles, MessageSquare, ExternalLink, ShoppingCart, Info, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type AiKontorOrder = {
  orderId: string;
  createdAt: string;
  skuId: string;
  skuName: string;
  granted: number;
  consumed: number;
  expiresAt: string | null;
};

/**
 * /hesabim/lisanslarim sayfasinin basinda gosterilen AI Kontor "bakiye" ozeti.
 * Birden fazla paket alindiysa hepsi toplanir (granted/consumed/kalan), her
 * paket de mini-liste olarak gosterilir. CTA'lar:
 *   - FinansERPIDE aktif → "FinansERPIDE'ye Git" (Eylul ile devam)
 *   - FinansERPIDE yok   → "Once FinansERPIDE Plani Al" (uyari + CTA)
 * Hep "Daha Fazla Kontor Al" CTA'si de gosterilir.
 */
export default function AiKontorOverview({
  orders,
  hasActiveFinansERPIDE,
  dateLocale,
}: {
  orders: AiKontorOrder[];
  hasActiveFinansERPIDE: boolean;
  dateLocale: string;
}) {
  const { t } = useTranslation();
  // Aktif paketleri (suresi gecmemis) ve gecmis paketleri ayir
  const now = Date.now();
  const active = orders.filter(
    (o) => !o.expiresAt || new Date(o.expiresAt).getTime() >= now
  );
  const totalGranted = active.reduce((s, o) => s + o.granted, 0);
  const totalConsumed = active.reduce((s, o) => s + o.consumed, 0);
  const totalRemaining = Math.max(0, totalGranted - totalConsumed);
  const pctUsed = totalGranted > 0
    ? Math.min(100, Math.round((totalConsumed / totalGranted) * 100))
    : 0;
  const isLow = totalGranted > 0 && totalRemaining / totalGranted < 0.1;

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 via-[#111118] to-orange-500/5 border border-amber-500/20">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              {t("ai_kontor.heading")}
              {isLow && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                  <AlertTriangle size={10} /> {t("ai_kontor.low_badge")}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400">
              {t("ai_kontor.subtitle")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">
            {totalRemaining.toLocaleString(dateLocale)}
            <span className="text-base text-gray-400 font-normal ml-1">/ {totalGranted.toLocaleString(dateLocale)}</span>
          </div>
          <p className="text-xs text-gray-500">{t("ai_kontor.unit")}</p>
        </div>
      </div>

      {/* Kullanim cubugu */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={11} /> {totalConsumed.toLocaleString(dateLocale)} {t("ai_kontor.used")}
          </span>
          <span>{pctUsed}% {t("ai_kontor.consumed")}</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full transition-all ${
              isLow
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : "bg-gradient-to-r from-amber-500 to-orange-500"
            }`}
            style={{ width: `${pctUsed}%` }}
          />
        </div>
      </div>

      {/* Paket listesi (kucuk) */}
      {active.length > 1 && (
        <div className="mb-5 space-y-1">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">{t("ai_kontor.active_packs")} ({active.length})</p>
          {active.map((o) => {
            const remaining = Math.max(0, o.granted - o.consumed);
            return (
              <div key={o.orderId} className="flex items-center justify-between text-xs text-gray-400 py-1.5 border-b border-white/5 last:border-0">
                <span>{o.skuName}</span>
                <span className="text-gray-300">
                  {remaining.toLocaleString(dateLocale)} / {o.granted.toLocaleString(dateLocale)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA'lar */}
      {!hasActiveFinansERPIDE ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-200 flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-300 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-100">{t("ai_kontor.no_plan_title")}</strong> — {t("ai_kontor.no_plan_desc")}
            </div>
          </div>
          <Link
            href="/urunler/finanserpide"
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
          >
            <ShoppingCart size={16} /> {t("ai_kontor.buy_finanserpide")}
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap">
          <Link
            href="https://finans.erpide.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:opacity-90 transition min-w-[220px]"
          >
            <MessageSquare size={16} /> {t("ai_kontor.talk_to_eylul")} <ExternalLink size={13} />
          </Link>
          <Link
            href="/urunler/ai-kontor"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-amber-500/30 text-amber-200 hover:bg-amber-500/10 transition"
          >
            <ShoppingCart size={14} /> {t("ai_kontor.buy_more")}
          </Link>
        </div>
      )}

      {/* Bilgilendirme */}
      <div className="mt-4 pt-4 border-t border-white/5 text-[11px] text-gray-500 flex items-start gap-2">
        <Info size={11} className="flex-shrink-0 mt-0.5" />
        <span>{t("ai_kontor.info_note")}</span>
      </div>
    </div>
  );
}
