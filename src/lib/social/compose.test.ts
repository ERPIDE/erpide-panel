/**
 * compose.ts + store.ts saf fonksiyonlarının testleri.
 *
 * Bu mantık yayın anında sessizce yanlış çalışırsa hata sosyal medyada
 * görünür — geri alınamaz. Çalıştırmak için: npm run test:social
 */
import assert from "node:assert/strict";
import { composeText, canonicalUrl, resolveLink, absoluteUrl, resolveImageUrl } from "./compose";
import { slugify } from "./store";
import { escapeCommentary, organizationUrn } from "./adapters/linkedin";
import { encryptToken, decryptToken } from "./crypto";
import type { SocialPostView } from "./types";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`✗ ${name}`);
    throw e;
  }
}

function makePost(overrides: Partial<SocialPostView> = {}): SocialPostView {
  return {
    id: "p1",
    kind: "product-launch",
    title: "FinansERPIDE mobil yayında",
    excerpt: "Ön muhasebe artık cebinizde.",
    body: "**Yenilikler**\n\n- Fatura tarama\n- Banka entegrasyonu",
    hashtags: ["ERPIDE", "muhasebe"],
    linkUrl: null,
    imageUrl: null,
    imageAlt: "",
    imageMode: "auto",
    gradient: null,
    decoration: null,
    decorationSubtitle: null,
    imageBackground: null,
    slug: "finanserpide-mobil-yayinda",
    badges: [],
    productSlug: null,
    i18n: null,
    status: "draft",
    scheduledAt: null,
    publishedAt: null,
    targets: ["site"],
    source: "manual",
    sourceRef: null,
    createdBy: null,
    createdAt: "2026-08-30T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
    publications: [],
    ...overrides,
  };
}

// ── Link çözümleme ────────────────────────────────────────────────

test("slug varsa canonical URL üretilir", () => {
  assert.equal(
    canonicalUrl(makePost()),
    "https://www.erpide.com/gundem/finanserpide-mobil-yayinda",
  );
});

test("slug yoksa canonical URL null", () => {
  assert.equal(canonicalUrl(makePost({ slug: null })), null);
});

test("açık CTA linki canonical'ı ezer", () => {
  const post = makePost({ linkUrl: "https://www.erpide.com/urunler/finanserpide" });
  assert.equal(resolveLink(post), "https://www.erpide.com/urunler/finanserpide");
});

test("boş linkUrl canonical'a düşer", () => {
  assert.equal(
    resolveLink(makePost({ linkUrl: "   " })),
    "https://www.erpide.com/gundem/finanserpide-mobil-yayinda",
  );
});

// ── Metin uyarlama ────────────────────────────────────────────────

test("LinkedIn gövdeyi kullanır, markdown temizlenir", () => {
  const text = composeText(makePost(), "linkedin");
  assert.ok(text.includes("Yenilikler"), "başlık gövdede olmalı");
  assert.ok(!text.includes("**"), "yıldızlar temizlenmeli");
  assert.ok(text.includes("• Fatura tarama"), "liste madde işaretine dönmeli");
  assert.ok(text.includes("#ERPIDE #muhasebe"), "etiketler eklenmeli");
});

test("Facebook özeti kullanır, uzun gövdeyi almaz", () => {
  const text = composeText(makePost(), "facebook");
  assert.ok(text.includes("Ön muhasebe artık cebinizde."));
  assert.ok(!text.includes("Fatura tarama"), "gövde Facebook'a girmemeli");
});

test("Instagram linki tıklanamadığı için düz metin verir", () => {
  const text = composeText(makePost(), "instagram");
  assert.ok(text.includes("Detaylar: https://www.erpide.com/gundem/"));
});

test("Instagram en fazla 30 etiket gönderir", () => {
  const many = Array.from({ length: 40 }, (_, i) => `tag${i}`);
  const text = composeText(makePost({ hashtags: many }), "instagram");
  assert.equal((text.match(/#tag\d+/g) ?? []).length, 30);
});

test("etiketlerdeki fazla # temizlenir", () => {
  const text = composeText(makePost({ hashtags: ["##ERPIDE"] }), "facebook");
  assert.ok(text.includes("#ERPIDE"));
  assert.ok(!text.includes("##ERPIDE"));
});

test("uzun metin kelime sınırında kırpılır", () => {
  const text = composeText(makePost({ excerpt: "kelime ".repeat(600) }), "instagram");
  assert.ok(text.length <= 2200, `beklenen ≤2200, gelen ${text.length}`);
  assert.ok(text.endsWith("…"), "kırpılan metin … ile bitmeli");
  assert.ok(!text.includes("kelim…"), "kelime ortasından kesilmemeli");
});

test("boş alanlar araya boş satır bırakmaz", () => {
  const text = composeText(makePost({ body: "", hashtags: [], linkUrl: null, slug: null }), "linkedin");
  assert.ok(!text.includes("\n\n\n"));
});

// ── Görsel adresleri ──────────────────────────────────────────────

test("auto modda OG görseli slug ile üretilir", () => {
  assert.equal(resolveImageUrl(makePost()), "/api/og/post/finanserpide-mobil-yayinda");
});

test("slug yoksa OG görseli id ile üretilir", () => {
  assert.equal(resolveImageUrl(makePost({ slug: null })), "/api/og/post/p1");
});

test("upload modda yüklenen görsel kullanılır", () => {
  const post = makePost({ imageMode: "upload", imageUrl: "https://files.erpide.com/a.png" });
  assert.equal(resolveImageUrl(post), "https://files.erpide.com/a.png");
});

test("göreli görsel yolu mutlak adrese çevrilir", () => {
  assert.equal(absoluteUrl("/api/og/post/x"), "https://www.erpide.com/api/og/post/x");
  assert.equal(absoluteUrl("https://cdn.example/a.png"), "https://cdn.example/a.png");
});

// ── Slug üretimi ──────────────────────────────────────────────────

test("Türkçe karakterler translitere edilir", () => {
  assert.equal(slugify("Çalışan Günü Kutlu Olsun"), "calisan-gunu-kutlu-olsun");
  assert.equal(slugify("İŞÇİ ÖĞÜN ÜRÜN"), "isci-ogun-urun");
});

test("noktalama ve fazla tire temizlenir", () => {
  assert.equal(slugify("23 Nisan — Ulusal Egemenlik!!!"), "23-nisan-ulusal-egemenlik");
});

test("slug 80 karakteri aşmaz", () => {
  assert.ok(slugify("a".repeat(200)).length <= 80);
});

// ── LinkedIn'e özel ───────────────────────────────────────────────

test("LinkedIn organizasyon URN'i kurulur, hazır URN korunur", () => {
  assert.equal(organizationUrn("12345"), "urn:li:organization:12345");
  assert.equal(organizationUrn("urn:li:organization:999"), "urn:li:organization:999");
});

test("commentary özel karakterleri kaçırır, hashtag'e dokunmaz", () => {
  const out = escapeCommentary("Yeni (mobil) sürüm ~hazır~ #ERPIDE");
  assert.ok(out.includes("\\(mobil\\)"));
  assert.ok(out.includes("#ERPIDE"), "hashtag bozulmamalı");
});

// ── Token şifreleme ───────────────────────────────────────────────

test("şifrelenen token geri çözülür", () => {
  process.env.SOCIAL_TOKEN_KEY = "a".repeat(64);
  const enc = encryptToken("EAAB-secret-token");
  assert.ok(enc.startsWith("enc:v1:"), "şifreli değer ön ek taşımalı");
  assert.notEqual(enc, "EAAB-secret-token");
  assert.equal(decryptToken(enc), "EAAB-secret-token");
});

test("ön eki olmayan değer düz metin kabul edilir", () => {
  assert.equal(decryptToken("duz-token"), "duz-token");
});

test("bozuk şifreli değer null döner", () => {
  assert.equal(decryptToken("enc:v1:aaa:bbb:ccc"), null);
});

console.log(`✓ ${passed} test geçti (social/compose)`);
