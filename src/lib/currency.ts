/**
 * Multi-currency helpers.
 *
 * The site is sold globally for CaptchaERPIDE (bot developers, Türkiye payı
 * <%30) and TR-only for FinansERPIDE. We pick the buyer's display currency
 * from the Accept-Language header: anything that smells like Turkish lands
 * on TRY, everyone else gets USD where the SKU supports it.
 *
 * Buyers can override the auto-pick by setting an `erpide_currency` cookie
 * (one of "TRY" | "USD"). This lets us add a header dropdown later without
 * changing the API surface.
 */
import type { SKU, Currency } from "@/lib/products";

export const SUPPORTED_CURRENCIES: Currency[] = ["TRY", "USD"];

/** USD→TRY çevrim kuru. iyzico hesabımız sadece TRY ödeme aldığı için fiyatlar
 *  USD gösterilse de ödeme TRY çevrilerek çekilir. Kuru env'den okuyoruz —
 *  default 40, manuel güncellenir ya da ileride bir kur API'sine bağlanır. */
const DEFAULT_USD_TRY = 40;
export function getUsdTryRate(): number {
  const raw = process.env.USD_TRY_RATE;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_USD_TRY;
}

/** Bir SKU için iyzico'ya gönderilecek TRY tutarı. SKU'nun USD fiyatı varsa
 *  kur ile çarpar; yoksa legacy `price` (TRY) döner. */
export function priceForCharge(sku: SKU): { price: number; currency: "TRY" } {
  const usd = sku.prices?.USD;
  if (usd !== undefined) {
    const tryAmount = Math.round(usd * getUsdTryRate() * 100) / 100;
    return { price: tryAmount, currency: "TRY" };
  }
  return { price: sku.price, currency: "TRY" };
}

export interface CurrencyFormatOptions {
  short?: boolean; // "$9.99" instead of "USD 9.99"
}


/** Tüm dünya için USD gösteriyoruz — TR enflasyonu yüzünden TRY fiyat sabit
 *  tutulamıyor, ayrıca diğer ERP ürünleri (1C, CANIAS) zaten USD ile fiyat
 *  veriyor, karşılaştırma kolay olsun. Cookie override kalır (admin/debug
 *  için), ama default herkese USD. */
export function pickCurrency(opts: {
  acceptLanguage?: string | null;
  cookieValue?: string | null;
}): Currency {
  const cookie = (opts.cookieValue || "").toUpperCase();
  if (cookie === "TRY" || cookie === "USD") return cookie as Currency;
  return "USD";
}


/** Look up the SKU's price in the requested currency, falling back to the
 *  legacy single-currency `price` (always TRY) when an explicit per-currency
 *  override isn't defined. Returns `{price, currency}` so the caller always
 *  knows which currency it actually got — important for the iyzico charge. */
export function priceFor(sku: SKU, requested: Currency): { price: number; currency: Currency } {
  const explicit = sku.prices?.[requested];
  if (explicit !== undefined) return { price: explicit, currency: requested };
  // Fallback: USD varsa onu döndür, yoksa legacy price (TRY varsayılır).
  const usd = sku.prices?.USD;
  if (usd !== undefined) return { price: usd, currency: "USD" };
  return { price: sku.price, currency: "TRY" };
}


/** Format a price for display. Tries Intl first so locale-specific separators
 *  come for free; falls back to a tight hand-rolled format if Intl trips. */
export function formatPrice(amount: number, currency: Currency, opts: CurrencyFormatOptions = {}): string {
  try {
    const fmt = new Intl.NumberFormat(currency === "TRY" ? "tr-TR" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "TRY" ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return fmt.format(amount);
  } catch {
    const sym = currency === "TRY" ? "₺" : "$";
    return opts.short ? `${sym}${amount}` : `${currency} ${amount}`;
  }
}


/** Server-side helper that pulls the language header off a Next.js Request
 *  and returns the chosen currency. */
export function currencyFromRequest(req: Request): Currency {
  const accept = req.headers.get("accept-language");
  const cookie = req.headers.get("cookie") || "";
  const match = /(?:^|;\s*)erpide_currency=([^;]+)/i.exec(cookie);
  return pickCurrency({
    acceptLanguage: accept,
    cookieValue: match ? decodeURIComponent(match[1]) : null,
  });
}
