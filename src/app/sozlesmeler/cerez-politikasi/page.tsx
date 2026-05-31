import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

export const metadata = { title: "Çerez Politikası | ERPIDE" };

export default function Page() {
  return (
    <LegalPageLayout title="Çerez Politikası">
      <p>
        {COMPANY.name} (&quot;ERPIDE&quot;) olarak {COMPANY.website} ve alt alan adlarında deneyiminizi
        iyileştirmek için çerez (cookie) ve benzer teknolojiler kullanmaktayız. Bu politika hangi
        çerezleri neden kullandığımızı ve nasıl yönetebileceğinizi açıklar.
      </p>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Çerez Nedir?</h2>
        <p>
          Çerezler; siteyi ziyaret ettiğinizde tarayıcınıza yerleştirilen küçük metin dosyalarıdır.
          Sitenin sizi tanımasını, tercihlerinizi hatırlamasını ve daha iyi bir kullanıcı deneyimi
          sunmasını sağlar.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Kullandığımız Çerez Türleri</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Zorunlu Çerezler:</strong> Sitenin temel işlevlerini sağlar (giriş, dil tercihi,
            ödeme oturumu). Bunlar kapatılamaz.
          </li>
          <li>
            <strong>Performans Çerezleri:</strong> Sayfa yüklenme süresi, hata tespiti gibi anonim
            ölçümler için kullanılır.
          </li>
          <li>
            <strong>İşlevsel Çerezler:</strong> Tercihlerinizi (dil, tema) hatırlar.
          </li>
          <li>
            <strong>Üçüncü Taraf Çerezleri:</strong> iyzico (ödeme), Vercel (CDN) gibi servis
            sağlayıcılarının çerezleri.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Çerezleri Yönetme</h2>
        <p>
          Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Ancak zorunlu çerezleri
          devre dışı bırakırsanız sitenin bazı bölümleri (ödeme, giriş) düzgün çalışmayabilir.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-3">
          <li>Chrome: Ayarlar → Gizlilik ve güvenlik → Çerezler</li>
          <li>Firefox: Seçenekler → Gizlilik ve Güvenlik → Çerezler ve Site Verileri</li>
          <li>Safari: Tercihler → Gizlilik → Çerezleri Yönet</li>
          <li>Edge: Ayarlar → Çerezler ve site izinleri</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. KVKK Uyumu</h2>
        <p>
          Çerezler aracılığıyla işlenen kişisel verileriniz <a href="/sozlesmeler/kvkk" className="text-blue-400 hover:underline">KVKK Aydınlatma Metni</a>{" "}
          ve <a href="/sozlesmeler/gizlilik-politikasi" className="text-blue-400 hover:underline">Gizlilik Politikası</a> kapsamında işlenmektedir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. İletişim</h2>
        <p>
          Sorular için: <a href={`mailto:${COMPANY.email}`} className="text-blue-400 hover:underline">{COMPANY.email}</a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
