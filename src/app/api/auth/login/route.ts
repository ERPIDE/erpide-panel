import { NextRequest, NextResponse } from "next/server";
import {
  getAdmins,
  getCustomers,
  createSession,
  SESSION_COOKIE,
} from "@/lib/auth";

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
      const user = admins.find(
        (a) => a.email === email && a.password === password
      );

      if (!user) {
        return NextResponse.json(
          { error: "Geçersiz email veya parola" },
          { status: 401 }
        );
      }

      const token = await createSession({
        userId: user.id,
        userType: "admin",
        userName: user.name,
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
      const user = customers.find(
        (c) => c.code === code && c.password === password
      );

      if (!user) {
        return NextResponse.json(
          { error: "Geçersiz müşteri kodu veya parola" },
          { status: 401 }
        );
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
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
