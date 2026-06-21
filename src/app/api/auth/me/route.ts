import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE, getAdmins } from "@/lib/auth";
import { resolvePermissions } from "@/lib/permissions";

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

    // Backfill userEmail + permissions: admin listesinden userId ile bul.
    const admins = session.userType === "admin" ? await getAdmins() : [];
    const adminRecord = admins.find((a) => a.id === session.userId);

    let userEmail = session.userEmail;
    if (!userEmail && adminRecord) userEmail = adminRecord.email;

    // Modül izinleri: DB'deki permissions + role bazlı defaults
    const permissions = session.userType === "admin"
      ? resolvePermissions(session.userRole, adminRecord?.permissions ?? null)
      : null;

    return NextResponse.json({
      userId: session.userId,
      userName: session.userName,
      userEmail,
      userType: session.userType,
      userRole: session.userRole,
      customerCode: session.customerCode,
      permissions,
    });
  } catch {
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
