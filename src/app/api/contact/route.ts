import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(250),
  company: z.string().max(250).optional(),
  subject: z.string().max(120).optional(),
  message: z.string().min(5).max(5000),
});

const SUBJECT_LABEL: Record<string, string> = {
  "1c-erp": "1C:ERP",
  "1c-drive": "1C:Drive",
  "finanserpide": "FinansERPIDE",
  "captchaerpide": "CaptchaERPIDE",
  "custom": "Özel Yazılım / Entegrasyon",
  "other": "Diğer",
};


/**
 * POST /api/contact — public contact form on /iletisim.
 * Forwards to sales@erpide.com via Resend; replies to the buyer's address
 * so support staff can hit "Reply" without copy/paste.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, email, company, subject, message } = parsed.data;
  const subjectLabel = subject ? (SUBJECT_LABEL[subject] || subject) : "Konu belirtilmedi";

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Don't 500 — log it. The form still succeeded from the user's perspective.
    console.error("[contact] RESEND_API_KEY missing, dropping message", { name, email, subject });
    return NextResponse.json({ ok: true, queued: false });
  }
  const resend = new Resend(apiKey);

  const html = `
<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f5f5f7;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="padding:20px 24px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff">
      <h2 style="margin:0;font-size:18px">Yeni İletişim Formu Mesajı</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:.85">Konu: ${subjectLabel}</p>
    </div>
    <div style="padding:24px;color:#111827">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#6b7280;width:120px">Gönderen</td><td style="padding:8px 0"><strong>${escapeHtml(name)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">E-posta</td><td style="padding:8px 0"><a href="mailto:${escapeHtml(email)}" style="color:#2563eb;text-decoration:none">${escapeHtml(email)}</a></td></tr>
        ${company ? `<tr><td style="padding:8px 0;color:#6b7280">Şirket</td><td style="padding:8px 0">${escapeHtml(company)}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Mesaj</td><td style="padding:8px 0;white-space:pre-wrap;line-height:1.6">${escapeHtml(message)}</td></tr>
      </table>
      <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
        Bu mesaj erpide.com /iletisim formundan gönderildi. Cevap yazarsanız doğrudan gönderene iletilir.
      </p>
    </div>
  </div>
</body></html>`.trim();

  try {
    await resend.emails.send({
      from: "ERPIDE <noreply@erpide.com>",
      to: ["satis@erpide.com", "info@erpide.com"],
      replyTo: email,
      subject: `[ERPIDE] ${subjectLabel} — ${name}`,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact] resend error:", e);
    return NextResponse.json({ error: "Mesaj gönderilemedi" }, { status: 500 });
  }
}


function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
