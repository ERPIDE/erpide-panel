import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface PendingOAuth {
  provider: "google" | "facebook" | "github";
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  startedAt: string;
}

export interface ShopSession {
  userId?: string;
  email?: string;
  name?: string;
  pendingOAuth?: PendingOAuth;
  oauthState?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "DEV_ONLY_CHANGE_ME_AT_LEAST_32_CHARACTERS_LONG_PASSWORD",
  // DİKKAT: "erpide_session" adı admin panel session'ına (src/lib/auth.ts
  // SESSION_COOKIE) aittir. Shop iron-session'ı aynı adı kullanınca iki sistem
  // birbirinin cookie'sini eziyordu → admin panelde rastgele login'e atma
  // (2026-07). Shop cookie'sinin adı farklı OLMAK ZORUNDA.
  cookieName: process.env.SESSION_COOKIE_NAME || "erpide_shop_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<ShopSession>(cookieStore, sessionOptions);
}

export async function requireUser() {
  const s = await getSession();
  return s.userId ? s : null;
}
