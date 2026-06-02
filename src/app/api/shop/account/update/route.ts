import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { updateUser, findUserById } from "@/lib/auth/user-store";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(50).optional(),
  surname: z.string().min(1).max(50).optional(),
  gsmNumber: z.string().max(30).optional(),
  identityNumber: z.string().max(11).optional(),
  companyName: z.string().max(120).optional(),
  taxNumber: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(60).optional(),
  district: z.string().max(60).optional(),
  postalCode: z.string().max(10).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });

  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const updated = await updateUser(user.id, parsed.data);
  return NextResponse.json({ ok: true, user: { id: updated!.id, email: updated!.email, name: updated!.name } });
}
