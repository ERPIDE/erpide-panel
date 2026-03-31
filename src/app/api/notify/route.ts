import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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
    const { type, taskTitle, taskId, project, status, comment } = body;

    const client = clientEmails[project];
    if (!client) {
      return NextResponse.json({ error: "Bilinmeyen proje" }, { status: 400 });
    }

    let subject = "";
    let html = "";

    if (type === "task_completed") {
      subject = `[ERPIDE] Gorev Tamamlandi: ${taskTitle}`;
      html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ERPIDE</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Gorev Tamamlandi</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px;">
            <p>Sayin ${client.name},</p>
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-weight: 600; color: #166534;">#${taskId} - ${taskTitle}</p>
              <p style="margin: 8px 0 0; color: #15803d;">Durum: Tamamlandi &#10003;</p>
            </div>
            <p>Goreviniz basariyla tamamlanmistir. Detaylari gormek icin ERPIDE panelinizi ziyaret edebilirsiniz.</p>
            <a href="https://erpide.com/panel" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">Panele Git</a>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 12px;">Bu email ERPIDE proje yonetim sistemi tarafindan otomatik gonderilmistir.</p>
          </div>
        </div>
      `;
    } else if (type === "new_comment") {
      subject = `[ERPIDE] Yeni Yorum: ${taskTitle}`;
      html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ERPIDE</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Yeni Yorum</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px;">
            <p>Sayin ${client.name},</p>
            <p><strong>#${taskId} - ${taskTitle}</strong> gorevine yeni bir yorum eklendi:</p>
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #1e40af;">${comment || ""}</p>
            </div>
            <a href="https://erpide.com/panel" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">Panele Git</a>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 12px;">Bu email ERPIDE proje yonetim sistemi tarafindan otomatik gonderilmistir.</p>
          </div>
        </div>
      `;
    } else if (type === "status_change") {
      const statusLabels: Record<string, string> = {
        todo: "Bekliyor",
        in_progress: "Devam Ediyor",
        review: "Incelemede",
        done: "Tamamlandi",
      };
      subject = `[ERPIDE] Durum Guncellendi: ${taskTitle}`;
      html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ERPIDE</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Durum Guncellendi</p>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px;">
            <p>Sayin ${client.name},</p>
            <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-weight: 600;">#${taskId} - ${taskTitle}</p>
              <p style="margin: 8px 0 0;">Yeni durum: <strong>${statusLabels[status] || status}</strong></p>
            </div>
            <a href="https://erpide.com/panel" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">Panele Git</a>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 12px;">Bu email ERPIDE proje yonetim sistemi tarafindan otomatik gonderilmistir.</p>
          </div>
        </div>
      `;
    } else {
      return NextResponse.json({ error: "Bilinmeyen bildirim tipi" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "ERPIDE <onboarding@resend.dev>",
      to: [client.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id, message: "Email gonderildi" });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json({ error: "Email gonderilemedi" }, { status: 500 });
  }
}
