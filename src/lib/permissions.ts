/**
 * Admin panel modül yetki sistemi.
 *
 * Üç seviye yetki:
 *  - read:  Modülü görebilir, verileri okuyabilir (sidebar'da görünür).
 *  - edit:  Mevcut kayıtları güncelleyebilir (create yok).
 *  - write: Yeni kayıt oluşturabilir (read+edit'i de kapsar).
 *
 * Kurallar:
 *  - read yoksa modül sidebar'da görünmez.
 *  - edit varsa read de var sayılır.
 *  - write varsa edit de var sayılır.
 *  - Admin.permissions null ise rol bazlı varsayılan uygulanır.
 *  - role === "admin": tüm modüller tam yetki.
 *  - role === "developer": yalnızca temel modüller.
 */

export type PermissionLevel = {
  read: boolean;
  edit: boolean;
  write: boolean;
};

export type ModulePermissions = Record<string, PermissionLevel>;

// Admin panelindeki tüm modüller
export const ALL_MODULES = [
  { key: "dashboard",        label: "Dashboard" },
  { key: "odemeler",         label: "Ödemeler" },
  { key: "tasks",            label: "Task Yönetimi" },
  { key: "reports",          label: "Raporlar" },
  { key: "support-requests", label: "Destek Talepleri" },
  { key: "vapi",             label: "Vapi Prompt" },
  { key: "users",            label: "Kullanıcılar" },
  { key: "musteriler",       label: "Müşteriler" },
  { key: "projeler",         label: "Projeler" },
  { key: "finanserpide",     label: "FinansERPIDE" },
  { key: "pocketerpide",     label: "PocketERPIDE" },
  { key: "tickets",          label: "Tickets" },
  { key: "witma",            label: "WITMA" },
  { key: "captcha",          label: "Captcha Panel" },
  { key: "dataengine",       label: "Data Engine" },
  { key: "sistem",           label: "Sistem" },
  { key: "profil",           label: "Profilim" },
] as const;

export type ModuleKey = (typeof ALL_MODULES)[number]["key"];

const FULL: PermissionLevel = { read: true, edit: true, write: true };
const READ_ONLY: PermissionLevel = { read: true, edit: false, write: false };
const NONE: PermissionLevel = { read: false, edit: false, write: false };

// Admin role: tüm modüller tam yetki
export const ADMIN_DEFAULT_PERMISSIONS: ModulePermissions = Object.fromEntries(
  ALL_MODULES.map((m) => [m.key, { ...FULL }])
);

// Developer role: dashboard + tasks + reports + profil (tam), diğerleri yok
export const DEVELOPER_DEFAULT_PERMISSIONS: ModulePermissions = Object.fromEntries(
  ALL_MODULES.map((m) => {
    if (["dashboard", "tasks", "profil"].includes(m.key)) return [m.key, { ...FULL }];
    if (m.key === "reports") return [m.key, { ...READ_ONLY }];
    return [m.key, { ...NONE }];
  })
);

/** Kullanıcının rolüne ve DB'deki permissions alanına göre efektif izinleri döner. */
export function resolvePermissions(
  role: string | undefined | null,
  dbPermissions: unknown
): ModulePermissions {
  const defaults = role === "admin" ? ADMIN_DEFAULT_PERMISSIONS : DEVELOPER_DEFAULT_PERMISSIONS;

  // DB'de explicit permissions yoksa rol bazlı varsayılan
  if (!dbPermissions || typeof dbPermissions !== "object") return defaults;

  const stored = dbPermissions as Record<string, Partial<PermissionLevel>>;

  // DB'deki değerleri varsayılan üzerine yaz
  const result: ModulePermissions = { ...defaults };
  for (const key of Object.keys(stored)) {
    const v = stored[key];
    if (v && typeof v === "object") {
      result[key] = {
        read:  !!v.read,
        edit:  !!v.edit,
        write: !!v.write,
      };
    }
  }
  return result;
}

/** Kullanıcının belirli bir modül + seviye için yetkisi var mı? */
export function can(
  permissions: ModulePermissions,
  moduleKey: string,
  level: "read" | "edit" | "write"
): boolean {
  return !!permissions[moduleKey]?.[level];
}
