"use client";
/**
 * /admin/projeler — Proje Kataloğu.
 *
 * Tüm projeler tek kaynaktan (/api/projects) yönetilir: task modalları,
 * müşteri formları, rapor filtreleri hep buradan beslenir. Proje =
 * GitHub repo (task'ların yaşadığı yer) + sahibi müşteri.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban, Plus, X, Trash2, Loader2, Building2, ExternalLink, Code2,
} from "lucide-react";
import { useToast } from "@/components/Toast";

type ProjectRow = {
  id: string;
  name: string;
  repo: string;
  createdAt: string;
  customer: { id: string; code: string; name: string } | null;
};

type CustomerOpt = { id: string; code: string; name: string };

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-[#0d0d14] border border-white/10 text-white text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition";

export default function ProjelerPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", repo: "", customerId: "" });

  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchAll() {
    try {
      setLoading(true);
      const [pRes, uRes] = await Promise.all([fetch("/api/projects"), fetch("/api/users")]);
      if (pRes.ok) {
        const d = await pRes.json();
        setProjects(d.projects || []);
      }
      if (uRes.ok) {
        const d = await uRes.json();
        setCustomers((d.customers || []).map((c: CustomerOpt) => ({ id: c.id, code: c.code, name: c.name })));
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function createProject() {
    if (!form.name.trim()) return;
    try {
      setCreating(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          repo: form.repo.trim() || undefined,
          customerId: form.customerId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error || "Proje oluşturulamadı");
        return;
      }
      toast("success", `Proje oluşturuldu: ${data.project.name}`);
      setForm({ name: "", repo: "", customerId: "" });
      setShowModal(false);
      await fetchAll();
    } catch {
      toast("error", "Proje oluşturulamadı");
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/projects?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast("success", "Proje katalogdan kaldırıldı");
        setDeleteTarget(null);
        await fetchAll();
      } else {
        toast("error", "Proje silinemedi");
      }
    } catch {
      toast("error", "Proje silinemedi");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-32">
        <Loader2 size={24} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
            <FolderKanban size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Proje Kataloğu</h1>
            <p className="text-xs text-gray-500">
              Task modalları, müşteri formları ve rapor filtreleri bu katalogdan beslenir
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={16} /> Yeni Proje
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#111118] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proje</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Müşteri</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">GitHub Repo</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Oluşturma</th>
                <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projects.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold">
                      {p.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {p.customer ? (
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <Building2 size={13} className="text-blue-400" />
                        {p.customer.name}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">{p.customer.code}</span>
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs italic">Müşteri bağlı değil</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <a
                      href={`https://github.com/ERPIDE/${p.repo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-gray-400 hover:text-white transition font-mono text-xs"
                    >
                      <Code2 size={13} /> {p.repo} <ExternalLink size={11} className="text-gray-600" />
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {new Date(p.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition"
                      title="Katalogdan kaldır"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500 text-sm">
                    Henüz proje yok. &quot;Yeni Proje&quot; ile ekleyin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl bg-[#111118] border border-white/10 p-6 shadow-2xl"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
              <h2 className="text-lg font-bold text-white mb-1">Yeni Proje Oluştur</h2>
              <p className="text-xs text-gray-500 mb-5">Proje kataloğa eklenir; her yer buradan beslenir.</p>
              <form onSubmit={(e) => { e.preventDefault(); createProject(); }} className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Proje Adı</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="örn. Logo Entegrasyon"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Müşteri</label>
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className={inputCls + " cursor-pointer"}
                  >
                    <option value="">— Müşteri seçilmedi —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">GitHub Repo (opsiyonel)</label>
                  <input
                    value={form.repo}
                    onChange={(e) => setForm({ ...form, repo: e.target.value })}
                    placeholder="boş bırakırsan proje adından üretilir"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-gray-600 mt-1.5">
                    Repo ERPIDE org&apos;unda yoksa otomatik açılır (private). Task&apos;lar issue olarak bu repoda tutulur.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!form.name.trim() || creating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90 transition mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  Oluştur
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
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
                  <h3 className="text-base font-semibold text-white">Projeyi Kaldır</h3>
                  <p className="text-xs text-gray-500">GitHub repo&apos;suna ve task&apos;lara dokunulmaz</p>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">{deleteTarget.name}</span> projesini katalogdan kaldırmak
                istediğinize emin misiniz? Task listesi bu projeyi artık göstermez.
              </p>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition"
                >
                  İptal
                </button>
                <button
                  onClick={deleteProject}
                  disabled={deleting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-gray-800 text-white text-sm font-medium transition flex items-center gap-2"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Kaldır
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
