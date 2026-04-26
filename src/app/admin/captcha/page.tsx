"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Key, Users, RefreshCw, Copy, Plus, Power, ExternalLink } from "lucide-react";

const CAPTCHA_API = "http://captcha.erpide.com";

export default function CaptchaAdminPage() {
  const [adminToken, setAdminToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [tab, setTab] = useState<"users" | "licenses" | "create">("users");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // License creation form
  const [newLic, setNewLic] = useState({
    plan: "starter",
    captcha_type: "all",
    max_solves_per_day: 1000,
    duration_days: 30,
    count: 1,
  });

  const headers = { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" };

  // Login to captcha panel
  async function loginCaptcha() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${CAPTCHA_API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: "admin@erpide.com", password: "Erpide2025!" }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        setAdminToken(data.access_token);
        setIsLoggedIn(true);
        setMessage("Captcha Panel connected!");
      } else {
        setMessage("Login failed: " + (data.detail || "Unknown error"));
      }
    } catch {
      setMessage("Cannot connect to Captcha Panel. Is it running?");
    }
    setLoading(false);
  }

  // Load users
  async function loadUsers() {
    try {
      const res = await fetch(`${CAPTCHA_API}/api/v1/dashboard/admin/users`, { headers });
      if (res.ok) setUsers(await res.json());
    } catch { }
  }

  // Load licenses
  async function loadLicenses() {
    try {
      const res = await fetch(`${CAPTCHA_API}/api/v1/admin/license/list`, { headers });
      if (res.ok) setLicenses(await res.json());
    } catch { }
  }

  // Create licenses
  async function createLicenses() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${CAPTCHA_API}/api/v1/admin/license/create`, {
        method: "POST", headers,
        body: JSON.stringify(newLic),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`${data.count} license(s) created!`);
        loadLicenses();
        setTab("licenses");
      } else {
        setMessage("Error: " + (data.detail || "Failed"));
      }
    } catch {
      setMessage("Connection error");
    }
    setLoading(false);
  }

  // Toggle license
  async function toggleLicense(id: string) {
    try {
      await fetch(`${CAPTCHA_API}/api/v1/admin/license/toggle?license_id=${id}`, {
        method: "POST", headers,
      });
      loadLicenses();
    } catch { }
  }

  useEffect(() => {
    if (isLoggedIn) {
      loadUsers();
      loadLicenses();
    }
  }, [isLoggedIn]);

  // Not connected yet
  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl bg-[#111118] border border-white/5 text-center"
        >
          <Shield size={48} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Captcha Panel Management</h2>
          <p className="text-gray-400 text-sm mb-6">
            Connect to the Captcha Panel to manage users and licenses.
          </p>
          <button
            onClick={loginCaptcha}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect to Captcha Panel"}
          </button>
          {message && <p className="mt-4 text-sm text-yellow-400">{message}</p>}
          <div className="mt-6 pt-4 border-t border-white/5">
            <a href={CAPTCHA_API} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1">
              <ExternalLink size={12} /> {CAPTCHA_API}
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Captcha Panel</h1>
          <p className="text-sm text-green-400 mt-1">Connected to {CAPTCHA_API}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { loadUsers(); loadLicenses(); }} className="px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition text-sm flex items-center gap-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
          <a href={CAPTCHA_API} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition text-sm flex items-center gap-1.5">
            <ExternalLink size={14} /> Open Panel
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#111118] border border-white/5">
          <div className="text-sm text-gray-400 mb-1">Total Users</div>
          <div className="text-2xl font-bold">{users.length}</div>
        </div>
        <div className="p-5 rounded-xl bg-[#111118] border border-white/5">
          <div className="text-sm text-gray-400 mb-1">Active Licenses</div>
          <div className="text-2xl font-bold text-green-400">{licenses.filter(l => l.is_active).length}</div>
        </div>
        <div className="p-5 rounded-xl bg-[#111118] border border-white/5">
          <div className="text-sm text-gray-400 mb-1">Unassigned Licenses</div>
          <div className="text-2xl font-bold text-yellow-400">{licenses.filter(l => !l.user_id).length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {[
          { key: "users", label: "Users", icon: Users },
          { key: "licenses", label: "Licenses", icon: Key },
          { key: "create", label: "Create License", icon: Plus },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition ${
              tab === t.key ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
          {message}
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <div className="rounded-xl bg-[#111118] border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-[#0d0d14]">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Username</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">License</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Total Solves</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-sm font-medium">{u.username} {u.is_admin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 ml-1">ADMIN</span>}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    {u.has_active_license
                      ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Active</span>
                      : <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">None</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{u.total_solves || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Licenses Tab */}
      {tab === "licenses" && (
        <div className="rounded-xl bg-[#111118] border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-[#0d0d14]">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">License Key</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Assigned To</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Used</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Expires</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((l, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs text-green-400 font-mono">{l.license_key}</code>
                      <button onClick={() => { navigator.clipboard.writeText(l.license_key); setMessage("Copied!"); }} className="text-gray-500 hover:text-white">
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300 capitalize">{l.plan}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{l.captcha_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{l.username || <span className="text-yellow-400">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{l.total_solves_used}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3">
                    {l.is_active
                      ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Active</span>
                      : <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Disabled</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleLicense(l.id)}
                      className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition ${
                        l.is_active ? "text-red-400 hover:bg-red-500/10" : "text-green-400 hover:bg-green-500/10"
                      }`}
                    >
                      <Power size={12} /> {l.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {licenses.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">No licenses yet. Create one!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create License Tab */}
      {tab === "create" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg p-6 rounded-xl bg-[#111118] border border-white/5"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Key size={18} /> Create License Keys</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Plan</label>
              <select value={newLic.plan} onChange={e => setNewLic({ ...newLic, plan: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm">
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Captcha Type</label>
              <select value={newLic.captcha_type} onChange={e => setNewLic({ ...newLic, captcha_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm">
                <option value="all">All Types</option>
                <option value="slider">Slider Only</option>
                <option value="text">Text/Math Only</option>
                <option value="icon">Icon/Click Only</option>
                <option value="puzzle">Puzzle/Rotate Only</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Max Solves/Day</label>
                <input type="number" value={newLic.max_solves_per_day} onChange={e => setNewLic({ ...newLic, max_solves_per_day: +e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Duration (days)</label>
                <input type="number" value={newLic.duration_days} onChange={e => setNewLic({ ...newLic, duration_days: +e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">How many keys to generate?</label>
              <input type="number" value={newLic.count} min={1} max={100} onChange={e => setNewLic({ ...newLic, count: +e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>

            <button
              onClick={createLicenses}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> {loading ? "Creating..." : `Generate ${newLic.count} License Key(s)`}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
