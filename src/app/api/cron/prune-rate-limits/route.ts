import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

/**
 * Daily prune for RateLimitHit table.
 *
 * checkRateLimit() only reads rows from the configured window (max 10 min
 * şu an), ama satırlar olduğu yerde kalır. Burada 24h öncesi kayıtları
 * sil — tablo şişmesin, indeks taraması ucuz kalsın.
 *
 * Vercel Cron isteğinde Authorization: Bearer ${CRON_SECRET}. Manuel test
 * için CRON_SECRET unset olduğunda guard pas geçer.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await getPrisma().rateLimitHit.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return NextResponse.json({
    ok: true,
    deleted: result.count,
    cutoff: cutoff.toISOString(),
  });
}
