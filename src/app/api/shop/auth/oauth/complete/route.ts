import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { createUser, findUserByEmail, updateUser } from "@/lib/auth/user-store";
import { hashPassword } from "@/lib/auth/passwords";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

const schema = z.object({
  acceptTerms: z.literal(true, { message: "Kullanım Koşulları ve Gizlilik Politikası onayı zorunludur" }),
  acceptKvkk: z.literal(true, { message: "KVKK Aydınlatma Metni onayı zorunludur" }),
  marketingConsent: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const pending = session.pendingOAuth;
    if (!pending) return NextResponse.json({ error: "Onaylanacak bir Google girişi yok. Tekrar deneyin." }, { status: 400 });

    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const now = new Date().toISOString();

    // E-posta zaten kayıtlıysa (cache miss veya kullanıcı parolayla önce
    // kaydolmuş): yeni kullanıcı yaratmak yerine MEVCUT'a Google'ı LINK et.
    // Bu adım createUser duplicate hatasını önler ve OAuth callback'in
    // auto-link adımının kaçırdığı durumu burada yakalar.
    const existing = await findUserByEmail(pending.email);
    let user;
    if (existing) {
      user = await updateUser(existing.id, {
        oauthProvider: pending.provider,
        oauthProviderId: pending.providerId,
        avatarUrl: pending.avatarUrl ?? existing.avatarUrl,
        emailVerified: true,
        // Consent onayları zaten varsa silme; yoksa şimdi yaz.
        acceptedTermsAt: existing.acceptedTermsAt ?? now,
        acceptedKvkkAt: existing.acceptedKvkkAt ?? now,
        marketingConsentAt: parsed.data.marketingConsent
          ? (existing.marketingConsentAt ?? now)
          : existing.marketingConsentAt,
      });
      if (!user) return NextResponse.json({ error: "Kullanıcı güncellenemedi" }, { status: 500 });
    } else {
      const placeholderPassword = randomBytes(24).toString("hex");
      const passwordHash = await hashPassword(placeholderPassword);
      user = await createUser({
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
    }

    session.userId = user.id;
    session.email = user.email;
    session.name = `${user.name} ${user.surname}`;
    session.pendingOAuth = undefined;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Beklenmeyen hata";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
