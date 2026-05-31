import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

export const metadata = { title: "İade ve İptal Politikası | ERPIDE" };

export default function Page() {
  return (
    <LegalPageLayout title="İade ve İptal Politikası">
      <p>
        Bu politika, {COMPANY.name} (&quot;ERPIDE&quot;) tarafından sunulan dijital abonelik hizmetlerinin
        iadesi ve iptaline ilişkin esasları açıklar.
      </p>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Cayma Hakkı (Dijital Ürün İstisnası)</h2>
        <p>
          Mesafeli Sözleşmeler Yönetmeliği m.15/h uyarınca, elektronik ortamda anında ifa edilen ve
          tüketiciye anında teslim edilen gayri maddi mallar (yazılım, dijital içerik, abonelik hizmetleri)
          için <strong>cayma hakkı kullanılamaz</strong>. ALICI; ödeme onayı ile birlikte dijital hizmetin
          teslimine başlanmasını ve cayma hakkından feragat ettiğini açıkça onaylar.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Abonelik İptali</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Aboneliğinizi <strong>hesap panelinizden istediğiniz zaman iptal edebilirsiniz</strong>.</li>
          <li>İptal sonrasında ödenmiş dönem sonuna kadar hizmet kullanımına devam edebilirsiniz.</li>
          <li>İptal sonrası sonraki dönem için ödeme alınmaz.</li>
          <li>Hesap silme talebi için <a href={`mailto:${COMPANY.email}`} className="text-blue-400 hover:underline">{COMPANY.email}</a> adresine yazabilirsiniz.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. İade Yapılan Durumlar</h2>
        <p>İstisnai olarak aşağıdaki durumlarda ücret iadesi yapılabilir:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Hizmetin teknik nedenlerle ERPIDE tarafından sunulamadığı kanıtlanırsa.</li>
          <li>Yanlışlıkla mükerrer ödeme alındıysa.</li>
          <li>Sistemsel hata sonucu yanlış paket aktive edildiyse.</li>
        </ul>
        <p>İade talepleri 14 gün içinde değerlendirilir.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. İade Süresi ve Yöntemi</h2>
        <p>
          Onaylanan iadeler, ödemenin yapıldığı kart hesabına 14 iş günü içinde iyzico üzerinden iade edilir.
          Banka işlem süreleri kullanılan banka ve karta göre değişebilir. ERPIDE iade onayı verildikten sonra
          işleme alır; ALICI'nın kartına yansıma süresi bankanın sorumluluğundadır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. İletişim</h2>
        <p>
          İptal/iade ile ilgili tüm sorular için: <a href={`mailto:${COMPANY.email}`} className="text-blue-400 hover:underline">{COMPANY.email}</a> • {COMPANY.phone}
        </p>
      </section>
    </LegalPageLayout>
  );
}
