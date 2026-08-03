/**
 * Enflasyon motoru veri kaynakları.
 *
 * Hepsi fx-tcmb.ts kalıbını izler: timeout'lu fetch, sessiz ama izlenebilir
 * hata (null döner, motor parametreyi "veri yok" işaretler), asla throw ile
 * tüm koşuyu düşürmez.
 */

const FETCH_OPTS = {
  headers: { "user-agent": "ERPIDE/1.0" },
  cache: "no-store" as const,
};

// ── TCMB kur XML'i (anahtarsız) ──────────────────────────────────

export interface TcmbRate {
  code: string;
  /** 1 birim dövizin TL karşılığı (Unit'e bölünmüş — JPY gibi 100'lük kurlar normalize). */
  rate: number;
}

function parseTcmbXml(xml: string): Map<string, TcmbRate> {
  const out = new Map<string, TcmbRate>();
  const re = /<Currency[^>]+Kod="([A-Z]{3})"[^>]*>([\s\S]*?)<\/Currency>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const code = m[1];
    const block = m[2];
    const unitMatch = block.match(/<Unit>(\d+)<\/Unit>/);
    // ForexSelling bazı kurlarda boş olabilir → BanknoteSelling / ForexBuying'e düş.
    const sellMatch =
      block.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/) ||
      block.match(/<BanknoteSelling>([\d.]+)<\/BanknoteSelling>/) ||
      block.match(/<ForexBuying>([\d.]+)<\/ForexBuying>/);
    if (!sellMatch) continue;
    const unit = unitMatch ? parseInt(unitMatch[1], 10) || 1 : 1;
    const rate = parseFloat(sellMatch[1]) / unit;
    if (isFinite(rate) && rate > 0) out.set(code, { code, rate });
  }
  return out;
}

/** Bugünün tüm kurları. */
export async function fetchTcmbToday(): Promise<Map<string, TcmbRate> | null> {
  try {
    const r = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      ...FETCH_OPTS,
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const map = parseTcmbXml(await r.text());
    return map.size > 0 ? map : null;
  } catch (e) {
    console.error("[enflasyon] TCMB today.xml alınamadı:", e);
    return null;
  }
}

/**
 * Belirli bir tarihin kur arşivi. Hafta sonu/tatilde bülten yoktur —
 * 10 güne kadar geriye yürür.
 */
export async function fetchTcmbArchive(target: Date): Promise<Map<string, TcmbRate> | null> {
  for (let back = 0; back < 10; back++) {
    const d = new Date(target.getTime() - back * 86_400_000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const url = `https://www.tcmb.gov.tr/kurlar/${yyyy}${mm}/${dd}${mm}${yyyy}.xml`;
    try {
      const r = await fetch(url, { ...FETCH_OPTS, signal: AbortSignal.timeout(9000) });
      if (!r.ok) continue; // bülten yok (404) → bir gün geri
      const map = parseTcmbXml(await r.text());
      if (map.size > 0) return map;
    } catch {
      // ağ hatası → bir önceki günü dene
    }
  }
  console.error("[enflasyon] TCMB arşiv kuru bulunamadı:", target.toISOString().slice(0, 10));
  return null;
}

// ── World Bank API (anahtarsız) ──────────────────────────────────

export interface WbValue {
  value: number;
  year: number;
}

/**
 * Çok ülkeli tek çağrı: en güncel dolu yılın TÜFE enflasyonu (FP.CPI.TOTL.ZG).
 * Dönen map: wbCode → { value, year }.
 */
export async function fetchWorldBankCPI(wbCodes: string[]): Promise<Map<string, WbValue> | null> {
  try {
    const url =
      `https://api.worldbank.org/v2/country/${wbCodes.join(";")}` +
      `/indicator/FP.CPI.TOTL.ZG?format=json&per_page=800&date=2019:2026`;
    const r = await fetch(url, { ...FETCH_OPTS, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as unknown[];
    const rows = (json[1] || []) as { countryiso3code: string; date: string; value: number | null }[];
    const out = new Map<string, WbValue>();
    for (const row of rows) {
      if (row.value == null) continue;
      const year = parseInt(row.date, 10);
      const prev = out.get(row.countryiso3code);
      if (!prev || year > prev.year) out.set(row.countryiso3code, { value: row.value, year });
    }
    return out.size > 0 ? out : null;
  } catch (e) {
    console.error("[enflasyon] World Bank CPI alınamadı:", e);
    return null;
  }
}

/** Tek ülke + tek indikatör (TUR makro serileri için). */
export async function fetchWorldBankIndicator(country: string, indicator: string): Promise<WbValue | null> {
  try {
    const url =
      `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}` +
      `?format=json&per_page=20&date=2015:2026`;
    const r = await fetch(url, { ...FETCH_OPTS, signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as unknown[];
    const rows = (json[1] || []) as { date: string; value: number | null }[];
    for (const row of rows) {
      // WB en yeni yılı ilk sırada döner; ilk dolu değeri al.
      if (row.value != null) return { value: row.value, year: parseInt(row.date, 10) };
    }
    return null;
  } catch (e) {
    console.error(`[enflasyon] World Bank ${indicator} alınamadı:`, e);
    return null;
  }
}

// ── TCMB EVDS API (EVDS_API_KEY gerekir) ─────────────────────────

export interface EvdsSeries {
  latest: number;
  latestDate: string;
  monthlyPct: number | null; // son ay değişimi
  yearlyPct: number | null;  // 12 ay önceye göre değişim
}

export function hasEvdsKey(): boolean {
  return !!process.env.EVDS_API_KEY;
}

/**
 * Tek EVDS serisi çeker, son değer + aylık/yıllık % değişim hesaplar.
 * Anahtar yoksa veya seri kodu ölüyse null (motor "waiting-key"/"veri yok" yazar).
 */
export async function fetchEvdsSeries(code: string): Promise<EvdsSeries | null> {
  const key = process.env.EVDS_API_KEY;
  if (!key) return null;
  try {
    const now = new Date();
    const start = new Date(now.getFullYear() - 2, now.getMonth(), 1);
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
    const url =
      `https://evds2.tcmb.gov.tr/service/evds/series=${encodeURIComponent(code)}` +
      `&startDate=${fmt(start)}&endDate=${fmt(now)}&type=json`;
    const r = await fetch(url, {
      headers: { ...FETCH_OPTS.headers, key },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as { items?: Record<string, string | null>[] };
    const field = code.replace(/[.-]/g, "_");
    const points: { date: string; value: number }[] = [];
    for (const item of json.items || []) {
      const raw = item[field];
      if (raw == null || raw === "") continue;
      const v = parseFloat(String(raw));
      if (!isFinite(v)) continue;
      points.push({ date: String(item["Tarih"] ?? ""), value: v });
    }
    if (points.length === 0) return null;
    const last = points[points.length - 1];
    const prevMonth = points.length >= 2 ? points[points.length - 2] : null;
    const prevYear = points.length >= 13 ? points[points.length - 13] : null;
    return {
      latest: last.value,
      latestDate: last.date,
      monthlyPct: prevMonth ? ((last.value / prevMonth.value) - 1) * 100 : null,
      yearlyPct: prevYear ? ((last.value / prevYear.value) - 1) * 100 : null,
    };
  } catch (e) {
    console.error(`[enflasyon] EVDS serisi alınamadı (${code}):`, e);
    return null;
  }
}
