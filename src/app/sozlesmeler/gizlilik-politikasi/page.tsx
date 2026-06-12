import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

export const metadata = { title: "Gizlilik Politikası | ERPIDE" };

export default function Page() {
  return (
    <LegalPageLayout title="Gizlilik Politikası">
      <p>
        {COMPANY.name} (&quot;ERPIDE&quot;), kullanıcılarının gizliliğine ve kişisel verilerinin
        korunmasına azami önem verir. Bu politika, hangi verileri topladığımızı, nasıl kullandığımızı
        ve haklarınızı açıklar.
      </p>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Topladığımız Veriler</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Üyelik bilgileri:</strong> Ad, soyad, e-posta, telefon, TC kimlik no, şirket ünvanı, VKN, adres.</li>
          <li><strong>Ödeme bilgileri:</strong> Yalnızca işlem referansı ve fatura bilgileri saklanır. <strong>Kart numarası ERPIDE'ye iletilmez</strong>; iyzico üzerinden güvenle işlenir.</li>
          <li><strong>Kullanım verileri:</strong> Hizmet içi işlemler, fatura kayıtları, API çağrıları, log kayıtları.</li>
          <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgisi, çerez tanımlayıcıları.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Verileri Kullanma Amaçlarımız</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Hizmet sunumu, hesap yönetimi, lisans anahtarı teslimi.</li>
          <li>Fatura kesimi ve yasal yükümlülüklerin yerine getirilmesi.</li>
          <li>Müşteri desteği ve teknik bildirimler.</li>
          <li>Hizmet iyileştirme, dolandırıcılık tespiti ve güvenlik denetimi.</li>
          <li>Açık rızanız olması halinde pazarlama iletişimi.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Verilerin Aktarımı</h2>
        <p>Verileriniz; yalnızca aşağıdaki üçüncü kişilerle, hizmet kapsamı gereği paylaşılır:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>iyzico</strong> — ödeme işlemleri için.</li>
          <li><strong>Resend / e-posta sağlayıcı</strong> — bildirim e-postaları için.</li>
          <li><strong>Hosting altyapısı</strong> — sunucu barındırma için (Türkiye'de PenDC Veri Merkezi).</li>
          <li><strong>Vercel</strong> — pazarlama sitesi barındırma.</li>
          <li>Yasal zorunluluk gereği yetkili kamu kurum ve kuruluşları.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Veri Saklama Süreleri</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Üyelik verileri: hesap kapatıldıktan 10 yıl sonra silinir (VUK ve TTK uyarınca).</li>
          <li>Fatura ve mali kayıtlar: 10 yıl (yasal zorunluluk).</li>
          <li>Log kayıtları: 2 yıl (5651 sayılı kanun gereği).</li>
          <li>Pazarlama izni: rızanız geri alınana kadar.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Güvenlik Önlemleri</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Tüm trafik HTTPS (TLS 1.2+) ile şifrelenir.</li>
          <li>Veritabanı şifreleri bcrypt/Argon2 ile hash'lenir.</li>
          <li>Müşteri verisi şifreli yedeklenir, yetkisiz erişim engellenir.</li>
          <li>Erişim ve kritik işlemler audit log'a kaydedilir.</li>
          <li>FinansERPIDE'de her firma için ayrı veritabanı kullanılır, izolasyon kod seviyesindedir.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Haklarınız</h2>
        <p>KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Verilerinize erişim, düzeltme, silme talep etme.</li>
          <li>İşleme itiraz etme, kısıtlama isteme.</li>
          <li>Veri taşınabilirliği talep etme.</li>
          <li>Açık rızanızı geri alma.</li>
        </ul>
        <p>Bu hakları kullanmak için <a href={`mailto:${COMPANY.kvkkContact}`} className="text-blue-400 hover:underline">{COMPANY.kvkkContact}</a> adresine yazabilirsiniz.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3" id="captchaerpide-extension">7. CaptchaERPIDE Tarayıcı Uzantısı</h2>
        <p>Chrome / Edge / Brave tarayıcılarına yüklenebilen <strong>CaptchaERPIDE</strong> uzantısı için ek aydınlatma:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Saklanan veri:</strong> Yalnızca sizin sağladığınız <em>API anahtarı</em> ve <em>kullanım sayacı</em> (günlük/toplam çözüm sayısı) <code>chrome.storage.local</code> içinde saklanır — bu veri ERPİDE sunucularına gönderilmez, sadece cihazınızda kalır.</li>
          <li><strong>Sunucuya gönderilen:</strong> Uzantı bir captcha tespit ettiğinde yalnızca şu bilgiler <code>captcha.erpide.com</code>'a gönderilir: captcha tipi (örn. reCAPTCHA v2), captcha'nın <em>sitekey</em> değeri, sayfa URL'si ve gerektiğinde User-Agent. <strong>Sayfa içeriği, form alanları, kişisel veriler veya başka herhangi bir veri sunucumuza gönderilmez.</strong></li>
          <li><strong>İzinler:</strong> Uzantı yalnızca <code>storage</code>, <code>activeTab</code> ve <code>scripting</code> izinlerini ister. Hassas izinler (cookies, history, geolocation) istemez.</li>
          <li><strong>Host izinleri:</strong> Yalnızca <code>https://captcha.erpide.com/*</code> adresine ağ erişimi vardır; başka hiçbir alan adına dış istek yapmaz.</li>
          <li><strong>Yapay zeka ile çözüm:</strong> Captcha'lar ERPİDE'nin yapay zeka destekli çözüm motoru tarafından çözülür; üçüncü taraf agregatör (CapMonster, 2Captcha) yalnızca ihtiyaç halinde ve şeffaf şekilde kullanılır (BYOK opsiyonu mevcuttur).</li>
          <li><strong>Çerez/Tracking:</strong> Uzantı reklam veya analitik amaçlı çerez yerleştirmez, ziyaret ettiğiniz siteleri loglamaz, anonim telemetri toplamaz.</li>
          <li><strong>Kaynak kodu açıktır:</strong> Uzantı kaynak kodu <a href="https://github.com/ERPIDE/captcha-erpide-extension" target="_blank" rel="noopener" className="text-blue-400 hover:underline">github.com/ERPIDE/captcha-erpide-extension</a> adresinde herkese açıktır; denetlenebilir.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Değişiklikler</h2>
        <p>Bu politika güncellenebilir; önemli değişiklikler e-posta ile bildirilir.</p>
      </section>
    </LegalPageLayout>
  );
}
