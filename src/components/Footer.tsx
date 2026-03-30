"use client";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#08080d]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/"><Logo size="small" /></Link>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              Kurumsal ERP çözümleri ve yazılım danışmanlığı. Türkiye ve Kazakistan&apos;da hizmet veriyoruz.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Hızlı Erişim</h4>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition">Ana Sayfa</Link>
              <Link href="/hizmetler" className="text-sm text-gray-400 hover:text-white transition">Hizmetler</Link>
              <Link href="/hakkimizda" className="text-sm text-gray-400 hover:text-white transition">Hakkımızda</Link>
              <Link href="/iletisim" className="text-sm text-gray-400 hover:text-white transition">İletişim</Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4">Hizmetler</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-400">CANIAS ERP</span>
              <span className="text-sm text-gray-400">1C ERP</span>
              <span className="text-sm text-gray-400">Özel Yazılım</span>
              <span className="text-sm text-gray-400">Bakım ve Destek</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">İletişim</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:info@erpide.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
                <Mail size={16} /> info@erpide.com
              </a>
              <a href="tel:05546943409" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
                <Phone size={16} /> 0554 694 34 09
              </a>
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={16} /> Türkiye &amp; Kazakistan
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 text-center">
          <p className="text-sm text-gray-600">
            &copy; 2024 ERPIDE YAZILIM A.Ş. — Tüm Hakları Saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
