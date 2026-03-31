// Shared email branding for all ERPIDE emails
// Logo rendered as inline HTML to match website exactly (ERP+IDE bitisik)

export const emailLogo = `
<table cellpadding="0" cellspacing="0" style="margin:0 auto">
  <tr><td style="text-align:center;padding-bottom:6px">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
      <td style="font-size:11px;color:#3b82f6;line-height:1">&#9650;</td>
      <td style="font-size:14px;color:#3b82f6;line-height:1;padding:0 1px">&#9650;</td>
      <td style="font-size:11px;color:#3b82f6;line-height:1">&#9650;</td>
    </tr></table>
  </td></tr>
  <tr><td style="text-align:center;padding:0"><table cellpadding="0" cellspacing="0" style="margin:0 auto;width:120px"><tr><td style="height:1px;background-color:#3b82f6;font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
  <tr><td style="text-align:center;padding:6px 0 4px">
    <span style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:bold;color:#0f172a;letter-spacing:3px">ERP</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:bold;color:#3b82f6;letter-spacing:2px">IDE</span>
  </td></tr>
  <tr><td style="text-align:center;padding:0"><table cellpadding="0" cellspacing="0" style="margin:0 auto;width:120px"><tr><td style="height:1px;background-color:#3b82f6;font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
  <tr><td style="text-align:center;padding-top:6px">
    <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:8px;letter-spacing:3px;color:#94a3b8;text-transform:uppercase">ERP COZUMLERI HAKKINDA HER SEY</span>
  </td></tr>
</table>`;

export const emailSignature = `
<table cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Arial,sans-serif;margin-top:28px;border-top:1px solid #e5e7eb;padding-top:20px;width:100%">
  <tr>
    <td style="padding-right:20px;vertical-align:top;width:100px">
      <a href="https://erpide.com" style="text-decoration:none">
        ${emailLogo}
      </a>
    </td>
    <td style="vertical-align:top;border-left:2px solid #3b82f6;padding-left:20px">
      <p style="margin:0;font-weight:700;font-size:15px;color:#1f2937">ERPIDE YAZILIM A.S.</p>
      <table cellpadding="0" cellspacing="0" style="margin-top:8px">
        <tr><td style="font-size:13px;color:#6b7280;padding:2px 0">&#9993;&nbsp; <a href="mailto:info@erpide.com" style="color:#374151;text-decoration:none">info@erpide.com</a></td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding:2px 0">&#9742;&nbsp; <a href="tel:+905546943409" style="color:#374151;text-decoration:none">0554 694 34 09</a></td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding:2px 0">&#127760;&nbsp; <a href="https://erpide.com" style="color:#3b82f6;text-decoration:none;font-weight:500">www.erpide.com</a></td></tr>
      </table>
    </td>
  </tr>
</table>`;

export const emailHeader = `
<div style="text-align:center;padding:24px 32px;background-color:#ffffff;border-bottom:3px solid #3b82f6">
  <a href="https://erpide.com" style="text-decoration:none">
    ${emailLogo}
  </a>
</div>`;

export const emailFooter = `
<div style="text-align:center;padding:20px 0">
  <p style="font-size:11px;color:#9ca3af;margin:0">Bu email ERPIDE proje yonetim sistemi tarafindan otomatik gonderilmistir.</p>
  <p style="font-size:11px;color:#9ca3af;margin:4px 0 0"><a href="https://erpide.com" style="color:#6b7280;text-decoration:none">www.erpide.com</a></p>
</div>`;
