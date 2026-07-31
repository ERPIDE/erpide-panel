"use client";
/**
 * FinansERPIDE paket seçimi.
 *
 *   Temel Ticaret ₺749  → satış, satınalma, stok, cari, banka, e-fatura
 *   Tam Ticaret   ₺1.249 → + muhasebe, sabit kıymet, üretim, İK, AI
 *
 * İkisinde de kullanıcı sınırsız. Fiyat TL: ürün Türkiye'ye özel, müşterisi
 * TL düşünüyor; dolar gösterip kurdan çevirmek hem kafa karıştırıyordu hem de
 * kur güncellenmeyince sessizce marj yiyordu.
 *
 * Önceki model modülleri tek tek satıyordu (temel + modül eklentileri + koltuk
 * başı ücret); 5 kullanıcılı bir firma rakiplerin ~4 katına çıkıyordu.
 * Eski SKU'lar `legacy` işaretli, burada gösterilmiyor ama mevcut abonelikler
 * onlara bağlı olduğu için siliniyor değil.
 *
 * AI kontörü buradan satılmıyor: Eylül şu an sadece ERPİDE A.Ş. hesabında
 * açık (mesaj maliyeti ~₺3, müşteriye bu fiyattan satmak anlamsız).
 */
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart, Loader2, ArrowRight, X, ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { Product, SKU } from "@/lib/products";
import { useCart } from "@/components/CartProvider";
import TrialButton from "@/components/TrialButton";
import { priceFor, formatPrice } from "@/lib/currency";

interface Props {
  product: Product;
  /** Kullanıcının mevcut FinansERPIDE planı varsa onun base SKU'su (yükselt akışı için). */
  activeBaseSkuId?: string | null;
}

// FinansERPIDE canlı sistemden çekilmiş ekran görüntüleri — Playwright otomatik
// capture (C:/tmp/erpide-screenshots/capture.js, headless chromium 1920×1080@2x).
// Yeni özellik geldiğinde script tekrar koşulup public/ altı güncellenir.
const FINANSERPIDE_SCREENSHOTS = [
  { src: "/screenshots/finanserpide/02-faturalar-demo.png",        caption: "Faturalar — açık/vadesi geçmiş/ödenmiş filtreleri" },
  { src: "/screenshots/finanserpide/06-muhasebe-yevmiye-demo.png", caption: "TR Muhasebe — otomatik yevmiye + TDHP hesap planı" },
  { src: "/screenshots/finanserpide/09-eylul-ai-demo.png",         caption: "Eylül — konuşarak fatura kes, rapor sor, cari aç" },
  { src: "/screenshots/finanserpide/08-raporlar-demo.png",         caption: "Raporlar — kar/zarar, cari yaşlandırma, mutabakat" },
  { src: "/screenshots/finanserpide/07-finans-bankalar-demo.png",  caption: "Banka & Kasa — çoklu hesap, döviz, hareket takibi" },
  { src: "/screenshots/finanserpide/04-stok-urunler-demo.png",     caption: "Stok — ağırlıklı ortalama maliyet, min seviye alarmı" },
  { src: "/screenshots/finanserpide/03-cari-demo.png",             caption: "Cari — müşteri/tedarikçi, bakiye, mutabakat PDF" },
  { src: "/screenshots/finanserpide/10-ik-bordro-demo.png",        caption: "Bordro — SGK kesintileri, otomatik personel ödemesi" },
  { src: "/screenshots/finanserpide/11-uretim-recete-demo.png",    caption: "Üretim — BOM reçeteleri, sipariş bazlı maliyet" },
  { src: "/screenshots/finanserpide/05-demirbas-demo.png",         caption: "Sabit Kıymet — demirbaş kartları, amortisman planı" },
  { src: "/screenshots/finanserpide/12-amortisman-demo.png",       caption: "Amortisman — aylık otomatik 770/257 yevmiyesi" },
];

export default function FinansERPIDEConfigurator({ product, activeBaseSkuId }: Props) {
  const router = useRouter();
  const { addItem, lines } = useCart();

  // Satıştaki paketler. Emekli SKU'lar (eski temel + modül eklentileri +
  // koltuk) listede duruyor ama gösterilmiyor — mevcut abonelikler onlara bağlı.
  // Aylık / yıllık ayrı SKU'lar; ekranda tek seferde bir dönem gösteriliyor.
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const packages = useMemo(
    () => product.skus.filter((s) => s.kind === "base" && !s.legacy && s.cycle === cycle),
    [product, cycle]
  );

  // Varsayılan seçim: highlight'lı paket (Tam Ticaret), yoksa ilki.
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    () => (packages.find((p) => p.highlight) || packages[0])?.id || ""
  );

  // Dönem değişince seçim listede kalmayabilir — vurgulu pakete düş.
  useEffect(() => {
    if (packages.some((p) => p.id === selectedPackageId)) return;
    setSelectedPackageId((packages.find((p) => p.highlight) || packages[0])?.id || "");
  }, [packages, selectedPackageId]);
  const [adding, setAdding] = useState(false);
  const [addedConfirm, setAddedConfirm] = useState(false);
  // Lightbox — SS'lere tıklayınca tam boy. -1 kapalı, 0..N-1 hero+gallery indeksleri.
  // index 0 = HERO dashboard, 1..N = gallery item'ları (FINANSERPIDE_SCREENSHOTS[i-1]).
  const [lightbox, setLightbox] = useState<number>(-1);
  const totalImages = 1 + FINANSERPIDE_SCREENSHOTS.length;
  const allImages = useMemo(() => [
    { src: "/screenshots/finanserpide/01-dashboard-demo.png", caption: "Dashboard — Komuta Merkezi" },
    ...FINANSERPIDE_SCREENSHOTS,
  ], []);

  // ESC ile kapat, ← → ile gez
  useEffect(() => {
    if (lightbox < 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(-1);
      else if (e.key === "ArrowLeft") setLightbox((i) => (i > 0 ? i - 1 : totalImages - 1));
      else if (e.key === "ArrowRight") setLightbox((i) => (i + 1) % totalImages);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, totalImages]);

  if (packages.length === 0) {
    return <div className="text-red-400">Paket listesi yüklenemedi — yönetici ile iletişime geçin.</div>;
  }

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || packages[0] || null;
  // Para birimini SKU belirler — FinansERPIDE paketleri TL, diğer ürünler
  // (AI kontör vb.) hâlâ USD olabilir. Sabit "USD" yazmak TL fiyatları
  // dolar işaretiyle gösteriyordu.
  const packagePrice = selectedPackage ? priceFor(selectedPackage, "TRY") : null;
  const monthlyTotal = packagePrice?.price ?? 0;
  const monthlyCcy = packagePrice?.currency ?? "TRY";

  async function handleAddToCart() {
    if (!selectedPackage) return;
    setAdding(true);
    setAddedConfirm(false);
    addItem(selectedPackage.id, 1);
    await new Promise((r) => setTimeout(r, 250));
    setAdding(false);
    setAddedConfirm(true);
    setTimeout(() => setAddedConfirm(false), 2500);
  }

  const inCartBase = selectedPackage ? (lines.find((l) => l.skuId === selectedPackage.id)?.quantity || 0) : 0;
  const isUpgrade = !!activeBaseSkuId; // mevcut planı var → "Yükselt" tonu
  const Icon = product.icon;

  return (
    <>
      {/* HERO — Komuta Merkezi (canlı dashboard screenshot) */}
      <div className="mb-10">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
            <Icon size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{product.name}</h1>
            <p className="text-sm text-blue-400 mt-1">{product.tagline}</p>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">{product.description}</p>
          </div>
        </div>
        {/* HERO VİDEO — modül turu (~70 sn, alt yazılı, autoplay+loop+muted) */}
        <video
          className="w-full rounded-2xl border border-white/10 shadow-2xl bg-black"
          controls
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/screenshots/finanserpide/01-dashboard-demo.png"
        >
          <source src="/videos/finanserpide-module-tour.webm" type="video/webm" />
          Tarayıcınız webm video desteği vermiyor.
        </video>
        <p className="text-xs text-gray-500 mt-2 text-center italic">
          Modül turu — 9 modül + Eylül AI, ~70 saniye. Sesli değil, alt yazılı; istediğiniz anda durdurup büyük SS galerisine geçebilirsiniz.
        </p>
      </div>

      {/* EKRAN GÖRÜNTÜLERİ — canlıdan modül galerisi */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">Modüller — Canlı Sistemden</h2>
        <p className="text-sm text-gray-400 mb-5 max-w-2xl">
          Tüm görüntüler gerçek FinansERPIDE arayüzünden alındı. Yeni özellik eklendiğinde otomatik güncellenir.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FINANSERPIDE_SCREENSHOTS.map((s, idx) => (
            <button
              type="button"
              key={s.src}
              onClick={() => setLightbox(idx + 1)}
              className="text-left rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/40 transition group cursor-zoom-in"
              aria-label={`${s.caption} — tam boy görüntüle`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.caption} className="w-full h-auto block group-hover:scale-[1.02] transition-transform" loading="lazy" />
              <figcaption className="px-3 py-2 text-xs text-gray-400 bg-[#0a0a0f] border-t border-white/5 leading-relaxed">{s.caption}</figcaption>
            </button>
          ))}
        </div>
      </div>

      {/* LIGHTBOX — tam boy SS + ← → navigasyon + ESC kapama */}
      {lightbox >= 0 && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(-1)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            onClick={(e) => { e.stopPropagation(); setLightbox(-1); }}
            aria-label="Kapat (ESC)"
          >
            <X size={20} />
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            onClick={(e) => { e.stopPropagation(); setLightbox(lightbox > 0 ? lightbox - 1 : totalImages - 1); }}
            aria-label="Önceki (←)"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % totalImages); }}
            aria-label="Sonraki (→)"
          >
            <ChevronRight size={22} />
          </button>
          <div
            className="max-w-[95vw] max-h-[90vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={allImages[lightbox].src}
              alt={allImages[lightbox].caption}
              className="max-w-full max-h-[80vh] w-auto h-auto rounded-lg border border-white/10"
            />
            <p className="text-sm text-gray-300 text-center max-w-2xl">{allImages[lightbox].caption}</p>
            <p className="text-xs text-gray-500">{lightbox + 1} / {totalImages}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      {/* SOL — Konfigüratör */}
      <div>
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
            <Icon size={26} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Paketinizi Seçin</h2>
            <p className="text-sm text-gray-400 mt-1">
              Hepsinde kullanıcı sayısı sınırsız. İstediğiniz zaman yükseltebilirsiniz.
            </p>
          </div>
        </div>

        {/* Dönem seçici — yıllıkta 2 ay bedava, bunu görünür kılıyoruz. */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#111118] border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              cycle === "monthly" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Aylık
          </button>
          <button
            type="button"
            onClick={() => setCycle("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
              cycle === "yearly" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Yıllık
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              2 AY BEDAVA
            </span>
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {packages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id;
            const { price, currency: pkgCcy } = priceFor(pkg, "TRY");
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`relative w-full text-left p-5 rounded-2xl border transition ${
                  isSelected
                    ? "border-blue-500/60 bg-blue-500/5 ring-2 ring-blue-500/20"
                    : "border-white/10 bg-[#111118] hover:border-white/25"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-2 left-5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white uppercase tracking-wider">
                    En çok tercih edilen
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition ${
                    isSelected ? "bg-blue-500 border-blue-500" : "border-white/20"
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <h3 className="font-semibold text-white text-lg">{pkg.name}</h3>
                      <div className="text-right flex-shrink-0">
                        <span className="text-2xl font-bold text-white">{formatPrice(price, pkgCcy, { short: true })}</span>
                        <span className="text-[11px] text-gray-500 ml-1">{cycle === "yearly" ? "/yıl" : "/ay"}</span>
                        <p className="text-[10px] text-gray-500">
                          + KDV
                          {cycle === "yearly" && (() => {
                            // Yıllık tutarı aylığa bölüp "ayda şu kadar" diyoruz;
                            // müşteri iki dönemi kafadan karşılaştırabilsin.
                            const monthlyEq = Math.round(price / 12);
                            return <> · ayda ≈ {formatPrice(monthlyEq, pkgCcy, { short: true })}</>;
                          })()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{pkg.description}</p>
                    <ul className="grid sm:grid-cols-2 gap-1.5">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                          <Check size={11} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-6">
          <Users size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-300 leading-relaxed">
            <strong className="text-emerald-300">Kullanıcı başına ücret yok.</strong> Muhasebecinizi,
            depo sorumlunuzu, saha ekibinizi ekleyin — hepsi paket fiyatına dahil.
          </p>
        </div>

      </div>

      {/* SAĞ — Sticky Sepet Özeti */}
      <aside className="lg:sticky lg:top-24 h-fit">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/30">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">{cycle === "yearly" ? "Yıllık Toplam" : "Aylık Toplam"}</p>
          <div className="flex items-baseline gap-1 mb-5">
            <span className="text-5xl font-bold text-white">{formatPrice(monthlyTotal, monthlyCcy, { short: true })}</span>
            <span className="text-sm text-gray-400">{cycle === "yearly" ? "/yıl" : "/ay"}</span>
          </div>

          <div className="space-y-2 mb-5 pb-5 border-b border-white/5">
            {selectedPackage && (
              <>
                <SummaryRow
                  label={selectedPackage.name}
                  value={`${formatPrice(monthlyTotal, monthlyCcy, { short: true })}${cycle === "yearly" ? "/yıl" : "/ay"}`}
                />
                <p className="text-[10px] text-gray-500">Sınırsız kullanıcı dahil · fiyatlara KDV dahil değildir</p>
              </>
            )}
          </div>

          {!isUpgrade && selectedPackage && (
            <div className="mb-2">
              <TrialButton
                skuId={selectedPackage.id}
                productId={product.id}
                returnTo="/urunler/finanserpide"
              />
              <p className="text-[11px] text-gray-500 text-center mt-2 mb-3">
                14 gün boyunca ücretsiz. Süre bitmeden iptal edersen hiçbir ücret alınmaz;
                iptal etmezsen aboneliğin kendiliğinden başlar.
              </p>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={adding}
            className={`w-full py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 mb-2 ${
              isUpgrade
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90"
                : "bg-blue-600 text-white hover:bg-blue-700"
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

          <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
            Fiyatlara KDV dahil değildir. Ödemeler iyzico güvenli kart altyapısı üzerinden alınır. İstediğin zaman iptal edebilirsin.
          </p>
        </div>

        <SkuItemListAddedToCart product={product} />
      </aside>
      </div>
    </>
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
          const linePriced = priceFor(sku, "TRY");
          const linePrice = linePriced.price * line.quantity;
          return (
            <div key={sku.id} className="flex justify-between text-xs">
              <span className="text-gray-400 truncate pr-2">{sku.name}{line.quantity > 1 ? ` × ${line.quantity}` : ""}</span>
              <span className="text-gray-300 font-mono">{formatPrice(linePrice, linePriced.currency, { short: true })}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
