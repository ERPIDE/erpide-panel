/**
 * /api/admin/sosyal — sosyal post listesi ve oluşturma.
 *
 * GET  → tüm postlar (taslak dahil) + yayın sonuçları
 * POST → yeni post. Gündem hedefi seçiliyse slug otomatik üretilir.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { HAS_DB } from "@/lib/db";
import { createPost, listAll, uniqueSlug } from "@/lib/social/store";
import { PLATFORMS } from "@/lib/social/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(req: NextRequest) {
  return getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
}

const i18nFields = z.object({
  title: z.string().optional(),
  excerpt: z.string().optional(),
  body: z.string().optional(),
});

export const postSchema = z.object({
  kind: z.enum(["product-launch", "special-day", "milestone"]).default("milestone"),
  title: z.string().trim().min(1, "Başlık zorunlu").max(300),
  excerpt: z.string().trim().min(1, "Özet zorunlu").max(1000),
  body: z.string().default(""),
  hashtags: z.array(z.string()).default([]),
  linkUrl: z.string().trim().url("Geçerli bir bağlantı girin").nullish(),

  imageUrl: z.string().trim().nullish(),
  imageAlt: z.string().default(""),
  imageMode: z.enum(["auto", "upload"]).default("auto"),
  gradient: z.string().nullish(),
  decoration: z.string().max(16).nullish(),
  decorationSubtitle: z.string().max(120).nullish(),
  imageBackground: z.string().nullish(),

  slug: z.string().trim().nullish(),
  badges: z.array(z.string()).default([]),
  productSlug: z.string().nullish(),
  i18n: z.record(z.string(), i18nFields).nullish(),

  targets: z.array(z.enum(PLATFORMS)).min(1, "En az bir yayın hedefi seçin"),
  /** ISO datetime; status="scheduled" ise zorunlu. */
  scheduledAt: z.string().datetime().nullish(),
  status: z.enum(["draft", "scheduled"]).default("draft"),
});

export type PostPayload = z.infer<typeof postSchema>;

export async function GET(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  return NextResponse.json({ posts: await listAll() });
}

export async function POST(req: NextRequest) {
  const session = await guard(req);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  if (input.status === "scheduled" && !input.scheduledAt) {
    return NextResponse.json({ error: "Zamanlanmış post için tarih/saat gerekli" }, { status: 400 });
  }

  // Gündem'e gidecekse slug şart; kullanıcı vermediyse başlıktan türetilir.
  let slug = input.slug || null;
  if (input.targets.includes("site")) {
    slug = await uniqueSlug(slug || input.title);
  }

  const post = await createPost({
    ...input,
    slug,
    linkUrl: input.linkUrl ?? null,
    imageUrl: input.imageUrl ?? null,
    gradient: input.gradient ?? null,
    decoration: input.decoration ?? null,
    decorationSubtitle: input.decorationSubtitle ?? null,
    imageBackground: input.imageBackground ?? null,
    productSlug: input.productSlug ?? null,
    i18n: input.i18n ?? null,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    createdBy: session.userEmail ?? session.userName,
  });

  return NextResponse.json({ post });
}

/** Zod hatasından kullanıcıya gösterilecek tek satırlık mesaj. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Geçersiz veri";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
