import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { findOrderById, updateOrder } from "@/lib/auth/user-store";

export const runtime = "nodejs";

const schema = z.object({ enabled: z.boolean() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }
  const { orderId } = await params;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const order = await findOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  if (order.userId !== session.userId) {
    // Don't leak existence of other users' orders.
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }
  if (order.status !== "PAID") {
    return NextResponse.json(
      { error: "Otomatik yenileme sadece aktif aylık/yıllık abonelikler için ayarlanabilir" },
      { status: 400 }
    );
  }

  await updateOrder(orderId, { autoRenewEnabled: parsed.data.enabled });
  return NextResponse.json({ ok: true, autoRenewEnabled: parsed.data.enabled });
}
