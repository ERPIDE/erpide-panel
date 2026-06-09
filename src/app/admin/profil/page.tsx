"use client";
import { useEffect, useState } from "react";
import { Loader2, UserCircle, Mail, KeyRound, Save, Check } from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminProfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/profil")
      .then((r) => r.json())
      .then((d) => {
        if (d.id) {
          setProfile(d);
          setName(d.name);
          setEmail(d.email);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    // Şifre değişiyorsa eşleşmeli
    if (newPassword && newPassword !== newPasswordConfirm) {
      setMsg({ ok: false, text: "Yeni şifreler eşleşmiyor." });
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (name && name !== profile?.name) body.name = name;
      if (email && email.toLowerCase() !== profile?.email.toLowerCase()) body.email = email;
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      if (Object.keys(body).length === 0) {
        setMsg({ ok: false, text: "Değişiklik yok." });
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data?.error || "save_failed";
        const errMap: Record<string, string> = {
          email_in_use: "Bu e-mail başka bir kullanıcıda zaten kayıtlı.",
          wrong_current_password: "Mevcut şifre yanlış.",
          password_too_short: "Yeni şifre en az 6 karakter olmalı.",
          unauthorized: "Oturum süresi dolmuş, tekrar giriş yap.",
        };
        setMsg({ ok: false, text: errMap[err] || `Hata: ${err}` });
      } else {
        setProfile(data.user);
        setMsg({ ok: true, text: "Profil güncellendi." });
        // Şifre alanlarını temizle
        setCurrentPassword("");
        setNewPassword("");
        setNewPasswordConfirm("");
      }
    } catch (e) {
      setMsg({ ok: false, text: "Bağlantı hatası: " + String(e) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-sm text-red-400">Profil yüklenemedi.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <UserCircle size={28} className="text-blue-400" />
          Profilim
        </h1>
        <p className="text-sm text-gray-400">
          Kendi hesabını yönet — ad, e-mail ve şifre değiştirebilirsin.
          {profile.role && (
            <span className="ml-2 inline-block text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {profile.role === "admin" ? "Admin" : "Geliştirici"}
            </span>
          )}
        </p>
      </header>

      <form onSubmit={save} className="space-y-6">
        <section className="p-6 rounded-2xl bg-[#111118] border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Hesap Bilgileri
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-gray-400 block mb-1.5">Ad Soyad / Kullanıcı Adı</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/40"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                <Mail size={11} /> E-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/40"
                required
              />
            </label>
          </div>
        </section>

        <section className="p-6 rounded-2xl bg-[#111118] border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <KeyRound size={13} /> Şifre Değiştir
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Sadece şifreni değiştirmek istiyorsan bu alanları doldur. Boş bırakırsan şifre değişmez.
          </p>
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs text-gray-400 block mb-1.5">Mevcut Şifre</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 block mb-1.5">Yeni Şifre</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                placeholder="En az 6 karakter"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400 block mb-1.5">Yeni Şifre (Tekrar)</span>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0f] border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/40"
              />
            </label>
          </div>
        </section>

        {msg && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              msg.ok
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border border-red-500/30 text-red-300"
            }`}
          >
            {msg.ok && <Check size={14} />}
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </button>
      </form>
    </div>
  );
}
