"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  AdminUser,
  CustomerUser,
} from "@/lib/store";

// ── helpers ──────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 10);

const projectOptions = ["CANIAS", "1C ERP", "Python Botları", "Kripto Botu"];

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

  useEffect(() => { fetchUsers(); }, []);

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
    type: "customer" | "admin";
    id: string;
    name: string;
  } | null>(null);

  // ── modal helpers ────────────────────────────────────────────────
  function resetCustomerForm() {
    setCustCode("");
    setCustName("");
    setCustProject(projectOptions[0]);
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
    if (!custCode.trim() || !custName.trim() || !custPassword.trim()) return;
    setSaving(true);
    try {
      const userData = {
        type: "customer",
        id: editingId || undefined,
        code: custCode.trim(),
        name: custName.trim(),
        project: custProject,
        password: custPassword,
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
      await fetch(`/api/users?id=${deleteTarget.id}&type=${deleteTarget.type}`, {
        method: "DELETE",
      });
      await fetchUsers();
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
                    Şifre
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white font-medium">
                      {c.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                        {c.project}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      {c.contactEmail}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      <PasswordCell value={c.password} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                ))}
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
                    {projectOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Şifre"
                    type="text"
                    value={custPassword}
                    onChange={(e) => setCustPassword(e.target.value)}
                    className={inputCls}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="İletişim Email"
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
    </div>
  );
}
