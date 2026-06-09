/**
 * POST /api/pocket/auth/login
 *
 * Body: { email, password, label? }
 * Mobile uygulama login formundan çağrılır → pkt_xxx token döner.
 * Token, header'da Authorization: Bearer <token> ile sync endpoint'lerinde kullanılır.
 *
 * License kontrolü burada değil — sync sırasında. Login sadece "ben buyum" der.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail } from "@/lib/auth/user-store";
import { verifyPassword } from "@/lib/auth/passwords";
import { issueToken } from "@/lib/pocket-store";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  label: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz e-mail veya şifre" }, { status: 400 });
    }

    const user = await findUserByEmail(parsed.data.email);
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "E-mail veya şifre hatalı" }, { status: 401 });
    }

    if (user.emailVerified === false) {
      return NextResponse.json(
        { error: "E-posta doğrulanmamış. Web'den doğrulayın." },
        { status: 403 }
      );
    }

    const token = await issueToken(user.id, parsed.data.label || "mobile");

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
