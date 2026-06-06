"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck, Plus, User, Building2, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartProvider";
import { priceFor, formatPrice } from "@/lib/currency";
import AddressFormModal from "@/components/account/AddressFormModal";
import type { SavedAddress } from "@/lib/auth/user-store";

export default function SepetOdemePage() {
  const router = useRouter();
  const { getLineWithSku, total, itemCount } = useCart();
  const items = getLineWithSku();

  const [user, setUser] = useState<{ name: string; surname: string; email: string } | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [consents, setConsents] = useState({ preInfo: false, distance: false, kvkk: false, digitalDelivery: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/shop/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!data.user) {
          router.push("/giris?next=/sepet/odeme");
          return;
        }
        setUser(data.user);
        await loadAddresses();
      } catch {
        router.push("/giris?next=/sepet/odeme");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function loadAddresses() {
    try {
      const res = await fetch("/api/shop/account/addresses", { cache: "no-store" });
      const data = await res.json();
      const list: SavedAddress[] = data.addresses || [];
      setAddresses(list);
      const billingDefault = list.find((a) => a.isBillingDefault);
      setSelectedAddressId(billingDefault?.id || list[0]?.id || null);
    } catch {
      setAddresses([]);
    }
  }

  const allConsents = consents.preInfo && consents.distance && consents.kvkk && consents.digitalDelivery;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (items.length === 0) { setError("Sepetin boş"); return; }
    if (!selectedAddressId) { setError("Bir fatura adresi seç veya yeni ekle"); return; }
    if (!allConsents) { setError("Tüm onay kutularını işaretle"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ skuId: i.sku.id, quantity: i.line.quantity })),
          billingAddressId: selectedAddressId,
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

  if (!user || addresses === null) {
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
          <p className="text-gray-400 text-sm mb-8">
            Dijital ürün — fatura adresini seç, iyzico'ya yönlendirilirsin. Teslimat yok, lisans anahtarı maille gelir.
          </p>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <fieldset className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <legend className="px-1 text-xs text-gray-400 uppercase tracking-wider">Fatura Adresi</legend>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
                  >
                    <Plus size={12} /> Yeni Adres
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-white/10 text-center">
                    <p className="text-sm text-gray-400 mb-3">Henüz kayıtlı adresin yok.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
                    >
                      <Plus size={14} /> İlk Adresini Ekle
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((addr) => (
                      <AddressRadio
                        key={addr.id}
                        addr={addr}
                        selected={selectedAddressId === addr.id}
                        onSelect={() => setSelectedAddressId(addr.id)}
                      />
                    ))}
                  </div>
                )}
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
                  {items.map(({ line, sku }) => {
                    const { price, currency } = priceFor(sku, "USD");
                    return (
                      <div key={sku.id} className="flex justify-between text-sm">
                        <span className="text-gray-400 truncate">{sku.productId === "finanserpide" ? "Finans" : "Captcha"} {sku.name} ×{line.quantity}</span>
                        <span className="text-gray-300 font-mono">{formatPrice(price * line.quantity, currency, { short: true })}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 border-t border-white/5 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-white font-semibold">Aylık</span>
                    <span className="text-2xl font-bold text-white">{formatPrice(total, "USD", { short: true })}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">KDV dahil • TL karşılığı tahsil edilir</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !allConsents || !selectedAddressId}
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

      {showAddressModal && (
        <AddressFormModal
          onClose={() => setShowAddressModal(false)}
          onSaved={() => { setShowAddressModal(false); loadAddresses(); }}
        />
      )}
    </>
  );
}

function AddressRadio({ addr, selected, onSelect }: { addr: SavedAddress; selected: boolean; onSelect: () => void }) {
  const TypeIcon = addr.type === "corporate" ? Building2 : User;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition ${
        selected
          ? "border-blue-500/60 bg-blue-500/5"
          : "border-white/10 bg-[#0d0d14] hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selected ? "border-blue-500 bg-blue-500" : "border-white/20"}`}>
          {selected && <Check size={10} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon size={14} className="text-gray-500" />
            <span className="font-semibold text-white text-sm">{addr.label}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${addr.type === "corporate" ? "bg-purple-500/15 text-purple-300 border-purple-500/30" : "bg-blue-500/15 text-blue-300 border-blue-500/30"}`}>
              {addr.type === "corporate" ? "KURUMSAL" : "BİREYSEL"}
            </span>
            {addr.isBillingDefault && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">FATURA</span>
            )}
          </div>
          <p className="text-xs text-gray-300">{addr.firstName} {addr.lastName} • {addr.phone}</p>
          {addr.type === "corporate" && (
            <p className="text-[11px] text-gray-500">{addr.companyName} • VKN {addr.taxNumber} • {addr.taxOffice}</p>
          )}
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed truncate">
            {addr.fullAddress} • {addr.district}/{addr.city}
          </p>
        </div>
      </div>
    </button>
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
