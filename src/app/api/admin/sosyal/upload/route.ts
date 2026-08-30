/**
 * /api/admin/sosyal/upload — post görseli yükleme (Cloudflare R2).
 *
 * Otomatik OG görseli çoğu paylaşım için yeterli; bu uç, hazır bir görsel
 * (ürün ekran görüntüsü, tasarım) kullanmak istendiğinde devreye girer.
 *
 * Dönen URL herkese açık olmalı: Instagram ve Facebook görseli kendi
 * sunucularına bu adresten indiriyor. R2_PUBLIC_URL bunu sağlıyor.
 */
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { r2, R2_BUCKET, R2_PUBLIC_URL, R2_CONFIGURED } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Instagram JPEG/PNG ister; GIF ve PDF burada anlamsız. */
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

const sanitize = (s: string) =>
  (s || "").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

export async function POST(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (!R2_CONFIGURED || !r2) {
    return NextResponse.json(
      { error: "R2 depolama yapılandırılmamış (R2_* env eksik)" },
      { status: 500 },
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Görsel 8MB'dan büyük olamaz" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Yalnızca PNG, JPEG veya WebP yükleyebilirsiniz" },
      { status: 400 },
    );
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const key = `sosyal/${Date.now()}-${sanitize(file.name.replace(/\.[^.]+$/, ""))}.${sanitize(ext || "png")}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }),
  );

  return NextResponse.json({ url: `${R2_PUBLIC_URL}/${key}` });
}
