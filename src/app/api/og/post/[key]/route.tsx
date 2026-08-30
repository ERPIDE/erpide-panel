/**
 * /api/og/post/[key]?format=square|landscape
 *
 * Post görselini üretir. `key` slug veya post id olabilir — henüz slug'ı
 * olmayan taslakların panelde önizlenebilmesi için ikisi de kabul edilir.
 *
 * Taslak/zamanlanmış postlar da render edilir (önizleme gerekli). Görsel
 * herkese açık olmalı: Instagram ve Facebook görseli kendi sunucularına bu
 * adresten indiriyor.
 *
 * Runtime nodejs — Prisma üzerinden DB okuyoruz.
 */
import { getBySlugOrId } from "@/lib/social/store";
import { parseFormat, renderPostImage } from "@/lib/social/og-image";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ key: string }> },
) {
  const { key } = await context.params;
  const post = await getBySlugOrId(key);

  if (!post) return new Response("Not found", { status: 404 });

  const format = parseFormat(new URL(req.url).searchParams.get("format"));
  return renderPostImage(post, format);
}
