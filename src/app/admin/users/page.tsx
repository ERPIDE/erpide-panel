"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Shield,
  Building2,
  X,
  KeyRound,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  AdminUser,
  CustomerUser,
} from "@/lib/store";
import {
  ALL_MODULES,
  resolvePermissions,
  type ModulePermissions,
} from "@/lib/permissions";

// ── helpers ──────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 10);

// Fallback — projeler DB'den (/api/projects) gelir; liste boşsa bu kullanılır.
const projectOptions = ["CANIAS", "1C ERP"];

// ── Müşteri altı kullanıcı (CustomerMember) tipleri ─────────────────
type CustomerMemberRow = {
  id: string;
  customerId: string;
  name: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
};

type ProjectRow = {
  id: string;
  name: string;
  repo: string;
  customer: { id: string; code: string; name: string } | null;
};

const memberRoles = [
  { value: "yonetici", label: "Yönetici", desc: "Talep açma + yorum + dosya yükleme" },
  { value: "uye",      label: "Üye",      desc: "Task görüntüleme + yorum" },
  { value: "gozlemci", label: "Gözlemci", desc: "Sadece görüntüleme" },
];

const memberRoleBadge: Record<string, { label: string; cls: string }> = {
  yonetici: { label: "Yönetici", cls: "bg-red-500/10 text-red-400" },
  uye:      { label: "Üye",      cls: "bg-blue-500/10 text-blue-400" },
  gozlemci: { label: "Gözlemci", cls: "bg-gray-500/10 text-gray-400" },
};

// ── Permissions Modal ────────────────────────────────────────────────
function PermissionsModal({
  admin,
  onClose,
  onSaved,
}: {
  admin: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const effective = resolvePermissions(admin.role, admin.permissions ?? null);
  const [perms, setPerms] = useState<ModulePermissions>(() => {
    // Derin klon — state'i bağımsız tut
    return Object.fromEntries(
      Object.entries(effective).map(([k, v]) => [k, { ...v }])
    );
  });
  const [saving, setSaving] = useState(false);
  const [hasCustom] = useState(!!admin.permissions);

  const toggle = (moduleKey: string, level: "read" | "edit" | "write") => {
    setPerms((prev) => {
      const cur = { ...prev[moduleKey] };
      const next = !cur[level];
      cur[level] = next;
      // Hiyerarşi: write→edit→read
      if (level === "write" && next) { cur.edit = true; cur.read = true; }
      if (level === "edit" && next) { cur.read = true; }
      if (level === "read" && !next) { cur.edit = false; cur.write = false; }
      if (level === "edit" && !next) { cur.write = false; }
      return { ...prev, [moduleKey]: cur };
    });
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/users/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: admin.id, permissions: perms }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const resetToDefault = async () => {
    setSaving(true);
    await fetch("/api/admin/users/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: admin.id, permissions: null }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl rounded-2xl bg-[#111118] border border-white/10 shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound size={18} className="text-blue-400" />
              Yetki Yönetimi
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="text-white font-medium">{admin.name}</span>
              {" "}· {admin.role === "admin" ? "Admin" : "Geliştirici"}
              {hasCustom && <span className="ml-2 text-yellow-400 text-xs">Özel yetkiler aktif</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
            <X size={18} />
          </button>
        </div>

        {/* Permission Matrix */}
        <div className="overflow-y-auto" style={{ maxHeight: "55vh" }}>
          <div className="px-6 pt-5 pb-2">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 mb-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">
              <div>Modül</div>
              <div className="text-center">Okuma</div>
              <div className="text-center">Değiştirme</div>
              <div className="text-center">Yazma</div>
            </div>
            {/* Rows */}
            <div className="space-y-1">
              {ALL_MODULES.map((m) => {
                const p = perms[m.key] ?? { read: false, edit: false, write: false };
                return (
                  <div
                    key={m.key}
                    className={`grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center px-3 py-2 rounded-xl transition ${
                      p.read ? "bg-white/[0.03]" : "opacity-60"
                    }`}
                  >
                    <div className="text-sm text-gray-300">{m.label}</div>
                    {(["read", "edit", "write"] as const).map((level) => (
                      <div key={level} className="flex justify-center">
                        <button
                          onClick={() => toggle(m.key, level)}
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition ${
                            p[level]
                              ? level === "write"
                                ? "bg-green-500/20 border-green-500/50 text-green-400"
                                : level === "edit"
                                ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                : "bg-purple-500/20 border-purple-500/50 text-purple-400"
                              : "border-white/10 bg-white/5 text-gray-700 hover:border-white/20"
                          }`}
                        >
                          {p[level] && <span className="text-xs font-bold">✓</span>}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500/40 border border-purple-500/60" /> Okuma: görüntüleyebilir</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500/60" /> Değiştirme: mevcut kayıt güncelleyebilir</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/40 border border-green-500/60" /> Yazma: yeni kayıt oluşturabilir</span>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between gap-3">
          <button
            onClick={resetToDefault}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition disabled:opacity-40"
          >
            <RotateCcw size={14} />
            Rol Varsayılanına Dön
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-sm transition"
            >
              İptal
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Kaydet
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    delay,
    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  },
});

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

// ── input classes ────────────────────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm";
const selectCls =
  "w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none text-sm appearance-none";

// ── Password Cell ────────────────────────────────────────────────────
function PasswordCell({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-sm">
        {visible ? value : "••••••••"}
      </span>
      <button
        onClick={() => setVisible((v) => !v)}
        className="text-gray-500 hover:text-white transition"
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </span>
  );
}

// ── main component ───────────────────────────────────────────────────
export default function UsersPage() {
  // ── state ────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"customers" | "admins">("customers");
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);

  // projeler — müşteri formu ve müşteri satırındaki proje rozetleri için
  const [projectsList, setProjectsList] = useState<ProjectRow[]>([]);

  // müşteri altı kullanıcılar — ağaç yapısı: birden çok müşteri aynı anda açık kalabilir
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [membersByCustomer, setMembersByCustomer] = useState<Record<string, CustomerMemberRow[]>>({});
  const [membersLoading, setMembersLoading] = useState(false);

  // üye modal
  const [memberModal, setMemberModal] = useState<{ customerId: string; member: CustomerMemberRow | null } | null>(null);
  const [memName, setMemName] = useState("");
  const [memUsername, setMemUsername] = useState("");
  const [memEmail, setMemEmail] = useState("");
  const [memPassword, setMemPassword] = useState("");
  const [memRole, setMemRole] = useState("uye");
  const [memError, setMemError] = useState("");

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
        setCustomers(data.customers || []);
      }
    } catch {} finally {
      setLoadingUsers(false);
    }
  }

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjectsList(data.projects || []);
      }
    } catch {}
  }

  async function fetchAllMembers() {
    // Tüm üyeleri tek istekte çek, müşteriye göre grupla — satırdaki
    // "N kullanıcı" sayacı ve ağaç görünümü ilk yüklemede hazır olsun.
    try {
      const res = await fetch("/api/customers/members");
      if (res.ok) {
        const data = await res.json();
        const grouped: Record<string, CustomerMemberRow[]> = {};
        for (const m of (data.members || []) as CustomerMemberRow[]) {
          (grouped[m.customerId] ||= []).push(m);
        }
        setMembersByCustomer(grouped);
      }
    } catch {}
  }

  useEffect(() => { fetchUsers(); fetchProjects(); fetchAllMembers(); }, []);

  // Müşteri formundaki proje seçenekleri: DB'deki projeler; boşsa fallback.
  const projectNames = projectsList.length > 0 ? projectsList.map((p) => p.name) : projectOptions;

  async function fetchMembers(customerId: string) {
    try {
      setMembersLoading(true);
      const res = await fetch(`/api/customers/members?customerId=${encodeURIComponent(customerId)}`);
      if (res.ok) {
        const data = await res.json();
        setMembersByCustomer((prev) => ({ ...prev, [customerId]: data.members || [] }));
      }
    } catch {} finally {
      setMembersLoading(false);
    }
  }

  function toggleCustomerExpand(customerId: string) {
    setExpandedIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  }

  function openMemberModal(customerId: string, member: CustomerMemberRow | null) {
    setMemName(member?.name ?? "");
    setMemUsername(member?.username ?? "");
    setMemEmail(member?.email ?? "");
    setMemPassword("");
    setMemRole(member?.role ?? "uye");
    setMemError("");
    setMemberModal({ customerId, member });
  }

  async function saveMember() {
    if (!memberModal) return;
    const isEdit = !!memberModal.member;
    if (!memName.trim() || !memUsername.trim() || !memEmail.trim() || (!isEdit && !memPassword)) return;
    setSaving(true);
    setMemError("");
    try {
      const res = await fetch("/api/customers/members", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { id: memberModal.member!.id, name: memName.trim(), username: memUsername.trim(), email: memEmail.trim(), role: memRole, password: memPassword || undefined }
            : { customerId: memberModal.customerId, name: memName.trim(), username: memUsername.trim(), email: memEmail.trim(), password: memPassword, role: memRole }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setMemError(data.error || "Kaydedilemedi");
        return;
      }
      await fetchMembers(memberModal.customerId);
      setMemberModal(null);
    } catch {
      setMemError("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"customer" | "admin">("customer");
  const [editingId, setEditingId] = useState<string | null>(null);

  // customer form
  const [custCode, setCustCode] = useState("");
  const [custName, setCustName] = useState("");
  const [custProject, setCustProject] = useState(projectOptions[0]);
  const [custPassword, setCustPassword] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");

  // admin form
  const [admName, setAdmName] = useState("");
  const [admEmail, setAdmEmail] = useState("");
  const [admPassword, setAdmPassword] = useState("");
  const [admRole, setAdmRole] = useState<"admin" | "developer">("admin");

  // confirm delete
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "customer" | "admin" | "member";
    id: string;
    name: string;
    /** type="member" için: silme sonrası hangi müşterinin listesi yenilenecek */
    customerId?: string;
  } | null>(null);

  // permissions editor
  const [permTarget, setPermTarget] = useState<AdminUser | null>(null);

  // ── modal helpers ────────────────────────────────────────────────
  function resetCustomerForm() {
    setCustCode("");
    setCustName("");
    setCustProject(projectNames[0] ?? "");
    setCustPassword("");
    setCustEmail("");
    setCustPhone("");
  }

  function resetAdminForm() {
    setAdmName("");
    setAdmEmail("");
    setAdmPassword("");
    setAdmRole("admin");
  }

  function openNewCustomer() {
    resetCustomerForm();
    setEditingId(null);
    setModalType("customer");
    setModalOpen(true);
  }

  function openEditCustomer(c: CustomerUser) {
    setCustCode(c.code);
    setCustName(c.name);
    setCustProject(c.project);
    setCustPassword(c.password);
    setCustEmail(c.contactEmail);
    setCustPhone(c.contactPhone || "");
    setEditingId(c.id);
    setModalType("customer");
    setModalOpen(true);
  }

  function openNewAdmin() {
    resetAdminForm();
    setEditingId(null);
    setModalType("admin");
    setModalOpen(true);
  }

  function openEditAdmin(a: AdminUser) {
    setAdmName(a.name);
    setAdmEmail(a.email);
    setAdmPassword(a.password);
    setAdmRole(a.role);
    setEditingId(a.id);
    setModalType("admin");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  // ── save handlers ────────────────────────────────────────────────
  async function saveCustomer() {
    if (!custCode.trim() || !custName.trim()) return;
    setSaving(true);
    try {
      const userData = {
        type: "customer",
        id: editingId || undefined,
        code: custCode.trim(),
        name: custName.trim(),
        project: custProject,
        // Müşteri login varlığı değil — şifre UI'dan kalktı. Düzenlemede mevcut
        // hash korunur; yeni müşteride rastgele değer (firma girişi fiilen kapalı,
        // giriş yalnız kullanıcılar üzerinden).
        password: custPassword || crypto.randomUUID(),
        contactEmail: custEmail.trim(),
        contactPhone: custPhone.trim() || undefined,
      };
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      await fetchUsers();
      closeModal();
    } catch {} finally { setSaving(false); }
  }

  async function saveAdmin() {
    if (!admName.trim() || !admEmail.trim() || !admPassword.trim()) return;
    setSaving(true);
    try {
      const userData = {
        type: "admin",
        id: editingId || undefined,
        name: admName.trim(),
        email: admEmail.trim(),
        password: admPassword,
        role: admRole,
      };
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      await fetchUsers();
      closeModal();
    } catch {} finally { setSaving(false); }
  }

  // ── delete ───────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === "member") {
        await fetch(`/api/customers/members?id=${deleteTarget.id}`, { method: "DELETE" });
        if (deleteTarget.customerId) await fetchMembers(deleteTarget.customerId);
      } else {
        await fetch(`/api/users?id=${deleteTarget.id}&type=${deleteTarget.type}`, {
          method: "DELETE",
        });
        await fetchUsers();
      }
      setDeleteTarget(null);
    } catch {} finally { setSaving(false); }
  }

  // ── tabs config ──────────────────────────────────────────────────
  const tabs = [
    {
      key: "customers" as const,
      label: "Müşteri Hesapları",
      icon: Building2,
      count: customers.length,
    },
    {
      key: "admins" as const,
      label: "Admin Kullanıcıları",
      icon: Shield,
      count: admins.length,
    },
  ];

  // ── render ───────────────────────────────────────────────────────
  if (loadingUsers) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-32">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
            <Users size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Kullanıcı Yönetimi
            </h1>
            <p className="text-xs text-gray-500">
              Müşteri ve admin hesaplarını yönetin
            </p>
          </div>
        </div>

        <button
          onClick={tab === "customers" ? openNewCustomer : openNewAdmin}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
        >
          <UserPlus size={16} />
          {tab === "customers" ? "Yeni Müşteri" : "Yeni Admin"}
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp(0.1)} className="flex gap-2">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "bg-[#111118] text-gray-400 border border-white/5 hover:text-white hover:border-white/10"
              }`}
            >
              <t.icon size={16} />
              {t.label}
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  active
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-white/5 text-gray-500"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Customer Table ──────────────────────────────────────────── */}
      {tab === "customers" && (
        <motion.div
          {...fadeUp(0.15)}
          className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Kod
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Firma Adı
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Proje
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    İletişim Email
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Kullanıcılar
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((c, i) => {
                  const expanded = expandedIds.includes(c.id);
                  const members = membersByCustomer[c.id] || [];
                  const custProjects = projectsList.filter((p) => p.customer?.id === c.id).map((p) => p.name);
                  const shownProjects = custProjects.length > 0 ? custProjects : [c.project];
                  return (
                  <React.Fragment key={c.id}>
                  <motion.tr
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    onClick={() => toggleCustomerExpand(c.id)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {expanded ? <ChevronDown size={14} className="text-blue-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-500 shrink-0" />}
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold">
                          {c.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-white font-medium">
                      {c.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {shownProjects.map((p) => (
                          <span key={p} className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      {c.contactEmail}
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Müşteri login varlığı değil — şifre yok; kullanıcı sayısı gösterilir */}
                      <span className="px-2.5 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-medium">
                        {(membersByCustomer[c.id]?.length ?? 0)} kullanıcı
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleCustomerExpand(c.id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition"
                          title="Kullanıcılar"
                        >
                          <Users size={15} />
                        </button>
                        <button
                          onClick={() => openEditCustomer(c)}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-yellow-400 transition"
                          title="Düzenle"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "customer",
                              id: c.id,
                              name: c.name,
                            })
                          }
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition"
                          title="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  {expanded && (
                    <tr className="bg-white/[0.015]">
                      <td colSpan={6} className="px-8 py-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Users size={13} className="text-blue-400" />
                            {c.name} — Kullanıcılar ({members.length})
                          </p>
                          <button
                            onClick={() => openMemberModal(c.id, null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-600/25 transition"
                          >
                            <UserPlus size={13} /> Kullanıcı Ekle
                          </button>
                        </div>
                        {membersLoading && !membersByCustomer[c.id] ? (
                          <div className="py-6 flex justify-center"><Loader2 size={18} className="text-blue-400 animate-spin" /></div>
                        ) : members.length === 0 ? (
                          <p className="text-xs text-gray-600 italic py-2">
                            Bu müşterinin henüz kullanıcısı yok. Kullanıcılar /panel&apos;e e-posta + şifre ile giriş yapıp
                            müşterinin tüm projelerindeki task&apos;ları rollerine göre görür.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {members.map((m) => (
                              <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0d0d14] border border-white/5">
                                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                  <Users size={12} className="text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-medium truncate">
                                    {m.name} <span className="text-blue-400/80 font-mono text-xs">@{m.username}</span>
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{m.email}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${(memberRoleBadge[m.role] || memberRoleBadge.uye).cls}`}>
                                  {(memberRoleBadge[m.role] || memberRoleBadge.uye).label}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => openMemberModal(c.id, m)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-yellow-400 transition"
                                    title="Düzenle"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget({ type: "member", id: m.id, name: m.name, customerId: c.id })}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition"
                                    title="Sil"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                  );
                })}
                {customers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-gray-500 text-sm"
                    >
                      Henüz müşteri hesabı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Admin Table ─────────────────────────────────────────────── */}
      {tab === "admins" && (
        <motion.div
          {...fadeUp(0.15)}
          className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ad Soyad
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Şifre
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {admins.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-white font-medium">
                      {a.name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">{a.email}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          a.role === "admin"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        <Shield size={12} />
                        {a.role === "admin" ? "Admin" : "Geliştirici"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      <PasswordCell value={a.password} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPermTarget(a)}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition"
                          title="Yetkiler"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          onClick={() => openEditAdmin(a)}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-yellow-400 transition"
                          title="Düzenle"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "admin",
                              id: a.id,
                              name: a.name,
                            })
                          }
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition"
                          title="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-gray-500 text-sm"
                    >
                      Henüz admin hesabı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Üye (müşteri kullanıcısı) Modal ─────────────────────────── */}
      <AnimatePresence>
        {memberModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMemberModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl bg-[#111118] border border-white/10 p-6 shadow-2xl"
            >
              <button
                onClick={() => setMemberModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
              <h2 className="text-lg font-bold text-white mb-1">
                {memberModal.member ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı"}
              </h2>
              <p className="text-xs text-gray-500 mb-5">
                {customers.find((cc) => cc.id === memberModal.customerId)?.name} firmasının panel kullanıcısı.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); saveMember(); }} className="space-y-3">
                <input
                  placeholder="Ad Soyad"
                  value={memName}
                  onChange={(e) => setMemName(e.target.value)}
                  className={inputCls}
                  required
                />
                <div>
                  <input
                    placeholder="Kullanıcı adı (panel girişi — unique)"
                    value={memUsername}
                    onChange={(e) => setMemUsername(e.target.value.toLowerCase())}
                    className={inputCls}
                    required
                  />
                  <p className="text-[10px] text-gray-600 mt-1">En az 3 karakter; harf, rakam, nokta, alt çizgi, tire</p>
                </div>
                <input
                  placeholder="E-posta (panel girişi — unique)"
                  type="email"
                  value={memEmail}
                  onChange={(e) => setMemEmail(e.target.value)}
                  className={inputCls}
                  required
                />
                <input
                  placeholder={memberModal.member ? "Yeni şifre (boş bırak = değişmez)" : "Şifre"}
                  type="text"
                  value={memPassword}
                  onChange={(e) => setMemPassword(e.target.value)}
                  className={inputCls}
                  required={!memberModal.member}
                />
                <div>
                  <select value={memRole} onChange={(e) => setMemRole(e.target.value)} className={selectCls}>
                    {memberRoles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                    ))}
                  </select>
                </div>
                {memError && (
                  <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{memError}</p>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition mt-2 disabled:opacity-50"
                >
                  {memberModal.member ? "Kaydet" : "Oluştur"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create/Edit Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />

            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg rounded-2xl bg-[#111118] border border-white/10 p-6 shadow-2xl"
            >
              {/* close */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>

              <h2 className="text-lg font-bold text-white mb-1">
                {editingId
                  ? modalType === "customer"
                    ? "Müşteriyi Düzenle"
                    : "Admini Düzenle"
                  : modalType === "customer"
                  ? "Yeni Müşteri Oluştur"
                  : "Yeni Admin Oluştur"}
              </h2>
              <p className="text-xs text-gray-500 mb-5">
                {modalType === "customer"
                  ? "Müşteri hesap bilgilerini girin."
                  : "Admin hesap bilgilerini girin."}
              </p>

              {/* ── Customer Form ────────────────────────────────────── */}
              {modalType === "customer" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveCustomer();
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Müşteri Kodu"
                      value={custCode}
                      onChange={(e) => setCustCode(e.target.value)}
                      className={inputCls}
                      required
                    />
                    <input
                      placeholder="Firma Adı"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                  <select
                    value={custProject}
                    onChange={(e) => setCustProject(e.target.value)}
                    className={selectCls}
                  >
                    {/* Proje elle yazılmaz — /api/projects listesinden seçilir.
                        Düzenlenen müşterinin eski projesi listede yoksa kaybolmasın. */}
                    {(projectNames.includes(custProject) || !custProject
                      ? projectNames
                      : [custProject, ...projectNames]
                    ).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="İletişim Email (info@firma.com)"
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      className={inputCls}
                    />
                    <input
                      placeholder="Telefon"
                      type="tel"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition mt-2"
                  >
                    {editingId ? "Kaydet" : "Oluştur"}
                  </button>
                </form>
              )}

              {/* ── Admin Form ───────────────────────────────────────── */}
              {modalType === "admin" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAdmin();
                  }}
                  className="space-y-3"
                >
                  <input
                    placeholder="Ad Soyad"
                    value={admName}
                    onChange={(e) => setAdmName(e.target.value)}
                    className={inputCls}
                    required
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={admEmail}
                    onChange={(e) => setAdmEmail(e.target.value)}
                    className={inputCls}
                    required
                  />
                  <input
                    placeholder="Şifre"
                    type="text"
                    value={admPassword}
                    onChange={(e) => setAdmPassword(e.target.value)}
                    className={inputCls}
                    required
                  />
                  <select
                    value={admRole}
                    onChange={(e) =>
                      setAdmRole(e.target.value as "admin" | "developer")
                    }
                    className={selectCls}
                  >
                    <option value="admin">Admin</option>
                    <option value="developer">Geliştirici</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition mt-2"
                  >
                    {editingId ? "Kaydet" : "Oluştur"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ───────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />

            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-sm rounded-2xl bg-[#111118] border border-white/10 p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Silmek istediğinize emin misiniz?
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                <span className="text-white font-medium">
                  {deleteTarget.name}
                </span>{" "}
                hesabı kalıcı olarak silinecektir.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition text-sm font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-sm font-medium"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Permissions Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {permTarget && (
          <PermissionsModal
            admin={permTarget}
            onClose={() => setPermTarget(null)}
            onSaved={fetchUsers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
