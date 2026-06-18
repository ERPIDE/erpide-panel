import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { generateOAuthState, googleAuthorizationUrl, googleOAuthEnabled } from "@/lib/auth/oauth";
import { checkRateLimit, clientIp, rateLimitedResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!googleOAuthEnabled()) {
    return NextResponse.json({ error: "Google ile giriş henüz aktif değil" }, { status: 503 });
  }
  const limit = await checkRateLimit(
    { scope: "shop_oauth_google", windowSeconds: 60, maxAttempts: 15 },
    clientIp(req),
  );
  if (!limit.allowed) return rateLimitedResponse(limit.retryAfterSeconds);

  const session = await getSession();
  const state = generateOAuthState();
  session.oauthState = state;
  await session.save();
  return NextResponse.redirect(googleAuthorizationUrl(state));
}
