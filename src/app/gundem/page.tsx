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
  NEWS_TYPE_LABELS,
  NEWS_TYPE_COLORS,
  type NewsType,
  type NewsPost,
} from "@/lib/news";

type FilterTab = "all" | NewsType;

const TYPE_ICON: Record<NewsType, React.ComponentType<{ size?: number; className?: string }>> = {
  "product-launch": Rocket,
  "special-day": Sparkles,
  milestone: Megaphone,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function GundemPage() {
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
              <span className="gradient-text">Gündem</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              ERPIDE'den haberler, yeni ürün lansmanları, şirket güncellemeleri ve özel gün paylaşımları.
            </p>
          </motion.div>

          {/* Filter chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-12 sticky top-20 z-10 py-3 -mx-6 px-6 backdrop-blur-lg bg-black/30">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              Icon={LayoutGrid}
              label="Tümü"
              count={getNewsSorted().length}
            />
            {(Object.keys(NEWS_TYPE_LABELS) as NewsType[]).map((t) => {
              const Icon = TYPE_ICON[t];
              const count = getNewsSorted().filter((p) => p.type === t).length;
              return (
                <FilterChip
                  key={t}
                  active={filter === t}
                  onClick={() => setFilter(t)}
                  Icon={Icon}
                  label={NEWS_TYPE_LABELS[t]}
                  count={count}
                />
              );
            })}
          </div>

          {/* Feed timeline */}
          <div className="space-y-6">
            {posts.map((post, i) => (
              <FeedCard key={post.id} post={post} delay={i * 0.05} />
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-20 text-gray-500">Bu filtrede henüz post yok.</div>
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

function FeedCard({ post, delay }: { post: NewsPost; delay: number }) {
  const Icon = TYPE_ICON[post.type];
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
          {/* Sol: görsel veya gradient kart */}
          <div className="relative aspect-video md:aspect-auto md:min-h-[200px] overflow-hidden">
            {post.image ? (
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 280px"
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient || "from-blue-600 to-purple-600"}`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <Image src="/logo.png" alt="ERPIDE" width={80} height={80} className="opacity-90 mb-3" />
                  <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">{NEWS_TYPE_LABELS[post.type]}</div>
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
                {NEWS_TYPE_LABELS[post.type]}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={12} />
                {formatDate(post.date)}
              </span>
              {post.badges?.map((b) => (
                <span key={b} className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  {b}
                </span>
              ))}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
              {post.title}
            </h2>

            <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{post.excerpt}</p>

            <span className="inline-flex items-center gap-1.5 text-sm text-blue-400 group-hover:text-blue-300 transition-colors mt-auto">
              Devamını oku <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
