/**
 * Aktivasyon kodu üretici (CLI) — panel API'si Cloudflare arkasında olduğu
 * için sunucu/DB üstünden doğrudan üretir. Admin UI ile aynı kod alfabesi.
 *
 * CLI: npx tsx scripts/gen-license-codes.ts "<not>" <skuId>:<adet> [<skuId>:<adet> ...]
 */
import { config as dotenv } from "dotenv";
import { resolve } from "path";
dotenv({ path: resolve(__dirname, "../.env.vercelprod") });
dotenv({ path: resolve(__dirname, "../.env.production.local") });
dotenv({ path: resolve(__dirname, "../.env.local") });

import { getPrisma } from "../src/lib/db";
import { randomBytes } from "crypto";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(): string {
  const bytes = randomBytes(12);
  const chars = Array.from(bytes).map((b) => ALPHA[b % ALPHA.length]).join("");
  return `ERP-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

async function main() {
  const [note, ...specs] = process.argv.slice(2);
  if (!specs.length) throw new Error('Kullanim: gen-license-codes.ts "<not>" <skuId>:<adet> ...');
  const prisma = getPrisma();
  const batchId = `batch-${Date.now()}`;
  const out: Array<{ code: string; skuId: string }> = [];

  for (const spec of specs) {
    const [skuId, countRaw] = spec.split(":");
    const count = Math.max(1, Number(countRaw) || 1);
    for (let i = 0; i < count; i++) {
      const code = generateCode();
      await prisma.licenseCode.create({
        data: {
          code,
          skuId,
          productId: "finanserpide",
          durationDays: 30,
          batchId,
          note: note || null,
        },
      });
      out.push({ code, skuId });
    }
  }
  console.log(`batch: ${batchId}`);
  for (const o of out) console.log(`${o.code}  <-  ${o.skuId}`);
  process.exit(0);
}
main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
