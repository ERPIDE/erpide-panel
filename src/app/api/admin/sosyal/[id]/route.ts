/**
 * /api/admin/sosyal/[id] — tek post oku / güncelle / sil.
 *
 * Yayınlanmış bir post düzenlenebilir (Gündem içeriği güncellenir) ama bu
 * sosyal medyada zaten yayınlanmış gönderiyi değiştirmez — platform API'leri
 * yayın sonrası düzenlemeye izin vermiyor. Panel bunu kullanıcıya söyler.
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { HAS_DB } from "@/lib/db";
import { deletePost, getById, updatePost, uniqueSlug } from "@/lib/social/store";
import { firstIssue, postSchema } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(req: NextRequest) {
  return getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const { id } = await context.params;
  const post = await getById(id);
  if (!post) return NextResponse.json({ error: "Post bulunamadı" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const { id } = await context.params;
  const existing = await getById(id);
  if (!existing) return NextResponse.json({ error: "Post bulunamadı" }, { status: 404 });

  const parsed = postSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  const targets = input.targets ?? existing.targets;
  const status = input.status ?? existing.status;
  if (status === "scheduled" && !(input.scheduledAt ?? existing.scheduledAt)) {
    return NextResponse.json({ error: "Zamanlanmış post için tarih/saat gerekli" }, { status: 400 });
  }

  // Gündem hedefi eklendiyse slug şart. Yayınlanmış post'un slug'ı korunur —
  // değiştirmek canlı bağlantıları ve paylaşılmış linkleri kırardı.
  let slug = input.slug !== undefined ? input.slug : existing.slug;
  if (targets.includes("site") && !slug) {
    slug = await uniqueSlug(input.title || existing.title, id);
  } else if (slug && slug !== existing.slug) {
    if (existing.status === "published") {
      return NextResponse.json(
        { error: "Yayınlanmış post'un adresi değiştirilemez" },
        { status: 400 },
      );
    }
    slug = await uniqueSlug(slug, id);
  }

  const post = await updatePost(id, {
    ...input,
    slug,
    scheduledAt:
      input.scheduledAt === undefined
        ? undefined
        : input.scheduledAt
          ? new Date(input.scheduledAt)
          : null,
  });

  // Yayındaki içerik değiştiyse Gündem sayfalarını hemen tazele.
  if (post.status === "published" && post.slug) {
    revalidatePath("/gundem");
    revalidatePath(`/gundem/${post.slug}`);
  }

  return NextResponse.json({ post });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const { id } = await context.params;
  const existing = await getById(id);
  if (!existing) return NextResponse.json({ error: "Post bulunamadı" }, { status: 404 });

  await deletePost(id);

  // Silinen post Gündem'deyse listeyi tazele; sosyal medyadaki gönderi
  // silinmez, panel bunu kullanıcıya bildirir.
  if (existing.slug) {
    revalidatePath("/gundem");
    revalidatePath(`/gundem/${existing.slug}`);
  }

  const remoteLive = existing.publications.filter(
    (p) => p.platform !== "site" && p.status === "success",
  );

  return NextResponse.json({
    ok: true,
    warning: remoteLive.length
      ? `Post silindi, ancak ${remoteLive.map((p) => p.platform).join(", ")} üzerindeki gönderiler yerinde duruyor — oradan elle silmeniz gerekir.`
      : null,
  });
}
