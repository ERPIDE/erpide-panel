import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail } from "@/lib/auth/user-store";
import { verifyPassword } from "@/lib/auth/passwords";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit, clientIp, rateLimitedResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const limit = await checkRateLimit(
      { scope: "shop_login", windowSeconds: 60, maxAttempts: 8 },
      clientIp(req),
    );
    if (!limit.allowed) return rateLimitedResponse(limit.retryAfterSeconds);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Geçersiz e-mail veya şifre" }, { status: 400 });

    const user = await findUserByEmail(parsed.data.email);
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "E-mail veya şifre hatalı" }, { status: 401 });
    }

    if (user.emailVerified === false) {
      return NextResponse.json(
        {
          error: "E-posta adresinizi henüz doğrulamadınız. Mailinize gönderilen bağlantıya tıklayın.",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = `${user.name} ${user.surname}`;
    await session.save();

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
