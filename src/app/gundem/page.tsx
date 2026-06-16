"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Sparkles, Megaphone, Rocket, LayoutGrid } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getNewsSorted,
  getNewsText,
  getNewsTypeLabel,
  NEWS_TYPE_COLORS,
  type NewsType,
  type NewsPost,
} from "@/lib/news";
import { useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/translations";

type FilterTab = "all" | NewsType;

const TYPE_ICON: Record<NewsType, React.ComponentType<{ size?: number; className?: string }>> = {
  "product-launch": Rocket,
  "special-day": Sparkles,
  milestone: Megaphone,
};

const DATE_LOCALES: Record<Locale, string> = { tr: "tr-TR", en: "en-US", ru: "ru-RU", kk: "kk-KZ" };

function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(DATE_LOCALES[locale], { day: "2-digit", month: "long", year: "numeric" });
}

const FILTER_LABELS: Record<Locale, { all: string; gundemTitle: string; gundemSubtitle: string; readMore: string; emptyFilter: string }> = {
  tr: { all: "Tümü", gundemTitle: "Gündem", gundemSubtitle: "ERPIDE'den haberler, yeni ürün lansmanları, şirket güncellemeleri ve özel gün paylaşımları.", readMore: "Devamını oku", emptyFilter: "Bu filtrede henüz post yok." },
  en: { all: "All", gundemTitle: "News", gundemSubtitle: "News from ERPIDE — product launches, company updates and special day posts.", readMore: "Read more", emptyFilter: "No posts in this filter yet." },
  ru: { all: "Все", gundemTitle: "Новости", gundemSubtitle: "Новости ERPIDE — запуски продуктов, обновления компании и публикации к особым дням.", readMore: "Читать далее", emptyFilter: "В этом фильтре пока нет публикаций." },
  kk: { all: "Барлығы", gundemTitle: "Жаңалықтар", gundemSubtitle: "ERPIDE жаңалықтары — өнім шығарылымдары, компания жаңартулары мен ерекше күн жарияланымдары.", readMore: "Толығырақ", emptyFilter: "Бұл сүзгіде әзірге жариялым жоқ." },
};

export default function GundemPage() {
  const { locale } = useTranslation();
  const labels = FILTER_LABELS[locale];
  const [filter, setFilter] = useState<FilterTab>("all");
  const posts = useMemo(() => {
    const all = getNewsSorted();
    return filter === "all" ? all : all.filter((p) => p.type === filter);
  }, [filter]);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">{labels.gundemTitle}</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              {labels.gundemSubtitle}
            </p>
          </motion.div>

          {/* Filter chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-12 sticky top-20 z-10 py-3 -mx-6 px-6 backdrop-blur-lg bg-black/30">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              Icon={LayoutGrid}
              label={labels.all}
              count={getNewsSorted().length}
            />
            {(["product-launch", "special-day", "milestone"] as NewsType[]).map((t) => {
              const Icon = TYPE_ICON[t];
              const count = getNewsSorted().filter((p) => p.type === t).length;
              return (
                <FilterChip
                  key={t}
                  active={filter === t}
                  onClick={() => setFilter(t)}
                  Icon={Icon}
                  label={getNewsTypeLabel(t, locale)}
                  count={count}
                />
              );
            })}
          </div>

          {/* Feed timeline */}
          <div className="space-y-6">
            {posts.map((post, i) => (
              <FeedCard key={post.id} post={post} delay={i * 0.05} locale={locale} readMoreLabel={labels.readMore} />
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-20 text-gray-500">{labels.emptyFilter}</div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function FilterChip({
  active, onClick, Icon, label, count,
}: {
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  count: number;
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
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-white/10 text-gray-400"}`}>{count}</span>
    </button>
  );
}

function FeedCard({ post, delay, locale, readMoreLabel }: { post: NewsPost; delay: number; locale: Locale; readMoreLabel: string }) {
  const Icon = TYPE_ICON[post.type];
  const title = getNewsText(post, locale, "title");
  const excerpt = getNewsText(post, locale, "excerpt");
  const typeLabel = getNewsTypeLabel(post.type, locale);
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.4 }}
      className="group"
    >
      <Link
        href={`/gundem/${post.slug}`}
        className="block rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/30 transition overflow-hidden"
      >
        <div className="grid md:grid-cols-[280px_1fr] gap-0">
          {/* Sol: görsel veya gradient kart. Screenshot'lar object-cover,
              ürün ikonları (transparent) tematik gradient üstüne ortalanır. */}
          <div className="relative aspect-video md:aspect-auto md:min-h-[200px] overflow-hidden">
            {post.image && (post.image.includes("/screenshots/") || post.image.includes("/api/og/")) ? (
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 280px"
                unoptimized={post.image.includes("/api/og/")}
              />
            ) : post.image ? (
              <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient || "from-blue-600 to-purple-600"} flex items-center justify-center`}>
                <Image
                  src={post.image}
                  alt={post.imageAlt}
                  width={120}
                  height={120}
                  className="drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient || "from-blue-600 to-purple-600"}`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <Image src="/logo.png" alt="ERPIDE" width={80} height={80} className="opacity-90 mb-3" />
                  <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">{typeLabel}</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            )}
          </div>

          {/* Sağ: meta + içerik */}
          <div className="p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border ${NEWS_TYPE_COLORS[post.type]}`}>
                <Icon size={10} />
                {typeLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={12} />
                {formatDate(post.date, locale)}
              </span>
              {post.badges?.map((b) => (
                <span key={b} className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  {b}
                </span>
              ))}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
              {title}
            </h2>

            <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{excerpt}</p>

            <span className="inline-flex items-center gap-1.5 text-sm text-blue-400 group-hover:text-blue-300 transition-colors mt-auto">
              {readMoreLabel} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
