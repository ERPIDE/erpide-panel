"use client";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { Product } from "@/lib/products";

/**
 * Ürünün vizel kimliğini render eden tek bileşen — sitede ürün ikonu/logosu
 * gösteren her yer bunu kullanır (Services anasayfa, /urunler liste, /urunler/[id]
 * detay, ileride Navbar dropdown).
 *
 * Tek kaynak / uniform brand-icon davranış:
 *  - product.logoImage varsa → beyaz rounded card içinde orjinal logo
 *    (Apple Human Interface app-icon estetiği; tüm logolar aynı görsel ölçüde
 *    durur ve dark UI'da okunabilir). Card overflow-hidden — kenar
 *    PNG'lerindeki grunge/transparent border'ları clip eder.
 *  - product.logoBackground === "transparent" → istisna olarak beyaz
 *    background'u kaldırır (default white). İleride neon/cyan logoları için.
 *  - logoImage yok → Lucide ikon, product.color gradient'ın üstünde.
 *
 * Boyutu `size` ile belirlersin; Lucide ikon `~%50`, image içi padding `%6`.
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
    const isTransparent = product.logoBackground === "transparent";
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden ${
          isTransparent ? "" : "bg-white ring-1 ring-white/10"
        } ${className}`}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <Image
          src={product.logoImage}
          alt={`${product.name} logo`}
          width={size}
          height={size}
          className="object-contain"
          style={{ padding: isTransparent ? 0 : Math.round(size * 0.06) }}
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
