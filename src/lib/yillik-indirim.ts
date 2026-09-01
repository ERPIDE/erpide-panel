/**
 * YILLIK PAKET İNDİRİM ORANI — fiyattan hesaplanır, elle yazılmaz.
 *
 * BULUNAN HATA: ürünler sayfası her yıllık pakette sabit "%50 tasarruf"
 * yazıyordu ve aynı iddia paket metinlerine de elle gömülmüştü. Gerçek
 * oranlar tutmuyordu:
 *
 *   İşletme  ₺1.249/ay → ₺14.988/yıl · yıllık ₺7.490  →  %50,0  ✓
 *   Kurumsal ₺1.799/ay → ₺21.588/yıl · yıllık ₺12.490 →  %42,1  ✗
 *
 * Kurumsal pakette "%50 tasarruf" ve "yıllık ödemede yarı fiyat" yanlıştı.
 * Canlı bir fiyat sayfasında yanıltıcı indirim beyanı yalnızca hata değil,
 * Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği kapsamına giren
 * bir risk.
 *
 * Kök neden sayının SABİT yazılmış olmasıydı; fiyat değişince metin
 * değişmiyordu. Artık tek kaynak burası ve oran fiyattan çıkıyor.
 */

export interface FiyatliSku {
  id: string;
  cycle: "monthly" | "yearly";
  price: number;
}

/**
 * Yıllık SKU'nun aylık eşi.
 *
 * Eşleşme id kuralına dayanıyor (`...-yearly` ↔ `...-monthly`). Eş
 * bulunamazsa null dönüyor ve çağıran hiçbir iddia GÖSTERMİYOR —
 * uydurulmuş bir orandan iyidir.
 */
export function aylikEsi(yearlyId: string, skular: FiyatliSku[]): FiyatliSku | null {
  if (!yearlyId.endsWith("-yearly")) return null;
  const hedef = yearlyId.slice(0, -"-yearly".length) + "-monthly";
  return skular.find((s) => s.id === hedef && s.cycle === "monthly") ?? null;
}

export interface IndirimBilgisi {
  /** Aylık ödemeye göre tasarruf yüzdesi (tam sayıya yuvarlı). */
  yuzde: number;
  /** Yıllık ödeyince cepte kalan tutar. */
  tasarrufTutari: number;
  /** Aylık ödemenin yıllık toplamı. */
  aylikYillikToplam: number;
}

/**
 * Yıllık pakette gerçek indirim.
 *
 * AŞAĞI YUVARLANIYOR: %42,9'u "%43" diye sunmak müşteriye gerçekte
 * olmayan yarım puanı vaat etmek olur. İndirim iddiasında yuvarlama HEP
 * aleyhimize olmalı.
 *
 * Yıllık fiyat aylıktan pahalıysa (yanlış giriş) null dönüyor: "-%8
 * tasarruf" diye bir şey gösterilemez.
 */
export function yillikIndirim(
  yearly: FiyatliSku,
  monthly: FiyatliSku | null,
): IndirimBilgisi | null {
  if (!monthly || !(monthly.price > 0) || !(yearly.price > 0)) return null;
  const aylikYillikToplam = monthly.price * 12;
  const tasarruf = aylikYillikToplam - yearly.price;
  if (tasarruf <= 0) return null;
  return {
    yuzde: Math.floor((tasarruf / aylikYillikToplam) * 100),
    tasarrufTutari: Math.round(tasarruf),
    aylikYillikToplam,
  };
}
