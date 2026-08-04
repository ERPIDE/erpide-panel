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

// ── TCMB resmi enflasyon sayfası (anahtarsız, TAM OTOMATİK) ──────
// TCMB, TÜİK'in TÜFE verisini her ay resmi sayfasında tablo olarak yayınlar.
// EVDS anahtarı olmadan güncel resmi enflasyona ulaşmanın en sağlam yolu.

export interface TuikCurrent {
  yearly: number;
  monthly: number;
  period: string; // "2026-07"
}

export async function fetchTcmbInflationPage(): Promise<TuikCurrent | null> {
  try {
    const r = await fetch(
      "https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Enflasyon+Verileri",
      {
        headers: { "user-agent": "Mozilla/5.0 (compatible; ERPIDE/1.0)" },
        cache: "no-store",
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    // Satır örneği: <td>07-2026</td><td>31.75</td><td>1.78</td>
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    for (const row of rows) {
      const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
        .map((m) => m[1].replace(/<[^>]+>/g, "").trim());
      const dateMatch = cells[0]?.match(/^(\d{2})-(\d{4})$/);
      if (!dateMatch) continue;
      const yearly = parseFloat((cells[1] || "").replace(",", "."));
      const monthly = parseFloat((cells[2] || "").replace(",", "."));
      if (!isFinite(yearly) || !isFinite(monthly)) continue;
      // İlk geçerli satır = en güncel ay.
      return { yearly, monthly, period: `${dateMatch[2]}-${dateMatch[1]}` };
    }
    return null;
  } catch (e) {
    console.error("[enflasyon] TCMB enflasyon sayfası alınamadı:", e);
    return null;
  }
}

// ── ENAG otomatik (Google News RSS taraması) ─────────────────────
// ENAG API/RSS yayınlamıyor ve sitesi bot trafiğine kapalı. Aylık açıklama
// tüm haber sitelerinde aynı kalıpla yer aldığı için Google News başlıklarından
// ayıklanır. Mantık dışı değerler elenir; bulunamazsa gömülü son değere düşülür.

const TR_MONTHS: Record<string, string> = {
  ocak: "01", "şubat": "02", subat: "02", mart: "03", nisan: "04",
  "mayıs": "05", mayis: "05", haziran: "06", temmuz: "07", "ağustos": "08",
  agustos: "08", "eylül": "09", eylul: "09", ekim: "10", "kasım": "11",
  kasim: "11", "aralık": "12", aralik: "12",
};

export interface EnagCurrent {
  yearly: number;
  monthly: number | null;
  period: string;
}

export async function fetchEnagFromNews(): Promise<EnagCurrent | null> {
  try {
    const r = await fetch(
      "https://news.google.com/rss/search?q=ENAG+enflasyon+y%C4%B1ll%C4%B1k&hl=tr&gl=TR&ceid=TR:tr",
      {
        headers: { "user-agent": "Mozilla/5.0 (compatible; ERPIDE/1.0)" },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const xml = await r.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const candidates: { yearly: number; monthly: number | null; period: string; ts: number }[] = [];
    for (const it of items) {
      const title = (it.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "")
        .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      if (!/ENAG/i.test(title)) continue;
      const pub = it.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
      const ts = pub ? Date.parse(pub) : NaN;
      // 45 günden eski haber = geçen ayların açıklaması, alma.
      if (!isFinite(ts) || Date.now() - ts > 45 * 86_400_000) continue;

      // "yıllık yüzde 50,49" / "yıllık %50,49" kalıbı — ENAG'a ait yıllık değer.
      const yearlyMatch = title.match(/y[ıi]ll[ıi]k[^%\d]{0,20}(?:y[üu]zde\s*|%\s*)(\d{1,3}[.,]\d{1,2})/i);
      if (!yearlyMatch) continue;
      const yearly = parseFloat(yearlyMatch[1].replace(",", "."));
      if (!isFinite(yearly) || yearly < 10 || yearly > 200) continue;

      // Aylık: "temmuzda yüzde 3,07" / "aylık yüzde 3,07" kalıbı (yıllıktan farklı sayı).
      let monthly: number | null = null;
      for (const m of title.matchAll(/(?:y[üu]zde\s*|%\s*)(\d{1,3}[.,]\d{1,2})/gi)) {
        const v = parseFloat(m[1].replace(",", "."));
        if (isFinite(v) && v !== yearly && v >= 0 && v < 25) { monthly = v; break; }
      }

      // Dönem: başlıktaki ay adından; yoksa haber tarihinin bir önceki ayı.
      let period: string | null = null;
      const lower = title.toLocaleLowerCase("tr-TR");
      for (const [name, no] of Object.entries(TR_MONTHS)) {
        if (lower.includes(name)) {
          const d = new Date(ts);
          // Açıklama genelde takip eden ayın başında — yıl, ay adına göre düzeltilir.
          const year = parseInt(no, 10) > d.getMonth() + 1 ? d.getFullYear() - 1 : d.getFullYear();
          period = `${year}-${no}`;
          break;
        }
      }
      if (!period) {
        const d = new Date(ts);
        const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
        period = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
      }
      candidates.push({ yearly, monthly, period, ts });
    }

    if (candidates.length === 0) return null;
    // En yeni haberi esas al; aynı değeri doğrulayan birden çok başlık varsa güven artar.
    candidates.sort((a, b) => b.ts - a.ts);
    const best = candidates[0];
    const agree = candidates.filter((c) => Math.abs(c.yearly - best.yearly) < 0.01).length;
    if (agree < 2 && candidates.length >= 3) {
      // Tek başlık farklı değer veriyorsa çoğunluğun değerini kullan.
      const counts = new Map<number, number>();
      for (const c of candidates) counts.set(c.yearly, (counts.get(c.yearly) || 0) + 1);
      const majority = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      const alt = candidates.find((c) => c.yearly === majority[0]);
      if (alt && majority[1] >= 2) return { yearly: alt.yearly, monthly: alt.monthly, period: alt.period };
    }
    return { yearly: best.yearly, monthly: best.monthly, period: best.period };
  } catch (e) {
    console.error("[enflasyon] ENAG haber taraması başarısız:", e);
    return null;
  }
}

// ── Opet akaryakıt API (anahtarsız, resmi olmayan ama istikrarlı) ─

export interface FuelPrices {
  benzin: number | null;  // Kurşunsuz 95 (A100)
  motorin: number | null; // Motorin UltraForce (A121)
}

export async function fetchOpetFuel(): Promise<FuelPrices | null> {
  try {
    // Tam tarayıcı başlıkları: Opet, veri merkezi isteklerini UA'ya göre eleyebiliyor
    // (lokalden çalışıp Vercel'den boş dönmesinin muhtemel sebebi).
    const r = await fetch("https://api.opet.com.tr/api/fuelprices/prices?ProvinceCode=034&IncludeAllProducts=true", {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        accept: "application/json, text/plain, */*",
        referer: "https://www.opet.com.tr/akaryakit-fiyatlari",
        origin: "https://www.opet.com.tr",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as { prices?: { productCode: string; amount: number }[] }[];
    const prices = json?.[0]?.prices || [];
    const pick = (code: string) => {
      const p = prices.find((x) => x.productCode === code);
      return p && isFinite(p.amount) && p.amount > 0 ? p.amount : null;
    };
    const out = { benzin: pick("A100"), motorin: pick("A121") };
    return out.benzin != null || out.motorin != null ? out : null;
  } catch (e) {
    console.error("[enflasyon] Opet akaryakıt alınamadı:", e);
    return null;
  }
}

// ── Market Fiyatı (Ticaret Bakanlığı) — zincir market raf fiyatları ─
// Devletin resmi fiyat karşılaştırma uygulamasının API'si: A101, BİM, Migros,
// ŞOK, CarrefourSA fiyatlarını toplar. Kalem başına arama yapılır, birim fiyat
// (varsa) yoksa ambalaj fiyatının MEDYANI alınır — uç ürünler medyanı bozmaz.

export interface MarketPrice {
  median: number;
  count: number;
}

export async function fetchMarketFiyati(keyword: string): Promise<MarketPrice | null> {
  try {
    const r = await fetch("https://api.marketfiyati.org.tr/api/v2/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (compatible; ERPIDE/1.0)",
      },
      body: JSON.stringify({ keywords: keyword, pages: 0, size: 12 }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as {
      content?: { productDepotInfoList?: { price?: number; unitPrice?: number }[] }[];
    };
    const prices: number[] = [];
    for (const c of json.content || []) {
      for (const p of c.productDepotInfoList || []) {
        const v = p.unitPrice != null && isFinite(p.unitPrice) && p.unitPrice > 0 ? p.unitPrice : p.price;
        if (v != null && isFinite(v) && v > 0) prices.push(v);
      }
    }
    if (prices.length < 3) return null; // tek tük sonuçla medyan güvenilmez
    prices.sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
    return { median: Math.round(median * 100) / 100, count: prices.length };
  } catch (e) {
    console.error(`[enflasyon] Market Fiyatı alınamadı (${keyword}):`, e);
    return null;
  }
}

// ── İzmir Büyükşehir açık veri: hal fiyatları (anahtarsız, resmi) ─
// https://openapi.izmir.bel.tr/api/ibb/halfiyatlari/sebzemeyve/{yyyy-MM-dd}
// Toptan hal fiyatı — market rafından düşük ama resmi ve günlük. Tarihli
// istek desteklediği için 1 yıl öncesiyle kıyas yapıp yıllık değişim üretir.

export interface HalItem {
  malId: number;
  ad: string;
  fiyat: number; // OrtalamaUcret
}

async function fetchIzmirHalAt(target: Date): Promise<Map<number, HalItem> | null> {
  // Pazar/tatil günleri bülten yok — 4 güne kadar geriye yürü (süre bütçesi:
  // cron maxDuration 60 sn, en kötü durumda burada takılıp kalmayalım).
  for (let back = 0; back < 4; back++) {
    const d = new Date(target.getTime() - back * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    try {
      const r = await fetch(`https://openapi.izmir.bel.tr/api/ibb/halfiyatlari/sebzemeyve/${iso}`, {
        headers: { "user-agent": "ERPIDE/1.0" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const json = (await r.json()) as { HalFiyatListesi?: { MalId: number; MalAdi: string; OrtalamaUcret: number }[] };
      const list = json.HalFiyatListesi || [];
      if (list.length === 0) continue;
      const out = new Map<number, HalItem>();
      for (const x of list) {
        if (isFinite(x.OrtalamaUcret) && x.OrtalamaUcret > 0) {
          out.set(x.MalId, { malId: x.MalId, ad: x.MalAdi, fiyat: x.OrtalamaUcret });
        }
      }
      if (out.size > 0) return out;
    } catch {
      // sıradaki günü dene
    }
  }
  return null;
}

export interface HalCompare {
  now: Map<number, HalItem>;
  yearAgo: Map<number, HalItem> | null;
}

export async function fetchIzmirHal(): Promise<HalCompare | null> {
  const now = new Date();
  const [current, yearAgo] = await Promise.all([
    fetchIzmirHalAt(now),
    fetchIzmirHalAt(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())),
  ]);
  if (!current) {
    console.error("[enflasyon] İzmir hal fiyatları alınamadı");
    return null;
  }
  return { now: current, yearAgo };
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
// EVDS3 gerçek servis adresi (2026): /igmevdsms-dis/ — eski /service/evds
// yolu artık SPA'ya düşüyor. Anahtar header'da gider.
const EVDS_BASES = [
  "https://evds3.tcmb.gov.tr/igmevdsms-dis/",
  "https://evds2.tcmb.gov.tr/service/evds/", // eski altyapı geri gelirse diye yedek
];

/** EVDS Tarih etiketini Date'e çevirir: "2026-7" (aylık), "24-07-2026" (günlük/haftalık), "2026" (yıllık). */
export function parseEvdsDate(s: string): Date | null {
  let m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, 15);
  m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  m = s.match(/^(\d{4})$/);
  if (m) return new Date(parseInt(m[1], 10), 6, 1);
  return null;
}

export async function fetchEvdsSeries(code: string): Promise<EvdsSeries | null> {
  const key = process.env.EVDS_API_KEY;
  if (!key) return null;
  try {
    const now = new Date();
    const start = new Date(now.getFullYear() - 2, now.getMonth(), 1);
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

    let json: { items?: Record<string, string | null>[] } | null = null;
    for (const base of EVDS_BASES) {
      try {
        const url =
          `${base}series=${encodeURIComponent(code)}` +
          `&startDate=${fmt(start)}&endDate=${fmt(now)}&type=json`;
        const r = await fetch(url, {
          headers: { ...FETCH_OPTS.headers, key },
          cache: "no-store",
          redirect: "manual", // anahtarsız/hatalı istekler SPA'ya 302'lenir — takip etme
          signal: AbortSignal.timeout(12000),
        });
        if (!r.ok) continue;
        const parsed = (await r.json()) as { items?: Record<string, string | null>[] };
        if (parsed && Array.isArray(parsed.items)) { json = parsed; break; }
      } catch {
        // JSON değil (SPA HTML'i) veya ağ hatası → sıradaki base
      }
    }
    if (!json) throw new Error("hiçbir EVDS servisi geçerli yanıt vermedi");
    const field = code.replace(/[.-]/g, "_");
    const points: { date: string; d: Date | null; value: number }[] = [];
    for (const item of json.items || []) {
      const raw = item[field];
      if (raw == null || raw === "") continue;
      const v = parseFloat(String(raw));
      if (!isFinite(v)) continue;
      const dateStr = String(item["Tarih"] ?? "");
      points.push({ date: dateStr, d: parseEvdsDate(dateStr), value: v });
    }
    if (points.length === 0) return null;
    const last = points[points.length - 1];

    // Değişimler tarih bazlı hesaplanır — seri aylık/haftalık/günlük olabilir,
    // sabit index kaydırma (12 nokta geriye) haftalık seride yanlış olur.
    const closestTo = (target: number, tolDays: number): number | null => {
      let best: { diff: number; value: number } | null = null;
      for (const p of points) {
        if (!p.d) continue;
        const diff = Math.abs(p.d.getTime() - target);
        if (diff <= tolDays * 86_400_000 && (!best || diff < best.diff)) best = { diff, value: p.value };
      }
      return best?.value ?? null;
    };
    const lastTime = last.d?.getTime() ?? null;
    const yearAgoVal = lastTime != null ? closestTo(lastTime - 365 * 86_400_000, 60) : null;
    const monthAgoVal = lastTime != null ? closestTo(lastTime - 30 * 86_400_000, 20) : null;

    return {
      latest: last.value,
      latestDate: last.date,
      monthlyPct: monthAgoVal != null && monthAgoVal !== 0 ? ((last.value / monthAgoVal) - 1) * 100 : null,
      yearlyPct: yearAgoVal != null && yearAgoVal !== 0 ? ((last.value / yearAgoVal) - 1) * 100 : null,
    };
  } catch (e) {
    console.error(`[enflasyon] EVDS serisi alınamadı (${code}):`, e);
    return null;
  }
}
