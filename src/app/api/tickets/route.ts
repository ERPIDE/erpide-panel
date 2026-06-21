/**
 * GET  /api/tickets  — kullanıcının kendi ticketları
 * POST /api/tickets  — yeni ticket oluştur
 *
 * Auth: iron-session (shop user)
 * Lisans kontrolü: productId geçilmişse aktif order var mı diye bakar.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

async function requireShopUser() {
  const s = await getSession();
  return s.userId ? s : null;
}

export async function GET() {
  const session = await requireShopUser();
  if (!session) return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });

  const prisma = getPrisma();
  const tickets = await prisma.ticket.findMany({
    where: { userId: session.userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const session = await requireShopUser();
  if (!session) return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });

  const body = await req.json() as { subject?: string; content?: string; productId?: string; priority?: string };

  if (!body.subject?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "Konu ve içerik zorunludur" }, { status: 400 });
  }

  const prisma = getPrisma();

  // productId verilmişse aktif order kontrolü
  if (body.productId) {
    const orders = await prisma.order.findMany({
      where: { userId: session.userId, status: { in: ["paid", "active"] } },
    });
    const hasProduct = orders.some((o) => {
      const items = o.items as Array<{ productId?: string }>;
      return items.some((i) => i.productId === body.productId);
    });
    if (!hasProduct) {
      return NextResponse.json({ error: "Bu ürün için aktif aboneliğiniz bulunmuyor" }, { status: 403 });
    }
  }

  // Kullanıcı adı
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, surname: true },
  });
  const authorName = user ? `${user.name} ${user.surname}` : (session.name || "Kullanıcı");

  const ticket = await prisma.ticket.create({
    data: {
      userId: session.userId!,
      productId: body.productId || null,
      subject: body.subject.trim(),
      priority: body.priority === "urgent" ? "urgent" : "normal",
      messages: {
        create: {
          role: "user",
          authorName,
          content: body.content.trim(),
        },
      },
    },
    include: { messages: true },
  });

  return NextResponse.json(ticket, { status: 201 });
}
