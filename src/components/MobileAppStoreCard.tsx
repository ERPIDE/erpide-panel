"use client";
import { useEffect, useState } from "react";
import { Apple, Smartphone, QrCode, ExternalLink, Globe, AlertCircle, ShoppingBag } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { getProductText, type Product } from "@/lib/products";

// Lucide'da Chrome ikon yok; Globe ile temsil ediyoruz (Chrome Web Store linki için).
const Chrome = Globe;

/**
 * Mobil uygulama indirme kartı. Ürün detay sayfasında (LingoApp, PocketERPIDE)
 * SKU paneli yerine gösterilir.
 *
 * - Mobil cihaz tespiti (userAgent + viewport) — telefondaysa direkt store
 *   butonları; masaüstündeyse QR kod.
 * - `mobileOnlyDownload=true` ürünlerde masaüstünden indirme bağlantısı
 *   gösterilmez — yalnız QR (download deneyimini telefona sabitler).
 * - Henüz mağaza linki yoksa "Yakında" placeholder.
 * - Tüm metinler t() ile çevrili (TR/EN/RU/KK).
 */
export default function MobileAppStoreCard({ product }: { product: Product }) {
  const { t, locale } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const w = window.innerWidth;
    const isPhoneUA = /Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsMobile(isPhoneUA || w < 768);
  }, []);

  const hasIos = !!product.iosAppStoreUrl;
  const hasAndroid = !!product.androidPlayStoreUrl;
  const hasTestFlight = !!product.testFlightUrl;
  const hasChrome = !!product.chromeWebStoreUrl;
  const noStoreYet = !hasIos && !hasAndroid && !hasTestFlight && !hasChrome;
  const productName = getProductText(product, locale, "name");

  const primaryUrl =
    product.iosAppStoreUrl
    || product.androidPlayStoreUrl
    || product.testFlightUrl
    || product.chromeWebStoreUrl
    || null;

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 via-[#111118] to-sky-500/5 border border-blue-500/20">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white flex-shrink-0">
          <Smartphone size={20} />
        </div>
        <div>
          <h2 className="font-bold text-white text-lg">{productName} — {t("mobile.app_heading")}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {product.mobileOnlyDownload
              ? t("mobile.app_only_desc")
              : t("mobile.stores_default_desc")}
          </p>
        </div>
      </div>

      {noStoreYet ? (
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/25 text-sm text-purple-200 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-purple-100">{t("mobile.coming_soon_title")}</strong>{" "}
            — {t("mobile.coming_soon_long").split(/\{contact_link\}/).map((part, idx, arr) => (
              <span key={idx}>
                {part}
                {idx < arr.length - 1 && <a href="/iletisim" className="underline">{t("mobile.coming_soon_contact_link")}</a>}
              </span>
            ))}
          </div>
        </div>
      ) : isMobile ? (
        <div className="space-y-2.5">
          {hasIos && (
            <StoreButton
              href={product.iosAppStoreUrl!}
              icon={<Apple size={18} />}
              label={t("mobile.btn_appstore")}
              sub={t("mobile.btn_appstore_sub")}
              variant="black"
            />
          )}
          {hasAndroid && (
            <StoreButton
              href={product.androidPlayStoreUrl!}
              icon={<PlayStoreIcon />}
              label={t("mobile.btn_googleplay")}
              sub={t("mobile.btn_googleplay_sub")}
              variant="green"
            />
          )}
          {hasTestFlight && !hasIos && (
            <StoreButton
              href={product.testFlightUrl!}
              icon={<Apple size={18} />}
              label={t("mobile.btn_testflight")}
              sub={t("mobile.btn_testflight_sub")}
              variant="blue"
            />
          )}
          {hasChrome && (
            <StoreButton
              href={product.chromeWebStoreUrl!}
              icon={<Chrome size={18} />}
              label={t("mobile.btn_chrome")}
              sub={t("mobile.btn_chrome_sub")}
              variant="blue"
            />
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-[160px_1fr] gap-5 items-center">
          {primaryUrl && (
            <div className="bg-white p-3 rounded-xl flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(primaryUrl)}`}
                alt={t("mobile.qr_alt").replace("{name}", productName)}
                width={140}
                height={140}
                className="block"
                loading="lazy"
              />
            </div>
          )}
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-blue-200">
              <QrCode size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">{t("mobile.qr_scan_strong")}</strong>{" "}
                {t("mobile.qr_scan_desc")}
                {product.mobileOnlyDownload && " " + t("mobile.qr_desktop_blocked")}
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              {hasIos && (
                <DesktopStoreRow
                  href={product.iosAppStoreUrl!}
                  icon={<Apple size={14} />}
                  label="App Store"
                  disabled={!!product.mobileOnlyDownload}
                  disabledNote={t("mobile.desktop_disabled_note")}
                />
              )}
              {hasAndroid && (
                <DesktopStoreRow
                  href={product.androidPlayStoreUrl!}
                  icon={<PlayStoreIcon small />}
                  label="Google Play"
                  disabled={!!product.mobileOnlyDownload}
                  disabledNote={t("mobile.desktop_disabled_note")}
                />
              )}
              {hasTestFlight && !hasIos && (
                <DesktopStoreRow
                  href={product.testFlightUrl!}
                  icon={<Apple size={14} />}
                  label="TestFlight (Beta)"
                  disabled={!!product.mobileOnlyDownload}
                  disabledNote={t("mobile.desktop_disabled_note")}
                />
              )}
              {hasChrome && (
                <DesktopStoreRow
                  href={product.chromeWebStoreUrl!}
                  icon={<Chrome size={14} />}
                  label="Chrome Web Store"
                  disabled={false}
                  disabledNote=""
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 pt-5 border-t border-white/5 text-xs text-gray-500 flex items-start gap-2">
        <ShoppingBag size={11} className="flex-shrink-0 mt-0.5" />
        <span>{t("mobile.billing_note")}</span>
      </div>
    </div>
  );
}

function StoreButton({
  href, icon, label, sub, variant,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  variant: "black" | "green" | "blue";
}) {
  const cls = variant === "black"
    ? "bg-black hover:bg-zinc-900 border-white/15"
    : variant === "green"
    ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500"
    : "bg-blue-600 hover:bg-blue-700 border-blue-500";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full inline-flex items-center gap-3 px-5 py-3 rounded-xl border ${cls} text-white transition`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <div className="flex-1 text-left">
        <div className="font-semibold leading-tight">{label}</div>
        {sub && <div className="text-[11px] opacity-75 leading-tight mt-0.5">{sub}</div>}
      </div>
      <ExternalLink size={14} className="flex-shrink-0 opacity-70" />
    </a>
  );
}

function DesktopStoreRow({
  href, icon, label, disabled, disabledNote,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  disabledNote: string;
}) {
  if (disabled) {
    return (
      <div className="inline-flex items-center gap-2 text-xs text-gray-500">
        {icon}
        <span>{label}</span>
        <span className="text-[10px] text-gray-600">({disabledNote})</span>
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 hover:underline transition"
    >
      {icon}
      <span>{label}</span>
      <ExternalLink size={10} />
    </a>
  );
}

function PlayStoreIcon({ small }: { small?: boolean } = {}) {
  const sz = small ? 14 : 18;
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 2.5v19l16-9.5L3 2.5z" />
    </svg>
  );
}
