import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

export const metadata = { title: "Kullanım Koşulları | ERPIDE" };

export default function Page() {
  return (
    <LegalPageLayout title="Kullanım Koşulları">
      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Taraflar</h2>
        <p>
          İşbu Kullanım Koşulları (&quot;Koşullar&quot;), {COMPANY.name}
          (&quot;ERPIDE&quot;) ile {COMPANY.website} ve alt alan adlarındaki
          (örn. finans.erpide.com, captcha.erpide.com) hizmetleri kullanan
          kullanıcılar arasında akdedilmiştir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Tanımlar</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Hizmet:</strong> FinansERPIDE (ERP SaaS) ve CaptchaERPIDE (captcha çözüm API) başta olmak üzere ERPIDE tarafından sunulan tüm yazılım ve API hizmetleri.</li>
          <li><strong>Kullanıcı:</strong> Hizmete üye olan ve aboneliği aktif olan gerçek/tüzel kişi.</li>
          <li><strong>Lisans Anahtarı:</strong> Üyenin satın aldığı paket karşılığında kendisine iletilen, hizmetin kullanımına imkân veren benzersiz anahtar.</li>
          <li><strong>Abonelik:</strong> Aylık veya yıllık olarak yenilenen ücretli kullanım dönemi.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Hizmetin Kapsamı</h2>
        <p>
          ERPIDE; çok kiracılı (multi-tenant) ERP yazılımı, captcha çözüm API'si ve ilgili yazılım/danışmanlık
          hizmetlerini sağlar. Hizmetler internet üzerinden, abonelik karşılığında erişime açıktır.
          Hizmetlerin teknik özellikleri ve kapsamı {COMPANY.website}/fiyatlandirma sayfasında ayrıntılandırılmıştır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Üyelik ve Hesap Güvenliği</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Üyelik sırasında verilen bilgilerin doğru ve güncel olması Kullanıcı'nın sorumluluğundadır.</li>
          <li>Hesap, kullanıcı adı/şifre ve lisans anahtarı ile korunmaktadır. Bu bilgilerin gizliliği Kullanıcı'ya aittir.</li>
          <li>Hesap üzerinden gerçekleştirilen tüm işlemler Kullanıcı tarafından yapılmış sayılır.</li>
          <li>Kullanıcı; izinsiz erişim, hesap paylaşımı ve hesap devri yapamaz.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Yasak Kullanımlar</h2>
        <p>Kullanıcı, Hizmet'i aşağıdaki amaçlarla kullanamaz:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Yasalara aykırı, sahtecilik içeren veya üçüncü kişilerin haklarını ihlal eden işlemler.</li>
          <li>ERPIDE altyapısına zarar verecek otomatik istek (DoS), tersine mühendislik veya yetkisiz erişim girişimleri.</li>
          <li>Hizmet kapsamındaki API'leri kötüye kullanmak, lisans limitlerini aşmak.</li>
          <li>Spam, kimlik avı (phishing) veya kötü amaçlı yazılım dağıtımı.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Fikri Mülkiyet</h2>
        <p>
          Hizmet kapsamındaki tüm yazılım kodları, tasarımlar, logolar ve dokümantasyon ERPIDE'ye aittir.
          Kullanıcı'ya yalnızca kullanım hakkı (lisans) tanınır; çoğaltma, dağıtma veya türev eser üretme hakkı verilmez.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Hizmet Sürekliliği ve SLA</h2>
        <p>
          ERPIDE makul ölçüde %99,5 hizmet erişilebilirliği hedeflemektedir. Planlı bakım çalışmaları
          en az 24 saat öncesinden duyurulur. Beklenmedik kesintilerde ERPIDE çözüm için derhal müdahale eder.
          Enterprise planlarda yazılı SLA sunulur.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Sorumluluk Sınırlaması</h2>
        <p>
          ERPIDE; Hizmet'in kesintisiz ve hatasız çalışacağını garanti etmez. Mücbir sebepler, üçüncü taraf
          servis arızaları veya Kullanıcı'dan kaynaklanan sorunlar nedeniyle oluşan zararlardan ERPIDE sorumlu
          tutulamaz. ERPIDE'nin toplam sorumluluğu, olay tarihindeki son 3 aylık abonelik bedeli ile sınırlıdır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Aboneliğin Sona Ermesi</h2>
        <p>
          Kullanıcı, aboneliğini istediği zaman panelden iptal edebilir. İptal sonrasında aboneliğin
          ödenmiş dönemi sonuna kadar Hizmet'e erişim devam eder. Yasak kullanım tespit edilirse ERPIDE,
          Kullanıcı'yı önceden uyarmaksızın aboneliği sonlandırma hakkını saklı tutar.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Değişiklikler</h2>
        <p>
          ERPIDE, bu Koşullar'ı önceden bildirimde bulunarak güncelleyebilir. Önemli değişiklikler kayıtlı
          e-posta adreslerine bildirilir. Kullanıcı'nın değişiklik sonrası Hizmet'i kullanmaya devam etmesi,
          güncel Koşullar'ı kabul ettiği anlamına gelir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">11. Uygulanacak Hukuk ve Yetkili Mahkeme</h2>
        <p>
          İşbu Koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve
          İcra Daireleri yetkilidir. Tüketiciler için Tüketici Hakem Heyetleri'ne başvuru hakkı saklıdır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">12. İletişim</h2>
        <p>
          {COMPANY.name}<br />
          {COMPANY.address.full}<br />
          E-posta: <a href={`mailto:${COMPANY.email}`} className="text-blue-400 hover:underline">{COMPANY.email}</a><br />
          Telefon: <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="text-blue-400 hover:underline">{COMPANY.phone}</a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
