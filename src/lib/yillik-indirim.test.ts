/**
 * Yıllık paket indirim oranı (fiyattan hesaplanır).
 *
 * BU TESTİN VARLIK SEBEBİ CANLIDA BULUNAN YANLIŞ BEYAN:
 * ürünler sayfası her yıllık pakette SABİT "%50 tasarruf" yazıyordu.
 *
 *   İşletme  ₺1.249/ay → yıllık ₺7.490   → gerçek %50,0  ✓
 *   Kurumsal ₺1.799/ay → yıllık ₺12.490  → gerçek %42,1  ✗
 *
 * Kurumsal pakette "%50 tasarruf" ve "yarı fiyat" iddiaları yanlıştı.
 *
 * Çalıştırma: npx tsx src/lib/yillik-indirim.test.ts
 */
export {};

import { aylikEsi, yillikIndirim, type FiyatliSku } from "./yillik-indirim";

let pass = 0, fail = 0;
function check(ad: string, kosul: boolean, detay?: string) {
  if (kosul) { pass++; console.log("  ok  " + ad); }
  else { fail++; console.log("  BASARISIZ " + ad + (detay ? " — " + detay : "")); }
}

/** Canlıdaki gerçek fiyatlar. */
const SKULAR: FiyatliSku[] = [
  { id: "finanserpide-temel-monthly", cycle: "monthly", price: 1249 },
  { id: "finanserpide-tam-monthly",   cycle: "monthly", price: 1799 },
  { id: "finanserpide-temel-yearly",  cycle: "yearly",  price: 7490 },
  { id: "finanserpide-tam-yearly",    cycle: "yearly",  price: 12490 },
];
const bul = (id: string) => SKULAR.find((s) => s.id === id)!;

function main() {
  console.log("\n== Aylık eş bulma ==");
  check("temel eşi", aylikEsi("finanserpide-temel-yearly", SKULAR)?.id === "finanserpide-temel-monthly");
  check("tam eşi", aylikEsi("finanserpide-tam-yearly", SKULAR)?.id === "finanserpide-tam-monthly");
  check("aylık SKU'da eş yok", aylikEsi("finanserpide-temel-monthly", SKULAR) === null);
  // Es bulunamazsa cagiran hicbir iddia GOSTERMIYOR — uydurulmus orandan iyi.
  check("olmayan eş null", aylikEsi("finanserpide-yok-yearly", SKULAR) === null);

  console.log("\n== Gerçek oranlar ==");
  const temel = yillikIndirim(bul("finanserpide-temel-yearly"), bul("finanserpide-temel-monthly"))!;
  check("İşletme %50", temel.yuzde === 50, String(temel.yuzde));
  check("İşletme tasarruf 7.498", temel.tasarrufTutari === 7498, String(temel.tasarrufTutari));

  /**
   * ASIL BULGU: Kurumsal pakette iddia %50'ydi, gercek %42.
   * %50 olmasi icin yillik fiyatin 10.794 olmasi gerekirdi.
   */
  const tam = yillikIndirim(bul("finanserpide-tam-yearly"), bul("finanserpide-tam-monthly"))!;
  check("Kurumsal %42 (iddia %50 DEĞİL)", tam.yuzde === 42, String(tam.yuzde));
  check("Kurumsal tasarruf 9.098", tam.tasarrufTutari === 9098, String(tam.tasarrufTutari));
  check("iki paket farklı oranda", temel.yuzde !== tam.yuzde);

  console.log("\n== Aşağı yuvarlama ==");
  /**
   * %42,9'u "%43" diye sunmak musteriye gercekte olmayan yarim puani
   * vaat etmek olur. Indirim iddiasinda yuvarlama HEP aleyhimize.
   */
  const kesirli = yillikIndirim(
    { id: "x-yearly", cycle: "yearly", price: 685 },
    { id: "x-monthly", cycle: "monthly", price: 100 },
  )!;
  // 1200 -> 685: tasarruf 515 = %42,9
  check("%42,9 aşağı yuvarlandı", kesirli.yuzde === 42, String(kesirli.yuzde));

  console.log("\n== Bozuk girdi ==");
  check("eş yoksa null", yillikIndirim(bul("finanserpide-tam-yearly"), null) === null);
  // Yillik aylıktan pahaliysa "-%8 tasarruf" diye bir sey gosterilemez.
  check("yıllık daha pahalıysa null", yillikIndirim(
    { id: "x-yearly", cycle: "yearly", price: 15000 },
    { id: "x-monthly", cycle: "monthly", price: 1000 },
  ) === null);
  check("eşitse null", yillikIndirim(
    { id: "x-yearly", cycle: "yearly", price: 12000 },
    { id: "x-monthly", cycle: "monthly", price: 1000 },
  ) === null);
  check("sıfır fiyat null", yillikIndirim(
    { id: "x-yearly", cycle: "yearly", price: 0 },
    { id: "x-monthly", cycle: "monthly", price: 1000 },
  ) === null);

  console.log("\n=== Sonuc: " + pass + " passed, " + fail + " failed ===");
  if (fail > 0) process.exit(1);
}

main();
