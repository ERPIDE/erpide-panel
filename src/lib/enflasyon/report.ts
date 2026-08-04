/**
 * ERPIDE Gerçek Enflasyon Raporu — HTML mail gövdesi.
 *
 * Tasarım hedefi: "aşırı detaylı ama okuması kolay" — tek bakışta manşet
 * (Gerçek vs Resmi vs ENAG), sonra katmanlar, sonra öne çıkan hareketler.
 * Tam parametre dökümü maile konmaz (262 satır maili öldürür) — panel linki verilir.
 */

import { emailHeader, emailFooter, emailSignature } from "@/lib/email-template";
import type { RunData, ParamResult } from "./engine";

const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function periodLabel(period: string): string {
  const [y, m] = period.split("-").map((x) => parseInt(x, 10));
  return `${MONTHS_TR[(m || 1) - 1]} ${y}`;
}

function fmtNum(v: number, digits = 1): string {
  return v.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtValue(p: { value: number | null; unit: string }): string {
  if (p.value == null) return "—";
  switch (p.unit) {
    case "%":      return `%${fmtNum(p.value)}`;
    case "TRY":    return `${fmtNum(p.value, 2)} ₺`;
    case "USD":    return `$${fmtNum(p.value, 0)}`;
    case "adet":   return fmtNum(p.value, 0);
    case "endeks": return fmtNum(p.value);
    default:       return fmtNum(p.value, 2);
  }
}

function signColor(v: number | null, invert = false): string {
  if (v == null) return "#6b7280";
  const bad = invert ? v < 0 : v > 0;
  return bad ? "#dc2626" : "#16a34a";
}

function bigCard(label: string, value: string, color: string, sub?: string): string {
  return `
  <td style="padding:6px" width="25%">
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
      <tr><td style="padding:14px 10px;text-align:center">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
        <div style="font-size:26px;font-weight:800;color:${color};margin-top:6px">${value}</div>
        ${sub ? `<div style="font-size:10px;color:#94a3b8;margin-top:4px">${sub}</div>` : ""}
      </td></tr>
    </table>
  </td>`;
}

function sectionTitle(t: string): string {
  return `<h2 style="font-size:16px;color:#0f172a;margin:28px 0 10px;border-left:3px solid #3b82f6;padding-left:10px">${t}</h2>`;
}

function row(cells: string[], header = false): string {
  const tag = header ? "th" : "td";
  const style = header
    ? "padding:8px 10px;font-size:11px;color:#64748b;text-align:left;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0"
    : "padding:8px 10px;font-size:13px;color:#1f2937;border-bottom:1px solid #f1f5f9";
  return `<tr>${cells.map((c) => `<${tag} style="${style}">${c}</${tag}>`).join("")}</tr>`;
}

export function buildInflationEmailHtml(run: RunData): string {
  const h = run.headline;
  const p = (key: string): ParamResult | undefined => run.params.find((x) => x.key === key);

  // Öne çıkan kur hareketleri (yıllık değişimi en yüksek 6 majör para birimi)
  const kurMoves = run.params
    .filter((x) => x.key.startsWith("kur-") && x.key.endsWith("-yillik") && x.value != null)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 6);

  // En büyük ithal enflasyon katkıları
  const katkilar = run.params
    .filter((x) => x.category === "ithal-katki" && x.value != null)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 8);

  const asgariNet = p("asgari-net");
  const asgariArtis = p("asgari-artis");
  const asgariReel = p("asgari-reel");
  const asgariUsd = p("asgari-usd");
  const alimGucu = p("alim-gucu-endeks");

  const gapText = h.gap != null
    ? `Hissedilen enflasyon resmi rakamın <b style="color:${h.gap > 0 ? "#dc2626" : "#16a34a"}">${fmtNum(Math.abs(h.gap))} puan ${h.gap > 0 ? "üzerinde" : "altında"}</b> hesaplandı.`
    : "";

  return `
<div style="background-color:#f1f5f9;padding:24px 8px">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif">
    ${emailHeader}
    <div style="padding:28px 32px">
      <h1 style="font-size:20px;color:#0f172a;margin:0 0 4px">Gerçek Enflasyon Raporu — ${periodLabel(run.period)}</h1>
      <p style="font-size:13px;color:#64748b;margin:0 0 20px">
        ${run.stats.total} parametreli çok kaynaklı analiz · ${run.stats.live} canlı veri · TCMB, EVDS, World Bank, TÜİK, ENAG
      </p>

      <table cellpadding="0" cellspacing="0" width="100%"><tr>
        ${bigCard("HİSSEDİLEN", h.felt != null ? `%${fmtNum(h.felt)}` : "—", "#dc2626", "borçlu-kiracı hane sepeti")}
        ${bigCard("Resmi TÜFE", h.official != null ? `%${fmtNum(h.official)}` : "—", "#2563eb", "TÜİK yıllık")}
        ${bigCard("ENAG E-TÜFE", `%${fmtNum(h.enag)}`, "#9333ea", "bağımsız ölçüm")}
        ${bigCard("Fark", h.gap != null ? `${h.gap > 0 ? "+" : ""}${fmtNum(h.gap)}` : "—", signColor(h.gap), "hissedilen − resmi")}
      </tr></table>
      <p style="font-size:13px;color:#334155;margin:14px 0 0">${gapText}</p>

      ${(run.feltLayers?.length ?? 0) > 0 ? `
      ${sectionTitle("Hissedilen Enflasyon Bileşenleri")}
      <p style="font-size:12px;color:#64748b;margin:0 0 8px">Geliri gıdaya, kiraya, borca ve faturaya giden hanenin sepeti.</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${row(["Bileşen", "Yıllık", "Ağırlık", "Açıklama"], true)}
        ${run.feltLayers!.map((l) => row([
          `<b>${l.label}</b>`,
          l.value != null ? `<b style="color:#0f172a">%${fmtNum(l.value)}</b>` : `<span style="color:#94a3b8">veri yok</span>`,
          l.effectiveWeight != null ? `%${Math.round(l.effectiveWeight * 100)}` : "—",
          `<span style="color:#64748b;font-size:12px">${l.detail || ""}</span>`,
        ])).join("")}
      </table>` : ""}

      ${(run.profiles?.length ?? 0) > 0 ? `
      ${sectionTitle("Senin Enflasyonun Kaç? — Sınıf Profilleri")}
      <p style="font-size:12px;color:#64748b;margin:0 0 8px">Aynı veri, farklı bütçe ağırlıkları — herkesin enflasyonu kendi sepetinde.</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${row(["Profil", "Yıllık enflasyon"], true)}
        ${run.profiles!.some((p) => p.group === "kriz") ? `
        ${row([`<b style="color:#dc2626;font-size:11px;text-transform:uppercase">⚠ En sert vurulan senaryolar</b>`, ""])}
        ${run.profiles!.filter((p) => p.group === "kriz").map((p) => row([
          `<b>${p.label}</b>${p.desc ? `<br/><span style="color:#94a3b8;font-size:11px">${p.desc}</span>` : ""}`,
          p.value != null ? `<b style="color:#b91c1c;font-size:15px">%${fmtNum(p.value)}</b>` : "—",
        ])).join("")}` : ""}
        ${row([`<b style="color:#64748b;font-size:11px;text-transform:uppercase">Hane</b>`, ""])}
        ${run.profiles!.filter((p) => (p.group ?? "hane") === "hane").map((p) => row([
          `<b>${p.label}</b>${p.desc ? `<br/><span style="color:#94a3b8;font-size:11px">${p.desc}</span>` : ""}`,
          p.value != null ? `<b style="color:#dc2626">%${fmtNum(p.value)}</b>` : "—",
        ])).join("")}
        ${row([`<b style="color:#64748b;font-size:11px;text-transform:uppercase">İş dünyası (maliyet enflasyonu)</b>`, ""])}
        ${run.profiles!.filter((p) => p.group === "is").map((p) => row([
          `<b>${p.label}</b>${p.desc ? `<br/><span style="color:#94a3b8;font-size:11px">${p.desc}</span>` : ""}`,
          p.value != null ? `<b style="color:#d97706">%${fmtNum(p.value)}</b>` : "—",
        ])).join("")}
      </table>` : ""}

      ${sectionTitle(`Genel Kompozit Katmanları${h.real != null ? ` (ekonomi geneli: %${fmtNum(h.real)})` : ""}`)}
      <table cellpadding="0" cellspacing="0" width="100%">
        ${row(["Katman", "Değer", "Ağırlık", "Açıklama"], true)}
        ${run.layers.map((l) => row([
          `<b>${l.label}</b>`,
          l.value != null ? `<b style="color:#0f172a">%${fmtNum(l.value)}</b>` : `<span style="color:#94a3b8">veri yok</span>`,
          l.effectiveWeight != null ? `%${Math.round(l.effectiveWeight * 100)}` : "—",
          `<span style="color:#64748b;font-size:12px">${l.detail || ""}</span>`,
        ])).join("")}
      </table>

      ${sectionTitle("Kurda Yıllık Hareket (İlk 6)")}
      <table cellpadding="0" cellspacing="0" width="100%">
        ${row(["Para birimi", "Yıllık değişim"], true)}
        ${kurMoves.map((k) => row([
          k.label.replace(" yıllık değişim", ""),
          `<b style="color:${signColor(k.value)}">%${fmtNum(k.value as number)}</b>`,
        ])).join("")}
      </table>

      ${katkilar.length > 0 ? `
      ${sectionTitle("İthal Enflasyon — En Büyük Katkılar")}
      <p style="font-size:12px;color:#64748b;margin:0 0 8px">İthalat payı × (kur değişimi + o ülkenin enflasyonu) — cebimize yansıyan dış fiyat baskısı.</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${row(["Ülke", "Katkı (puan)"], true)}
        ${katkilar.map((k) => row([
          k.label.replace(" ithal enflasyon katkısı", ""),
          `<b>${fmtNum(k.value as number, 2)}</b>`,
        ])).join("")}
      </table>` : ""}

      ${sectionTitle("Alım Gücü")}
      <table cellpadding="0" cellspacing="0" width="100%">
        ${row(["Gösterge", "Değer", "Not"], true)}
        ${[
          asgariNet && row(["Asgari ücret (net)", `<b>${fmtValue(asgariNet)}</b>`, asgariNet.extra || ""]),
          asgariArtis && row(["Yıllık artış", `<b>${fmtValue(asgariArtis)}</b>`, asgariArtis.extra || ""]),
          asgariReel && row(["Reel değişim", `<b style="color:${signColor(asgariReel.value, true)}">${fmtValue(asgariReel)}</b>`, "gerçek enflasyon düşülünce"]),
          asgariUsd && row(["Dolar karşılığı", `<b>${fmtValue(asgariUsd)}</b>`, "aylık"]),
          alimGucu && row(["Alım gücü endeksi", `<b>${fmtValue(alimGucu)}</b>`, alimGucu.extra || ""]),
        ].filter(Boolean).join("")}
      </table>

      ${(() => {
        const rows = [
          { ad: "Gram altın (TL)", nom: p("gram-altin-yillik"), reel: p("altin-reel-getiri") },
          { ad: "ABD Doları (TL)", nom: p("kur-usd-yillik"), reel: p("usd-reel-getiri") },
          { ad: "BIST 100", nom: p("bist100-yillik"), reel: p("bist100-reel") },
          { ad: "Bitcoin (USD)", nom: p("btc-yillik"), reel: undefined },
        ].filter((r) => r.nom?.value != null);
        if (rows.length === 0) return "";
        return `
      ${sectionTitle("Parayı Nerede Tutsaydın? (Son 1 Yıl)")}
      <table cellpadding="0" cellspacing="0" width="100%">
        ${row(["Araç", "Nominal getiri", "Gerçek enflasyona göre"], true)}
        ${rows.map((r) => row([
          r.ad,
          `<b>${fmtValue(r.nom!)}</b>`,
          r.reel?.value != null
            ? `<b style="color:${signColor(r.reel.value, true)}">${r.reel.value > 0 ? "+" : ""}${fmtNum(r.reel.value)} puan</b>`
            : `<span style="color:#94a3b8">—</span>`,
        ])).join("")}
      </table>`;
      })()}

      <div style="margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">
        <p style="font-size:12px;color:#475569;margin:0 0 6px"><b>Kapsam:</b> ${run.stats.total} parametre — ${run.stats.live} canlı, ${run.stats.static} resmi statik seri, ${run.stats.derived} türetilmiş${run.stats.waitingKey > 0 ? `, ${run.stats.waitingKey} EVDS anahtarı bekliyor` : ""}${run.stats.pending > 0 ? `, ${run.stats.pending} kaynak bağlanacak` : ""}.</p>
        ${run.notes.map((n) => `<p style="font-size:11px;color:#94a3b8;margin:4px 0 0">• ${n}</p>`).join("")}
      </div>

      <table cellpadding="0" cellspacing="0" style="margin:24px auto 0"><tr><td style="background:linear-gradient(90deg,#2563eb,#7c3aed);border-radius:10px">
        <a href="https://erpide.com/enflasyon" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">
          Raporun Tamamını Görüntüle → erpide.com/enflasyon
        </a>
      </td></tr></table>
      <p style="font-size:11px;color:#94a3b8;text-align:center;margin:10px 0 0">
        Tüm ${run.stats.total} parametre, sınıf profilleri ve metodoloji — üyelere ücretsiz.
      </p>

      ${emailSignature}
    </div>
    ${emailFooter}
  </div>
</div>`;
}
