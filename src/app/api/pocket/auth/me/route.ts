/**
 * GET /api/pocket/auth/me
 * Authorization: Bearer pkt_xxx
 *
 * Mobile uygulama session valid mi kontrol eder. User bilgisi + lisans durumu döner.
 */
import { NextResponse } from "next/server";
import { authenticateMobile } from "@/lib/pocket-auth";
import { findUserById } from "@/lib/auth/user-store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateMobile(req);
  if (!auth.ok) return auth.response;

  const user = await findUserById(auth.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
    },
    licensed: true,
  });
}
