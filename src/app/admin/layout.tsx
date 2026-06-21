"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ListTodo, FileText, Users, LogOut,
  Menu, ChevronRight, Loader2, Shield, Banknote, UserCircle,
  Headphones, Phone, Database, MessageSquare, Ticket, Smartphone, BarChart3
} from "lucide-react";
import Logo from "@/components/Logo";
import { ToastProvider } from "@/components/Toast";

// Elevated-only sekmeler: sadece role === "admin" görür (Ali Murat, mustafa.el).
// Geliştirici rolündeki kullanıcılar (berkay.yasar, dilyar.yussupov) sadece
// Dashboard/Task Yönetimi/Raporlar/Profilim görür — Ödemeler, Kullanıcılar,
// Captcha Panel, Destek Talepleri ve Vapi Prompt onlara kapalıdır.

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; elevatedOnly?: boolean };
const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/odemeler", label: "Ödemeler", icon: Banknote, elevatedOnly: true },
  { href: "/admin/tasks", label: "Task Yönetimi", icon: ListTodo },
  { href: "/admin/reports", label: "Raporlar", icon: FileText },
  { href: "/admin/support-requests", label: "Destek Talepleri", icon: Headphones, elevatedOnly: true },
  { href: "/admin/vapi", label: "Vapi Prompt", icon: Phone, elevatedOnly: true },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users, elevatedOnly: true },
  { href: "/admin/finanserpide", label: "FinansERPIDE", icon: BarChart3, elevatedOnly: true },
  { href: "/admin/pocketerpide", label: "PocketERPIDE", icon: Smartphone, elevatedOnly: true },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket, elevatedOnly: true },
  { href: "/admin/witma", label: "WITMA", icon: MessageSquare, elevatedOnly: true },
  { href: "/admin/captcha", label: "Captcha Panel", icon: Shield, elevatedOnly: true },
  { href: "/admin/dataengine", label: "Data Engine", icon: Database, elevatedOnly: true },
  { href: "/admin/profil", label: "Profilim", icon: UserCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const isLoginPage = pathname === "/admin";
  const isElevated = userRole === "admin";

  useEffect(() => {
    if (isLoginPage) { setAuthChecked(true); return; }
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUserName(data.userName || "");
          setUserRole(data.userRole || "");
          setAuthChecked(true);
          // Elevated-only route'a developer direkt URL ile geldiyse dashboard'a çevir
          const hitElevated = navItems.find((n) => n.elevatedOnly && (pathname === n.href || pathname.startsWith(n.href + "/")));
          if (hitElevated && data.userRole !== "admin") {
            router.replace("/admin/dashboard");
          }
        } else {
          router.replace("/admin");
        }
      })
      .catch(() => router.replace("/admin"));
  }, [isLoginPage, router, pathname]);

  if (isLoginPage) return <>{children}</>;

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  const visibleNav = navItems.filter((n) => !n.elevatedOnly || isElevated);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin");
  };

  return (
    <ToastProvider>
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0d0d14] border-r border-white/5 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-white/5">
          <Link href="/admin/dashboard"><Logo size="small" /></Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          {userName && (
            <div className="px-4 py-2 text-xs text-gray-500 truncate">{userName}</div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-red-400 transition w-full">
            <LogOut size={18} /> Çıkış
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-white/5 flex items-center px-6 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-30">
          <button className="lg:hidden mr-4 text-gray-400" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="text-sm font-medium text-gray-300">
            {visibleNav.find(n => pathname.startsWith(n.href))?.label || "Admin"}
          </h1>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
