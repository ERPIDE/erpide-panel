import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const signature = `
<table cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Arial,sans-serif;margin-top:24px;border-top:2px solid #3b82f6;padding-top:16px">
  <tr>
    <td style="padding-right:16px;vertical-align:top">
      <div style="width:60px;height:60px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center">
        <span style="color:white;font-weight:800;font-size:14px;display:block;text-align:center;line-height:60px">ERP<span style="color:#fbbf24">IDE</span></span>
      </div>
    </td>
    <td style="vertical-align:top">
      <p style="margin:0;font-weight:700;font-size:14px;color:#1f2937">ERPIDE YAZILIM A.S.</p>
      <p style="margin:2px 0 0;font-size:12px;color:#6b7280">ERP Cozumleri Hakkinda Her Sey</p>
      <table cellpadding="0" cellspacing="0" style="margin-top:8px">
        <tr>
          <td style="font-size:12px;color:#6b7280;padding-right:12px">
            <span style="color:#3b82f6">&#9993;</span> info@erpide.com
          </td>
          <td style="font-size:12px;color:#6b7280;padding-right:12px">
            <span style="color:#3b82f6">&#9742;</span> 0554 694 34 09
          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-size:12px;color:#6b7280;padding-top:2px">
            <span style="color:#3b82f6">&#127760;</span> <a href="https://erpide.com" style="color:#3b82f6;text-decoration:none">www.erpide.com</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

export async function POST(request: NextRequest) {
  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { toEmail, clientName, project, dateRange, reportHtml } = body;

    if (!toEmail) {
      return NextResponse.json({ error: "Email adresi gerekli" }, { status: 400 });
    }

    const subject = `[ERPIDE] Haftalik Gelistirme Dokumu - ${clientName || project} (${dateRange})`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f8f9fa">
  <div style="max-width:680px;margin:0 auto;padding:24px">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);padding:32px;border-radius:16px 16px 0 0;text-align:center">
      <h1 style="color:white;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px">
        ERP<span style="color:#fbbf24">IDE</span>
      </h1>
      <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px;letter-spacing:2px">ERP COZUMLERI HAKKINDA HER SEY</p>
    </div>

    <!-- Body -->
    <div style="background:white;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px">
        Sayin ${clientName || "Degerli Musterimiz"},
      </p>

      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px">
        <strong>${dateRange}</strong> tarihleri arasindaki haftalik gelistirme dokumunuz asagida iletilmistir.
        Donem icerisinde gerceklestirilen calismalarin ozeti ve detaylari raporda yer almaktadir.
      </p>

      <!-- Report Content -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:0 0 24px">
        <h2 style="font-size:16px;color:#1e293b;margin:0 0 4px">Haftalik Gelistirme Dokumu</h2>
        <p style="font-size:13px;color:#64748b;margin:0 0 16px">${dateRange} | ${clientName} - ${project}</p>
        ${reportHtml}
      </div>

      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 8px">
        Detayli bilgi ve gorev takibi icin ERPIDE panelinizi ziyaret edebilirsiniz:
      </p>

      <a href="https://erpide.com/panel" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0">
        Panele Git &rarr;
      </a>

      <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:24px 0 0">
        Sorulariniz icin bize her zaman ulasabilirsiniz.
      </p>
      <p style="font-size:14px;color:#374151;margin:4px 0 0">
        Saygilarimizla,
      </p>

      ${signature}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px 0">
      <p style="font-size:11px;color:#9ca3af;margin:0">
        Bu email ERPIDE proje yonetim sistemi tarafindan otomatik gonderilmistir.
      </p>
    </div>
  </div>
</body>
</html>`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "ERPIDE <onboarding@resend.dev>";

    // Send to customer
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
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
      });
    } catch {}

    return NextResponse.json({ id: data?.id, message: "Rapor emaili gonderildi" });
  } catch (error) {
    console.error("Report email error:", error);
    return NextResponse.json({ error: "Email gonderilemedi" }, { status: 500 });
  }
}
