import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL, R2_CONFIGURED, keyFromPublicUrl } from "@/lib/r2";

export const runtime = "nodejs";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ORG = "ERPIDE";

const repoMap: Record<string, string> = {
  CANIAS: "erpide-canias-erp",
  "1C ERP": "erpide-1c-erp",
};

/** Object key / URL için güvenli hale getir (boşluk ve özel karakterleri temizle). */
const sanitize = (s: string) =>
  (s || "").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

// POST /api/upload — dosyayı Cloudflare R2'ye yükle (S3-uyumlu)
export async function POST(request: NextRequest) {
  if (!R2_CONFIGURED || !r2) {
    return NextResponse.json(
      { error: "R2 depolama yapilandirilmamis (R2_* env eksik)" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const taskId = formData.get("taskId") as string;
    const project = formData.get("project") as string;
    const repo = formData.get("repo") as string;

    if (!file) {
      return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Dosya boyutu 10MB'dan buyuk olamaz" }, { status: 400 });
    }

    // Allowed types
    const allowed = [
      "image/png", "image/jpeg", "image/gif", "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Desteklenmeyen dosya tipi. PNG, JPEG, PDF, Word, Excel kabul edilir." },
        { status: 400 }
      );
    }

    const folder = project
      ? `tasks/${sanitize(project)}/${sanitize(taskId)}`
      : `tasks/${sanitize(taskId)}`;
    const key = `${folder}/${Date.now()}-${sanitize(file.name)}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: file.type,
      })
    );
    const url = `${R2_PUBLIC_URL}/${key}`;

    // Determine attachment type
    let type: "image" | "document" | "screenshot" = "document";
    if (file.type.startsWith("image/")) type = "image";

    // Save file URL as a comment on GitHub issue for persistence
    const ghRepo = repo || repoMap[project];
    if (ghRepo && taskId && GITHUB_TOKEN) {
      const isImage = file.type.startsWith("image/");
      const commentBody = isImage
        ? `**Ek Dosya:** ${file.name}\n\n![${file.name}](${url})`
        : `**Ek Dosya:** [${file.name}](${url})`;

      await fetch(
        `https://api.github.com/repos/${ORG}/${ghRepo}/issues/${taskId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body: commentBody }),
        }
      );
    }

    return NextResponse.json({
      url,
      name: file.name,
      type,
      size: file.size,
      date: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Dosya yuklenemedi" }, { status: 500 });
  }
}

// DELETE /api/upload?url=xxx — R2'den sil
export async function DELETE(request: NextRequest) {
  if (!R2_CONFIGURED || !r2) {
    return NextResponse.json({ error: "R2 yapilandirilmamis" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 });
    }

    const key = keyFromPublicUrl(url);
    if (!key) {
      // R2 dışı (eski Vercel Blob) URL — sessizce geç, hata verme.
      return NextResponse.json({ message: "R2 disi URL, atlandi" });
    }

    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return NextResponse.json({ message: "Dosya silindi" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Dosya silinemedi" }, { status: 500 });
  }
}
