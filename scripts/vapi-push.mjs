#!/usr/bin/env node
/**
 * vapi-push.mjs — vapi/<slug>/ klasöründeki config.json + prompt.md'yi Vapi'ye PATCH'le.
 *
 * Kullanım:
 *   node scripts/vapi-push.mjs              # default: eylul
 *   node scripts/vapi-push.mjs --slug eylul --assistant <id>
 *   node scripts/vapi-push.mjs --dry        # PATCH atmadan payload'u göster
 *
 * Akış:
 *  1. vapi/<slug>/config.json oku
 *  2. model.messages[].content === "@prompt.md" ise vapi/<slug>/prompt.md ile değiştir
 *  3. PATCH https://api.vapi.ai/assistant/{id}
 *  4. Push başarılıysa .snapshot.json güncelle
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  for (const f of [".env.local", ".env.production.local"]) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, k, vRaw] = m;
      if (process.env[k]) continue;
      process.env[k] = vRaw.replace(/^"(.*)"$/, "$1");
    }
  }
}

function parseArgs() {
  const out = { slug: "eylul", assistant: null, dry: false };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--slug") out.slug = args[++i];
    else if (args[i] === "--assistant") out.assistant = args[++i];
    else if (args[i] === "--dry") out.dry = true;
  }
  return out;
}

async function main() {
  loadEnv();
  const { slug, assistant, dry } = parseArgs();
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  const assistantId = assistant || process.env.VAPI_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  if (!apiKey) throw new Error("VAPI_PRIVATE_KEY env yok");
  if (!assistantId) throw new Error("Assistant ID yok");

  const dir = join(ROOT, "vapi", slug);
  const cfg = JSON.parse(readFileSync(join(dir, "config.json"), "utf8"));
  const promptPath = join(dir, "prompt.md");
  const prompt = existsSync(promptPath) ? readFileSync(promptPath, "utf8") : null;

  // prompt.md marker'larını gerçek içerikle değiştir
  if (cfg.model?.messages && prompt !== null) {
    cfg.model.messages = cfg.model.messages.map((m) =>
      m.content === "@prompt.md" ? { ...m, content: prompt } : m
    );
  }

  if (dry) {
    console.log("DRY RUN — PATCH payload (kısaltılmış):");
    const preview = JSON.parse(JSON.stringify(cfg));
    if (preview.model?.messages?.[0]?.content) {
      preview.model.messages[0].content = `[${preview.model.messages[0].content.length} chars]`;
    }
    console.log(JSON.stringify(preview, null, 2));
    return;
  }

  const r = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cfg),
  });
  if (!r.ok) throw new Error(`Vapi API ${r.status}: ${await r.text()}`);
  const updated = await r.json();

  writeFileSync(join(dir, ".snapshot.json"), JSON.stringify(updated, null, 2) + "\n");
  console.log(`✓ ${slug} (assistant ${assistantId}) güncellendi — model=${updated.model?.model} voice=${updated.voice?.voiceId}`);
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
