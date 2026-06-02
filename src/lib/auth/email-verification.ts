import { randomBytes } from "crypto";
import { Resend } from "resend";
import { emailLogo, emailSignature } from "../email-template";

const VERIFICATION_TTL_HOURS = 24;

export function generateVerificationToken(): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_HOURS * 60 * 60 * 1000).toISOString();
  return { token, expiresAt };
}

export function isTokenExpired(expiresAt?: string): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://erpide.com";
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL || "bildirim@erpide.com";

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  token: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const { to, name, token } = opts;
  const resend = getResend();
  if (!resend) {
    console.warn("[verify-email] RESEND_API_KEY tanımsız, mail gönderilmiyor:", { to });
    return { ok: false, skipped: true };
  }

  const verifyUrl = `${getBaseUrl()}/dogrula?token=${token}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>E-posta Doğrulama</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
  <table cellpadding="0" cellspacing="0" width="100%" style="background:#f3f4f6;padding:24px 0">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" width="600" style="background:#fff;border-radius:12px;padding:32px;max-width:600px">
        <tr><td>${emailLogo}</td></tr>
        <tr><td style="padding-top:24px">
          <h1 style="font-size:22px;color:#111827;margin:0 0 12px">Hoş geldin ${name},</h1>
          <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px">
            ERPIDE hesabını oluşturdun. Hesabını aktif etmek için aşağıdaki butona tıklayarak e-posta adresini doğrula. Bu adım, hesabının güvenliği için zorunludur.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:linear-gradient(90deg,#2563eb,#9333ea);border-radius:8px"><a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-weight:600;text-decoration:none;font-size:15px">E-postamı Doğrula</a></td></tr></table>
          <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:16px 0">
            Buton çalışmazsa şu bağlantıyı tarayıcına yapıştır:<br>
            <a href="${verifyUrl}" style="color:#2563eb;word-break:break-all">${verifyUrl}</a>
          </p>
          <p style="font-size:12px;color:#9ca3af;margin:24px 0 0">
            Bu bağlantı ${VERIFICATION_TTL_HOURS} saat geçerlidir. Eğer ERPIDE'de hesap oluşturma talebi vermediyseniz bu maili güvenle silebilirsiniz.
          </p>
        </td></tr>
        <tr><td>${emailSignature}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: "ERPIDE — E-posta adresini doğrula",
      html,
    });
    if (result.error) {
      console.error("[verify-email] resend error:", result.error);
      return { ok: false, error: String(result.error.message ?? result.error) };
    }
    return { ok: true };
  } catch (e) {
    console.error("[verify-email] send failed:", e);
    return { ok: false, error: String(e) };
  }
}
