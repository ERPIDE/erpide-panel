// Vercel Blob (bloke store) → Cloudflare R2 göçü + GitHub yorum linklerini güncelleme
//
// Blob store "limits-exceeded-suspended" (2026-07-30'dan beri) — Hobby kota
// döngüsü ayın 30'unda döner, ~2026-08-30'da serving açılınca çalıştırılacak.
//
// Kullanım (repo kökünden):
//   vercel env pull .env.blob --environment production
//   node scripts/blob-to-r2-migrate.js --dry-run   # önce kuru test
//   node scripts/blob-to-r2-migrate.js
//
// Ne yapar: tasks/ altındaki tüm ekleri indirir → R2'ye aynı pathname ile
// yükler → iki repodaki issue yorumlarında geçen eski blob URL'lerini
// R2_PUBLIC_URL ile değiştirir. İlk GET 403 dönerse hiçbir şey yapmadan çıkar.
const fs = require("fs");
const path = require("path");
const { list } = require("@vercel/blob");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const DRY = process.argv.includes("--dry-run");
const BLOB_HOST = "https://6eu3nbfqivqzghex.public.blob.vercel-storage.com";
const REPOS = ["erpide-1c-erp", "erpide-canias-erp"];
const ORG = "ERPIDE";

const envFile = path.join(__dirname, "..", ".env.blob");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"\r\n]*)"?/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const { BLOB_READ_WRITE_TOKEN, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL, GITHUB_TOKEN } = process.env;
if (!BLOB_READ_WRITE_TOKEN || !R2_ACCOUNT_ID || !GITHUB_TOKEN) {
  console.error("Eksik env — önce: vercel env pull .env.blob --environment production");
  process.exit(1);
}
const R2_BASE = (R2_PUBLIC_URL || "").replace(/\/$/, "");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

async function gh(url, options = {}) {
  const r = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${url}`);
  return r.json();
}

(async () => {
  let cursor;
  const blobs = [];
  do {
    const res = await list({ token: BLOB_READ_WRITE_TOKEN, prefix: "tasks/", cursor, limit: 1000 });
    blobs.push(...res.blobs);
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  console.log(`tasks/ blob: ${blobs.length}`);

  const probe = await fetch(blobs[0].url);
  if (!probe.ok) {
    console.error(`STORE HALA BLOKE (HTTP ${probe.status}) — blokaj kalkınca tekrar çalıştır.`);
    process.exit(2);
  }
  console.log("Serving açık, göç başlıyor" + (DRY ? " (DRY RUN)" : ""));

  let up = 0;
  for (const b of blobs) {
    const r = await fetch(b.url);
    if (!r.ok) { console.error(`INDIRILEMEDI: ${b.pathname} (${r.status})`); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    if (!DRY) {
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: b.pathname,
        Body: buf,
        ContentType: r.headers.get("content-type") || "application/octet-stream",
      }));
    }
    up++;
    console.log(`R2 <- ${b.pathname} (${Math.round(buf.length / 1024)}KB)`);
  }
  console.log(`Yüklenen: ${up}/${blobs.length}`);

  for (const repo of REPOS) {
    let page = 1, patched = 0;
    for (;;) {
      const comments = await gh(`https://api.github.com/repos/${ORG}/${repo}/issues/comments?per_page=100&page=${page}`);
      if (comments.length === 0) break;
      for (const c of comments) {
        if (c.body && c.body.includes(BLOB_HOST)) {
          const newBody = c.body.split(BLOB_HOST).join(R2_BASE);
          if (!DRY) {
            await gh(`https://api.github.com/repos/${ORG}/${repo}/issues/comments/${c.id}`, {
              method: "PATCH",
              body: JSON.stringify({ body: newBody }),
            });
          }
          patched++;
        }
      }
      page++;
    }
    console.log(`${repo}: ${patched} yorum güncellendi`);
  }
  console.log("BITTI ✅");
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
