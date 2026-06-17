#!/usr/bin/env node
/**
 * vapi-pull.mjs — Vapi assistant config'i API'den çek, vapi/<slug>/ klasörüne yaz.
 *
 * Kullanım:
 *   node scripts/vapi-pull.mjs              # default: eylul (NEXT_PUBLIC_VAPI_ASSISTANT_ID)
 *   node scripts/vapi-pull.mjs --slug eylul --assistant <id>
 *
 * Çıktı:
 *   vapi/<slug>/config.json   — düzenlenebilir alanlar (sysprompt = "@prompt.md" marker)
 *   vapi/<slug>/prompt.md     — system prompt (markdown, kolay diff)
 *   vapi/<slug>/.snapshot.json — Vapi'den dönen ham response (audit/diff için)
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
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
  const out = { slug: "eylul", assistant: null };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--slug") out.slug = args[++i];
    else if (args[i] === "--assistant") out.assistant = args[++i];
  }
  return out;
}

async function main() {
  loadEnv();
  const { slug, assistant } = parseArgs();
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  const assistantId = assistant || process.env.VAPI_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  if (!apiKey) throw new Error("VAPI_PRIVATE_KEY env yok");
  if (!assistantId) throw new Error("Assistant ID yok (--assistant veya VAPI_ASSISTANT_ID env)");

  const r = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!r.ok) throw new Error(`Vapi API ${r.status}: ${await r.text()}`);
  const c = await r.json();

  const sysMsg = (c.model?.messages || []).find((m) => m.role === "system");
  const prompt = sysMsg?.content || "";

  const editable = {
    name: c.name,
    firstMessage: c.firstMessage,
    firstMessageMode: c.firstMessageMode,
    endCallPhrases: c.endCallPhrases,
    voice: c.voice,
    transcriber: c.transcriber,
    model: {
      provider: c.model?.provider,
      model: c.model?.model,
      messages: [
        { role: "system", content: "@prompt.md" },
        ...(c.model?.messages || []).filter((m) => m.role !== "system"),
      ],
      ...(c.model?.temperature !== undefined ? { temperature: c.model.temperature } : {}),
      ...(c.model?.maxTokens !== undefined ? { maxTokens: c.model.maxTokens } : {}),
      ...(c.model?.tools ? { tools: c.model.tools } : {}),
    },
    server: c.server,
    serverUrl: c.serverUrl,
  };

  const dir = join(ROOT, "vapi", slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "config.json"), JSON.stringify(editable, null, 2) + "\n");
  writeFileSync(join(dir, "prompt.md"), prompt);
  writeFileSync(join(dir, ".snapshot.json"), JSON.stringify(c, null, 2) + "\n");
  console.log(`✓ ${slug}: ${prompt.length} char prompt + config.json yazıldı (${dir})`);
}

main().catch((e) => {
  console.error("HATA:", e.message);
  process.exit(1);
});
