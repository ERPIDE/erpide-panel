"use client";
import Link from "next/link";
import { Mail, MapPin, Shield } from "lucide-react";
import Logo from "./Logo";
import { useTranslation } from "@/lib/i18n";
import { COMPANY } from "@/lib/company-info";
import { LEGAL_LINKS } from "./LegalPageLayout";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/5 bg-[#08080d]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link href="/"><Logo size="small" /></Link>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed max-w-xs">
              {t("footer.brand.desc")}
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
              <Shield size={12} className="text-green-500" />
              <span>iyzico güvenli ödeme altyapısı ile çalışır</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("footer.links")}</h4>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition">{t("nav.home")}</Link>
              <Link href="/urunler" className="text-sm text-gray-400 hover:text-white transition">Ürünler</Link>
              <Link href="/hizmetler" className="text-sm text-gray-400 hover:text-white transition">{t("nav.services")}</Link>
              <Link href="/hakkimizda" className="text-sm text-gray-400 hover:text-white transition">{t("nav.about")}</Link>
              <Link href="/iletisim" className="text-sm text-gray-400 hover:text-white transition">{t("nav.contact")}</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Ürünler</h4>
            <div className="flex flex-col gap-2">
              <Link href="https://finans.erpide.com" target="_blank" className="text-sm text-gray-400 hover:text-blue-400 transition">FinansERPIDE</Link>
              <Link href="https://captcha.erpide.com" target="_blank" className="text-sm text-gray-400 hover:text-blue-400 transition">CaptchaERPIDE</Link>
              <span className="text-sm text-gray-400">CANIAS ERP</span>
              <span className="text-sm text-gray-400">1C:ERP / Accounting / Drive</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Yasal</h4>
            <div className="flex flex-col gap-2">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8">
          <h5 className="text-xs uppercase tracking-wider text-gray-500 mb-2">İletişim</h5>
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1.5 text-sm text-gray-400">
            <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 hover:text-white transition">
              <Mail size={14} /> {COMPANY.email}
            </a>
            <span className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 flex-shrink-0" />
              <span>{COMPANY.address.district} / {COMPANY.address.city}</span>
            </span>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} {COMPANY.shortName}. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-gray-600">
            <Link href="/kunye" className="hover:text-gray-300 transition">Künye</Link>
            <span className="text-gray-700">·</span>
            <Link href="/panel" className="hover:text-gray-300 transition">Müşteri Paneli</Link>
            <span className="text-gray-700">·</span>
            <Link href="/admin" className="hover:text-gray-300 transition">Yönetim</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
