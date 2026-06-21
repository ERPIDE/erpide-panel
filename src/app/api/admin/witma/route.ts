/**
 * GET /api/admin/witma
 * WITMA Supabase verilerini service key ile çeker — anon key RLS'i atlatır.
 * Sadece authenticated admin erişebilir.
 *
 * Env:
 *   WITMA_SUPABASE_SERVICE_KEY — Supabase Project Settings → API → service_role
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const SB_URL = "https://gynooxlltoohalbxbhrw.supabase.co";

function makeHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "count=exact",
  };
}

async function sbCount(key: string, table: string, filter = ""): Promise<number | null> {
  try {
    const url = `${SB_URL}/rest/v1/${table}?select=*${filter ? `&${filter}` : ""}&limit=0`;
    const res = await fetch(url, { headers: makeHeaders(key) });
    if (!res.ok) return null;
    const range = res.headers.get("Content-Range");
    const m = range?.match(/\/(\d+)$/);
    return m ? parseInt(m[1]) : null;
  } catch {
    return null;
  }
}

async function sbRows(key: string, table: string, select: string, extra = "", limit = 100): Promise<unknown[]> {
  try {
    const url = `${SB_URL}/rest/v1/${table}?select=${select}${extra ? `&${extra}` : ""}&limit=${limit}&order=created_at.desc`;
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function GET() {
  // Auth check — panel oturumu zorunlu
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const serviceKey = process.env.WITMA_SUPABASE_SERVICE_KEY;
  // Service key yoksa anon key ile düşük yetkili veriyi dön
  const anonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bm9veGxsdG9vaGFsYnhiaHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTkyNTMsImV4cCI6MjA5NjY3NTI1M30.Ff_zfpVkSa5sJDTp4tD6TvId1YY3R__xxXSDvAuxs2k";
  const key = serviceKey || anonKey;
  const hasServiceKey = !!serviceKey;

  const now = new Date();
  const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const [
    totalUsers,
    onlineNow,
    todayMsgs,
    todayCalls,
    todayOpens,
    premiumUsers,
    profiles,
    events,
  ] = await Promise.all([
    sbCount(key, "profiles"),
    sbCount(key, "ops_presence", `last_seen=gte.${fiveMinAgo}`),
    sbCount(key, "messages", `created_at=gte.${todayISO}`),
    sbCount(key, "ops_events", `event=eq.call_start&created_at=gte.${todayISO}`),
    sbCount(key, "ops_events", `event=eq.user_open&created_at=gte.${todayISO}`),
    sbCount(key, "profiles", "plan=eq.premium"),
    sbRows(key, "profiles", "phone,name,plan,plan_expires_at,updated_at", "", 200),
    sbRows(key, "ops_events", "id,event,user_id,meta,created_at", "", 100),
  ]);

  return NextResponse.json({
    hasServiceKey,
    totalUsers,
    onlineNow,
    todayMsgs,
    todayCalls,
    todayOpens,
    premiumUsers,
    profiles,
    events,
  });
}
