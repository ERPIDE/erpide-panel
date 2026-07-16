import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

export const metadata = { title: "Ön Bilgilendirme Formu | ERPIDE" };

export default function Page() {
  return (
    <LegalPageLayout title="Ön Bilgilendirme Formu">
      <p>
        6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca,
        sipariş vermeden önce aşağıdaki bilgilere dikkatinizi rica ederiz.
      </p>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Satıcı Bilgileri</h2>
        <p>
          Ünvan: {COMPANY.name}<br />
          Adres: {COMPANY.address.full}<br />
          Telefon: {COMPANY.phone}<br />
          E-posta: {COMPANY.email}<br />
          MERSİS: {COMPANY.mersisNumber} • VKN: {COMPANY.taxNumber}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Satın Alınan Hizmet</h2>
        <p>
          FinansERPIDE abonelik paketi. Sipariş ekranında plan adı, içerik, aylık tutar
          (KDV dahil) ve özellikler ayrıntılı olarak gösterilir. Hizmet dijital içerik niteliğinde olup
          elektronik ortamda anında teslim edilir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Toplam Tutar ve Ödeme</h2>
        <p>
          Toplam tutar sipariş özetinde KDV dahil olarak Türk Lirası cinsinden belirtilir. Ödeme
          kredi/banka kartı ile iyzico altyapısı üzerinden alınır. Abonelik her ay otomatik yenilenir;
          ALICI dilediği zaman panelinden iptal edebilir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Cayma Hakkına İlişkin Bilgilendirme</h2>
        <p>
          <strong>Önemli:</strong> Mesafeli Sözleşmeler Yönetmeliği'nin 15/h maddesi gereğince, elektronik
          ortamda anında ifa edilen ve tüketiciye anında teslim edilen gayri maddi mallar (yazılım,
          dijital içerik vb.) için <strong>cayma hakkı bulunmamaktadır.</strong> ALICI ödemeyi onaylamakla
          hizmetin ifasının anında başlamasını kabul eder ve cayma hakkından feragat ettiğini onaylar.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. İptal</h2>
        <p>
          ALICI, aboneliğini hesap panelinden istediği zaman iptal edebilir. İptal anındaki ödenmiş dönem
          sonuna kadar hizmet erişimi devam eder, sonraki dönem için ödeme alınmaz.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Şikayet ve İletişim</h2>
        <p>
          Tüm soru ve şikayetler için <a href={`mailto:${COMPANY.email}`} className="text-blue-400 hover:underline">{COMPANY.email}</a>{" "}
          adresine yazabilir, {COMPANY.phone} numarasını arayabilirsiniz. Çözülemeyen uyuşmazlıklarda
          Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Onay</h2>
        <p>
          Sipariş ekranında &quot;Ön Bilgilendirme Formu'nu okudum, anladım&quot; ve &quot;Mesafeli Satış
          Sözleşmesi'ni okudum, kabul ediyorum&quot; kutucuklarını işaretlemeniz halinde, işbu formdaki tüm
          bilgileri okuduğunuzu ve sözleşmeyi kabul ettiğinizi beyan etmiş olursunuz.
        </p>
      </section>
    </LegalPageLayout>
  );
}
