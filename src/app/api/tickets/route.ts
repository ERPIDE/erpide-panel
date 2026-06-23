/**
 * GET  /api/tickets  — kullanıcının kendi ticketları
 * POST /api/tickets  — yeni ticket oluştur
 *
 * Auth: iron-session (shop user)
 * Lisans kontrolü: productId geçilmişse aktif order var mı diye bakar.
 */
import { NextResponse } from "next/server";
import { Resend } from "resend";
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

  // destek@erpide.com'a bildirim maili
  if (process.env.RESEND_API_KEY) {
    const userEmail = await prisma.user.findUnique({
      where: { id: session.userId! },
      select: { email: true },
    });
    const priorityLabel = ticket.priority === "urgent" ? "🔴 Acil" : "🟡 Normal";
    const resend = new Resend(process.env.RESEND_API_KEY);
    resend.emails.send({
      from: "ERPIDE <noreply@erpide.com>",
      to: ["destek@erpide.com"],
      replyTo: userEmail?.email ?? undefined,
      subject: `[Ticket #${ticket.id.slice(-6).toUpperCase()}] ${ticket.subject}`,
      html: `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;background:#f5f5f7;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="padding:20px 24px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff">
      <h2 style="margin:0;font-size:18px">Yeni Destek Talebi</h2>
      <p style="margin:4px 0 0;font-size:13px;opacity:.85">Ticket #${ticket.id.slice(-6).toUpperCase()}</p>
    </div>
    <div style="padding:24px;color:#111827;font-size:14px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#6b7280;width:110px">Gönderen</td><td style="padding:6px 0"><strong>${authorName}</strong>${userEmail?.email ? ` &lt;${userEmail.email}&gt;` : ""}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Konu</td><td style="padding:6px 0"><strong>${ticket.subject}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Öncelik</td><td style="padding:6px 0">${priorityLabel}</td></tr>
        ${ticket.productId ? `<tr><td style="padding:6px 0;color:#6b7280">Ürün</td><td style="padding:6px 0">${ticket.productId}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Mesaj</td><td style="padding:6px 0;white-space:pre-wrap;line-height:1.6">${ticket.messages[0]?.content ?? ""}</td></tr>
      </table>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb">
        <a href="https://erpide.com/admin/tickets" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">Admin Panelde Görüntüle →</a>
      </div>
    </div>
  </div>
</body></html>`.trim(),
    }).catch((e) => console.error("[tickets] resend error:", e));
  }

  return NextResponse.json(ticket, { status: 201 });
}
