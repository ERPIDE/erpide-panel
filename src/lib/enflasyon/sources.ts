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
// Not: api.worldbank.org zaman zaman çok yavaşlıyor/kesiliyor (2026-08'de
// yaşandı). Bu yüzden: küçük ülke grupları halinde paralel + 2 deneme.
// Tamamen çökerse motor Eurostat + statik WEO yedeğine düşer.

export interface WbValue {
  value: number;
  year: number;
}

async function fetchWbBatch(wbCodes: string[], attempt: number): Promise<Map<string, WbValue>> {
  const url =
    `https://api.worldbank.org/v2/country/${wbCodes.join(";")}` +
    `/indicator/FP.CPI.TOTL.ZG?format=json&per_page=400&date=2019:2026`;
  const r = await fetch(url, { ...FETCH_OPTS, signal: AbortSignal.timeout(attempt === 0 ? 12000 : 18000) });
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
  return out;
}

/**
 * En güncel dolu yılın TÜFE enflasyonu (FP.CPI.TOTL.ZG), wbCode → {value, year}.
 * 8'erli gruplar paralel, grup başına 2 deneme; kısmi sonuç da döner.
 */
export async function fetchWorldBankCPI(wbCodes: string[]): Promise<Map<string, WbValue> | null> {
  const batches: string[][] = [];
  for (let i = 0; i < wbCodes.length; i += 8) batches.push(wbCodes.slice(i, i + 8));

  const results = await Promise.all(
    batches.map(async (batch) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await fetchWbBatch(batch, attempt);
        } catch (e) {
          if (attempt === 1) console.error("[enflasyon] WB batch başarısız:", batch.join(","), e);
        }
      }
      return new Map<string, WbValue>();
    })
  );

  const out = new Map<string, WbValue>();
  for (const m of results) for (const [k, v] of m) out.set(k, v);
  return out.size > 0 ? out : null;
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

// ── Eurostat HICP (anahtarsız, resmi) ────────────────────────────
// Türkiye dahil tüm ülkelerin uyumlaştırılmış TÜFE'si (yıllık % değişim),
// COICOP harcama grubu kırılımıyla. Veri seti ~6-7 ay gecikmeli yayınlanıyor
// (2026-08 itibarıyla son dönem 2025-12) — dönem etiketi mutlaka gösterilir.

export interface EurostatValue {
  value: number;
  period: string; // "2025-12"
}

/** JSON-stat 2.0 çok boyutlu index çözücü: her kategori kombinasyonu için düz index hesaplar. */
function jsonStatLatest(
  data: {
    id: string[];
    size: number[];
    value: Record<string, number>;
    dimension: Record<string, { category: { index: Record<string, number> } }>;
  },
  varyDim: string
): Map<string, EurostatValue> {
  const { id, size, value, dimension } = data;
  const strides: number[] = new Array(id.length);
  let acc = 1;
  for (let i = id.length - 1; i >= 0; i--) { strides[i] = acc; acc *= size[i]; }

  const varyIdx = id.indexOf(varyDim);
  const timeIdx = id.indexOf("time");
  if (varyIdx < 0 || timeIdx < 0) return new Map();

  const timeCats = Object.entries(dimension["time"].category.index).sort((a, b) => a[1] - b[1]);
  const out = new Map<string, EurostatValue>();

  for (const [cat, catPos] of Object.entries(dimension[varyDim].category.index)) {
    // Diğer boyutlar tek kategorili (freq/unit sabit) — pozisyonları 0.
    let base = 0;
    for (let i = 0; i < id.length; i++) {
      if (i === varyIdx) base += catPos * strides[i];
      else if (i !== timeIdx) base += 0;
    }
    // En yeni dolu dönemi bul (sondan geriye).
    for (let t = timeCats.length - 1; t >= 0; t--) {
      const v = value[String(base + timeCats[t][1] * strides[timeIdx])];
      if (v != null && isFinite(v)) { out.set(cat, { value: v, period: timeCats[t][0] }); break; }
    }
  }
  return out;
}

/** Türkiye HICP: genel + 12 COICOP grubu tek çağrıda. Dönen map: "CP00".."CP12" → değer. */
export async function fetchEurostatTR(): Promise<Map<string, EurostatValue> | null> {
  try {
    const coicops = ["CP00", "CP01", "CP02", "CP03", "CP04", "CP05", "CP06", "CP07", "CP08", "CP09", "CP10", "CP11", "CP12"];
    const url =
      "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr" +
      `?format=JSON&lang=EN&geo=TR&lastTimePeriod=4&` + coicops.map((c) => `coicop=${c}`).join("&");
    const r = await fetch(url, { ...FETCH_OPTS, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const map = jsonStatLatest(await r.json(), "coicop");
    return map.size > 0 ? map : null;
  } catch (e) {
    console.error("[enflasyon] Eurostat TR alınamadı:", e);
    return null;
  }
}

/** AB üyesi ticaret ortaklarının genel HICP'si. Dönen map: geo kodu ("DE") → değer. */
export async function fetchEurostatPartners(geos: string[]): Promise<Map<string, EurostatValue> | null> {
  try {
    const url =
      "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr" +
      `?format=JSON&lang=EN&coicop=CP00&lastTimePeriod=4&` + geos.map((g) => `geo=${g}`).join("&");
    const r = await fetch(url, { ...FETCH_OPTS, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const map = jsonStatLatest(await r.json(), "geo");
    return map.size > 0 ? map : null;
  } catch (e) {
    console.error("[enflasyon] Eurostat ortak ülkeler alınamadı:", e);
    return null;
  }
}

// ── Truncgil (anahtarsız) — canlı altın/gümüş TL fiyatları ───────

export interface TruncgilPrices {
  gramAltin: number | null;
  onsAltinUsd: number | null;
  gumusGram: number | null;
}

/** "4.094,50" biçimli TR sayısını parse eder. */
function parseTrNumber(s: unknown): number | null {
  if (typeof s !== "string") return null;
  const v = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isFinite(v) ? v : null;
}

export async function fetchTruncgil(): Promise<TruncgilPrices | null> {
  try {
    const r = await fetch("https://finans.truncgil.com/today.json", {
      ...FETCH_OPTS,
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as Record<string, { ["Satış"]?: string } | undefined>;
    return {
      gramAltin: parseTrNumber(json["gram-altin"]?.["Satış"]),
      onsAltinUsd: parseTrNumber(json["ons"]?.["Satış"]),
      gumusGram: parseTrNumber(json["gumus"]?.["Satış"]),
    };
  } catch (e) {
    console.error("[enflasyon] Truncgil alınamadı:", e);
    return null;
  }
}

// ── Yahoo Finance chart (anahtarsız) — 1 yıllık değişim ──────────
// GC=F (altın ons), SI=F (gümüş ons), XU100.IS (BIST 100) için kullanılır.

export interface YearlySeries {
  last: number;
  yearlyPct: number;
}

export async function fetchYahooYearly(symbol: string): Promise<YearlySeries | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1mo`;
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; ERPIDE/1.0)" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as {
      chart?: { result?: { indicators?: { quote?: { close?: (number | null)[] }[] } }[] };
    };
    const closes = (json.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(
      (x): x is number => x != null && isFinite(x)
    );
    if (closes.length < 2) return null;
    const first = closes[0], last = closes[closes.length - 1];
    if (first <= 0) return null;
    return { last, yearlyPct: (last / first - 1) * 100 };
  } catch (e) {
    console.error(`[enflasyon] Yahoo ${symbol} alınamadı:`, e);
    return null;
  }
}

// ── Binance (anahtarsız) — BTC yıllık değişim ────────────────────

export async function fetchBinanceBtcYearly(): Promise<YearlySeries | null> {
  try {
    const r = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1M&limit=13", {
      ...FETCH_OPTS,
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const rows = (await r.json()) as [number, string, string, string, string][];
    if (!Array.isArray(rows) || rows.length < 2) return null;
    const firstClose = parseFloat(rows[0][4]);
    const lastClose = parseFloat(rows[rows.length - 1][4]);
    if (!isFinite(firstClose) || !isFinite(lastClose) || firstClose <= 0) return null;
    return { last: lastClose, yearlyPct: (lastClose / firstClose - 1) * 100 };
  } catch (e) {
    console.error("[enflasyon] Binance BTC alınamadı:", e);
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
// EVDS 2026'da evds3.tcmb.gov.tr'ye taşındı; eski host yedek olarak denenir.
const EVDS_HOSTS = ["https://evds3.tcmb.gov.tr", "https://evds2.tcmb.gov.tr"];

export async function fetchEvdsSeries(code: string): Promise<EvdsSeries | null> {
  const key = process.env.EVDS_API_KEY;
  if (!key) return null;
  try {
    const now = new Date();
    const start = new Date(now.getFullYear() - 2, now.getMonth(), 1);
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

    let json: { items?: Record<string, string | null>[] } | null = null;
    for (const host of EVDS_HOSTS) {
      try {
        const url =
          `${host}/service/evds/series=${encodeURIComponent(code)}` +
          `&startDate=${fmt(start)}&endDate=${fmt(now)}&type=json`;
        const r = await fetch(url, {
          headers: { ...FETCH_OPTS.headers, key },
          cache: "no-store",
          redirect: "manual", // evds2, anahtarsız istekleri SPA'ya 302'ler — takip etme
          signal: AbortSignal.timeout(12000),
        });
        if (!r.ok) continue;
        const parsed = (await r.json()) as { items?: Record<string, string | null>[] };
        if (parsed && Array.isArray(parsed.items)) { json = parsed; break; }
      } catch {
        // JSON değil (SPA HTML'i) veya ağ hatası → sıradaki host
      }
    }
    if (!json) throw new Error("hiçbir EVDS host'u geçerli yanıt vermedi");
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
