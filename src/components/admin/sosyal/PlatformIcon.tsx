"use client";
import { Globe } from "lucide-react";
import type { Platform } from "@/lib/social/types";

/**
 * Platform rozetleri.
 *
 * lucide-react 1.x marka ikonlarını (Facebook/Instagram/Linkedin) kaldırdı.
 * Marka SVG'lerini kopyalamak yerine, platformun kendi rengini taşıyan harf
 * rozetleri kullanıyoruz — panelde tanınmak için yeterli, lisans derdi yok.
 */

const BRAND: Record<Exclude<Platform, "site">, { label: string; bg: string }> = {
  facebook: { label: "f", bg: "#1877F2" },
  instagram: { label: "IG", bg: "#E4405F" },
  linkedin: { label: "in", bg: "#0A66C2" },
};

export default function PlatformIcon({
  platform,
  size = 16,
  className = "",
}: {
  platform: Platform;
  size?: number;
  className?: string;
}) {
  if (platform === "site") {
    return <Globe size={size} className={className} />;
  }

  const brand = BRAND[platform];
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded font-bold text-white shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: brand.bg,
        // Rozet küçüldükçe harf de küçülsün; "IG"/"in" iki karakter olduğu için
        // tek karakterli "f"ten biraz daha dar tutuluyor.
        fontSize: Math.round(size * (brand.label.length > 1 ? 0.45 : 0.62)),
        lineHeight: 1,
      }}
    >
      {brand.label}
    </span>
  );
}
