"use client";
import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck, Plus, User, Building2, Check, CreditCard, Banknote, Key } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartProvider";
import { priceFor, formatPrice } from "@/lib/currency";
import AddressFormModal from "@/components/account/AddressFormModal";
import type { SavedAddress } from "@/lib/auth/user-store";
import { useTranslation } from "@/lib/i18n";
import { getProduct } from "@/lib/products";

/** Consent satırlarında {link}, {kvkk}, {privacy} placeholder'larını gerçek
 * Link node'larıyla değiştirir — uye-ol'daki helper'ın aynısı. */
function renderWithSlots(text: string, slots: Record<string, React.ReactNode>): React.ReactNode[] {
  const keys = Object.keys(slots);
  if (!keys.length) return [text];
  const re = new RegExp(`\\{(${keys.join("|")})\\}`, "g");
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<Fragment key={`${m.index}-${m[1]}`}>{slots[m[1]]}</Fragment>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function SepetOdemePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { getLineWithSku, total, itemCount } = useCart();
  const items = getLineWithSku();

  const [user, setUser] = useState<{ name: string; surname: string; email: string } | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [consents, setConsents] = useState({ preInfo: false, distance: false, kvkk: false, digitalDelivery: false });
  const [paymentMethod, setPaymentMethod] = useState<"iyzico" | "bank-transfer" | "e-pin">("iyzico");
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
    if (items.length === 0) { setError(t("payment.cart_empty_error")); return; }
    if (paymentMethod === "e-pin") {
      router.push("/hesabim/aktivasyon-kodu");
      return;
    }
    if (!selectedAddressId) { setError(t("payment.select_billing_address")); return; }
    if (!allConsents) { setError(t("payment.all_consents_required")); return; }
    setLoading(true);
    try {
      if (paymentMethod === "bank-transfer") {
        const res = await fetch("/api/payments/bank-transfer/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skuIds: items.map((i) => i.sku.id) }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t("payment.bank_transfer_failed"));
          setLoading(false);
          return;
        }
        router.push(data.redirectUrl);
        return;
      }
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
        setError(data.error || t("payment.checkout_failed"));
        setLoading(false);
        return;
      }
      window.location.href = data.paymentPageUrl;
    } catch (e) {
      setError(t("auth.connection_error") + String(e));
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
          <h1 className="text-2xl font-bold text-white mb-4">{t("cart.empty")}</h1>
          <Link href="/urunler" className="text-blue-400 hover:underline">{t("cart.browse_products")} →</Link>
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
            <ArrowLeft size={14} /> {t("payment.back_to_cart")}
          </Link>
          <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">{t("payment.title")}</span></h1>
          <p className="text-gray-400 text-sm mb-8">
            {t("payment.digital_product_desc")}
          </p>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <fieldset className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <legend className="px-1 text-xs text-gray-400 uppercase tracking-wider">{t("payment.billing_address")}</legend>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
                  >
                    <Plus size={12} /> {t("payment.new_address")}
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-white/10 text-center">
                    <p className="text-sm text-gray-400 mb-3">{t("payment.no_addresses_short")}</p>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
                    >
                      <Plus size={14} /> {t("payment.add_first_address")}
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

              <fieldset className="p-6 rounded-2xl bg-[#111118] border border-white/5 space-y-2">
                <legend className="px-2 text-xs text-gray-400 uppercase tracking-wider">{t("payment.payment_method")}</legend>
                <PaymentRadio
                  selected={paymentMethod === "iyzico"}
                  onSelect={() => setPaymentMethod("iyzico")}
                  icon={<CreditCard size={16} />}
                  title={t("payment.iyzico_card")}
                  desc={t("payment.iyzico_card_desc")}
                />
                <PaymentRadio
                  selected={paymentMethod === "bank-transfer"}
                  onSelect={() => setPaymentMethod("bank-transfer")}
                  icon={<Banknote size={16} />}
                  title={t("payment.bank_transfer")}
                  desc={t("payment.bank_transfer_desc")}
                />
                <PaymentRadio
                  selected={paymentMethod === "e-pin"}
                  onSelect={() => setPaymentMethod("e-pin")}
                  icon={<Key size={16} />}
                  title={t("payment.epin")}
                  desc={t("payment.epin_desc")}
                />
              </fieldset>

              <fieldset className={`p-6 rounded-2xl bg-[#111118] border border-white/5 space-y-3 ${paymentMethod === "e-pin" ? "opacity-50 pointer-events-none" : ""}`}>
                <legend className="px-2 text-xs text-gray-400 uppercase tracking-wider">
                  {t("payment.legal_consents")} {paymentMethod === "e-pin" && <span className="normal-case text-gray-500">{t("payment.epin_no_consents")}</span>}
                </legend>
                <Consent checked={consents.preInfo} onChange={(v) => setConsents({ ...consents, preInfo: v })}>
                  {renderWithSlots(t("payment.consent_pre_info"), {
                    link: <Link href="/sozlesmeler/on-bilgilendirme" target="_blank" className="text-blue-400 hover:underline">{t("payment.consent_pre_info_link")}</Link>,
                  })}
                </Consent>
                <Consent checked={consents.distance} onChange={(v) => setConsents({ ...consents, distance: v })}>
                  {renderWithSlots(t("payment.consent_distance"), {
                    link: <Link href="/sozlesmeler/mesafeli-satis" target="_blank" className="text-blue-400 hover:underline">{t("payment.consent_distance_link")}</Link>,
                  })}
                </Consent>
                <Consent checked={consents.kvkk} onChange={(v) => setConsents({ ...consents, kvkk: v })}>
                  {renderWithSlots(t("payment.consent_kvkk"), {
                    kvkk: <Link href="/sozlesmeler/kvkk" target="_blank" className="text-blue-400 hover:underline">{t("payment.consent_kvkk_link")}</Link>,
                    privacy: <Link href="/sozlesmeler/gizlilik-politikasi" target="_blank" className="text-blue-400 hover:underline">{t("payment.consent_privacy_link")}</Link>,
                  })}
                </Consent>
                <Consent checked={consents.digitalDelivery} onChange={(v) => setConsents({ ...consents, digitalDelivery: v })}>
                  {t("payment.consent_digital")}
                </Consent>
              </fieldset>

              {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
            </motion.div>

            <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:sticky lg:top-24 h-fit">
              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <h3 className="font-semibold text-white mb-4">{t("payment.items_label").replace("{count}", String(itemCount))}</h3>
                <div className="space-y-2 mb-4">
                  {items.map(({ line, sku }) => {
                    const { price, currency } = priceFor(sku, "USD");
                    const prodName = getProduct(sku.productId)?.name || sku.productId;
                    return (
                      <div key={sku.id} className="flex justify-between text-sm">
                        <span className="text-gray-400 truncate">{prodName} {sku.name} ×{line.quantity}</span>
                        <span className="text-gray-300 font-mono">{formatPrice(price * line.quantity, currency, { short: true })}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 border-t border-white/5 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-white font-semibold">{t("payment.monthly")}</span>
                    <span className="text-2xl font-bold text-white">{formatPrice(total, "USD", { short: true })}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t("payment.tax_note_short")}</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || (paymentMethod !== "e-pin" && (!allConsents || !selectedAddressId))}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? t("payment.redirecting") :
                    paymentMethod === "iyzico"        ? t("payment.pay_with_iyzico") :
                    paymentMethod === "bank-transfer" ? t("payment.get_bank_info") :
                                                        t("payment.continue_with_epin")}
                </button>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <ShieldCheck size={12} />
                  {paymentMethod === "iyzico" && t("payment.iyzico_note")}
                  {paymentMethod === "bank-transfer" && t("payment.bank_transfer_note")}
                  {paymentMethod === "e-pin" && t("payment.epin_note")}
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
  const { t } = useTranslation();
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
              {addr.type === "corporate" ? t("address.corporate_badge") : t("address.individual_badge")}
            </span>
            {addr.isBillingDefault && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">{t("payment.billing_badge")}</span>
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

function PaymentRadio({ selected, onSelect, icon, title, desc }: { selected: boolean; onSelect: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition flex items-start gap-3 ${
        selected ? "border-blue-500/60 bg-blue-500/5" : "border-white/10 bg-[#0d0d14] hover:border-white/20"
      }`}
    >
      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selected ? "border-blue-500 bg-blue-500" : "border-white/20"}`}>
        {selected && <Check size={10} className="text-white" />}
      </div>
      <div className={`flex-shrink-0 ${selected ? "text-blue-300" : "text-gray-500"}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${selected ? "text-white" : "text-gray-200"}`}>{title}</p>
        <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{desc}</p>
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
