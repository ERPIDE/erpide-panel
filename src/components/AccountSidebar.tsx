"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Key, Package, MapPin, Lock, LayoutDashboard, LogOut } from "lucide-react";

const NAV = [
  { href: "/hesabim", label: "Özet", icon: LayoutDashboard, exact: true },
  { href: "/hesabim/profil", label: "Profil Bilgileri", icon: User },
  { href: "/hesabim/lisanslarim", label: "Lisanslarım", icon: Key },
  { href: "/hesabim/siparislerim", label: "Siparişlerim", icon: Package },
  { href: "/hesabim/adres", label: "Adres Bilgileri", icon: MapPin },
  { href: "/hesabim/sifre", label: "Şifre Değiştir", icon: Lock },
];

export default function AccountSidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-24 h-fit">
      <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <p className="text-[10px] text-blue-300 uppercase tracking-wider mb-1">Hoş geldin</p>
          <p className="font-semibold text-white truncate">{userName || "Kullanıcı"}</p>
        </div>
        <nav className="p-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/10 text-white border-l-2 border-blue-500"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                }`}
              >
                <Icon size={16} className={active ? "text-blue-400" : ""} />
                {item.label}
              </Link>
            );
          })}
          <div className="my-2 border-t border-white/5" />
          <form action="/api/shop/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/5 transition"
            >
              <LogOut size={16} /> Çıkış Yap
            </button>
          </form>
        </nav>
      </div>
    </aside>
  );
}
