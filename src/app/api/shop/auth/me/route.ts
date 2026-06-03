import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { findUserById, listOrdersByUserId } from "@/lib/auth/user-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ user: null });
  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ user: null });

  const orders = await listOrdersByUserId(user.id);
  const now = Date.now();
  const activeProductIds = new Set<string>();
  for (const o of orders) {
    if (o.status === "PAID") {
      const expired = !!o.subscriptionExpiresAt && new Date(o.subscriptionExpiresAt).getTime() < now;
      if (!expired) for (const it of o.items) activeProductIds.add(it.productId);
    } else if (o.status === "TRIAL" && o.isTrial) {
      const expired = !!o.trialExpiresAt && new Date(o.trialExpiresAt).getTime() < now;
      if (!expired) for (const it of o.items) activeProductIds.add(it.productId);
    }
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, surname: user.surname },
    apps: {
      finanserpide: activeProductIds.has("finanserpide"),
      captchaerpide: activeProductIds.has("captchaerpide"),
    },
  });
}
