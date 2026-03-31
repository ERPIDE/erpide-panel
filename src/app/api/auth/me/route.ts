import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Oturum bulunamadı" },
        { status: 401 }
      );
    }

    const session = await getSession(token);

    if (!session) {
      return NextResponse.json(
        { error: "Oturum geçersiz veya süresi dolmuş" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      userId: session.userId,
      userName: session.userName,
      userType: session.userType,
      userRole: session.userRole,
      customerCode: session.customerCode,
    });
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
