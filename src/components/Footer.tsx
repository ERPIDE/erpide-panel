"use client";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import Logo from "./Logo";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/5 bg-[#08080d]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <Link href="/"><Logo size="small" /></Link>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              {t("footer.brand.desc")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("footer.links")}</h4>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition">{t("nav.home")}</Link>
              <Link href="/hizmetler" className="text-sm text-gray-400 hover:text-white transition">{t("nav.services")}</Link>
              <Link href="/hakkimizda" className="text-sm text-gray-400 hover:text-white transition">{t("nav.about")}</Link>
              <Link href="/iletisim" className="text-sm text-gray-400 hover:text-white transition">{t("nav.contact")}</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("footer.services")}</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-400">CANIAS ERP</span>
              <span className="text-sm text-gray-400">1C:ERP</span>
              <span className="text-sm text-gray-400">1C:Accounting</span>
              <span className="text-sm text-gray-400">1C:Drive</span>
              <Link href="https://captcha.erpide.com" target="_blank" className="text-sm text-gray-400 hover:text-blue-400 transition">ERPIDE Captcha</Link>
              <span className="text-sm text-gray-400">ERPocket</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("footer.contact")}</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:info@erpide.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
                <Mail size={16} /> info@erpide.com
              </a>
              <a href="tel:+77711386635" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
                <Phone size={16} /> +7 771 138 66 35
              </a>
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={16} /> {t("contact.info.location.val")}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 text-center">
          <p className="text-sm text-gray-600">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
