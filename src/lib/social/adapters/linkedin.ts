/**
 * LinkedIn şirket sayfası paylaşımı — Posts API + Images API.
 *
 * Kurulum (dikkat: en uzun onay süreci burada):
 *  1. linkedin.com/developers'ta uygulama oluşturulur ve ERPIDE şirket
 *     sayfasıyla ilişkilendirilir (uygulamayı doğrulamak için sayfa yöneticisi
 *     onayı gerekir).
 *  2. Şirket sayfası adına paylaşım `w_organization_social` iznini gerektirir;
 *     bu izin **Community Management API** başvurusuyla verilir ve onay
 *     süreci haftalar sürebilir, reddedilebilir de. Kişisel profil paylaşımı
 *     (`w_member_social`) self-serve'dür — onay beklerken yedek kanaldır.
 *  3. OAuth ile alınan access token panele girilir. Token ~60 gün geçerlidir;
 *     refresh token 365 gün. tokenExpiresAt izlenir, panelde uyarı çıkar.
 *
 * Organizasyon kimliği `urn:li:organization:{id}` biçimindedir; panele sadece
 * sayısal id girilmesi yeterli, URN burada kurulur.
 */
import { apiFetch, apiJson, extractErrorMessage } from "../http";
import { SocialPublishError, type PublishPayload, type PublishResult, type ResolvedCredentials, type SocialAdapter } from "../types";

const API_BASE = "https://api.linkedin.com/rest";

/**
 * LinkedIn sürüm başlığı (YYYYMM). LinkedIn eski sürümleri periyodik olarak
 * kapatır; env ile güncellenebilir olsun ki kod değiştirmeden yükseltelim.
 */
const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION || "202409";

function headers(token: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "LinkedIn-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  };
}

/** Sayısal id veya tam URN kabul eder, her hâlükârda URN döndürür. */
export function organizationUrn(externalId: string): string {
  return externalId.startsWith("urn:") ? externalId : `urn:li:organization:${externalId}`;
}

/**
 * Posts API `commentary` alanı "little text" biçimindedir: bazı noktalama
 * karakterleri ters bölü ile kaçırılmalıdır, yoksa istek 422 döner.
 *
 * `#` ve `@` bilinçli olarak kaçırılmaz — hashtag ve mention için anlamlıdır.
 * Canlı testte davranış doğrulanacak (Faz 3).
 */
export function escapeCommentary(text: string): string {
  return text.replace(/[\\|{}[\]()<>*_~]/g, (c) => `\\${c}`);
}

export const linkedinAdapter: SocialAdapter = {
  platform: "linkedin",
  setupHint:
    "LinkedIn uygulaması + şirket sayfası yöneticiliği gerekir. w_organization_social izni Community Management API başvurusuna tabidir.",

  async publish(payload: PublishPayload, creds: ResolvedCredentials): Promise<PublishResult> {
    if (!creds.externalId) {
      throw new SocialPublishError("linkedin", "Şirket sayfası ID'si tanımlı değil", false);
    }
    const author = organizationUrn(creds.externalId);

    // Görsel varsa önce LinkedIn'e yüklenir; LinkedIn dış URL'den görsel
    // çekmez (Meta'dan farkı bu), binary'i biz göndeririz.
    let imageUrn: string | null = null;
    if (payload.imageUrl) {
      imageUrn = await uploadImage(payload.imageUrl, author, creds.accessToken);
    }

    const body: Record<string, unknown> = {
      author,
      commentary: escapeCommentary(payload.text),
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    if (imageUrn) {
      body.content = {
        media: {
          id: imageUrn,
          altText: payload.title.slice(0, 200),
        },
      };
    }

    const res = await apiFetch("linkedin", `${API_BASE}/posts`, {
      method: "POST",
      headers: headers(creds.accessToken, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new SocialPublishError(
        "linkedin",
        `${res.status} — ${extractErrorMessage(text)}`,
        res.status >= 500 || res.status === 429,
      );
    }

    // Post URN gövdede değil, x-restli-id başlığında döner.
    const urn = res.headers.get("x-restli-id") || res.headers.get("x-linkedin-id");
    if (!urn) {
      throw new SocialPublishError("linkedin", "yanıtta post kimliği (x-restli-id) yok");
    }

    return {
      externalId: urn,
      externalUrl: `https://www.linkedin.com/feed/update/${urn}/`,
    };
  },
};

/**
 * Görseli LinkedIn'e yükler ve `urn:li:image:...` döndürür.
 * Üç adım: upload URL al → binary'i PUT et → URN'i kullan.
 */
async function uploadImage(imageUrl: string, owner: string, token: string): Promise<string> {
  // 1) Kendi görselimizi indir.
  const imgRes = await apiFetch("linkedin", imageUrl);
  if (!imgRes.ok) {
    throw new SocialPublishError("linkedin", `görsel indirilemedi (${imgRes.status}): ${imageUrl}`, false);
  }
  const bytes = await imgRes.arrayBuffer();

  // 2) Yükleme adresi iste.
  const init = await apiJson<{ value?: { uploadUrl?: string; image?: string } }>(
    "linkedin",
    `${API_BASE}/images?action=initializeUpload`,
    {
      method: "POST",
      headers: headers(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ initializeUploadRequest: { owner } }),
    },
  );

  const uploadUrl = init.value?.uploadUrl;
  const imageUrn = init.value?.image;
  if (!uploadUrl || !imageUrn) {
    throw new SocialPublishError("linkedin", "görsel yükleme adresi alınamadı");
  }

  // 3) Binary'i yükle.
  const put = await apiFetch("linkedin", uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: bytes,
    timeoutMs: 60_000,
  });
  if (!put.ok) {
    throw new SocialPublishError(
      "linkedin",
      `görsel yüklenemedi (${put.status}) — ${extractErrorMessage(await put.text())}`,
    );
  }

  return imageUrn;
}

/** Panel "Bağlantıyı test et" — sayfa adını okuyarak token+yetkiyi doğrular. */
export async function verifyLinkedIn(
  creds: ResolvedCredentials,
): Promise<{ name: string; id: string }> {
  if (!creds.externalId) {
    throw new SocialPublishError("linkedin", "Şirket sayfası ID'si tanımlı değil", false);
  }
  const urn = organizationUrn(creds.externalId);
  const numericId = urn.split(":").pop();

  const res = await apiJson<{ localizedName?: string; id?: number }>(
    "linkedin",
    `${API_BASE}/organizations/${numericId}`,
    { headers: headers(creds.accessToken) },
  );

  return {
    id: String(res.id ?? numericId),
    name: res.localizedName || "LinkedIn şirket sayfası",
  };
}
