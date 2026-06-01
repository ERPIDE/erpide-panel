import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, findUserByEmail } from "@/lib/auth/user-store";
import { hashPassword, validatePassword } from "@/lib/auth/passwords";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(50),
  surname: z.string().min(1).max(50),
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, surname, email, password } = parsed.data;

    const pwdError = validatePassword(password);
    if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });

    const existing = await findUserByEmail(email);
    if (existing) return NextResponse.json({ error: "Bu e-mail ile zaten bir hesap var" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const user = await createUser({ name, surname, email, passwordHash });

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
