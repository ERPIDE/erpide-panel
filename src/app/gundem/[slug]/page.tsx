/**
 * Gündem post detayı — DB'den okunur, komşu yazılar aynı sorgudan türetilir.
 * Yayınlanmamış (taslak/zamanlanmış) post 404 döner.
 */
import { notFound } from "next/navigation";
import GundemDetail, { type GundemNeighbor } from "@/components/gundem/GundemDetail";
import { getPublishedBySlug, listPublished } from "@/lib/social/store";

export const revalidate = 300;

function toNeighbor(p: Awaited<ReturnType<typeof listPublished>>[number]): GundemNeighbor {
  return { slug: p.slug, title: p.title, excerpt: p.excerpt, body: p.body, i18n: p.i18n };
}

export default async function GundemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBySlug(slug);
  if (!post) notFound();

  // Komşular yayın sırasına göre: liste yeniden eskiye sıralı olduğu için
  // önceki index daha yeni, sonraki index daha eski yazıdır.
  const all = await listPublished();
  const idx = all.findIndex((p) => p.id === post.id);
  const prev = idx > 0 ? toNeighbor(all[idx - 1]) : null;
  const next = idx >= 0 && idx < all.length - 1 ? toNeighbor(all[idx + 1]) : null;

  return <GundemDetail post={post} prev={prev} next={next} />;
}
