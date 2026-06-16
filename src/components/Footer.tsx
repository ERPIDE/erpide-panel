"use client";
import Link from "next/link";
import { Mail, MapPin, Shield, Lock } from "lucide-react";
import Logo from "./Logo";
import { useTranslation } from "@/lib/i18n";
import { COMPANY } from "@/lib/company-info";
import { LEGAL_LINKS } from "./LegalPageLayout";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/5 bg-[#08080d]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <Link href="/"><Logo size="small" /></Link>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed max-w-xs">
              {t("footer.brand.desc")}
            </p>
            <div className="mt-5 space-y-1.5 text-sm text-gray-400">
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 hover:text-white transition">
                <Mail size={14} /> {COMPANY.email}
              </a>
              <span className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>{COMPANY.address.district} / {COMPANY.address.city}</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-white mb-4 text-sm">{t("footer.corporate")}</h4>
            <div className="flex flex-col gap-2">
              <Link href="/hakkimizda" className="text-sm text-gray-400 hover:text-white transition">{t("nav.about")}</Link>
              <Link href="/iletisim" className="text-sm text-gray-400 hover:text-white transition">{t("nav.contact")}</Link>
              <Link href="/kunye" className="text-sm text-gray-400 hover:text-white transition">{t("footer.imprint")}</Link>
              <Link href="/hizmetler" className="text-sm text-gray-400 hover:text-white transition">{t("nav.services")}</Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-white mb-4 text-sm">{t("footer.products")}</h4>
            <div className="flex flex-col gap-2">
              <Link href="/urunler?kategori=web" className="text-sm text-gray-400 hover:text-blue-400 transition">{t("footer.cat_web")}</Link>
              <Link href="/urunler?kategori=mobile" className="text-sm text-gray-400 hover:text-blue-400 transition">{t("footer.cat_mobile")}</Link>
              <Link href="/urunler?kategori=desktop-enterprise" className="text-sm text-gray-400 hover:text-blue-400 transition">{t("footer.cat_enterprise")}</Link>
              <Link href="/urunler" className="text-sm text-gray-400 hover:text-white transition">{t("footer.all_products")}</Link>
              <Link href="/sepet" className="text-sm text-gray-400 hover:text-white transition">{t("footer.my_cart")}</Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-white mb-4 text-sm">{t("footer.support")}</h4>
            <div className="flex flex-col gap-2">
              <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition">{t("footer.docs")}</Link>
              <Link href="/giris" className="text-sm text-gray-400 hover:text-white transition">{t("nav.login")}</Link>
              <Link href="/uye-ol" className="text-sm text-gray-400 hover:text-white transition">{t("nav.signup")}</Link>
              <Link href="/hesabim" className="text-sm text-gray-400 hover:text-white transition">{t("nav.account")}</Link>
              <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(t("footer.help_subject"))}`} className="text-sm text-gray-400 hover:text-white transition">{t("footer.help")}</a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold text-white mb-4 text-sm">{t("footer.legal")}</h4>
            <div className="flex flex-col gap-2">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Şirket resmi bilgileri — KEP/MERSİS şeffaflığı için footer'da */}
        <div className="border-t border-white/5 mt-12 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] text-gray-500">
          <div>
            <div className="text-gray-600 mb-1">{t("footer.legal_company")}</div>
            <div className="text-gray-400">{COMPANY.name}</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">{t("footer.tax_no")}</div>
            <div className="text-gray-400 font-mono">{COMPANY.taxNumber}</div>
            <div className="text-gray-500 text-[10px] mt-0.5">{COMPANY.taxOffice} VD.</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">{t("footer.mersis_no")}</div>
            <div className="text-gray-400 font-mono">{COMPANY.mersisNumber}</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">{t("footer.address")}</div>
            <div className="text-gray-400 text-[11px] leading-relaxed">
              {COMPANY.address.street}<br/>
              {COMPANY.address.district} / {COMPANY.address.city}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield size={14} className="text-green-500" />
              <span>{t("footer.iyzico_note")}</span>
              <span className="text-gray-700 mx-1">•</span>
              <Lock size={12} className="text-gray-500" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* iyzico white logo — no pill background, sits on dark footer */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/payment/iyzico.svg" alt="iyzico ile Öde" style={{ width: 140, height: "auto" }} loading="lazy" />
              <PaymentLogo src="/payment/visa.svg" alt="Visa" width={42} />
              <PaymentLogo src="/payment/mastercard.svg" alt="MasterCard" width={36} />
              <PaymentLogo src="/payment/troy.svg" alt="Troy" width={36} />
              <PaymentLogo src="/payment/amex.svg" alt="American Express" width={36} />
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} {COMPANY.shortName}. {t("footer.rights_reserved")}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-gray-600">
            <Link href="/panel" className="hover:text-gray-300 transition">{t("nav.customer_panel")}</Link>
            <span className="text-gray-700">·</span>
            <Link href="/admin" className="hover:text-gray-300 transition">{t("nav.admin")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PaymentLogo({ src, alt, width }: { src: string; alt: string; width: number }) {
  return (
    <div className="bg-white rounded px-2 py-1.5 flex items-center justify-center" style={{ minHeight: 28 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width, height: "auto", maxHeight: 22 }} loading="lazy" />
    </div>
  );
}
