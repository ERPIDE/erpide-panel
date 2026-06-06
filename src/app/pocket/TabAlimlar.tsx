"use client";
import { useState } from "react";
import {
  Trophy, Plus, Car, Smartphone, Cpu, Home, Sofa, Gem, Package,
  Check, X, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown,
} from "lucide-react";
import { PocketData, BigItem, BigItemCategory, fmt, uid, BIG_ITEM_LABEL } from "./lib";

const CATEGORY_ICON: Record<BigItemCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  vehicle: Car,
  phone: Smartphone,
  electronics: Cpu,
  property: Home,
  furniture: Sofa,
  jewelry: Gem,
  other: Package,
};

const CATEGORY_COLOR: Record<BigItemCategory, string> = {
  vehicle:     "from-blue-600 to-cyan-600",
  phone:       "from-purple-600 to-pink-600",
  electronics: "from-emerald-600 to-teal-600",
  property:    "from-amber-600 to-orange-600",
  furniture:   "from-orange-600 to-red-600",
  jewelry:     "from-yellow-600 to-amber-600",
  other:       "from-gray-600 to-slate-600",
};

export default function TabAlimlar({ data, update }: { data: PocketData; update: (d: PocketData) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<BigItem | null>(null);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<BigItemCategory | "all">("all");

  function addItem(item: BigItem) {
    update({ ...data, bigItems: [item, ...data.bigItems] });
    setShowAdd(false);
  }

  function updateItem(item: BigItem) {
    update({ ...data, bigItems: data.bigItems.map((b) => (b.id === item.id ? item : b)) });
    setEditItem(null);
  }

  function delItem(id: string) {
    if (!confirm("Bu kaydı silmek istiyor musun?")) return;
    update({ ...data, bigItems: data.bigItems.filter((b) => b.id !== id) });
  }

  // Tüm yılları topla (filter dropdown için)
  const years = Array.from(new Set(data.bigItems.map((b) => b.purchaseDate.slice(0, 4)))).sort().reverse();

  const filteredItems = data.bigItems.filter((b) => {
    if (filterYear !== "all" && b.purchaseDate.slice(0, 4) !== filterYear) return false;
    if (filterCat !== "all" && b.category !== filterCat) return false;
    return true;
  });

  // Stats — tüm zamanlar (filtrelenen)
  const totalSpent = filteredItems.reduce((s, b) => s + b.purchasePrice, 0);
  const totalSold = filteredItems.filter((b) => b.soldPrice).reduce((s, b) => s + (b.soldPrice || 0), 0);
  const netGainLoss = totalSold - filteredItems.filter((b) => b.soldPrice).reduce((s, b) => s + b.purchasePrice, 0);
  const activeAssets = filteredItems.filter((b) => !b.soldPrice).length;

  // Yıl bazlı gruplama timeline için
  const byYear: Record<string, BigItem[]> = {};
  for (const b of filteredItems) {
    const y = b.purchaseDate.slice(0, 4);
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(b);
  }
  const sortedYears = Object.keys(byYear).sort().reverse();

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Büyük Alımlar / Satışlar</h2>
          <p className="text-sm text-gray-400 mt-0.5">Araç, telefon, gayrimenkul, elektronik — yıllık alım-satım takibi ve kar/zarar.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-semibold hover:opacity-90">
          <Plus size={14} /> Yeni Alım
        </button>
      </div>

      {/* Filtre + Stat bar */}
      <div className="p-4 rounded-2xl bg-[#0f0a13] border border-white/5 mb-4 grid sm:grid-cols-[1fr_1fr] gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Yıl</label>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm">
            <option value="all">Tüm Yıllar</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Kategori</label>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value as BigItemCategory | "all")} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm">
            <option value="all">Tüm Kategoriler</option>
            {Object.entries(BIG_ITEM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {data.bigItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Toplam Alım" value={fmt(totalSpent)} tone="red" icon={<TrendingDown size={12} />} />
          <Stat label="Satış Geliri" value={fmt(totalSold)} tone="emerald" icon={<TrendingUp size={12} />} />
          <Stat label="Net Kar/Zarar" value={fmt(netGainLoss)} tone={netGainLoss >= 0 ? "emerald" : "red"} />
          <Stat label="Aktif Varlık" value={activeAssets.toString()} tone="blue" />
        </div>
      )}

      {data.bigItems.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0f0a13] border border-white/5 text-center">
          <Trophy size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Henüz büyük alım kaydı yok.</p>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/15 text-pink-300 border border-pink-500/30 text-sm font-medium">
            <Plus size={14} /> İlk varlığını ekle
          </button>
        </div>
      ) : sortedYears.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0f0a13] border border-white/5 text-center">
          <p className="text-sm text-gray-500">Bu filtreyle kayıt yok.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedYears.map((year) => {
            const items = byYear[year];
            const yearSpent = items.reduce((s, b) => s + b.purchasePrice, 0);
            return (
              <section key={year}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{year}</h3>
                  <span className="text-xs text-gray-400 font-mono">{items.length} alım · {fmt(yearSpent)}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {items.map((b) => {
                    const Icon = CATEGORY_ICON[b.category];
                    const isSold = !!b.soldPrice;
                    const gain = isSold ? (b.soldPrice || 0) - b.purchasePrice : 0;
                    return (
                      <div key={b.id} className="p-4 rounded-2xl bg-[#0f0a13] border border-white/5 group">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CATEGORY_COLOR[b.category]} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={20} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <h4 className="font-semibold text-white text-sm truncate">{b.name}</h4>
                              {isSold && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">SATILDI</span>}
                            </div>
                            <p className="text-[10px] text-gray-500">{BIG_ITEM_LABEL[b.category]} · {new Date(b.purchaseDate).toLocaleDateString("tr-TR")}</p>
                            {b.notes && <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{b.notes}</p>}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition flex-shrink-0">
                            <button onClick={() => setEditItem(b)} className="text-gray-500 hover:text-white text-xs px-1">Düzenle</button>
                            <button onClick={() => delItem(b.id)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 inline-flex items-center gap-1"><ArrowDownLeft size={9} /> Alış</p>
                            <p className="text-sm font-mono font-bold text-red-300">{fmt(b.purchasePrice)}</p>
                          </div>
                          {isSold ? (
                            <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                              <p className="text-[9px] uppercase tracking-wider text-gray-500 inline-flex items-center gap-1"><ArrowUpRight size={9} /> Satış</p>
                              <p className="text-sm font-mono font-bold text-emerald-300">{fmt(b.soldPrice!)}</p>
                              <p className={`text-[10px] mt-0.5 ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {gain >= 0 ? "+" : ""}{fmt(gain)} {gain >= 0 ? "kar" : "zarar"}
                              </p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center">
                              <button onClick={() => setEditItem(b)} className="text-[10px] text-pink-300 hover:text-pink-200 underline">Sat olarak işaretle</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showAdd && <ItemModal mode="create" onClose={() => setShowAdd(false)} onSave={addItem} />}
      {editItem && <ItemModal mode="edit" item={editItem} onClose={() => setEditItem(null)} onSave={updateItem} />}
    </>
  );
}


function Stat({ label, value, tone, icon }: { label: string; value: string; tone: "red" | "emerald" | "blue"; icon?: React.ReactNode }) {
  const tones: Record<string, string> = {
    red:     "bg-red-500/5 border-red-500/20",
    emerald: "bg-emerald-500/5 border-emerald-500/20",
    blue:    "bg-blue-500/5 border-blue-500/20",
  };
  return (
    <div className={`p-4 rounded-2xl border ${tones[tone]}`}>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 inline-flex items-center gap-1">{icon} {label}</p>
      <p className="text-xl font-bold font-mono text-white">{value}</p>
    </div>
  );
}


function ItemModal({ mode, item, onClose, onSave }: { mode: "create" | "edit"; item?: BigItem; onClose: () => void; onSave: (b: BigItem) => void }) {
  const [category, setCategory]       = useState<BigItemCategory>(item?.category || "vehicle");
  const [name, setName]               = useState(item?.name || "");
  const [purchasePrice, setPP]        = useState(item?.purchasePrice.toString() || "");
  const [purchaseDate, setPD]         = useState(item?.purchaseDate || new Date().toISOString().split("T")[0]);
  const [soldPrice, setSold]          = useState(item?.soldPrice?.toString() || "");
  const [soldDate, setSoldDate]       = useState(item?.soldDate || "");
  const [notes, setNotes]             = useState(item?.notes || "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const pp = parseFloat(purchasePrice);
    if (!pp || pp <= 0) return;
    const sold = parseFloat(soldPrice);
    onSave({
      id: item?.id || uid("big"),
      category, name: name.trim(),
      purchasePrice: pp, purchaseDate,
      soldPrice: sold > 0 ? sold : undefined,
      soldDate: sold > 0 ? (soldDate || new Date().toISOString().split("T")[0]) : undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-[#0f0a13] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Trophy size={18} className="text-pink-400" /> {mode === "create" ? "Yeni Alım" : "Düzenle"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Kategori</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(BIG_ITEM_LABEL) as BigItemCategory[]).map((c) => {
                const Icon = CATEGORY_ICON[c];
                const sel = category === c;
                return (
                  <button key={c} type="button" onClick={() => setCategory(c)} className={`p-2.5 rounded-xl border text-[10px] font-medium transition flex flex-col items-center gap-1 ${
                    sel ? "bg-pink-500/15 border-pink-500/50 text-pink-200" : "bg-black/30 border-white/10 text-gray-400 hover:border-white/30"
                  }`}>
                    <Icon size={16} />
                    {BIG_ITEM_LABEL[c]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Ad / Model</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Renault Megane 2024 / iPhone 16 Pro" className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Alış Fiyatı (₺)</label>
              <input required type="number" min="0" step="0.01" value={purchasePrice} onChange={(e) => setPP(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Alış Tarihi</label>
              <input type="date" value={purchaseDate} onChange={(e) => setPD(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
            </div>
          </div>
          <div className="pt-3 border-t border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Satıldıysa (opsiyonel)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Satış Fiyatı (₺)</label>
                <input type="number" min="0" step="0.01" value={soldPrice} onChange={(e) => setSold(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Satış Tarihi</label>
                <input type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Not (opsiyonel)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Örn: Sıfır araç, 60 ay kredi" className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-sm" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm">İptal</button>
          <button type="submit" className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"><Check size={14} /> Kaydet</button>
        </div>
      </form>
    </div>
  );
}
