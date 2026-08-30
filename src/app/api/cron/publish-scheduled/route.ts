/**
 * Vercel Cron — zamanı gelmiş postları yayınlar.
 *
 * Panelde "Zamanla" seçilen post `scheduled` durumunda bekler; bu cron
 * scheduledAt'i geçmiş olanları alıp yayın motoruna verir.
 *
 * Sıklık: günde bir, 06:00 UTC (Türkiye 09:00) — vercel.json.
 *
 * DİKKAT: Bu sıklık Vercel **Hobby planının** sınırıdır (günde bir koşu).
 * Pratik sonucu: zamanlama gün hassasiyetindedir. "23 Nisan 14:00" için
 * zamanlanan post, 24 Nisan 09:00 koşusunda gider — çünkü 23 Nisan 09:00'da
 * henüz vakti gelmemiştir. Saat hassasiyetli zamanlama isteniyorsa plan Pro'ya
 * çıkarılıp schedule "*\/15 * * * *" yapılmalı; kodda başka değişiklik gerekmez.
 *
 * Bu yüzden panelde saatli yayın için "Şimdi yayınla" önerilir; zamanlama,
 * "o gün sabah çıksın" senaryosu için uygundur.
 *
 * Authorization: Vercel `Bearer ${CRON_SECRET}` gönderir.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { HAS_DB } from "@/lib/db";
import { publishPost } from "@/lib/social/publish";
import { listDueScheduled, markPostStatus } from "@/lib/social/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Birden çok post + Instagram beklemesi uzun sürebilir.
export const maxDuration = 300;

/** Tek koşuda yayınlanacak azami post — cron süresi taşmasın. */
const MAX_PER_RUN = 5;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!HAS_DB) {
    return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });
  }

  const due = await listDueScheduled();
  const batch = due.slice(0, MAX_PER_RUN);
  const results: Array<{ postId: string; title: string; status: string; error?: string }> = [];

  for (const post of batch) {
    try {
      const outcome = await publishPost(post.id, { skipSucceeded: true });
      results.push({ postId: post.id, title: post.title, status: outcome.status });
      if (post.slug) {
        revalidatePath("/gundem");
        revalidatePath(`/gundem/${post.slug}`);
      }
    } catch (e) {
      // Yayın hiç başlayamadı (ör. slug eksik, görsel yok). Post "scheduled"
      // kalırsa her koşuda yeniden denenip aynı hatayı üretir; failed'a çekmek
      // panelde görünür kılar ve kullanıcı düzeltip tekrar zamanlayabilir.
      const error = e instanceof Error ? e.message : "bilinmeyen hata";
      await markPostStatus(post.id, "failed").catch(() => undefined);
      results.push({ postId: post.id, title: post.title, status: "failed", error });
      console.error(`[cron/publish-scheduled] ${post.id} yayınlanamadı:`, error);
    }
  }

  console.log(
    `[cron/publish-scheduled] ${due.length} bekleyen, ${batch.length} işlendi`,
  );

  return NextResponse.json({
    due: due.length,
    processed: batch.length,
    remaining: Math.max(0, due.length - batch.length),
    results,
  });
}
