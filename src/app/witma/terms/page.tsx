// Kaynak: witma repo `lib/legal.js` (TERMS). Güncellerken oradan senkronla.
// Mağaza (App Store / Play) incelemesi için canlı URL: erpide.com/witma/terms
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata = {
  title: "WITMA Kullanım Şartları | ERPIDE",
  description: "WITMA uygulaması kullanım şartları.",
};

const UPDATED = "14 Ağustos 2026";

const INTRO =
  "WITMA uygulamasını kullanarak bu şartları kabul etmiş olursunuz. Lütfen dikkatlice okuyun.";

const BLOCKS: { h: string; p: string[] }[] = [
  {
    h: "1. Hizmet",
    p: [
      "WITMA, dil engelini kaldıran bir mesajlaşma ve arama uygulamasıdır. Hizmeti “olduğu gibi” sunarız.",
    ],
  },
  {
    h: "2. Hesap",
    p: [
      "Hesap oluşturmak için geçerli bir telefon numarası gerekir. Hesabınızın güvenliğinden siz sorumlusunuz.",
      "Hesabınızı istediğiniz zaman uygulama içinden silebilirsiniz.",
    ],
  },
  {
    h: "3. Kabul edilebilir kullanım",
    p: [
      "Yasa dışı, taciz edici, nefret içeren, spam veya başkalarının haklarını ihlal eden içerik gönderemezsiniz.",
      "Başkasının sesini/görüntüsünü izinsiz taklit etmek veya yanıltıcı/kötü niyetli içerik üretmek için ses klonlama özelliğini kullanamazsınız.",
      "Uygulamayı kötüye kullanan hesaplar askıya alınabilir.",
    ],
  },
  {
    h: "4. İçerik",
    p: [
      "Gönderdiğiniz içerikten siz sorumlusunuz. İçeriğinizi yalnızca hizmeti sunmak için işleriz.",
    ],
  },
  {
    h: "5. Sorumluluğun sınırı",
    p: [
      "Hizmet kesintisiz veya hatasız olduğunu garanti etmeyiz. Yasaların izin verdiği ölçüde dolaylı zararlardan sorumlu değiliz.",
    ],
  },
  {
    h: "6. Değişiklikler",
    p: ["Bu şartları güncelleyebiliriz. Önemli değişiklikleri uygulama içinde bildiririz."],
  },
  {
    h: "7. İletişim",
    p: ["ERPİDE Yazılım A.Ş. — destek@erpide.com"],
  },
];

export default function Page() {
  return (
    <LegalPageLayout title="WITMA Kullanım Şartları" updated={UPDATED}>
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
