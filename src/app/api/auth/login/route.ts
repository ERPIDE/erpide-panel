import { NextRequest, NextResponse } from "next/server";
import {
  getAdmins,
  getCustomers,
  createSession,
  saveAdmins,
  saveCustomers,
  SESSION_COOKIE,
} from "@/lib/auth";
import { hashPassword, looksHashed, verifyPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, password } = body;

    if (type === "admin") {
      const { email } = body;
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email ve parola gerekli" },
          { status: 400 }
        );
      }

      const admins = await getAdmins();
      const candidate = admins.find((a) => a.email === email);
      const user = candidate && (await verifyPassword(password, candidate.password))
        ? candidate
        : undefined;

      if (!user) {
        return NextResponse.json(
          { error: "Geçersiz email veya parola" },
          { status: 401 }
        );
      }

      // Legacy plaintext kaydı bu login'de bcrypt'e yükselt — fire-and-forget.
      if (!looksHashed(user.password)) {
        const updated = admins.map((a) =>
          a.id === user.id ? { ...a, password: "" } : a,
        );
        hashPassword(password)
          .then((hashed) => {
            const next = updated.map((a) =>
              a.id === user.id ? { ...a, password: hashed } : a,
            );
            return saveAdmins(next);
          })
          .catch(() => {});
      }

      const token = await createSession({
        userId: user.id,
        userType: "admin",
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
      });

      const res = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          type: "admin",
        },
      });

      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return res;
    }

    if (type === "customer") {
      const { code } = body;
      if (!code || !password) {
        return NextResponse.json(
          { error: "Müşteri kodu ve parola gerekli" },
          { status: 400 }
        );
      }

      const customers = await getCustomers();
      const candidate = customers.find((c) => c.code === code);
      const user = candidate && (await verifyPassword(password, candidate.password))
        ? candidate
        : undefined;

      if (!user) {
        return NextResponse.json(
          { error: "Geçersiz müşteri kodu veya parola" },
          { status: 401 }
        );
      }

      // Legacy plaintext kaydı bu login'de bcrypt'e yükselt — fire-and-forget.
      if (!looksHashed(user.password)) {
        hashPassword(password)
          .then((hashed) => {
            const next = customers.map((c) =>
              c.id === user.id ? { ...c, password: hashed } : c,
            );
            return saveCustomers(next);
          })
          .catch(() => {});
      }

      const token = await createSession({
        userId: user.id,
        userType: "customer",
        userName: user.name,
        customerCode: user.code,
      });

      const res = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          code: user.code,
          project: user.project,
          type: "customer",
        },
      });

      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;
    }

    return NextResponse.json(
      { error: "Geçersiz kullanıcı tipi" },
      { status: 400 }
    );
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "Sunucu hatası", detail: String(e) },
      { status: 500 }
    );
  }
}
