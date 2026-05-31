import { Resend } from "resend";
import { emailHeader, emailFooter, emailSignature } from "../email-template";
import type { Plan } from "./plans";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL || "bildirim@erpide.com";
const INTERNAL_BCC = "info@erpide.com";

export async function sendLicenseEmail(opts: {
  to: string;
  buyerName: string;
  plan: Plan;
  licenseKey: string;
  paymentId: string;
}) {
  const { to, buyerName, plan, licenseKey, paymentId } = opts;
  const resend = getResend();
  if (!resend) {
    console.warn("[license-email] RESEND_API_KEY tanımsız, email gönderilmedi:", { to, licenseKey });
    return { skipped: true };
  }

  const portalUrl =
    plan.productId === "finanserpide"
      ? "https://finans.erpide.com/lisans"
      : "https://captcha.erpide.com/login";

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
<table cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;margin:0 auto;background-color:#ffffff">
<tr><td>${emailHeader}</td></tr>
<tr><td style="padding:32px">
  <h1 style="font-size:22px;color:#0f172a;margin:0 0 16px">Hoş geldin ${buyerName}!</h1>
  <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px">
    <strong>${plan.productName} ${plan.name}</strong> aboneliğin için ödemeni aldık.
    Lisans anahtarın aşağıda. Bu anahtarı ürün panelinde profilinden gir ve sistemi hemen kullanmaya başla.
  </p>
  <div style="background-color:#f8fafc;border:2px dashed #3b82f6;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
    <p style="font-size:12px;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Lisans Anahtarı</p>
    <p style="font-family:'Courier New',monospace;font-size:18px;color:#0f172a;font-weight:bold;margin:0;letter-spacing:1px">${licenseKey}</p>
  </div>
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;background-color:#f9fafb;border-radius:8px">
    <tr><td style="padding:14px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb">Ürün</td><td style="padding:14px 16px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb">${plan.productName}</td></tr>
    <tr><td style="padding:14px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb">Plan</td><td style="padding:14px 16px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb">${plan.name} (Aylık)</td></tr>
    <tr><td style="padding:14px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb">Tutar</td><td style="padding:14px 16px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #e5e7eb">${plan.price} ${plan.currency} / ay</td></tr>
    <tr><td style="padding:14px 16px;font-size:13px;color:#6b7280">Ödeme Referansı</td><td style="padding:14px 16px;font-size:13px;color:#111827;font-weight:600">${paymentId}</td></tr>
  </table>
  <div style="text-align:center;margin:32px 0">
    <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px">Ürüne Git ve Lisansı Aktive Et &rarr;</a>
  </div>
  <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:24px 0 0">
    Sorun yaşarsan <a href="mailto:info@erpide.com" style="color:#3b82f6;text-decoration:none">info@erpide.com</a> adresine yazabilirsin.
    Aboneliğin her ay otomatik yenilenir, panelinden iptal edebilirsin.
  </p>
  ${emailSignature}
</td></tr>
<tr><td>${emailFooter}</td></tr>
</table></body></html>`;

  const result = await resend.emails.send({
    from: FROM,
    to,
    bcc: INTERNAL_BCC,
    subject: `${plan.productName} ${plan.name} — Lisans Anahtarın Hazır`,
    html,
  });
  return result;
}
