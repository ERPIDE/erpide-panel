/**
 * GET /api/admin/altyapi/stats
 * Neon DB kullanımı, model sayıları, Resend domain durumu.
 * Vercel bant/build ve Neon compute-hour external API key
 * gerektirdiğinden static limit olarak döner.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const session = await getSession(token);
  if (!session || session.userType !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();

  // ── Neon DB boyutu (raw SQL) ───────────────────────────────────
  let dbSizeMB = 0;
  let tableCounts: { table: string; rows: number }[] = [];
  try {
    const sizeRes = await prisma.$queryRaw<[{ db_size: bigint }]>`
      SELECT pg_database_size(current_database()) as db_size
    `;
    dbSizeMB = Math.round(Number(sizeRes[0]?.db_size ?? 0) / 1024 / 1024 * 10) / 10;

    const tablesRes = await prisma.$queryRaw<{ relname: string; n_live_tup: bigint }[]>`
      SELECT relname, n_live_tup
      FROM pg_stat_user_tables
      WHERE n_live_tup > 0
      ORDER BY n_live_tup DESC
      LIMIT 15
    `;
    tableCounts = tablesRes.map((r) => ({ table: r.relname, rows: Number(r.n_live_tup) }));
  } catch { /* ignore */ }

  // ── Model satır sayıları ───────────────────────────────────────
  const settled = await Promise.allSettled([
    prisma.user.count(),
    prisma.session.count(),
    prisma.order.count(),
    prisma.ticket.count(),
    prisma.supportRequest.count(),
    prisma.pocketToken.count(),
    prisma.dataEngineLicense.count(),
    prisma.licenseCode.count(),
    prisma.customer.count(),
    prisma.admin.count(),
  ]);
  const v = (i: number) => (settled[i].status === "fulfilled" ? (settled[i] as PromiseFulfilledResult<number>).value : 0);
  const counts = {
    users: v(0), sessions: v(1), orders: v(2), tickets: v(3),
    supportRequests: v(4), pocketTokens: v(5), dataEngineLicenses: v(6),
    licenseCodes: v(7), customers: v(8), admins: v(9),
  };

  // ── Resend domain listesi ──────────────────────────────────────
  let resendDomains: { name: string; status: string; region: string }[] = [];
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    if (res.ok) {
      const data = await res.json() as { data: { name: string; status: string; region: string }[] };
      resendDomains = (data.data || []).map((d) => ({
        name: d.name, status: d.status, region: d.region,
      }));
    }
  } catch { /* ignore */ }

  return NextResponse.json({
    db: {
      sizeMB: dbSizeMB,
      limitMB: 512,
      usagePct: Math.min(Math.round(dbSizeMB / 512 * 100), 100),
      tableCounts,
      counts,
    },
    packages: {
      vercel:     { plan: "Hobby",   monthlyCostUSD: 0,  bandwidthGB: 100, buildMinutes: 6000, serverlessMB: 50 },
      neon:       { plan: "Free",    monthlyCostUSD: 0,  storageMB: 512,   computeHours: 191.9 },
      resend:     { plan: "Free",    monthlyCostUSD: 0,  emailsPerMonth: 3000, emailsPerDay: 100, domains: resendDomains },
      cloudflare: { plan: "Free",    monthlyCostUSD: 0 },
      winServer:  { plan: "Şirket", monthlyCostUSD: 0 },
    },
    upgrades: {
      vercel: { plan: "Pro",    priceUSD: 20, trigger: "Ekip erişimi veya >100GB bant" },
      neon:   { plan: "Launch", priceUSD: 19, trigger: ">512MB depolama veya >191.9h compute" },
      resend: { plan: "Pro",    priceUSD: 20, trigger: ">3.000 email/ay", newLimit: "50.000 email/ay" },
    },
    usdTry: 38,
  });
}
