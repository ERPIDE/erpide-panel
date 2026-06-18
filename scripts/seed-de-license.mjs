import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {});
const db = new PrismaClient({ adapter });

const KEY = "DE-ATMC-A001-K000-2606";
const existing = await db.dataEngineLicense.findUnique({ where: { key: KEY } });
if (existing) {
  console.log("already exists:", existing.key, "|", existing.customer);
} else {
  const r = await db.dataEngineLicense.create({
    data: {
      key: KEY,
      customer: "ATM Construction Kazakhstan",
      productId: "dataengine",
      expiresAt: new Date("2027-06-30T23:59:59Z"),
      active: true,
      note: "ATM ilk musteri (Win Server 1C02, tunnel via 192.168.60.42)",
      createdBy: "bootstrap",
    },
  });
  console.log("seed OK:", r.key, "|", r.customer);
}
await db.$disconnect();
