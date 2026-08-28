/**
 * Abonelik satışı → ERPİDE A.Ş.'nin FinansERPIDE hesabında otomatik fatura.
 *
 * Ödeme onaylandığında çağrılır. Karşı taraf cariyi açar, satış faturasını
 * keser, muhasebeleştirir ve entegratöre gönderir; bize resmi PDF'i döner.
 *
 * Bu çağrı ASLA ödeme akışını düşürmemeli: müşteri parayı ödedi, lisansı
 * açıldı. Fatura kesilemezse loglanır ve elle tamamlanır — ödemeyi geri
 * çevirmek ya da müşteriyi hata ekranına düşürmek çok daha kötü olurdu.
 */
import { getSku, getProductOfSku } from "@/lib/products";
import { priceForCharge } from "@/lib/currency";
import type { OrderItem, OrderRecord, UserRecord } from "@/lib/auth/user-store";

const BASE = process.env.FINANSERPIDE_API_BASE_URL || "https://finans.erpide.com";
const SECRET = process.env.PANEL_FINANSERPIDE_WEBHOOK_SECRET;

export interface SubscriptionInvoiceResult {
  ok: boolean;
  documentNumber?: string;
  documentType?: string;
  total?: number;
  sent?: boolean;
  pdfBase64?: string | null;
  warning?: string;
  error?: string;
}

/** Fatura satırı açıklaması: müşteri ne aldığını faturada net görsün. */
function describeItem(item: OrderItem): string {
  const sku = getSku(item.skuId);
  const product = getProductOfSku(item.skuId);
  const productName = product?.name || item.productName;
  const skuName = sku?.name || item.skuName;
  const cycle = sku?.cycle === "yearly" ? "Yıllık" : "Aylık";
  return `${productName} — ${skuName} (${cycle} Abonelik)`;
}

/**
 * Faturayı kestirir.
 *
 * Tutarlar KDV HARİÇ gönderilir; KDV'yi ürün tarafı mevzuata göre hesaplar
 * (yurtiçi %20, yurtdışı hizmet ihracı istisnası %0). Liste fiyatlarımız da
 * KDV hariç yayımlanıyor, ikisi tutarlı.
 */
export async function issueSubscriptionInvoice(
  order: OrderRecord,
  user: UserRecord
): Promise<SubscriptionInvoiceResult> {
  if (!SECRET) {
    return { ok: false, error: "PANEL_FINANSERPIDE_WEBHOOK_SECRET tanımlı değil" };
  }

  // Ücretsiz satırlar (deneme, admin hediyesi) faturalanmaz.
  const billable = order.items.filter((it) => (it.price ?? 0) > 0);
  if (billable.length === 0) {
    return { ok: true, warning: "Faturalanacak ücretli satır yok (deneme/bedelsiz)." };
  }

  const lines = billable.map((item) => {
    const sku = getSku(item.skuId);
    // Tahsilat TL yapılıyor; faturayı da tahsil edilen tutar üzerinden kesiyoruz
    // ki muhasebe ile banka birbirini tutsun.
    const unitPrice = sku ? priceForCharge(sku).price : item.price;
    return {
      skuId: item.skuId,
      description: describeItem(item),
      quantity: 1,
      unitPrice,
    };
  });

  // Fatura kimliği ÖNCE siparişin anlık görüntüsünden okunuyor.
  //
  // Önceden yalnızca `user.*` alanları kullanılıyordu; checkout seçilen adresi
  // profile kopyaladığı için çoğu zaman doğru çalışıyordu ama kırılgandı:
  // kullanıcı ödemeden sonra adresini değiştirse, iki sipariş çakışsa ya da
  // fatura sonradan (yenileme cron'u, elle tekrar) kesilse vergi belgesine
  // YANLIŞ VKN yazılabilirdi. Anlık görüntü siparişte donmuş durumda.
  const snap = order.billingSnapshot;
  const kurumsal = snap ? snap.type === "corporate" : !!user.companyName?.trim();

  const taxNumber = (
    snap
      ? (kurumsal ? snap.taxNumber : snap.identityNumber) || ""
      : user.taxNumber || user.identityNumber || ""
  ).replace(/\D/g, "") || null;

  const buyerName = snap
    ? (kurumsal
        ? (snap.companyName || "").trim()
        : `${snap.firstName} ${snap.lastName}`.trim())
    : (user.companyName?.trim() || `${user.name} ${user.surname}`.trim());

  const payload = {
    orderId: order.id,
    buyer: {
      name: buyerName || `${user.name} ${user.surname}`.trim(),
      taxNumber,
      // Vergi dairesi yalnizca kurumsal alicida anlamli.
      taxOffice: (kurumsal && snap?.taxOffice) || null,
      email: user.email,
      phone: snap?.phone || user.gsmNumber || null,
      address: snap
        ? [snap.fullAddress, snap.district].filter(Boolean).join(" ") || null
        : [user.address, user.district].filter(Boolean).join(" ") || null,
      city: snap?.city || user.city || null,
      country: snap?.country === "Turkey" || !snap?.country ? "TR" : snap.country,
    },
    lines,
    currency: "TRY",
    notes: `erpide.com sipariş ${order.id}`,
    send: true,
  };

  try {
    const res = await fetch(`${BASE}/api/internal/sales-invoice`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-webhook-secret": SECRET },
      body: JSON.stringify(payload),
      cache: "no-store",
      // Fatura kesimi + UBL + entegratör + PDF: tek turda birkaç saniye
      // sürebilir. Ödeme akışını sonsuza kadar bekletmemek için üst sınır.
      signal: AbortSignal.timeout(45_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: (data as { error?: string })?.error || `HTTP ${res.status}` };
    }
    return { ok: true, ...(data as object) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
