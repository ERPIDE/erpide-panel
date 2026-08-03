/**
 * Cloudflare R2 (S3-uyumlu) istemcisi — task ek dosyaları için.
 * Vercel Blob'dan taşındı: Hobby planında Blob "Advanced Operations" kotası
 * (2.000/ay) doluyor ve store bloke oluyordu. R2'nin ücretsiz kotası çok geniş.
 *
 * Gerekli env (Vercel production + .env.local):
 *   R2_ACCOUNT_ID         Cloudflare hesap ID'si (endpoint için)
 *   R2_ACCESS_KEY_ID      R2 API token — Access Key ID
 *   R2_SECRET_ACCESS_KEY  R2 API token — Secret Access Key
 *   R2_BUCKET             bucket adı (ör. erpide-files)
 *   R2_PUBLIC_URL         public erişim URL'i (ör. https://pub-xxxx.r2.dev veya files.erpide.com)
 */
import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || "";

export const R2_BUCKET = process.env.R2_BUCKET || "";
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

export const R2_CONFIGURED = Boolean(
  accountId &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    R2_BUCKET &&
    R2_PUBLIC_URL
);

export const r2 = R2_CONFIGURED
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    })
  : null;

/** Public URL'den R2 object key'ini çıkarır (silme için). */
export function keyFromPublicUrl(url: string): string | null {
  if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) return null;
  return url.slice(R2_PUBLIC_URL.length).replace(/^\/+/, "");
}
