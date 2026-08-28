/**
 * Fatura alıcı kimliği testleri.
 *
 * DÜZELTİLEN GERÇEK HATA: fatura alıcısı `user.*` alanlarından okunuyordu.
 * Checkout seçilen adresi profile kopyaladığı için çoğu zaman doğru
 * çalışıyordu — ama kullanıcı ödemeden sonra adresini değiştirirse, iki
 * sipariş çakışırsa ya da fatura sonradan kesilirse VERGİ BELGESİNE YANLIŞ
 * VKN yazılabiliyordu. Artık dayanak siparişte donmuş anlık görüntü.
 *
 * Çalıştırma: npx tsx src/lib/payments/fatura-kimlik.test.ts
 */
export {};

import type { SavedAddress, UserRecord, OrderRecord } from "@/lib/auth/user-store";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? " — " + detail : ""}`); }
}
function eq(name: string, actual: unknown, expected: unknown) {
  check(name, JSON.stringify(actual) === JSON.stringify(expected),
    `beklenen ${JSON.stringify(expected)}, gelen ${JSON.stringify(actual)}`);
}

/**
 * `subscription-invoice.ts` içindeki alıcı kimliği çıkarımının AYNISI.
 * Orası ağa çıkan bir fonksiyon olduğu için mantık burada birebir
 * yansıtılarak sınanıyor.
 */
function aliciCikar(order: Pick<OrderRecord, "billingSnapshot">, user: Partial<UserRecord>) {
  const snap = order.billingSnapshot;
  const kurumsal = snap ? snap.type === "corporate" : !!user.companyName?.trim();

  const taxNumber = (
    snap
      ? (kurumsal ? snap.taxNumber : snap.identityNumber) || ""
      : user.taxNumber || user.identityNumber || ""
  ).replace(/\D/g, "") || null;

  const buyerName = snap
    ? (kurumsal ? (snap.companyName || "").trim() : `${snap.firstName} ${snap.lastName}`.trim())
    : (user.companyName?.trim() || `${user.name} ${user.surname}`.trim());

  return {
    name: buyerName || `${user.name} ${user.surname}`.trim(),
    taxNumber,
    taxOffice: (kurumsal && snap?.taxOffice) || null,
    city: snap?.city || user.city || null,
    country: snap?.country === "Turkey" || !snap?.country ? "TR" : snap.country,
  };
}

const SIRKET: SavedAddress = {
  id: "a1", label: "Ofis", type: "corporate",
  firstName: "Ali", lastName: "Yılmaz", phone: "5551112233",
  companyName: "ÖRNEK YAZILIM A.Ş.", taxNumber: "1234567890", taxOffice: "Güzelhisar",
  country: "Turkey", city: "Aydın", district: "Efeler", fullAddress: "Test Mah. 1 Sk. No:1",
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const SAHIS: SavedAddress = {
  id: "a2", label: "Ev", type: "individual",
  firstName: "Ali", lastName: "Yılmaz", phone: "5551112233",
  identityNumber: "12345678901",
  country: "Turkey", city: "İzmir", district: "Konak", fullAddress: "Ev Mah. 2 Sk. No:2",
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};

// Profilde ESKI bir kurumsal alis kalmis
const KULLANICI: Partial<UserRecord> = {
  name: "Ali", surname: "Yılmaz", email: "a@b.com",
  companyName: "ESKİ FİRMA LTD.", taxNumber: "9998887770",
  identityNumber: "12345678901", city: "Ankara",
};

function testKurumsal() {
  console.log("\n[1] Kurumsal adres");
  const r = aliciCikar({ billingSnapshot: SIRKET }, KULLANICI);
  eq("ünvan", r.name, "ÖRNEK YAZILIM A.Ş.");
  eq("VKN", r.taxNumber, "1234567890");
  eq("vergi dairesi", r.taxOffice, "Güzelhisar");
  eq("şehir adresten", r.city, "Aydın");
  // Profildeki ESKI firma sizmamali
  check("eski firma sızmadı", r.name !== "ESKİ FİRMA LTD.");
  check("eski VKN sızmadı", r.taxNumber !== "9998887770");
}

function testSahis() {
  console.log("\n[2] Şahıs adresi — ASIL TEHLİKE");
  const r = aliciCikar({ billingSnapshot: SAHIS }, KULLANICI);
  // Onceki davranis: profildeki ESKI kurumsal bilgiyi kullanip vergi
  // belgesini YANLIS FIRMAYA keserdi.
  eq("ad soyad", r.name, "Ali Yılmaz");
  eq("TCKN", r.taxNumber, "12345678901");
  eq("vergi dairesi yok", r.taxOffice, null);
  eq("şehir adresten", r.city, "İzmir");
  check("firma ünvanı kullanılmadı", r.name !== "ESKİ FİRMA LTD.");
  check("kurumsal VKN kullanılmadı", r.taxNumber !== "9998887770");
}

function testSnapshotYok() {
  console.log("\n[3] Eski siparişler (snapshot yok) — davranış korunuyor");
  const r = aliciCikar({ billingSnapshot: undefined }, KULLANICI);
  // Geriye donuk uyum: snapshot'siz eski kayitlar eskisi gibi calismali.
  eq("profildeki ünvan", r.name, "ESKİ FİRMA LTD.");
  eq("profildeki VKN", r.taxNumber, "9998887770");
  eq("profildeki şehir", r.city, "Ankara");
}

function testTemizlik() {
  console.log("\n[4] Alan temizliği");
  // VKN'de bosluk/tire gelirse temizlenmeli
  const kirli = { ...SIRKET, taxNumber: "123 456-78 90" };
  eq("VKN rakamlaştı", aliciCikar({ billingSnapshot: kirli }, KULLANICI).taxNumber, "1234567890");

  // Kurumsal ama unvan bos -> ad soyada dus, bos isim gonderme
  const unvansiz = { ...SIRKET, companyName: "  " };
  eq("boş ünvan yerine ad soyad", aliciCikar({ billingSnapshot: unvansiz }, KULLANICI).name, "Ali Yılmaz");

  // TCKN'siz sahis -> null, uydurma deger yok
  const kimliksiz = { ...SAHIS, identityNumber: undefined };
  eq("TCKN yoksa null", aliciCikar({ billingSnapshot: kimliksiz }, KULLANICI).taxNumber, null);

  // Ulke kodu
  eq("Turkey → TR", aliciCikar({ billingSnapshot: SIRKET }, KULLANICI).country, "TR");
  eq("yurtdışı korunur",
    aliciCikar({ billingSnapshot: { ...SIRKET, country: "Germany" } }, KULLANICI).country, "Germany");
}

function testIkiSiparis() {
  console.log("\n[5] İki farklı sipariş, iki farklı kimlik");
  // Ayni kullanici once sirket sonra sahis adina alsa, HER SIPARIS kendi
  // kimligini tasimali — profil tek deger tuttugu icin bu ancak snapshot ile
  // mumkun.
  const s1 = aliciCikar({ billingSnapshot: SIRKET }, KULLANICI);
  const s2 = aliciCikar({ billingSnapshot: SAHIS }, KULLANICI);
  eq("1. sipariş VKN", s1.taxNumber, "1234567890");
  eq("2. sipariş TCKN", s2.taxNumber, "12345678901");
  check("ikisi farklı", s1.taxNumber !== s2.taxNumber);
}

function main() {
  testKurumsal(); testSahis(); testSnapshotYok(); testTemizlik(); testIkiSiparis();
  console.log(`\n${pass} geçti, ${fail} başarısız`);
  if (fail > 0) process.exit(1);
}
main();
