import { NextRequest, NextResponse } from "next/server";
import { getSession, getAdmins, SESSION_COOKIE } from "@/lib/auth";

/** GET /api/tasks/assignees — task'a sorumlu atamak için admin/geliştirici listesi.
 *  Herhangi bir admin oturumu (developer dahil) erişebilir; ŞİFRE DÖNMEZ.
 *  Not: /api/users owner-only ve password hash döndüğü için burada onu kullanmıyoruz. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await getSession(token) : null;
  if (!session || session.userType !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const admins = await getAdmins();
  return NextResponse.json({
    assignees: admins.map((a) => ({ id: a.id, name: a.name, role: a.role })),
  });
}
