import { randomBytes } from "crypto";

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://erpide.com";
}

export function googleOAuthEnabled(): boolean {
  return !!process.env.GOOGLE_OAUTH_CLIENT_ID && !!process.env.GOOGLE_OAUTH_CLIENT_SECRET;
}

export function googleAuthorizationUrl(state: string, redirectPath = "/api/shop/auth/oauth/google/callback"): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    redirect_uri: baseUrl() + redirectPath,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function generateOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export async function exchangeGoogleCode(code: string, redirectPath = "/api/shop/auth/oauth/google/callback"): Promise<{ access_token: string; id_token: string } | { error: string }> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    redirect_uri: baseUrl() + redirectPath,
    grant_type: "authorization_code",
  });
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[oauth] google token exchange failed:", data);
      return { error: data.error_description || data.error || "Token exchange failed" };
    }
    return { access_token: data.access_token, id_token: data.id_token };
  } catch (e) {
    console.error("[oauth] google token exchange threw:", e);
    return { error: String(e) };
  }
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | { error: string }> {
  try {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[oauth] google userinfo failed:", data);
      return { error: data.error || "Userinfo failed" };
    }
    if (!data.email) return { error: "Google returned no email" };
    return data as GoogleUserInfo;
  } catch (e) {
    console.error("[oauth] google userinfo threw:", e);
    return { error: String(e) };
  }
}
