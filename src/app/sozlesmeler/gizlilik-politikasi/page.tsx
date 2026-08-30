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
          <li><strong>Hosting altyapısı</strong> — sunucu barındırma için (Türkiye&apos;de PenDC Veri Merkezi).</li>
          <li><strong>Vercel</strong> — pazarlama sitesi barındırma.</li>
          <li>
            <strong>QNB eSolutions</strong> — e-Fatura / e-Arşiv belgelerinizin Gelir İdaresi
            Başkanlığı&apos;na iletilmesi için. Yalnızca faturanın kendisi (alıcı bilgileri, kalemler,
            tutarlar) aktarılır; bu aktarım yasal zorunluluktur.
          </li>
          <li>
            <strong>Bankalar</strong> — yalnızca <em>siz</em> banka entegrasyonunu kendi hesabınız için
            açtığınızda, hesap hareketlerinizi çekmek amacıyla ilgili bankanın API&apos;siyle bağlantı
            kurulur. Entegrasyonu açmazsanız bankayla hiçbir veri alışverişi olmaz.
          </li>
          <li>
            <strong>Anthropic PBC (Claude)</strong> — <em>yalnızca</em> yapay zekâ asistanı
            (&quot;Eylül&quot;) özelliğini kullandığınızda. Sorunuzu cevaplamak için gereken kayıtlar
            (örneğin ilgili fatura veya cari bilgileri) modele gönderilir. Bu veriler
            <strong> yurt dışında (ABD) işlenir</strong> ve model eğitiminde kullanılmaz. Asistanı hiç
            kullanmazsanız bu aktarım gerçekleşmez. Ayrıntı için{" "}
            <a href="/sozlesmeler/yapay-zeka" className="text-blue-400 hover:underline">
              Yapay Zekâ Aydınlatma Metni
            </a>.
          </li>
          <li>
            <strong>Cloudflare</strong> — alan adı yönetimi (DNS) ve içerik dağıtım ağı için.
          </li>
          <li>
            <strong>Apple (APNs) / Google (FCM)</strong> — mobil bildirimlerin cihazınıza
            iletilmesi için. Bildirim gövdesinde iş verisi taşınmaz; ayrıntı uygulamanın
            içinde gösterilir.
          </li>
          <li>
            <strong>Expo (EAS Update)</strong> — mobil uygulamanın güncellemelerini dağıtmak için.
            Yalnızca teknik istek bilgisi (IP, işletim sistemi, uygulama sürümü) iletilir; iş
            verileriniz veya hesap bilgileriniz gönderilmez.
          </li>
          <li>Yasal zorunluluk gereği yetkili kamu kurum ve kuruluşları.</li>
        </ul>
        <p className="mt-4">
          <strong>Muhasebe defter ve belgeleriniz Türkiye&apos;de kalır.</strong> Faturalarınız,
          e-Arşiv belgeleriniz ve yüklediğiniz ekler Vergi Usul Kanunu&apos;nun muhafaza
          yükümlülüğü gereği Türkiye&apos;deki sunucularımızda (PenDC Veri Merkezi) saklanır ve
          yurt dışına taşınmaz. Yukarıdaki yurt dışı aktarımları, belgelerin saklanmasına
          değil, yalnızca ilgili hizmetin o anki işleyişine ilişkindir.
        </p>
        <p className="mt-3">
          ERPIDE <strong>e-Defter saklama hizmeti vermemektedir</strong>; e-Defter saklama
          yükümlülüğünüz Gelir İdaresi Başkanlığı&apos;ndan izinli saklamacı kuruluşlar
          aracılığıyla yerine getirilir.
        </p>
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
          <li><strong>Saklanan veri:</strong> Yalnızca sizin sağladığınız <em>API anahtarı</em> ve <em>kullanım sayacı</em> (günlük/toplam çözüm sayısı) <code>chrome.storage.local</code> içinde saklanır — bu veri ERPIDE sunucularına gönderilmez, sadece cihazınızda kalır.</li>
          <li><strong>Sunucuya gönderilen:</strong> Uzantı bir captcha tespit ettiğinde yalnızca şu bilgiler <code>captcha.erpide.com</code>'a gönderilir: captcha tipi (örn. reCAPTCHA v2), captcha'nın <em>sitekey</em> değeri, sayfa URL'si ve gerektiğinde User-Agent. <strong>Sayfa içeriği, form alanları, kişisel veriler veya başka herhangi bir veri sunucumuza gönderilmez.</strong></li>
          <li><strong>İzinler:</strong> Uzantı yalnızca <code>storage</code>, <code>activeTab</code> ve <code>scripting</code> izinlerini ister. Hassas izinler (cookies, history, geolocation) istemez.</li>
          <li><strong>Host izinleri:</strong> Yalnızca <code>https://captcha.erpide.com/*</code> adresine ağ erişimi vardır; başka hiçbir alan adına dış istek yapmaz.</li>
          <li><strong>Yapay zeka ile çözüm:</strong> Captcha'lar ERPIDE'nin yapay zeka destekli çözüm motoru tarafından çözülür; üçüncü taraf agregatör (CapMonster, 2Captcha) yalnızca ihtiyaç halinde ve şeffaf şekilde kullanılır (BYOK opsiyonu mevcuttur).</li>
          <li><strong>Çerez/Tracking:</strong> Uzantı reklam veya analitik amaçlı çerez yerleştirmez, ziyaret ettiğiniz siteleri loglamaz, anonim telemetri toplamaz.</li>
          <li><strong>Kaynak kodu açıktır:</strong> Uzantı kaynak kodu <a href="https://github.com/ERPIDE/captcha-erpide-extension" target="_blank" rel="noopener" className="text-blue-400 hover:underline">github.com/ERPIDE/captcha-erpide-extension</a> adresinde herkese açıktır; denetlenebilir.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3" id="finanserpide-mobil">8. FinansERPIDE Mobil Uygulaması (iOS / Android)</h2>
        <p>
          App Store ve Google Play üzerinden indirilebilen <strong>FinansERPIDE</strong> mobil
          uygulaması (<code>com.erpide.finans</code>) için ek aydınlatma:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Cihazda saklanan veri:</strong> oturum anahtarı ve temel hesap bilgileriniz
            (ad, e-posta, şirket ünvanı), &quot;beni hatırla&quot; işaretlediyseniz e-posta
            adresiniz, ve tema tercihiniz. Bunlar işletim sisteminin güvenli deposunda
            (iOS Keychain / Android Keystore) tutulur.
          </li>
          <li>
            <strong>Şifreniz cihazda saklanmaz.</strong> Giriş sırasında sunucuya iletilir ve
            yalnızca oturum anahtarı geri döner. &quot;Beni hatırla&quot; yalnızca e-posta adresini
            hatırlar, şifreyi değil.
          </li>
          <li>
            <strong>Çıkış yaptığınızda</strong> oturum anahtarı ve hesap bilgileri cihazdan silinir.
          </li>
          <li>
            <strong>İstenen izinler: yok.</strong> Uygulama kamera, fotoğraflar, konum, rehber,
            mikrofon veya bildirim izni istemez.
          </li>
          <li>
            <strong>Takip ve analitik: yok.</strong> Uygulamada reklam ağı, analitik SDK&apos;sı, çökme
            raporlama aracı veya üçüncü taraf izleyici bulunmaz. Reklam kimliği (IDFA / Android
            Advertising ID) okunmaz, farklı şirketlere ait uygulama ve sitelerdeki davranışınız
            izlenmez.
          </li>
          <li>
            <strong>Nereye bağlanır:</strong> yalnızca kendi sunucumuza
            (<code>finans.erpide.com</code>) ve uygulama güncellemeleri için Expo (EAS Update)
            servisine. Başka hiçbir alan adına dış istek yapmaz.
          </li>
          <li>
            <strong>Gösterilen iş verisi:</strong> uygulama, şirketinizin sunucudaki ERP verisini
            (cari, fatura, banka, stok, muhasebe kayıtları) ekranda gösterir. Bu veriler cihazda
            kalıcı olarak kopyalanmaz; uygulamayı kapattığınızda ekran verisi kaybolur.
          </li>
          <li>
            <strong>Otomatik güncelleme:</strong> uygulama açılışta yeni sürüm olup olmadığını
            kontrol eder ve varsa indirir. Bu kontrol sırasında iş verileriniz veya hesap
            bilgileriniz gönderilmez (bkz. madde 3, Expo).
          </li>
          <li>
            <strong>Hesap silme:</strong> hesabınızın ve verilerinizin silinmesini
            <a href={`mailto:${COMPANY.kvkkContact}`} className="text-blue-400 hover:underline"> {COMPANY.kvkkContact}</a> adresine
            yazarak talep edebilirsiniz. Mali kayıtlar için yasal saklama süreleri (madde 4)
            saklıdır.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Değişiklikler</h2>
        <p>Bu politika güncellenebilir; önemli değişiklikler e-posta ile bildirilir.</p>
      </section>
    </LegalPageLayout>
  );
}
