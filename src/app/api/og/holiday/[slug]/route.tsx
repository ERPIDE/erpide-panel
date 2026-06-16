import { ImageResponse } from "next/og";
import { getNewsPost } from "@/lib/news";

// Edge runtime — ImageResponse PNG'i her isteğin başında hızlı render etsin,
// Vercel CDN'i sonuçları cache'ler. revalidate yok; içerik news.ts'ten
// türetildiği için deploy ile invalidate olur.
export const runtime = "edge";

const SITE_URL = "https://www.erpide.com";

function formatDateTR(iso: string): string {
  // Edge runtime'da Intl ağır gelebilir — manuel TR ay isimleri kullan.
  const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const post = getNewsPost(slug);

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  // Tailwind gradient class adlarını ham CSS'e map et (ImageResponse
  // Tailwind anlamıyor). Sadece kullandığımız renkler.
  const gradientCss = mapGradientToCss(post.gradient || "from-blue-600 to-purple-600");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: gradientCss,
          color: "white",
          fontFamily: '"Inter", system-ui, sans-serif',
          padding: 60,
          position: "relative",
        }}
      >
        {/* Hafif overlay (alt yarıdan koyu) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.35), transparent 60%)",
          }}
        />

        {/* Dekoratif emoji */}
        {post.decoration && (
          <div style={{ fontSize: 220, lineHeight: 1, marginBottom: 24, display: "flex" }}>
            {post.decoration}
          </div>
        )}

        {/* Alt başlık (genelde başka dil veya kısa etiket) */}
        {post.decorationSubtitle && (
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              opacity: 0.95,
              textAlign: "center",
              marginBottom: 16,
              display: "flex",
            }}
          >
            {post.decorationSubtitle}
          </div>
        )}

        {/* Tarih + ERPIDE alt logosu */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 60,
            right: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            opacity: 0.85,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 700, letterSpacing: 2 }}>ERPIDE</span>
          </div>
          <div style={{ display: "flex" }}>{formatDateTR(post.date)}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

/**
 * Tailwind gradient sınıflarını manuel CSS gradient'a map et. Sadece news.ts'de
 * kullandığımız özel gün gradient'ları desteklenir. Gerekirse genişlet.
 */
function mapGradientToCss(twClass: string): string {
  const map: Record<string, string> = {
    "from-sky-600 via-yellow-500 to-sky-700":
      "linear-gradient(135deg, #0284c7 0%, #eab308 50%, #0369a1 100%)",
    "from-indigo-600 via-purple-600 to-pink-600":
      "linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #db2777 100%)",
    "from-pink-500 via-rose-500 to-purple-600":
      "linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #9333ea 100%)",
    "from-emerald-600 via-amber-500 to-orange-600":
      "linear-gradient(135deg, #059669 0%, #f59e0b 50%, #ea580c 100%)",
    "from-red-600 via-amber-400 to-red-700":
      "linear-gradient(135deg, #dc2626 0%, #fbbf24 50%, #b91c1c 100%)",
    "from-red-700 to-red-900":
      "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
    "from-blue-600 to-purple-600":
      "linear-gradient(135deg, #2563eb 0%, #9333ea 100%)",
  };
  return map[twClass] || "linear-gradient(135deg, #2563eb 0%, #9333ea 100%)";
}
