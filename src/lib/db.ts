/**
 * Prisma client singleton. Backed by Neon over HTTP — one TCP connection per
 * query, no warm-pool to manage. Right shape for Vercel serverless functions.
 *
 * Lazy: client is only instantiated on first call. Modules can be imported
 * in environments where DATABASE_URL is unset (local dev with file fallback)
 * without crashing at import time.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

declare global {
  // Hot reload in dev recreates modules; reuse the same client to avoid
  // leaking Neon connections.
  // eslint-disable-next-line no-var
  var __erpidePrisma: PrismaClient | undefined;
}

export const HAS_DB = !!process.env.DATABASE_URL;

export function getPrisma(): PrismaClient {
  if (global.__erpidePrisma) return global.__erpidePrisma;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("[db] DATABASE_URL is not set");
  const adapter = new PrismaNeonHttp(url, {});
  const client = new PrismaClient({ adapter });
  global.__erpidePrisma = client;
  return client;
}
