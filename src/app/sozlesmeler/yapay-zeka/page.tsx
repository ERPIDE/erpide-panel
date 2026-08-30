import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY } from "@/lib/company-info";

export const metadata = { title: "Yapay Zekâ (Eylül) Aydınlatma Metni | ERPIDE" };

/**
 * ⚠️ YAYINA ALMADAN ÖNCE OKU — YURT DIŞI AKTARIM DAYANAĞI
 *
 * Aşağıdaki 7. bölümde aktarımın hukuki dayanağı YAZILI DEĞİL, çünkü bu satır
 * ancak Anthropic ile KVKK standart sözleşmesi İMZALANDIKTAN ve Kurul'a
 * bildirildikten sonra doğru olur. Var olmayan bir dayanağı burada beyan etmek,
 * aydınlatma eksikliğinden DAHA AĞIR bir ihlal olur (yanlış beyan).
 *
 * Neden açık rıza yazamıyoruz: 1 Eylül 2024'ten beri arızi OLMAYAN (sürekli,
 * olağan iş akışının parçası) aktarımlarda açık rıza tek başına geçerli değil.
 * Eylül her gün çalıştığı için tanım gereği sürekli aktarımdır.
 *
 * AÇIK RİSK — avukata ilk sorulacak soru: Anthropic'in Türk mevzuatına özgü
 * KVKK standart sözleşme metnini imzalayıp imzalamayacağı belirsiz. İmzalamazsa
 * managed Eylül için temiz bir aktarım dayanağı KALMAZ (bağlayıcı şirket
 * kuralları yalnız grup şirketleri için, arızi istisnalar sürekli aktarımda
 * kullanılamaz). Bu durumda connector modeline geçiş zorunlu hale gelir.
 *
 * Karar kaydı: erpide-finanserpide/docs/AI-HUKUKI-MIMARI.md
 */
const AKTARIM_DAYANAGI_HAZIR = false;

export default function Page() {
  return (
    <LegalPageLayout title="Yapay Zekâ Asistanı (Eylül) Aydınlatma Metni">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) m.10 uyarınca,
        {" "}{COMPANY.name} (&quot;ERPIDE&quot;) tarafından, FinansERPIDE içindeki yapay zekâ
        asistanı &quot;Eylül&quot; kullanıldığında gerçekleşen kişisel veri işleme faaliyeti
        hakkında aşağıdaki bilgilendirme yapılmaktadır.
      </p>
      <p className="mt-3">
        Bu metin, FinansERPIDE için geçerli olan genel{" "}
        <a href="/sozlesmeler/gizlilik-politikasi" className="text-blue-400 hover:underline">Gizlilik Politikası</a>{" "}
        ve{" "}
        <a href="/sozlesmeler/kvkk" className="text-blue-400 hover:underline">KVKK Aydınlatma Metni</a>&apos;ni
        tamamlar; onların yerine geçmez.
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
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Rollerin Paylaşımı — Bu Bölüm Önemli</h2>
        <p>
          FinansERPIDE&apos;ye yüklediğiniz fatura, cari, personel ve muhasebe kayıtları
          <strong> sizin işletmenize ait verilerdir</strong>. Bu veriler bakımından:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Siz (abone işletme) veri sorumlususunuz.</strong> Faturalarınızda yer alan üçüncü kişilerin (müşteri, tedarikçi, çalışan) verileri için aydınlatma ve gerekli hukuki dayanağı sağlamak sizin yükümlülüğünüzdür.</li>
          <li><strong>ERPIDE veri işleyendir.</strong> Verilerinizi yalnızca sizin talimatınızla, size hizmet sunmak amacıyla işler; kendi amaçları için kullanmaz.</li>
          <li><strong>Yapay zekâ sağlayıcısı alt işleyendir</strong> (bkz. 6. bölüm).</li>
        </ul>
        <p className="mt-3">
          ERPIDE&apos;nin kendi kayıtları (hesap bilgileriniz, fatura ilişkimiz, destek yazışmaları)
          bakımından ise veri sorumlusu ERPIDE&apos;dir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Eylül Nasıl Çalışır</h2>
        <p>Eylül iki farklı şekilde kullanılabilir ve <strong>veri akışı ikisinde farklıdır</strong>:</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li>
            <strong>ERPIDE Eylül (varsayılan):</strong> Sorunuzu FinansERPIDE ekranından
            yazarsınız. İlgili veri, ERPIDE&apos;nin sunucusundan yapay zekâ sağlayıcısına
            iletilir, yanıt üretilir ve size gösterilir. Bu kullanımda aktarımı
            gerçekleştiren taraf ERPIDE&apos;dir.
          </li>
          <li>
            <strong>Kendi yapay zekânızı bağlama (bağlantı / connector):</strong> Kendi
            yapay zekâ aboneliğinizi (ör. Claude) ERPIDE&apos;ye bağlarsınız. Bu kullanımda
            veri, sizin seçtiğiniz sağlayıcıya <strong>sizin talimatınızla</strong> ulaşır;
            ERPIDE yapay zekâ sağlayıcısına herhangi bir aktarım yapmaz. Yurt dışına
            aktarımın hukuki sorumluluğu bu senaryoda size aittir.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Yapay Zekâya Aktarılan Veriler</h2>
        <p>
          Eylül&apos;e yalnızca sorunuzu yanıtlamak için gereken veri iletilir; veritabanınızın
          tamamı gönderilmez. Soruya göre şu veriler işlenebilir:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Sorunuzun metni</strong> ve varsa yüklediğiniz belge/fotoğraf (fatura, fiş)</li>
          <li><strong>Cari bilgileri:</strong> unvan, VKN/TCKN, adres, iletişim, bakiye</li>
          <li><strong>Fatura ve belge verileri:</strong> tarih, tutar, KDV, kalemler</li>
          <li><strong>Muhasebe verileri:</strong> hesap kodları, yevmiye, mizan, bakiye</li>
          <li><strong>Personel verileri:</strong> yalnızca bordro/özlük sorusu sorduğunuzda</li>
          <li><strong>Banka ve stok hareketleri:</strong> ilgili soru sorulduğunda</li>
        </ul>
        <p className="mt-3">
          Hangi verinin hangi anda gönderildiği kayıt altına alınır; talep etmeniz halinde
          işletmenize ait yapay zekâ işlem kaydı size sunulur.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. İşleme Amaçları ve Hukuki Sebep (KVKK m.5)</h2>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Talebiniz doğrultusunda kayıt oluşturmak, sorgulamak ve raporlamak</li>
          <li>Muhasebe ve vergi mevzuatına ilişkin sorularınızı yanıtlamak</li>
          <li>Belge okuma (fatura/fiş görselinden alan çıkarma)</li>
        </ul>
        <p className="mt-3">
          Hukuki sebep: <strong>sözleşmenin ifası için gerekli olması</strong> (KVKK m.5/2-c) —
          Eylül, satın aldığınız hizmetin bir parçasıdır.
        </p>
        <p className="mt-3">
          <strong>Verileriniz yapay zekâ modellerinin eğitiminde kullanılmaz.</strong>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Alt İşleyenler</h2>
        <p>
          ERPIDE, hizmeti sunabilmek için aşağıdaki hizmet sağlayıcılarını kullanır. Bu
          liste güncel tutulur; değişiklik halinde bu sayfa güncellenir.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 pr-4">Sağlayıcı</th>
                <th className="text-left py-2 pr-4">Hizmet</th>
                <th className="text-left py-2">Konum</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4"><strong>Anthropic PBC</strong></td>
                <td className="py-2 pr-4">Yapay zekâ dil modeli (Eylül&apos;ün altyapısı)</td>
                <td className="py-2">ABD</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4">ERPIDE (kendi sunucusu)</td>
                <td className="py-2 pr-4">Uygulama, veritabanı, belge saklama</td>
                <td className="py-2"><strong>Türkiye</strong></td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4">QNB eSolutions</td>
                <td className="py-2 pr-4">e-Fatura / e-Arşiv entegratörü</td>
                <td className="py-2">Türkiye</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4">Resend</td>
                <td className="py-2 pr-4">Bildirim e-postaları</td>
                <td className="py-2">ABD / AB</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4">Vercel, Cloudflare</td>
                <td className="py-2 pr-4">erpide.com barındırma, DNS/CDN</td>
                <td className="py-2">ABD / küresel</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Apple (APNs), Google (FCM)</td>
                <td className="py-2 pr-4">Mobil bildirim iletimi</td>
                <td className="py-2">ABD</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          <strong>Muhasebe defter ve belgeleriniz Türkiye&apos;deki sunucularımızda saklanır</strong> ve
          Vergi Usul Kanunu&apos;nun muhafaza yükümlülüğü gereği yurt dışına taşınmaz. ERPIDE,
          e-Defter saklama hizmeti vermemektedir; e-Defter saklama yükümlülüğünüz Gelir
          İdaresi Başkanlığı&apos;ndan izinli saklamacı kuruluşlar aracılığıyla yerine getirilir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Yurt Dışına Aktarım (KVKK m.9)</h2>
        <p>
          ERPIDE Eylül kullanıldığında, sorunuzu yanıtlamak için gereken veri
          <strong> Anthropic PBC (Amerika Birleşik Devletleri)</strong> altyapısına iletilir ve
          orada işlenir. Aktarım yalnızca ilgili sorunun yanıtlanması amacıyla, o işlem
          süresince gerçekleşir.
        </p>
        {AKTARIM_DAYANAGI_HAZIR ? (
          <p className="mt-3">
            Bu aktarım, KVKK m.9 uyarınca imzalanan ve Kişisel Verileri Koruma Kurumu&apos;na
            bildirilen <strong>standart sözleşme</strong> kapsamında gerçekleştirilmektedir.
          </p>
        ) : null}
        <p className="mt-3">
          <strong>Kendi yapay zekânızı bağladığınızda</strong> ERPIDE tarafından yapılan bir
          yurt dışı aktarımı bulunmaz; veri, sizin seçtiğiniz sağlayıcıya sizin talimatınızla
          ulaşır ve KVKK m.9 yükümlülükleri veri sorumlusu sıfatıyla size aittir.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Saklama Süresi</h2>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Sohbet geçmişi:</strong> tarayıcınızda/oturumunuzda tutulur, ERPIDE sunucusunda kalıcı olarak saklanmaz.</li>
          <li><strong>Yapay zekâ işlem kaydı:</strong> hangi işlemin ne zaman ve kim tarafından yapıldığı, güvenlik ve denetim amacıyla işletmenizin kendi veritabanında saklanır.</li>
          <li><strong>Oluşturulan kayıtlar</strong> (fatura, yevmiye vb.) Vergi Usul Kanunu ve Türk Ticaret Kanunu&apos;ndaki yasal saklama sürelerine tabidir.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Eylül&apos;ü Kullanmama ve Kapatma</h2>
        <p>
          Eylül&apos;ü kullanmak zorunda değilsiniz; FinansERPIDE&apos;nin tüm işlevleri ekranlar
          üzerinden kullanılabilir. Eylül&apos;ü hesabınız için tamamen kapattırmak isterseniz{" "}
          {COMPANY.kvkkContact} adresine talebinizi iletmeniz yeterlidir. Kapatma sunucu
          tarafında uygulanır; uygulama güncellemesi gerekmez.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Yapay Zekâ Çıktılarının Niteliği</h2>
        <p>
          Eylül&apos;ün ürettiği yanıtlar ve öneriler <strong>bilgi amaçlıdır</strong>; mali müşavir,
          yeminli mali müşavir veya hukuk danışmanlığı yerine geçmez. Beyan, bildirim ve
          muhasebe kayıtlarının doğruluğundan mükellef olarak siz sorumlusunuz.
        </p>
        <p className="mt-3">
          Bu nedenle mali sonuç doğuran işlemler (fatura, yevmiye, bordro, dönem kapanışı,
          e-Fatura gönderimi) <strong>onayınız alınmadan gerçekleştirilmez</strong>; Eylül size ne
          yapacağını gösterir ve onayınızı bekler.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">11. Veri Güvenliği</h2>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Her işletmenin verisi <strong>ayrı veritabanında</strong> tutulur; Eylül yalnızca sizin verinize erişir, başka işletmenin verisine teknik olarak ulaşamaz.</li>
          <li>Eylül yalnızca tanımlı ve sınırlı işlemleri çalıştırabilir; serbest veritabanı sorgusu, dosya sistemi veya sunucu erişimi bulunmaz.</li>
          <li>Yapay zekâ tarafından yapılan her işlem, kullanıcı ve zaman bilgisiyle kayıt altına alınır.</li>
          <li>Entegrasyon bilgileri (banka, e-fatura) şifrelenerek saklanır.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mt-8 mb-3">12. Haklarınız (KVKK m.11)</h2>
        <p>
          Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini
          veya silinmesini isteme, aktarıldığı üçüncü kişileri öğrenme ve işlemenin
          hukuka aykırı olduğunu düşünüyorsanız zararınızın giderilmesini talep etme
          haklarına sahipsiniz. Taleplerinizi {COMPANY.kvkkContact} adresine iletebilirsiniz;
          en geç 30 gün içinde yanıtlanır.
        </p>
      </section>
    </LegalPageLayout>
  );
}
