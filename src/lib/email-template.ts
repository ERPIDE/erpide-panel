// Shared email branding for all ERPIDE emails

export const LOGO_URL = "https://6eu3nbfqivqzghex.public.blob.vercel-storage.com/brand/erpide-logo-new.png";

export const emailSignature = `
<table cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Arial,sans-serif;margin-top:28px;border-top:1px solid #e5e7eb;padding-top:20px;width:100%">
  <tr>
    <td style="padding-right:20px;vertical-align:top;width:120px">
      <a href="https://erpide.com" style="text-decoration:none">
        <img src="${LOGO_URL}" alt="ERPIDE" width="120" style="display:block" />
      </a>
    </td>
    <td style="vertical-align:top;border-left:2px solid #3b82f6;padding-left:20px">
      <p style="margin:0;font-weight:700;font-size:15px;color:#1f2937">ERPIDE YAZILIM A.S.</p>
      <table cellpadding="0" cellspacing="0" style="margin-top:8px">
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:2px 0">
            &#9993;&nbsp; <a href="mailto:info@erpide.com" style="color:#374151;text-decoration:none">info@erpide.com</a>
          </td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:2px 0">
            &#9742;&nbsp; <a href="tel:+905546943409" style="color:#374151;text-decoration:none">0554 694 34 09</a>
          </td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:2px 0">
            &#127760;&nbsp; <a href="https://erpide.com" style="color:#3b82f6;text-decoration:none;font-weight:500">www.erpide.com</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

export const emailHeader = `
<div style="text-align:center;padding:28px 32px;background:#ffffff;border-bottom:1px solid #f0f0f0">
  <a href="https://erpide.com" style="text-decoration:none">
    <img src="${LOGO_URL}" alt="ERPIDE" width="180" style="display:inline-block" />
  </a>
</div>`;

export const emailFooter = `
<div style="text-align:center;padding:20px 0">
  <p style="font-size:11px;color:#9ca3af;margin:0">
    Bu email ERPIDE proje yonetim sistemi tarafindan otomatik gonderilmistir.
  </p>
  <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">
    <a href="https://erpide.com" style="color:#6b7280;text-decoration:none">www.erpide.com</a>
  </p>
</div>`;
