/**
 * Sosyal yayın görseli üreticisi (ImageResponse).
 *
 * Tek bir post'tan iki oran üretir:
 *   landscape 1200×630 — Gündem kartı, Facebook, LinkedIn, OG meta
 *   square    1080×1080 — Instagram (dikdörtgen görsel kırpılıyor)
 *
 * Böylece her paylaşım için elle görsel hazırlamaya gerek kalmıyor: başlık,
 * dekoratif emoji ve marka rengi seçmek yeterli.
 */
import { ImageResponse } from "next/og";
import { gradientCss } from "./gradients";
import type { SocialPostView } from "./types";

export type OgFormat = "landscape" | "square";

const SIZES: Record<OgFormat, { width: number; height: number }> = {
  landscape: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
};

export function parseFormat(v: string | null): OgFormat {
  return v === "square" ? "square" : "landscape";
}

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function formatDateTR(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_TR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Uzun başlıklar kareye sığmıyor; karakter sayısına göre punto düşürüyoruz.
 * ImageResponse'ta otomatik küçültme yok, ölçüyü baştan vermek gerekiyor.
 */
function titleSize(len: number, format: OgFormat): number {
  const base = format === "square" ? 86 : 72;
  if (len > 90) return Math.round(base * 0.58);
  if (len > 60) return Math.round(base * 0.72);
  if (len > 38) return Math.round(base * 0.86);
  return base;
}

export function renderPostImage(
  post: Pick<SocialPostView, "title" | "excerpt" | "decoration" | "decorationSubtitle" | "gradient" | "publishedAt" | "kind">,
  format: OgFormat,
): ImageResponse {
  const { width, height } = SIZES[format];
  const isSquare = format === "square";
  const pad = isSquare ? 80 : 64;
  const decorationSize = isSquare ? 240 : 170;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundImage: gradientCss(post.gradient),
          color: "white",
          fontFamily: '"Inter", system-ui, sans-serif',
          padding: pad,
          position: "relative",
          textAlign: "center",
        }}
      >
        {/* Alt yarıyı koyulaştıran katman — beyaz metnin kontrastını garanti eder */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.45), transparent 65%)",
          }}
        />

        {post.decoration && (
          <div style={{ fontSize: decorationSize, lineHeight: 1, marginBottom: 20, display: "flex" }}>
            {post.decoration}
          </div>
        )}

        <div
          style={{
            fontSize: titleSize(post.title.length, format),
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -1,
            display: "flex",
            maxWidth: width - pad * 2,
            textShadow: "0 2px 20px rgba(0,0,0,0.25)",
          }}
        >
          {post.title}
        </div>

        {post.decorationSubtitle && (
          <div
            style={{
              fontSize: isSquare ? 40 : 32,
              fontWeight: 600,
              opacity: 0.92,
              marginTop: 20,
              display: "flex",
            }}
          >
            {post.decorationSubtitle}
          </div>
        )}

        {/* Alt şerit: marka + tarih */}
        <div
          style={{
            position: "absolute",
            bottom: pad * 0.7,
            left: pad,
            right: pad,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: isSquare ? 30 : 24,
            opacity: 0.9,
          }}
        >
          <div style={{ display: "flex", fontWeight: 800, letterSpacing: 3 }}>ERPIDE</div>
          <div style={{ display: "flex" }}>{formatDateTR(post.publishedAt)}</div>
        </div>
      </div>
    ),
    { width, height },
  );
}
