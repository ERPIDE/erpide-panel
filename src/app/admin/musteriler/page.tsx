"use client";
/**
 * /admin/musteriler — Müşteri Kataloğu (ağaç görünümü).
 *
 * Müşteri = firma kaydı (login varlığı DEĞİL — şifre yok). Altında:
 *  - Panel kullanıcıları (CustomerMember): kullanıcı adı + e-posta + rol
 *  - Projeler (Proje Kataloğu'ndan, customerId bağıyla)
 * Birden çok müşteri aynı anda açık kalabilir.
 */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, UserPlus, Pencil, Trash2, X, Loader2, Users,
  ChevronDown, ChevronRight, FolderKanban,
} from "lucide-react";
import { useToast } from "@/components/Toast";

type CustomerRow = {
  id: string;
  code: string;
  name: string;
  project: string;
  contactEmail: string;
  contactPhone?: string;
  password?: string;
};

type MemberRow = {
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

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-[#0d0d14] border border-white/10 text-white text-sm placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition";

export default function MusterilerPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // müşteri modal
  const [custModal, setCustModal] = useState<{ editing: CustomerRow | null } | null>(null);
  const [cCode, setCCode] = useState("");
  const [cName, setCName] = useState("");
  const [cProject, setCProject] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");

  // üye modal
  const [memberModal, setMemberModal] = useState<{ customerId: string; member: MemberRow | null } | null>(null);
  const [mName, setMName] = useState("");
  const [mUsername, setMUsername] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mPassword, setMPassword] = useState("");
  const [mRole, setMRole] = useState("uye");
  const [mError, setMError] = useState("");

  // silme
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "customer" | "member"; id: string; name: string; customerId?: string } | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchAll() {
    try {
      const [uRes, mRes, pRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/customers/members"),
        fetch("/api/projects"),
      ]);
      if (uRes.ok) setCustomers((await uRes.json()).customers || []);
      if (mRes.ok) setMembers((await mRes.json()).members || []);
      if (pRes.ok) setProjects((await pRes.json()).projects || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const projectNames = projects.map((p) => p.name);

  function toggle(id: string) {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function openCustModal(editing: CustomerRow | null) {
    setCCode(editing?.code ?? "");
    setCName(editing?.name ?? "");
    setCProject(editing?.project ?? projectNames[0] ?? "");
    setCEmail(editing?.contactEmail ?? "");
    setCPhone(editing?.contactPhone ?? "");
    setCustModal({ editing });
  }

  async function saveCustomer() {
    if (!cCode.trim() || !cName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "customer",
          id: custModal?.editing?.id || undefined,
          code: cCode.trim().toUpperCase(),
          name: cName.trim(),
          project: cProject,
          // Müşteri login varlığı değil — düzenlemede mevcut şifre korunur,
          // yeni kayıtta rastgele değer (giriş yalnız kullanıcılar üzerinden).
          password: custModal?.editing?.password || crypto.randomUUID(),
          contactEmail: cEmail.trim(),
          contactPhone: cPhone.trim() || undefined,
        }),
      });
      toast("success", custModal?.editing ? "Müşteri güncellendi" : "Müşteri oluşturuldu");
      setCustModal(null);
      await fetchAll();
    } catch {
      toast("error", "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  function openMemberModal(customerId: string, member: MemberRow | null) {
    setMName(member?.name ?? "");
    setMUsername(member?.username ?? "");
    setMEmail(member?.email ?? "");
    setMPassword("");
    setMRole(member?.role ?? "uye");
    setMError("");
    setMemberModal({ customerId, member });
  }

  async function saveMember() {
    if (!memberModal) return;
    const isEdit = !!memberModal.member;
    if (!mName.trim() || !mUsername.trim() || !mEmail.trim() || (!isEdit && !mPassword)) return;
    setSaving(true);
    setMError("");
    try {
      const res = await fetch("/api/customers/members", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { id: memberModal.member!.id, name: mName.trim(), username: mUsername.trim(), email: mEmail.trim(), role: mRole, password: mPassword || undefined }
            : { customerId: memberModal.customerId, name: mName.trim(), username: mUsername.trim(), email: mEmail.trim(), password: mPassword, role: mRole }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setMError(data.error || "Kaydedilemedi");
        return;
      }
      toast("success", isEdit ? "Kullanıcı güncellendi" : "Kullanıcı eklendi");
      setMemberModal(null);
      await fetchAll();
    } catch {
      setMError("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "member") {
        await fetch(`/api/customers/members?id=${deleteTarget.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/users?id=${deleteTarget.id}&type=customer`, { method: "DELETE" });
      }
      toast("success", "Silindi");
      setDeleteTarget(null);
      await fetchAll();
    } catch {
      toast("error", "Silinemedi");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-32">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
            <Building2 size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Müşteri Kataloğu</h1>
            <p className="text-xs text-gray-500">
              Firma kayıtları · altında panel kullanıcıları ve projeler — giriş yalnız kullanıcılar üzerinden
            </p>
          </div>
        </div>
        <button
          onClick={() => openCustModal(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
        >
          <Building2 size={16} /> Yeni Müşteri
        </button>
      </div>

      {/* Ağaç liste */}
      <div className="space-y-3">
        {customers.map((c) => {
          const expanded = expandedIds.includes(c.id);
          const custMembers = members.filter((m) => m.customerId === c.id);
          const custProjects = projects.filter((p) => p.customer?.id === c.id);
          return (
            <div key={c.id} className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
              {/* Müşteri başlık satırı */}
              <div
                onClick={() => toggle(c.id)}
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition"
              >
                {expanded ? <ChevronDown size={16} className="text-blue-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-500 shrink-0" />}
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold shrink-0">{c.code}</span>
                <span className="text-white font-semibold">{c.name}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(custProjects.length > 0 ? custProjects.map((p) => p.name) : [c.project]).map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-medium">{p}</span>
                  ))}
                </div>
                <span className="text-xs text-gray-500 ml-auto mr-2 hidden sm:block">{c.contactEmail}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-[11px] shrink-0">
                  {custMembers.length} kullanıcı
                </span>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openCustModal(c)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-yellow-400 transition" title="Düzenle">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget({ type: "customer", id: c.id, name: c.name })} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition" title="Sil">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Genişletilmiş içerik */}
              {expanded && (
                <div className="border-t border-white/5 px-6 py-4 space-y-4 bg-white/[0.015]">
                  {/* Kullanıcılar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Users size={13} className="text-blue-400" /> Kullanıcılar ({custMembers.length})
                      </p>
                      <button
                        onClick={() => openMemberModal(c.id, null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-600/25 transition"
                      >
                        <UserPlus size={13} /> Kullanıcı Ekle
                      </button>
                    </div>
                    {custMembers.length === 0 ? (
                      <p className="text-xs text-gray-600 italic">
                        Henüz kullanıcı yok — /panel&apos;e giriş kullanıcı adı, e-posta veya müşteri koduyla yapılır.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {custMembers.map((m) => (
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
                              <button onClick={() => openMemberModal(c.id, m)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-yellow-400 transition" title="Düzenle">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => setDeleteTarget({ type: "member", id: m.id, name: m.name, customerId: c.id })} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition" title="Sil">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Projeler */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <FolderKanban size={13} className="text-purple-400" /> Projeler ({custProjects.length})
                    </p>
                    {custProjects.length === 0 ? (
                      <p className="text-xs text-gray-600 italic">Katalogda bu müşteriye bağlı proje yok — Projeler sayfasından ekleyin.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {custProjects.map((p) => (
                          <span key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d0d14] border border-white/5 text-xs">
                            <span className="text-purple-400 font-medium">{p.name}</span>
                            <span className="text-gray-600 font-mono">{p.repo}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {customers.length === 0 && (
          <div className="rounded-2xl bg-[#111118] border border-white/5 px-5 py-12 text-center text-gray-500 text-sm">
            Henüz müşteri yok.
          </div>
        )}
      </div>

      {/* Müşteri Modal */}
      <AnimatePresence>
        {custModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCustModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl bg-[#111118] border border-white/10 p-6 shadow-2xl"
            >
              <button onClick={() => setCustModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
                <X size={18} />
              </button>
              <h2 className="text-lg font-bold text-white mb-1">{custModal.editing ? "Müşteriyi Düzenle" : "Yeni Müşteri"}</h2>
              <p className="text-xs text-gray-500 mb-5">Firma kaydı — şifre yok; giriş, altındaki kullanıcılarla yapılır.</p>
              <form onSubmit={(e) => { e.preventDefault(); saveCustomer(); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Müşteri Kodu" value={cCode} onChange={(e) => setCCode(e.target.value.toUpperCase())} className={inputCls} required />
                  <input placeholder="Firma Adı" value={cName} onChange={(e) => setCName(e.target.value)} className={inputCls} required />
                </div>
                <select value={cProject} onChange={(e) => setCProject(e.target.value)} className={inputCls + " cursor-pointer"}>
                  <option value="">— Ana proje (opsiyonel) —</option>
                  {(projectNames.includes(cProject) || !cProject ? projectNames : [cProject, ...projectNames]).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="İletişim Email (info@firma.com)" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} className={inputCls} />
                  <input placeholder="Telefon" type="tel" value={cPhone} onChange={(e) => setCPhone(e.target.value)} className={inputCls} />
                </div>
                <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition mt-2 disabled:opacity-50">
                  {custModal.editing ? "Kaydet" : "Oluştur"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Üye Modal */}
      <AnimatePresence>
        {memberModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMemberModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl bg-[#111118] border border-white/10 p-6 shadow-2xl"
            >
              <button onClick={() => setMemberModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
                <X size={18} />
              </button>
              <h2 className="text-lg font-bold text-white mb-1">{memberModal.member ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı"}</h2>
              <p className="text-xs text-gray-500 mb-5">
                {customers.find((cc) => cc.id === memberModal.customerId)?.name} firmasının panel kullanıcısı.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); saveMember(); }} className="space-y-3">
                <input placeholder="Ad Soyad" value={mName} onChange={(e) => setMName(e.target.value)} className={inputCls} required />
                <div>
                  <input placeholder="Kullanıcı adı (panel girişi — unique)" value={mUsername} onChange={(e) => setMUsername(e.target.value.toLowerCase())} className={inputCls} required />
                  <p className="text-[10px] text-gray-600 mt-1">En az 3 karakter; harf, rakam, nokta, alt çizgi, tire</p>
                </div>
                <input placeholder="E-posta (panel girişi — unique)" type="email" value={mEmail} onChange={(e) => setMEmail(e.target.value)} className={inputCls} required />
                <input
                  placeholder={memberModal.member ? "Yeni şifre (boş bırak = değişmez)" : "Şifre"}
                  type="text"
                  value={mPassword}
                  onChange={(e) => setMPassword(e.target.value)}
                  className={inputCls}
                  required={!memberModal.member}
                />
                <select value={mRole} onChange={(e) => setMRole(e.target.value)} className={inputCls + " cursor-pointer"}>
                  {memberRoles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                  ))}
                </select>
                {mError && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{mError}</p>}
                <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition mt-2 disabled:opacity-50">
                  {memberModal.member ? "Kaydet" : "Oluştur"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Silme Onayı */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div className="fixed inset-0 z-[60] flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl bg-[#111118] border border-white/10 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {deleteTarget.type === "customer" ? "Müşteriyi Sil" : "Kullanıcıyı Sil"}
                  </h3>
                  <p className="text-xs text-gray-500">Bu işlem geri alınamaz</p>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">{deleteTarget.name}</span> kaydını silmek istediğinize emin misiniz?
                {deleteTarget.type === "customer" && " Altındaki tüm kullanıcılar da silinir."}
              </p>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition">
                  İptal
                </button>
                <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-gray-800 text-white text-sm font-medium transition flex items-center gap-2">
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
