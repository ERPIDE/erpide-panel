"use client";
import { useState, use, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ShoppingCart, Loader2, Sparkles, Play, BookOpen, ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProduct } from "@/lib/products";
import { useCart } from "@/components/CartProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { priceFor, formatPrice } from "@/lib/currency";
import FinansERPIDEConfigurator from "@/components/FinansERPIDEConfigurator";

function Inner({ productId }: { productId: string }) {
  const product = getProduct(productId);
  const router = useRouter();
  const sp = useSearchParams();
  const initialSku = sp.get("sku");
  const { addItem, lines } = useCart();
  const { currency } = useCurrency();
  const [selectedSku, setSelectedSku] = useState(initialSku || product?.skus.find((s) => s.highlight)?.id || product?.skus[0].id || "");
  const [adding, setAdding] = useState(false);
  const [trialing, setTrialing] = useState(false);
  const [trialMsg, setTrialMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const autoTrialFired = useRef(false);
  const wantsAutoTrial = sp.get("trial") === "1";

  // Kullanıcının mevcut durumu: trial daha önce yapılmış mı, aktif paid SKU var mı?
  // me API'den çekiliyor; null = henüz yüklenmedi (UI default flow).
  const [meReady, setMeReady] = useState(false);
  const [hasTrialedThisProduct, setHasTrialedThisProduct] = useState(false);
  const [activeSkuOfThisProduct, setActiveSkuOfThisProduct] = useState<string | null>(null);
  const [lastSkuOfThisProduct, setLastSkuOfThisProduct] = useState<string | null>(null);
  const [productAppState, setProductAppState] = useState<"active" | "expired" | "none">("none");
  // ai-kontor için: kullanıcının aktif finanserpide planı var mı?
  const [hasActiveFinansERPIDE, setHasActiveFinansERPIDE] = useState(false);

  useEffect(() => {
    if (!product) return;
    fetch("/api/shop/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const trialed: string[] = Array.isArray(d?.trialedProducts) ? d.trialedProducts : [];
        const active: Record<string, string> = (d?.activeSkuByProduct && typeof d.activeSkuByProduct === "object") ? d.activeSkuByProduct : {};
        const last: Record<string, string> = (d?.lastSkuByProduct && typeof d.lastSkuByProduct === "object") ? d.lastSkuByProduct : {};
        const states: Record<string, "active" | "expired" | "none"> = (d?.appStates && typeof d.appStates === "object") ? d.appStates : {};
        setHasTrialedThisProduct(trialed.includes(product.id));
        setActiveSkuOfThisProduct(active[product.id] ?? null);
        setLastSkuOfThisProduct(last[product.id] ?? null);
        setProductAppState(states[product.id] ?? "none");
        setHasActiveFinansERPIDE(states.finanserpide === "active");
        setMeReady(true);
      })
      .catch(() => setMeReady(true));
  }, [product]);

  // ai-kontor sadece aktif FinansERPIDE müşterilerine satılır — kontörler firma bazlı havuza yazılır.
  const aiKontorBlocked = product?.id === "ai-kontor" && meReady && !hasActiveFinansERPIDE;

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 px-6 min-h-screen text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Ürün bulunamadı</h1>
          <Link href="/urunler" className="text-blue-400 hover:underline">Ürünlere dön</Link>
        </main>
        <Footer />
      </>
    );
  }

  const Icon = product.icon;
  const currentSku = product.skus.find((s) => s.id === selectedSku) || product.skus[0];
  const inCartQty = lines.find((l) => l.skuId === currentSku.id)?.quantity || 0;

  async function handleAdd() {
    setAdding(true);
    addItem(currentSku.id, 1);
    await new Promise((r) => setTimeout(r, 300));
    setAdding(false);
  }

  useEffect(() => {
    if (wantsAutoTrial && !autoTrialFired.current && product) {
      autoTrialFired.current = true;
      handleStartTrial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsAutoTrial, product]);

  async function handleStartTrial() {
    setTrialing(true);
    setTrialMsg(null);
    try {
      const me = await fetch("/api/shop/auth/me", { cache: "no-store" }).then((r) => r.json());
      if (!me.user) {
        const next = `/urunler/${product?.id}?sku=${currentSku.id}&trial=1`;
        router.push(`/uye-ol?next=${encodeURIComponent(next)}`);
        return;
      }
      const res = await fetch("/api/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuId: currentSku.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTrialMsg({ ok: false, text: data.error || "Deneme başlatılamadı" });
        setTrialing(false);
        return;
      }
      setTrialMsg({ ok: true, text: `Deneme aktif! Lisans anahtarın hesabımda. Nasıl kullanacağını /docs/${product?.id} sayfasında bul.` });
      setTimeout(() => router.push("/hesabim/lisanslarim"), 1800);
    } catch (e) {
      setTrialMsg({ ok: false, text: "Bağlantı hatası: " + String(e) });
      setTrialing(false);
    }
  }

  // FinansERPIDE özel sayfa: modüler plan konfigüratörü (base + modul + ek kullanıcı).
  // Diğer ürünler (Captcha, AI Kontör, Pocket) standart "Plan Seç" UI'ı kullanır.
  if (product.id === "finanserpide") {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-20 px-6 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <Link href="/urunler" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
              <ArrowLeft size={14} /> Ürünlere dön
            </Link>
            <FinansERPIDEConfigurator
              product={product}
              activeBaseSkuId={activeSkuOfThisProduct}
              hasTrialed={hasTrialedThisProduct}
            />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Link href="/urunler" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
            <ArrowLeft size={14} /> Ürünlere dön
          </Link>

          <div className="grid lg:grid-cols-[1fr_400px] gap-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-5 mb-6">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={36} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{product.name}</h1>
                    {product.comingSoon && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">BETA</span>
                    )}
                  </div>
                  <p className="text-blue-400">{product.tagline}</p>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-6">{product.longDescription}</p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link
                  href={`/docs/${product.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition"
                >
                  <BookOpen size={14} /> Kurulum Kılavuzu
                </Link>
              </div>

              {/* Tanıtım videosu placeholder (diğer ürünler için — FinansERPIDE kendi configurator'unda gösterir) */}
              <section className="mb-10">
                <h2 className="text-xl font-bold text-white mb-3">Tanıtım Videosu</h2>
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/5 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    <Play size={26} className="text-gray-400 ml-1" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">Tanıtım videosu yakında</p>
                  <p className="text-xs text-gray-500 max-w-xs">{product.name} özelliklerini gösteren detaylı tanıtım videosu eklenecek.</p>
                </div>
              </section>

              {/* Ekran görüntüleri placeholder */}
              <section className="mb-10">
                <h2 className="text-xl font-bold text-white mb-3">Ekran Görüntüleri</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-[4/3] rounded-xl bg-gradient-to-br from-gray-900 to-[#0a0a0f] border border-white/5 flex flex-col items-center justify-center">
                      <ImageIcon size={28} className="text-gray-700 mb-2" />
                      <p className="text-[11px] text-gray-600">Ekran {i}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Ürün arayüzünden ekran görüntüleri yakında eklenecek.</p>
              </section>

              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-bold text-white">Plan Seçin</h2>
              </div>
              <div className="space-y-3 mb-8">
                {product.skus.map((sku) => {
                  const { price, currency: skuCcy } = priceFor(sku, currency);
                  const isCurrentPlan = activeSkuOfThisProduct === sku.id;
                  const isExpiredSku = productAppState === "expired" && lastSkuOfThisProduct === sku.id;
                  return (
                  <button
                    key={sku.id}
                    onClick={() => setSelectedSku(sku.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition ${
                      isCurrentPlan
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : isExpiredSku
                        ? "border-amber-500/50 bg-amber-500/5"
                        : selectedSku === sku.id
                        ? "border-blue-500/60 bg-blue-500/5"
                        : "border-white/10 bg-[#111118] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-white">{sku.name}</h3>
                          {isCurrentPlan && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">MEVCUT PLANINIZ</span>
                          )}
                          {isExpiredSku && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">SÜRESİ DOLDU</span>
                          )}
                          {!isCurrentPlan && !isExpiredSku && sku.highlight && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">POPÜLER</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{sku.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{formatPrice(price, skuCcy, { short: true })}</p>
                        <p className="text-xs text-gray-500">/ay</p>
                      </div>
                    </div>
                  </button>
                  );
                })}
              </div>

              <h2 className="text-xl font-bold text-white mb-4">{currentSku.name} Plan Özellikleri</h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {currentSku.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:sticky lg:top-24 h-fit">
              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Seçtiğin plan</p>
                <h3 className="text-xl font-bold text-white mb-1">{product.name} {currentSku.name}</h3>
                <p className="text-sm text-gray-400 mb-5">{currentSku.description}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  {(() => {
                    const { price, currency: skuCcy } = priceFor(currentSku, currency);
                    return (
                      <>
                        <span className="text-3xl font-bold text-white">{formatPrice(price, skuCcy, { short: true })}</span>
                        <span className="text-gray-400">/ay</span>
                      </>
                    );
                  })()}
                </div>
                {(() => {
                  // ai-kontor: FinansERPIDE aktif değilse satın alma engelli (kontör firma bazlı havuza işlenir).
                  if (aiKontorBlocked) {
                    return (
                      <div className="space-y-2 mb-2">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                          AI kontör paketleri, satın alanın firma havuzuna yazılır ve sadece <strong>FinansERPIDE</strong> içinde kullanılır. Önce aktif bir FinansERPIDE planı almalısınız.
                        </div>
                        <Link
                          href="/urunler/finanserpide"
                          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
                        >
                          <ArrowLeft size={16} /> FinansERPIDE&apos;ye Git
                        </Link>
                      </div>
                    );
                  }
                  const isCurrentPlan = meReady && activeSkuOfThisProduct === currentSku.id;
                  const hasAnyActivePlanForProduct = meReady && !!activeSkuOfThisProduct;
                  const isExpiredProduct = productAppState === "expired";
                  const isExpiredSelected = isExpiredProduct && lastSkuOfThisProduct === currentSku.id;
                  const showTrial = meReady && !hasTrialedThisProduct && !hasAnyActivePlanForProduct && !isExpiredProduct;

                  const ctaLabel = isCurrentPlan
                    ? "Bu Plan Aktif"
                    : isExpiredSelected
                    ? (inCartQty > 0 ? `Lisansı Uzat (sepette ${inCartQty}x)` : "Lisansı Uzat (+30 gün)")
                    : isExpiredProduct
                    ? (inCartQty > 0 ? `Bu Plana Yükselt (sepette ${inCartQty}x)` : "Bu Plana Yükselt")
                    : hasAnyActivePlanForProduct
                    ? (inCartQty > 0 ? `Yükselt (sepette ${inCartQty}x)` : "Bu Plana Yükselt")
                    : (inCartQty > 0 ? `Sepete Ekle (zaten ${inCartQty}x var)` : "Sepete Ekle");

                  const isUpgradeOrRenew = isExpiredProduct || hasAnyActivePlanForProduct;
                  return (
                    <>
                      {showTrial && (
                        <button
                          onClick={handleStartTrial}
                          disabled={trialing}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 mb-2"
                        >
                          {trialing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          {trialing ? "Başlatılıyor..." : "3 Gün Ücretsiz Dene"}
                        </button>
                      )}
                      <button
                        onClick={handleAdd}
                        disabled={adding || isCurrentPlan}
                        className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 mb-2 ${
                          isCurrentPlan
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-not-allowed"
                            : isUpgradeOrRenew
                            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 disabled:opacity-50"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 disabled:opacity-50"
                        }`}
                      >
                        {adding ? <Loader2 size={16} className="animate-spin" />
                          : isCurrentPlan ? <Check size={16} />
                          : <ShoppingCart size={16} />}
                        {adding ? "Ekleniyor..." : ctaLabel}
                      </button>
                    </>
                  );
                })()}
                {inCartQty > 0 && (
                  <button
                    onClick={() => router.push("/sepet")}
                    className="w-full py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition text-sm"
                  >
                    Sepete Git →
                  </button>
                )}
                {trialMsg && (
                  <div className={`mt-3 p-3 rounded-lg text-xs ${trialMsg.ok ? "bg-green-500/10 border border-green-500/20 text-green-300" : "bg-red-500/10 border border-red-500/20 text-red-300"}`}>
                    {trialMsg.text}
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center mt-4">
                  Deneme süresinde kart bilgisi gerekmez.<br />
                  Ödeme güvenli iyzico altyapısı ile alınır.
                </p>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Inner productId={productId} />
    </Suspense>
  );
}
