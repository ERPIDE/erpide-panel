/**
 * One-shot: Admin + Customer tablolarındaki plaintext şifreleri bcrypt'e
 * yükselt. Re-run safe — zaten hash'lenmiş kayıtları atlar.
 *
 * Login + profil + users CRUD'u runtime'da legacy plaintext'i de kabul
 * ediyor (looksHashed() ile ayırıyor), o yüzden bu migration'ı çalıştırmak
 * acil değil — ama elektrikli bir DB dump senaryosunda şifrelerin açık
 * görünmesini istemediğimiz için bir an önce çalıştırmak iyi olur.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/hash-admin-customer-passwords.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

function looksHashed(value) {
  if (!value) return false;
  return /^\$2[abxy]\$\d{2}\$/.test(value);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {});
  const prisma = new PrismaClient({ adapter });

  // ----- ADMINS -----
  const admins = await prisma.admin.findMany();
  let adminHashed = 0;
  let adminSkipped = 0;
  for (const a of admins) {
    if (looksHashed(a.password)) {
      adminSkipped++;
      continue;
    }
    const hashed = await bcrypt.hash(a.password, BCRYPT_ROUNDS);
    await prisma.admin.update({
      where: { id: a.id },
      data: { password: hashed },
    });
    adminHashed++;
  }
  console.log(`[hash] admins: ${adminHashed} hashed, ${adminSkipped} already-hashed`);

  // ----- CUSTOMERS -----
  const customers = await prisma.customer.findMany();
  let customerHashed = 0;
  let customerSkipped = 0;
  for (const c of customers) {
    if (looksHashed(c.password)) {
      customerSkipped++;
      continue;
    }
    const hashed = await bcrypt.hash(c.password, BCRYPT_ROUNDS);
    await prisma.customer.update({
      where: { id: c.id },
      data: { password: hashed },
    });
    customerHashed++;
  }
  console.log(`[hash] customers: ${customerHashed} hashed, ${customerSkipped} already-hashed`);

  console.log("[hash] done");
}

main().catch((e) => {
  console.error("[hash] FAILED:", e);
  process.exit(1);
});
