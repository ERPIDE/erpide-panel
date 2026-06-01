"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartProvider";

export default function SepetOdemePage() {
  const router = useRouter();
  const { getLineWithSku, total, itemCount } = useCart();
  const items = getLineWithSku();
  const [user, setUser] = useState<{ name: string; surname: string; email: string } | null>(null);
  const [form, setForm] = useState({
    gsmNumber: "",
    identityNumber: "",
    address: "",
    city: "İstanbul",
  });
  const [consents, setConsents] = useState({ preInfo: false, distance: false, kvkk: false, digitalDelivery: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!data.user) {
          router.push("/giris?next=/sepet/odeme");
          return;
        }
        setUser(data.user);
      } catch {
        router.push("/giris?next=/sepet/odeme");
      }
    })();
  }, [router]);

  const allConsents = consents.preInfo && consents.distance && consents.kvkk && consents.digitalDelivery;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (items.length === 0) { setError("Sepetin boş"); return; }
    if (!allConsents) { setError("Tüm onay kutularını işaretle"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ skuId: i.sku.id, quantity: i.line.quantity })),
          buyer: form,
          consents,
        }),
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

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-400" size={32} />
        </main>
        <Footer />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 px-6 min-h-screen text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Sepetin boş</h1>
          <Link href="/urunler" className="text-blue-400 hover:underline">Ürünleri incele →</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <Link href="/sepet" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
            <ArrowLeft size={14} /> Sepete dön
          </Link>
          <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Ödeme</span></h1>
          <p className="text-gray-400 text-sm mb-8">Bilgileri tamamla, iyzico'ya yönlendirilirsin.</p>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <fieldset className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <legend className="px-2 text-xs text-gray-400 uppercase tracking-wider">Müşteri Bilgileri</legend>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Ad" value={user.name} disabled />
                  <Field label="Soyad" value={user.surname} disabled />
                  <Field label="E-mail" value={user.email} disabled full />
                  <Field label="GSM (+90...)" value={form.gsmNumber} onChange={(v) => setForm({ ...form, gsmNumber: v })} required />
                  <Field label="TC Kimlik No" value={form.identityNumber} onChange={(v) => setForm({ ...form, identityNumber: v })} required maxLength={11} />
                  <Field label="Şehir" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1.5">Adres</label>
                    <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} required className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition" />
                  </div>
                </div>
              </fieldset>

              <fieldset className="p-6 rounded-2xl bg-[#111118] border border-white/5 space-y-3">
                <legend className="px-2 text-xs text-gray-400 uppercase tracking-wider">Yasal Onaylar</legend>
                <Consent checked={consents.preInfo} onChange={(v) => setConsents({ ...consents, preInfo: v })}>
                  <Link href="/sozlesmeler/on-bilgilendirme" target="_blank" className="text-blue-400 hover:underline">Ön Bilgilendirme Formu</Link>'nu okudum.
                </Consent>
                <Consent checked={consents.distance} onChange={(v) => setConsents({ ...consents, distance: v })}>
                  <Link href="/sozlesmeler/mesafeli-satis" target="_blank" className="text-blue-400 hover:underline">Mesafeli Satış Sözleşmesi</Link>'ni kabul ediyorum.
                </Consent>
                <Consent checked={consents.kvkk} onChange={(v) => setConsents({ ...consents, kvkk: v })}>
                  <Link href="/sozlesmeler/kvkk" target="_blank" className="text-blue-400 hover:underline">KVKK</Link> ve <Link href="/sozlesmeler/gizlilik-politikasi" target="_blank" className="text-blue-400 hover:underline">Gizlilik Politikası</Link>'nı okudum.
                </Consent>
                <Consent checked={consents.digitalDelivery} onChange={(v) => setConsents({ ...consents, digitalDelivery: v })}>
                  Dijital içerik anında teslim edilecek, <strong>cayma hakkımdan feragat ediyorum</strong>.
                </Consent>
              </fieldset>

              {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
            </motion.div>

            <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:sticky lg:top-24 h-fit">
              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <h3 className="font-semibold text-white mb-4">{itemCount} ürün</h3>
                <div className="space-y-2 mb-4">
                  {items.map(({ line, sku }) => (
                    <div key={sku.id} className="flex justify-between text-sm">
                      <span className="text-gray-400 truncate">{sku.productId === "finanserpide" ? "Finans" : "Captcha"} {sku.name} ×{line.quantity}</span>
                      <span className="text-gray-300 font-mono">{(sku.price * line.quantity).toLocaleString("tr-TR")} ₺</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-white/5 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-white font-semibold">Aylık</span>
                    <span className="text-2xl font-bold text-white">{total.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">KDV dahil</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !allConsents}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Yönlendiriliyor..." : "iyzico ile Öde"}
                </button>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <ShieldCheck size={12} /> Kart bilgilerin iyzico'da, biz görmeyiz.
                </div>
              </div>
            </motion.aside>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, value, onChange, disabled = false, required = false, maxLength, full = false }: { label: string; value: string; onChange?: (v: string) => void; disabled?: boolean; required?: boolean; maxLength?: number; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs text-gray-400 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input
        type="text"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm focus:border-blue-500 outline-none transition disabled:opacity-60"
      />
    </div>
  );
}

function Consent({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500 cursor-pointer" />
      <span className="text-xs text-gray-300 leading-relaxed group-hover:text-white transition">{children}</span>
    </label>
  );
}
