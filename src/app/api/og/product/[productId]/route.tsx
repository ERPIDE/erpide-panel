import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/products";

/**
 * Per-product Open Graph image generator. Sosyal medya (Twitter, LinkedIn,
 * WhatsApp, Slack, Discord vb.) ürün link'i unfurl ettiğinde 1200×630
 * markalı kart döner: gradient ERPIDE rengi + ürün adı + tagline + kategori
 * rozeti. Statik `logoImage` PNG'sinden çok daha tıklatıcı.
 *
 * Edge runtime — soğuk başlangıç hızlı, fonts/CDN ağırlığı yok.
 * Cache: 1 saat sonra revalidate (ürün metadata değişirse OG güncellensin).
 *
 * Üretim: GET /api/og/product/<productId>
 */
export const runtime = "edge";

const SITE_URL = "https://www.erpide.com";

export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = getProduct(productId);

  if (!product || product.hiddenFromPublic) {
    return new Response("Not found", { status: 404 });
  }

  const categoryLabel: Record<string, string> = {
    web: "Web Uygulaması",
    mobile: "Mobil Uygulama",
    erp: "ERP Çözümü",
    api: "API / SDK",
    desktop: "Masaüstü",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#0a0a0f",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.18) 0%, transparent 50%), radial-gradient(circle at 85% 80%, rgba(236,72,153,0.18) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(139,92,246,0.14) 0%, transparent 60%)",
          color: "#f0f0f5",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Header: kategori rozeti + ERPIDE marka */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
              color: "white",
              padding: "12px 28px",
              borderRadius: 999,
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            {categoryLabel[product.category] ?? product.category}
          </div>
          <div style={{ display: "flex", alignItems: "center", color: "#9ca3af", fontSize: 28, fontWeight: 700 }}>
            ERPIDE
          </div>
        </div>

        {/* Body: ürün adı (büyük) + tagline */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 950 }}>
          <div style={{ fontSize: 96, fontWeight: 800, color: "#ffffff", lineHeight: 1.05, marginBottom: 24 }}>
            {product.name}
          </div>
          <div style={{ fontSize: 42, color: "#9ca3af", lineHeight: 1.25 }}>
            {product.tagline}
          </div>
        </div>

        {/* Footer: domain + 4-dilli marka */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", color: "#6b7280", fontSize: 22 }}>
          <div style={{ display: "flex" }}>{SITE_URL.replace("https://", "")}</div>
          <div style={{ display: "flex", gap: 16 }}>
            <span>TR</span>
            <span>EN</span>
            <span>RU</span>
            <span>KK</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
