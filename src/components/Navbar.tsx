"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/hizmetler", label: "Hizmetler" },
  { href: "/hakkimizda", label: "Hakkimizda" },
  { href: "/iletisim", label: "Iletisim" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold gradient-text">
          ERPIDE
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/panel" className="text-sm px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition">
            Musteri Paneli
          </Link>
          <Link href="/admin" className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition">
            Yonetim
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
              <Link href="/panel" className="text-center py-2 rounded-lg border border-white/10 text-gray-300">Musteri Paneli</Link>
              <Link href="/admin" className="text-center py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">Yonetim</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
