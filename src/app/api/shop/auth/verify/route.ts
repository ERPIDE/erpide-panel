import { NextResponse } from "next/server";
import { findUserByVerificationToken, updateUser } from "@/lib/auth/user-store";
import { isTokenExpired } from "@/lib/auth/email-verification";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

async function handle(token: string | null) {
  if (!token) return { ok: false, status: 400, error: "Token gerekli" };
  const user = await findUserByVerificationToken(token);
  if (!user) return { ok: false, status: 404, error: "Geçersiz veya kullanılmış bağlantı" };
  if (user.emailVerified) {
    return { ok: true, alreadyVerified: true, user };
  }
  if (isTokenExpired(user.verificationTokenExpiresAt)) {
    return { ok: false, status: 410, error: "Bağlantının süresi doldu. Yeniden gönder seçeneğini kullanın.", expiredUserEmail: user.email };
  }
  const updated = await updateUser(user.id, {
    emailVerified: true,
    verificationToken: undefined,
    verificationTokenExpiresAt: undefined,
  });
  return { ok: true, user: updated! };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const r = await handle(token);
  if (!r.ok) return NextResponse.json({ error: r.error, expiredUserEmail: r.expiredUserEmail }, { status: r.status });

  // Auto-login after successful verification
  if (r.user) {
    const session = await getSession();
    session.userId = r.user.id;
    session.email = r.user.email;
    session.name = `${r.user.name} ${r.user.surname}`;
    await session.save();
  }
  return NextResponse.json({ ok: true, alreadyVerified: r.alreadyVerified === true });
}

export async function POST(req: Request) {
  // Accept both JSON body and query param
  let token: string | null = null;
  try {
    const body = await req.json();
    if (body?.token) token = String(body.token);
  } catch {}
  if (!token) {
    const url = new URL(req.url);
    token = url.searchParams.get("token");
  }
  const r = await handle(token);
  if (!r.ok) return NextResponse.json({ error: r.error, expiredUserEmail: r.expiredUserEmail }, { status: r.status });
  if (r.user) {
    const session = await getSession();
    session.userId = r.user.id;
    session.email = r.user.email;
    session.name = `${r.user.name} ${r.user.surname}`;
    await session.save();
  }
  return NextResponse.json({ ok: true, alreadyVerified: r.alreadyVerified === true });
}
