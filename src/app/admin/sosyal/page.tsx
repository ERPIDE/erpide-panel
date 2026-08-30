"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Calendar, ExternalLink, Loader2, Pencil, Plus,
  RefreshCw, Send, Sparkles, Trash2,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useAdminPermissions } from "../layout";
import AccountsPanel from "@/components/admin/sosyal/AccountsPanel";
import PostComposer from "@/components/admin/sosyal/PostComposer";
import PlatformIcon from "@/components/admin/sosyal/PlatformIcon";
import { KIND_LABELS_TR, STATUS_COLORS, STATUS_LABELS } from "@/lib/social/labels";
import { PLATFORM_LABELS, type SocialAccountView, type SocialPostView } from "@/lib/social/types";

type Tab = "posts" | "accounts";
type StatusFilter = "all" | "draft" | "scheduled" | "published" | "problem";

/**
 * Sosyal medya yayın merkezi.
 *
 * Tek yerden yazılan içerik erpide.com Gündem, Facebook, Instagram ve
 * LinkedIn'e gider. Liste, her post'un hangi platformda ne durumda olduğunu
 * gösterir; başarısız platformlar tek tuşla yeniden denenir.
 */
export default function SosyalPage() {
  const { toast } = useToast();
  const { can } = useAdminPermissions();
  const canWrite = can("sosyal", "write");

  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<SocialPostView[]>([]);
  const [accounts, setAccounts] = useState<SocialAccountView[]>([]);
  const [tokenStorageReady, setTokenStorageReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [composerFor, setComposerFor] = useState<SocialPostView | null | undefined>(undefined);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, accountsRes] = await Promise.all([
        fetch("/api/admin/sosyal"),
        fetch("/api/admin/sosyal/accounts"),
      ]);
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts ?? []);
      } else {
        toast("error", "Paylaşımlar yüklenemedi");
      }
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts ?? []);
        setTokenStorageReady(data.tokenStorageReady ?? true);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return posts;
    if (filter === "problem") return posts.filter((p) => p.status === "failed" || p.status === "partial");
    return posts.filter((p) => p.status === filter);
  }, [posts, filter]);

  // Cron'un hazırladığı, henüz yayınlanmamış özel gün taslakları öne çıkarılır.
  const pendingDrafts = useMemo(
    () => posts.filter((p) => p.source === "holiday-cron" && p.status === "draft"),
    [posts],
  );

  async function retryFailed(post: SocialPostView) {
    const failed = post.publications.filter((p) => p.status === "failed").map((p) => p.platform);
    if (failed.length === 0) return;

    setRetrying(post.id);
    try {
      const res = await fetch("/api/admin/sosyal/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, platforms: failed, skipSucceeded: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast("error", data.error || "Yeniden denenemedi"); return; }

      const stillFailed = (data.results ?? []).filter((r: { status: string }) => r.status === "failed");
      if (stillFailed.length === 0) toast("success", "Yayınlandı");
      else toast("error", `Hâlâ başarısız: ${stillFailed.map((f: { platform: string }) => f.platform).join(", ")}`);
      await load();
    } finally {
      setRetrying(null);
    }
  }

  async function remove(post: SocialPostView) {
    if (!confirm(`"${post.title}" silinecek. Emin misiniz?`)) return;
    const res = await fetch(`/api/admin/sosyal/${post.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast("error", data.error || "Silinemedi"); return; }
    if (data.warning) toast("warning", data.warning);
    else toast("success", "Silindi");
    await load();
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Sosyal Medya</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tek yerden yaz, dört kanala gönder: erpide.com Gündem, Facebook, Instagram, LinkedIn.
          </p>
        </div>
        {tab === "posts" && canWrite && (
          <button
            onClick={() => setComposerFor(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <Plus size={16} /> Yeni paylaşım
          </button>
        )}
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 border-b border-white/5">
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>
          Paylaşımlar {posts.length > 0 && `(${posts.length})`}
        </TabButton>
        <TabButton active={tab === "accounts"} onClick={() => setTab("accounts")}>
          Hesaplar
          {accounts.some((a) => !a.connected) && (
            <span className="ml-2 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          )}
        </TabButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-blue-400" />
        </div>
      ) : tab === "accounts" ? (
        <AccountsPanel
          accounts={accounts}
          tokenStorageReady={tokenStorageReady}
          onChanged={setAccounts}
        />
      ) : (
        <>
          {/* Onay bekleyen özel gün taslakları */}
          {pendingDrafts.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-300 mb-3">
                <Sparkles size={15} />
                Onay bekleyen özel gün paylaşımı ({pendingDrafts.length})
              </div>
              <div className="space-y-2">
                {pendingDrafts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setComposerFor(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/20 hover:bg-black/40 transition text-left"
                  >
                    <span className="text-xl">{p.decoration || "📅"}</span>
                    <span className="flex-1 text-sm text-gray-200">{p.title}</span>
                    {p.scheduledAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(p.scheduledAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}
                      </span>
                    )}
                    <Pencil size={13} className="text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtreler */}
          <div className="flex gap-2 flex-wrap">
            {([
              ["all", "Tümü"],
              ["draft", "Taslak"],
              ["scheduled", "Zamanlanmış"],
              ["published", "Yayınlanmış"],
              ["problem", "Sorunlu"],
            ] as Array<[StatusFilter, string]>).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  filter === key
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                    : "border border-white/10 text-gray-400 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="space-y-3">
            {filtered.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                canWrite={canWrite}
                retrying={retrying === post.id}
                onEdit={() => setComposerFor(post)}
                onRetry={() => retryFailed(post)}
                onDelete={() => remove(post)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-500 text-sm">
                Bu filtrede paylaşım yok.
              </div>
            )}
          </div>
        </>
      )}

      {composerFor !== undefined && (
        <PostComposer
          post={composerFor}
          accounts={accounts}
          onClose={() => setComposerFor(undefined)}
          onSaved={() => { setComposerFor(undefined); load(); }}
        />
      )}
    </div>
  );
}

function TabButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
        active
          ? "text-blue-400 border-blue-500"
          : "text-gray-500 border-transparent hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function PostRow({
  post, canWrite, retrying, onEdit, onRetry, onDelete,
}: {
  post: SocialPostView;
  canWrite: boolean;
  retrying: boolean;
  onEdit: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const hasFailed = post.publications.some((p) => p.status === "failed");
  const when = post.publishedAt || post.scheduledAt;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#111118] p-4 hover:border-white/10 transition">
      <div className="flex items-start gap-4">
        {post.decoration && <div className="text-2xl leading-none pt-0.5">{post.decoration}</div>}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[post.status] ?? ""}`}>
              {STATUS_LABELS[post.status] ?? post.status}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
              {KIND_LABELS_TR[post.kind]}
            </span>
            {when && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                <Calendar size={10} />
                {new Date(when).toLocaleString("tr-TR", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            )}
            {post.source === "holiday-cron" && (
              <span className="text-[10px] text-amber-400/70">otomatik taslak</span>
            )}
          </div>

          <div className="font-semibold text-white text-sm truncate">{post.title}</div>
          <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{post.excerpt}</div>

          {/* Platform durumları */}
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {post.targets.map((platform) => {
              const pub = post.publications.find((p) => p.platform === platform);
              const state = pub?.status ?? "pending";
              const color =
                state === "success" ? "text-emerald-400 border-emerald-400/30 bg-emerald-500/10"
                : state === "failed" ? "text-red-400 border-red-400/30 bg-red-500/10"
                : "text-gray-500 border-white/10";

              const chip = (
                <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border ${color}`}>
                  <PlatformIcon platform={platform} size={11} />
                  {PLATFORM_LABELS[platform].replace("erpide.com ", "")}
                  {pub?.externalUrl && <ExternalLink size={9} />}
                </span>
              );

              return pub?.externalUrl ? (
                <a key={platform} href={pub.externalUrl} target="_blank" rel="noopener noreferrer" title="Gönderiyi aç">
                  {chip}
                </a>
              ) : (
                <span key={platform} title={pub?.error ?? undefined}>{chip}</span>
              );
            })}
          </div>

          {/* Hata detayları */}
          {hasFailed && (
            <div className="mt-3 space-y-1">
              {post.publications
                .filter((p) => p.status === "failed")
                .map((p) => (
                  <div key={p.platform} className="flex items-start gap-2 text-[11px] text-red-400/90">
                    <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                    <span><strong>{PLATFORM_LABELS[p.platform]}:</strong> {p.error}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Aksiyonlar */}
        {canWrite && (
          <div className="flex items-center gap-1 shrink-0">
            {hasFailed && (
              <button
                onClick={onRetry}
                disabled={retrying}
                title="Başarısız platformları yeniden dene"
                className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 transition disabled:opacity-50"
              >
                {retrying ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              </button>
            )}
            {post.status === "draft" && (
              <button
                onClick={onEdit}
                title="Aç ve yayınla"
                className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition"
              >
                <Send size={15} />
              </button>
            )}
            <button onClick={onEdit} title="Düzenle" className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition">
              <Pencil size={15} />
            </button>
            <button onClick={onDelete} title="Sil" className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
