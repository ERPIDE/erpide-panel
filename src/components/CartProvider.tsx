"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSku, type SKU } from "@/lib/products";
import { priceFor } from "@/lib/currency";

export interface CartLine {
  skuId: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  total: number;
  addItem: (skuId: string, quantity?: number) => void;
  removeItem: (skuId: string) => void;
  updateQuantity: (skuId: string, quantity: number) => void;
  clear: () => void;
  getLineWithSku: () => Array<{ line: CartLine; sku: SKU }>;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "erpide_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  const addItem = useCallback((skuId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.skuId === skuId);
      if (existing) {
        return prev.map((l) => (l.skuId === skuId ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { skuId, quantity }];
    });
  }, []);

  const removeItem = useCallback((skuId: string) => {
    setLines((prev) => prev.filter((l) => l.skuId !== skuId));
  }, []);

  const updateQuantity = useCallback((skuId: string, quantity: number) => {
    if (quantity <= 0) {
      setLines((prev) => prev.filter((l) => l.skuId !== skuId));
      return;
    }
    setLines((prev) => prev.map((l) => (l.skuId === skuId ? { ...l, quantity } : l)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const getLineWithSku = useCallback(() => {
    return lines
      .map((line) => {
        const sku = getSku(line.skuId);
        return sku ? { line, sku } : null;
      })
      .filter((x): x is { line: CartLine; sku: SKU } => x !== null);
  }, [lines]);

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const total = getLineWithSku().reduce((sum, { line, sku }) => sum + priceFor(sku, "USD").price * line.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, itemCount, total, addItem, removeItem, updateQuantity, clear, getLineWithSku }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
