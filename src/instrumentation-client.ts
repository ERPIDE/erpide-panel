/**
 * Browser tarafı Sentry init. Next.js 15.3+ otomatik olarak bu dosyayı
 * client bundle'a dahil eder (router root'tan önce çalışır).
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Browser sample rate düşük tutuyoruz — kullanıcı sayısı arttıkça
    // her sayfa view'unda bir trace event aşağı çekmez.
    tracesSampleRate: 0.05,
    // Replay: hata anında DOM snapshot + tıklama akışı. Free tier'da
    // 500 replay/ay var, kapatmıyoruz ama düşük örnekleme.
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.5,
    integrations: [
      Sentry.replayIntegration({
        // PII koruma — input ve text mask'lı.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    sendDefaultPii: false,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

// Next.js 15+ navigation transactions için lazım.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
