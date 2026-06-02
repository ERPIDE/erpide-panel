import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateOAuthState, googleAuthorizationUrl, googleOAuthEnabled } from "@/lib/auth/oauth";

export const runtime = "nodejs";

export async function GET() {
  if (!googleOAuthEnabled()) {
    return NextResponse.json({ error: "Google ile giriş henüz aktif değil" }, { status: 503 });
  }
  const session = await getSession();
  const state = generateOAuthState();
  session.oauthState = state;
  await session.save();
  return NextResponse.redirect(googleAuthorizationUrl(state));
}
