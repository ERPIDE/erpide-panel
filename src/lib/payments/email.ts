import { Resend } from "resend";
import { emailHeader, emailFooter, emailSignature } from "../email-template";
import type { OrderRecord } from "../auth/user-store";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL || "bildirim@erpide.com";
const INTERNAL_BCC = "info@erpide.com";

export async function sendOrderConfirmationEmail(opts: {
  to: string;
  buyerName: string;
  order: OrderRecord;
}) {
  const { to, buyerName, order } = opts;
  const resend = getResend();
  if (!resend) {
    console.warn("[order-email] RESEND_API_KEY tanımsız:", { to, orderId: order.id });
    return { skipped: true };
  }

  const itemRows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;font-weight:600">${item.productName} — ${item.skuName}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;text-align:right;font-family:'Courier New',monospace">${item.licenseKey}</td>
    </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
<table cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin:0 auto;background-color:#ffffff">
<tr><td>${emailHeader}</td></tr>
<tr><td style="padding:32px">
  <h1 style="font-size:22px;color:#0f172a;margin:0 0 16px">Siparişiniz Onaylandı, ${buyerName}!</h1>
  <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px">
    <strong>${order.items.length} ürün</strong> içeren siparişiniz için ödemeniz alındı.
    Aşağıdaki lisans anahtarlarını ürün panellerinizden profil sayfanızdan girerek aktive edebilirsiniz.
  </p>
  <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#f9fafb;border-radius:8px;margin:24px 0">
    <thead><tr>
      <th style="padding:12px 16px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;text-align:left;background:#f3f4f6">Ürün</th>
      <th style="padding:12px 16px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;text-align:right;background:#f3f4f6">Lisans Anahtarı</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;background-color:#f9fafb;border-radius:8px">
    <tr><td style="padding:14px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb">Sipariş No</td><td style="padding:14px 16px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace">${order.id.slice(0, 8)}</td></tr>
    <tr><td style="padding:14px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb">Ödeme No</td><td style="padding:14px 16px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace">${order.paymentId || "—"}</td></tr>
    <tr><td style="padding:14px 16px;font-size:13px;color:#6b7280">Aylık Tutar</td><td style="padding:14px 16px;font-size:15px;color:#111827;font-weight:700;text-align:right">${order.totalPrice.toLocaleString("tr-TR")} ${order.currency} / ay</td></tr>
  </table>
  <div style="text-align:center;margin:32px 0">
    <a href="https://erpide.com/hesabim/lisanslarim" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px">Lisanslarımı Görüntüle &rarr;</a>
  </div>
  <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:24px 0 0">
    Sorun yaşarsan <a href="mailto:info@erpide.com" style="color:#3b82f6;text-decoration:none">info@erpide.com</a> adresine yazabilirsin.
    Aboneliğin her ay otomatik yenilenir, hesabından istediğin zaman iptal edebilirsin.
  </p>
  ${emailSignature}
</td></tr>
<tr><td>${emailFooter}</td></tr>
</table></body></html>`;

  const result = await resend.emails.send({
    from: FROM,
    to,
    bcc: INTERNAL_BCC,
    subject: `Siparişin Onaylandı — ${order.items.length} Lisans Anahtarın Hazır`,
    html,
  });
  return result;
}


/**
 * Otomatik yenileme başarısız oldu — kullanıcıya bildir + kartını güncellemesi
 * için CTA. Cron'dan çağrılır (max 1/gün idempotent).
 */
export async function sendRenewalFailedEmail(opts: {
  to: string;
  buyerName: string;
  order: OrderRecord;
  errorReason?: string;
}) {
  const { to, buyerName, order, errorReason } = opts;
  const resend = getResend();
  if (!resend) {
    console.warn("[renewal-failed-email] RESEND_API_KEY tanımsız:", { to, orderId: order.id });
    return { skipped: true };
  }

  const productLabel = order.items.map((i) => `${i.productName} — ${i.skuName}`).join(", ");
  const expiresAt = order.subscriptionExpiresAt
    ? new Date(order.subscriptionExpiresAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "yakında";

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
<table cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin:0 auto;background-color:#ffffff">
<tr><td>${emailHeader}</td></tr>
<tr><td style="padding:32px">
  <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:0 0 24px">
    <h1 style="font-size:20px;color:#92400e;margin:0 0 8px">⚠ Otomatik Ödeme Başarısız</h1>
    <p style="font-size:14px;color:#78350f;margin:0">Aboneliğinizin otomatik yenilemesi tamamlanamadı.</p>
  </div>
  <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">Merhaba <strong>${buyerName}</strong>,</p>
  <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">
    <strong>${productLabel}</strong> aboneliğinizin otomatik tahsilatı kartınızdan alınamadı.
    Mevcut lisansınız <strong>${expiresAt}</strong> tarihine kadar aktif kalacak —
    o tarihe kadar yeni ödeme yöntemi ekleyip yenilerseniz kesinti yaşamazsınız.
  </p>
  ${errorReason ? `<p style="font-size:13px;color:#6b7280;background:#f9fafb;padding:12px 16px;border-radius:6px;font-family:monospace">Hata: ${errorReason}</p>` : ""}
  <div style="text-align:center;margin:32px 0">
    <a href="https://erpide.com/hesabim/lisanslarim" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px">Kartı Güncelle / Yeniden Öde →</a>
  </div>
  <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:24px 0 0">
    Otomatik tahsilat bir sonraki gün tekrar denenecek. Sürekli başarısız olursa
    abonelik <strong>${expiresAt}</strong> tarihinde otomatik kapanır.
    Yardım için <a href="mailto:info@erpide.com" style="color:#3b82f6;text-decoration:none">info@erpide.com</a>.
  </p>
  ${emailSignature}
</td></tr>
<tr><td>${emailFooter}</td></tr>
</table></body></html>`;

  const result = await resend.emails.send({
    from: FROM,
    to,
    bcc: INTERNAL_BCC,
    subject: `⚠ Otomatik Ödeme Başarısız — ${productLabel.slice(0, 50)}`,
    html,
  });
  return result;
}


/**
 * "Aboneliğin yakında bitiyor" hatırlatması — 7 gün ve 1 gün kala 1'er kez at.
 * Sadece autoRenewEnabled=false olan (veya cancelled) abonelikler için —
 * auto-renew açıksa zaten otomatik yenilenecek, spam atmaya gerek yok.
 */
export async function sendExpiringSoonEmail(opts: {
  to: string;
  buyerName: string;
  order: OrderRecord;
  daysLeft: number;
}) {
  const { to, buyerName, order, daysLeft } = opts;
  const resend = getResend();
  if (!resend) {
    console.warn("[expiring-email] RESEND_API_KEY tanımsız:", { to, orderId: order.id });
    return { skipped: true };
  }

  const productLabel = order.items.map((i) => `${i.productName} — ${i.skuName}`).join(", ");
  const expiresAt = order.subscriptionExpiresAt
    ? new Date(order.subscriptionExpiresAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "yakında";
  const cancelled = !!order.cancelledAt;

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
<table cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin:0 auto;background-color:#ffffff">
<tr><td>${emailHeader}</td></tr>
<tr><td style="padding:32px">
  <div style="background:#dbeafe;border-left:4px solid #3b82f6;padding:16px;border-radius:8px;margin:0 0 24px">
    <h1 style="font-size:20px;color:#1e3a8a;margin:0 0 8px">⏰ Aboneliğin ${daysLeft === 1 ? "Yarın" : `${daysLeft} Gün Sonra`} Bitiyor</h1>
    <p style="font-size:14px;color:#1e40af;margin:0">${cancelled ? "İptal ettiğin" : "Otomatik yenileme kapalı olan"} aboneliğin ${expiresAt} tarihinde sona erecek.</p>
  </div>
  <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">Merhaba <strong>${buyerName}</strong>,</p>
  <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">
    <strong>${productLabel}</strong> aboneliğin <strong>${expiresAt}</strong> tarihinde otomatik olarak kapanacak.
    Devam etmek istersen tek tıkla yenileyebilirsin — verilerinde, ayarlarında, lisans anahtarında
    hiçbir kayıp olmaz, kaldığın yerden devam edersin.
  </p>
  <div style="text-align:center;margin:32px 0">
    <a href="https://erpide.com/hesabim/lisanslarim" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px">Yenile →</a>
  </div>
  <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:24px 0 0">
    Süresi dolduktan sonra da hesabın açık kalır — tekrar abone olmak istediğinde geri dönebilirsin.
    Yardım için <a href="mailto:info@erpide.com" style="color:#3b82f6;text-decoration:none">info@erpide.com</a>.
  </p>
  ${emailSignature}
</td></tr>
<tr><td>${emailFooter}</td></tr>
</table></body></html>`;

  const result = await resend.emails.send({
    from: FROM,
    to,
    bcc: INTERNAL_BCC,
    subject: `⏰ ${daysLeft === 1 ? "Yarın" : `${daysLeft} gün sonra`} bitiyor — ${productLabel.slice(0, 40)}`,
    html,
  });
  return result;
}
