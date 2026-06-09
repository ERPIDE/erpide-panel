/**
 * Mobile auth helper — Authorization: Bearer <pkt_xxx> header'ı validate eder.
 *
 * Ayrıca panel'in `apps.pocketerpide` lisans state'ini kontrol eder; aktif
 * lisans yoksa 403 döner. Owner email'leri PLATFORM_OWNER_EMAILS env'inden
 * çekilir (kurucu hesap her zaman aktif).
 */
import { NextResponse } from "next/server";
import { validateToken } from "@/lib/pocket-store";
import { findUserById, listOrdersByUserId } from "@/lib/auth/user-store";

const PLATFORM_OWNER_EMAILS = new Set(
  (process.env.PLATFORM_OWNER_EMAILS || "alimuratelll@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export interface PocketAuthSuccess {
  ok: true;
  userId: string;
  userEmail: string;
}

export type PocketAuthResult =
  | PocketAuthSuccess
  | { ok: false; response: NextResponse };

export async function authenticateMobile(req: Request): Promise<PocketAuthResult> {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Missing Bearer token" }, { status: 401 }),
    };
  }
  const token = m[1].trim();
  const tokenRec = await validateToken(token);
  if (!tokenRec) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid or revoked token" }, { status: 401 }),
    };
  }

  const user = await findUserById(tokenRec.userId);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "User not found" }, { status: 401 }),
    };
  }

  // License kontrolü — PocketERPIDE aktif mi?
  const isOwner = PLATFORM_OWNER_EMAILS.has(user.email.toLowerCase());
  if (!isOwner) {
    const orders = await listOrdersByUserId(user.id);
    const now = Date.now();
    const hasActive = orders.some((o) => {
      const isPocket = o.items.some((it) => it.productId === "pocketerpide");
      if (!isPocket) return false;
      if (o.status === "PAID") {
        return !o.subscriptionExpiresAt || new Date(o.subscriptionExpiresAt).getTime() > now;
      }
      if (o.status === "TRIAL" && o.isTrial) {
        return !!o.trialExpiresAt && new Date(o.trialExpiresAt).getTime() > now;
      }
      return false;
    });
    if (!hasActive) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "PocketERPIDE lisansı aktif değil. erpide.com/urunler/pocketerpide" },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true, userId: user.id, userEmail: user.email };
}
