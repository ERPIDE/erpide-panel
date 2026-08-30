/**
 * Facebook Sayfa paylaşımı — Meta Graph API.
 *
 * Kurulum:
 *  1. ERPIDE Facebook Sayfası (Page) açılır.
 *  2. developers.facebook.com'da bir uygulama oluşturulur, "Facebook Login for
 *     Business" + Pages ürünleri eklenir.
 *  3. `pages_manage_posts` + `pages_read_engagement` izinleri App Review'dan
 *     geçirilir (yayın için zorunlu; geliştirici hesabında review'suz test
 *     edilebilir).
 *  4. Uzun ömürlü Page Access Token alınır ve panele girilir. Sayfa token'ları
 *     kullanıcı token'ından türetildiğinde süresiz olabilir; yine de
 *     tokenExpiresAt izlenir ve panelde uyarı gösterilir.
 *
 * Görsel varsa /photos, yoksa /feed uçları kullanılır. /photos görseli URL'den
 * kendisi çeker; bu yüzden imageUrl herkese açık HTTPS olmalıdır.
 */
import { apiJson } from "../http";
import { SocialPublishError, type PublishPayload, type PublishResult, type ResolvedCredentials, type SocialAdapter } from "../types";

export const GRAPH_VERSION = "v21.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

interface PhotoResponse {
  id?: string;
  post_id?: string;
}

interface FeedResponse {
  id?: string;
}

export const facebookAdapter: SocialAdapter = {
  platform: "facebook",
  setupHint:
    "Facebook Sayfası + Meta uygulaması gerekir. Sayfa ID'si ve uzun ömürlü Page Access Token'ı panele girin.",

  async publish(payload: PublishPayload, creds: ResolvedCredentials): Promise<PublishResult> {
    const pageId = creds.externalId;
    if (!pageId) {
      throw new SocialPublishError("facebook", "Sayfa ID'si tanımlı değil", false);
    }

    if (payload.imageUrl) {
      const body = new URLSearchParams({
        url: payload.imageUrl,
        caption: payload.text,
        access_token: creds.accessToken,
      });
      const res = await apiJson<PhotoResponse>("facebook", `${GRAPH_BASE}/${pageId}/photos`, {
        method: "POST",
        body,
      });
      // post_id "PAGEID_POSTID" biçiminde döner; fotoğraf id'si ondan farklıdır.
      const postId = res.post_id || res.id;
      if (!postId) throw new SocialPublishError("facebook", "yanıtta post id yok");
      return { externalId: postId, externalUrl: `https://www.facebook.com/${postId}` };
    }

    const body = new URLSearchParams({
      message: payload.text,
      access_token: creds.accessToken,
    });
    if (payload.linkUrl) body.set("link", payload.linkUrl);

    const res = await apiJson<FeedResponse>("facebook", `${GRAPH_BASE}/${pageId}/feed`, {
      method: "POST",
      body,
    });
    if (!res.id) throw new SocialPublishError("facebook", "yanıtta post id yok");
    return { externalId: res.id, externalUrl: `https://www.facebook.com/${res.id}` };
  },
};

/**
 * Token'ın hâlâ geçerli olduğunu ve sayfaya yazma yetkisi taşıdığını doğrular.
 * Panelde "Bağlantıyı test et" düğmesi bunu çağırır.
 */
export async function verifyFacebook(creds: ResolvedCredentials): Promise<{ name: string; id: string }> {
  const pageId = creds.externalId;
  if (!pageId) throw new SocialPublishError("facebook", "Sayfa ID'si tanımlı değil", false);

  const res = await apiJson<{ id?: string; name?: string; tasks?: string[] }>(
    "facebook",
    `${GRAPH_BASE}/${pageId}?fields=id,name,tasks&access_token=${encodeURIComponent(creds.accessToken)}`,
  );
  if (!res.id) throw new SocialPublishError("facebook", "sayfa bilgisi okunamadı", false);

  // tasks alanı Page token'larında gelir; CREATE_CONTENT yoksa paylaşım 403 döner.
  if (res.tasks && !res.tasks.includes("CREATE_CONTENT")) {
    throw new SocialPublishError(
      "facebook",
      "Token'da CREATE_CONTENT yetkisi yok — pages_manage_posts izni eksik",
      false,
    );
  }
  return { id: res.id, name: res.name || "Facebook Sayfası" };
}
