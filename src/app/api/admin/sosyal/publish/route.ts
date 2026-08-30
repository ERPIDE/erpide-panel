/**
 * /api/admin/sosyal/publish — "Şimdi Yayınla" düğmesinin ucu.
 *
 * Body: { postId, platforms?, skipSucceeded? }
 *  - platforms verilmezse post'un kendi hedefleri kullanılır
 *  - skipSucceeded: yeniden denemede zaten yayınlanmış platformları atlar
 *
 * Kısmi başarı 200 döner; sonuç dizisinde hangi platformun neden düştüğü
 * yazar. Panel bunu satır satır gösterir.
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { HAS_DB } from "@/lib/db";
import { publishPost } from "@/lib/social/publish";
import { getById } from "@/lib/social/store";
import { PLATFORMS } from "@/lib/social/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Instagram container'ının hazırlanmasını beklemek 30 saniyeye kadar sürebilir.
export const maxDuration = 120;

const schema = z.object({
  postId: z.string().min(1),
  platforms: z.array(z.enum(PLATFORMS)).optional(),
  skipSucceeded: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!HAS_DB) return NextResponse.json({ error: "DATABASE_URL tanımlı değil" }, { status: 500 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  try {
    const outcome = await publishPost(parsed.data.postId, {
      platforms: parsed.data.platforms,
      skipSucceeded: parsed.data.skipSucceeded,
    });

    // Gündem'e yayınlandıysa sayfayı anında tazele — revalidate süresini bekleme.
    const post = await getById(parsed.data.postId);
    if (post?.slug) {
      revalidatePath("/gundem");
      revalidatePath(`/gundem/${post.slug}`);
    }

    return NextResponse.json({ ...outcome, post });
  } catch (e) {
    // Buraya yalnızca yayın hiç başlayamadığında düşülür (doğrulama hatası,
    // post bulunamadı). Platform hataları outcome içinde döner.
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Yayın başlatılamadı" },
      { status: 400 },
    );
  }
}
