"use client";
import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ListTodo, FileText, Users, LogOut,
  Menu, ChevronRight, Loader2, Shield, Banknote, UserCircle,
  Headphones, Phone, Database, MessageSquare, Ticket, Smartphone, BarChart3, Monitor
} from "lucide-react";
import Logo from "@/components/Logo";
import { ToastProvider } from "@/components/Toast";
import type { ModulePermissions } from "@/lib/permissions";

// ── Permissions Context ──────────────────────────────────────────
// Child page'ler useAdminPermissions() ile kendi yetkilerini okur.

interface PermissionsContextValue {
  permissions: ModulePermissions | null;
  can: (module: string, level: "read" | "edit" | "write") => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: null,
  can: () => true, // fallback: her şeye izin (auth check layout'ta zaten var)
});

export function useAdminPermissions() {
  return useContext(PermissionsContext);
}

// ── Nav definition ───────────────────────────────────────────────
// permissionKey: lib/permissions.ts'deki modül anahtarıyla eşleşmeli.

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permissionKey: string;
};

const navItems: NavItem[] = [
  { href: "/admin/dashboard",        label: "Dashboard",        icon: LayoutDashboard, permissionKey: "dashboard" },
  { href: "/admin/odemeler",         label: "Ödemeler",         icon: Banknote,        permissionKey: "odemeler" },
  { href: "/admin/tasks",            label: "Task Yönetimi",    icon: ListTodo,        permissionKey: "tasks" },
  { href: "/admin/reports",          label: "Raporlar",         icon: FileText,        permissionKey: "reports" },
  { href: "/admin/support-requests", label: "Destek Talepleri", icon: Headphones,      permissionKey: "support-requests" },
  { href: "/admin/vapi",             label: "Vapi Prompt",      icon: Phone,           permissionKey: "vapi" },
  { href: "/admin/users",            label: "Kullanıcılar",     icon: Users,           permissionKey: "users" },
  { href: "/admin/finanserpide",     label: "FinansERPIDE",     icon: BarChart3,       permissionKey: "finanserpide" },
  { href: "/admin/pocketerpide",     label: "Pocket",     icon: Smartphone,      permissionKey: "pocketerpide" },
  { href: "/admin/tickets",          label: "Tickets",          icon: Ticket,          permissionKey: "tickets" },
  { href: "/admin/witma",            label: "WITMA",            icon: MessageSquare,   permissionKey: "witma" },
  { href: "/admin/captcha",          label: "Captcha Panel",    icon: Shield,          permissionKey: "captcha" },
  { href: "/admin/dataengine",       label: "Data Engine",      icon: Database,        permissionKey: "dataengine" },
  { href: "/admin/sistem",           label: "Sistem",           icon: Monitor,         permissionKey: "sistem" },
  { href: "/admin/profil",           label: "Profilim",         icon: UserCircle,      permissionKey: "profil" },
];

// ── Layout ───────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [permissions, setPermissions] = useState<ModulePermissions | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const isLoginPage = pathname === "/admin";

  const canAccess = (key: string, level: "read" | "edit" | "write" = "read") => {
    if (!permissions) return false;
    return !!permissions[key]?.[level];
  };

  useEffect(() => {
    if (isLoginPage) { setAuthChecked(true); return; }
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUserName(data.userName || "");
          setPermissions(data.permissions || null);
          setAuthChecked(true);
          // Yetkisiz route'a gelindiyse dashboard'a yönlendir
          const currentNav = navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
          if (currentNav && data.permissions && !data.permissions[currentNav.permissionKey]?.read) {
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

  // Sadece read yetkisi olan modüller sidebar'da görünür
  const visibleNav = navItems.filter((n) =>
    permissions ? !!permissions[n.permissionKey]?.read : true
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin");
  };

  const contextValue: PermissionsContextValue = {
    permissions,
    can: (module, level) => canAccess(module, level),
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
    <ToastProvider>
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0d0d14] border-r border-white/5 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-white/5">
          <Link href="/admin/dashboard"><Logo size="small" /></Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
    </PermissionsContext.Provider>
  );
}
