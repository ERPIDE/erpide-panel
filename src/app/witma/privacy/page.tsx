// Kaynak: witma repo `lib/legal.js` (PRIVACY). Güncellerken oradan senkronla.
// Mağaza (App Store / Play) incelemesi için canlı URL: erpide.com/witma/privacy
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata = {
  title: "WITMA Gizlilik Politikası ve KVKK Aydınlatma Metni | ERPIDE",
  description:
    "WITMA uygulaması için gizlilik politikası ve 6698 sayılı KVKK aydınlatma metni.",
};

const UPDATED = "14 Ağustos 2026";

const INTRO =
  'WITMA ("Uygulama"), veri sorumlusu sıfatıyla ERPİDE Yazılım A.Ş. tarafından sunulur. ' +
  "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve ilgili mevzuat kapsamında " +
  "hangi verileri topladığımızı, hangi hukuki sebeple işlediğimizi, kimlere aktardığımızı, " +
  "ne kadar sakladığımızı ve haklarınızı açıklar.";

const BLOCKS: { h: string; p: string[] }[] = [
  {
    h: "1. Veri sorumlusu",
    p: [
      "ERPİDE Yazılım A.Ş. (VKN: 3680528472, MERSİS: 0368052847200001), Ilıcabaşı Mah. Denizli Bulvarı No: 91, Efeler / Aydın.",
      "Kişisel verilerinize ilişkin talepleriniz için: kvkk@erpide.com — Genel iletişim: destek@erpide.com",
    ],
  },
  {
    h: "2. Topladığımız veriler",
    p: [
      "Hesap bilgileri: telefon numarası, görünen ad, isteğe bağlı profil fotoğrafı ve “hakkında” metni.",
      "Mesaj içeriği: gönderdiğiniz metin, fotoğraf, dosya, anket, sesli/video mesaj ve sesli/görüntülü arama sinyalleri. Mesaj içeriği uçtan uca şifrelidir; içeriği biz göremeyiz, yalnızca iletimi için taşırız.",
      "Dil tercihleri: yazma/okuma diliniz — çeviri özelliğini sunabilmek için.",
      "Ses kayıtları (yalnızca “Kendi Sesinle Çeviri / Ses Sihirbazı” özelliğini AÇARSANIZ): ses klonlama için verdiğiniz kısa ses örnekleri. Bu veri, sizi ayırt edebilen benzersiz ses iziniz olduğundan KVKK md.6 anlamında özel nitelikli (biyometrik) kişisel veri sayılabilir. Bkz. bölüm 6.",
      "Teknik veriler: cihaz türü, uygulama sürümü ve hata kayıtları (çökme teşhisi için).",
    ],
  },
  {
    h: "3. İşleme amaçları ve hukuki sebep",
    p: [
      "Mesajlaşma, sesli/görüntülü arama ve canlı çeviri hizmetini sunmak — hukuki sebep: sözleşmenin ifası (KVKK md.5/2-c).",
      "Güvenlik, kötüye kullanımın önlenmesi ve hizmetin işletilmesi — hukuki sebep: meşru menfaat (md.5/2-f) ve hukuki yükümlülük (md.5/2-ç).",
      "Yazdığınız mesajın çevrilmesi ve ses klonlama özelliği — hukuki sebep: açık rızanız (md.5/1 ve özel nitelikli veri için md.6). Bu rızaları vermeseniz de temel mesajlaşmayı kullanabilirsiniz; rızayı dilediğiniz an geri alabilirsiniz.",
    ],
  },
  {
    h: "4. Yurt dışına aktarım",
    p: [
      "Hizmeti sunmak için verilerin bir kısmı yurt dışında yerleşik hizmet sağlayıcıların altyapısında işlenir: barındırma/kimlik için Supabase (AWS — Avrupa/Frankfurt bölgesi) ve içerik dağıtımı için Cloudflare. Bu sağlayıcılar verileri yalnızca bizim adımıza ve talimatımızla işler.",
      "Yurt dışı aktarımlar KVKK md.9 uyarınca uygun güvencelere (Standart Sözleşme) dayandırılır. Verilerinizi reklam için satmıyoruz.",
    ],
  },
  {
    h: "5. Çeviri özelliği",
    p: [
      "Çeviri özelliği açıkken mesaj metniniz, kendi çeviri altyapımıza (Türkiye'deki sunucumuz) veya çeviri servisine yalnızca çeviri amacıyla iletilir; çeviri sonrası bu amaç için saklanmaz.",
    ],
  },
  {
    h: "6. Ses/biyometrik veri (isteğe bağlı özellik)",
    p: [
      "Ses klonlama özelliği yalnızca siz açıkça etkinleştirirseniz çalışır ve bunun için ayrı açık rızanız alınır. Bu özelliği hiç kullanmayabilirsiniz.",
      "Ses örnekleriniz şifreli olarak ve Türkiye'de bulunan kendi sunucumuzda tutulur; bu veriyi yurt dışına aktarmayız.",
      "Bu rızayı istediğiniz an geri alabilir, ses verinizin silinmesini talep edebilirsiniz. Rızanın geri alınması, geçmişte hukuka uygun yapılmış işlemleri etkilemez.",
    ],
  },
  {
    h: "7. Saklama ve silme",
    p: [
      "Hesap ve mesaj verileri, hesabınız aktif olduğu sürece saklanır. Hesabınızı uygulama içinden “Hesabı sil” ile kalıcı olarak silebilirsiniz; bu işlem profilinizi, cihazdaki verilerinizi ve sunucudaki kişisel kayıtlarınızı (gelen kutusu vb.) kaldırır.",
      "Ses klonlama örnekleri, özelliği kapatmanız veya rızanızı geri almanız hâlinde silinir.",
      "Yasal saklama yükümlülüğü bulunan kayıtlar, ilgili sürenin sonunda silinir/anonimleştirilir.",
    ],
  },
  {
    h: "8. Güvenlik",
    p: [
      "Mesaj ve medya içeriği uçtan uca şifrelidir (E2E); şifre çözme anahtarları yalnızca cihazlarınızdadır.",
      "Veriler aktarımda şifreli kanallar (HTTPS/TLS) üzerinden taşınır; biyometrik ses verisi ek olarak şifreli saklanır.",
      "Hesabınızın güvenliği için telefon numarası doğrulaması kullanılır.",
    ],
  },
  {
    h: "9. Çocukların gizliliği",
    p: ["Uygulama 13 yaşından küçükler için tasarlanmamıştır."],
  },
  {
    h: "10. Haklarınız (KVKK md.11)",
    p: [
      "Kişisel verinizin işlenip işlenmediğini öğrenme; işlenmişse buna ilişkin bilgi talep etme; işlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme.",
      "Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme; eksik/yanlış işlenmişse düzeltilmesini; şartlar oluştuğunda silinmesini/yok edilmesini isteme.",
      "İşlenen verilerin münhasıran otomatik sistemlerle analizi sonucu aleyhinize bir sonuç çıkmasına itiraz etme; kanuna aykırı işleme nedeniyle zarara uğrarsanız tazminini talep etme.",
      "Taleplerinizi kvkk@erpide.com adresine iletebilirsiniz; başvurunuz en geç 30 gün içinde sonuçlandırılır.",
    ],
  },
  {
    h: "11. Veri ihlali bildirimi",
    p: [
      "Kişisel verilerin hukuka aykırı biçimde ele geçirildiğini tespit edersek, mevzuatın öngördüğü süre içinde Kişisel Verileri Koruma Kurulu'na ve gerektiğinde sizlere bildirim yaparız.",
    ],
  },
  {
    h: "12. Değişiklikler ve iletişim",
    p: [
      "Bu metni güncelleyebiliriz; önemli değişiklikleri uygulama içinde bildiririz.",
      "ERPİDE Yazılım A.Ş. — destek@erpide.com",
    ],
  },
];

export default function Page() {
  return (
    <LegalPageLayout
      title="WITMA Gizlilik Politikası ve KVKK Aydınlatma Metni"
      updated={UPDATED}
    >
      <p>{INTRO}</p>
      {BLOCKS.map((b) => (
        <section key={b.h}>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">{b.h}</h2>
          {b.p.map((para, i) => (
            <p key={i} className="mb-2">
              {para}
            </p>
          ))}
        </section>
      ))}
    </LegalPageLayout>
  );
}
