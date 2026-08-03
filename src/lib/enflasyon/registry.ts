/**
 * ERPIDE Gerçek Enflasyon — parametre kayıt defteri.
 *
 * Tüm parametreler tek yerden tanımlanır; motor (engine.ts) bu listeyi gezerek
 * kaynağına göre değer toplar. Yeni parametre eklemek = buraya bir satır eklemek.
 *
 * Kaynak tipleri:
 *  - tcmb-xml : TCMB today.xml + arşiv XML (anahtarsız, canlı)
 *  - worldbank: World Bank API (anahtarsız, canlı; yıllık seriler ~1 yıl gecikmeli)
 *  - evds     : TCMB EVDS API (EVDS_API_KEY gerekir; anahtar yoksa "waiting-key")
 *  - static   : Elle güncellenen resmi seriler (asgari ücret, ticaret payları vb.
 *               — kaynağı ve yılı note alanında belirtilir, uydurma veri yok)
 *  - derived  : Diğer parametrelerden hesaplanan türetilmiş değerler
 *  - pending  : Kaynağı henüz bağlanmamış (UI'da dürüstçe "bağlanacak" görünür)
 */

export type ParamSource = "tcmb-xml" | "worldbank" | "evds" | "static" | "derived" | "pending";

export type CategoryKey =
  | "kompozit"
  | "resmi"
  | "kur"
  | "partner"
  | "ticaret"
  | "ithal-katki"
  | "gecim-grup"
  | "gecim-madde"
  | "varlik"
  | "kredi"
  | "gelir"
  | "alternatif";

export const CATEGORIES: { key: CategoryKey; label: string; desc: string }[] = [
  { key: "kompozit",    label: "Kompozit Endeks",         desc: "ERPIDE Gerçek Enflasyon katmanları ve nihai endeks" },
  { key: "resmi",       label: "Resmi Göstergeler",        desc: "TÜİK/TCMB resmi enflasyon ve makro veriler" },
  { key: "kur",         label: "Döviz Kurları",            desc: "TCMB kurları ve yıllık değişimleri (canlı)" },
  { key: "partner",     label: "Ticaret Ortağı Enflasyonu", desc: "İthalat/ihracat yaptığımız ülkelerin enflasyonları" },
  { key: "ticaret",     label: "Dış Ticaret Payları",      desc: "Ülke bazlı ithalat/ihracat payları (TÜİK 2024)" },
  { key: "ithal-katki", label: "İthal Enflasyon Katkısı",  desc: "Pay × (kur değişimi + partner enflasyonu)" },
  { key: "gecim-grup",  label: "Geçim: TÜFE Ana Grupları", desc: "12 COICOP harcama grubunun yıllık enflasyonu" },
  { key: "gecim-madde", label: "Geçim: 50 Temel Kalem",    desc: "En çok tüketilen maddelerin fiyat takibi" },
  { key: "varlik",      label: "Varlık Fiyatları",         desc: "Konut, araç, arsa fiyat ve erişilebilirlik" },
  { key: "kredi",       label: "Kredi & Bankacılık",       desc: "Faizler, kart kullanımı, kredi genişlemesi" },
  { key: "gelir",       label: "Gelir & Alım Gücü",        desc: "Asgari ücret ve alım gücü türetmeleri" },
  { key: "alternatif",  label: "Alternatif Ölçümler",      desc: "ENAG, İTO ve beklenti anketleri" },
];

export interface ParamDef {
  key: string;
  label: string;
  category: CategoryKey;
  source: ParamSource;
  /** EVDS seri kodu / WB indikatörü / TCMB döviz kodu — kaynağa göre anlamı değişir. */
  code?: string;
  unit: "%" | "TRY" | "USD" | "endeks" | "adet" | "oran";
  note?: string;
}

// ── Döviz kurları (TCMB today.xml — tamamı anahtarsız canlı) ──────
export const CURRENCIES: { code: string; name: string }[] = [
  { code: "USD", name: "ABD Doları" },
  { code: "EUR", name: "Euro" },
  { code: "CNY", name: "Çin Yuanı" },
  { code: "RUB", name: "Rus Rublesi" },
  { code: "GBP", name: "İngiliz Sterlini" },
  { code: "JPY", name: "Japon Yeni" },
  { code: "CHF", name: "İsviçre Frangı" },
  { code: "KRW", name: "Güney Kore Wonu" },
  { code: "SAR", name: "Suudi Riyali" },
  { code: "AED", name: "BAE Dirhemi" },
  { code: "QAR", name: "Katar Riyali" },
  { code: "KWD", name: "Kuveyt Dinarı" },
  { code: "AZN", name: "Azerbaycan Manatı" },
  { code: "RON", name: "Rumen Leyi" },
  { code: "BGN", name: "Bulgar Levası" },
  { code: "SEK", name: "İsveç Kronu" },
  { code: "NOK", name: "Norveç Kronu" },
  { code: "DKK", name: "Danimarka Kronu" },
  { code: "CAD", name: "Kanada Doları" },
  { code: "AUD", name: "Avustralya Doları" },
  { code: "PKR", name: "Pakistan Rupisi" },
  { code: "IRR", name: "İran Riyali" },
];

// ── Ticaret ortakları ─────────────────────────────────────────────
// Paylar: TÜİK 2024 dış ticaret istatistikleri, yaklaşık % (yılda bir güncellenir).
// currency: o ülkeyle ticarette baskın fatura para birimi (kur etkisi için).
export const PARTNERS: {
  wb: string; name: string; currency: string;
  importShare: number | null; exportShare: number | null;
}[] = [
  { wb: "CHN", name: "Çin",           currency: "CNY", importShare: 13.1, exportShare: 1.0 },
  { wb: "RUS", name: "Rusya",         currency: "USD", importShare: 12.8, exportShare: 3.5 }, // enerji faturası USD
  { wb: "DEU", name: "Almanya",       currency: "EUR", importShare: 7.8,  exportShare: 8.0 },
  { wb: "USA", name: "ABD",           currency: "USD", importShare: 4.7,  exportShare: 6.2 },
  { wb: "ITA", name: "İtalya",        currency: "EUR", importShare: 3.9,  exportShare: 4.9 },
  { wb: "FRA", name: "Fransa",        currency: "EUR", importShare: 2.7,  exportShare: 3.6 },
  { wb: "KOR", name: "Güney Kore",    currency: "KRW", importShare: 2.6,  exportShare: 0.6 },
  { wb: "IND", name: "Hindistan",     currency: "USD", importShare: 2.4,  exportShare: 0.5 },
  { wb: "ESP", name: "İspanya",       currency: "EUR", importShare: 2.0,  exportShare: 3.7 },
  { wb: "GBR", name: "Birleşik Krallık", currency: "GBP", importShare: 1.6, exportShare: 5.6 },
  { wb: "JPN", name: "Japonya",       currency: "JPY", importShare: 1.4,  exportShare: 0.5 },
  { wb: "POL", name: "Polonya",       currency: "EUR", importShare: 1.4,  exportShare: 2.0 },
  { wb: "NLD", name: "Hollanda",      currency: "EUR", importShare: 1.5,  exportShare: 3.1 },
  { wb: "BEL", name: "Belçika",       currency: "EUR", importShare: 1.3,  exportShare: 1.5 },
  { wb: "ROU", name: "Romanya",       currency: "RON", importShare: 1.2,  exportShare: 2.3 },
  { wb: "CHE", name: "İsviçre",       currency: "CHF", importShare: 1.5,  exportShare: 0.8 },
  { wb: "IRQ", name: "Irak",          currency: "USD", importShare: 0.3,  exportShare: 4.7 },
  { wb: "ARE", name: "BAE",           currency: "USD", importShare: 1.5,  exportShare: 2.0 },
  { wb: "EGY", name: "Mısır",         currency: "USD", importShare: 0.9,  exportShare: 1.7 },
  { wb: "SAU", name: "Suudi Arabistan", currency: "USD", importShare: 0.8, exportShare: 1.9 },
  { wb: "AZE", name: "Azerbaycan",    currency: "AZN", importShare: 0.9,  exportShare: 1.3 },
  { wb: "UKR", name: "Ukrayna",       currency: "USD", importShare: 0.8,  exportShare: 0.9 },
  { wb: "GRC", name: "Yunanistan",    currency: "EUR", importShare: 0.8,  exportShare: 1.2 },
  { wb: "BGR", name: "Bulgaristan",   currency: "BGN", importShare: 0.7,  exportShare: 1.4 },
  { wb: "ISR", name: "İsrail",        currency: "USD", importShare: 0.3,  exportShare: 1.5 },
];

// ── TÜFE ana grupları (COICOP, EVDS) ─────────────────────────────
// Seri kodları EVDS anahtarı bağlanınca doğrulanır; ölü çıkan kod UI'da görünür.
export const COICOP_GROUPS: { no: string; label: string; evds: string }[] = [
  { no: "01", label: "Gıda ve alkolsüz içecekler",      evds: "TP.FG.J01" },
  { no: "02", label: "Alkollü içecekler ve tütün",      evds: "TP.FG.J02" },
  { no: "03", label: "Giyim ve ayakkabı",               evds: "TP.FG.J03" },
  { no: "04", label: "Konut, su, elektrik, gaz (kira)", evds: "TP.FG.J04" },
  { no: "05", label: "Ev eşyası",                       evds: "TP.FG.J05" },
  { no: "06", label: "Sağlık",                          evds: "TP.FG.J06" },
  { no: "07", label: "Ulaştırma",                       evds: "TP.FG.J07" },
  { no: "08", label: "Haberleşme",                      evds: "TP.FG.J08" },
  { no: "09", label: "Eğlence ve kültür",               evds: "TP.FG.J09" },
  { no: "10", label: "Eğitim",                          evds: "TP.FG.J10" },
  { no: "11", label: "Lokanta ve oteller",              evds: "TP.FG.J11" },
  { no: "12", label: "Çeşitli mal ve hizmetler",        evds: "TP.FG.J12" },
];

// ── 50 temel geçim kalemi ─────────────────────────────────────────
// TÜİK "madde ortalama fiyatları" yayınından bağlanacak; kaynak bağlanana kadar
// "pending" statüsünde dürüstçe listelenir (uydurma fiyat girilmez).
export const BASKET_ITEMS: string[] = [
  "Ekmek (250 g)", "Pirinç (kg)", "Un (kg)", "Makarna (500 g)", "Süt (lt)",
  "Yoğurt (kg)", "Beyaz peynir (kg)", "Yumurta (adet)", "Dana eti (kg)", "Kuzu eti (kg)",
  "Tavuk eti (kg)", "Balık - hamsi (kg)", "Ayçiçek yağı (lt)", "Zeytinyağı (lt)", "Tereyağı (kg)",
  "Toz şeker (kg)", "Çay (kg)", "Kahve (100 g)", "Domates (kg)", "Patates (kg)",
  "Kuru soğan (kg)", "Elma (kg)", "Muz (kg)", "Limon (kg)", "Kuru fasulye (kg)",
  "Kırmızı mercimek (kg)", "Nohut (kg)", "İçme suyu (5 lt)", "Ayran (1 lt)", "Zeytin (kg)",
  "Benzin (lt)", "Motorin (lt)", "LPG (lt)", "Doğalgaz (m³)", "Elektrik (kWh)",
  "Deterjan (kg)", "Şampuan (500 ml)", "Diş macunu (adet)", "Tuvalet kağıdı (8'li)", "Sigara (paket)",
  "Şehir içi otobüs bileti", "Taksi açılış", "Erkek berber", "Kadın kuaför", "Konut kirası (İstanbul, ort.)",
  "Buzdolabı (A sınıfı)", "Çamaşır makinesi", "Televizyon (55\")", "Cep telefonu (orta segment)", "Sinema bileti",
];

// ── Asgari ücret serisi (resmi, net TL — Ocak itibarıyla) ─────────
export const MIN_WAGE_SERIES: { year: number; net: number; gross: number }[] = [
  { year: 2016, net: 1300.99,  gross: 1647.0 },
  { year: 2017, net: 1404.06,  gross: 1777.5 },
  { year: 2018, net: 1603.12,  gross: 2029.5 },
  { year: 2019, net: 2020.9,   gross: 2558.4 },
  { year: 2020, net: 2324.7,   gross: 2943.0 },
  { year: 2021, net: 2825.9,   gross: 3577.5 },
  { year: 2022, net: 4253.4,   gross: 5004.0 },  // Temmuz'da 5.500'e çıktı
  { year: 2023, net: 8506.8,   gross: 10008.0 }, // Temmuz'da 11.402'ye çıktı
  { year: 2024, net: 17002.12, gross: 20002.5 },
  { year: 2025, net: 22104.67, gross: 26005.5 },
  { year: 2026, net: 28075.5,  gross: 33030.0 },
];

// ── ENAG (E-TÜFE) son açıklanan değerler ─────────────────────────
// ENAG API yayınlamıyor; aylık açıklama elle güncellenir (kaynak: enagrup.org).
export const ENAG_LATEST = {
  period: "2026-07",
  yearly: 50.49,
  monthly: 3.07,
  source: "ENAG Temmuz 2026 açıklaması (03.08.2026)",
};

// ── Statik referans değerler (kaynak + yıl etiketli) ─────────────
export const STATIC_FACTS: { key: string; label: string; category: CategoryKey; value: number; unit: ParamDef["unit"]; note: string }[] = [
  { key: "bkm-kredi-karti-sayisi", label: "Kredi kartı sayısı",            category: "kredi", value: 123_000_000, unit: "adet", note: "BKM 2024 sonu (~123 milyon)" },
  { key: "bkm-banka-karti-sayisi", label: "Banka kartı sayısı",            category: "kredi", value: 195_000_000, unit: "adet", note: "BKM 2024 sonu (~195 milyon)" },
  { key: "hanehalki-borc-gsyh",    label: "Hanehalkı borcu / GSYH",        category: "kredi", value: 11.5,        unit: "%",    note: "TCMB Finansal İstikrar Raporu 2024 (~%11-12)" },
  { key: "emekli-taban-ayligi",    label: "En düşük emekli aylığı",        category: "gelir", value: 14469,       unit: "TRY",  note: "2025 yasal taban — 2026 değeri açıklanınca güncellenecek" },
];

// ── Kayıt defteri üretimi ────────────────────────────────────────

function kurParams(): ParamDef[] {
  return CURRENCIES.flatMap((c) => [
    { key: `kur-${c.code.toLowerCase()}`, label: `${c.name} / TL kuru`, category: "kur" as const, source: "tcmb-xml" as const, code: c.code, unit: "TRY" as const },
    { key: `kur-${c.code.toLowerCase()}-yillik`, label: `${c.name} yıllık değişim`, category: "kur" as const, source: "derived" as const, code: c.code, unit: "%" as const },
  ]);
}

function partnerParams(): ParamDef[] {
  return PARTNERS.map((p) => ({
    key: `cpi-${p.wb.toLowerCase()}`,
    label: `${p.name} enflasyonu (TÜFE, yıllık)`,
    category: "partner" as const,
    source: "worldbank" as const,
    code: p.wb,
    unit: "%" as const,
    note: "World Bank FP.CPI.TOTL.ZG — en güncel yıl",
  }));
}

function tradeShareParams(): ParamDef[] {
  const out: ParamDef[] = [];
  for (const p of PARTNERS) {
    if (p.importShare != null)
      out.push({ key: `ithalat-pay-${p.wb.toLowerCase()}`, label: `${p.name} ithalat payı`, category: "ticaret", source: "static", unit: "%", note: "TÜİK 2024 dış ticaret istatistikleri (yaklaşık)" });
    if (p.exportShare != null)
      out.push({ key: `ihracat-pay-${p.wb.toLowerCase()}`, label: `${p.name} ihracat payı`, category: "ticaret", source: "static", unit: "%", note: "TÜİK 2024 dış ticaret istatistikleri (yaklaşık)" });
  }
  return out;
}

function importContributionParams(): ParamDef[] {
  return PARTNERS.filter((p) => (p.importShare ?? 0) >= 0.5).map((p) => ({
    key: `ithal-katki-${p.wb.toLowerCase()}`,
    label: `${p.name} ithal enflasyon katkısı`,
    category: "ithal-katki" as const,
    source: "derived" as const,
    unit: "%" as const,
    note: "İthalat payı × (kur yıllık değişimi + ülke enflasyonu)",
  }));
}

function coicopParams(): ParamDef[] {
  return COICOP_GROUPS.map((g) => ({
    key: `tufe-grup-${g.no}`,
    label: `${g.label} (yıllık)`,
    category: "gecim-grup" as const,
    source: "evds" as const,
    code: g.evds,
    unit: "%" as const,
  }));
}

function basketParams(): ParamDef[] {
  return BASKET_ITEMS.map((label, i) => ({
    key: `madde-${String(i + 1).padStart(2, "0")}`,
    label,
    category: "gecim-madde" as const,
    source: "pending" as const,
    unit: "TRY" as const,
    note: "TÜİK madde ortalama fiyatları bağlanacak",
  }));
}

/** Tam parametre listesi — motor ve UI bunu gezer. */
export function buildRegistry(): ParamDef[] {
  return [
    // Kompozit katmanlar
    { key: "erpide-gercek-enflasyon", label: "ERPIDE Gerçek Enflasyon (yıllık)", category: "kompozit", source: "derived", unit: "%" },
    { key: "katman-resmi",    label: "Katman A — Resmi TÜFE",            category: "kompozit", source: "derived", unit: "%" },
    { key: "katman-ithal",    label: "Katman B — İthal enflasyon",       category: "kompozit", source: "derived", unit: "%" },
    { key: "katman-gecim",    label: "Katman C — Geçim sepeti",          category: "kompozit", source: "derived", unit: "%" },
    { key: "katman-varlik",   label: "Katman D — Varlık fiyatları",      category: "kompozit", source: "derived", unit: "%" },
    { key: "katman-kredi",    label: "Katman E — Borçlanma maliyeti",    category: "kompozit", source: "derived", unit: "%" },
    { key: "katman-enag",     label: "Katman F — ENAG E-TÜFE",           category: "kompozit", source: "derived", unit: "%" },

    // Resmi göstergeler
    { key: "tufe-endeks",   label: "TÜFE endeksi (2003=100)",        category: "resmi", source: "evds", code: "TP.FG.J0", unit: "endeks" },
    { key: "tufe-yillik",   label: "TÜFE yıllık enflasyon",          category: "resmi", source: "derived", unit: "%" },
    { key: "tufe-aylik",    label: "TÜFE aylık enflasyon",           category: "resmi", source: "derived", unit: "%" },
    { key: "yiufe-endeks",  label: "Yİ-ÜFE endeksi",                 category: "resmi", source: "evds", code: "TP.TUFE1YI.T1", unit: "endeks" },
    { key: "yiufe-yillik",  label: "Yİ-ÜFE yıllık",                  category: "resmi", source: "derived", unit: "%" },
    { key: "wb-tur-cpi",    label: "Türkiye TÜFE (World Bank, yıllık)", category: "resmi", source: "worldbank", code: "TUR", unit: "%", note: "Yıllık seri — ~1 yıl gecikmeli" },
    { key: "wb-tur-gdp",    label: "GSYH büyümesi",                  category: "resmi", source: "worldbank", code: "TUR|NY.GDP.MKTP.KD.ZG", unit: "%" },
    { key: "wb-tur-unemp",  label: "İşsizlik oranı",                 category: "resmi", source: "worldbank", code: "TUR|SL.UEM.TOTL.ZS", unit: "%" },
    { key: "wb-tur-gdppc",  label: "Kişi başı GSYH",                 category: "resmi", source: "worldbank", code: "TUR|NY.GDP.PCAP.CD", unit: "USD" },
    { key: "wb-tur-gini",   label: "Gini katsayısı (eşitsizlik)",    category: "resmi", source: "worldbank", code: "TUR|SI.POV.GINI", unit: "endeks" },
    { key: "wb-tur-ppp",    label: "Satın alma gücü paritesi (PPP)", category: "resmi", source: "worldbank", code: "TUR|PA.NUS.PPP", unit: "oran" },

    ...kurParams(),
    ...partnerParams(),
    ...tradeShareParams(),
    ...importContributionParams(),
    ...coicopParams(),
    ...basketParams(),

    // Varlık fiyatları
    { key: "kfe-tr",        label: "Konut Fiyat Endeksi (Türkiye)",   category: "varlik", source: "evds", code: "TP.HKFE01", unit: "endeks" },
    { key: "kfe-tr-yillik", label: "Konut fiyatları yıllık değişim",  category: "varlik", source: "derived", unit: "%" },
    { key: "kfe-ist",       label: "KFE — İstanbul",                  category: "varlik", source: "evds", code: "TP.HKFE02", unit: "endeks" },
    { key: "kfe-ank",       label: "KFE — Ankara",                    category: "varlik", source: "evds", code: "TP.HKFE03", unit: "endeks" },
    { key: "kfe-izm",       label: "KFE — İzmir",                     category: "varlik", source: "evds", code: "TP.HKFE04", unit: "endeks" },
    { key: "konut-satis",   label: "Konut satış adedi (aylık)",       category: "varlik", source: "evds", code: "TP.AKONUTSAT01", unit: "adet" },
    { key: "konut-ipotek",  label: "İpotekli konut satışı",           category: "varlik", source: "pending", unit: "adet", note: "TÜİK konut satış istatistikleri bağlanacak" },
    { key: "araba-sifir",   label: "Sıfır araç ortalama fiyatı",      category: "varlik", source: "pending", unit: "TRY", note: "ODMD/otomotiv distribütörleri verisi bağlanacak" },
    { key: "araba-ikinci",  label: "İkinci el araç fiyat endeksi",    category: "varlik", source: "pending", unit: "endeks", note: "Kaynak bağlanacak" },
    { key: "arsa-m2",       label: "Arsa m² birim değeri",            category: "varlik", source: "pending", unit: "TRY", note: "TÜİK/Tapu verisi bağlanacak" },
    { key: "ev-erisim",     label: "Konut erişilebilirlik (yıl maaş/100m²)", category: "varlik", source: "derived", unit: "oran", note: "KFE + asgari ücretten türetilir" },
    { key: "konut-grubu-tufe", label: "TÜFE konut grubu (kira dahil)", category: "varlik", source: "derived", unit: "%", note: "COICOP 04 grubundan" },

    // Kredi & bankacılık
    { key: "faiz-ihtiyac",  label: "İhtiyaç kredisi faizi (yıllık)",  category: "kredi", source: "evds", code: "TP.KTF10", unit: "%" },
    { key: "faiz-tasit",    label: "Taşıt kredisi faizi",             category: "kredi", source: "evds", code: "TP.KTF11", unit: "%" },
    { key: "faiz-konut",    label: "Konut kredisi faizi",             category: "kredi", source: "evds", code: "TP.KTF12", unit: "%" },
    { key: "faiz-ticari",   label: "Ticari kredi faizi",              category: "kredi", source: "evds", code: "TP.KTF17", unit: "%" },
    { key: "faiz-mevduat",  label: "TL mevduat faizi (3 aya kadar)",  category: "kredi", source: "evds", code: "TP.TRY.MT02", unit: "%" },
    { key: "faiz-politika", label: "TCMB ort. fonlama maliyeti",      category: "kredi", source: "evds", code: "TP.APIFON4", unit: "%" },
    { key: "kk-azami-akdi", label: "Kredi kartı azami akdi faiz (aylık)", category: "kredi", source: "pending", unit: "%", note: "TCMB üç aylık tebliğ — EVDS serisi bağlanacak" },
    { key: "kk-harcama",    label: "Kredi kartı harcama hacmi",       category: "kredi", source: "pending", unit: "TRY", note: "BKM aylık verisi bağlanacak" },
    { key: "kk-harcama-yillik", label: "Kart harcaması yıllık artış", category: "kredi", source: "pending", unit: "%", note: "BKM verisi bağlanınca türetilecek" },
    { key: "bireysel-kredi", label: "Bireysel kredi hacmi",           category: "kredi", source: "pending", unit: "TRY", note: "BDDK haftalık bülten bağlanacak" },
    { key: "takip-oran",    label: "Takipteki krediler oranı",        category: "kredi", source: "pending", unit: "%", note: "BDDK verisi bağlanacak" },
    { key: "m2-arz",        label: "M2 para arzı",                    category: "kredi", source: "evds", code: "TP.PR.ARZ13", unit: "TRY" },
    { key: "m2-yillik",     label: "M2 yıllık genişleme",             category: "kredi", source: "derived", unit: "%" },
    { key: "reel-faiz",     label: "Reel faiz (mevduat − TÜFE)",      category: "kredi", source: "derived", unit: "%" },

    // Gelir & alım gücü
    { key: "asgari-net",    label: "Asgari ücret (net)",              category: "gelir", source: "static", unit: "TRY", note: "Resmi Gazete — 2026: 28.075,50 TL" },
    { key: "asgari-brut",   label: "Asgari ücret (brüt)",             category: "gelir", source: "static", unit: "TRY", note: "Resmi Gazete — 2026: 33.030 TL" },
    { key: "asgari-artis",  label: "Asgari ücret yıllık artış",       category: "gelir", source: "derived", unit: "%" },
    { key: "asgari-reel",   label: "Asgari ücret reel değişim",       category: "gelir", source: "derived", unit: "%", note: "Nominal artış − gerçek enflasyon" },
    { key: "asgari-usd",    label: "Asgari ücret (USD karşılığı)",    category: "gelir", source: "derived", unit: "USD" },
    { key: "asgari-usd-yillik", label: "USD bazlı asgari ücret değişimi", category: "gelir", source: "derived", unit: "%" },
    { key: "alim-gucu-gunluk", label: "Günlük alım gücü (net/30)",    category: "gelir", source: "derived", unit: "TRY" },
    { key: "alim-gucu-endeks", label: "Alım gücü endeksi (2016=100)", category: "gelir", source: "derived", unit: "endeks", note: "Asgari ücret endeksi / TÜFE endeksi" },
    { key: "asgari-ekmek",  label: "Asgari ücretle alınan ekmek (adet/ay)", category: "gelir", source: "pending", unit: "adet", note: "Madde fiyatları bağlanınca hesaplanacak" },

    // Statik referanslar (BKM, TCMB FİR, emekli aylığı)
    ...STATIC_FACTS.map((f) => ({ key: f.key, label: f.label, category: f.category, source: "static" as const, unit: f.unit, note: f.note })),

    // Alternatif ölçümler
    { key: "enag-yillik",   label: "ENAG E-TÜFE (yıllık)",            category: "alternatif", source: "static", unit: "%", note: ENAG_LATEST.source },
    { key: "enag-aylik",    label: "ENAG E-TÜFE (aylık)",             category: "alternatif", source: "static", unit: "%", note: ENAG_LATEST.source },
    { key: "resmi-enag-fark", label: "Resmi − ENAG makası",           category: "alternatif", source: "derived", unit: "%" },
    { key: "ito-gecim",     label: "İTO İstanbul geçinme endeksi",    category: "alternatif", source: "pending", unit: "%", note: "İTO aylık yayını bağlanacak" },
    { key: "beklenti-12ay", label: "12 ay sonrası enflasyon beklentisi", category: "alternatif", source: "evds", code: "TP.BEK.S01.A", unit: "%", note: "TCMB piyasa katılımcıları anketi" },
  ];
}

/** Kompozit katman ağırlıkları — veri olmayan katmanın ağırlığı diğerlerine dağıtılır. */
export const LAYER_WEIGHTS: { key: string; label: string; weight: number }[] = [
  { key: "katman-resmi",  label: "Resmi TÜFE",          weight: 0.15 },
  { key: "katman-ithal",  label: "İthal enflasyon",     weight: 0.20 },
  { key: "katman-gecim",  label: "Geçim sepeti",        weight: 0.20 },
  { key: "katman-varlik", label: "Varlık fiyatları",    weight: 0.15 },
  { key: "katman-kredi",  label: "Borçlanma maliyeti",  weight: 0.10 },
  { key: "katman-enag",   label: "ENAG E-TÜFE",         weight: 0.20 },
];
