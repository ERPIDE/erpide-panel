import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

export const metadata = { title: "KVKK Aydınlatma Metni | ERPIDE" };

export default function Page() {
  return (
    <LegalPageLayout title="KVKK Aydınlatma Metni">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, veri sorumlusu sıfatıyla
        {" "}{COMPANY.name} (&quot;ERPIDE&quot;) tarafından aşağıdaki bilgilendirme yapılmaktadır.
      </p>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Veri Sorumlusu</h2>
        <p>
          Ünvan: {COMPANY.name}<br />
          Adres: {COMPANY.address.full}<br />
          Vergi Dairesi / VKN: {COMPANY.taxOffice} / {COMPANY.taxNumber}<br />
          MERSİS No: {COMPANY.mersisNumber}<br />
          E-posta: {COMPANY.kvkkContact}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. İşlenen Kişisel Veri Kategorileri</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Kimlik:</strong> Ad, soyad, TC kimlik no</li>
          <li><strong>İletişim:</strong> E-posta, telefon, adres</li>
          <li><strong>Müşteri İşlem:</strong> Sipariş, fatura, ödeme bilgileri</li>
          <li><strong>İşlem Güvenliği:</strong> IP, log kayıtları, oturum bilgisi</li>
          <li><strong>Finans:</strong> IBAN (talep edildiğinde), fatura bilgileri</li>
          <li><strong>Mesleki:</strong> Şirket ünvanı, VKN, ticaret sicil bilgileri</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. İşleme Amaçları</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Sözleşmenin kurulması ve ifası (KVKK m.5/2-c)</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi (VUK, TTK, KVKK m.5/2-ç)</li>
          <li>Hak tesisi, kullanımı veya korunması (KVKK m.5/2-e)</li>
          <li>Meşru menfaatler kapsamında hizmet kalitesi, güvenlik (KVKK m.5/2-f)</li>
          <li>Açık rıza halinde pazarlama iletişimi (KVKK m.5/1)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Toplama Yöntemi</h2>
        <p>
          Verileriniz; web sitelerimiz (erpide.com, finans.erpide.com, captcha.erpide.com),
          API entegrasyonları, e-posta ve telefon iletişimi yoluyla elektronik ortamda toplanmaktadır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Aktarım</h2>
        <p>
          Verileriniz; hizmet sunumu için zorunlu olan ölçüde, iyzico (ödeme), Resend (e-posta),
          PenDC (hosting) ve Vercel (CDN) gibi yurt içi/yurt dışı hizmet sağlayıcılarına KVKK m.8 ve m.9
          uyarınca aktarılabilir. Yurt dışı aktarımlarda KVK Kurulu kararlarına uygun teminatlar alınır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Haklarınız (KVKK m.11)</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme</li>
          <li>İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içi/dışında aktarıldığı üçüncü kişileri bilme</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
          <li>Silinmesini/yok edilmesini isteme</li>
          <li>Düzeltme/silme işlemlerinin aktarıldığı kişilere bildirilmesini isteme</li>
          <li>Otomatik sistemlerle analiz sonucu aleyhinize çıkan sonuca itiraz etme</li>
          <li>Kanuna aykırı işleme nedeniyle zarara uğradıysanız tazminat talep etme</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Başvuru</h2>
        <p>
          Haklarınızı kullanmak için Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun
          şekilde yazılı olarak aşağıdaki adreslere başvurabilirsiniz:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>E-posta: <a href={`mailto:${COMPANY.kvkkContact}`} className="text-blue-400 hover:underline">{COMPANY.kvkkContact}</a></li>
          <li>KEP: {COMPANY.kepAddress}</li>
          <li>Posta: {COMPANY.address.full}</li>
        </ul>
        <p>Başvurunuz en geç 30 gün içinde ücretsiz olarak yanıtlanır.</p>
      </section>
    </LegalPageLayout>
  );
}
