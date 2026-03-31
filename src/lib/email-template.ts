// Shared email branding for all ERPIDE emails
// Logo rendered as inline HTML to match website exactly (ERP+IDE bitisik)

export const emailLogo = `
<table cellpadding="0" cellspacing="0" style="margin:0 auto">
  <tr><td style="text-align:center;padding-bottom:2px">
    <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAxNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMiAxMkw1IDRMOS41IDhMMTIgMkwxNS41IDhMMTkgNEwyMiAxMiIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PGNpcmNsZSBjeD0iNSIgY3k9IjMuNSIgcj0iMS4yIiBmaWxsPSIjM2I4MmY2Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxLjUiIHI9IjEuMiIgZmlsbD0iIzNiODJmNiIvPjxjaXJjbGUgY3g9IjE5IiBjeT0iMy41IiByPSIxLjIiIGZpbGw9IiMzYjgyZjYiLz48L3N2Zz4=" alt="ERPIDE" width="24" height="14" style="display:block;margin:0 auto" />
  </td></tr>
  <tr><td style="height:1px;background:linear-gradient(to right,transparent,rgba(59,130,246,0.4),transparent)"></td></tr>
  <tr><td style="text-align:center;padding:4px 0">
    <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#0f172a;letter-spacing:2px">ERP</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:bold;color:#3b82f6;letter-spacing:1px">IDE</span>
  </td></tr>
  <tr><td style="height:1px;background:linear-gradient(to right,transparent,rgba(59,130,246,0.4),transparent)"></td></tr>
  <tr><td style="text-align:center;padding-top:4px">
    <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:7px;letter-spacing:3px;color:#94a3b8">ERP COZUMLERI HAKKINDA HER SEY</span>
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
<div style="text-align:center;padding:24px 32px;background:#ffffff;border-bottom:3px solid #3b82f6">
  <a href="https://erpide.com" style="text-decoration:none">
    ${emailLogo}
  </a>
</div>`;

export const emailFooter = `
<div style="text-align:center;padding:20px 0">
  <p style="font-size:11px;color:#9ca3af;margin:0">Bu email ERPIDE proje yonetim sistemi tarafindan otomatik gonderilmistir.</p>
  <p style="font-size:11px;color:#9ca3af;margin:4px 0 0"><a href="https://erpide.com" style="color:#6b7280;text-decoration:none">www.erpide.com</a></p>
</div>`;
