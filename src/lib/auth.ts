/**
 * Panel auth (admin + customer logins, session lookup).
 *
 * Previously each session was its own blob (`sessions/{token}.json`) and the
 * admin/customer lists were `data/admins.json` / `data/customers.json` on
 * Vercel Blob. Every login burned an Advanced Op, which hit the Hobby
 * quota and suspended the store. Storage moved to Neon (see prisma/schema)
 * keeping every exported function signature identical so callers don't care.
 */
import { Prisma } from "@prisma/client";
import { getPrisma } from "./db";
import {
  AdminUser,
  CustomerUser,
  initialAdmins,
  initialCustomers,
} from "./store";

// ── Session type ──────────────────────────────────────────────────

export interface Session {
  token: string;
  userId: string;
  userType: "admin" | "customer";
  userName: string;
  userEmail?: string;
  userRole?: string;
  customerCode?: string;
  createdAt: string;
  expiresAt: string;
}

/** Site sahibi (owner) — yedek email tabanlı check (audit log/owner-only edge case için).
 * Asıl RBAC role tabanlıdır: isElevated() ile kontrol edilir. */
export const OWNER_EMAIL = "admin@erpide.com";
export function isOwner(email?: string | null): boolean {
  return !!email && email.toLowerCase() === OWNER_EMAIL;
}

/** Yetkili (müdür-tipi) admin — role === "admin". Geliştirici (role: "developer")
 * adminler false döner; onlara Captcha/Ödemeler/Kullanıcılar/Destek Talepleri kapalı. */
export function isElevated(role?: string | null): boolean {
  return role === "admin";
}

/** API route guard: çağıran yetkili admin'se (role === "admin") session döner.
 * Geliştirici/developer adminler için null. Eski session'larda userEmail
 * olmayabilir — admin listesinden backfill yapılır. */
export async function getElevatedSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const session = await getSession(token);
  if (!session || session.userType !== "admin") return null;
  if (!isElevated(session.userRole)) return null;

  let email = session.userEmail;
  if (!email) {
    const admins = await getAdmins();
    email = admins.find((a) => a.id === session.userId)?.email;
  }
  return { ...session, userEmail: email };
}

/** Backward-compat alias — eski API'ler getOwnerSession import etmiş olabilir.
 * Aynı role-based gating; isOwner'a düşürmüyoruz. */
export const getOwnerSession = getElevatedSession;

export const SESSION_COOKIE = "erpide_session";
const SESSION_EXPIRY_DAYS = 7;

// ── Admin CRUD ────────────────────────────────────────────────────
// First request on a fresh DB seeds initialAdmins so the bootstrap login
// works without a separate migration step.

async function ensureAdminSeed(): Promise<void> {
  const prisma = getPrisma();
  const count = await prisma.admin.count();
  if (count === 0) {
    await prisma.admin.createMany({ data: initialAdmins });
  }
}

export async function getAdmins(): Promise<AdminUser[]> {
  await ensureAdminSeed();
  const rows = await getPrisma().admin.findMany();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    password: r.password,
    role: r.role as AdminUser["role"],
  }));
}

export async function saveAdmins(admins: AdminUser[]): Promise<void> {
  const prisma = getPrisma();
  // Full replace: existing API treats the list as a single document, so we
  // delete rows that disappeared and upsert the rest.
  const keepIds = new Set(admins.map((a) => a.id));
  await prisma.admin.deleteMany({ where: { id: { notIn: [...keepIds] } } });
  for (const a of admins) {
    await prisma.admin.upsert({
      where: { id: a.id },
      create: { id: a.id, name: a.name, email: a.email, password: a.password, role: a.role },
      update: { name: a.name, email: a.email, password: a.password, role: a.role },
    });
  }
}

// ── Customer CRUD ─────────────────────────────────────────────────

async function ensureCustomerSeed(): Promise<void> {
  const prisma = getPrisma();
  const count = await prisma.customer.count();
  if (count === 0) {
    await prisma.customer.createMany({ data: initialCustomers });
  }
}

export async function getCustomers(): Promise<CustomerUser[]> {
  await ensureCustomerSeed();
  const rows = await getPrisma().customer.findMany();
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    password: r.password,
    project: r.project,
    contactEmail: r.contactEmail,
    contactPhone: r.contactPhone ?? undefined,
  }));
}

export async function saveCustomers(customers: CustomerUser[]): Promise<void> {
  const prisma = getPrisma();
  const keepIds = new Set(customers.map((c) => c.id));
  await prisma.customer.deleteMany({ where: { id: { notIn: [...keepIds] } } });
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        code: c.code,
        name: c.name,
        password: c.password,
        project: c.project,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone ?? null,
      },
      update: {
        code: c.code,
        name: c.name,
        password: c.password,
        project: c.project,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone ?? null,
      },
    });
  }
}

// ── Session management ────────────────────────────────────────────

export async function createSession(data: {
  userId: string;
  userType: "admin" | "customer";
  userName: string;
  userEmail?: string;
  userRole?: string;
  customerCode?: string;
}): Promise<string> {
  const token = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await getPrisma().session.create({
    data: {
      token,
      userId: data.userId,
      userType: data.userType,
      userName: data.userName,
      userEmail: data.userEmail ?? null,
      userRole: data.userRole ?? null,
      customerCode: data.customerCode ?? null,
      createdAt: now,
      expiresAt,
    },
  });

  return token;
}

export async function getSession(token: string): Promise<Session | null> {
  const row = await getPrisma().session.findUnique({ where: { token } });
  if (!row) return null;
  if (row.expiresAt < new Date()) return null;

  return {
    token: row.token,
    userId: row.userId,
    userType: row.userType as Session["userType"],
    userName: row.userName,
    userEmail: row.userEmail ?? undefined,
    userRole: row.userRole ?? undefined,
    customerCode: row.customerCode ?? undefined,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

export async function deleteSession(token: string): Promise<void> {
  try {
    await getPrisma().session.delete({ where: { token } });
  } catch (e) {
    // P2025 = row not found; logout is idempotent.
    if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2025") {
      throw e;
    }
  }
}
