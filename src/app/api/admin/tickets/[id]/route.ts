/**
 * PATCH /api/admin/tickets/[id]  — status güncelle
 * POST  /api/admin/tickets/[id]  — admin yanıtı ekle
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerSession, SESSION_COOKIE } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return await getOwnerSession(token);
}

type Params = { id: string };

export async function PATCH(req: Request, { params }: { params: Promise<Params> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { status?: string; priority?: string };
  const prisma = getPrisma();

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function POST(req: Request, { params }: { params: Promise<Params> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as { content: string };

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "İçerik boş olamaz" }, { status: 400 });
  }

  const prisma = getPrisma();

  // $transaction KULLANILAMAZ: Neon HTTP sürücüsü istek başına tek ifade
  // çalıştırıyor ve transaction'ı "Transactions are not supported in HTTP
  // mode" ile reddediyor (bkz. lib/db.ts). İki yazımı ayırıyoruz.
  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      role: "admin",
      authorName: admin.userName || "ERPIDE Destek",
      content: body.content.trim(),
    },
  });

  // Mesaj yazıldıktan sonra durum güncellemesi başarısız olursa isteği
  // BAŞARISIZ SAYMIYORUZ: mesaj kaydedildi, 500 dönmek yanıtı yazan kişiyi
  // tekrar göndermeye iter ve mükerrer mesaj oluşur. Hata loglanır; ticket
  // durumu bir sonraki etkileşimde zaten güncellenir.
  await prisma.ticket
    .update({
      where: { id },
      data: { updatedAt: new Date(), status: "in_progress" },
    })
    .catch((e) => console.error(`[admin/tickets] ${id} durumu güncellenemedi:`, e));

  return NextResponse.json(msg);
}
