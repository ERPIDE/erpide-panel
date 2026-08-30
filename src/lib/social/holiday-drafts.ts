/**
 * Özel gün taslakları — takvimdeki tatilden önce hazır post üretir.
 *
 * Otomatik YAYIN yapmaz, bilinçli olarak: marka hesabından onaysız paylaşım
 * riskli. Cron taslağı hazırlar, panelde "onay bekliyor" olarak görünür,
 * yayın tek tuşla kullanıcı tarafından verilir.
 *
 * Aynı tatile ikinci taslak üretilmez — sourceRef `{slug}-{yıl}` biçiminde
 * benzersizdir, cron her gün çalışsa da tek kayıt oluşur.
 */
import { getUpcomingHolidays, type Holiday } from "../holidays";
import { createPost, existsBySource, uniqueSlug } from "./store";
import type { Platform, SocialPostView } from "./types";

/** Tatilden kaç gün önce taslak hazırlanacağı — onay için makul bir pay. */
export const DRAFT_LEAD_DAYS = 3;

/** Taslakların varsayılan yayın hedefleri. */
const DEFAULT_TARGETS: Platform[] = ["site", "facebook", "instagram", "linkedin"];

const SOURCE = "holiday-cron";

/** Tatil + yıl → benzersiz kaynak referansı. */
export function holidaySourceRef(holiday: Holiday, isoDate: string): string {
  return `${holiday.slug}-${isoDate.slice(0, 4)}`;
}

/**
 * Tatil için post gövdesi. Takvimdeki excerpt kısa bir kutlama cümlesi;
 * Gündem yazısı ve LinkedIn paylaşımı için biraz daha uzun bir metin gerekiyor.
 * Kullanıcı panelde bunu düzenleyebilir — taslağın amacı boş sayfa bırakmamak.
 */
function buildBody(holiday: Holiday): string {
  const tr = holiday.i18n.tr;
  return `${tr.excerpt}\n\nERPIDE olarak Türkiye ve Kazakistan'da işletmelerin dijital dönüşümüne katkı sağlıyoruz. Bu anlamlı günde tüm iş ortaklarımıza, müşterilerimize ve ekibimize sağlık ve başarı diliyoruz.`;
}

/** Özel gün için varsayılan etiketler. */
function buildHashtags(holiday: Holiday): string[] {
  const base = ["ERPIDE"];
  if (holiday.country === "KZ") base.push("Kazakhstan");
  if (holiday.country === "TR") base.push("Türkiye");
  return base;
}

export interface DraftResult {
  created: SocialPostView | null;
  /** Neden atlandı — panel/log için. */
  skipped?: "already-exists";
  holidaySlug: string;
  date: string;
}

/**
 * Önümüzdeki DRAFT_LEAD_DAYS gün içindeki tatiller için eksik taslakları üretir.
 * Zaten taslağı olan tatiller atlanır.
 */
export async function generateUpcomingDrafts(
  leadDays = DRAFT_LEAD_DAYS,
): Promise<DraftResult[]> {
  const upcoming = getUpcomingHolidays(leadDays);
  const results: DraftResult[] = [];

  for (const { holiday, date } of upcoming) {
    const sourceRef = holidaySourceRef(holiday, date);

    if (await existsBySource(SOURCE, sourceRef)) {
      results.push({ created: null, skipped: "already-exists", holidaySlug: holiday.slug, date });
      continue;
    }

    const tr = holiday.i18n.tr;
    const slug = await uniqueSlug(`${tr.title} ${date.slice(0, 4)}`);

    // Yayın saati: tatil sabahı 09:00 Türkiye (06:00 UTC). Kullanıcı panelden
    // değiştirebilir; taslak durumunda olduğu için kendiliğinden gitmez.
    const scheduledAt = new Date(`${date}T06:00:00.000Z`);

    const created = await createPost({
      kind: "special-day",
      title: tr.title,
      excerpt: tr.excerpt,
      body: buildBody(holiday),
      hashtags: buildHashtags(holiday),
      linkUrl: null,
      imageUrl: null,
      imageAlt: `${tr.title} — ERPIDE`,
      imageMode: "auto",
      gradient: holiday.gradient,
      decoration: holiday.decoration,
      decorationSubtitle: holiday.i18n.kk?.title ?? null,
      imageBackground: null,
      slug,
      badges: [holiday.country === "BOTH" ? "TR & KZ" : holiday.country],
      productSlug: null,
      i18n: {
        en: { title: holiday.i18n.en.title, excerpt: holiday.i18n.en.excerpt },
        ru: { title: holiday.i18n.ru.title, excerpt: holiday.i18n.ru.excerpt },
        kk: { title: holiday.i18n.kk.title, excerpt: holiday.i18n.kk.excerpt },
      },
      targets: DEFAULT_TARGETS,
      scheduledAt,
      status: "draft",
      source: SOURCE,
      sourceRef,
      createdBy: "cron",
    });

    results.push({ created, holidaySlug: holiday.slug, date });
  }

  return results;
}
