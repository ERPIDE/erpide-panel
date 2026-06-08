/**
 * TCMB günlük döviz kuru çekici.
 *
 * Endpoint: https://www.tcmb.gov.tr/kurlar/today.xml
 * XML formatında o günün satış/alış kurları gelir. Hafta sonu / tatil
 * günlerinde TCMB güncellemediği için son işlem gününün kurları döner —
 * bu kabul edilebilir (havale tahsilatı bir sonraki iş gününde olacak).
 *
 * 1-saatlik bellekteki cache (kur saat 15:30'da güncellenir, 1 saat overkill
 * değil — ödeme kararı kritik, kullanıcıya hep aynı tutar gösterilsin).
 */

interface CachedRate {
  rate: number;
  date: string; // YYYY-MM-DD
  fetchedAt: number;
}

let cache: CachedRate | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 saat

/**
 * Bugünün USD satış kurunu (TCMB "ForexSelling") döndürür.
 * Cache miss / network hatası → fallback 40.0 (asla null dönmez).
 */
export async function getUSDToTRY(): Promise<{ rate: number; date: string; fromCache: boolean }> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { rate: cache.rate, date: cache.date, fromCache: true };
  }

  try {
    const r = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      headers: { "user-agent": "ERPIDE/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`TCMB HTTP ${r.status}`);
    const xml = await r.text();

    // <Currency CrossOrderForUSD="1" Kod="USD"> ... <ForexSelling>40.1234</ForexSelling> ...
    const usdBlock = xml.match(/<Currency[^>]+Kod="USD"[^>]*>([\s\S]*?)<\/Currency>/);
    if (!usdBlock) throw new Error("USD bloğu bulunamadı");
    const sellMatch = usdBlock[1].match(/<ForexSelling>([\d.]+)<\/ForexSelling>/);
    if (!sellMatch) throw new Error("ForexSelling bulunamadı");
    const rate = parseFloat(sellMatch[1]);
    if (!isFinite(rate) || rate <= 0) throw new Error("Geçersiz kur");

    // Tarih de XML kökünden: <Tarih_Date Tarih="08.06.2026" Date="06/08/2026" Bulten_No="...">
    const dateMatch = xml.match(/Date="(\d{2})\/(\d{2})\/(\d{4})"/);
    const date = dateMatch
      ? `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`
      : new Date().toISOString().slice(0, 10);

    cache = { rate, date, fetchedAt: Date.now() };
    return { rate, date, fromCache: false };
  } catch {
    // Sessiz fallback — havale tutarını göstermek için her zaman bir değer dön.
    // Admin paneli "fxRate" alanından bu fallback olduğunu anlar.
    const fallback = cache?.rate || 40.0;
    return { rate: fallback, date: cache?.date || new Date().toISOString().slice(0, 10), fromCache: !!cache };
  }
}

/**
 * USD tutarını TRY'ye çevir + tam sayıya yuvarla (alta).
 * 90 USD × 47.86 = 4307.4 → 4300 (en yakın 100'e yuvarla, alta).
 *
 * Kural: 100 altı → 10'a yuvarla; 100 üstü → 100'e yuvarla.
 * Hep KAVUNAYA YUVARLAR (Math.floor) — kullanıcı lehine.
 */
export function roundDownTRY(amount: number): number {
  if (amount < 100) return Math.floor(amount / 10) * 10;
  return Math.floor(amount / 100) * 100;
}

/**
 * Tek atışta USD → TRY (yuvarlanmış).
 */
export async function convertUSDToTRYRounded(usd: number): Promise<{
  amountTRY: number;
  fxRate: number;
  fxRateDate: string;
  fromCache: boolean;
  rawTRY: number;
}> {
  const { rate, date, fromCache } = await getUSDToTRY();
  const rawTRY = usd * rate;
  const amountTRY = roundDownTRY(rawTRY);
  return { amountTRY, fxRate: rate, fxRateDate: date, fromCache, rawTRY };
}
