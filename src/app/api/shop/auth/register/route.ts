import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, findUserByEmail, updateUser } from "@/lib/auth/user-store";
import { hashPassword, validatePassword } from "@/lib/auth/passwords";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/auth/email-verification";

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
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const { name, surname, email, password } = parsed.data;

    const pwdError = validatePassword(password);
    if (pwdError) return NextResponse.json({ error: pwdError }, { status: 400 });

    const existing = await findUserByEmail(email);
    if (existing) return NextResponse.json({ error: "Bu e-mail ile zaten bir hesap var" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const { token, expiresAt } = generateVerificationToken();
    const user = await createUser({
      name,
      surname,
      email,
      passwordHash,
      emailVerified: false,
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
    });

    const emailRes = await sendVerificationEmail({ to: user.email, name: user.name, token });
    if (!emailRes.ok && !emailRes.skipped) {
      // Email send failed hard — log but still let user register. They can resend later.
      console.error("[register] verification email send failed:", emailRes.error);
    }

    // Do NOT auto-login. Force user to verify their email first.
    // Optionally bump updatedAt to record last verification send time.
    await updateUser(user.id, { updatedAt: new Date().toISOString() });

    return NextResponse.json({
      ok: true,
      pendingVerification: true,
      email: user.email,
      emailSendSkipped: emailRes.skipped === true,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
