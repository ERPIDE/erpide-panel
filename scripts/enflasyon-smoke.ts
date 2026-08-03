// Enflasyon motoru smoke testi: node scripts üzerinden tek koşu yapar,
// manşet + katman + istatistik çıktısını basar. DB'ye yazmaz.
import { runInflationEngine } from "../src/lib/enflasyon/engine";

async function main() {
  const t0 = Date.now();
  const run = await runInflationEngine();
  console.log("süre:", ((Date.now() - t0) / 1000).toFixed(1), "sn");
  console.log("dönem:", run.period);
  console.log("manşet:", JSON.stringify(run.headline));
  console.log("katmanlar:");
  for (const l of run.layers) {
    console.log(`  ${l.label}: ${l.value ?? "—"} (etkin ağırlık ${l.effectiveWeight != null ? Math.round(l.effectiveWeight * 100) + "%" : "devre dışı"})`);
  }
  console.log("istatistik:", JSON.stringify(run.stats));
  console.log("notlar:", run.notes.join(" | "));
  const kur = run.params.find((p) => p.key === "kur-usd");
  const kurY = run.params.find((p) => p.key === "kur-usd-yillik");
  console.log("USD kuru:", kur?.value, "yıllık değişim:", kurY?.value);
  const cn = run.params.find((p) => p.key === "cpi-chn");
  console.log("Çin CPI:", cn?.value, cn?.extra);
  const katki = run.params.filter((p) => p.category === "ithal-katki" && p.value != null).length;
  console.log("ithal katkı hesaplanan ülke:", katki);
}

main().catch((e) => { console.error(e); process.exit(1); });
