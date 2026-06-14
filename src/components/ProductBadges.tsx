"use client";
import { useTranslation } from "@/lib/i18n";
import type { MarketScope } from "@/lib/products";

/**
 * Paylaşılan ürün rozet bileşenleri. /urunler liste, /urunler/[id] detay,
 * anasayfa Services kartı — hepsi aynı görünümü kullansın diye tek dosyada.
 */

export function MarketScopeBadge({ scope }: { scope: MarketScope }) {
  const { t } = useTranslation();
  if (scope === "TR") {
    return (
      <span
        className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 inline-flex items-center gap-1"
        title={t("products.tr_scope_tooltip")}
      >
        🇹🇷 {t("products.tr_scope_badge")}
      </span>
    );
  }
  return (
    <span
      className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1"
      title={t("products.global_scope_tooltip")}
    >
      🌍 {t("products.global_scope_badge")}
    </span>
  );
}

export function BetaBadge() {
  const { t } = useTranslation();
  return (
    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
      {t("products.beta_badge")}
    </span>
  );
}
