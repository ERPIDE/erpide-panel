import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE, getAdmins } from "@/lib/auth";

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

    // Backfill userEmail: pre-RBAC session'larda userEmail yok — admin
    // listesinden userId ile bul ki mevcut adminlerin yeniden login olmasına
    // gerek kalmasın (isOwner check'i tutarlı çalışsın).
    let userEmail = session.userEmail;
    if (!userEmail && session.userType === "admin") {
      const admins = await getAdmins();
      userEmail = admins.find((a) => a.id === session.userId)?.email;
    }

    return NextResponse.json({
      userId: session.userId,
      userName: session.userName,
      userEmail,
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
