import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

/**
 * Hesap ve veri silme talebi sayfası.
 *
 * NEDEN VAR — MAĞAZA ZORUNLULUĞU: Google Play, kullanıcı hesabı
 * açılabilen her uygulama için, GİRİŞ GEREKTİRMEYEN herkese açık bir
 * "hesap silme talebi" URL'si istiyor. Bu URL Play Console'da ayrıca
 * beyan ediliyor; olmadan uygulama yayına alınmıyor.
 *
 * Sayfa iki şeyi açıkça ayırmak zorunda: silinen veri ve YASAL OLARAK
 * saklanması zorunlu olan veri. FinansERPIDE bir muhasebe uygulaması —
 * defter ve fatura kayıtları VUK gereği saklanmak zorunda. Bunu
 * gizlemek yerine yazmak hem doğru hem de Play'in istediği şey.
 */
export const metadata = {
  title: "Hesap ve Veri Silme Talebi | ERPIDE",
  description:
    "ERPIDE hesabınızı ve verilerinizi nasıl sildireceğiniz, hangi verilerin " +
    "silindiği ve yasal olarak hangilerinin saklandığı.",
};

export default function Page() {
  return (
    <LegalPageLayout title="Hesap ve Veri Silme Talebi">
      <p>
        ERPIDE hesabınızı ve ilgili verilerinizi silmemizi isteyebilirsiniz. Bu sayfa,
        talebi nasıl ileteceğinizi, hangi verilerin silindiğini ve hangilerinin yasal
        zorunluluk nedeniyle saklandığını açıklar. Sayfa herkese açıktır; talep için
        giriş yapmanız gerekmez.
      </p>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Talebinizi Nasıl İletirsiniz?</h2>
        <p>
          Hesabınızın kayıtlı e-posta adresinden{" "}
          <a href={`mailto:${COMPANY.kvkkContact}?subject=Hesap%20Silme%20Talebi`} className="underline">
            {COMPANY.kvkkContact}
          </a>{" "}
          adresine <strong>&quot;Hesap Silme Talebi&quot;</strong> konu başlığıyla yazmanız yeterlidir.
          Mesajınızda hesabınızın e-posta adresini ve varsa şirket unvanınızı belirtin.
        </p>
        <p>
          Talebi <strong>kayıtlı e-posta adresinizden</strong> göndermenizi istiyoruz; bu, hesabın
          gerçekten size ait olduğunu doğrulamanın en basit yolu. Farklı bir adresten
          yazmanız gerekiyorsa kimlik doğrulaması için ek bilgi isteyebiliriz.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Ne Kadar Sürede Sonuçlanır?</h2>
        <p>
          Talebiniz en geç <strong>30 gün</strong> içinde sonuçlandırılır ve size e-posta ile
          bilgi verilir. KVKK kapsamındaki başvurularınız için yasal süre de aynıdır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Silinen Veriler</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Kullanıcı hesabınız ve giriş bilgileriniz (e-posta, şifre özeti)</li>
          <li>Aktif oturumlarınız ve oturum kayıtları</li>
          <li>Profil ve iletişim bilgileriniz</li>
          <li>Mobil uygulamada cihazınızda tutulan oturum anahtarı ve hesap bilgileri</li>
          <li>Ürün kullanımına ilişkin tercih ve ayar kayıtlarınız</li>
        </ul>
        <p>
          Mobil uygulamadan <strong>çıkış yapmanız</strong> hâlinde cihazınızdaki oturum anahtarı
          ve hesap bilgileri zaten anında silinir; bunun için talep göndermenize gerek yoktur.
          Uygulamayı kaldırmanız da cihazdaki bu verileri siler.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Yasal Olarak Saklanan Veriler</h2>
        <p>
          FinansERPIDE bir muhasebe ve ön muhasebe uygulamasıdır. Hesabınızı silsek dahi,
          aşağıdaki kayıtları <strong>silemeyiz</strong>; çünkü saklanmaları kanunen zorunludur:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Defter, fatura ve muhasebe kayıtları:</strong> 213 sayılı Vergi Usul Kanunu
            uyarınca <strong>5 yıl</strong> saklanır.
          </li>
          <li>
            <strong>Ticari defter ve belgeler:</strong> 6102 sayılı Türk Ticaret Kanunu uyarınca
            <strong> 10 yıl</strong> saklanır.
          </li>
          <li>
            <strong>e-Fatura / e-Arşiv belgeleri:</strong> Gelir İdaresi Başkanlığı düzenlemeleri
            uyarınca ilgili saklama süresi boyunca muhafaza edilir.
          </li>
          <li>
            <strong>Ödeme ve fatura kayıtlarımız:</strong> Bizim size kestiğimiz abonelik
            faturaları da aynı vergi mevzuatına tabidir.
          </li>
        </ul>
        <p>
          Bu kayıtlar yalnızca yasal saklama yükümlülüğü için tutulur; pazarlama dâhil
          başka hiçbir amaçla kullanılmaz ve süre dolduğunda silinir. Saklama süresi
          boyunca erişim, ilgili mevzuatın gerektirdiği hâller ile sınırlıdır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Verilerinizin Bir Kopyasını Almak</h2>
        <p>
          Hesabınızı silmeden önce verilerinizin bir kopyasını isteyebilirsiniz. Aynı e-posta
          adresine <strong>&quot;Veri Kopyası Talebi&quot;</strong> konusuyla yazmanız yeterlidir.
          Silme işlemi geri alınamaz; kopyanızı silme talebinden önce almanızı öneririz.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. İletişim</h2>
        <p>
          Ünvan: {COMPANY.name}<br />
          Adres: {COMPANY.address.full}<br />
          Vergi Dairesi / VKN: {COMPANY.taxOffice} / {COMPANY.taxNumber}<br />
          E-posta:{" "}
          <a href={`mailto:${COMPANY.kvkkContact}`} className="underline">
            {COMPANY.kvkkContact}
          </a>
        </p>
        <p>
          KVKK kapsamındaki diğer haklarınız ve başvuru usulü için{" "}
          <a href="/sozlesmeler/kvkk" className="underline">KVKK Aydınlatma Metni</a> sayfasına,
          verilerinizin nasıl işlendiğine dair ayrıntı için{" "}
          <a href="/sozlesmeler/gizlilik-politikasi" className="underline">Gizlilik Politikası</a>{" "}
          sayfasına bakabilirsiniz.
        </p>
      </section>
    </LegalPageLayout>
  );
}
