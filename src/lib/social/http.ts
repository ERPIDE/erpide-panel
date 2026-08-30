/**
 * Sosyal platform API'lerine ortak HTTP yardımcıları.
 *
 * Meta ve LinkedIn hataları çok farklı gövdelerde döner (Meta: {error:{message}},
 * LinkedIn: {message} veya düz metin). Panelde tek satır okunur hata görmek
 * için hepsini burada normalize ediyoruz.
 */
import { SocialPublishError, type Platform } from "./types";

/** Platform API'si beklenenden uzun sürerse istek asılı kalmasın. */
const DEFAULT_TIMEOUT_MS = 30_000;

export async function apiFetch(
  platform: Platform,
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError"
      ? `İstek ${Math.round(timeoutMs / 1000)} saniyede yanıtlanmadı`
      : e instanceof Error ? e.message : "ağ hatası";
    throw new SocialPublishError(platform, msg);
  } finally {
    clearTimeout(timer);
  }
}

/** JSON bekleyen çağrı — hata gövdesini okunur mesaja çevirir. */
export async function apiJson<T = unknown>(
  platform: Platform,
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const res = await apiFetch(platform, url, init);
  const text = await res.text();

  if (!res.ok) {
    throw new SocialPublishError(
      platform,
      `${res.status} — ${extractErrorMessage(text)}`,
      // 4xx genelde kalıcı (yetki/geçersiz alan); 429 ve 5xx tekrar denenebilir.
      res.status >= 500 || res.status === 429,
    );
  }

  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new SocialPublishError(platform, "yanıt JSON olarak okunamadı");
  }
}

/**
 * Meta / LinkedIn hata gövdesinden insan okunur mesaj çıkarır.
 * Tanınmayan biçimde gövdeyi kırpıp döndürür — sessiz kalmaktan iyidir.
 */
export function extractErrorMessage(body: string): string {
  if (!body) return "boş yanıt";
  try {
    const j = JSON.parse(body) as {
      error?: { message?: string; error_user_msg?: string } | string;
      message?: string;
      error_description?: string;
    };
    if (typeof j.error === "object" && j.error) {
      return j.error.error_user_msg || j.error.message || JSON.stringify(j.error).slice(0, 300);
    }
    if (typeof j.error === "string") return j.error_description || j.error;
    if (j.message) return j.message;
  } catch {
    // JSON değil — düz metin.
  }
  return body.replace(/\s+/g, " ").slice(0, 300);
}

/** Sabit aralıklarla bir koşulu bekler (Instagram container hazırlığı için). */
export async function pollUntil<T>(
  fn: () => Promise<T | null>,
  { attempts, intervalMs }: { attempts: number; intervalMs: number },
): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    const result = await fn();
    if (result !== null) return result;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}
