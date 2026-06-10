/**
 * POST /api/admin/users/reset
 * Header: x-admin-token: <ADMIN_BOOTSTRAP_TOKEN>
 * Body:   { email: string, newPassword: string, verifyEmail?: boolean }
 *
 * Acil durumlar icin: kullanici sifresini reset eder + opsiyonel
 * emailVerified=true yapar (aktivasyon maili gelmediginde bypass).
 *
 * Yeni sifrenin hash'i bcrypt ile uretilir, plain text donulmez.
 * Sadece bootstrap token sahibi cagirabilir.
 */
import { NextResponse } from "next/server";
import { findUserByEmail, updateUser } from "@/lib/auth/user-store";
import { hashPassword } from "@/lib/auth/passwords";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_BOOTSTRAP_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { email?: string; newPassword?: string; verifyEmail?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const newPassword = String(body.newPassword || "");
  const verifyEmail = body.verifyEmail !== false; // default true

  if (!email || !newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "email + newPassword (min 6 char) gerekli" },
      { status: 400 }
    );
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const passwordHash = await hashPassword(newPassword);

  const patch: Record<string, unknown> = { passwordHash };
  if (verifyEmail) {
    patch.emailVerified = true;
    patch.verificationToken = undefined;
    patch.verificationTokenExpiresAt = undefined;
  }

  await updateUser(user.id, patch);

  return NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.email,
    verified: verifyEmail,
  });
}
