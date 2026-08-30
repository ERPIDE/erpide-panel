import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getTodayHolidays, getUpcomingHolidays } from "@/lib/holidays";
import { HAS_DB } from "@/lib/db";
import { DRAFT_LEAD_DAYS, generateUpcomingDrafts } from "@/lib/social/holiday-drafts";
import { emailFooter, emailHeader } from "@/lib/email-template";

/**
 * Vercel Cron — her gün 07:00 UTC (Türkiye 10:00, Kazakistan 13:00) çalışır.
 *
 * Görevi:
 *  1. Önümüzdeki {DRAFT_LEAD_DAYS} gün içindeki tatiller için sosyal post
 *     taslağı hazırlar (varsa atlar) — otomatik yayın YOK, onay bekler.
 *  2. Yeni taslak ürettiyse panele bakılsın diye e-posta bildirimi atar.
 *  3. Bugünün ve yaklaşan tatillerin listesini raporlar (log + response).
 *
 * Authorization: Vercel Cron isteğinde `Authorization: Bearer ${CRON_SECRET}`
 * header'ı set eder. Manuel test için secret tanımsızsa kontrol atlanır.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NOTIFY_TO = process.env.SOCIAL_NOTIFY_EMAIL || "info@erpide.com";
const PANEL_URL = "https://www.erpide.com/admin/sosyal";

export async function GET(req: Request) {
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

  console.log(`[cron/check-holidays] ${today}: ${todayHolidays.length} bugünkü tatil, ${upcoming.length} 7-gün ileri tatil`);
  for (const h of todayHolidays) {
    console.log(`  - BUGÜN: ${h.slug} (${h.country}) — ${h.i18n.tr.title}`);
  }

  // Taslak üretimi DB gerektirir; DB yoksa cron yalnızca rapor verir.
  let drafted: Array<{ title: string; date: string; id: string }> = [];
  if (HAS_DB) {
    try {
      const results = await generateUpcomingDrafts();
      drafted = results
        .filter((r) => r.created)
        .map((r) => ({ title: r.created!.title, date: r.date, id: r.created!.id }));

      for (const d of drafted) {
        console.log(`  - TASLAK OLUŞTURULDU: ${d.title} (${d.date})`);
      }
    } catch (e) {
      // Taslak üretimi patlarsa cron'un geri kalanı (raporlama) yine çalışsın.
      console.error("[cron/check-holidays] taslak üretimi başarısız:", e);
    }
  }

  if (drafted.length > 0) {
    await notifyDrafts(drafted).catch((e) =>
      console.error("[cron/check-holidays] bildirim e-postası gönderilemedi:", e),
    );
  }

  return NextResponse.json({
    today,
    todayCount: todayHolidays.length,
    upcomingCount: upcoming.length,
    draftLeadDays: DRAFT_LEAD_DAYS,
    draftedCount: drafted.length,
    drafted,
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

/** Yeni taslaklar için tek bir özet e-posta — her taslağa ayrı mail atmayalım. */
async function notifyDrafts(drafted: Array<{ title: string; date: string }>): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const rows = drafted
    .map(
      (d) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(d.title)}</strong><br><span style="color:#6b7280;font-size:13px">${d.date}</span></td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb">
      ${emailHeader}
      <div style="padding:28px 32px;background:#ffffff">
        <h2 style="margin:0 0 8px;font-size:18px;color:#111827">Özel gün paylaşımı onay bekliyor</h2>
        <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px">
          Yaklaşan özel gün${drafted.length > 1 ? "ler" : ""} için taslak hazırlandı.
          İçeriği gözden geçirip yayınlamak veya zamanlamak için panele girin.
        </p>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
        <p style="margin:24px 0 0">
          <a href="${PANEL_URL}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600">Panelde aç</a>
        </p>
      </div>
      ${emailFooter}
    </div>`;

  await new Resend(apiKey).emails.send({
    from: process.env.RESEND_FROM_EMAIL || "bildirim@erpide.com",
    to: NOTIFY_TO,
    subject: `Onay bekleyen paylaşım: ${drafted[0].title}${drafted.length > 1 ? ` (+${drafted.length - 1})` : ""}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
}
