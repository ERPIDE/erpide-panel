/**
 * Sosyal post deposu — hem admin composer'ın hem de public /gundem sayfasının
 * tek veri kaynağı.
 *
 * Gündem içeriği eskiden lib/news.ts içinde kod olarak duruyordu; oradaki NEWS
 * array'i artık yalnızca ilk çalıştırmada seed olarak okunur (ensureSeed).
 * Seed'den sonra tek gerçek kaynak SocialPost tablosudur — panelden yazılan
 * post deploy beklemeden yayına girer.
 */
import { getPrisma, HAS_DB } from "../db";
import { NEWS } from "../news";
import {
  isPlatform,
  type Platform,
  type PostKind,
  type PostStatus,
  type PublicationStatus,
  type PublicationView,
  type SocialPostView,
} from "./types";

// ── Serialize ─────────────────────────────────────────────────────

/** Prisma satırı — generate edilmiş tipe bağlanmamak için gevşek tutuluyor. */
interface PostRow {
  id: string;
  kind: string;
  title: string;
  excerpt: string;
  body: string;
  hashtags: unknown;
  linkUrl: string | null;
  imageUrl: string | null;
  imageAlt: string;
  imageMode: string;
  gradient: string | null;
  decoration: string | null;
  decorationSubtitle: string | null;
  imageBackground: string | null;
  slug: string | null;
  badges: unknown;
  productSlug: string | null;
  i18n: unknown;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  targets: unknown;
  source: string;
  sourceRef: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  publications?: PublicationRow[];
}

interface PublicationRow {
  platform: string;
  status: string;
  externalId: string | null;
  externalUrl: string | null;
  error: string | null;
  attempts: number;
  attemptedAt: Date | null;
  publishedAt: Date | null;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function asPlatforms(v: unknown): Platform[] {
  return Array.isArray(v) ? v.filter(isPlatform) : [];
}

export function serializePost(row: PostRow): SocialPostView {
  return {
    id: row.id,
    kind: row.kind as PostKind,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    hashtags: asStringArray(row.hashtags),
    linkUrl: row.linkUrl,
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    imageMode: row.imageMode === "upload" ? "upload" : "auto",
    gradient: row.gradient,
    decoration: row.decoration,
    decorationSubtitle: row.decorationSubtitle,
    imageBackground: row.imageBackground,
    slug: row.slug,
    badges: asStringArray(row.badges),
    productSlug: row.productSlug,
    i18n: (row.i18n as SocialPostView["i18n"]) ?? null,
    status: row.status as PostStatus,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    targets: asPlatforms(row.targets),
    source: row.source,
    sourceRef: row.sourceRef,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publications: (row.publications ?? []).map(serializePublication),
  };
}

function serializePublication(row: PublicationRow): PublicationView {
  return {
    platform: row.platform as Platform,
    status: row.status as PublicationStatus,
    externalId: row.externalId,
    externalUrl: row.externalUrl,
    error: row.error,
    attempts: row.attempts,
    attemptedAt: row.attemptedAt?.toISOString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

// ── Seed ──────────────────────────────────────────────────────────

// Tablo boş mu kontrolü instance başına bir kez yeter (auth.ts'teki
// ensureAdminSeed ile aynı kalıp) — her okumada fazladan sorgu atmayalım.
let seedChecked = false;

/**
 * Tablo boşsa lib/news.ts'teki 13 post'u yayınlanmış olarak aktarır.
 * Sonraki çalıştırmalarda hiçbir şey yapmaz — panelden silinen bir post
 * seed tarafından geri getirilmez.
 */
export async function ensureSeed(): Promise<void> {
  if (seedChecked) return;
  const prisma = getPrisma();
  const count = await prisma.socialPost.count();
  if (count === 0) {
    // createMany KULLANMA: Prisma çok satırlı yazımı transaction'a sarıyor ve
    // Neon HTTP adapter'ı transaction desteklemiyor ("Transactions are not
    // supported in HTTP mode") — seed sessizce düşüyordu. Satırları tek tek
    // yazıyoruz; upsert olması, iki lambda aynı anda seed etmeye kalkarsa
    // slug çakışmasını da önler.
    for (const p of NEWS) {
      const data = {
        slug: p.slug,
        kind: p.type,
        title: p.title,
        excerpt: p.excerpt,
        body: p.body,
        imageUrl: p.image,
        imageAlt: p.imageAlt,
        // Seed görselleri elle kürlenmiş (ürün ikonu, screenshot, OG rotası) —
        // otomatik üretime çevirmek mevcut kartların görünümünü bozardı.
        imageMode: "upload",
        gradient: p.gradient ?? null,
        decoration: p.decoration ?? null,
        decorationSubtitle: p.decorationSubtitle ?? null,
        imageBackground: p.imageBackground ?? null,
        badges: p.badges ?? [],
        productSlug: p.productSlug ?? null,
        i18n: p.i18n ?? undefined,
        status: "published",
        publishedAt: new Date(`${p.date}T09:00:00.000Z`),
        targets: ["site"],
        source: "seed",
      };
      await prisma.socialPost.upsert({
        where: { slug: p.slug },
        create: data as never,
        // Zaten varsa dokunma — panelden yapılmış düzenlemeler ezilmesin.
        update: {},
      });
    }
  }
  seedChecked = true;
}

// ── Okuma ─────────────────────────────────────────────────────────

const withPublications = { publications: true } as const;

/**
 * Seed verisinden okunabilir görünüm — DATABASE_URL yokken (yerel geliştirme)
 * veya DB'ye ulaşılamadığında Gündem boş sayfa göstermesin diye.
 * Halka açık sayfa, panelin erişilemez olmasından etkilenmemeli.
 */
function seedFallback(): SocialPostView[] {
  const now = new Date().toISOString();
  return NEWS.map((p) => ({
    id: p.id,
    kind: p.type as PostKind,
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    hashtags: [],
    linkUrl: null,
    imageUrl: p.image,
    imageAlt: p.imageAlt,
    imageMode: "upload" as const,
    gradient: p.gradient ?? null,
    decoration: p.decoration ?? null,
    decorationSubtitle: p.decorationSubtitle ?? null,
    imageBackground: p.imageBackground ?? null,
    slug: p.slug,
    badges: p.badges ?? [],
    productSlug: p.productSlug ?? null,
    i18n: (p.i18n as SocialPostView["i18n"]) ?? null,
    status: "published" as PostStatus,
    scheduledAt: null,
    publishedAt: new Date(`${p.date}T09:00:00.000Z`).toISOString(),
    targets: ["site"] as Platform[],
    source: "seed",
    sourceRef: null,
    createdBy: null,
    createdAt: now,
    updatedAt: now,
    publications: [],
  })).sort((a, b) => (a.publishedAt! < b.publishedAt! ? 1 : -1));
}

/** Public /gundem akışı — yalnızca yayınlanmış postlar, yeniden eskiye. */
export async function listPublished(): Promise<SocialPostView[]> {
  if (!HAS_DB) return seedFallback();
  try {
    await ensureSeed();
    const rows = (await getPrisma().socialPost.findMany({
      where: { status: "published", targets: { array_contains: ["site"] } },
      orderBy: { publishedAt: "desc" },
    })) as unknown as PostRow[];
    return rows.map(serializePost);
  } catch (e) {
    console.error("[social/store] listPublished başarısız, seed'e düşülüyor:", e);
    return seedFallback();
  }
}

/** Public /gundem/[slug] — yayınlanmamış post 404 vermeli. */
export async function getPublishedBySlug(slug: string): Promise<SocialPostView | null> {
  if (!HAS_DB) return seedFallback().find((p) => p.slug === slug) ?? null;
  try {
    await ensureSeed();
    const row = (await getPrisma().socialPost.findUnique({
      where: { slug },
    })) as unknown as PostRow | null;
    if (!row || row.status !== "published") return null;
    return serializePost(row);
  } catch (e) {
    console.error("[social/store] getPublishedBySlug başarısız, seed'e düşülüyor:", e);
    return seedFallback().find((p) => p.slug === slug) ?? null;
  }
}

/** Admin listesi — her durumdaki post, yayın sonuçlarıyla. */
export async function listAll(): Promise<SocialPostView[]> {
  await ensureSeed();
  const rows = (await getPrisma().socialPost.findMany({
    include: withPublications,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  })) as unknown as PostRow[];
  return rows.map(serializePost);
}

export async function getById(id: string): Promise<SocialPostView | null> {
  const row = (await getPrisma().socialPost.findUnique({
    where: { id },
    include: withPublications,
  })) as unknown as PostRow | null;
  return row ? serializePost(row) : null;
}

/** OG görseli slug veya id ile çağrılabilir (taslakların slug'ı olmayabilir). */
export async function getBySlugOrId(key: string): Promise<SocialPostView | null> {
  const fromSeed = () => seedFallback().find((p) => p.slug === key || p.id === key) ?? null;
  if (!HAS_DB) return fromSeed();
  try {
    // Görsel isteği, Gündem sayfasından önce gelebilir (sosyal platform görseli
    // kendi çekiyor); seed'i burada da garantiliyoruz, yoksa 404 dönerdi.
    await ensureSeed();
    const row = (await getPrisma().socialPost.findFirst({
      where: { OR: [{ slug: key }, { id: key }] },
    })) as unknown as PostRow | null;
    return row ? serializePost(row) : null;
  } catch (e) {
    console.error("[social/store] getBySlugOrId başarısız, seed'e düşülüyor:", e);
    return fromSeed();
  }
}

/** Aynı tatile ikinci kez otomatik taslak üretilmesin diye kullanılır. */
export async function existsBySource(source: string, sourceRef: string): Promise<boolean> {
  const n = await getPrisma().socialPost.count({ where: { source, sourceRef } });
  return n > 0;
}

/** Zamanı gelmiş, henüz yayınlanmamış postlar (cron). */
export async function listDueScheduled(now = new Date()): Promise<SocialPostView[]> {
  const rows = (await getPrisma().socialPost.findMany({
    where: { status: "scheduled", scheduledAt: { lte: now } },
    include: withPublications,
    orderBy: { scheduledAt: "asc" },
  })) as unknown as PostRow[];
  return rows.map(serializePost);
}

// ── Yazma ─────────────────────────────────────────────────────────

export interface PostInput {
  kind: PostKind;
  title: string;
  excerpt: string;
  body: string;
  hashtags: string[];
  linkUrl: string | null;
  imageUrl: string | null;
  imageAlt: string;
  imageMode: "auto" | "upload";
  gradient: string | null;
  decoration: string | null;
  decorationSubtitle: string | null;
  imageBackground: string | null;
  slug: string | null;
  badges: string[];
  productSlug: string | null;
  i18n: SocialPostView["i18n"];
  targets: Platform[];
  scheduledAt: Date | null;
  status: PostStatus;
  source?: string;
  sourceRef?: string | null;
  createdBy?: string | null;
}

export async function createPost(input: PostInput): Promise<SocialPostView> {
  const row = (await getPrisma().socialPost.create({
    data: {
      ...toData(input),
      source: input.source ?? "manual",
      sourceRef: input.sourceRef ?? null,
      createdBy: input.createdBy ?? null,
    } as never,
    include: withPublications,
  })) as unknown as PostRow;
  return serializePost(row);
}

export async function updatePost(id: string, input: Partial<PostInput>): Promise<SocialPostView> {
  const row = (await getPrisma().socialPost.update({
    where: { id },
    data: toData(input) as never,
    include: withPublications,
  })) as unknown as PostRow;
  return serializePost(row);
}

export async function deletePost(id: string): Promise<void> {
  await getPrisma().socialPost.delete({ where: { id } });
}

/** Partial input → Prisma data; undefined alanlar dokunulmaz. */
function toData(input: Partial<PostInput>): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  const copy = <K extends keyof PostInput>(k: K) => {
    if (input[k] !== undefined) d[k as string] = input[k];
  };

  copy("kind");
  copy("title");
  copy("excerpt");
  copy("body");
  copy("linkUrl");
  copy("imageUrl");
  copy("imageAlt");
  copy("imageMode");
  copy("gradient");
  copy("decoration");
  copy("decorationSubtitle");
  copy("imageBackground");
  copy("productSlug");
  copy("status");
  copy("scheduledAt");

  // Json sütunları: boş slug'ı null'a indir, dizileri her zaman dizi olarak yaz.
  if (input.hashtags !== undefined) d.hashtags = input.hashtags;
  if (input.badges !== undefined) d.badges = input.badges;
  if (input.targets !== undefined) d.targets = input.targets;
  if (input.i18n !== undefined) d.i18n = input.i18n ?? undefined;
  if (input.slug !== undefined) d.slug = input.slug?.trim() || null;

  return d;
}

/** Yayın motoru post durumunu ve publishedAt'i buradan günceller. */
export async function markPostStatus(
  id: string,
  status: PostStatus,
  publishedAt?: Date | null,
): Promise<void> {
  const data: Record<string, unknown> = { status };
  if (publishedAt !== undefined) data.publishedAt = publishedAt;
  await getPrisma().socialPost.update({ where: { id }, data: data as never });
}

// ── Slug ──────────────────────────────────────────────────────────

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

/** Başlıktan URL-güvenli slug üretir (Türkçe karakterler translitere edilir). */
export function slugify(title: string): string {
  return title
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR_MAP[c] ?? c)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Çakışma varsa sonuna -2, -3 ekleyerek boş slug bulur. */
export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const prisma = getPrisma();
  const root = slugify(base) || "post";
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const existing = (await prisma.socialPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })) as { id: string } | null;
    if (!existing || existing.id === excludeId) return candidate;
  }
  // 50 çakışma gerçekçi değil; yine de benzersizliği garantiye al.
  return `${root}-${Date.now()}`;
}
