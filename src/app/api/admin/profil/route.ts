import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE, getAdmins, saveAdmins } from "@/lib/auth";

/** GET — sadece çağıran admin'in kendi profilini döner. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "no_session" }, { status: 401 });

  const session = await getSession(token);
  if (!session || session.userType !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admins = await getAdmins();
  const me = admins.find((a) => a.id === session.userId);
  if (!me) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    id: me.id,
    name: me.name,
    email: me.email,
    role: me.role,
  });
}

/** PATCH — sadece kendi kaydını günceller. Body: { name?, email?, currentPassword?, newPassword? }
 * Şifre değiştirme için currentPassword doğrulanır (başkası ele geçirse bile değiştiremesin). */
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "no_session" }, { status: 401 });

  const session = await getSession(token);
  if (!session || session.userType !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { name?: string; email?: string; currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const admins = await getAdmins();
  const idx = admins.findIndex((a) => a.id === session.userId);
  if (idx < 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const me = admins[idx];

  // Name / Email update
  if (typeof body.name === "string" && body.name.trim()) {
    me.name = body.name.trim();
  }
  if (typeof body.email === "string" && body.email.trim()) {
    const newEmail = body.email.trim().toLowerCase();
    // Aynı email başka kullanıcıda kullanılıyorsa reddet
    const conflict = admins.find((a) => a.id !== me.id && a.email.toLowerCase() === newEmail);
    if (conflict) return NextResponse.json({ error: "email_in_use" }, { status: 409 });
    me.email = newEmail;
  }

  // Password update — mevcut şifre doğrulansın
  if (body.newPassword) {
    if (!body.currentPassword || body.currentPassword !== me.password) {
      return NextResponse.json({ error: "wrong_current_password" }, { status: 403 });
    }
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: "password_too_short" }, { status: 400 });
    }
    me.password = body.newPassword;
  }

  admins[idx] = me;
  await saveAdmins(admins);

  return NextResponse.json({
    success: true,
    user: { id: me.id, name: me.name, email: me.email, role: me.role },
  });
}
