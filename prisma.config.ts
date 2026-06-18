import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 split URL config out of schema.prisma. This file is read by the
// Prisma CLI (migrate, db push, generate) at the project root. The runtime
// client wires Neon's HTTP driver adapter (see src/lib/db.ts) — migrations
// run via standard Postgres so we don't need an adapter here.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
