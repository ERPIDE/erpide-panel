import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

export const metadata = { title: "Çağrı Kayıt Aydınlatma Metni | ERPIDE" };

export default function Page() {
  return (
    <LegalPageLayout title="Çağrı Kayıt ve Sesli Asistan Aydınlatma Metni">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) m.10 ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde
        Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca, veri sorumlusu sıfatıyla {COMPANY.name}{" "}
        (&quot;ERPIDE&quot;) tarafından, web sitesinden veya telefonla başlatılan sesli AI asistan
        (&quot;Eylül&quot;) görüşmeleriniz hakkında aşağıdaki bilgilendirme yapılmaktadır.
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
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. İşlenen Veri Kategorileri</h2>
        <p>Sesli görüşme sırasında aşağıdaki kişisel verileriniz işlenebilir:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Ses kaydı:</strong> Görüşme sırasında sarf ettiğiniz ses içeriği</li>
          <li><strong>Konuşma metni (transkript):</strong> Otomatik konuşma-tanıma (STT) ile ses → metin dönüşümü</li>
          <li><strong>Telefon numarası / arama bilgileri:</strong> Telefonla bağlandıysanız caller-ID, çağrı başlangıç/bitiş saati</li>
          <li><strong>Tanımlayıcı bilgiler:</strong> Kendi rızanızla paylaştığınız ad-soyad, e-posta, şirket adı, talebinizin detayı</li>
          <li><strong>Teknik veriler:</strong> Web çağrısı ise tarayıcı, IP adresi, oturum kimliği</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. İşleme Amaçları</h2>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Talebinize uygun ürün/hizmet bilgisi sunmak</li>
          <li>Demo, fiyat teklifi, teknik destek taleplerinizi kayıt altına almak</li>
          <li>Hizmet kalitesinin ölçülmesi ve geliştirilmesi (AI asistan eğitimi DEĞİL — sadece içsel kalite kontrol)</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi (yargı/kolluk talepleri saklıdır)</li>
          <li>İstatistiksel analiz (PII'den arındırılmış agregat metrikler)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Hukuki Sebepler (KVKK m.5)</h2>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Açık rızanız:</strong> Görüşmeye başladığınızda bilgilendirildiğiniz an açık rıza vermiş sayılırsınız (ön kayıt mesajıyla ya da bu metni okuduğunuzu beyanla)</li>
          <li><strong>Bir sözleşmenin kurulması/ifası için gerekli olması:</strong> Demo/teklif talebiniz</li>
          <li><strong>Veri sorumlusunun meşru menfaati:</strong> Hizmet kalite kontrolü, dolandırıcılık önleme</li>
          <li><strong>Hukuki yükümlülük:</strong> Mahkeme/kolluk talepleri</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Aktarılan Taraflar</h2>
        <p>Kişisel verileriniz aşağıdaki üçüncü taraflarla, yalnızca hizmet ifa amacıyla ve gizlilik sözleşmeleri çerçevesinde paylaşılır:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Vapi.ai (ABD):</strong> AI sesli asistan altyapı sağlayıcısı — ses, transkript ve özet işlenir. Vapi'nin kendi gizlilik politikası: <a href="https://vapi.ai/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener">vapi.ai/privacy</a></li>
          <li><strong>Anthropic (ABD):</strong> Eylül&apos;ün LLM modeli — konuşma metni model girdisi olarak kullanılır; Anthropic tarafından model eğitimi için saklanmaz (zero-data-retention sözleşmemiz vardır)</li>
          <li><strong>Telefon operatörleri:</strong> Verimor (TR), Twilio (KZ) — yalnızca SIP trunk üzerinden ses iletimi</li>
          <li><strong>Yetkili merciler:</strong> Mahkeme, savcılık, kolluk talepleri</li>
        </ul>
        <p className="mt-3">
          ABD aktarımları KVKK m.9/2 (b) kapsamında açık rıza ile veya KVKK Kurulu&apos;nun ABD&apos;ye yönelik
          yeterli korumayı kabul ettiği ölçüde yapılır. Standart Sözleşme Hükümleri (SCC) imzalanmıştır.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Saklama Süreleri</h2>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Ses kaydı:</strong> 6 ay (sonra otomatik silinir)</li>
          <li><strong>Transkript ve özet:</strong> 24 ay (talep takibi + hizmet kalitesi)</li>
          <li><strong>Telefon numarası / iletişim bilgisi:</strong> Talep çözüme kavuşana + 12 ay (TBK zamanaşımı)</li>
          <li><strong>Vergi/muhasebe ilişkili kayıtlar:</strong> 10 yıl (TTK m.82)</li>
        </ul>
        <p className="mt-3 text-sm text-gray-400">
          Saklama süresi bittiğinde veriler imha veya anonimleştirme yöntemiyle silinir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Haklarınız (KVKK m.11)</h2>
        <p>Her veri sahibi olarak:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Hangi verilerinizin işlendiğini öğrenme</li>
          <li>Verilerinizin bir kopyasını talep etme</li>
          <li>Yanlış verilerin düzeltilmesini isteme</li>
          <li>Silinme veya yok edilme talep etme</li>
          <li>Verilerin aktarıldığı tarafları öğrenme</li>
          <li>Otomatik karar verme süreçlerine itiraz etme</li>
          <li>Zarara uğrarsanız tazminat talep etme</li>
        </ul>
        <p className="mt-3">
          Taleplerinizi <a href={`mailto:${COMPANY.kvkkContact}`} className="text-blue-400 hover:underline">{COMPANY.kvkkContact}</a>
          {" "}adresine veya yazılı olarak ERPİDE merkez adresine iletebilirsiniz.
          KVKK m.13 uyarınca <strong>30 gün içinde</strong> yanıt verilir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. AI Asistan Olduğuna Dair Bilgilendirme</h2>
        <p>
          Görüşme yaptığınız Eylül adlı asistan bir <strong>yapay zekâ sistemidir</strong>; insan operatör değildir.
          AB AI Act m.50 ve TC Bakanlığı dijital hizmet yönetmelikleri uyarınca, görüşme başlangıcında bu durum
          açıkça beyan edilir. İsterseniz görüşme sırasında bir insan temsilciye aktarılma talebinde bulunabilirsiniz —
          bu durumda kayıt durdurulur ve talebiniz ofis saatlerinde yetkili bir kişiye iletilir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Şikayet Mercii</h2>
        <p>
          Verdiğimiz yanıttan tatmin olmazsanız Kişisel Verileri Koruma Kurumu&apos;na şikayet hakkınız saklıdır:
          <br />
          <a href="https://www.kvkk.gov.tr" className="text-blue-400 hover:underline" target="_blank" rel="noopener">kvkk.gov.tr</a>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Güncelleme</h2>
        <p className="text-sm text-gray-400">
          Bu metin 13 Haziran 2026 itibarıyla yürürlüktedir. Değişiklikler en az 30 gün önceden e-posta ve site
          üzerinden duyurulur.
        </p>
      </section>
    </LegalPageLayout>
  );
}
