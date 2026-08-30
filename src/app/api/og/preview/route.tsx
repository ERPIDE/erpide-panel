/**
 * /api/og/preview — kaydedilmemiş post için canlı görsel önizlemesi.
 *
 * Composer'da başlık/renk/emoji değiştikçe görselin nasıl görüneceği anında
 * görünsün diye alanlar query string'den okunur. Kaydedilmiş postların görseli
 * /api/og/post/[key] üzerinden üretilir.
 *
 * Admin oturumu şart: aksi halde herkes ERPIDE markalı görsel üretebilirdi.
 */
import { NextRequest } from "next/server";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { parseFormat, renderPostImage } from "@/lib/social/og-image";
import type { PostKind } from "@/lib/social/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return new Response("forbidden", { status: 403 });

  const q = req.nextUrl.searchParams;

  return renderPostImage(
    {
      title: q.get("title") || "Başlık",
      excerpt: q.get("excerpt") || "",
      kind: (q.get("kind") as PostKind) || "milestone",
      gradient: q.get("gradient"),
      decoration: q.get("decoration"),
      decorationSubtitle: q.get("decorationSubtitle"),
      publishedAt: q.get("date") || new Date().toISOString(),
    },
    parseFormat(q.get("format")),
  );
}
