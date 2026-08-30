/**
 * Instagram paylaşımı — Instagram Content Publishing API (Meta Graph üzerinden).
 *
 * Kurulum:
 *  1. Instagram hesabı Business/Creator'a çevrilir.
 *  2. ERPIDE Facebook Sayfası'na bağlanır (bağlantı zorunlu — IG tek başına
 *     yayın yapamaz).
 *  3. Meta uygulamasına `instagram_content_publish` + `instagram_basic` +
 *     `pages_read_engagement` izinleri eklenir ve App Review'dan geçirilir.
 *  4. IG User ID (Page'e bağlı business account id) ve Page Access Token
 *     panele girilir.
 *
 * Yayın iki adımlıdır: önce medya "container" oluşturulur, hazır olduğunda
 * publish edilir. Görsel Meta tarafından URL'den indirilir — bu yüzden
 * herkese açık HTTPS bir adres ZORUNLUDUR (görselsiz IG post'u olamaz).
 *
 * Kota: 24 saatte 25 yayın. Bizim kullanımda sorun değil.
 */
import { apiJson, pollUntil } from "../http";
import { GRAPH_BASE } from "./facebook";
import { SocialPublishError, type PublishPayload, type PublishResult, type ResolvedCredentials, type SocialAdapter } from "../types";

/** Container hazırlığı için bekleme: 15 deneme × 2 sn ≈ 30 sn. */
const POLL_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2_000;

export const instagramAdapter: SocialAdapter = {
  platform: "instagram",
  setupHint:
    "Instagram hesabı Business olmalı ve Facebook Sayfası'na bağlı olmalı. IG User ID + Page Access Token gerekir.",

  async publish(payload: PublishPayload, creds: ResolvedCredentials): Promise<PublishResult> {
    const igUserId = creds.externalId;
    if (!igUserId) {
      throw new SocialPublishError("instagram", "Instagram hesap ID'si tanımlı değil", false);
    }
    if (!payload.imageUrl) {
      throw new SocialPublishError(
        "instagram",
        "Instagram görselsiz paylaşım kabul etmiyor — post'a görsel ekleyin",
        false,
      );
    }

    // 1) Medya container'ı oluştur.
    const createBody = new URLSearchParams({
      image_url: payload.imageUrl,
      caption: payload.text,
      access_token: creds.accessToken,
    });
    const created = await apiJson<{ id?: string }>("instagram", `${GRAPH_BASE}/${igUserId}/media`, {
      method: "POST",
      body: createBody,
    });
    const creationId = created.id;
    if (!creationId) throw new SocialPublishError("instagram", "medya container'ı oluşturulamadı");

    // 2) Container FINISHED olana kadar bekle. Meta görseli indirip işliyor;
    //    hazır olmadan publish çağrısı hata döner.
    const ready = await pollUntil(
      async () => {
        const st = await apiJson<{ status_code?: string; status?: string }>(
          "instagram",
          `${GRAPH_BASE}/${creationId}?fields=status_code,status&access_token=${encodeURIComponent(creds.accessToken)}`,
        );
        if (st.status_code === "FINISHED") return st;
        if (st.status_code === "ERROR" || st.status_code === "EXPIRED") {
          throw new SocialPublishError(
            "instagram",
            `görsel işlenemedi (${st.status_code}) — ${st.status || "görsel URL'i erişilebilir mi?"}`,
            false,
          );
        }
        return null;
      },
      { attempts: POLL_ATTEMPTS, intervalMs: POLL_INTERVAL_MS },
    );

    if (!ready) {
      throw new SocialPublishError("instagram", "görsel işleme zaman aşımına uğradı, tekrar deneyin");
    }

    // 3) Yayınla.
    const publishBody = new URLSearchParams({
      creation_id: creationId,
      access_token: creds.accessToken,
    });
    const published = await apiJson<{ id?: string }>(
      "instagram",
      `${GRAPH_BASE}/${igUserId}/media_publish`,
      { method: "POST", body: publishBody },
    );
    if (!published.id) throw new SocialPublishError("instagram", "yayın yanıtında media id yok");

    // 4) Permalink'i al — panelde "gönderiye git" linki için. Başarısız olursa
    //    yayın yine de gerçekleşmiştir, linki atlayıp devam ederiz.
    let permalink: string | undefined;
    try {
      const meta = await apiJson<{ permalink?: string }>(
        "instagram",
        `${GRAPH_BASE}/${published.id}?fields=permalink&access_token=${encodeURIComponent(creds.accessToken)}`,
      );
      permalink = meta.permalink;
    } catch {
      permalink = undefined;
    }

    return { externalId: published.id, externalUrl: permalink };
  },
};

/** Panel "Bağlantıyı test et" — hesabın okunabildiğini ve türünü doğrular. */
export async function verifyInstagram(
  creds: ResolvedCredentials,
): Promise<{ username: string; id: string }> {
  const igUserId = creds.externalId;
  if (!igUserId) throw new SocialPublishError("instagram", "Instagram hesap ID'si tanımlı değil", false);

  const res = await apiJson<{ id?: string; username?: string }>(
    "instagram",
    `${GRAPH_BASE}/${igUserId}?fields=id,username&access_token=${encodeURIComponent(creds.accessToken)}`,
  );
  if (!res.id) throw new SocialPublishError("instagram", "hesap bilgisi okunamadı", false);
  return { id: res.id, username: res.username || "instagram" };
}
