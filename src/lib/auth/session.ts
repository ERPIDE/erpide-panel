import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface ShopSession {
  userId?: string;
  email?: string;
  name?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "DEV_ONLY_CHANGE_ME_AT_LEAST_32_CHARACTERS_LONG_PASSWORD",
  cookieName: process.env.SESSION_COOKIE_NAME || "erpide_session",
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
