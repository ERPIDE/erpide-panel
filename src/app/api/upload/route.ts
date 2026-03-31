import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ORG = "ERPIDE";

const repoMap: Record<string, string> = {
  CANIAS: "erpide-canias-erp",
  "1C ERP": "erpide-1c-erp",
};

// POST /api/upload — upload a file to Vercel Blob
export async function POST(request: NextRequest) {
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

    const folder = project ? `tasks/${project}/${taskId}` : `tasks/${taskId}`;
    const filename = `${folder}/${Date.now()}-${file.name}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Determine attachment type
    let type: "image" | "document" | "screenshot" = "document";
    if (file.type.startsWith("image/")) type = "image";

    // Save file URL as a comment on GitHub issue for persistence
    const ghRepo = repo || repoMap[project];
    if (ghRepo && taskId && GITHUB_TOKEN) {
      const isImage = file.type.startsWith("image/");
      const commentBody = isImage
        ? `**Ek Dosya:** ${file.name}\n\n![${file.name}](${blob.url})`
        : `**Ek Dosya:** [${file.name}](${blob.url})`;

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
      url: blob.url,
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

// DELETE /api/upload?url=xxx — delete a blob
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 });
    }

    await del(url);
    return NextResponse.json({ message: "Dosya silindi" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Dosya silinemedi" }, { status: 500 });
  }
}
