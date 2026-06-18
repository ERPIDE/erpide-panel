/**
 * Login / kayıt / yükleme gibi suistimale açık route'lar için per-IP rate
 * limit. Her isteği RateLimitHit tablosuna log'lar, son window içindeki
 * sayıyı sayar; eşik aşılırsa 429 dönmek için sinyal verir.
 *
 * Neden Neon: Upstash/Vercel KV kurmamak için. Yük az (sensitive endpoint
 * sayısı az), Neon HTTP latency'i (50-150ms) login akışlarında problem
 * değil. Yoğunluk artarsa Redis'e geçiş tek bir wrapper değişikliği.
 *
 * Hassasiyet: IP başına. Vercel arkasında olduğumuz için x-forwarded-for
 * doğrudur (Vercel headers'a kendi proxy IP'sini değil client'ı yazar).
 *
 * Pruning: günlük cron 24h öncesi satırları siler (scripts/prune-rate-limits)
 * — tablo şişmesin.
 */
import { getPrisma } from "./db";

export interface RateLimitConfig {
  /** Logical key: "login_admin", "login_shop", "register", "oauth_init"... */
  scope: string;
  /** Bu kadar saniye içinde, */
  windowSeconds: number;
  /** bu kadar girişimden fazlası reddedilir. */
  maxAttempts: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** 429 dönerken Retry-After header'ı için (saniye). */
  retryAfterSeconds: number;
}

/** Çoğu deploy'da Vercel'in proxy IP'si zaten temizlenmiş olarak gelir.
 * Hem `Request` hem `NextRequest` kabul eder. */
export function clientIp(req: { headers: Headers }): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function checkRateLimit(
  config: RateLimitConfig,
  ipAddress: string,
): Promise<RateLimitResult> {
  const prisma = getPrisma();
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000);

  const recent = await prisma.rateLimitHit.findMany({
    where: {
      scope: config.scope,
      ipAddress,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  // Her istek log'lanır — sonraki isteklerde sayıya dahil olsun diye.
  await prisma.rateLimitHit.create({
    data: { scope: config.scope, ipAddress },
  });

  const usedAttempts = recent.length + 1;
  const allowed = usedAttempts <= config.maxAttempts;
  const remaining = Math.max(0, config.maxAttempts - usedAttempts);

  // İlk hit'in window dışına çıkacağı an = retry-after.
  let retryAfterSeconds = 0;
  if (!allowed && recent.length > 0) {
    const oldest = recent[0].createdAt.getTime();
    const expiresAt = oldest + config.windowSeconds * 1000;
    retryAfterSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
  }

  return { allowed, remaining, retryAfterSeconds };
}

/** 429 yanıtı oluşturmak için ortak format. */
export function rateLimitedResponse(retryAfterSeconds: number) {
  return new Response(
    JSON.stringify({
      error: "Çok fazla deneme — biraz sonra tekrar dene",
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
      },
    },
  );
}
