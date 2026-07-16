"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, ExternalLink, MessageCircle, Phone, Apple, Smartphone, LayoutGrid } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PRODUCTS, CATEGORIES, getProductText, getSkuText, getSkuFeatures, type ProductCategory, type Product } from "@/lib/products";
import { MarketScopeBadge } from "@/components/ProductBadges";
import { ProductLogo } from "@/components/ProductLogo";
import { priceFor, formatPrice } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";

type FilterTab = "all" | ProductCategory;

const CATEGORY_ICON: Record<ProductCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  web: Sparkles,
  mobile: Smartphone,
  "desktop-enterprise": Apple,
  "ai-credits": Sparkles,
};

export default function UrunlerPage() {
  const { t, locale } = useTranslation();
  const [activeSkuByProduct, setActiveSkuByProduct] = useState<Record<string, string>>({});
  const [lastSkuByProduct, setLastSkuByProduct] = useState<Record<string, string>>({});
  const [appStates, setAppStates] = useState<Record<string, "active" | "expired" | "none">>({});
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    // URL'de ?kategori=mobile gibi parametre varsa onu aç (Navbar dropdown'dan
    // gelinince doğrudan ilgili kategoriye scroll edilir hissi)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("kategori") as ProductCategory | null;
      if (cat && CATEGORIES.some((c) => c.id === cat)) setFilter(cat);
    }
    fetch("/api/shop/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.activeSkuByProduct && typeof d.activeSkuByProduct === "object") setActiveSkuByProduct(d.activeSkuByProduct);
        if (d?.lastSkuByProduct && typeof d.lastSkuByProduct === "object") setLastSkuByProduct(d.lastSkuByProduct);
        if (d?.appStates && typeof d.appStates === "object") setAppStates(d.appStates);
      })
      .catch(() => {});
  }, []);

  // Kategoriye göre gruplandirilmis urunler (filter="all" iken hepsi).
  // hiddenFromPublic ürünler (AI Kontör gibi) liste sayfasında gösterilmez —
  // backend ve mevcut müşteri akışları (hesabim/lisanslarim, callback) etkilenmez.
  const visibleCategories = useMemo(() => {
    return CATEGORIES
      .map((cat) => ({
        cat,
        products: PRODUCTS.filter((p) => p.category === cat.id && !p.hiddenFromPublic),
      }))
      .filter((g) => g.products.length > 0)
      .filter((g) => filter === "all" || g.cat.id === filter);
  }, [filter]);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">{t("products.title")}</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("products.subtitle")}
            </p>
          </motion.div>

          {/* Kategori filtre sekmesi */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              Icon={LayoutGrid}
              label={locale === "en" ? "All" : locale === "ru" ? "Все" : locale === "kk" ? "Барлығы" : "Tümü"}
            />
            {CATEGORIES.filter((c) => PRODUCTS.some((p) => p.category === c.id && !p.hiddenFromPublic)).map((c) => {
              const Icon = CATEGORY_ICON[c.id];
              return (
                <FilterChip
                  key={c.id}
                  active={filter === c.id}
                  onClick={() => setFilter(c.id)}
                  Icon={Icon}
                  label={c.label[locale]}
                />
              );
            })}
          </div>

          <div className="space-y-20">
            {visibleCategories.map(({ cat, products }) => (
              <section key={cat.id} id={`kategori-${cat.id}`} className="scroll-mt-24">
                <header className="mb-8 border-l-4 border-blue-500/40 pl-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {cat.label[locale]}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {cat.subtitle[locale]}
                  </p>
                </header>

                <div className="space-y-14">
                  {products.map((product) => {
                    const visibleSkus = product.skus.filter((s) => !s.kind || s.kind === "base" || s.kind === "standalone" || s.kind === "credit");
                    return (
                      <ProductBlock
                        key={product.id}
                        product={product}
                        visibleSkus={visibleSkus}
                        activeSkuByProduct={activeSkuByProduct}
                        lastSkuByProduct={lastSkuByProduct}
                        appStates={appStates}
                        t={t}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FilterChip({
  active, onClick, Icon, label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
        active
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
          : "border border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/30"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

type ProductBlockProps = {
  product: Product;
  visibleSkus: Product["skus"];
  activeSkuByProduct: Record<string, string>;
  lastSkuByProduct: Record<string, string>;
  appStates: Record<string, "active" | "expired" | "none">;
  t: (key: string) => string;
};

function ProductBlock({ product, visibleSkus, activeSkuByProduct, lastSkuByProduct, appStates, t }: ProductBlockProps) {
  const { locale } = useTranslation();
  return (
                <motion.section
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div className="flex items-start gap-6">
                    <ProductLogo product={product} size={64} className="flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-2xl md:text-3xl font-bold text-white">{getProductText(product, locale, "name")}</h2>
                        {product.comingSoon && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
                            {t("products.beta_badge")}
                          </span>
                        )}
                        <MarketScopeBadge scope={product.marketScope} />
                      </div>
                      <p className="text-blue-400 text-sm mb-2">{getProductText(product, locale, "tagline")}</p>
                      <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">{getProductText(product, locale, "description")}</p>
                      <Link
                        href={`/urunler/${product.id}`}
                        className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:text-blue-300 transition"
                      >
                        {t("products.detailed_view")} <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {product.contactOnly ? (
                    <ContactCTA product={product} />
                  ) : product.category === "mobile" ? (
                    // Mobil ürünler (PocketERPIDE, LingoApp): satış mağazadan
                    // yapılır → liste sayfasında SKU yerine "Mağazadan İndir"
                    // mini CTA. Detay sayfasında MobileAppStoreCard tam akış.
                    <MobileStoreCTA product={product} />
                  ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {visibleSkus.map((sku, i) => {
                      const { price, currency } = priceFor(sku, "USD");
                      return (
                      <motion.div
                        key={sku.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className={`relative p-6 rounded-2xl bg-[#111118] border transition ${
                          activeSkuByProduct[product.id] === sku.id
                            ? "border-emerald-500/50 ring-2 ring-emerald-500/20"
                            : appStates[product.id] === "expired" && lastSkuByProduct[product.id] === sku.id
                            ? "border-amber-500/50 ring-2 ring-amber-500/20"
                            : sku.highlight ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-white/5"
                        }`}
                      >
                        {activeSkuByProduct[product.id] === sku.id ? (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-semibold">
                            {t("products.current_plan_badge")}
                          </div>
                        ) : appStates[product.id] === "expired" && lastSkuByProduct[product.id] === sku.id ? (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold">
                            {t("products.expired_badge")}
                          </div>
                        ) : sku.highlight ? (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold">
                            {t("products.popular_badge")}
                          </div>
                        ) : null}
                        <h3 className="text-xl font-bold text-white mb-1">{getSkuText(sku, locale, "name")}</h3>
                        <p className="text-xs text-gray-400 mb-4">{getSkuText(sku, locale, "description")}</p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-white">{formatPrice(price, currency, { short: true })}</span>
                          <span className="text-gray-400 ml-1 text-sm">{t("products.per_month")}</span>
                        </div>
                        <div className="space-y-2 mb-4">
                          {(() => {
                            const isCurrent = activeSkuByProduct[product.id] === sku.id;
                            const hasActiveOnProduct = !!activeSkuByProduct[product.id];
                            const isExpiredProduct = appStates[product.id] === "expired";
                            const isLastSku = lastSkuByProduct[product.id] === sku.id;

                            if (isCurrent) {
                              return (
                                <Link
                                  href={`/urunler/${product.id}?sku=${sku.id}`}
                                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                >
                                  <Check size={14} /> {t("products.active_plan_view")}
                                </Link>
                              );
                            }

                            if (isExpiredProduct) {
                              return (
                                <Link
                                  href={`/urunler/${product.id}?sku=${sku.id}`}
                                  className={`block text-center py-2.5 rounded-xl font-semibold transition text-sm ${
                                    isLastSku
                                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90"
                                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                                  }`}
                                >
                                  {isLastSku ? t("products.renew_license") : t("products.upgrade_to_plan")}
                                </Link>
                              );
                            }

                            return (
                              <Link
                                href={`/urunler/${product.id}?sku=${sku.id}`}
                                className={`block text-center py-2.5 rounded-xl font-semibold transition text-sm ${
                                  hasActiveOnProduct
                                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90"
                                    : sku.highlight
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                                    : "border border-white/10 text-white hover:bg-white/5"
                                }`}
                              >
                                {hasActiveOnProduct ? t("products.upgrade_to_plan") : t("products.add_to_cart")}
                              </Link>
                            );
                          })()}
                        </div>
                        {(() => {
                          const features = getSkuFeatures(sku, locale);
                          return (
                            <ul className="space-y-1.5">
                              {features.slice(0, 5).map((f, j) => (
                                <li key={j} className="flex items-start gap-1.5 text-xs text-gray-300">
                                  <Check size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                              {features.length > 5 && (
                                <li className="text-xs text-gray-600 pl-4">
                                  {t("products.more_features").replace("{count}", String(features.length - 5))}
                                </li>
                              )}
                            </ul>
                          );
                        })()}
                      </motion.div>
                      );
                    })}
                  </div>
                  )}
                </motion.section>
  );
}


function MobileStoreCTA({ product }: { product: Product }) {
  const { t, locale } = useTranslation();
  const hasIos = !!product.iosAppStoreUrl;
  const hasAndroid = !!product.androidPlayStoreUrl;
  const hasTestFlight = !!product.testFlightUrl;
  const hasChrome = !!product.chromeWebStoreUrl;
  const noStoreYet = !hasIos && !hasAndroid && !hasTestFlight && !hasChrome;
  const productName = getProductText(product, locale, "name");

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Sol: bilgilendirme + detay incele */}
      <Link
        href={`/urunler/${product.id}`}
        className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 via-[#111118] to-sky-500/5 border border-blue-500/20 hover:border-blue-500/40 transition group"
      >
        <Smartphone size={22} className="text-blue-400 mb-3" />
        <h3 className="font-bold text-white mb-1">{t("mobile.app_heading")}</h3>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          {product.mobileOnlyDownload
            ? t("mobile.app_only_desc")
            : t("mobile.app_default_desc")}
        </p>
        <span className="text-xs text-blue-400 group-hover:underline">{t("mobile.details_and_links")}</span>
      </Link>

      {/* Sağ: mağaza özet */}
      <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
        {noStoreYet ? (
          <>
            <Apple size={22} className="text-purple-300 mb-3" />
            <h3 className="font-bold text-white mb-1">{t("mobile.coming_soon_title")}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t("mobile.coming_soon_desc").replace("{name}", productName)}
            </p>
          </>
        ) : (
          <>
            <Apple size={22} className="text-gray-300 mb-3" />
            <h3 className="font-bold text-white mb-2">{t("mobile.download_from_store")}</h3>
            <div className="space-y-2">
              {hasIos && (
                <a href={product.iosAppStoreUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-300 hover:underline">
                  <Apple size={14} /> App Store <ExternalLink size={10} />
                </a>
              )}
              {hasAndroid && (
                <a href={product.androidPlayStoreUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-300 hover:underline">
                  <Smartphone size={14} /> Google Play <ExternalLink size={10} />
                </a>
              )}
              {hasTestFlight && !hasIos && (
                <a href={product.testFlightUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-300 hover:underline">
                  <Apple size={14} /> TestFlight (Beta) <ExternalLink size={10} />
                </a>
              )}
              {hasChrome && (
                <a href={product.chromeWebStoreUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-300 hover:underline">
                  Chrome Web Store <ExternalLink size={10} />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ContactCTA({ product }: { product: { id: string; name: string; demoUrl?: string } }) {
  const { t } = useTranslation();
  const waMsg = encodeURIComponent(t("products.wa_message").replace("{name}", product.name));
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {product.demoUrl && (
        <a
          href={product.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-2xl bg-[#111118] border border-blue-500/30 hover:border-blue-500/60 transition group"
        >
          <ExternalLink size={20} className="text-blue-400 mb-3" />
          <h3 className="font-bold text-white mb-1">{t("products.live_demo")}</h3>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            {t("products.live_demo_desc").replace("{name}", product.name)}
          </p>
          <span className="text-xs text-blue-400 group-hover:underline">{t("products.open_demo")}</span>
        </a>
      )}
      <Link
        href={`/iletisim?konu=${product.id}`}
        className="p-6 rounded-2xl bg-[#111118] border border-purple-500/30 hover:border-purple-500/60 transition group"
      >
        <MessageCircle size={20} className="text-purple-400 mb-3" />
        <h3 className="font-bold text-white mb-1">{t("products.ai_assistant_chat")}</h3>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          {t("products.ai_assistant_desc")}
        </p>
        <span className="text-xs text-purple-400 group-hover:underline">{t("products.start_chat")}</span>
      </Link>
      <a
        href={`https://wa.me/908504474237?text=${waMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-6 rounded-2xl bg-[#111118] border border-emerald-500/30 hover:border-emerald-500/60 transition group"
      >
        <Phone size={20} className="text-emerald-400 mb-3" />
        <h3 className="font-bold text-white mb-1">{t("products.whatsapp_line")}</h3>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          {t("products.whatsapp_desc")}
        </p>
        <span className="text-xs text-emerald-400 group-hover:underline">{t("products.send_message")}</span>
      </a>
    </div>
  );
}
