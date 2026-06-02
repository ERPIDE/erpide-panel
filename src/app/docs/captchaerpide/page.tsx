import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Shield, Terminal, Zap, Key, BookOpen } from "lucide-react";

export const metadata = {
  title: "CaptchaERPIDE Kılavuzu | ERPIDE",
  description: "CaptchaERPIDE REST API'sini Python, Node.js veya curl ile kullanmaya başla.",
};

export default function CaptchaDocsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
            <ArrowLeft size={14} /> Dökümantasyon
          </Link>

          <header className="mb-10">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center flex-shrink-0">
                <Shield size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">CaptchaERPIDE Kılavuzu</span></h1>
                <p className="text-gray-400 text-sm">REST API ile slider, text, icon ve puzzle captcha tiplerini çözmeye başla.</p>
              </div>
            </div>
          </header>

          <Section icon={Zap} title="Hızlı Başlangıç">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300 marker:text-blue-400">
              <li>ERPIDE hesabınla <Link href="/giris" className="text-blue-400 hover:underline">giriş yap</Link>, e-postanı doğrula.</li>
              <li><Link href="/urunler/captchaerpide" className="text-blue-400 hover:underline">CaptchaERPIDE</Link> sayfasında <strong>3 Gün Ücretsiz Dene</strong> butonuna tıkla.</li>
              <li><Link href="/hesabim/lisanslarim" className="text-blue-400 hover:underline">Lisanslarım</Link> sayfasından sana verilen <strong>API key</strong>'i kopyala.</li>
              <li>Aşağıdaki örneklerle API'yi çağırmaya başla. Hiçbir kurulum gerekmez — REST endpoint'i bulutta hazır.</li>
            </ol>
          </Section>

          <Section icon={Key} title="API Endpoint">
            <Code language="text">{`POST https://captcha.erpide.com/api/v1/solve
Headers:
  Authorization: Bearer YOUR_LICENSE_KEY
  Content-Type: application/json

Body:
  {
    "type": "slider" | "text" | "icon" | "puzzle",
    "image": "<base64-encoded-image>",
    "background": "<base64-encoded-image>"   // sadece slider/puzzle için
  }

Response:
  {
    "success": true,
    "solution": "<text veya pixel offset>",
    "elapsed_ms": 28
  }`}</Code>
          </Section>

          <Section icon={Terminal} title="curl Örneği">
            <Code language="bash">{`curl -X POST https://captcha.erpide.com/api/v1/solve \\
  -H "Authorization: Bearer YOUR_LICENSE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "text",
    "image": "iVBORw0KGgoAAAANSUhEUgAA..."
  }'`}</Code>
          </Section>

          <Section icon={Terminal} title="Python Örneği">
            <Code language="python">{`import base64
import requests

API_KEY = "YOUR_LICENSE_KEY"
URL = "https://captcha.erpide.com/api/v1/solve"

with open("captcha.png", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

resp = requests.post(URL, json={
    "type": "text",
    "image": image_b64,
}, headers={
    "Authorization": f"Bearer {API_KEY}",
})

data = resp.json()
print("Çözüm:", data["solution"])
print("Süre:", data["elapsed_ms"], "ms")`}</Code>
          </Section>

          <Section icon={Terminal} title="Node.js Örneği">
            <Code language="javascript">{`import fs from "fs";

const API_KEY = "YOUR_LICENSE_KEY";
const URL = "https://captcha.erpide.com/api/v1/solve";

const imageB64 = fs.readFileSync("captcha.png").toString("base64");

const res = await fetch(URL, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ type: "text", image: imageB64 }),
});

const data = await res.json();
console.log("Çözüm:", data.solution);
console.log("Süre:", data.elapsed_ms, "ms");`}</Code>
          </Section>

          <Section icon={BookOpen} title="Captcha Tipleri">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Tip name="text" desc="Tek tek metin tabanlı captcha'lar (harf/rakam karışımı)" />
              <Tip name="slider" desc="Kaydırıcıyı doğru yere taşıma — image + background gönder" />
              <Tip name="icon" desc="İkon eşleştirme/seçme captcha'ları" />
              <Tip name="puzzle" desc="Yapboz parçası yerleştirme" />
            </div>
          </Section>

          <Section icon={Shield} title="Limit ve Hata Yönetimi">
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• <strong className="text-white">Starter plan:</strong> Günlük 1.000 çözüm</li>
              <li>• <strong className="text-white">Pro plan:</strong> Günlük 10.000 çözüm</li>
              <li>• <strong className="text-white">Enterprise:</strong> Sınırsız + dedicated worker pool</li>
              <li>• Limit aşıldığında HTTP 429 döner — Retry-After header'ına bak</li>
              <li>• Geçersiz API key → HTTP 401 (`Authorization` header'ını kontrol et)</li>
              <li>• Çözülemeyen captcha → `success: false` + `error: "no_solution"` döner, ücretlendirilmez</li>
            </ul>
          </Section>

          <div className="mt-10 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-center">
            <p className="text-sm text-gray-300 mb-3">
              Sorun yaşıyor musun? <strong>Webhook entegrasyonu</strong> veya <strong>özel captcha tipi</strong> mi lazım?
            </p>
            <Link href="/iletisim" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition text-sm">
              Bize Yaz
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 p-6 rounded-2xl bg-[#111118] border border-white/5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
        <Icon size={18} className="text-blue-400" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Code({ language, children }: { language: string; children: string }) {
  return (
    <div className="rounded-lg bg-[#0a0a0f] border border-white/10 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500 font-mono">{language}</div>
      <pre className="p-4 text-xs text-gray-200 overflow-x-auto font-mono leading-relaxed"><code>{children}</code></pre>
    </div>
  );
}

function Tip({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="p-3 rounded-lg bg-[#0d0d14] border border-white/5">
      <code className="text-xs font-mono text-blue-400">{name}</code>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  );
}
