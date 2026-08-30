/**
 * Gündem/sosyal post'ların çok dilli metin erişimi ve UI etiketleri.
 *
 * Eskiden lib/news.ts içindeydi; içerik DB'ye taşınınca saf sunum katmanı
 * olarak buraya ayrıldı. news.ts artık yalnızca seed verisi tutuyor.
 */
import type { Locale } from "../translations";
import type { PostKind, SocialPostView } from "./types";

/** Locale'e göre metin alanı; çeviri yoksa TR'ye düşer. */
export function postText(
  post: Pick<SocialPostView, "title" | "excerpt" | "body" | "i18n">,
  locale: Locale,
  field: "title" | "excerpt" | "body",
): string {
  const translated = post.i18n?.[locale]?.[field];
  return translated || post[field];
}

const KIND_LABELS: Record<PostKind, Record<Locale, string>> = {
  "product-launch": {
    tr: "Yeni Ürün",
    en: "New Product",
    ru: "Новый продукт",
    kk: "Жаңа өнім",
  },
  "special-day": {
    tr: "Özel Gün",
    en: "Special Day",
    ru: "Особый день",
    kk: "Ерекше күн",
  },
  milestone: {
    tr: "Şirket Haberi",
    en: "Company News",
    ru: "Новости компании",
    kk: "Компания жаңалықтары",
  },
};

export function kindLabel(kind: PostKind, locale: Locale): string {
  return KIND_LABELS[kind]?.[locale] || KIND_LABELS[kind]?.tr || kind;
}

/** Panelde (yalnızca Türkçe) kullanılan kısa etiketler. */
export const KIND_LABELS_TR: Record<PostKind, string> = {
  "product-launch": KIND_LABELS["product-launch"].tr,
  "special-day": KIND_LABELS["special-day"].tr,
  milestone: KIND_LABELS.milestone.tr,
};

export const KIND_COLORS: Record<PostKind, string> = {
  "product-launch": "bg-blue-500/20 text-blue-300 border-blue-400/40",
  "special-day": "bg-pink-500/20 text-pink-300 border-pink-400/40",
  milestone: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
};

/** Post durumlarının panel görünümü. */
export const STATUS_LABELS: Record<string, string> = {
  draft: "Taslak",
  scheduled: "Zamanlandı",
  publishing: "Yayınlanıyor",
  published: "Yayınlandı",
  partial: "Kısmen yayınlandı",
  failed: "Başarısız",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-300 border-gray-400/40",
  scheduled: "bg-amber-500/20 text-amber-300 border-amber-400/40",
  publishing: "bg-blue-500/20 text-blue-300 border-blue-400/40",
  published: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
  partial: "bg-orange-500/20 text-orange-300 border-orange-400/40",
  failed: "bg-red-500/20 text-red-300 border-red-400/40",
};
