/**
 * Prisma client singleton. Backed by Neon over HTTP — one TCP connection per
 * query, no warm-pool to manage. Right shape for Vercel serverless functions.
 *
 * Lazy: client is only instantiated on first call. Modules can be imported
 * in environments where DATABASE_URL is unset (local dev with file fallback)
 * without crashing at import time.
 *
 * ⚠ NO TRANSACTIONS. The Neon HTTP driver runs one statement per request, so
 * anything Prisma wraps in a transaction fails at runtime with
 * "Transactions are not supported in HTTP mode":
 *
 *   - `$transaction([...])` — always. Split it into separate awaits and decide
 *     explicitly what happens if the second one fails.
 *   - `createMany()` with multiple rows — loop over single `create()` calls
 *     instead, catching P2002 if the write needs to be idempotent.
 *
 * `upsert()` is the subtle one. Prisma normally compiles it to a single native
 * `INSERT ... ON CONFLICT`, which is fine here — that is why the inflation,
 * pocket-sync and admin upserts work. But it falls back to a transaction when
 * it cannot build that statement, notably with an EMPTY `update: {}` block.
 * If you want "insert only if missing", do not write `update: {}` — use a
 * plain `create()` and swallow P2002.
 *
 * The failure mode is nasty: a caller with a try/catch fallback swallows the
 * error and the write silently never happens, while the page still renders
 * from the fallback and looks healthy. That is exactly how the social seed
 * shipped "green" once.
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
