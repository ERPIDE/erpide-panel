import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { findUserById, updateUser } from "@/lib/auth/user-store";
import { hashPassword, verifyPassword, validatePassword } from "@/lib/auth/passwords";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz şifre uzunluğu" }, { status: 400 });

  const pwdError = validatePassword(parsed.data.newPassword);
  if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });

  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 401 });

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return NextResponse.json({ error: "Yeni şifre eskisinden farklı olmalı" }, { status: 400 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await updateUser(user.id, { passwordHash: newHash });
  return NextResponse.json({ ok: true });
}
