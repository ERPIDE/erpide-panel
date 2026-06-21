/**
 * GET  /api/tickets/[id]  — ticket detayı (sadece kendi ticketı)
 * POST /api/tickets/[id]  — kullanıcı yeni mesaj ekle
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

async function requireShopUser() {
  const s = await getSession();
  return s.userId ? s : null;
}

type Params = { id: string };

export async function GET(_req: Request, { params }: { params: Promise<Params> }) {
  const session = await requireShopUser();
  if (!session) return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });

  const { id } = await params;
  const prisma = getPrisma();

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!ticket || ticket.userId !== session.userId) {
    return NextResponse.json({ error: "Ticket bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}

export async function POST(req: Request, { params }: { params: Promise<Params> }) {
  const session = await requireShopUser();
  if (!session) return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { content?: string };

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "İçerik boş olamaz" }, { status: 400 });
  }

  const prisma = getPrisma();

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket || ticket.userId !== session.userId) {
    return NextResponse.json({ error: "Ticket bulunamadı" }, { status: 404 });
  }

  if (ticket.status === "closed") {
    return NextResponse.json({ error: "Kapalı ticketa mesaj eklenemez" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, surname: true },
  });
  const authorName = user ? `${user.name} ${user.surname}` : (session.name || "Kullanıcı");

  const [msg] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: id,
        role: "user",
        authorName,
        content: body.content.trim(),
      },
    }),
    prisma.ticket.update({
      where: { id },
      data: { updatedAt: new Date(), status: "open" },
    }),
  ]);

  return NextResponse.json(msg);
}
