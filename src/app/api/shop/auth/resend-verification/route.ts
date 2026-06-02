import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, updateUser } from "@/lib/auth/user-store";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/auth/email-verification";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

// Simple in-memory rate limit: max 3 sends per email per hour
// (Sufficient as long as filesystem-backed store is the only persistence; revisit when DB-backed.)
const sendLog = new Map<string, number[]>();
function shouldRateLimit(email: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const list = (sendLog.get(email) || []).filter((t) => t > hourAgo);
  if (list.length >= 3) return true;
  list.push(now);
  sendLog.set(email, list);
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Geçerli bir e-mail girin" }, { status: 400 });

    const email = parsed.data.email.toLowerCase().trim();
    if (shouldRateLimit(email)) {
      return NextResponse.json({ error: "Çok fazla istek. 1 saat sonra tekrar deneyin." }, { status: 429 });
    }

    const user = await findUserByEmail(email);
    // Generic OK regardless of whether the user exists — avoid email enumeration.
    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true, generic: true });
    }

    const { token, expiresAt } = generateVerificationToken();
    await updateUser(user.id, { verificationToken: token, verificationTokenExpiresAt: expiresAt });
    await sendVerificationEmail({ to: user.email, name: user.name, token });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
