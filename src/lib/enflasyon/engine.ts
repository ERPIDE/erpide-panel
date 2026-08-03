/**
 * ERPIDE Gerçek Enflasyon motoru.
 *
 * Kayıt defterindeki (registry.ts) tüm parametreleri kaynaklarından toplar,
 * türetilmiş değerleri ve katman ağırlıklı kompozit "Gerçek Enflasyon"u
 * hesaplar. Hiçbir kaynak hatası koşuyu düşürmez — veri gelmeyen parametre
 * durum rozetiyle ("veri yok" / "anahtar bekliyor" / "bağlanacak") raporlanır.
 *
 * Metodoloji (rapora da yazılır):
 *   Gerçek Enflasyon = Σ katman_i × ağırlık_i  (verisi olmayan katmanın
 *   ağırlığı kalanlara oransal dağıtılır)
 *   A Resmi TÜFE · B İthal enflasyon (ithalat payı × (kur Δ + ülke TÜFE))
 *   C Geçim sepeti (gıda %60 + konut %40) · D Varlık (Konut Fiyat Endeksi)
 *   E Borçlanma maliyeti (ihtiyaç kredisi faizi) · F ENAG E-TÜFE
 */

import {
  buildRegistry, CURRENCIES, PARTNERS, COICOP_GROUPS, MIN_WAGE_SERIES,
  ENAG_LATEST, STATIC_FACTS, LAYER_WEIGHTS, ParamDef,
} from "./registry";
import {
  fetchTcmbToday, fetchTcmbArchive, fetchWorldBankCPI,
  fetchWorldBankIndicator, fetchEvdsSeries, hasEvdsKey, EvdsSeries, TcmbRate, WbValue,
} from "./sources";

export type ParamStatus = "live" | "static" | "derived" | "waiting-key" | "no-data" | "pending";

export interface ParamResult {
  key: string;
  label: string;
  category: string;
  unit: string;
  status: ParamStatus;
  value: number | null;
  /** Değerin yanında gösterilecek ek bağlam: "2025 verisi", "aylık %2,1" gibi. */
  extra?: string;
  note?: string;
}

export interface LayerResult {
  key: string;
  label: string;
  value: number | null;
  weight: number;
  effectiveWeight: number | null;
  detail?: string;
}

export interface RunData {
  period: string;
  computedAt: string;
  headline: {
    real: number | null;
    official: number | null;
    enag: number;
    gap: number | null; // gerçek − resmi
  };
  layers: LayerResult[];
  params: ParamResult[];
  stats: { total: number; live: number; static: number; derived: number; waitingKey: number; pending: number; noData: number };
  notes: string[];
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

export async function runInflationEngine(): Promise<RunData> {
  const registry = buildRegistry();
  const now = new Date();
  // Rapor bir önceki ayın verisine aittir (TÜİK/ENAG o ayı açıklamış olur).
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const period = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const notes: string[] = [];

  // ── 1. Kaynakları paralel topla ─────────────────────────────────
  const evdsCodes = [...new Set(registry.filter((p) => p.source === "evds" && p.code).map((p) => p.code as string))];

  const [ratesNow, ratesYearAgo, wbCpi, wbTurCpiSeries, wbGdp, wbUnemp, wbGdpPc, wbGini, wbPpp, evdsResults] =
    await Promise.all([
      fetchTcmbToday(),
      fetchTcmbArchive(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())),
      fetchWorldBankCPI([...PARTNERS.map((p) => p.wb), "TUR"]),
      fetchWorldBankSeriesAll("TUR", "FP.CPI.TOTL.ZG"),
      fetchWorldBankIndicator("TUR", "NY.GDP.MKTP.KD.ZG"),
      fetchWorldBankIndicator("TUR", "SL.UEM.TOTL.ZS"),
      fetchWorldBankIndicator("TUR", "NY.GDP.PCAP.CD"),
      fetchWorldBankIndicator("TUR", "SI.POV.GINI"),
      fetchWorldBankIndicator("TUR", "PA.NUS.PPP"),
      Promise.all(evdsCodes.map((c) => fetchEvdsSeries(c).then((r) => [c, r] as const))),
    ]);

  const evds = new Map<string, EvdsSeries | null>(evdsResults);
  const evdsKeyPresent = hasEvdsKey();
  if (!evdsKeyPresent) notes.push("EVDS_API_KEY tanımlı değil — TCMB EVDS serileri (TÜFE endeksi, konut endeksi, faizler) beklemede. Anahtar eklenince otomatik canlanır.");
  if (!ratesNow) notes.push("TCMB güncel kur bülteni alınamadı.");
  if (!ratesYearAgo) notes.push("TCMB 1 yıl önceki kur arşivi alınamadı — kur yıllık değişimleri hesaplanamadı.");
  if (!wbCpi) notes.push("World Bank ülke enflasyonları alınamadı — ithal enflasyon katmanı eksik kaldı.");

  // ── 2. Ara hesaplar ─────────────────────────────────────────────
  const kurDelta = new Map<string, number>(); // döviz kodu → yıllık % değişim
  if (ratesNow && ratesYearAgo) {
    for (const c of CURRENCIES) {
      const a = ratesNow.get(c.code);
      const b = ratesYearAgo.get(c.code);
      if (a && b && b.rate > 0) kurDelta.set(c.code, (a.rate / b.rate - 1) * 100);
    }
  }

  // TÜFE: EVDS varsa aylık seri, yoksa World Bank yıllık serisi (gecikmeli).
  const tufe = evds.get("TP.FG.J0") || null;
  const wbTurCpi = wbCpi?.get("TUR") || null;
  const officialYearly = tufe?.yearlyPct ?? wbTurCpi?.value ?? null;
  const officialSource = tufe?.yearlyPct != null ? "EVDS aylık seri" : wbTurCpi ? `World Bank ${wbTurCpi.year} yıllık` : null;

  // İthal enflasyon: Σ pay × (kur Δ + ülke TÜFE) / Σ pay
  const importContrib = new Map<string, number>(); // wb → katkı puanı
  let importWeighted: number | null = null;
  {
    let num = 0, den = 0;
    for (const p of PARTNERS) {
      if (p.importShare == null || p.importShare < 0.5) continue;
      const cpi = wbCpi?.get(p.wb)?.value;
      const delta = kurDelta.get(p.currency);
      if (cpi == null && delta == null) continue;
      const combined = (delta ?? 0) + (cpi ?? 0);
      importContrib.set(p.wb, (p.importShare / 100) * combined);
      num += p.importShare * combined;
      den += p.importShare;
    }
    if (den > 0) importWeighted = num / den;
  }

  // Geçim sepeti: gıda %60 + konut(kira) %40 — dar gelirli hane ağırlıkları.
  const gida = evds.get("TP.FG.J01")?.yearlyPct ?? null;
  const konutGrubu = evds.get("TP.FG.J04")?.yearlyPct ?? null;
  const gecim = gida != null && konutGrubu != null ? gida * 0.6 + konutGrubu * 0.4 : gida ?? konutGrubu;

  const kfe = evds.get("TP.HKFE01") || null;
  const faizIhtiyac = evds.get("TP.KTF10")?.latest ?? null;
  const faizMevduat = evds.get("TP.TRY.MT02")?.latest ?? null;
  const m2 = evds.get("TP.PR.ARZ13") || null;

  // ── 3. Katmanlar + kompozit ─────────────────────────────────────
  const layerValues: Record<string, { value: number | null; detail?: string }> = {
    "katman-resmi":  { value: officialYearly, detail: officialSource ?? undefined },
    "katman-ithal":  { value: importWeighted != null ? round2(importWeighted) : null, detail: `${importContrib.size} ülke, ithalat payı ağırlıklı` },
    "katman-gecim":  { value: gecim != null ? round2(gecim) : null, detail: "Gıda %60 + konut/kira %40" },
    "katman-varlik": { value: kfe?.yearlyPct != null ? round2(kfe.yearlyPct) : null, detail: "TCMB Konut Fiyat Endeksi yıllık" },
    "katman-kredi":  { value: faizIhtiyac != null ? round2(faizIhtiyac) : null, detail: "İhtiyaç kredisi yıllık faizi" },
    "katman-enag":   { value: ENAG_LATEST.yearly, detail: ENAG_LATEST.source },
  };

  const availableWeight = LAYER_WEIGHTS.reduce(
    (sum, l) => sum + (layerValues[l.key]?.value != null ? l.weight : 0), 0
  );
  let composite: number | null = null;
  const layers: LayerResult[] = LAYER_WEIGHTS.map((l) => {
    const lv = layerValues[l.key];
    const effectiveWeight = lv.value != null && availableWeight > 0 ? l.weight / availableWeight : null;
    return { key: l.key, label: l.label, value: lv.value, weight: l.weight, effectiveWeight, detail: lv.detail };
  });
  if (availableWeight > 0) {
    composite = round1(
      layers.reduce((sum, l) => sum + (l.value != null && l.effectiveWeight != null ? l.value * l.effectiveWeight : 0), 0)
    );
  }

  // ── 4. Alım gücü türetmeleri ────────────────────────────────────
  const mwNow = MIN_WAGE_SERIES[MIN_WAGE_SERIES.length - 1];
  const mwPrev = MIN_WAGE_SERIES[MIN_WAGE_SERIES.length - 2];
  const mwFirst = MIN_WAGE_SERIES[0];
  const asgariArtis = (mwNow.net / mwPrev.net - 1) * 100;
  const usdNow = ratesNow?.get("USD")?.rate ?? null;
  const usdYearAgo = ratesYearAgo?.get("USD")?.rate ?? null;
  const asgariUsd = usdNow ? mwNow.net / usdNow : null;
  const asgariUsdPrev = usdYearAgo ? mwPrev.net / usdYearAgo : null;

  // Alım gücü endeksi: asgari ücret endeksi / birikimli TÜFE (2016=100).
  // Birikimli TÜFE, World Bank yıllık serisinden (son yıl kısmi eksik — not düşülür).
  let alimGucuEndeks: number | null = null;
  if (wbTurCpiSeries) {
    let cum = 1;
    for (const row of wbTurCpiSeries) {
      if (row.year > mwFirst.year && row.year <= mwNow.year) cum *= 1 + row.value / 100;
    }
    if (cum > 1) alimGucuEndeks = round1(((mwNow.net / mwFirst.net) / cum) * 100);
  }

  // ── 5. Parametre sonuçları ──────────────────────────────────────
  const params: ParamResult[] = registry.map((def) => resolveParam(def, {
    ratesNow, kurDelta, wbCpi, evds, evdsKeyPresent, layerValues, composite,
    officialYearly, officialSource, importContrib,
    wbGdp, wbUnemp, wbGdpPc, wbGini, wbPpp, tufe, kfe, m2,
    faizIhtiyac, faizMevduat, gecimKonut: konutGrubu,
    mwNow, mwPrev, asgariArtis, asgariUsd, asgariUsdPrev, alimGucuEndeks, usdNow,
  }));

  const stats = {
    total: params.length,
    live: params.filter((p) => p.status === "live").length,
    static: params.filter((p) => p.status === "static").length,
    derived: params.filter((p) => p.status === "derived" && p.value != null).length,
    waitingKey: params.filter((p) => p.status === "waiting-key").length,
    pending: params.filter((p) => p.status === "pending").length,
    noData: params.filter((p) => p.status === "no-data" || (p.status === "derived" && p.value == null)).length,
  };

  if (wbTurCpiSeries == null) notes.push("Alım gücü endeksi için uzun TÜFE serisi alınamadı.");
  notes.push(`Metodoloji: 6 katmanlı ağırlıklı kompozit; veri gelmeyen katmanın ağırlığı kalanlara dağıtılır (bu koşuda kapsanan ağırlık: %${Math.round(availableWeight * 100)}).`);

  return {
    period,
    computedAt: now.toISOString(),
    headline: {
      real: composite,
      official: officialYearly != null ? round1(officialYearly) : null,
      enag: ENAG_LATEST.yearly,
      gap: composite != null && officialYearly != null ? round1(composite - officialYearly) : null,
    },
    layers,
    params,
    stats,
    notes,
  };
}

// ── Parametre çözümleme ───────────────────────────────────────────

interface Ctx {
  ratesNow: Map<string, TcmbRate> | null;
  kurDelta: Map<string, number>;
  wbCpi: Map<string, WbValue> | null;
  evds: Map<string, EvdsSeries | null>;
  evdsKeyPresent: boolean;
  layerValues: Record<string, { value: number | null; detail?: string }>;
  composite: number | null;
  officialYearly: number | null;
  officialSource: string | null;
  importContrib: Map<string, number>;
  wbGdp: WbValue | null; wbUnemp: WbValue | null; wbGdpPc: WbValue | null;
  wbGini: WbValue | null; wbPpp: WbValue | null;
  tufe: EvdsSeries | null; kfe: EvdsSeries | null; m2: EvdsSeries | null;
  faizIhtiyac: number | null; faizMevduat: number | null; gecimKonut: number | null;
  mwNow: { year: number; net: number; gross: number };
  mwPrev: { year: number; net: number; gross: number };
  asgariArtis: number; asgariUsd: number | null; asgariUsdPrev: number | null;
  alimGucuEndeks: number | null; usdNow: number | null;
}

function resolveParam(def: ParamDef, ctx: Ctx): ParamResult {
  const base = { key: def.key, label: def.label, category: def.category, unit: def.unit, note: def.note };
  const mk = (status: ParamStatus, value: number | null, extra?: string): ParamResult =>
    ({ ...base, status, value: value != null ? round2(value) : null, extra });

  // Döviz kurları
  if (def.source === "tcmb-xml" && def.code) {
    const r = ctx.ratesNow?.get(def.code);
    return r ? mk("live", r.rate) : mk("no-data", null);
  }
  if (def.key.startsWith("kur-") && def.key.endsWith("-yillik") && def.code) {
    const d = ctx.kurDelta.get(def.code);
    return d != null ? mk("derived", d) : mk("no-data", null);
  }

  // World Bank
  if (def.source === "worldbank") {
    if (def.code === "TUR") {
      const v = ctx.wbCpi?.get("TUR");
      return v ? mk("live", v.value, `${v.year} verisi`) : mk("no-data", null);
    }
    if (def.code?.includes("|")) {
      const map: Record<string, WbValue | null> = {
        "NY.GDP.MKTP.KD.ZG": ctx.wbGdp, "SL.UEM.TOTL.ZS": ctx.wbUnemp,
        "NY.GDP.PCAP.CD": ctx.wbGdpPc, "SI.POV.GINI": ctx.wbGini, "PA.NUS.PPP": ctx.wbPpp,
      };
      const v = map[def.code.split("|")[1]] ?? null;
      return v ? mk("live", v.value, `${v.year} verisi`) : mk("no-data", null);
    }
    const v = def.code ? ctx.wbCpi?.get(def.code) : null;
    return v ? mk("live", v.value, `${v.year} verisi`) : mk("no-data", null);
  }

  // EVDS
  if (def.source === "evds" && def.code) {
    if (!ctx.evdsKeyPresent) return mk("waiting-key", null);
    const s = ctx.evds.get(def.code);
    if (!s) return mk("no-data", null, "seri kodu doğrulanacak");
    const extra = s.yearlyPct != null ? `yıllık %${round1(s.yearlyPct)}` : s.latestDate;
    return mk("live", s.latest, extra);
  }

  // Statik seriler
  if (def.source === "static") {
    if (def.key === "asgari-net") return mk("static", ctx.mwNow.net, `${ctx.mwNow.year} yılı`);
    if (def.key === "asgari-brut") return mk("static", ctx.mwNow.gross, `${ctx.mwNow.year} yılı`);
    if (def.key === "enag-yillik") return mk("static", ENAG_LATEST.yearly, ENAG_LATEST.period);
    if (def.key === "enag-aylik") return mk("static", ENAG_LATEST.monthly, ENAG_LATEST.period);
    const fact = STATIC_FACTS.find((f) => f.key === def.key);
    if (fact) return mk("static", fact.value);
    if (def.key.startsWith("ithalat-pay-")) {
      const p = PARTNERS.find((x) => x.wb.toLowerCase() === def.key.replace("ithalat-pay-", ""));
      return mk("static", p?.importShare ?? null);
    }
    if (def.key.startsWith("ihracat-pay-")) {
      const p = PARTNERS.find((x) => x.wb.toLowerCase() === def.key.replace("ihracat-pay-", ""));
      return mk("static", p?.exportShare ?? null);
    }
    return mk("static", null);
  }

  // Türetilmişler
  if (def.source === "derived") {
    switch (def.key) {
      case "erpide-gercek-enflasyon": return mk("derived", ctx.composite);
      case "katman-resmi": case "katman-ithal": case "katman-gecim":
      case "katman-varlik": case "katman-kredi": case "katman-enag": {
        const lv = ctx.layerValues[def.key];
        return mk("derived", lv?.value ?? null, lv?.detail);
      }
      case "tufe-yillik": return mk("derived", ctx.officialYearly, ctx.officialSource ?? undefined);
      case "tufe-aylik": return mk("derived", ctx.tufe?.monthlyPct ?? null);
      case "yiufe-yillik": return mk("derived", ctx.evds.get("TP.TUFE1YI.T1")?.yearlyPct ?? null);
      case "kfe-tr-yillik": return mk("derived", ctx.kfe?.yearlyPct ?? null);
      case "konut-grubu-tufe": return mk("derived", ctx.gecimKonut);
      case "m2-yillik": return mk("derived", ctx.m2?.yearlyPct ?? null);
      case "reel-faiz":
        return ctx.faizMevduat != null && ctx.officialYearly != null
          ? mk("derived", ctx.faizMevduat - ctx.officialYearly)
          : mk("no-data", null);
      case "resmi-enag-fark":
        return ctx.officialYearly != null ? mk("derived", ctx.officialYearly - ENAG_LATEST.yearly) : mk("no-data", null);
      case "asgari-artis": return mk("derived", ctx.asgariArtis, `${ctx.mwPrev.year}→${ctx.mwNow.year}`);
      case "asgari-reel":
        return ctx.composite != null ? mk("derived", ctx.asgariArtis - ctx.composite, "gerçek enflasyona göre") : mk("no-data", null);
      case "asgari-usd": return mk("derived", ctx.asgariUsd);
      case "asgari-usd-yillik":
        return ctx.asgariUsd != null && ctx.asgariUsdPrev != null
          ? mk("derived", (ctx.asgariUsd / ctx.asgariUsdPrev - 1) * 100)
          : mk("no-data", null);
      case "alim-gucu-gunluk": return mk("derived", ctx.mwNow.net / 30);
      case "alim-gucu-endeks": return mk("derived", ctx.alimGucuEndeks, "2016=100, resmi TÜFE ile");
      case "ev-erisim": return mk("no-data", null, "ortalama konut fiyatı kaynağı bağlanınca");
    }
    if (def.key.startsWith("ithal-katki-")) {
      const wb = def.key.replace("ithal-katki-", "").toUpperCase();
      const v = ctx.importContrib.get(wb);
      return v != null ? mk("derived", v, "puan katkısı") : mk("no-data", null);
    }
    return mk("no-data", null);
  }

  // Kaynağı bağlanmamışlar
  return mk("pending", null);
}

// ── World Bank tam seri (alım gücü endeksi için) ─────────────────

async function fetchWorldBankSeriesAll(country: string, indicator: string): Promise<{ year: number; value: number }[] | null> {
  try {
    const url =
      `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}` +
      `?format=json&per_page=40&date=2015:2026`;
    const r = await fetch(url, {
      headers: { "user-agent": "ERPIDE/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = (await r.json()) as unknown[];
    const rows = (json[1] || []) as { date: string; value: number | null }[];
    const out = rows
      .filter((x) => x.value != null)
      .map((x) => ({ year: parseInt(x.date, 10), value: x.value as number }))
      .sort((a, b) => a.year - b.year);
    return out.length > 0 ? out : null;
  } catch (e) {
    console.error("[enflasyon] World Bank tam seri alınamadı:", e);
    return null;
  }
}
