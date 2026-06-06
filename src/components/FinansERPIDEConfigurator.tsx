"use client";
/**
 * FinansERPIDE Plan Konfigüratörü
 *
 * Sabit plan paketleri yerine modüler lisans:
 *   Temel ($20)        → Satış + Satınalma + Stok + Finans (her zaman dahil)
 *   + Muhasebe ($10)   → opsiyonel
 *   + İK ($10)         → opsiyonel
 *   + Üretim ($10)     → opsiyonel
 *   + Ek Kullanıcı ($10 × N) → istediği kadar
 *
 * Sepete eklendiğinde her seçim ayrı line item olur (base + her modül × 1 + ek-kullanıcı × N).
 * Bu sayede mevcut sepet yapısı + iyzico checkout aynen çalışır.
 */
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Minus, ShoppingCart, Loader2, Sparkles, ArrowRight, Briefcase } from "lucide-react";
import type { Product, SKU } from "@/lib/products";
import { useCart } from "@/components/CartProvider";
import { priceFor, formatPrice } from "@/lib/currency";

interface Props {
  product: Product;
  /** Kullanıcının mevcut FinansERPIDE planı varsa onun base SKU'su (yükselt akışı için). */
  activeBaseSkuId?: string | null;
  hasTrialed?: boolean;
}

export default function FinansERPIDEConfigurator({ product, activeBaseSkuId, hasTrialed }: Props) {
  const router = useRouter();
  const { addItem, lines } = useCart();

  // SKU'ları tipine göre grupla
  const baseSku = useMemo(() => product.skus.find((s) => s.kind === "base"), [product]);
  const moduleSkus = useMemo(() => product.skus.filter((s) => s.kind === "module"), [product]);
  const seatSku = useMemo(() => product.skus.find((s) => s.kind === "seat"), [product]);

  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());
  const [extraUsers, setExtraUsers] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addedConfirm, setAddedConfirm] = useState(false);

  if (!baseSku || !seatSku) {
    return <div className="text-red-400">Plan konfigürasyonu yüklenemedi — yönetici ile iletişime geçin.</div>;
  }

  const basePrice = priceFor(baseSku, "USD").price;
  const seatPrice = priceFor(seatSku, "USD").price;
  const moduleTotal = moduleSkus
    .filter((m) => selectedModuleIds.has(m.id))
    .reduce((sum, m) => sum + priceFor(m, "USD").price, 0);
  const total = basePrice + moduleTotal + extraUsers * seatPrice;

  function toggleModule(id: string) {
    setSelectedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddToCart() {
    setAdding(true);
    setAddedConfirm(false);
    // Base SKU
    addItem(baseSku!.id, 1);
    // Modüller
    for (const id of selectedModuleIds) addItem(id, 1);
    // Ek kullanıcılar
    if (extraUsers > 0) addItem(seatSku!.id, extraUsers);
    await new Promise((r) => setTimeout(r, 250));
    setAdding(false);
    setAddedConfirm(true);
    setTimeout(() => setAddedConfirm(false), 2500);
  }

  const inCartBase = lines.find((l) => l.skuId === baseSku.id)?.quantity || 0;
  const isUpgrade = !!activeBaseSkuId; // mevcut planı var → "Yükselt" tonu
  const Icon = product.icon;

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      {/* SOL — Konfigüratör */}
      <div>
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
            <Icon size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{product.name}</h1>
            <p className="text-sm text-blue-400 mt-1">{product.tagline}</p>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">{product.description}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={16} className="text-emerald-400" />
                <h3 className="font-semibold text-white">Temel Paket</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">Her Zaman Dahil</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{baseSku.description}</p>
              <ul className="grid sm:grid-cols-2 gap-1.5">
                {baseSku.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                    <Check size={11} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-white">{formatPrice(basePrice, "USD", { short: true })}</p>
              <p className="text-[11px] text-gray-500">/ay</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3 mt-6 px-1">Opsiyonel Modüller</p>
        <div className="space-y-3 mb-6">
          {moduleSkus.map((mod) => {
            const isSelected = selectedModuleIds.has(mod.id);
            const price = priceFor(mod, "USD").price;
            return (
              <button
                key={mod.id}
                onClick={() => toggleModule(mod.id)}
                className={`w-full text-left p-4 rounded-2xl border transition ${
                  isSelected
                    ? "border-blue-500/60 bg-blue-500/5 ring-2 ring-blue-500/20"
                    : "border-white/10 bg-[#111118] hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                    isSelected ? "bg-blue-500 border-blue-500" : "border-white/20"
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <h4 className="font-semibold text-white">{mod.name}</h4>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-bold text-white">+{formatPrice(price, "USD", { short: true })}</span>
                        <span className="text-[11px] text-gray-500 ml-1">/ay</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{mod.description}</p>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                      {mod.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <Check size={10} className="text-blue-400" /> {f}
                        </li>
                      ))}
                      {mod.features.length > 3 && <li className="text-gray-600">+ {mod.features.length - 3} özellik</li>}
                    </ul>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1">Ek Kullanıcı Koltuğu</p>
        <div className="p-5 rounded-2xl bg-[#111118] border border-white/10 mb-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Ek Kullanıcı</h4>
              <p className="text-xs text-gray-400">
                Temel paket 1 owner içerir. Ek her kullanıcı +{formatPrice(seatPrice, "USD", { short: true })}/ay.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setExtraUsers((v) => Math.max(0, v - 1))}
                className="w-9 h-9 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center justify-center transition"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min={0}
                max={500}
                value={extraUsers}
                onChange={(e) => setExtraUsers(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
                className="w-16 text-center bg-black/40 border border-white/10 rounded-lg text-white font-bold py-2 outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setExtraUsers((v) => Math.min(500, v + 1))}
                className="w-9 h-9 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center justify-center transition"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          {extraUsers > 0 && (
            <p className="text-xs text-blue-300">
              Toplam {extraUsers + 1} kullanıcı · {extraUsers} × {formatPrice(seatPrice, "USD", { short: true })} = {formatPrice(extraUsers * seatPrice, "USD", { short: true })}/ay
            </p>
          )}
        </div>
      </div>

      {/* SAĞ — Sticky Sepet Özeti */}
      <aside className="lg:sticky lg:top-24 h-fit">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/30">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Aylık Toplam</p>
          <div className="flex items-baseline gap-1 mb-5">
            <span className="text-5xl font-bold text-white">{formatPrice(total, "USD", { short: true })}</span>
            <span className="text-sm text-gray-400">/ay</span>
          </div>

          <div className="space-y-2 mb-5 pb-5 border-b border-white/5">
            <SummaryRow label="Temel Paket" value={formatPrice(basePrice, "USD", { short: true })} />
            {Array.from(selectedModuleIds).map((id) => {
              const m = moduleSkus.find((x) => x.id === id);
              if (!m) return null;
              return <SummaryRow key={id} label={m.name} value={`+${formatPrice(priceFor(m, "USD").price, "USD", { short: true })}`} />;
            })}
            {extraUsers > 0 && (
              <SummaryRow
                label={`Ek Kullanıcı × ${extraUsers}`}
                value={`+${formatPrice(extraUsers * seatPrice, "USD", { short: true })}`}
              />
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`w-full py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 mb-2 ${
              isUpgrade
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
            } disabled:opacity-50`}
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> :
             addedConfirm ? <Check size={16} /> :
             <ShoppingCart size={16} />}
            {adding ? "Ekleniyor..."
              : addedConfirm ? "Sepete Eklendi"
              : isUpgrade ? "Sepete Ekle — Mevcut Plana Ek"
              : "Sepete Ekle"}
          </button>

          {inCartBase > 0 && (
            <button
              onClick={() => router.push("/sepet")}
              className="w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition text-sm flex items-center justify-center gap-2"
            >
              Sepete Git <ArrowRight size={14} />
            </button>
          )}

          {!hasTrialed && !activeBaseSkuId && baseSku && (
            <Link
              href={`/urunler/${product.id}?sku=${baseSku.id}&trial=1`}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
            >
              <Sparkles size={14} /> 3 Gün Ücretsiz Dene
            </Link>
          )}

          <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
            Ödemeler iyzico güvenli kart altyapısı üzerinden alınır. USD fiyat, ödeme anında TL karşılığına çevrilir. İstediğin zaman iptal edebilirsin.
          </p>
        </div>

        <SkuItemListAddedToCart product={product} />
      </aside>
    </div>
  );
}


function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-300">{label}</span>
      <span className="text-white font-mono font-semibold">{value}</span>
    </div>
  );
}

function SkuItemListAddedToCart({ product }: { product: Product }) {
  const { lines } = useCart();
  const productLines = lines
    .map((l) => ({ line: l, sku: product.skus.find((s) => s.id === l.skuId) }))
    .filter((x): x is { line: typeof lines[number]; sku: SKU } => !!x.sku);
  if (productLines.length === 0) return null;
  return (
    <div className="mt-4 p-4 rounded-2xl bg-[#111118] border border-white/5">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-2">Sepette {product.name} İçin</p>
      <div className="space-y-1.5">
        {productLines.map(({ line, sku }) => {
          const linePrice = priceFor(sku, "USD").price * line.quantity;
          return (
            <div key={sku.id} className="flex justify-between text-xs">
              <span className="text-gray-400 truncate pr-2">{sku.name}{line.quantity > 1 ? ` × ${line.quantity}` : ""}</span>
              <span className="text-gray-300 font-mono">{formatPrice(linePrice, "USD", { short: true })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
