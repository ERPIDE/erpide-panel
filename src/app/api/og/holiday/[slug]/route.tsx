/**
 * /api/og/holiday/[slug] — eski özel gün görseli adresi.
 *
 * Gündem içeriği lib/news.ts'ten DB'ye taşındığında görsel üretimi
 * /api/og/post/[key] altında birleşti. Bu yol, seed edilmiş post'ların
 * `imageUrl` alanında ve dışarıda paylaşılmış OG etiketlerinde yazılı
 * olduğu için korunuyor: aynı görseli üretir, yeni koda delege eder.
 */
import { getBySlugOrId } from "@/lib/social/store";
import { parseFormat, renderPostImage } from "@/lib/social/og-image";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const post = await getBySlugOrId(slug);

  if (!post) return new Response("Not found", { status: 404 });

  const format = parseFormat(new URL(req.url).searchParams.get("format"));
  return renderPostImage(post, format);
}
