import { NextRequest, NextResponse } from "next/server";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

/** GET — tüm DataEngine lisanslarını listele (sadece elevated admin). */
export async function GET(req: NextRequest) {
  const session = await getElevatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getPrisma();
  const rows = await db.dataEngineLicense.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ licenses: rows });
}
