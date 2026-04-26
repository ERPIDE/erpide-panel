"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, Shield } from "lucide-react";
import Logo from "./Logo";
import { useTranslation, localeNames, type Locale } from "@/lib/i18n";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { t, locale, setLocale } = useTranslation();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/hizmetler", label: t("nav.services") },
    { href: "/hakkimizda", label: t("nav.about") },
    { href: "/iletisim", label: t("nav.contact") },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/5"
    >
      {/* Top bar - Language switcher */}
      <div className="border-b border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 h-8 flex items-center justify-end gap-2">
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded text-gray-400 hover:text-white transition"
            >
              <Globe size={12} />
              {localeNames[locale]}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-0.5 bg-[#111118] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[130px] z-50">
                {(Object.keys(localeNames) as Locale[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setLocale(lang); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition ${locale === lang ? "text-blue-400 bg-white/5" : "text-gray-300"}`}
                  >
                    {localeNames[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/"><Logo size="small" /></Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="https://captcha.erpide.com/login"
            target="_blank"
            className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 text-white hover:opacity-90 transition flex items-center gap-1.5"
          >
            <Shield size={14} /> Captcha Panel
          </Link>
          <Link href="/panel" className="text-sm px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition">
            {t("nav.customer_panel")}
          </Link>
          <Link href="/admin" className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition">
            {t("nav.admin")}
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/90 border-t border-white/5"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-gray-300 hover:text-white py-2">
                  {l.label}
                </Link>
              ))}
              {/* Mobile language picker */}
              <div className="flex gap-2 py-2">
                {(Object.keys(localeNames) as Locale[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setLocale(lang); setOpen(false); }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${locale === lang ? "border-blue-500 text-blue-400 bg-blue-500/10" : "border-white/10 text-gray-400"}`}
                  >
                    {localeNames[lang]}
                  </button>
                ))}
              </div>
              <Link href="https://captcha.erpide.com/login" target="_blank" className="text-center py-2 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 text-white flex items-center justify-center gap-1.5">
                <Shield size={14} /> Captcha Panel
              </Link>
              <Link href="/panel" className="text-center py-2 rounded-lg border border-white/10 text-gray-300">{t("nav.customer_panel")}</Link>
              <Link href="/admin" className="text-center py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">{t("nav.admin")}</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
