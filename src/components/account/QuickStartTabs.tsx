"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Lang = "curl" | "python" | "node" | "php";

interface Props {
  apiBaseUrl: string;
  apiKey: string;
  productId: string;
}

const LANG_LABELS: Record<Lang, string> = {
  curl: "cURL",
  python: "Python",
  node: "Node.js",
  php: "PHP",
};


function captchaSnippets(base: string, key: string): Record<Lang, string> {
  // Use Turnstile as the worked example — newest endpoint, simplest payload.
  const url = `${base.replace(/\/$/, "")}/api/v1/solve-turnstile`;
  return {
    curl: `curl -X POST '${url}' \\
  -H 'Authorization: Bearer ${key}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "sitekey": "1x00000000000000000000AA",
    "page_url": "https://example.com/form"
  }'`,
    python: `import requests

resp = requests.post(
    "${url}",
    headers={"Authorization": "Bearer ${key}"},
    json={
        "sitekey": "1x00000000000000000000AA",
        "page_url": "https://example.com/form",
    },
    timeout=90,
)
data = resp.json()
if data["success"]:
    token = data["token"]
    print("Turnstile token:", token)
else:
    print("Solve failed:", data.get("error"))`,
    node: `import fetch from "node-fetch";

const resp = await fetch("${url}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${key}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sitekey: "1x00000000000000000000AA",
    page_url: "https://example.com/form",
  }),
});
const data = await resp.json();
if (data.success) {
  console.log("Turnstile token:", data.token);
} else {
  console.error("Solve failed:", data.error);
}`,
    php: `<?php
$ch = curl_init('${url}');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ${key}',
    'Content-Type: application/json',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'sitekey'  => '1x00000000000000000000AA',
    'page_url' => 'https://example.com/form',
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$body = curl_exec($ch);
curl_close($ch);
$data = json_decode($body, true);
echo $data['success'] ? $data['token'] : 'Failed: '.$data['error'];`,
  };
}


function snippetsFor(productId: string, base: string, key: string): Record<Lang, string> | null {
  if (productId === "captchaerpide") return captchaSnippets(base, key);
  // future: finanserpide etc.
  return null;
}


export default function QuickStartTabs({ apiBaseUrl, apiKey, productId }: Props) {
  const [lang, setLang] = useState<Lang>("python");
  const [copied, setCopied] = useState(false);

  const all = snippetsFor(productId, apiBaseUrl, apiKey);
  if (!all) return null;

  const snippet = all[lang];

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — silent
    }
  }

  return (
    <div className="rounded-lg bg-[#0a0a10] border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex gap-1">
          {(Object.keys(LANG_LABELS) as Lang[]).map((k) => (
            <button
              key={k}
              onClick={() => setLang(k)}
              className={`text-[11px] px-2.5 py-1 rounded transition ${
                lang === k
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {LANG_LABELS[k]}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="text-[11px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed text-gray-300 font-mono whitespace-pre">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
