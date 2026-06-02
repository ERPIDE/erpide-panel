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

export interface CurrencyFormatOptions {
  short?: boolean; // "$9.99" instead of "USD 9.99"
}


/** Read the user's Accept-Language header and a manual cookie override and
 *  return the currency we should display prices in. */
export function pickCurrency(opts: {
  acceptLanguage?: string | null;
  cookieValue?: string | null;
}): Currency {
  const cookie = (opts.cookieValue || "").toUpperCase();
  if (cookie === "TRY" || cookie === "USD") return cookie as Currency;

  const al = (opts.acceptLanguage || "").toLowerCase();
  if (al.includes("tr")) return "TRY";
  return "USD";
}


/** Look up the SKU's price in the requested currency, falling back to the
 *  legacy single-currency `price` (always TRY) when an explicit per-currency
 *  override isn't defined. Returns `{price, currency}` so the caller always
 *  knows which currency it actually got — important for the iyzico charge. */
export function priceFor(sku: SKU, requested: Currency): { price: number; currency: Currency } {
  const explicit = sku.prices?.[requested];
  if (explicit !== undefined) return { price: explicit, currency: requested };
  // Requested currency not supported on this SKU → fall back to TRY.
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
