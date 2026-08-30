/**
 * Sosyal platform token'ları için simetrik şifreleme (AES-256-GCM).
 *
 * Facebook Page token'ı ile ERPIDE sayfasına post atılabilir; DB dump'ı
 * sızarsa token düz metin durmasın. Şifreli değerler `enc:v1:` ön ekiyle
 * saklanır — ön eki olmayan bir değer eski/manuel girilmiş düz token sayılır
 * ve olduğu gibi döndürülür (geriye uyumluluk).
 *
 * Anahtar: SOCIAL_TOKEN_KEY env'i. Tercihen 32 byte'lık hex (64 karakter) veya
 * base64. Serbest metin verilirse scrypt ile 32 byte'a türetilir.
 *
 * Anahtar üretmek için:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const PREFIX = "enc:v1:";
const SALT = "erpide-social-token";

export const HAS_TOKEN_KEY = !!process.env.SOCIAL_TOKEN_KEY;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.SOCIAL_TOKEN_KEY;
  if (!raw) {
    throw new Error(
      "SOCIAL_TOKEN_KEY tanımlı değil — sosyal medya token'ı şifrelenemez. " +
        "32 byte'lık hex bir anahtar üretip env'e ekleyin.",
    );
  }

  // 64 karakterlik hex → doğrudan 32 byte anahtar.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    cachedKey = Buffer.from(raw, "hex");
    return cachedKey;
  }

  // Base64 ile tam 32 byte çözülüyorsa onu kullan.
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) {
    cachedKey = b64;
    return cachedKey;
  }

  // Aksi halde parola gibi davran ve türet.
  cachedKey = scryptSync(raw, SALT, 32);
  return cachedKey;
}

/** Düz token → `enc:v1:<iv>:<tag>:<ciphertext>` (hepsi base64url). */
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${ct.toString("base64url")}`;
}

/**
 * Şifreli değeri çözer. Ön eki yoksa düz metin kabul edip aynen döndürür.
 * Çözme başarısızsa (anahtar değişmiş, veri bozulmuş) null döner — çağıran
 * bunu "bağlantı bozuk, yeniden bağla" olarak raporlamalı.
 */
export function decryptToken(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored;

  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return null;

  try {
    const [ivB64, tagB64, ctB64] = parts;
    const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB64, "base64url")),
      decipher.final(),
    ]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}

/** Panelde gösterim için maskeler: "EAAB…7f2Q" */
export function maskToken(plain: string | null): string | null {
  if (!plain) return null;
  if (plain.length <= 12) return "••••";
  return `${plain.slice(0, 4)}…${plain.slice(-4)}`;
}
