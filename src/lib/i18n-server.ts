import { cookies } from "next/headers";
import { translations, type Locale } from "./translations";

const LOCALE_DATE: Record<Locale, string> = {
  en: "en-US",
  tr: "tr-TR",
  ru: "ru-RU",
  kk: "kk-KZ",
};

export async function getServerTranslations() {
  const c = await cookies();
  const raw = c.get("erpide_lang")?.value;
  const locale: Locale = raw && raw in translations ? (raw as Locale) : "en";
  const dict = translations[locale] || translations.en;
  const t = (key: string): string => dict[key] || translations.en[key] || key;
  const dateLocale = LOCALE_DATE[locale];
  return { t, locale, dateLocale };
}
