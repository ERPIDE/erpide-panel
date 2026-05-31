"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Shield, Briefcase } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPlan } from "@/lib/payments/plans";

export default function OdemePage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan: planId } = use(params);
  const plan = getPlan(planId);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    gsmNumber: "",
    identityNumber: "",
    companyName: "",
    taxNumber: "",
    address: "",
    city: "İstanbul",
  });

  if (!plan) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 px-6 min-h-screen text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Plan bulunamadı</h1>
          <Link href="/fiyatlandirma" className="text-blue-400 hover:underline">
            Fiyatlandırmaya geri dön
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const isFinans = plan.productId === "finanserpide";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, buyer: form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ödeme başlatılamadı");
        setLoading(false);
        return;
      }
      window.location.href = data.paymentPageUrl;
    } catch (e) {
      setError("Bağlantı hatası: " + String(e));
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/fiyatlandirma"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft size={14} /> Planlara dön
          </Link>

          <div className="grid md:grid-cols-[1fr_400px] gap-8">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="p-8 rounded-2xl bg-[#111118] border border-white/5"
            >
              <h1 className="text-2xl font-bold text-white mb-2">Üyelik Bilgileri</h1>
              <p className="text-sm text-gray-400 mb-6">
                Bilgilerin sadece fatura ve hesap yönetimi için kullanılır.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Ad" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                <Field label="Soyad" value={form.surname} onChange={(v) => setForm({ ...form, surname: v })} required />
                <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required full />
                <Field label="GSM" placeholder="+90555..." value={form.gsmNumber} onChange={(v) => setForm({ ...form, gsmNumber: v })} required />
                <Field label="TC Kimlik No" maxLength={11} value={form.identityNumber} onChange={(v) => setForm({ ...form, identityNumber: v })} required />
              </div>

              {isFinans && (
                <div className="mt-6 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                  <h3 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <Briefcase size={14} /> Şirket Bilgileri (FinansERPIDE için zorunlu)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Şirket Adı" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} required full />
                    <Field label="VKN (10 haneli)" maxLength={10} value={form.taxNumber} onChange={(v) => setForm({ ...form, taxNumber: v })} required />
                    <Field label="Şehir" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label className="block text-xs text-gray-400 mb-1">Adres</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Yönlendiriliyor...</> : "Ödemeye Geç (iyzico)"}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                <Shield size={11} className="inline" /> Ödemen iyzico güvenli ödeme altyapısı üzerinden gerçekleşir.
                Kart bilgilerin asla bizim sistemimize ulaşmaz.
              </p>
            </motion.form>

            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-[#111118] border border-white/5 h-fit sticky top-24"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sipariş Özeti</p>
              <h2 className="text-xl font-bold text-white mb-1">{plan.productName}</h2>
              <p className="text-sm text-gray-400 mb-4">{plan.name} planı</p>
              <ul className="space-y-2 mb-6 pb-6 border-b border-white/5">
                {plan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5" /> {f}
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-xs text-gray-500">+ {plan.features.length - 4} özellik daha</li>
                )}
              </ul>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-gray-400">Aylık Tutar</span>
                <span className="text-2xl font-bold text-white">{plan.price.toLocaleString("tr-TR")} {plan.currency}</span>
              </div>
              <p className="text-xs text-gray-500">İstediğin zaman iptal edebilirsin.</p>
            </motion.aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({
  label, value, onChange, type = "text", required = false, full = false, placeholder, maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  full?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-xs text-gray-400 mb-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition"
      />
    </div>
  );
}
