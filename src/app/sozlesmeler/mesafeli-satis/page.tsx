import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

export const metadata = { title: "Mesafeli Satış Sözleşmesi | ERPIDE" };

export default function Page() {
  return (
    <LegalPageLayout title="Mesafeli Satış Sözleşmesi">
      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Taraflar</h2>
        <p><strong>SATICI:</strong></p>
        <p>
          Ünvan: {COMPANY.name}<br />
          Adres: {COMPANY.address.full}<br />
          Telefon: {COMPANY.phone}<br />
          E-posta: {COMPANY.email}<br />
          MERSİS No: {COMPANY.mersisNumber}<br />
          Vergi Dairesi / VKN: {COMPANY.taxOffice} / {COMPANY.taxNumber}
        </p>
        <p className="mt-4"><strong>ALICI:</strong> Üyelik ve ödeme sırasında bilgileri elektronik ortamda kaydedilen tüketici/kullanıcı.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Sözleşmenin Konusu</h2>
        <p>
          İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait {COMPANY.website} adresinden elektronik
          ortamda sipariş verdiği, satış fiyatı ve nitelikleri aşağıda belirtilen dijital hizmet
          (yazılım abonelik hizmeti) ürününün satışı ve teslimi ile ilgili olarak 6502 sayılı
          Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri
          gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Sözleşme Konusu Hizmet</h2>
        <p>
          Sipariş ekranında belirtilen ürün/plan (FinansERPIDE abonelik paketleri).
          Sipariş özetinde ürün adı, plan, aylık tutar (KDV dahil) ve plan özellikleri yer almaktadır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Bedel ve Ödeme</h2>
        <p>
          Bedel sipariş ekranında Türk Lirası cinsinden, KDV dahil olarak gösterilir. Ödeme; kredi/banka
          kartı ile iyzico ödeme altyapısı üzerinden, taksitli veya tek çekim olarak alınır. Aboneliğin
          devam etmesi halinde sonraki dönemler aynı kart üzerinden otomatik tahsil edilebilir; ALICI bu
          tahsilatı sözleşmeyi kabul ederek onaylar.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Teslimat</h2>
        <p>
          Hizmet dijital içerik (yazılım hizmeti) niteliğindedir. Ödeme onayının ardından lisans
          anahtarı ALICI'nın belirttiği e-posta adresine <strong>anında elektronik ortamda</strong>{" "}
          teslim edilir. Ayrıca hesap profilinden de görülebilir. Fiziksel teslimat yoktur.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Cayma Hakkı</h2>
        <p>
          6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği'nin 15/h maddesi uyarınca,
          <strong> elektronik ortamda anında ifa edilen ve gayri maddi mallar (yazılım, dijital içerik vb.)
          ile ilgili sözleşmelerde cayma hakkı kullanılamaz.</strong> ALICI; ödeme onayı ile birlikte
          dijital hizmetin teslimine başlanmasını ve cayma hakkından feragat ettiğini açıkça onaylar.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. İptal ve İade</h2>
        <p>
          Cayma hakkı kullanılamamakla birlikte, ALICI aboneliğini hesap panelinden istediği zaman
          iptal edebilir. İptal sonrasında ödenmiş olan dönem sonuna kadar hizmet kullanımı devam eder,
          sonraki dönemler ücretlendirilmez. Hizmetin teknik nedenlerle SATICI tarafından
          sunulamadığı kanıtlanan haller dışında kısmi iade yapılmaz.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Genel Hükümler</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>ALICI sipariş öncesi Ön Bilgilendirme Formu'nu okumuş ve onaylamıştır.</li>
          <li>ALICI verdiği bilgilerin doğruluğundan sorumludur.</li>
          <li>SATICI mücbir sebepler nedeniyle hizmet veremezse ALICI'ya bilgi verir.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Uyuşmazlık Çözümü</h2>
        <p>
          İşbu sözleşmeden doğan uyuşmazlıklarda Ticaret Bakanlığı'nca her yıl ilan edilen parasal
          sınırlar dahilinde Tüketici Hakem Heyetleri, üzerindeki uyuşmazlıklarda Tüketici Mahkemeleri
          yetkilidir. Ticari nitelikli uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Yürürlük</h2>
        <p>
          ALICI, sipariş ekranında işbu sözleşmeyi onayladığı tarihte sözleşmenin tüm koşullarını
          kabul etmiş sayılır. Sözleşmenin bir nüshası ALICI'nın e-posta adresine gönderilir ve hesap
          profilinden her zaman erişilebilir.
        </p>
      </section>
    </LegalPageLayout>
  );
}
