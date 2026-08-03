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
  ENAG_LATEST, TUIK_LATEST, STATIC_FACTS, LAYER_WEIGHTS, ParamDef,
} from "./registry";
import {
  fetchTcmbToday, fetchTcmbArchive, fetchWorldBankCPI,
  fetchWorldBankIndicator, fetchEvdsSeries, hasEvdsKey, EvdsSeries, TcmbRate, WbValue,
  fetchEurostatTR, fetchEurostatPartners, fetchTruncgil, fetchYahooYearly,
  fetchBinanceBtcYearly, EurostatValue, fetchOpetFuel, fetchIzmirHal,
  fetchTcmbInflationPage, fetchEnagFromNews,
} from "./sources";

/** Panelden girilen aylık bülten değerleri — yoksa registry'deki gömülü son değer. */
export interface ManualEntry {
  yearly: number;
  monthly: number;
  period: string; // "2026-07"
}
export interface ManualValues {
  tuik?: ManualEntry | null;
  enag?: ManualEntry | null;
}

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

export async function runInflationEngine(manual?: ManualValues): Promise<RunData> {
  const registry = buildRegistry();
  const now = new Date();

  // Yedek zincirin son halkaları: panelden girilmiş değer > gömülü sabit.
  // Birincil kaynaklar (EVDS / TCMB sayfası / haber taraması) fetch'ten sonra çözülür.
  const tuikFallback = manual?.tuik
    ? { ...manual.tuik, source: `TÜİK ${manual.tuik.period} bülteni (panelden)` }
    : TUIK_LATEST;
  const enagFallback = manual?.enag
    ? { ...manual.enag, source: `ENAG ${manual.enag.period} açıklaması (panelden)` }
    : ENAG_LATEST;
  // Rapor bir önceki ayın verisine aittir (TÜİK/ENAG o ayı açıklamış olur).
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const period = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const notes: string[] = [];

  // ── 1. Kaynakları paralel topla ─────────────────────────────────
  const evdsCodes = [...new Set(registry.filter((p) => p.source === "evds" && p.code).map((p) => p.code as string))];

  const eurostatGeos = PARTNERS.filter((p) => p.eurostat).map((p) => p.eurostat as string);

  const [
    ratesNow, ratesYearAgo, wbCpi, wbTurCpiSeries, wbGdp, wbUnemp, wbGdpPc, wbGini, wbPpp,
    eurostatTR, eurostatPartners, truncgil, yahooGold, yahooSilver, yahooBist, binanceBtc,
    evdsResults,
  ] = await Promise.all([
    fetchTcmbToday(),
    fetchTcmbArchive(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())),
    fetchWorldBankCPI([...PARTNERS.map((p) => p.wb), "TUR"]),
    fetchWorldBankSeriesAll("TUR", "FP.CPI.TOTL.ZG"),
    fetchWorldBankIndicator("TUR", "NY.GDP.MKTP.KD.ZG"),
    fetchWorldBankIndicator("TUR", "SL.UEM.TOTL.ZS"),
    fetchWorldBankIndicator("TUR", "NY.GDP.PCAP.CD"),
    fetchWorldBankIndicator("TUR", "SI.POV.GINI"),
    fetchWorldBankIndicator("TUR", "PA.NUS.PPP"),
    fetchEurostatTR(),
    fetchEurostatPartners(eurostatGeos),
    fetchTruncgil(),
    fetchYahooYearly("GC=F"),
    fetchYahooYearly("SI=F"),
    fetchYahooYearly("XU100.IS"),
    fetchBinanceBtcYearly(),
    Promise.all(evdsCodes.map((c) => fetchEvdsSeries(c).then((r) => [c, r] as const))),
  ]);

  // Geçim kalemleri + otomatik bülten değerleri (paralel, hataya dayanıklı)
  const [opetFuel, izmirHal, tcmbPage, enagNews] = await Promise.all([
    fetchOpetFuel(),
    fetchIzmirHal(),
    fetchTcmbInflationPage(),
    fetchEnagFromNews(),
  ]);

  // ENAG: haber taraması (otomatik) → panel girişi → gömülü sabit.
  const enagVal = enagNews
    ? {
        yearly: enagNews.yearly,
        monthly: enagNews.monthly ?? enagFallback.monthly,
        period: enagNews.period,
        source: `ENAG ${enagNews.period} (haber taraması, otomatik)`,
        live: true,
      }
    : { ...enagFallback, live: false };
  if (!enagNews) notes.push("ENAG haber taraması sonuç vermedi — son bilinen değer kullanıldı.");

  const evds = new Map<string, EvdsSeries | null>(evdsResults);
  const evdsKeyPresent = hasEvdsKey();
  if (!evdsKeyPresent) notes.push("EVDS_API_KEY tanımlı değil — resmi TÜFE, TCMB sayfasından otomatik çekiliyor; harcama grupları Eurostat'tan. Anahtar eklenirse konut endeksi ve faiz serileri de canlanır.");
  if (!ratesNow) notes.push("TCMB güncel kur bülteni alınamadı.");
  if (!ratesYearAgo) notes.push("TCMB 1 yıl önceki kur arşivi alınamadı — kur yıllık değişimleri hesaplanamadı.");
  if (!wbCpi) notes.push("World Bank yanıt vermedi — ülke enflasyonlarında Eurostat + IMF WEO yedeği kullanıldı.");
  if (!eurostatTR) notes.push("Eurostat Türkiye HICP alınamadı.");

  // ── 2. Ara hesaplar ─────────────────────────────────────────────
  const kurDelta = new Map<string, number>(); // döviz kodu → yıllık % değişim
  if (ratesNow && ratesYearAgo) {
    for (const c of CURRENCIES) {
      const a = ratesNow.get(c.code);
      const b = ratesYearAgo.get(c.code);
      if (a && b && b.rate > 0) kurDelta.set(c.code, (a.rate / b.rate - 1) * 100);
    }
  }

  // Resmi TÜFE çözümleme sırası (TAM OTOMATİK): EVDS aylık seri → TCMB resmi
  // enflasyon sayfası (anahtarsız, her ay otomatik) → panel girişi/gömülü sabit
  // → Eurostat TR HICP → World Bank.
  const tufe = evds.get("TP.FG.J0") || null;
  const wbTurCpi = wbCpi?.get("TUR") || null;
  const esTrGenel = eurostatTR?.get("CP00") || null;
  let officialYearly: number | null;
  let officialMonthly: number | null;
  let officialSource: string | null;
  if (tufe?.yearlyPct != null) {
    officialYearly = tufe.yearlyPct;
    officialMonthly = tufe.monthlyPct;
    officialSource = "TÜİK/EVDS aylık seri";
  } else if (tcmbPage) {
    officialYearly = tcmbPage.yearly;
    officialMonthly = tcmbPage.monthly;
    officialSource = `TCMB resmi enflasyon sayfası (${tcmbPage.period}, otomatik)`;
  } else {
    officialYearly = tuikFallback.yearly;
    officialMonthly = tuikFallback.monthly;
    officialSource = tuikFallback.source;
    notes.push("TCMB enflasyon sayfası okunamadı — resmi TÜFE için son bilinen değer kullanıldı.");
    if (officialYearly == null) {
      officialYearly = esTrGenel?.value ?? wbTurCpi?.value ?? null;
      officialSource = esTrGenel ? `Eurostat HICP ${esTrGenel.period}` : wbTurCpi ? `World Bank ${wbTurCpi.year}` : null;
    }
  }

  // Ülke enflasyonları çözümleme sırası: World Bank → Eurostat → IMF WEO yedeği.
  // Her partner için mutlaka bir değer bulunur (kaynak etiketiyle) — "veri yok" kalmaz.
  const partnerCpi = new Map<string, { value: number; srcLabel: string; live: boolean }>();
  for (const p of PARTNERS) {
    const wb = wbCpi?.get(p.wb);
    const es = p.eurostat ? eurostatPartners?.get(p.eurostat) : null;
    if (wb) partnerCpi.set(p.wb, { value: wb.value, srcLabel: `World Bank ${wb.year}`, live: true });
    else if (es) partnerCpi.set(p.wb, { value: es.value, srcLabel: `Eurostat ${es.period}`, live: true });
    else partnerCpi.set(p.wb, { value: p.weo2025, srcLabel: "IMF WEO 2025 (yedek)", live: false });
  }

  // İthal enflasyon: Σ pay × (kur Δ + ülke TÜFE) / Σ pay
  const importContrib = new Map<string, number>(); // wb → katkı puanı
  let importWeighted: number | null = null;
  {
    let num = 0, den = 0;
    for (const p of PARTNERS) {
      if (p.importShare == null || p.importShare < 0.5) continue;
      const cpi = partnerCpi.get(p.wb)?.value;
      const delta = kurDelta.get(p.currency);
      if (cpi == null && delta == null) continue;
      const combined = (delta ?? 0) + (cpi ?? 0);
      importContrib.set(p.wb, (p.importShare / 100) * combined);
      num += p.importShare * combined;
      den += p.importShare;
    }
    if (den > 0) importWeighted = num / den;
  }

  // COICOP harcama grupları: EVDS (güncel) → Eurostat TR (gecikmeli, resmi).
  const coicopVals = new Map<string, { value: number; srcLabel: string }>();
  for (const g of COICOP_GROUPS) {
    const ev = evds.get(g.evds)?.yearlyPct;
    if (ev != null) { coicopVals.set(g.no, { value: ev, srcLabel: "EVDS yıllık" }); continue; }
    const es = eurostatTR?.get(`CP${g.no}`);
    if (es) coicopVals.set(g.no, { value: es.value, srcLabel: `Eurostat ${es.period}` });
  }

  // Geçim sepeti: gıda %60 + konut(kira) %40 — dar gelirli hane ağırlıkları.
  const gida = coicopVals.get("01")?.value ?? null;
  const konutGrubu = coicopVals.get("04")?.value ?? null;
  const gecim = gida != null && konutGrubu != null ? gida * 0.6 + konutGrubu * 0.4 : gida ?? konutGrubu;
  const gecimSrc = coicopVals.get("01")?.srcLabel;

  // Tasarruf araçları: gram altın TL yıllık = (1+ons Δ) × (1+USD/TL Δ) − 1.
  const usdDeltaVal = kurDelta.get("USD") ?? null;
  const gramAltinYillik =
    yahooGold && usdDeltaVal != null
      ? ((1 + yahooGold.yearlyPct / 100) * (1 + usdDeltaVal / 100) - 1) * 100
      : null;

  // Geçim kalemleri canlı bağlantısı: İzmir hal (sebze-meyve, resmi açık veri,
  // toptan) + Opet pompa fiyatları. Hal'de aynı MalId 1 yıl önceyle kıyaslanıp
  // yıllık değişim üretilir.
  const basketLive = new Map<string, { value: number; yearlyPct: number | null; srcLabel: string }>();
  if (izmirHal) {
    const HAL_MAP: { key: string; kws: string[] }[] = [
      { key: "madde-19", kws: ["DOMATES"] },
      { key: "madde-20", kws: ["PATATES"] },
      { key: "madde-21", kws: ["SOĞAN", "SOGAN"] },
      { key: "madde-22", kws: ["ELMA"] },
      { key: "madde-23", kws: ["MUZ"] },
      { key: "madde-24", kws: ["LİMON", "LIMON"] },
    ];
    for (const m of HAL_MAP) {
      const candidates = [...izmirHal.now.values()].filter((i) =>
        m.kws.some((k) => i.ad.toLocaleUpperCase("tr-TR").includes(k))
      );
      if (candidates.length === 0) continue;
      // En kısa ad = en genel çeşit ("DOMATES" > "DOMATES PEMBE").
      candidates.sort((a, b) => a.ad.length - b.ad.length);
      const item = candidates[0];
      const old = izmirHal.yearAgo?.get(item.malId);
      basketLive.set(m.key, {
        value: item.fiyat,
        yearlyPct: old && old.fiyat > 0 ? (item.fiyat / old.fiyat - 1) * 100 : null,
        srcLabel: "İzmir hal (toptan)",
      });
    }
  }
  if (opetFuel?.benzin != null) basketLive.set("madde-31", { value: opetFuel.benzin, yearlyPct: null, srcLabel: "Opet İstanbul pompa" });
  if (opetFuel?.motorin != null) basketLive.set("madde-32", { value: opetFuel.motorin, yearlyPct: null, srcLabel: "Opet İstanbul pompa" });

  const kfe = evds.get("TP.HKFE01") || null;
  const faizIhtiyac = evds.get("TP.KTF10")?.latest ?? null;
  const faizMevduat = evds.get("TP.TRY.MT02")?.latest ?? null;
  const m2 = evds.get("TP.PR.ARZ13") || null;

  // ── 3. Katmanlar + kompozit ─────────────────────────────────────
  const layerValues: Record<string, { value: number | null; detail?: string }> = {
    "katman-resmi":  { value: officialYearly, detail: officialSource ?? undefined },
    "katman-ithal":  { value: importWeighted != null ? round2(importWeighted) : null, detail: `${importContrib.size} ülke, ithalat payı ağırlıklı` },
    "katman-gecim":  { value: gecim != null ? round2(gecim) : null, detail: `Gıda %60 + konut/kira %40${gecimSrc ? ` (${gecimSrc})` : ""}` },
    "katman-varlik": { value: kfe?.yearlyPct != null ? round2(kfe.yearlyPct) : null, detail: "TCMB Konut Fiyat Endeksi yıllık" },
    "katman-kredi":  { value: faizIhtiyac != null ? round2(faizIhtiyac) : null, detail: "İhtiyaç kredisi yıllık faizi" },
    "katman-enag":   { value: enagVal.yearly, detail: enagVal.source },
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
    officialYearly, officialMonthly, officialSource, importContrib,
    partnerCpi, coicopVals, esTrGenel,
    wbGdp, wbUnemp, wbGdpPc, wbGini, wbPpp, tufe, kfe, m2,
    faizIhtiyac, faizMevduat, gecimKonut: konutGrubu,
    mwNow, mwPrev, asgariArtis, asgariUsd, asgariUsdPrev, alimGucuEndeks, usdNow,
    truncgil, yahooGold, yahooSilver, yahooBist, binanceBtc, gramAltinYillik, usdDeltaVal,
    enagVal, basketLive,
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
      enag: enagVal.yearly,
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
  officialMonthly: number | null;
  officialSource: string | null;
  importContrib: Map<string, number>;
  partnerCpi: Map<string, { value: number; srcLabel: string; live: boolean }>;
  coicopVals: Map<string, { value: number; srcLabel: string }>;
  esTrGenel: EurostatValue | null;
  wbGdp: WbValue | null; wbUnemp: WbValue | null; wbGdpPc: WbValue | null;
  wbGini: WbValue | null; wbPpp: WbValue | null;
  tufe: EvdsSeries | null; kfe: EvdsSeries | null; m2: EvdsSeries | null;
  faizIhtiyac: number | null; faizMevduat: number | null; gecimKonut: number | null;
  mwNow: { year: number; net: number; gross: number };
  mwPrev: { year: number; net: number; gross: number };
  asgariArtis: number; asgariUsd: number | null; asgariUsdPrev: number | null;
  alimGucuEndeks: number | null; usdNow: number | null;
  truncgil: { gramAltin: number | null; onsAltinUsd: number | null; gumusGram: number | null } | null;
  yahooGold: { last: number; yearlyPct: number } | null;
  yahooSilver: { last: number; yearlyPct: number } | null;
  yahooBist: { last: number; yearlyPct: number } | null;
  binanceBtc: { last: number; yearlyPct: number } | null;
  gramAltinYillik: number | null;
  usdDeltaVal: number | null;
  enagVal: { yearly: number; monthly: number; period: string; source: string; live: boolean };
  basketLive: Map<string, { value: number; yearlyPct: number | null; srcLabel: string }>;
}

function resolveParam(def: ParamDef, ctx: Ctx): ParamResult {
  const base = { key: def.key, label: def.label, category: def.category, unit: def.unit, note: def.note };
  const mk = (status: ParamStatus, value: number | null, extra?: string): ParamResult =>
    ({ ...base, status, value: value != null ? round2(value) : null, extra });

  // Piyasa kaynakları (Truncgil / Yahoo / Binance) — kur branşından önce ele alınır.
  if (def.code?.includes(":")) {
    switch (def.key) {
      case "gram-altin": return ctx.truncgil?.gramAltin != null ? mk("live", ctx.truncgil.gramAltin) : mk("no-data", null);
      case "ons-altin":  return ctx.truncgil?.onsAltinUsd != null ? mk("live", ctx.truncgil.onsAltinUsd) : mk("no-data", null);
      case "gumus-gram": return ctx.truncgil?.gumusGram != null ? mk("live", ctx.truncgil.gumusGram) : mk("no-data", null);
      case "bist100":    return ctx.yahooBist ? mk("live", ctx.yahooBist.last) : mk("no-data", null);
      case "btc-usd":    return ctx.binanceBtc ? mk("live", ctx.binanceBtc.last) : mk("no-data", null);
    }
    return mk("no-data", null);
  }

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
    // Partner ülke TÜFE'si: WB → Eurostat → WEO yedeği sırası partnerCpi'de çözülmüş durumda.
    const pc = def.code ? ctx.partnerCpi.get(def.code) : null;
    if (pc) return mk(pc.live ? "live" : "static", pc.value, pc.srcLabel);
    return mk("no-data", null);
  }

  // EVDS
  if (def.source === "evds" && def.code) {
    const s = ctx.evdsKeyPresent ? ctx.evds.get(def.code) : null;
    if (s) {
      const extra = s.yearlyPct != null ? `yıllık %${round1(s.yearlyPct)}` : s.latestDate;
      return mk("live", s.latest, extra);
    }
    // COICOP grubu ise Eurostat'tan resmi (gecikmeli) değer kullanılır.
    if (def.key.startsWith("tufe-grup-")) {
      const g = ctx.coicopVals.get(def.key.replace("tufe-grup-", ""));
      if (g) return mk("live", g.value, g.srcLabel);
    }
    if (!ctx.evdsKeyPresent) return mk("waiting-key", null);
    return mk("no-data", null, "seri kodu doğrulanacak");
  }

  // Statik seriler
  if (def.source === "static") {
    if (def.key === "asgari-net") return mk("static", ctx.mwNow.net, `${ctx.mwNow.year} yılı`);
    if (def.key === "asgari-brut") return mk("static", ctx.mwNow.gross, `${ctx.mwNow.year} yılı`);
    if (def.key === "enag-yillik") return mk(ctx.enagVal.live ? "live" : "static", ctx.enagVal.yearly, ctx.enagVal.source);
    if (def.key === "enag-aylik") return mk(ctx.enagVal.live ? "live" : "static", ctx.enagVal.monthly, ctx.enagVal.source);
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
      case "tufe-aylik": return mk("derived", ctx.officialMonthly, ctx.officialSource ?? undefined);
      case "eurostat-tr-hicp":
        return ctx.esTrGenel ? mk("derived", ctx.esTrGenel.value, ctx.esTrGenel.period) : mk("no-data", null);
      case "ons-altin-yillik": return ctx.yahooGold ? mk("derived", ctx.yahooGold.yearlyPct) : mk("no-data", null);
      case "gumus-yillik": return ctx.yahooSilver ? mk("derived", ctx.yahooSilver.yearlyPct) : mk("no-data", null);
      case "gram-altin-yillik": return mk("derived", ctx.gramAltinYillik);
      case "bist100-yillik": return ctx.yahooBist ? mk("derived", ctx.yahooBist.yearlyPct) : mk("no-data", null);
      case "bist100-reel":
        return ctx.yahooBist && ctx.composite != null ? mk("derived", ctx.yahooBist.yearlyPct - ctx.composite) : mk("no-data", null);
      case "btc-yillik": return ctx.binanceBtc ? mk("derived", ctx.binanceBtc.yearlyPct) : mk("no-data", null);
      case "altin-reel-getiri":
        return ctx.gramAltinYillik != null && ctx.composite != null ? mk("derived", ctx.gramAltinYillik - ctx.composite) : mk("no-data", null);
      case "usd-reel-getiri":
        return ctx.usdDeltaVal != null && ctx.composite != null ? mk("derived", ctx.usdDeltaVal - ctx.composite) : mk("no-data", null);
      case "yiufe-yillik": return mk("derived", ctx.evds.get("TP.TUFE1YI.T1")?.yearlyPct ?? null);
      case "kfe-tr-yillik": return mk("derived", ctx.kfe?.yearlyPct ?? null);
      case "konut-grubu-tufe": return mk("derived", ctx.gecimKonut);
      case "m2-yillik": return mk("derived", ctx.m2?.yearlyPct ?? null);
      case "reel-faiz":
        return ctx.faizMevduat != null && ctx.officialYearly != null
          ? mk("derived", ctx.faizMevduat - ctx.officialYearly)
          : mk("no-data", null);
      case "resmi-enag-fark":
        return ctx.officialYearly != null ? mk("derived", ctx.officialYearly - ctx.enagVal.yearly) : mk("no-data", null);
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

  // Kaynağı bağlanmamışlar — canlı bağlantısı yapılanlar (hal/akaryakıt) hariç.
  const live = ctx.basketLive.get(def.key);
  if (live) {
    const extra = [
      live.yearlyPct != null ? `yıllık %${round1(live.yearlyPct)}` : null,
      live.srcLabel,
    ].filter(Boolean).join(" · ");
    return mk("live", live.value, extra);
  }
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
