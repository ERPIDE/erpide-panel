/**
 * Next.js instrumentation hook — bütün runtime'lar (Node + Edge) için
 * server tarafı başlangıç noktası. Browser tarafı `instrumentation-client.ts`'de.
 *
 * Sentry init'i runtime'a göre bölünür çünkü Edge'de Node-only API'lar
 * (fs, crypto.randomUUID gibi) yok — Sentry SDK iki ayrı bundle gönderir.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      // Cold start çok sık değil (her Vercel function instance'ı için 1 kez),
      // tüm hataları yakalamak istiyoruz.
      tracesSampleRate: 0.1,
      // Prod'da console.error / unhandled rejection da yakalansın.
      sendDefaultPii: false,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }
}

// Next.js 15+ pattern — server hata'larını Sentry'e iletmek için.
export const onRequestError = Sentry.captureRequestError;
