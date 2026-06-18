import * as Sentry from "@sentry/nextjs";

/**
 * Sentry kurulumu sağlık kontrolü — kasıtlı throw atar, Sentry'e ulaştığını
 * doğrulamak için Sentry dashboard'una bir test issue düşmesi beklenir.
 * Cron secret ile korunur ki rastgele bot/kullanıcı tetikleyemesin.
 *
 * Manuel çağrı:
 *   curl -H "Authorization: Bearer ${CRON_SECRET}" https://erpide.com/api/cron/sentry-test
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const err = new Error("Sentry kurulum testi — bu hatayı dashboard'da görmen lazım");
  Sentry.captureException(err);
  await Sentry.flush(2000);

  throw err;
}
