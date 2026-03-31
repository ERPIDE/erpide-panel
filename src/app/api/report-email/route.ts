import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { emailSignature, emailHeader, emailFooter } from "@/lib/email-template";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(request: NextRequest) {
  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { toEmail, clientName, project, dateRange, pdfBase64, pdfFilename } = body;

    if (!toEmail) {
      return NextResponse.json({ error: "Email adresi gerekli" }, { status: 400 });
    }

    const subject = `[ERPIDE] Haftalik Gelistirme Dokumu - ${clientName || project} (${dateRange})`;

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f8f9fa">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    ${emailHeader}
    <div style="background:white;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">
        Sayin ${clientName || "Degerli Musterimiz"},
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px">
        <strong>${dateRange}</strong> tarihleri arasindaki haftalik gelistirme dokumunuz ekte PDF olarak iletilmistir.
        Donem icerisinde gerceklestirilen calismalarin ozeti ve detaylari raporda yer almaktadir.
      </p>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center">
        <p style="margin:0 0 4px;font-size:14px;color:#0369a1;font-weight:600">&#128206; PDF Eki</p>
        <p style="margin:0;font-size:13px;color:#0c4a6e">${pdfFilename || "Haftalik_Dokum.pdf"}</p>
      </div>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 8px">
        Detayli bilgi ve gorev takibi icin ERPIDE panelinizi ziyaret edebilirsiniz:
      </p>
      <a href="https://erpide.com/panel" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0">
        Panele Git &rarr;
      </a>
      <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:24px 0 0">Sorulariniz icin bize her zaman ulasabilirsiniz.</p>
      <p style="font-size:14px;color:#374151;margin:4px 0 0">Saygilarimizla,</p>
      ${emailSignature}
    </div>
    ${emailFooter}
  </div>
</body></html>`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "ERPIDE <onboarding@resend.dev>";

    // Build attachments array
    const attachments = pdfBase64 ? [{
      filename: pdfFilename || "ERPIDE_Haftalik_Dokum.pdf",
      content: pdfBase64,
    }] : [];

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
      attachments,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send copy to admin
    try {
      await resend.emails.send({
        from: fromEmail,
        to: ["info@erpide.com"],
        subject: `[Kopya] ${subject}`,
        html,
        attachments,
      });
    } catch {}

    return NextResponse.json({ id: data?.id, message: "Rapor emaili gonderildi" });
  } catch (error) {
    console.error("Report email error:", error);
    return NextResponse.json({ error: "Email gonderilemedi" }, { status: 500 });
  }
}
