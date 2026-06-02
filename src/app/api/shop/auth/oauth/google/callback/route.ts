import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { exchangeGoogleCode, fetchGoogleUserInfo, googleOAuthEnabled } from "@/lib/auth/oauth";
import { findUserByEmail, findUserByOAuth, updateUser } from "@/lib/auth/user-store";

export const runtime = "nodejs";

function errorRedirect(req: Request, msg: string) {
  const url = new URL("/giris", req.url);
  url.searchParams.set("error", msg);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  if (!googleOAuthEnabled()) return errorRedirect(req, "Google girişi yapılandırılmamış");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return errorRedirect(req, "Google geri dönüşü eksik parametre içeriyor");

  const session = await getSession();
  if (!session.oauthState || session.oauthState !== state) {
    return errorRedirect(req, "Güvenlik kontrolü başarısız (state mismatch)");
  }
  // Burn the state
  session.oauthState = undefined;
  await session.save();

  const tok = await exchangeGoogleCode(code);
  if ("error" in tok) return errorRedirect(req, "Google token alımı başarısız: " + tok.error);

  const info = await fetchGoogleUserInfo(tok.access_token);
  if ("error" in info) return errorRedirect(req, "Google kullanıcı bilgisi alınamadı: " + info.error);

  // 1) Already linked to this Google account → just log in
  const existingByOAuth = await findUserByOAuth("google", info.sub);
  if (existingByOAuth) {
    session.userId = existingByOAuth.id;
    session.email = existingByOAuth.email;
    session.name = `${existingByOAuth.name} ${existingByOAuth.surname}`;
    session.pendingOAuth = undefined;
    await session.save();
    return NextResponse.redirect(new URL("/hesabim", req.url));
  }

  // 2) Existing user with same email → auto-link
  const existingByEmail = await findUserByEmail(info.email);
  if (existingByEmail) {
    await updateUser(existingByEmail.id, {
      oauthProvider: "google",
      oauthProviderId: info.sub,
      avatarUrl: info.picture,
      emailVerified: existingByEmail.emailVerified || info.email_verified,
    });
    session.userId = existingByEmail.id;
    session.email = existingByEmail.email;
    session.name = `${existingByEmail.name} ${existingByEmail.surname}`;
    session.pendingOAuth = undefined;
    await session.save();
    return NextResponse.redirect(new URL("/hesabim", req.url));
  }

  // 3) New user → stash and redirect to /onay-ver for KVKK consent before creating
  session.pendingOAuth = {
    provider: "google",
    providerId: info.sub,
    email: info.email,
    firstName: info.given_name || info.name?.split(" ")[0] || "",
    lastName: info.family_name || info.name?.split(" ").slice(1).join(" ") || "",
    avatarUrl: info.picture,
    startedAt: new Date().toISOString(),
  };
  await session.save();
  return NextResponse.redirect(new URL("/onay-ver", req.url));
}
