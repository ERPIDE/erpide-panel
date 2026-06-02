"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Currency } from "@/lib/products";

interface Ctx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<Ctx | null>(null);
const COOKIE_KEY = "erpide_currency";


function detectInitial(): Currency {
  if (typeof document === "undefined") return "USD";
  const m = document.cookie.match(new RegExp(`${COOKIE_KEY}=([^;]+)`));
  if (m) {
    const v = decodeURIComponent(m[1]).toUpperCase();
    if (v === "TRY" || v === "USD") return v as Currency;
  }
  const lang = (navigator.language || "en").toLowerCase();
  return lang.startsWith("tr") ? "TRY" : "USD";
}


export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  // Initial detection only runs in the browser, so we set after mount to
  // avoid SSR/CSR mismatch warnings.
  useEffect(() => { setCurrencyState(detectInitial()); }, []);

  function setCurrency(c: Currency) {
    setCurrencyState(c);
    // Persist for 90 days so the same buyer keeps the same currency between
    // visits without re-detecting from Accept-Language.
    document.cookie = `${COOKIE_KEY}=${c}; max-age=${60 * 60 * 24 * 90}; path=/; samesite=lax`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}


export function useCurrency(): Ctx {
  const ctx = useContext(CurrencyContext);
  // When the provider isn't mounted (e.g. an isolated story or test), fall
  // back to a sensible default rather than throwing.
  return ctx || { currency: "USD", setCurrency: () => {} };
}
