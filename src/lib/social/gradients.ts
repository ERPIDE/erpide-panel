/**
 * Post görsellerinin renk paleti.
 *
 * Gradient'lar Tailwind sınıfı olarak saklanır (Gündem kartları onu doğrudan
 * kullanır), OG görsel üreticisi ise ham CSS'e ihtiyaç duyar — ImageResponse
 * Tailwind anlamaz. İki temsili tek yerde eşleştiriyoruz ki panelden yeni renk
 * eklendiğinde görsel üreticisi sessizce varsayılana düşmesin.
 */

export interface GradientPreset {
  /** Tailwind sınıfı — DB'de bu saklanır. */
  value: string;
  /** Panelde görünen ad. */
  label: string;
  /** ImageResponse için ham CSS. */
  css: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    value: "from-blue-600 to-purple-600",
    label: "ERPIDE Mavi-Mor",
    css: "linear-gradient(135deg, #2563eb 0%, #9333ea 100%)",
  },
  {
    value: "from-indigo-600 via-purple-600 to-pink-600",
    label: "İndigo-Pembe",
    css: "linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #db2777 100%)",
  },
  {
    value: "from-pink-500 via-rose-500 to-purple-600",
    label: "Pembe-Gül",
    css: "linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #9333ea 100%)",
  },
  {
    value: "from-red-600 via-amber-400 to-red-700",
    label: "Türk Bayrağı",
    css: "linear-gradient(135deg, #dc2626 0%, #fbbf24 50%, #b91c1c 100%)",
  },
  {
    value: "from-red-700 to-red-900",
    label: "Koyu Kırmızı",
    css: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
  },
  {
    value: "from-sky-600 via-yellow-500 to-sky-700",
    label: "Kazakistan",
    css: "linear-gradient(135deg, #0284c7 0%, #eab308 50%, #0369a1 100%)",
  },
  {
    value: "from-emerald-600 via-amber-500 to-orange-600",
    label: "Bahar / Nevruz",
    css: "linear-gradient(135deg, #059669 0%, #f59e0b 50%, #ea580c 100%)",
  },
  {
    value: "from-slate-700 via-slate-800 to-slate-900",
    label: "Kurumsal Gri",
    css: "linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)",
  },
  {
    value: "from-teal-600 via-cyan-600 to-blue-700",
    label: "Turkuaz",
    css: "linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #1d4ed8 100%)",
  },
];

export const DEFAULT_GRADIENT = GRADIENT_PRESETS[0].value;

/** Tailwind sınıfını ham CSS gradient'a çevirir; tanınmayan değer varsayılana düşer. */
export function gradientCss(twClass: string | null | undefined): string {
  if (!twClass) return GRADIENT_PRESETS[0].css;
  return GRADIENT_PRESETS.find((g) => g.value === twClass)?.css ?? GRADIENT_PRESETS[0].css;
}
