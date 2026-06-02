import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Shield } from "lucide-react";
import EndpointSection from "@/components/docs/EndpointSection";

export const metadata = {
  title: "CaptchaERPIDE Kılavuzu | ERPIDE",
  description: "CaptchaERPIDE REST API'sini Python, Node.js, cURL veya PHP ile kullanmaya başla — 12 captcha endpoint, kod örnekleri ve hata kodları.",
};

const BASE = "https://captcha.erpide.com";

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
                <h1 className="text-3xl font-bold mb-1"><span className="gradient-text">CaptchaERPIDE API Kılavuzu</span></h1>
                <p className="text-gray-400 text-sm">12 captcha endpoint, kod örnekleri, hata kodları ve rate limit bilgileri.</p>
              </div>
            </div>
          </header>

          <Section title="Genel Bakış">
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              CaptchaERPIDE bir REST API'dir. Görsel captcha tipleri (slider, jigsaw, rotate, text, icon, math, odd-one-out)
              kendi OpenCV+AI tabanlı çözücülerimizle çalışır. Token-tabanlı captcha'lar (hCaptcha, Cloudflare Turnstile,
              Geetest) sunucumuzda çalışan stealth headless Firefox (Camoufox) ile çözülür — 3rd-party servise (2Captcha,
              CapMonster) bağımlı değiliz.
            </p>
            <table className="text-xs w-full mt-3 border border-white/10 rounded-lg overflow-hidden">
              <tbody>
                <tr className="border-b border-white/10"><td className="px-3 py-2 text-gray-400">Base URL</td><td className="px-3 py-2 font-mono text-blue-300">{BASE}</td></tr>
                <tr className="border-b border-white/10"><td className="px-3 py-2 text-gray-400">Auth</td><td className="px-3 py-2 font-mono text-emerald-300">Authorization: Bearer cap_xxxxxxxxxxxxx</td></tr>
                <tr className="border-b border-white/10"><td className="px-3 py-2 text-gray-400">Content-Type</td><td className="px-3 py-2 font-mono text-gray-300">application/json (token) | multipart/form-data (image)</td></tr>
                <tr><td className="px-3 py-2 text-gray-400">API Key nasıl alınır?</td><td className="px-3 py-2 text-gray-300">Üye ol → ürün satın al veya <strong className="text-emerald-300">3 gün ücretsiz dene</strong> → Hesabım → Lisanslarım</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="Kimlik Doğrulama">
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              Tüm istekler <code className="text-emerald-300 bg-white/5 px-1.5 py-0.5 rounded text-xs">Authorization</code> header'ı taşımalıdır:
            </p>
            <pre className="p-3 rounded-lg bg-[#0a0a10] border border-white/5 text-xs font-mono text-gray-300 overflow-x-auto">{`Authorization: Bearer cap_d93e62df13a04e399bd1af1c5832d77fce1b450675951ded`}</pre>
            <p className="text-xs text-gray-500 mt-3">
              ⚠️ API anahtarını <strong className="text-amber-300">git repo, frontend kodu veya log'lara</strong> yazma.
              Yeni anahtar üretmek için Hesabım → Lisanslarım sayfasından "Detaylı Panel" linkine git.
            </p>
          </Section>

          <Section title="Token Captcha'lar (Yeni)">
            <p className="text-sm text-gray-300 leading-relaxed mb-5">
              Bu üç captcha tipi <strong className="text-white">browser fingerprint</strong> üzerine kuruludur — gerçek bir tarayıcı
              widget'ı yüklemeden token üretilmez. Bizim sunucumuzda <strong className="text-emerald-300">stealth Camoufox</strong>{" "}
              çalışıyor, çıkan token'ı sana iletiyor. İstemcin sadece bu token'ı kendi formuna yapıştırır.
            </p>

            <EndpointSection
              method="POST"
              path="/api/v1/solve-turnstile"
              title="Cloudflare Turnstile"
              description="Cloudflare'in görünmez/görünür challenge'ı. Ortalama 8-15 saniyede tamamlanır."
              request={{
                sitekey: "0x4AAAAAAA...",
                page_url: "https://example.com/protected",
                action: null,
                cdata: null,
              }}
              response={{
                success: true,
                token: "0.AbCdEf...g==.XXXXX",
                user_agent: "Mozilla/5.0 (...) Firefox/135.0",
                captcha_type: "turnstile",
                solve_time_ms: 12700,
              }}
            />

            <EndpointSection
              method="POST"
              path="/api/v1/solve-hcaptcha"
              title="hCaptcha"
              description="Image grid veya audio challenge. Audio mode'da Whisper ile transcribe edilir."
              request={{
                sitekey: "10000000-ffff-ffff-ffff-000000000001",
                page_url: "https://example.com/login",
                is_invisible: false,
              }}
              response={{
                success: true,
                token: "P0_eyJ0eXAiOiJKV1QiLCJhbGciOi...",
                user_agent: "Mozilla/5.0 (...)",
                captcha_type: "hcaptcha",
                solve_time_ms: 18430,
              }}
            />

            <EndpointSection
              method="POST"
              path="/api/v1/solve-geetest"
              title="Geetest v3 / v4"
              description="Slider (v3) veya icon grid (v4). version=3 için 'challenge' zorunlu."
              request={{
                gt: "ababababababababababab",
                challenge: "cdcdcdcdcdcdcdcdcdcdcd",
                page_url: "https://example.com/captcha",
                version: 3,
                api_server: "api.geetest.com",
              }}
              response={{
                success: true,
                token: "abcdef1234567890",
                captcha_type: "geetest_v3",
                solve_time_ms: 14200,
              }}
            />
          </Section>

          <Section title="Görsel Captcha'lar">
            <p className="text-sm text-gray-300 leading-relaxed mb-5">
              Bu endpoint'ler <strong>multipart/form-data</strong> kabul eder. Görseli upload edersin, AI çözücümüz{" "}
              <strong className="text-white">~30ms</strong> içinde sonucu döner.
            </p>

            <EndpointSection
              method="POST" path="/api/v1/solve" title="Slider Captcha"
              description="Parça (piece) görselini arka plan (bg) üzerine kaydırma X koordinatı."
              multipart
              fields={[
                { name: "bg_image", desc: "Arka plan PNG/JPG" },
                { name: "piece_image", desc: "Slider parçası" },
                { name: "piece_y", desc: "Parçanın Y konumu (varsayılan 0)" },
                { name: "piece_w", desc: "Parça genişliği (varsayılan 70)" },
                { name: "piece_h", desc: "Parça yüksekliği (varsayılan 70)" },
              ]}
              response={{ success: true, x: 187, solve_time_ms: 28.4, captcha_type: "slider" }}
            />

            <EndpointSection
              method="POST" path="/api/v1/solve-url" title="Slider (URL ile)"
              description="Görsel upload yerine URL gönder, sunucu indirsin."
              request={{
                bg_url: "https://example.com/captcha/bg.png",
                piece_url: "https://example.com/captcha/piece.png",
                piece_y: 0, piece_w: 70, piece_h: 70,
              }}
              response={{ success: true, x: 187, solve_time_ms: 142.7, captcha_type: "slider" }}
            />

            <EndpointSection
              method="POST" path="/api/v1/solve-rotate" title="Rotate Puzzle"
              description="İç görseli doğru açıya çevir — derece olarak döner."
              multipart
              fields={[
                { name: "outer_image", desc: "Dış (sabit) görsel" },
                { name: "inner_image", desc: "Döndürülecek iç görsel" },
                { name: "step", desc: "Derece adımı (varsayılan 5)" },
              ]}
              response={{ success: true, angle: 145, solve_time_ms: 84.1, captcha_type: "rotate" }}
            />

            <EndpointSection
              method="POST" path="/api/v1/solve-jigsaw" title="Jigsaw Puzzle"
              description="Parça konumunu 2D olarak bul."
              multipart
              fields={[{ name: "bg_image", desc: "Arka plan" }, { name: "piece_image", desc: "Parça" }]}
              response={{ success: true, x: 220, y: 88, solve_time_ms: 56.0, captcha_type: "jigsaw" }}
            />

            <EndpointSection
              method="POST" path="/api/v1/solve-text" title="Text / Number Captcha"
              description="OCR ile metin oku. charset: alphanumeric | digits | letters"
              multipart
              fields={[
                { name: "image", desc: "Captcha görseli" },
                { name: "charset", desc: "Karakter seti (varsayılan alphanumeric)" },
              ]}
              response={{ success: true, text: "abcd123", solve_time_ms: 91.3, captcha_type: "text" }}
            />

            <EndpointSection
              method="POST" path="/api/v1/solve-math" title="Math Captcha"
              description="'3+7=?' tipi soruyu oku ve cevapla."
              multipart
              fields={[{ name: "image", desc: "Soru görseli" }]}
              response={{ success: true, text: "10", solve_time_ms: 110.5, captcha_type: "math" }}
            />

            <EndpointSection
              method="POST" path="/api/v1/solve-icon" title="Icon Click — Tek Hedef"
              description="Görsel içinde belirtilen hedefi bul, koordinatını döndür."
              multipart
              fields={[
                { name: "image", desc: "Ana görsel" },
                { name: "target", desc: "Hedef görsel" },
                { name: "threshold", desc: "Eşleşme eşiği (varsayılan 0.6)" },
              ]}
              response={{ success: true, x: 156, y: 73, solve_time_ms: 65.4, captcha_type: "icon" }}
            />

            <EndpointSection
              method="POST" path="/api/v1/solve-icon-all" title="Icon Click — Hepsi"
              description="'Tüm arabaları seç' tipi — eşleşen tüm pozisyonları döner."
              multipart
              fields={[
                { name: "image", desc: "Ana görsel" },
                { name: "target", desc: "Hedef görsel" },
                { name: "threshold", desc: "Eşleşme eşiği" },
              ]}
              response={{ success: true, positions: [{ x: 60, y: 80 }, { x: 180, y: 80 }], solve_time_ms: 78.0, captcha_type: "icon_all" }}
            />

            <EndpointSection
              method="POST" path="/api/v1/solve-odd" title="Odd One Out"
              description="Izgaradaki farklı olanı bul."
              multipart
              fields={[
                { name: "image", desc: "3x3 veya 4x4 ızgara görsel" },
                { name: "grid_cols", desc: "Sütun sayısı (varsayılan 3)" },
                { name: "grid_rows", desc: "Satır sayısı (varsayılan 3)" },
              ]}
              response={{ success: true, x: 230, y: 230, solve_time_ms: 102.2, captcha_type: "odd" }}
            />
          </Section>

          <Section title="Hata Kodları">
            <table className="text-xs w-full border border-white/10 rounded-lg overflow-hidden">
              <thead className="bg-white/5">
                <tr><th className="px-3 py-2 text-left text-gray-400 font-medium">Status</th><th className="px-3 py-2 text-left text-gray-400 font-medium">Anlamı</th><th className="px-3 py-2 text-left text-gray-400 font-medium">Çözüm</th></tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10"><td className="px-3 py-2 font-mono text-red-300">401</td><td className="px-3 py-2 text-gray-300">Geçersiz/eksik API key</td><td className="px-3 py-2 text-gray-400">Bearer ile gönderdiğinden ve cap_ ile başladığından emin ol</td></tr>
                <tr className="border-t border-white/10"><td className="px-3 py-2 font-mono text-red-300">403</td><td className="px-3 py-2 text-gray-300">Aktif lisans yok</td><td className="px-3 py-2 text-gray-400">Trial süresi dolmuş veya satın alma iptal — yeni plan başlat</td></tr>
                <tr className="border-t border-white/10"><td className="px-3 py-2 font-mono text-red-300">429</td><td className="px-3 py-2 text-gray-300">Günlük limit aşıldı</td><td className="px-3 py-2 text-gray-400">Plan yükselt (starter→pro→enterprise)</td></tr>
                <tr className="border-t border-white/10"><td className="px-3 py-2 font-mono text-amber-300">200 success:false</td><td className="px-3 py-2 text-gray-300">Çözüm başarısız (düşük kalite veya captcha değişti)</td><td className="px-3 py-2 text-gray-400">error alanını oku, gerekirse tekrar dene</td></tr>
                <tr className="border-t border-white/10"><td className="px-3 py-2 font-mono text-red-300">502/503</td><td className="px-3 py-2 text-gray-300">Sunucu meşgul / browser farm doldu</td><td className="px-3 py-2 text-gray-400">Birkaç saniye sonra tekrar dene</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="Limit ve Performans">
            <table className="text-xs w-full border border-white/10 rounded-lg overflow-hidden">
              <thead className="bg-white/5">
                <tr><th className="px-3 py-2 text-left text-gray-400">Plan</th><th className="px-3 py-2 text-left text-gray-400">Günlük</th><th className="px-3 py-2 text-left text-gray-400">Eş zamanlı</th><th className="px-3 py-2 text-left text-gray-400">Aylık Ücret</th></tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10"><td className="px-3 py-2 text-white">Starter</td><td className="px-3 py-2">1.000</td><td className="px-3 py-2">4</td><td className="px-3 py-2 text-emerald-300">299 TL</td></tr>
                <tr className="border-t border-white/10"><td className="px-3 py-2 text-white">Pro</td><td className="px-3 py-2">10.000</td><td className="px-3 py-2">8</td><td className="px-3 py-2 text-emerald-300">999 TL</td></tr>
                <tr className="border-t border-white/10"><td className="px-3 py-2 text-white">Enterprise</td><td className="px-3 py-2">100.000+</td><td className="px-3 py-2">özel</td><td className="px-3 py-2 text-emerald-300">İletişim</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-3">
              Görsel captcha ortalama <strong className="text-white">28ms</strong>, token captcha <strong className="text-white">8-20sn</strong>.
              Yüksek hacimli müşteriler için dedicated browser pool — <Link href="/iletisim" className="text-blue-400 hover:underline">iletişime geç</Link>.
            </p>
          </Section>

          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-green-600/10 to-teal-600/10 border border-green-500/20 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Hemen Dene</h2>
            <p className="text-sm text-gray-300 mb-4">3 gün ücretsiz deneme — kart bilgisi gerekmez, anında API key.</p>
            <Link href="/urunler/captchaerpide" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold hover:opacity-90 transition">
              3 Gün Ücretsiz Başlat
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      {children}
    </section>
  );
}
