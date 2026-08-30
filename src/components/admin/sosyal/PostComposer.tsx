"use client";
import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ImagePlus, Loader2, Save, Send, Upload, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { GRADIENT_PRESETS, DEFAULT_GRADIENT } from "@/lib/social/gradients";
import { KIND_LABELS_TR } from "@/lib/social/labels";
import { PLATFORMS, PLATFORM_LABELS, type Platform, type PostKind, type SocialAccountView, type SocialPostView } from "@/lib/social/types";
import PlatformPreview from "./PlatformPreview";
import PlatformIcon from "./PlatformIcon";

const EXTRA_LOCALES = ["en", "ru", "kk"] as const;
const LOCALE_LABELS: Record<(typeof EXTRA_LOCALES)[number], string> = {
  en: "İngilizce",
  ru: "Rusça",
  kk: "Kazakça",
};

interface FormState {
  kind: PostKind;
  title: string;
  excerpt: string;
  body: string;
  hashtags: string;
  linkUrl: string;
  imageMode: "auto" | "upload";
  imageUrl: string;
  imageAlt: string;
  gradient: string;
  decoration: string;
  decorationSubtitle: string;
  slug: string;
  badges: string;
  productSlug: string;
  targets: Platform[];
  scheduledAt: string;
  i18n: Record<string, { title?: string; excerpt?: string; body?: string }>;
}

function emptyForm(): FormState {
  return {
    kind: "milestone",
    title: "",
    excerpt: "",
    body: "",
    hashtags: "ERPIDE",
    linkUrl: "",
    imageMode: "auto",
    imageUrl: "",
    imageAlt: "",
    gradient: DEFAULT_GRADIENT,
    decoration: "",
    decorationSubtitle: "",
    slug: "",
    badges: "",
    productSlug: "",
    targets: ["site"],
    scheduledAt: "",
    i18n: {},
  };
}

function formFromPost(post: SocialPostView): FormState {
  return {
    kind: post.kind,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    hashtags: post.hashtags.join(", "),
    linkUrl: post.linkUrl ?? "",
    imageMode: post.imageMode,
    imageUrl: post.imageUrl ?? "",
    imageAlt: post.imageAlt,
    gradient: post.gradient ?? DEFAULT_GRADIENT,
    decoration: post.decoration ?? "",
    decorationSubtitle: post.decorationSubtitle ?? "",
    slug: post.slug ?? "",
    badges: post.badges.join(", "),
    productSlug: post.productSlug ?? "",
    targets: post.targets.length ? post.targets : ["site"],
    // datetime-local yerel saat bekler; ISO'nun sonundaki Z'yi kesip dakikaya yuvarlıyoruz.
    scheduledAt: post.scheduledAt ? toLocalInput(post.scheduledAt) : "",
    i18n: (post.i18n as FormState["i18n"]) ?? {},
  };
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function splitList(v: string): string[] {
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Post oluşturma/düzenleme formu. Sol tarafta alanlar, sağda canlı önizleme.
 *
 * Kaydetme ve yayınlama ayrı: "Taslak kaydet" içeriği saklar, "Şimdi Yayınla"
 * önce kaydeder sonra yayın motorunu çağırır. Bu ayrım, yarım kalmış bir
 * içeriğin kazayla sosyal medyaya düşmesini engeller.
 */
export default function PostComposer({
  post,
  accounts,
  onClose,
  onSaved,
}: {
  post: SocialPostView | null;
  accounts: SocialAccountView[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(post ? formFromPost(post) : emptyForm());
  const [busy, setBusy] = useState<null | "draft" | "schedule" | "publish" | "upload">(null);
  const [showI18n, setShowI18n] = useState(false);

  const isPublished = post?.status === "published" || post?.status === "partial";
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleTarget = (p: Platform) =>
    setForm((f) => ({
      ...f,
      targets: f.targets.includes(p) ? f.targets.filter((t) => t !== p) : [...f.targets, p],
    }));

  /** Önizleme görselinin adresi — kaydedilmemiş postlar için /api/og/preview. */
  const previewImage = useMemo(() => {
    if (form.imageMode === "upload") return form.imageUrl || null;
    const q = new URLSearchParams({
      title: form.title || "Başlık",
      kind: form.kind,
      gradient: form.gradient,
    });
    if (form.decoration) q.set("decoration", form.decoration);
    if (form.decorationSubtitle) q.set("decorationSubtitle", form.decorationSubtitle);
    if (post?.publishedAt) q.set("date", post.publishedAt);
    return `/api/og/preview?${q.toString()}`;
  }, [form.imageMode, form.imageUrl, form.title, form.kind, form.gradient, form.decoration, form.decorationSubtitle, post?.publishedAt]);

  /** Önizleme bileşenine verilecek geçici post görünümü. */
  const previewPost = useMemo<SocialPostView>(() => ({
    id: post?.id ?? "preview",
    kind: form.kind,
    title: form.title,
    excerpt: form.excerpt,
    body: form.body,
    hashtags: splitList(form.hashtags),
    linkUrl: form.linkUrl || null,
    imageUrl: form.imageUrl || null,
    imageAlt: form.imageAlt,
    imageMode: form.imageMode,
    gradient: form.gradient,
    decoration: form.decoration || null,
    decorationSubtitle: form.decorationSubtitle || null,
    imageBackground: null,
    slug: form.slug || post?.slug || null,
    badges: splitList(form.badges),
    productSlug: form.productSlug || null,
    i18n: form.i18n,
    status: post?.status ?? "draft",
    scheduledAt: null,
    publishedAt: post?.publishedAt ?? null,
    targets: form.targets,
    source: post?.source ?? "manual",
    sourceRef: post?.sourceRef ?? null,
    createdBy: post?.createdBy ?? null,
    createdAt: post?.createdAt ?? new Date().toISOString(),
    updatedAt: post?.updatedAt ?? new Date().toISOString(),
    publications: post?.publications ?? [],
  }), [form, post]);

  function buildPayload(status: "draft" | "scheduled") {
    // Boş dil bloklarını göndermeyelim; DB'de anlamsız {} birikmesin.
    const i18n = Object.fromEntries(
      Object.entries(form.i18n).filter(([, v]) => v && (v.title || v.excerpt || v.body)),
    );
    return {
      kind: form.kind,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      body: form.body,
      hashtags: splitList(form.hashtags),
      linkUrl: form.linkUrl.trim() || null,
      imageUrl: form.imageMode === "upload" ? form.imageUrl.trim() || null : null,
      imageAlt: form.imageAlt.trim() || form.title.trim(),
      imageMode: form.imageMode,
      gradient: form.gradient,
      decoration: form.decoration || null,
      decorationSubtitle: form.decorationSubtitle || null,
      slug: form.slug.trim() || null,
      badges: splitList(form.badges),
      productSlug: form.productSlug.trim() || null,
      i18n: Object.keys(i18n).length ? i18n : null,
      targets: form.targets,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      status,
    };
  }

  /** Kaydeder ve post id'sini döndürür (yeni post oluşabilir). */
  async function save(status: "draft" | "scheduled"): Promise<string | null> {
    const payload = buildPayload(status);
    if (!payload.title) { toast("error", "Başlık boş olamaz"); return null; }
    if (!payload.excerpt) { toast("error", "Özet boş olamaz"); return null; }
    if (payload.targets.length === 0) { toast("error", "En az bir yayın hedefi seçin"); return null; }
    if (status === "scheduled" && !payload.scheduledAt) {
      toast("error", "Zamanlama için tarih ve saat girin");
      return null;
    }

    const res = await fetch(post ? `/api/admin/sosyal/${post.id}` : "/api/admin/sosyal", {
      method: post ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast("error", data.error || "Kaydedilemedi");
      return null;
    }
    return data.post?.id ?? post?.id ?? null;
  }

  async function handleSave(status: "draft" | "scheduled") {
    setBusy(status === "draft" ? "draft" : "schedule");
    try {
      const id = await save(status);
      if (id) {
        toast("success", status === "draft" ? "Taslak kaydedildi" : "Yayın zamanlandı");
        onSaved();
      }
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish() {
    if (!confirm(`${form.targets.length} platformda yayınlanacak. Onaylıyor musunuz?`)) return;
    setBusy("publish");
    try {
      // Önce içeriği kaydet — yayın motoru DB'deki hâli okuyor.
      const id = await save("draft");
      if (!id) return;

      const res = await fetch("/api/admin/sosyal/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id, platforms: form.targets }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast("error", data.error || "Yayın başlatılamadı");
        return;
      }

      const failed = (data.results ?? []).filter((r: { status: string }) => r.status === "failed");
      if (failed.length === 0) {
        toast("success", "Tüm platformlarda yayınlandı");
      } else {
        toast(
          "warning",
          `Kısmen yayınlandı — ${failed.map((f: { platform: string }) => f.platform).join(", ")} başarısız. Detay listede.`,
        );
      }
      onSaved();
    } finally {
      setBusy(null);
    }
  }

  async function handleUpload(file: File) {
    setBusy("upload");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/sosyal/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast("error", data.error || "Görsel yüklenemedi");
        return;
      }
      setForm((f) => ({ ...f, imageMode: "upload", imageUrl: data.url }));
      toast("success", "Görsel yüklendi");
    } finally {
      setBusy(null);
    }
  }

  const accountFor = (p: Platform) => accounts.find((a) => a.platform === p);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto rounded-2xl bg-[#0a0a0f] border border-white/10 shadow-2xl">
          {/* Başlık çubuğu */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-[#0a0a0f] z-10 rounded-t-2xl">
            <h2 className="font-semibold text-white">
              {post ? "Paylaşımı düzenle" : "Yeni paylaşım"}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          {isPublished && (
            <div className="mx-6 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              Bu post yayınlanmış. Düzenleme yalnızca erpide.com Gündem içeriğini günceller —
              sosyal medyada yayınlanmış gönderiler değişmez, oradan elle düzenlenmeli.
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_420px] gap-6 p-6">
            {/* ── Sol: form ── */}
            <div className="space-y-5">
              <div className="grid sm:grid-cols-[160px_1fr] gap-4">
                <Field label="Tür">
                  <select
                    value={form.kind}
                    onChange={(e) => set("kind", e.target.value as PostKind)}
                    className={inputClass}
                  >
                    {(Object.keys(KIND_LABELS_TR) as PostKind[]).map((k) => (
                      <option key={k} value={k}>{KIND_LABELS_TR[k]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Başlık" required>
                  <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="FinansERPIDE mobil uygulaması yayında"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Özet" required hint="Kartlarda ve Instagram/Facebook metninde görünür (~150 karakter)">
                <textarea
                  value={form.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </Field>

              <Field label="Gövde" hint="Gündem yazısı ve LinkedIn paylaşımı. **kalın** ve '- ' listeleri desteklenir.">
                <textarea
                  value={form.body}
                  onChange={(e) => set("body", e.target.value)}
                  rows={8}
                  className={`${inputClass} font-mono text-xs`}
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Etiketler" hint="Virgülle ayırın, # koymayın">
                  <input
                    value={form.hashtags}
                    onChange={(e) => set("hashtags", e.target.value)}
                    placeholder="ERPIDE, ERP, muhasebe"
                    className={inputClass}
                  />
                </Field>
                <Field label="Bağlantı" hint="Boşsa Gündem yazısının adresi kullanılır">
                  <input
                    value={form.linkUrl}
                    onChange={(e) => set("linkUrl", e.target.value)}
                    placeholder="https://www.erpide.com/urunler/finanserpide"
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* Görsel */}
              <div className="rounded-xl border border-white/10 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <ImagePlus size={15} /> Görsel
                </div>

                <div className="flex gap-2">
                  <ModeButton active={form.imageMode === "auto"} onClick={() => set("imageMode", "auto")}>
                    Otomatik üret
                  </ModeButton>
                  <ModeButton active={form.imageMode === "upload"} onClick={() => set("imageMode", "upload")}>
                    Kendi görselim
                  </ModeButton>
                </div>

                {form.imageMode === "auto" ? (
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="Renk">
                      <select
                        value={form.gradient}
                        onChange={(e) => set("gradient", e.target.value)}
                        className={inputClass}
                      >
                        {GRADIENT_PRESETS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Emoji" hint="Görselde büyük görünür">
                      <input
                        value={form.decoration}
                        onChange={(e) => set("decoration", e.target.value)}
                        placeholder="🎉"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Alt başlık" hint="İkinci dil selamlaması">
                      <input
                        value={form.decorationSubtitle}
                        onChange={(e) => set("decorationSubtitle", e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      value={form.imageUrl}
                      onChange={(e) => set("imageUrl", e.target.value)}
                      placeholder="https://... veya /screenshots/..."
                      className={inputClass}
                    />
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:bg-white/5 cursor-pointer transition">
                      {busy === "upload" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      Dosya yükle
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(f);
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      Instagram görseli kendi sunucusuna indiriyor — adres herkese açık HTTPS olmalı.
                    </p>
                  </div>
                )}

                <Field label="Görsel açıklaması (alt)" hint="Erişilebilirlik ve SEO için">
                  <input
                    value={form.imageAlt}
                    onChange={(e) => set("imageAlt", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* Gündem alanları */}
              {form.targets.includes("site") && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Adres (slug)" hint={isPublished ? "Yayındaki adres değiştirilemez" : "Boşsa başlıktan üretilir"}>
                    <input
                      value={form.slug}
                      onChange={(e) => set("slug", e.target.value)}
                      disabled={isPublished}
                      placeholder="finanserpide-mobil-yayinda"
                      className={`${inputClass} ${isPublished ? "opacity-50" : ""}`}
                    />
                  </Field>
                  <Field label="Rozetler" hint="Virgülle">
                    <input
                      value={form.badges}
                      onChange={(e) => set("badges", e.target.value)}
                      placeholder="YENİ, MOBİL"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Ürün" hint="Detayda 'Ürüne git' butonu">
                    <input
                      value={form.productSlug}
                      onChange={(e) => set("productSlug", e.target.value)}
                      placeholder="finanserpide"
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              {/* Diğer diller */}
              <div className="rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setShowI18n((s) => !s)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition rounded-xl"
                >
                  <span>Diğer diller (İngilizce, Rusça, Kazakça)</span>
                  <ChevronDown size={16} className={`transition ${showI18n ? "rotate-180" : ""}`} />
                </button>
                {showI18n && (
                  <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                    <p className="text-xs text-gray-500">
                      Boş bırakılan alanlar Türkçe içeriğe düşer. Yalnızca Gündem sayfasını etkiler.
                    </p>
                    {EXTRA_LOCALES.map((loc) => (
                      <div key={loc} className="space-y-2">
                        <div className="text-xs font-semibold text-gray-400">{LOCALE_LABELS[loc]}</div>
                        <input
                          value={form.i18n[loc]?.title ?? ""}
                          onChange={(e) =>
                            set("i18n", { ...form.i18n, [loc]: { ...form.i18n[loc], title: e.target.value } })
                          }
                          placeholder="Başlık"
                          className={inputClass}
                        />
                        <textarea
                          value={form.i18n[loc]?.excerpt ?? ""}
                          onChange={(e) =>
                            set("i18n", { ...form.i18n, [loc]: { ...form.i18n[loc], excerpt: e.target.value } })
                          }
                          rows={2}
                          placeholder="Özet"
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Sağ: hedefler + önizleme + aksiyonlar ── */}
            <div className="space-y-5">
              <div className="rounded-xl border border-white/10 p-4">
                <div className="text-sm font-semibold text-gray-300 mb-3">Yayın hedefleri</div>
                <div className="space-y-2">
                  {PLATFORMS.map((p) => {
                    const acct = accountFor(p);
                    const notConnected = p !== "site" && !acct?.connected;
                    const done = post?.publications.find((x) => x.platform === p && x.status === "success");
                    return (
                      <label
                        key={p}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition ${
                          form.targets.includes(p)
                            ? "border-blue-500/40 bg-blue-600/10"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.targets.includes(p)}
                          onChange={() => toggleTarget(p)}
                          className="accent-blue-500"
                        />
                        <PlatformIcon platform={p} size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-200 flex-1">{PLATFORM_LABELS[p]}</span>
                        {done && <span className="text-[10px] text-emerald-400 font-semibold">YAYINDA</span>}
                        {notConnected && !done && (
                          <span className="text-[10px] text-amber-400 font-semibold">BAĞLI DEĞİL</span>
                        )}
                      </label>
                    );
                  })}
                </div>
                {form.targets.some((p) => p !== "site" && !accountFor(p)?.connected) && (
                  <p className="text-xs text-amber-400/80 mt-3">
                    Bağlı olmayan platformlar yayında hata verir; Hesaplar sekmesinden bağlayın.
                  </p>
                )}
              </div>

              <PlatformPreview post={previewPost} targets={form.targets} imagePreviewUrl={previewImage} />

              <div className="rounded-xl border border-white/10 p-4 space-y-3">
                <Field
                  label="Zamanlama"
                  hint="Zamanlanmış postlar her sabah 09:00 kontrolünde yayınlanır (Vercel Hobby planı günde bir koşuya izin veriyor). Belirli bir saatte çıkması gerekiyorsa 'Şimdi yayınla' kullanın."
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-500" />
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => set("scheduledAt", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleSave("draft")}
                    disabled={!!busy}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition disabled:opacity-50"
                  >
                    {busy === "draft" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Taslak kaydet
                  </button>
                  <button
                    onClick={() => handleSave("scheduled")}
                    disabled={!!busy || !form.scheduledAt}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 text-sm text-amber-300 hover:bg-amber-500/10 transition disabled:opacity-40"
                  >
                    {busy === "schedule" ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                    Zamanla
                  </button>
                </div>

                <button
                  onClick={handlePublish}
                  disabled={!!busy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {busy === "publish" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Şimdi yayınla ({form.targets.length} platform)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-[#111118] border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition";

function Field({
  label, hint, required, children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-400">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-600 leading-relaxed">{hint}</p>}
    </div>
  );
}

function ModeButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
        active
          ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
          : "border border-white/10 text-gray-400 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
