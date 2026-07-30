/**
 * ERPIDE SSO — panel (erpide.com) kimlik saglayici, urunler (finans.erpide.com)
 * tuketici.
 *
 * Musteri erpide.com'da uye olur, urunu satin alir ve ayni hesapla urune girer.
 * Urun tarafinda IKINCI BIR SIFRE YOKTUR — kimligin tek kaynagi panel'dir.
 *
 * Token: base64url(JSON payload) + "." + HMAC-SHA256(secret, "sso:v1:" + body)
 *
 * Neden ayri bir amac etiketi ("sso:v1:"): LICENSE_SERVICE_SECRET ayni zamanda
 * lisans sorgulamada kullaniliyor. Etiket olmadan bir baglamda uretilen imza
 * digerinde gecerli sayilabilirdi (cross-protocol reuse).
 *
 * Omur 120 sn ve jti tek kullanimliktir — token URL'de gidiyor, tarayici
 * gecmisine/loglara dusebilir; calinsa bile pencere kapali olur.
 */
import { createHmac, randomUUID, timingSafeEqual } from "crypto";

export const SSO_TTL_MS = 120_000;

export interface SsoPayload {
  /** e-posta — urun tarafinda kimligin ve lisansin anahtari */
  e: string;
  /** ad */
  n?: string;
  /** soyad */
  s?: string;
  /** telefon */
  p?: string;
  /** sirket unvani — urun tarafinda ilk kurulum formunu on-doldurur */
  co?: string;
  /** vergi/TC no */
  vkn?: string;
  /** adres */
  ad?: string;
  /** il */
  ci?: string;
  /** son gecerlilik (unix ms) */
  exp: number;
  /** tek kullanimlik id — replay engeli */
  jti: string;
}

function secret(): string {
  const s = process.env.LICENSE_SERVICE_SECRET;
  if (!s) throw new Error("LICENSE_SERVICE_SECRET tanimli degil — SSO calisamaz");
  return s;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(`sso:v1:${body}`).digest("hex");
}

export function createSsoToken(input: {
  email: string;
  name?: string;
  surname?: string;
  phone?: string;
  companyName?: string;
  taxNumber?: string;
  address?: string;
  city?: string;
}): string {
  const payload: SsoPayload = {
    e: input.email.toLowerCase().trim(),
    n: input.name,
    s: input.surname,
    p: input.phone,
    co: input.companyName,
    vkn: input.taxNumber,
    ad: input.address,
    ci: input.city,
    exp: Date.now() + SSO_TTL_MS,
    jti: randomUUID(),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Panel tarafinda da dogrulama gerekebilir (test/geri donus akislari). */
export function verifySsoToken(token: string): SsoPayload | null {
  const [body, mac] = (token || "").split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SsoPayload;
    if (!payload.e || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
