import { redirect } from "next/navigation";

// CaptchaERPIDE artık public site'te satılan bir ürün olarak listelenmiyor
// (2026-07). Yalnızca captcha.erpide.com server'ında kendi kullanımımız için
// çalışıyor. Eski public API kılavuzu kaldırıldı; doğrudan bu URL'e gelenler
// dökümantasyon ana sayfasına yönlendirilir.
export default function CaptchaDocsPage() {
  redirect("/docs");
}
