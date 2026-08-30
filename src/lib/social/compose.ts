/**
 * Tek post → platforma uyarlanmış metin.
 *
 * Aynı içeriği dört yere aynen basmak kötü sonuç veriyor: LinkedIn'de emoji
 * yığını amatör duruyor, Instagram'da link tıklanmıyor, Facebook'ta uzun
 * gövde "devamını gör" arkasında kayboluyor. Bu dosya farkı tek yerde tutar.
 *
 * Metinler kırpılırken kelime ortasından kesilmez; limit aşılırsa son tam
 * cümle/kelimeden sonra "…" eklenir.
 */
import type { Platform, PublishPayload, SocialPostView } from "./types";

export const SITE_URL = "https://www.erpide.com";

/** Platform karakter limitleri (güvenli taraf — API'lerin sert limiti daha yüksek). */
const LIMITS: Record<Platform, number> = {
  site: 100_000,
  facebook: 5_000,
  instagram: 2_200,
  linkedin: 3_000,
};

/** Instagram'ın caption başına izin verdiği azami hashtag sayısı. */
const IG_MAX_HASHTAGS = 30;

/** Post'un erpide.com'daki kalıcı adresi (slug yoksa null). */
export function canonicalUrl(post: Pick<SocialPostView, "slug">): string | null {
  return post.slug ? `${SITE_URL}/gundem/${post.slug}` : null;
}

/** Paylaşıma iliştirilecek link: açık CTA varsa o, yoksa Gündem adresi. */
export function resolveLink(post: SocialPostView): string | null {
  return post.linkUrl?.trim() || canonicalUrl(post);
}

/** "#" olmadan saklanan etiketleri "#erpide" biçimine getirir. */
function formatHashtags(tags: string[], max = Infinity): string {
  return tags
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .slice(0, max)
    .map((t) => `#${t}`)
    .join(" ");
}

/** Markdown-lite gövdeyi düz metne indirger — sosyal platformlar ** anlamaz. */
function stripMarkdown(body: string): string {
  return body
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^- /gm, "• ")
    .trim();
}

/** Kelime sınırında kırpar, gerekirse "…" ekler. */
function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit - 1);
  const cut = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(" "));
  return `${(cut > limit * 0.6 ? slice.slice(0, cut) : slice).trimEnd()}…`;
}

/** Boş parçaları atlayıp blokları çift satır aralığıyla birleştirir. */
function join(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => p?.trim())
    .filter((p): p is string => !!p)
    .join("\n\n");
}

/**
 * Platform için gönderilecek metni üretir.
 *
 * - linkedin: başlık + tam gövde + link + etiketler (kurumsal, uzun form)
 * - facebook: başlık + özet + link + etiketler (orta form)
 * - instagram: başlık + özet + etiketler; link tıklanamadığı için ayrı satırda
 *   düz metin olarak verilir
 * - site: gövdenin kendisi zaten sayfada render edilir, metin üretimi yok
 */
export function composeText(post: SocialPostView, platform: Platform): string {
  const link = resolveLink(post);
  const body = stripMarkdown(post.body);

  switch (platform) {
    case "linkedin":
      return truncate(
        join([post.title, body || post.excerpt, link, formatHashtags(post.hashtags)]),
        LIMITS.linkedin,
      );

    case "facebook":
      return truncate(
        join([post.title, post.excerpt, link, formatHashtags(post.hashtags)]),
        LIMITS.facebook,
      );

    case "instagram":
      return truncate(
        join([
          post.title,
          post.excerpt,
          link ? `Detaylar: ${link}` : null,
          formatHashtags(post.hashtags, IG_MAX_HASHTAGS),
        ]),
        LIMITS.instagram,
      );

    case "site":
      return join([post.excerpt, body]);
  }
}

/**
 * Post + platform → adapter'a verilecek payload.
 *
 * imageUrl mutlak HTTPS olmalı: Instagram görseli kendi sunucusuna çekiyor,
 * göreli yol veya localhost adresi sessizce başarısız oluyor.
 */
export function buildPayload(
  post: SocialPostView,
  platform: Platform,
  imageUrl: string | null,
): PublishPayload {
  return {
    text: composeText(post, platform),
    imageUrl: imageUrl ? absoluteUrl(imageUrl) : null,
    linkUrl: resolveLink(post),
    title: post.title,
  };
}

/** Göreli yolu ("/api/og/...") mutlak erpide.com adresine çevirir. */
export function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Yayın görselinin adresi. imageMode "auto" ise OG üreticisine düşer —
 * slug yoksa (henüz Gündem'e yazılmamış taslak) id ile çağrılır.
 */
export function resolveImageUrl(post: SocialPostView): string | null {
  if (post.imageMode === "upload") return post.imageUrl;
  if (post.imageUrl) return post.imageUrl;
  return `/api/og/post/${post.slug || post.id}`;
}
