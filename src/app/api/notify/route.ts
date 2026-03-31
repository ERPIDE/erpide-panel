import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { LOGO_URL, emailSignature, emailFooter } from "@/lib/email-template";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const clientEmails: Record<string, { name: string; email: string }> = {
  CANIAS: { name: "Sirmersan", email: "info@sirmersan.com" },
  "1C ERP": { name: "ATM Constructor", email: "info@atmconstructor.kz" },
};

// POST /api/notify — send email notification
export async function POST(request: NextRequest) {
  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { type, taskTitle, taskId, project, status, comment, toEmail } = body;

    const client = clientEmails[project];
    const recipientEmail = toEmail || client?.email;
    const recipientName = client?.name || "Musteri";

    if (!recipientEmail) {
      return NextResponse.json({ error: "Email adresi belirtilmedi" }, { status: 400 });
    }

    let subject = "";
    let contentBlock = "";

    if (type === "task_completed") {
      subject = `[ERPIDE] Gorev Tamamlandi: ${taskTitle}`;
      contentBlock = `
        <p style="font-size:15px;color:#374151;line-height:1.6">Sayin ${recipientName},</p>
        <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:16px 0;border-radius:0 8px 8px 0">
          <p style="margin:0;font-weight:600;color:#166534">#${taskId} - ${taskTitle}</p>
          <p style="margin:8px 0 0;color:#15803d">Durum: Tamamlandi &#10003;</p>
        </div>
        <p style="font-size:15px;color:#374151;line-height:1.6">Goreviniz basariyla tamamlanmistir. Detaylari gormek icin ERPIDE panelinizi ziyaret edebilirsiniz.</p>
      `;
    } else if (type === "new_comment") {
      subject = `[ERPIDE] Yeni Yorum: ${taskTitle}`;
      contentBlock = `
        <p style="font-size:15px;color:#374151;line-height:1.6">Sayin ${recipientName},</p>
        <p style="font-size:15px;color:#374151"><strong>#${taskId} - ${taskTitle}</strong> gorevine yeni bir yorum eklendi:</p>
        <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:16px 0;border-radius:0 8px 8px 0">
          <p style="margin:0;color:#1e40af">${comment || ""}</p>
        </div>
      `;
    } else if (type === "status_change") {
      const statusLabels: Record<string, string> = { todo: "Bekliyor", in_progress: "Devam Ediyor", review: "Incelemede", done: "Tamamlandi" };
      subject = `[ERPIDE] Durum Guncellendi: ${taskTitle}`;
      contentBlock = `
        <p style="font-size:15px;color:#374151;line-height:1.6">Sayin ${recipientName},</p>
        <div style="background:#fefce8;border-left:4px solid #eab308;padding:16px;margin:16px 0;border-radius:0 8px 8px 0">
          <p style="margin:0;font-weight:600">#${taskId} - ${taskTitle}</p>
          <p style="margin:8px 0 0">Yeni durum: <strong>${statusLabels[status] || status}</strong></p>
        </div>
      `;
    } else {
      return NextResponse.json({ error: "Bilinmeyen bildirim tipi" }, { status: 400 });
    }

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f8f9fa">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;border-bottom:3px solid #3b82f6">
      <a href="https://erpide.com" style="text-decoration:none"><img src="${LOGO_URL}" alt="ERPIDE" width="160" style="display:inline-block" /></a>
    </div>
    <div style="background:white;padding:28px 32px;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
      ${contentBlock}
      <a href="https://erpide.com/panel" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0">Panele Git &rarr;</a>
      <p style="font-size:14px;color:#374151;margin:24px 0 0">Saygilarimizla,</p>
      ${emailSignature}
    </div>
    ${emailFooter}
  </div>
</body></html>`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "ERPIDE <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send copy to admin (don't block if fails)
    try {
      await resend.emails.send({
        from: fromEmail,
        to: ["info@erpide.com"],
        subject: `[Kopya] ${subject}`,
        html,
      });
    } catch (e) {
      console.error("Admin copy failed:", e);
    }

    return NextResponse.json({ id: data?.id, message: "Email gonderildi" });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json({ error: "Email gonderilemedi" }, { status: 500 });
  }
}
