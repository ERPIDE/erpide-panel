import { NextResponse } from "next/server";
import { getTodayHolidays, getUpcomingHolidays } from "@/lib/holidays";

/**
 * Vercel Cron — her gün 07:00 UTC (Türkiye 10:00, Kazakistan 13:00) çalışır.
 *
 * Görevi:
 *  1. Bugün özel gün varsa → log + (Faz 3) social media auto-post tetikle
 *  2. Önümüzdeki 7 gün içindeki yaklaşan tatilleri rapor et
 *  3. /api/og/holiday/[slug] cache'ini ısıt (opsiyonel, Faz 3'te değerlendir)
 *
 * Authorization: Vercel Cron isteğinde `Authorization: Bearer ${CRON_SECRET}`
 * header'ı set eder (env vars'ta CRON_SECRET tanımlı olmalı). Manuel test
 * için bu header olmadan çağırılabilir (development).
 */
export async function GET(req: Request) {
  // Production'da Vercel cron secret kontrolü (env yoksa skip — local test için)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const todayHolidays = getTodayHolidays();
  const upcoming = getUpcomingHolidays(7);

  // Console log — Vercel logs panel'inden görülebilir.
  console.log(`[cron/check-holidays] ${today}: ${todayHolidays.length} bugünkü tatil, ${upcoming.length} 7-gün ileri tatil`);
  for (const h of todayHolidays) {
    console.log(`  - BUGÜN: ${h.slug} (${h.country}) — ${h.i18n.tr.title}`);
  }
  for (const u of upcoming) {
    if (u.date !== today) {
      console.log(`  - YAKLAŞAN ${u.date}: ${u.holiday.slug} (${u.holiday.country})`);
    }
  }

  // Faz 3 hazırlığı: burada sosyal medya API'leri çağrılacak (LinkedIn,
  // Instagram, X). Şimdilik sadece response döner.
  return NextResponse.json({
    today,
    todayCount: todayHolidays.length,
    upcomingCount: upcoming.length,
    today_holidays: todayHolidays.map((h) => ({
      slug: h.slug,
      country: h.country,
      title_tr: h.i18n.tr.title,
      title_en: h.i18n.en.title,
    })),
    upcoming: upcoming.map((u) => ({
      date: u.date,
      slug: u.holiday.slug,
      country: u.holiday.country,
    })),
  });
}
