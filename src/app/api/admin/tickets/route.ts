/**
 * GET /api/admin/tickets   — tüm ticketları listele (admin)
 * PATCH /api/admin/tickets/[id] için ayrı route
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

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const productId = url.searchParams.get("productId");

  const prisma = getPrisma();

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(status && status !== "all" ? { status } : {}),
      ...(productId ? { productId } : {}),
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // User bilgilerini çek
  const userIds = [...new Set(tickets.map((t) => t.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, surname: true, email: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const enriched = tickets.map((t) => ({
    ...t,
    user: userMap[t.userId] || null,
  }));

  return NextResponse.json(enriched);
}
