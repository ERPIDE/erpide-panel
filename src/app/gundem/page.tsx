/**
 * Gündem akışı — içerik DB'den (SocialPost tablosu) okunur.
 *
 * Eskiden lib/news.ts'teki statik array'i render eden bir client component'ti;
 * her yeni post bir deploy gerektiriyordu. Artık panelden yayınlanan post
 * revalidate süresi içinde (veya yayın anındaki revalidatePath çağrısıyla
 * hemen) burada görünür.
 */
import GundemFeed from "@/components/gundem/GundemFeed";
import { listPublished } from "@/lib/social/store";

// Yayın API'si revalidatePath ile anında tazeler; bu süre yalnızca emniyet ağı.
export const revalidate = 300;

export default async function GundemPage() {
  const posts = await listPublished();
  return <GundemFeed posts={posts} />;
}
