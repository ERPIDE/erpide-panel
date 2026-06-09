/**
 * Lisans servisi cache invalidation — panel master kaynağı; yenileme/iptal/yeni
 * satın alma sonrası diğer ürünlere (FinansERPIDE vb.) "kullanıcının state'i
 * değişti, cache'ini at" webhook'u atar.
 *
 * Akış:
 *   Panel order yarat/iptal/renew → updateOrder → invalidateRemoteLicenseCache(email)
 *   → POST {productUrl}/api/internal/license-cache-invalidate { email }
 *   → FinansERPIDE alır → invalidateLicenseCache(email) (in-process cache temizle)
 *   → kullanıcı bir sonraki request'inde panel'den fresh state çeker
 *
 * Best-effort: hata olursa fail etmez, cache 5dk TTL ile zaten expire olur.
 * Sadece "instant feedback" için var — kullanıcı satın aldıktan saniyeler sonra
 * modülün açılmış olmasını bekler.
 */

interface ProductTarget {
  /** Ürün adı (log için) */
  name: string;
  /** Webhook URL (örn https://finans.erpide.com/api/internal/license-cache-invalidate) */
  url: string;
}

function getTargets(): ProductTarget[] {
  return [
    {
      name: "FinansERPIDE",
      url: process.env.FINANSERPIDE_INVALIDATE_URL || "https://finans.erpide.com/api/internal/license-cache-invalidate",
    },
    // Yeni ürün eklendikçe buraya eklenir (CaptchaERPIDE, PocketERPIDE, ...).
  ];
}

export async function invalidateRemoteLicenseCache(email: string): Promise<void> {
  const secret = process.env.LICENSE_SERVICE_SECRET;
  if (!secret) {
    console.warn("[license-invalidate] LICENSE_SERVICE_SECRET tanımlı değil — invalidation atlandı");
    return;
  }

  const targets = getTargets();
  const key = email.toLowerCase();

  // Paralel POST — bir ürün yavaş olsa diğerlerini bloklamasın
  await Promise.allSettled(
    targets.map(async (t) => {
      try {
        const r = await fetch(t.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-license-secret": secret,
          },
          body: JSON.stringify({ email: key }),
          // 5sn timeout — best effort
          signal: AbortSignal.timeout(5000),
        });
        if (!r.ok) {
          console.warn(`[license-invalidate] ${t.name} HTTP ${r.status}`);
        }
      } catch (e) {
        console.warn(`[license-invalidate] ${t.name} error:`, e instanceof Error ? e.message : e);
      }
    })
  );
}
