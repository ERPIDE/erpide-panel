"use client";
import { useState } from "react";
import { Plus, MapPin, Edit2, Trash2, User, Building2, Star } from "lucide-react";
import AddressFormModal from "./AddressFormModal";
import type { SavedAddress } from "@/lib/auth/user-store";
import { useTranslation } from "@/lib/i18n";

export default function AddressManager({ initialAddresses }: { initialAddresses: SavedAddress[] }) {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/shop/account/addresses", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setAddresses(data.addresses || []);
  }

  async function handleDelete(id: string) {
    if (!confirm(t("address.delete_confirm"))) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/shop/account/addresses/${id}`, { method: "DELETE" });
      if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition text-sm"
        >
          <Plus size={16} /> {t("address.add_modal_title")}
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#111118] border border-white/5 text-center">
          <MapPin className="mx-auto mb-3 text-gray-600" size={36} />
          <p className="text-gray-400 mb-1">{t("address.no_addresses")}</p>
          <p className="text-xs text-gray-500">{t("address.first_address_note")}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              addr={addr}
              onEdit={() => setEditing(addr)}
              onDelete={() => handleDelete(addr.id)}
              deleting={deleting === addr.id}
            />
          ))}
        </div>
      )}

      {creating && (
        <AddressFormModal
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); refresh(); }}
        />
      )}
      {editing && (
        <AddressFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </>
  );
}

function AddressCard({ addr, onEdit, onDelete, deleting }: { addr: SavedAddress; onEdit: () => void; onDelete: () => void; deleting: boolean }) {
  const { t } = useTranslation();
  const TypeIcon = addr.type === "corporate" ? Building2 : User;
  return (
    <div className="p-5 rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/20 transition">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TypeIcon size={16} className="text-gray-500 flex-shrink-0" />
          <h3 className="font-semibold text-white truncate">{addr.label}</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${addr.type === "corporate" ? "bg-purple-500/15 text-purple-300 border-purple-500/30" : "bg-blue-500/15 text-blue-300 border-blue-500/30"}`}>
            {addr.type === "corporate" ? t("address.corporate_badge") : t("address.individual_badge")}
          </span>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition" title={t("address.edit_tooltip")}>
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} disabled={deleting} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 transition" title={t("address.delete_tooltip")}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p className="text-gray-200 font-medium">{addr.firstName} {addr.lastName}</p>
        {addr.type === "corporate" && (
          <>
            <p className="text-gray-400">{addr.companyName}</p>
            <p className="text-xs text-gray-500">VKN: {addr.taxNumber} • {addr.taxOffice}</p>
          </>
        )}
        {addr.type === "individual" && addr.identityNumber && (
          <p className="text-xs text-gray-500">TC: {addr.identityNumber.replace(/(\d{3})(\d{5})(\d{3})/, "$1•••••$3")}</p>
        )}
        <p className="text-xs text-gray-400">{addr.phone}</p>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          {addr.fullAddress}<br />
          {addr.neighborhood && `${addr.neighborhood}, `}{addr.district} / {addr.city} {addr.postalCode}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
        {addr.isBillingDefault && (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">
            <Star size={9} /> {t("address.default_billing_badge")}
          </span>
        )}
        {addr.isShippingDefault && (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Star size={9} /> {t("address.default_shipping_badge")}
          </span>
        )}
      </div>
    </div>
  );
}
