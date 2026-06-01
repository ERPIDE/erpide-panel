"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, ShoppingCart, User, LogOut, Package, Key, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { useTranslation, localeNames, type Locale } from "@/lib/i18n";
import { useCart } from "./CartProvider";

interface MeUser { id: string; email: string; name: string; surname: string }

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const { t, locale, setLocale } = useTranslation();
  const { itemCount } = useCart();

  useEffect(() => {
    fetch("/api/shop/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => {});
  }, []);

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/urunler", label: "Ürünler" },
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

      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/"><Logo size="small" /></Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/sepet"
            className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
              >
                <User size={14} />
                <span className="max-w-[100px] truncate">{user.name}</span>
                <ChevronDown size={12} />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[#111118] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[180px]">
                  <Link href="/hesabim" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition">
                    <User size={14} /> Hesabım
                  </Link>
                  <Link href="/hesabim/lisanslarim" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition">
                    <Key size={14} /> Lisanslarım
                  </Link>
                  <Link href="/hesabim/siparislerim" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition">
                    <Package size={14} /> Siparişlerim
                  </Link>
                  <div className="border-t border-white/5">
                    <form action="/api/shop/auth/logout" method="POST">
                      <button type="submit" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition">
                        <LogOut size={14} /> Çıkış
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/giris" className="text-sm px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition">
                Giriş
              </Link>
              <Link href="/uye-ol" className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition">
                Üye Ol
              </Link>
            </>
          )}
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
              <Link href="/sepet" onClick={() => setOpen(false)} className="flex items-center gap-2 text-gray-300 py-2">
                <ShoppingCart size={16} /> Sepet {itemCount > 0 && <span className="text-blue-400">({itemCount})</span>}
              </Link>
              <div className="pt-3 border-t border-white/5">
                {user ? (
                  <>
                    <Link href="/hesabim" onClick={() => setOpen(false)} className="block py-2 text-gray-300">Hesabım</Link>
                    <Link href="/hesabim/lisanslarim" onClick={() => setOpen(false)} className="block py-2 text-gray-300">Lisanslarım</Link>
                    <form action="/api/shop/auth/logout" method="POST">
                      <button type="submit" className="py-2 text-red-400 text-left">Çıkış</button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/giris" onClick={() => setOpen(false)} className="block text-center py-2 rounded-lg border border-white/10 text-gray-300 mb-2">Giriş</Link>
                    <Link href="/uye-ol" onClick={() => setOpen(false)} className="block text-center py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">Üye Ol</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
