/**
 * Sosyal yayın modülü — ortak tipler.
 *
 * Tek bir post, birden çok platforma gider. Platform farkları adapter'ların
 * içinde kalır; bu dosya yalnızca aradaki sözleşmeyi tanımlar.
 */

export const PLATFORMS = ["site", "facebook", "instagram", "linkedin"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  site: "erpide.com Gündem",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

/** Dış platformlar — bağlantı/token gerektirenler. "site" bunlardan değil. */
export const EXTERNAL_PLATFORMS = ["facebook", "instagram", "linkedin"] as const;
export type ExternalPlatform = (typeof EXTERNAL_PLATFORMS)[number];

export function isPlatform(v: unknown): v is Platform {
  return typeof v === "string" && (PLATFORMS as readonly string[]).includes(v);
}

export function isExternalPlatform(v: unknown): v is ExternalPlatform {
  return typeof v === "string" && (EXTERNAL_PLATFORMS as readonly string[]).includes(v);
}

// ── Post ──────────────────────────────────────────────────────────

export type PostKind = "product-launch" | "special-day" | "milestone";
export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "partial" | "failed";
export type PublicationStatus = "pending" | "success" | "failed" | "skipped";

export interface PostI18nFields {
  title?: string;
  excerpt?: string;
  body?: string;
}

/** Panel ve yayın motorunun paylaştığı post görünümü (DB satırının serialize hali). */
export interface SocialPostView {
  id: string;
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
  i18n: Partial<Record<string, PostI18nFields>> | null;

  status: PostStatus;
  /** ISO datetime */
  scheduledAt: string | null;
  publishedAt: string | null;
  targets: Platform[];

  source: string;
  sourceRef: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;

  publications: PublicationView[];
}

export interface PublicationView {
  platform: Platform;
  status: PublicationStatus;
  externalId: string | null;
  externalUrl: string | null;
  error: string | null;
  attempts: number;
  attemptedAt: string | null;
  publishedAt: string | null;
}

// ── Adapter sözleşmesi ────────────────────────────────────────────

/** Adapter'a giden hazır içerik. Metin platforma göre compose.ts'te uyarlanır. */
export interface PublishPayload {
  /** Platform için uyarlanmış tam caption/gövde. */
  text: string;
  /** Mutlak, herkese açık HTTPS görsel URL'i. Instagram için ZORUNLU. */
  imageUrl: string | null;
  /** Paylaşıma iliştirilecek link (LinkedIn/Facebook). */
  linkUrl: string | null;
  title: string;
}

export interface SocialAccountView {
  platform: ExternalPlatform;
  displayName: string | null;
  externalId: string | null;
  connected: boolean;
  tokenExpiresAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  /** Token'ın kendisi ASLA dışarı verilmez; yalnızca varlığı bildirilir. */
  hasToken: boolean;
}

/** Adapter'ın ihtiyaç duyduğu çözülmüş (decrypt edilmiş) kimlik bilgileri. */
export interface ResolvedCredentials {
  accessToken: string;
  externalId: string | null;
  meta: Record<string, unknown> | null;
}

export interface PublishResult {
  externalId?: string;
  externalUrl?: string;
}

export interface SocialAdapter {
  platform: ExternalPlatform;
  /** İnsan okunur kurulum ipucu — panelde "bağlı değil" durumunda gösterilir. */
  setupHint: string;
  publish(payload: PublishPayload, creds: ResolvedCredentials): Promise<PublishResult>;
}

/**
 * Adapter'ların fırlattığı, kullanıcıya gösterilebilir hata. Platform API'leri
 * dev JSON gövdeleri döner; bunu panelde tek satır olarak okunur hale getirir.
 */
export class SocialPublishError extends Error {
  readonly platform: Platform;
  readonly retryable: boolean;

  constructor(platform: Platform, message: string, retryable = true) {
    super(message);
    this.name = "SocialPublishError";
    this.platform = platform;
    this.retryable = retryable;
  }
}
