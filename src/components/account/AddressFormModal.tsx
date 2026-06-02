"use client";
import { useState } from "react";
import { X, Loader2, User, Building2 } from "lucide-react";
import type { SavedAddress, CustomerType } from "@/lib/auth/user-store";

interface Props {
  initial?: SavedAddress;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  label: string;
  type: CustomerType;
  firstName: string;
  lastName: string;
  phone: string;
  identityNumber: string;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  eInvoiceUser: boolean;
  country: string;
  city: string;
  district: string;
  neighborhood: string;
  postalCode: string;
  fullAddress: string;
  isBillingDefault: boolean;
  isShippingDefault: boolean;
}

function emptyForm(): FormState {
  return {
    label: "",
    type: "individual",
    firstName: "",
    lastName: "",
    phone: "",
    identityNumber: "",
    companyName: "",
    taxNumber: "",
    taxOffice: "",
    eInvoiceUser: false,
    country: "Türkiye",
    city: "",
    district: "",
    neighborhood: "",
    postalCode: "",
    fullAddress: "",
    isBillingDefault: false,
    isShippingDefault: false,
  };
}

export default function AddressFormModal({ initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => {
    if (!initial) return emptyForm();
    return {
      label: initial.label,
      type: initial.type,
      firstName: initial.firstName,
      lastName: initial.lastName,
      phone: initial.phone,
      identityNumber: initial.identityNumber || "",
      companyName: initial.companyName || "",
      taxNumber: initial.taxNumber || "",
      taxOffice: initial.taxOffice || "",
      eInvoiceUser: !!initial.eInvoiceUser,
      country: initial.country,
      city: initial.city,
      district: initial.district,
      neighborhood: initial.neighborhood || "",
      postalCode: initial.postalCode || "",
      fullAddress: initial.fullAddress,
      isBillingDefault: !!initial.isBillingDefault,
      isShippingDefault: !!initial.isShippingDefault,
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = initial
        ? `/api/shop/account/addresses/${initial.id}`
        : "/api/shop/account/addresses";
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi");
        setLoading(false);
        return;
      }
      onSaved();
    } catch (e) {
      setError("Bağlantı hatası: " + String(e));
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl my-4 rounded-2xl bg-[#0d0d14] border border-white/10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#0d0d14] z-10">
          <h2 className="text-lg font-bold text-white">{initial ? "Adresi Düzenle" : "Yeni Adres Ekle"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <Field label="Adres Etiketi" placeholder="Örn: Ev, İş, Babamın Evi" value={form.label} onChange={(v) => set("label", v)} required />

          <div>
            <label className="block text-xs text-gray-400 mb-2">Müşteri Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              <TypeButton
                active={form.type === "individual"}
                onClick={() => set("type", "individual")}
                icon={User}
                title="Bireysel"
                desc="Şahıs şirketi olmayan, kişisel alım"
              />
              <TypeButton
                active={form.type === "corporate"}
                onClick={() => set("type", "corporate")}
                icon={Building2}
                title="Kurumsal"
                desc="Şirket adına e-fatura kesilecek"
              />
            </div>
          </div>

          <fieldset className="space-y-4">
            <legend className="text-xs uppercase tracking-wider text-gray-500 mb-2">İletişim</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Ad" value={form.firstName} onChange={(v) => set("firstName", v)} required autoComplete="given-name" />
              <Field label="Soyad" value={form.lastName} onChange={(v) => set("lastName", v)} required autoComplete="family-name" />
            </div>
            <Field label="Telefon" value={form.phone} onChange={(v) => set("phone", v)} required placeholder="+90 5__ ___ __ __" autoComplete="tel" />
          </fieldset>

          {form.type === "individual" ? (
            <fieldset>
              <legend className="text-xs uppercase tracking-wider text-gray-500 mb-2">Bireysel Bilgiler</legend>
              <Field
                label="TC Kimlik No"
                value={form.identityNumber}
                onChange={(v) => set("identityNumber", v.replace(/\D/g, "").slice(0, 11))}
                required
                maxLength={11}
                placeholder="11 hane"
              />
            </fieldset>
          ) : (
            <fieldset className="space-y-3">
              <legend className="text-xs uppercase tracking-wider text-gray-500 mb-2">Kurumsal Bilgiler</legend>
              <Field label="Şirket Ünvanı" value={form.companyName} onChange={(v) => set("companyName", v)} required placeholder="A.Ş. / Ltd. Şti. / Şahıs Şirketi" />
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Vergi No / VKN" value={form.taxNumber} onChange={(v) => set("taxNumber", v.replace(/\D/g, "").slice(0, 10))} required maxLength={10} placeholder="10 hane" />
                <Field label="Vergi Dairesi" value={form.taxOffice} onChange={(v) => set("taxOffice", v)} required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.eInvoiceUser} onChange={(e) => set("eInvoiceUser", e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500" />
                <span className="text-xs text-gray-400">e-Fatura kullanıcısıyım (GİB'de kayıtlı)</span>
              </label>
            </fieldset>
          )}

          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-wider text-gray-500 mb-2">Adres</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="İl" value={form.city} onChange={(v) => set("city", v)} required />
              <Field label="İlçe" value={form.district} onChange={(v) => set("district", v)} required />
              <Field label="Mahalle / Semt" value={form.neighborhood} onChange={(v) => set("neighborhood", v)} />
              <Field label="Posta Kodu" value={form.postalCode} onChange={(v) => set("postalCode", v.replace(/\D/g, "").slice(0, 10))} maxLength={10} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Açık Adres <span className="text-red-400">*</span></label>
              <textarea
                value={form.fullAddress}
                onChange={(e) => set("fullAddress", e.target.value)}
                required
                rows={3}
                placeholder="Sokak, bina no, daire no, kat..."
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
              />
            </div>
          </fieldset>

          <fieldset className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <legend className="text-xs uppercase tracking-wider text-gray-500 px-2">Varsayılan Olarak Kullan</legend>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isBillingDefault} onChange={(e) => set("isBillingDefault", e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500" />
              <span className="text-sm text-gray-300">Varsayılan <strong>fatura</strong> adresi olarak ayarla</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isShippingDefault} onChange={(e) => set("isShippingDefault", e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500" />
              <span className="text-sm text-gray-300">Varsayılan <strong>teslimat</strong> adresi olarak ayarla</span>
            </label>
          </fieldset>

          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-[#0d0d14] py-3 -mx-5 px-5 border-t border-white/5">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition text-sm">
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2 text-sm"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Kaydediliyor..." : initial ? "Güncelle" : "Adresi Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, maxLength, autoComplete }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; maxLength?: number; autoComplete?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
      />
    </div>
  );
}

function TypeButton({ active, onClick, icon: Icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ size?: number; className?: string }>; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border text-left transition ${
        active
          ? "border-blue-500/60 bg-blue-500/10"
          : "border-white/10 bg-black/30 hover:border-white/20"
      }`}
    >
      <Icon size={18} className={`mb-2 ${active ? "text-blue-400" : "text-gray-400"}`} />
      <p className={`text-sm font-semibold ${active ? "text-white" : "text-gray-300"}`}>{title}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
    </button>
  );
}
