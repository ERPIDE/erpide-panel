"use client";
import { useState, use, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ShoppingCart, Loader2, Sparkles, Play, BookOpen, ImageIcon, ExternalLink, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProduct, getProductText } from "@/lib/products";
import { useCart } from "@/components/CartProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { priceFor, formatPrice } from "@/lib/currency";
import FinansERPIDEConfigurator from "@/components/FinansERPIDEConfigurator";
import MobileAppStoreCard from "@/components/MobileAppStoreCard";
import { ProductLogo } from "@/components/ProductLogo";
import { useTranslation } from "@/lib/i18n";

// 1C ürünleri için lokalize özellik listeleri. Top-level sabit — render
// içinde ternary + Array literal hesaplamayı SSR'da minify'la bozulma
// riskini eliminate eder, hem de TR/EN/RU/KK dilinde tutarlı içerik sağlar.
type FeatureLocale = "en" | "tr" | "ru" | "kk";
const ONEC_FEATURES: Record<"1c-erp" | "1c-drive", Record<FeatureLocale, string[]>> = {
  "1c-erp": {
    tr: [
      "Üretim Planlama (MPS) — kesikli + sürekli",
      "MRP — malzeme ihtiyaç planlama",
      "Make-to-Order + Make-to-Stock",
      "Çok depolu envanter + maliyet",
      "Tedarik zinciri yönetimi",
      "Finans + bütçeleme + regulated raporlama",
      "KPI dashboard'ları + analitik",
      "1C:Enterprise platform üstü ölçeklenir",
    ],
    en: [
      "Production Planning (MPS) — discrete + process",
      "MRP — material requirements planning",
      "Make-to-Order + Make-to-Stock",
      "Multi-warehouse inventory + costing",
      "Supply chain management",
      "Finance + budgeting + regulated reporting",
      "KPI dashboards + analytics",
      "Scalable on 1C:Enterprise platform",
    ],
    ru: [
      "Планирование производства (MPS) — дискретное + непрерывное",
      "MRP — планирование потребности в материалах",
      "Производство на заказ + на склад",
      "Многоскладской учет + себестоимость",
      "Управление цепями поставок",
      "Финансы + бюджетирование + регламентированная отчетность",
      "KPI-дашборды + аналитика",
      "Масштабируется на 1C:Enterprise",
    ],
    kk: [
      "Өндірісті жоспарлау (MPS) — дискретті + үздіксіз",
      "MRP — материалдық қажеттіліктерді жоспарлау",
      "Тапсырыс бойынша + қоймаға өндіру",
      "Бірнеше қоймадағы есеп + өзіндік құн",
      "Жабдықтау тізбегін басқару",
      "Қаржы + бюджеттеу + реттелетін есептілік",
      "KPI-дашбордтар + аналитика",
      "1C:Enterprise платформасында масштабталады",
    ],
  },
  "1c-drive": {
    tr: [
      "Çok seviyeli BOM (reçete)",
      "MRP + tedarik planlama",
      "Satış / sipariş / sevkiyat / fatura akışı",
      "Stok + depo + sayım",
      "Müşteri/tedarikçi (CRM)",
      "Hizmet yönetimi + servis",
      "Mobil uygulama (iOS + Android)",
      "1C:Drive Lite — bulut ön-muhasebe",
    ],
    en: [
      "Multi-level BOM (recipes)",
      "MRP + supply planning",
      "Sales / order / shipment / invoice flow",
      "Stock + warehouse + inventory count",
      "Customer/supplier (CRM)",
      "Service management",
      "Mobile app (iOS + Android)",
      "1C:Drive Lite — cloud pre-accounting",
    ],
    ru: [
      "Многоуровневая BOM (рецепты)",
      "MRP + планирование закупок",
      "Продажи / заказ / отгрузка / счет",
      "Склад + инвентаризация",
      "Клиенты/поставщики (CRM)",
      "Управление услугами + сервис",
      "Мобильное приложение (iOS + Android)",
      "1C:Drive Lite — облачный предучет",
    ],
    kk: [
      "Көп деңгейлі BOM (рецепттер)",
      "MRP + жабдықтауды жоспарлау",
      "Сату / тапсырыс / жөнелту / шот",
      "Қойма + түгендеу",
      "Клиенттер/жеткізушілер (CRM)",
      "Қызмет көрсету + сервис",
      "Мобильді қосымша (iOS + Android)",
      "1C:Drive Lite — бұлттық алдын ала есеп",
    ],
  },
};

// Locale-aware 1C section başlık + ERPIDE pitch metinleri
const ONEC_LABELS: Record<FeatureLocale, { heading: string; pitch: (productName: string) => React.ReactNode }> = {
  tr: {
    heading: "Öne Çıkan Özellikler",
    pitch: (n) => (<><strong className="text-gray-300">ERPIDE</strong> {n} için Türkiye&apos;de: lisanslama · kurulum · TR/KZ yerelleştirme · veri taşıma · kullanıcı eğitimi · özelleştirme · canlı destek.</>),
  },
  en: {
    heading: "Key Features",
    pitch: (n) => (<><strong className="text-gray-300">ERPIDE</strong> delivers {n} in Türkiye: licensing · installation · TR/KZ localization · data migration · user training · customization · live support.</>),
  },
  ru: {
    heading: "Ключевые возможности",
    pitch: (n) => (<><strong className="text-gray-300">ERPIDE</strong> поставляет {n} в Турции: лицензирование · внедрение · локализация TR/KZ · миграция данных · обучение · доработка · поддержка.</>),
  },
  kk: {
    heading: "Негізгі мүмкіндіктер",
    pitch: (n) => (<><strong className="text-gray-300">ERPIDE</strong> Түркияда {n} ұсынады: лицензиялау · орнату · TR/KZ локализация · деректерді көшіру · оқыту · бейімдеу · қолдау.</>),
  },
};

// Demo + Resmi link buton metinleri
const ONEC_BUTTONS: Record<FeatureLocale, { liveDemo: string; officialPage: string; contactCTA: string }> = {
  tr: { liveDemo: "Canlı Demo", officialPage: "Resmi Üretici Sayfası", contactCTA: "iletişime geçin" },
  en: { liveDemo: "Live Demo", officialPage: "Official Vendor Page", contactCTA: "contact us" },
  ru: { liveDemo: "Живая демонстрация", officialPage: "Страница производителя", contactCTA: "связаться с нами" },
  kk: { liveDemo: "Тікелей демо", officialPage: "Өндіруші парағы", contactCTA: "бізбен байланысыңыз" },
};

// PocketERPIDE asset durumu — true: 4 ekran SS'i hazır, galeri render edilir.
// Promo video ayrı flag — henüz üretilmedi.
const POCKETERPIDE_ASSETS_READY = true;
const POCKETERPIDE_VIDEO_READY = true;

const POCKETERPIDE_SCREENSHOTS: { src: string; captionKey: string }[] = [
  { src: "/screenshots/pocketerpide/01-genel-bakis.png",    captionKey: "pocket.ss_overview_caption" },
  { src: "/screenshots/pocketerpide/02-kredi-kartlari.png", captionKey: "pocket.ss_cards_caption" },
  { src: "/screenshots/pocketerpide/03-krediler.png",       captionKey: "pocket.ss_loans_caption" },
  { src: "/screenshots/pocketerpide/04-buyuk-alimlar.png",  captionKey: "pocket.ss_purchases_caption" },
];

function Inner({ productId }: { productId: string }) {
  const product = getProduct(productId);
  const router = useRouter();
  const sp = useSearchParams();
  const initialSku = sp.get("sku");
  const { addItem, lines } = useCart();
  const { currency } = useCurrency();
  const { locale, t } = useTranslation();
  // 1C feature dili — fallback en'a düşer (sadece tr/en/ru/kk desteklendi)
  const featureLocale: FeatureLocale = (["en", "tr", "ru", "kk"] as const).includes(locale as FeatureLocale)
    ? (locale as FeatureLocale)
    : "en";
  const onecBtn = ONEC_BUTTONS[featureLocale];
  const onecLbl = ONEC_LABELS[featureLocale];
  const [selectedSku, setSelectedSku] = useState(initialSku || product?.skus.find((s) => s.highlight)?.id || product?.skus[0]?.id || "");
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

  // Mobil ürün + SKU yok ise (örn. LingoApp) → "mağazadan indir" view'i,
  // SKU paneli yerine MobileAppStoreCard. comingSoon olsa bile bu view aktif.
  if (product.category === "mobile" && product.skus.length === 0) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-20 px-6 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <Link href="/urunler" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
              <ArrowLeft size={14} /> {featureLocale === "tr" ? "Ürünlere dön" : featureLocale === "ru" ? "К продуктам" : featureLocale === "kk" ? "Өнімдерге оралу" : "Back to products"}
            </Link>
            <div className="mb-8">
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r ${product.color} text-white text-sm mb-4`}>
                <Icon size={18} />
                <span>{getProductText(product, locale, "name")}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">{getProductText(product, locale, "tagline")}</h1>
              <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-3xl">{getProductText(product, locale, "description")}</p>
            </div>

            <div className="grid lg:grid-cols-[1fr_360px] gap-8">
              <div>
                {product.longDescription && (
                  <section className="mb-8 p-6 rounded-2xl bg-[#111118] border border-white/5">
                    <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{getProductText(product, locale, "longDescription")}</p>
                  </section>
                )}
              </div>
              <aside className="lg:sticky lg:top-24 h-fit">
                <MobileAppStoreCard product={product} />
              </aside>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // 1C ürünleri (1c-erp, 1c-drive) için contactOnly view — Plan/SKU/Sepete Ekle akışı YOK.
  // Sadece tanıtım + özellikler + demo + iletişim CTA. Diğer ürünler (skus dolu) standart akıştan geçer.
  if (product.contactOnly && product.skus.length === 0) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-20 px-6 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <Link href="/urunler" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
              <ArrowLeft size={14} /> {featureLocale === "tr" ? "Ürünlere dön" : featureLocale === "ru" ? "К продуктам" : featureLocale === "kk" ? "Өнімдерге оралу" : "Back to products"}
            </Link>

            <div className="mb-8">
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r ${product.color} text-white text-sm mb-4`}>
                <Icon size={18} />
                <span>{getProductText(product, locale, "name")}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">{getProductText(product, locale, "tagline")}</h1>
              <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-3xl">{getProductText(product, locale, "description")}</p>
            </div>

            {(product.id === "1c-erp" || product.id === "1c-drive") && (
              <section className="mb-10 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-blue-400" /> {onecLbl.heading}
                </h2>
                <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-300 mb-6">
                  {ONEC_FEATURES[product.id][featureLocale].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-400 leading-relaxed">{onecLbl.pitch(product.name)}</p>
              </section>
            )}

            {product.longDescription && (
              <section className="mb-10 p-6 rounded-2xl bg-[#111118] border border-white/5">
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{getProductText(product, locale, "longDescription")}</p>
              </section>
            )}

            <div className="flex flex-wrap gap-3">
              {product.demoUrl && (
                <a
                  href={product.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition"
                >
                  <ExternalLink size={14} /> {onecBtn.liveDemo}
                </a>
              )}
              {product.officialUrl && (
                <a
                  href={product.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition"
                >
                  <ExternalLink size={14} /> {onecBtn.officialPage}
                </a>
              )}
              <Link
                href="/iletisim"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition"
              >
                <Mail size={14} /> {onecBtn.contactCTA}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

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
                <ProductLogo product={product} size={80} className="flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{getProductText(product, locale, "name")}</h1>
                    {product.comingSoon && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">BETA</span>
                    )}
                  </div>
                  <p className="text-blue-400">{getProductText(product, locale, "tagline")}</p>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-6">{getProductText(product, locale, "longDescription")}</p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link
                  href={`/docs/${product.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition"
                >
                  <BookOpen size={14} /> Kurulum Kılavuzu
                </Link>
                {product.demoUrl && (
                  <a
                    href={product.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/15 border border-blue-500/30 text-sm text-blue-300 hover:bg-blue-600/25 transition"
                  >
                    <Play size={14} /> {onecBtn.liveDemo}
                  </a>
                )}
                {product.officialUrl && (
                  <a
                    href={product.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition"
                  >
                    <BookOpen size={14} /> {onecBtn.officialPage}
                  </a>
                )}
              </div>

              {/* 1C:ERP / 1C:Drive — lokalize özellik kartı + ERPIDE pitch */}
              {(product.id === "1c-erp" || product.id === "1c-drive") && (
                <section className="mb-10">
                  <h2 className="text-xl font-bold text-white mb-3">{onecLbl.heading}</h2>
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/30 via-[#0a0a0f] to-blue-950/20 p-6">
                    <ul className="grid sm:grid-cols-2 gap-3 mb-6">
                      {ONEC_FEATURES[product.id][featureLocale].map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                          <Check size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-5 border-t border-white/10 text-xs text-gray-400 leading-relaxed">
                      {onecLbl.pitch(product.name)} <Link href="/iletisim" className="text-blue-400 hover:underline">{onecBtn.contactCTA}</Link>.
                    </div>
                  </div>
                </section>
              )}

              {/* CaptchaERPIDE — Galaxy Rush oyun girişi captcha demo (canlı çözüm) */}
              {product.id === "captchaerpide" && (
                <>
                  <section className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-1">Canlı Çözüm — Galaxy Rush Demo</h2>
                    <p className="text-xs text-gray-500 mb-3">
                      Oyun girişine entegre slider captcha — solver OpenCV ile ortalama 100ms&apos;de çözer, AES-GCM şifreli trajectory ile doğrulanır.
                    </p>
                    <video
                      className="w-full rounded-2xl border border-white/10 bg-black"
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      poster="/screenshots/captchaerpide/01-loaded.png"
                    >
                      <source src="/videos/captcha-game-demo.webm" type="video/webm" />
                      Tarayıcınız webm video desteği vermiyor.
                    </video>
                  </section>

                  <section className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-3">Aşamalar</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { src: "/screenshots/captchaerpide/01-loaded.png", caption: "Oyuna girişte captcha — robot olmadığını kanıtla" },
                        { src: "/screenshots/captchaerpide/02-solved.png", caption: "Çözüm anı — AI parçayı hedefe yerleştirdi" },
                      ].map((s) => (
                        <figure key={s.src} className="rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0f]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.src} alt={s.caption} className="w-full h-auto block" loading="lazy" />
                          <figcaption className="px-3 py-2 text-[11px] text-gray-400 border-t border-white/5">{s.caption}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </section>

                  {/* Desteklenen Tipler — 18 captcha çözümü */}
                  <section className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-1">Desteklenen Captcha Tipleri</h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Native AI solver + CapMonster/2Captcha agregatör — tek API'den 18 farklı captcha çeşidi.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { name: "reCAPTCHA v2", desc: "Checkbox + invisible", badge: "YENİ", color: "border-green-500/30 bg-green-500/5" },
                        { name: "reCAPTCHA v3", desc: "Score-based, action", badge: "YENİ", color: "border-green-500/30 bg-green-500/5" },
                        { name: "reCAPTCHA Enterprise", desc: "Premium v2 Enterprise", badge: "YENİ", color: "border-green-500/30 bg-green-500/5" },
                        { name: "hCaptcha", desc: "Cloudflare alternatifi", badge: "", color: "border-white/10 bg-white/[0.02]" },
                        { name: "Cloudflare Turnstile", desc: "CF korumalı siteler", badge: "", color: "border-white/10 bg-white/[0.02]" },
                        { name: "GeeTest", desc: "GT3 + GT4 slider/icon", badge: "", color: "border-white/10 bg-white/[0.02]" },
                        { name: "AWS WAF", desc: "Amazon bot kontrolü", badge: "YENİ", color: "border-green-500/30 bg-green-500/5" },
                        { name: "FunCaptcha / Arkose", desc: "Twitter/Roblox tarzı", badge: "YENİ", color: "border-green-500/30 bg-green-500/5" },
                        { name: "DataDome", desc: "Slider — 2Captcha exclusive", badge: "YENİ", color: "border-green-500/30 bg-green-500/5" },
                        { name: "Slider Captcha", desc: "Native solver — 100ms", badge: "NATIVE", color: "border-blue-500/30 bg-blue-500/5" },
                        { name: "Rotate Captcha", desc: "Native — açı tahmini", badge: "NATIVE", color: "border-blue-500/30 bg-blue-500/5" },
                        { name: "Jigsaw Puzzle", desc: "Native — parça yerleşimi", badge: "NATIVE", color: "border-blue-500/30 bg-blue-500/5" },
                        { name: "Text Captcha", desc: "Native OCR + AI", badge: "NATIVE", color: "border-blue-500/30 bg-blue-500/5" },
                        { name: "Math Captcha", desc: "Native — aritmetik", badge: "NATIVE", color: "border-blue-500/30 bg-blue-500/5" },
                        { name: "Icon Captcha (3 tip)", desc: "Native — ikon seçme", badge: "NATIVE", color: "border-blue-500/30 bg-blue-500/5" },
                        { name: "Odd-one-out", desc: "Native — farklı obje", badge: "NATIVE", color: "border-blue-500/30 bg-blue-500/5" },
                      ].map((t) => (
                        <div key={t.name} className={`rounded-xl border p-3 ${t.color} flex items-start justify-between gap-2`}>
                          <div>
                            <p className="text-sm font-semibold text-white">{t.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{t.desc}</p>
                          </div>
                          {t.badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                              t.badge === "YENİ" ? "bg-green-500/20 text-green-300" :
                              t.badge === "NATIVE" ? "bg-blue-500/20 text-blue-300" :
                              "bg-white/10 text-gray-400"
                            }`}>{t.badge}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
                      <span className="text-blue-400 font-semibold">NATIVE</span> — kendi AI solver'ımız, en hızlı çözüm.{" "}
                      <span className="text-green-400 font-semibold">YENİ</span> — 2026 Haziran güncellemesinde eklendi.{" "}
                      Token-tabanlı captcha'lar (reCAPTCHA, hCaptcha, Turnstile, AWS WAF, FunCaptcha, DataDome) CapMonster veya 2Captcha key'leri üzerinden BYOK ile çözülür — kendi hesabınızı kullanabilir ya da bizim Pro/Enterprise planımıza dahil bakiyeden harcayabilirsiniz.
                    </p>
                  </section>
                </>
              )}

              {/* AI Kontör — Eylül AI ile chat SS + plan limit akışı */}
              {product.id === "ai-kontor" && (
                <section className="mb-10">
                  <h2 className="text-xl font-bold text-white mb-1">Eylül AI ile Sohbet</h2>
                  <p className="text-xs text-gray-500 mb-3">Kontör paketi aldığınızda Eylül kesintisiz çalışmaya devam eder — fatura okur, hesaplar, raporlar.</p>
                  <figure className="rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0f]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/screenshots/finanserpide/09-eylul-ai-demo.png" alt="Eylül AI — FinansERPIDE içinde" className="w-full h-auto block" loading="lazy" />
                    <figcaption className="px-4 py-3 text-xs text-gray-400 border-t border-white/5">
                      Eylül — FinansERPIDE'nin yerleşik AI asistanı. Plan limiti dolunca bu paketi alır, kaldığınız yerden devam edersiniz.
                    </figcaption>
                  </figure>
                </section>
              )}

              {/* PocketERPIDE — coming soon (hero pitch + opsiyonel video/galeri + native app banner) */}
              {product.id === "pocketerpide" && (
                <>
                  {/* Hero pitch card */}
                  <section className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-3">{t("pocket.section_heading")}</h2>
                    <div className="relative rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-950/40 via-[#0a0a0f] to-rose-950/30 p-10 overflow-hidden">
                      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl" />
                      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl" />
                      <div className="relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-xs text-pink-300 font-medium mb-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                          {t("pocket.coming_soon_badge")}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">{t("pocket.hero_title")}</h3>
                        <p className="text-sm text-gray-400 max-w-md mb-6">
                          {t("pocket.hero_subtitle")}
                        </p>
                        <ul className="space-y-2 text-sm text-gray-300">
                          <li className="flex items-center gap-2"><Check size={14} className="text-pink-400 flex-shrink-0" /> {t("pocket.feature_ai_invoice")}</li>
                          <li className="flex items-center gap-2"><Check size={14} className="text-pink-400 flex-shrink-0" /> {t("pocket.feature_budget")}</li>
                          <li className="flex items-center gap-2"><Check size={14} className="text-pink-400 flex-shrink-0" /> {t("pocket.feature_auto_categorize")}</li>
                          <li className="flex items-center gap-2"><Check size={14} className="text-pink-400 flex-shrink-0" /> {t("pocket.feature_ios_android")}</li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-6 italic">
                          {t("pocket.assets_note")}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Promo video — ayrı flag (henüz üretilmedi) */}
                  {POCKETERPIDE_VIDEO_READY && (
                    <section className="mb-10">
                      <h2 className="text-xl font-bold text-white mb-1">{t("pocket.promo_heading")}</h2>
                      <p className="text-xs text-gray-500 mb-3">{t("pocket.promo_caption")}</p>
                      <video
                        className="w-full rounded-2xl border border-white/10 bg-black"
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={POCKETERPIDE_SCREENSHOTS[0].src}
                      >
                        <source src="/videos/pocketerpide-promo.webm" type="video/webm" />
                        <source src="/videos/pocketerpide-promo.mp4" type="video/mp4" />
                      </video>
                    </section>
                  )}

                  {/* Screenshot galerisi — sadece asset hazırsa render */}
                  {POCKETERPIDE_ASSETS_READY && (
                    <section className="mb-10">
                      <h2 className="text-xl font-bold text-white mb-1">{t("pocket.gallery_heading")}</h2>
                      <p className="text-xs text-gray-500 mb-4">{t("pocket.gallery_caption")}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {POCKETERPIDE_SCREENSHOTS.map((s) => (
                          <figure key={s.src} className="rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0f]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.src} alt={t(s.captionKey)} className="w-full h-auto block" loading="lazy" />
                            <figcaption className="px-3 py-2 text-[11px] text-gray-400 border-t border-white/5">{t(s.captionKey)}</figcaption>
                          </figure>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Native app coming soon — App Store + Google Play placeholder badges + Web MVP CTA */}
                  <section className="mb-10">
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-pink-950/20 via-[#0a0a0f] to-rose-950/15 p-6">
                      <h2 className="text-lg font-bold text-white mb-1">{t("pocket.mobile_app_coming")}</h2>
                      <p className="text-sm text-gray-400 mb-5 max-w-2xl">{t("pocket.mobile_app_coming_desc")}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <div
                          aria-disabled="true"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-gray-400 cursor-not-allowed opacity-70"
                          title="App Store · Soon"
                        >
                          <svg width="18" height="18" viewBox="0 0 384 512" fill="currentColor" className="text-gray-300">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                          </svg>
                          <span>{t("pocket.app_store_soon")}</span>
                        </div>
                        <div
                          aria-disabled="true"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-gray-400 cursor-not-allowed opacity-70"
                          title="Google Play · Soon"
                        >
                          <svg width="18" height="18" viewBox="0 0 512 512" fill="currentColor" className="text-gray-300">
                            <path d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                          </svg>
                          <span>{t("pocket.google_play_soon")}</span>
                        </div>
                        <Link
                          href="/pocket"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-sm text-white font-semibold hover:opacity-90 transition"
                        >
                          <Play size={14} /> {t("pocket.try_web_mvp")}
                        </Link>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {/* 1C ürünleri — generic placeholder */}
              {(product.id === "1c-erp" || product.id === "1c-drive") && (
                <section className="mb-10">
                  <h2 className="text-xl font-bold text-white mb-3">Tanıtım Videosu</h2>
                  <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/5 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                      <Play size={26} className="text-gray-400 ml-1" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">Tanıtım videosu yakında</p>
                    <p className="text-xs text-gray-500 max-w-xs">{getProductText(product, locale, "name")} özelliklerini gösteren detaylı tanıtım videosu eklenecek.</p>
                  </div>
                </section>
              )}

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

            <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:sticky lg:top-24 h-fit space-y-4">
              {/* Mobil ürünlerde sticky aside'in üstüne mağaza indirme kartı:
                  satin alma flow'u Apple/Google ödemesine yonlendirir, panel
                  sepetinden satilmaz. SKU paneli yine asagida feature listesi
                  icin durabilir, ama CTA mağazadir. */}
              {product.category === "mobile" && (
                <MobileAppStoreCard product={product} />
              )}
              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Seçtiğin plan</p>
                <h3 className="text-xl font-bold text-white mb-1">{getProductText(product, locale, "name")} {currentSku.name}</h3>
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
                  // noTrial urunlerde (AI Kontor) trial butonu HIC gosterilmez —
                  // her mesaj gercek Claude $ yakar, ucretsiz deneme zarar yazar.
                  const showTrial = meReady && !product.noTrial && !hasTrialedThisProduct && !hasAnyActivePlanForProduct && !isExpiredProduct;

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
