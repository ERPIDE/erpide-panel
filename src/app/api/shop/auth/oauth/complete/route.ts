import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { createUser } from "@/lib/auth/user-store";
import { hashPassword } from "@/lib/auth/passwords";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

const schema = z.object({
  acceptTerms: z.literal(true, { message: "Kullanım Koşulları ve Gizlilik Politikası onayı zorunludur" }),
  acceptKvkk: z.literal(true, { message: "KVKK Aydınlatma Metni onayı zorunludur" }),
  marketingConsent: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  const pending = session.pendingOAuth;
  if (!pending) return NextResponse.json({ error: "Onaylanacak bir Google girişi yok. Tekrar deneyin." }, { status: 400 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  // Generate a random unguessable password — user can switch to password
  // login later by using "Şifremi unuttum" once that flow is added.
  const placeholderPassword = randomBytes(24).toString("hex");
  const passwordHash = await hashPassword(placeholderPassword);

  const now = new Date().toISOString();
  const user = await createUser({
    name: pending.firstName || "Kullanıcı",
    surname: pending.lastName || "",
    email: pending.email,
    passwordHash,
    emailVerified: true,
    oauthProvider: pending.provider,
    oauthProviderId: pending.providerId,
    avatarUrl: pending.avatarUrl,
    acceptedTermsAt: now,
    acceptedKvkkAt: now,
    marketingConsentAt: parsed.data.marketingConsent ? now : undefined,
  });

  session.userId = user.id;
  session.email = user.email;
  session.name = `${user.name} ${user.surname}`;
  session.pendingOAuth = undefined;
  await session.save();

  return NextResponse.json({ ok: true });
}
