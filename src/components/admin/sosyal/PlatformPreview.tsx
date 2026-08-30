"use client";
import { useState } from "react";
import Image from "next/image";
import { composeText } from "@/lib/social/compose";
import { PLATFORM_LABELS, type Platform, type SocialPostView } from "@/lib/social/types";
import PlatformIcon from "./PlatformIcon";

/** Platform limitleri — panelde sayaç göstermek için (compose.ts ile aynı değerler). */
const LIMITS: Record<Platform, number> = {
  site: 100_000,
  facebook: 5_000,
  instagram: 2_200,
  linkedin: 3_000,
};

/**
 * Yayından önce her platformda metnin nasıl görüneceğini gösterir.
 * Aynı içerik dört yerde farklı biçimlendiğinden, göndermeden önce
 * görmek yanlış paylaşımın en ucuz sigortası.
 */
export default function PlatformPreview({
  post,
  targets,
  imagePreviewUrl,
}: {
  post: SocialPostView;
  targets: Platform[];
  imagePreviewUrl: string | null;
}) {
  const [active, setActive] = useState<Platform>(targets[0] ?? "site");
  const current = targets.includes(active) ? active : (targets[0] ?? "site");

  if (targets.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d0d14] p-6 text-sm text-gray-500">
        Önizleme için en az bir yayın hedefi seçin.
      </div>
    );
  }

  const text = composeText(post, current);
  const limit = LIMITS[current];
  const over = text.length > limit;
  // Instagram kare görsel kullanır; diğerleri yatay.
  const square = current === "instagram";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d14] overflow-hidden">
      <div className="flex border-b border-white/5">
        {targets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setActive(p)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-semibold transition ${
              current === p
                ? "bg-blue-600/10 text-blue-400 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <PlatformIcon platform={p} size={14} />
            <span className="hidden sm:inline">{PLATFORM_LABELS[p].replace("erpide.com ", "")}</span>
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {imagePreviewUrl && (
          <div
            className={`relative overflow-hidden rounded-xl border border-white/10 bg-black ${
              square ? "aspect-square max-w-[320px]" : "aspect-[1200/630]"
            }`}
          >
            <Image
              src={square ? withFormat(imagePreviewUrl, "square") : imagePreviewUrl}
              alt="Görsel önizleme"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              unoptimized
            />
          </div>
        )}

        <pre className="whitespace-pre-wrap break-words font-sans text-sm text-gray-300 leading-relaxed">
          {text || <span className="text-gray-600">Metin boş</span>}
        </pre>

        <div className={`text-xs ${over ? "text-red-400" : "text-gray-500"}`}>
          {text.length.toLocaleString("tr-TR")} / {limit.toLocaleString("tr-TR")} karakter
          {over && " — sınır aşıldı, yayında kırpılacak"}
        </div>
      </div>
    </div>
  );
}

/** Otomatik üretilen görsele format parametresi ekler; yüklenmiş görsele dokunmaz. */
function withFormat(url: string, format: "square" | "landscape"): string {
  if (!url.includes("/api/og/")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}format=${format}`;
}
