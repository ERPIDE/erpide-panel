"use client";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { Product } from "@/lib/products";

/**
 * Ürünün vizel kimliğini render eden tek bileşen — sitede ürün ikonu/logosu
 * gösteren her yer bunu kullanır (Services anasayfa, /urunler liste, /urunler/[id]
 * detay, ileride Navbar dropdown). Tek kaynak prensibi:
 *  - product.logoImage varsa → orjinal vendor/marka logosu, transparent zeminde
 *    direkt render edilir (dark UI'a uyum). İstisna: `logoBackground: "white"`
 *    set edilmişse (siyah yazılı logolar için, ör. CANIAS) beyaz kart içinde
 *    gösterilir, yoksa yazı görünmez.
 *  - yoksa → Lucide ikon, product.color gradient'ın üstünde
 *
 * Boyutu `size` ile belirlersin; iç Lucide ikon `~%50` oranında çizilir.
 */
export function ProductLogo({
  product,
  size = 56,
  className = "",
}: {
  product: Pick<Product, "name" | "icon" | "color" | "logoImage" | "logoBackground">;
  size?: number;
  className?: string;
}) {
  const radius = Math.round(size * 0.22);
  const iconSize = Math.round(size * 0.5);

  if (product.logoImage) {
    // Default transparent — koyu tema üstünde logonun kendi rengi/zemini durur.
    // Siyah yazılı (CANIAS gibi) logolar için override: "white" → beyaz kart.
    if (product.logoBackground === "white") {
      return (
        <div
          className={`relative bg-white flex items-center justify-center overflow-hidden ring-1 ring-white/10 ${className}`}
          style={{ width: size, height: size, borderRadius: radius }}
        >
          <Image
            src={product.logoImage}
            alt={`${product.name} logo`}
            width={size}
            height={size}
            className="object-contain"
            style={{ padding: Math.round(size * 0.1) }}
          />
        </div>
      );
    }
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden ${className}`}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <Image
          src={product.logoImage}
          alt={`${product.name} logo`}
          width={size}
          height={size}
          className="object-contain"
        />
      </div>
    );
  }

  const Icon: LucideIcon = product.icon;
  return (
    <div
      className={`bg-gradient-to-br ${product.color} flex items-center justify-center ${className}`}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <Icon size={iconSize} className="text-white" />
    </div>
  );
}
