"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Share2, Sparkles, Megaphone, Rocket } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { postText, kindLabel, KIND_COLORS } from "@/lib/social/labels";
import type { PostKind, SocialPostView } from "@/lib/social/types";
import { useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/translations";

const TYPE_ICON: Record<PostKind, React.ComponentType<{ size?: number; className?: string }>> = {
  "product-launch": Rocket,
  "special-day": Sparkles,
  milestone: Megaphone,
};

const DATE_LOCALES: Record<Locale, string> = { tr: "tr-TR", en: "en-US", ru: "ru-RU", kk: "kk-KZ" };

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(DATE_LOCALES[locale], {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const DETAIL_LABELS: Record<Locale, { backToFeed: string; share: string; goToProduct: string; goToProductDesc: string; prevPost: string; nextPost: string }> = {
  tr: { backToFeed: "Gündem'e dön", share: "Paylaş:", goToProduct: "Ürüne git", goToProductDesc: "Bu post bu ürünle ilgili. Detayları, fiyatlandırmayı ve demo seçeneklerini görmek için:", prevPost: "Sonraki yazı (daha yeni)", nextPost: "Önceki yazı (daha eski)" },
  en: { backToFeed: "Back to News", share: "Share:", goToProduct: "Go to product", goToProductDesc: "This post is about the product. To see details, pricing and demo options:", prevPost: "Newer post", nextPost: "Older post" },
  ru: { backToFeed: "К новостям", share: "Поделиться:", goToProduct: "К продукту", goToProductDesc: "Эта публикация о продукте. Чтобы увидеть детали, цены и опции демо:", prevPost: "Новее", nextPost: "Старее" },
  kk: { backToFeed: "Жаңалықтарға оралу", share: "Бөлісу:", goToProduct: "Өнімге өту", goToProductDesc: "Бұл жариялым осы өнімге қатысты. Толығырақ, бағалар мен демо нұсқаларын көру үшін:", prevPost: "Жаңалау жазба", nextPost: "Ескілеу жазба" },
};

export interface GundemNeighbor {
  slug: string | null;
  title: string;
  i18n: SocialPostView["i18n"];
  excerpt: string;
  body: string;
}

/**
 * Gündem detay sayfası. Post ve komşuları server component'te DB'den okunup
 * buraya prop olarak geçilir.
 */
export default function GundemDetail({
  post,
  prev,
  next,
}: {
  post: SocialPostView;
  prev: GundemNeighbor | null;
  next: GundemNeighbor | null;
}) {
  const { locale } = useTranslation();
  const labels = DETAIL_LABELS[locale];

  const Icon = TYPE_ICON[post.kind];
  const title = postText(post, locale, "title");
  const excerpt = postText(post, locale, "excerpt");
  const body = postText(post, locale, "body");
  const typeLabel = kindLabel(post.kind, locale);
  const paragraphs = body.split("\n\n");
  const image = post.imageUrl;
  const shareUrl = `https://www.erpide.com/gundem/${post.slug}`;

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <article className="max-w-4xl mx-auto">
          <Link href="/gundem" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
            <ArrowLeft size={14} /> {labels.backToFeed}
          </Link>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${KIND_COLORS[post.kind]}`}>
                <Icon size={11} />
                {typeLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                <Calendar size={13} />
                {formatDate(post.publishedAt, locale)}
              </span>
              {post.badges.map((b) => (
                <span key={b} className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  {b}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">{title}</h1>
            <p className="text-lg text-gray-400 leading-relaxed">{excerpt}</p>
          </motion.div>

          {/* Görsel. Ürün ikonları (transparent PNG'ler) için tematik gradient
              arka plan render edilir; screenshot'lar olduğu gibi gösterilir. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl overflow-hidden mb-10 border border-white/5"
          >
            {image && (image.includes("/screenshots/") || image.includes("/api/og/")) ? (
              <div className="relative aspect-[16/9] bg-[#0d0d14]">
                <Image src={image} alt={post.imageAlt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 900px" unoptimized={image.includes("/api/og/")} />
              </div>
            ) : image ? (
              <div
                className={`relative aspect-[16/9] ${post.imageBackground ? "" : `bg-gradient-to-br ${post.gradient || "from-blue-600 to-purple-600"} flex items-center justify-center`}`}
                style={post.imageBackground ? { background: post.imageBackground } : undefined}
              >
                {post.imageBackground ? (
                  <Image src={image} alt={post.imageAlt} fill className="object-contain p-10" sizes="(max-width: 1024px) 100vw, 900px" />
                ) : (
                  <>
                    <Image src={image} alt={post.imageAlt} width={280} height={280} className="drop-shadow-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                  </>
                )}
              </div>
            ) : (
              <div className={`relative aspect-[16/9] bg-gradient-to-br ${post.gradient || "from-blue-600 to-purple-600"} flex items-center justify-center p-12`}>
                <div className="text-center">
                  <Image src="/logo.png" alt="ERPIDE" width={140} height={140} className="opacity-90 mx-auto mb-4" />
                  <div className="text-white/80 text-sm font-semibold uppercase tracking-wider">{typeLabel}</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            )}
          </motion.div>

          {/* Body */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert prose-lg max-w-none mb-12"
          >
            {paragraphs.map((p, i) => (
              <Paragraph key={i} text={p} />
            ))}
          </motion.div>

          {/* CTA — ürün linki */}
          {post.productSlug && (
            <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-500/10 via-[#111118] to-purple-500/10 border border-blue-500/20 mb-12">
              <h3 className="font-bold text-white mb-2">{labels.goToProduct}</h3>
              <p className="text-sm text-gray-400 mb-4">{labels.goToProductDesc}</p>
              <Link
                href={`/urunler/${post.productSlug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
              >
                {title.split(" ")[0]} →
              </Link>
            </div>
          )}

          {/* Share */}
          <div className="flex items-center gap-3 py-6 border-t border-white/5">
            <Share2 size={16} className="text-gray-400" />
            <span className="text-sm text-gray-400">{labels.share}</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title + " — ERPIDE")}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              X / Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              LinkedIn
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(title + "\n" + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              WhatsApp
            </a>
          </div>

          {/* Prev/Next */}
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            {prev ? (
              <Link href={`/gundem/${prev.slug}`} className="p-4 rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/30 transition group">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <ArrowLeft size={11} /> {labels.prevPost}
                </div>
                <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition">{postText(prev, locale, "title")}</div>
              </Link>
            ) : <div />}
            {next ? (
              <Link href={`/gundem/${next.slug}`} className="p-4 rounded-2xl bg-[#111118] border border-white/5 hover:border-blue-500/30 transition group md:text-right">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1 md:justify-end">
                  {labels.nextPost} <ArrowRight size={11} />
                </div>
                <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition">{postText(next, locale, "title")}</div>
              </Link>
            ) : <div />}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

function Paragraph({ text }: { text: string }) {
  // **bold** ve listeleri çok basit Markdown-lite render
  if (text.startsWith("**") && text.endsWith("**") && !text.slice(2, -2).includes("**")) {
    return <h3 className="text-2xl font-bold text-white mt-8 mb-3">{text.slice(2, -2)}</h3>;
  }
  if (text.startsWith("- ")) {
    const items = text.split("\n").filter((l) => l.startsWith("- "));
    return (
      <ul className="list-disc pl-6 space-y-2 my-4 text-gray-300">
        {items.map((item, i) => (
          <li key={i}>
            {renderInline(item.slice(2))}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-gray-300 leading-relaxed my-4">{renderInline(text)}</p>;
}

function renderInline(text: string): React.ReactNode {
  // **bold** parse
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIdx = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    parts.push(<strong key={key++} className="text-white">{match[1]}</strong>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length > 0 ? parts : text;
}
