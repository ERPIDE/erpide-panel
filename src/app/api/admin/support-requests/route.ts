import { NextRequest, NextResponse } from "next/server";
import { getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { listSupportRequests, setStatus } from "@/lib/support-requests";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await getElevatedSession(token);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const items = await listSupportRequests();
  return NextResponse.json({ items });
}

/** PATCH /api/admin/support-requests — body { id, status }
 * Talebi resolved/open olarak işaretle. */
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await getElevatedSession(token);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: { id?: string; status?: "open" | "resolved" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id || (body.status !== "open" && body.status !== "resolved")) {
    return NextResponse.json({ error: "invalid_args" }, { status: 400 });
  }

  const ok = await setStatus(body.id, body.status);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
