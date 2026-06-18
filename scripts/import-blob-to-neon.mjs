/**
 * One-shot importer: pull erpide-state.json off Vercel Blob (or a local copy)
 * and seed Neon Postgres. Safe to re-run — uses upsert.
 *
 * Env required:
 *   DATABASE_URL              Neon connection string
 *
 * Source priority:
 *   1. --file=<path>          read directly from a JSON file (best for the
 *                             rate-limited case: download via curl first)
 *   2. BLOB_READ_WRITE_TOKEN  derives the public store URL and fetches
 *                             https://<storeId>.public.blob.vercel-storage.com/erpide-state.json
 *
 * Usage:
 *   DATABASE_URL=... node scripts/import-blob-to-neon.mjs --file=./state.json
 *   DATABASE_URL=... BLOB_READ_WRITE_TOKEN=... node scripts/import-blob-to-neon.mjs
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const fileArg = process.argv.find((a) => a.startsWith("--file="));
const filePath = fileArg ? fileArg.slice("--file=".length) : null;

function deriveBlobUrl() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  const parts = token.split("_");
  if (parts.length < 4) return null;
  const storeId = parts[3].toLowerCase();
  return `https://${storeId}.public.blob.vercel-storage.com/erpide-state.json`;
}

async function loadState() {
  if (filePath) {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  }
  const url = deriveBlobUrl();
  if (!url) throw new Error("Pass --file=<path> or set BLOB_READ_WRITE_TOKEN");
  console.log(`[import] GET ${url}`);
  const res = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

function dateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaNeonHttp(url, {});
  const prisma = new PrismaClient({ adapter });

  console.log("[import] loading state…");
  const state = await loadState();
  if (!state || state.__version !== 1) throw new Error("State file is not version 1");

  const users = Object.values(state.users ?? {});
  const orders = Object.values(state.orders ?? {});
  const licenseCodes = Object.values(state.licenseCodes ?? {});
  const bankTransfers = Object.values(state.bankTransfers ?? {});

  console.log(
    `[import] found: ${users.length} users, ${orders.length} orders, ` +
    `${licenseCodes.length} license codes, ${bankTransfers.length} bank transfers`
  );

  // ----- USERS -----
  let userCount = 0;
  for (const u of users) {
    const data = {
      id: u.id,
      email: u.email.toLowerCase().trim(),
      name: u.name ?? "",
      surname: u.surname ?? "",
      passwordHash: u.passwordHash ?? "",
      emailVerified: !!u.emailVerified,
      verificationToken: u.verificationToken ?? null,
      verificationTokenExpiresAt: dateOrNull(u.verificationTokenExpiresAt),
      gsmNumber: u.gsmNumber ?? null,
      identityNumber: u.identityNumber ?? null,
      companyName: u.companyName ?? null,
      taxNumber: u.taxNumber ?? null,
      address: u.address ?? null,
      city: u.city ?? null,
      postalCode: u.postalCode ?? null,
      district: u.district ?? null,
      savedAddresses: u.savedAddresses ?? null,
      acceptedTermsAt: dateOrNull(u.acceptedTermsAt),
      acceptedKvkkAt: dateOrNull(u.acceptedKvkkAt),
      marketingConsentAt: dateOrNull(u.marketingConsentAt),
      oauthProvider: u.oauthProvider ?? null,
      oauthProviderId: u.oauthProviderId ?? null,
      avatarUrl: u.avatarUrl ?? null,
      iyzicoCardUserKey: u.iyzicoCardUserKey ?? null,
      iyzicoCardToken: u.iyzicoCardToken ?? null,
      iyzicoCardLastFour: u.iyzicoCardLastFour ?? null,
      iyzicoCardAssociation: u.iyzicoCardAssociation ?? null,
      iyzicoCardSavedAt: dateOrNull(u.iyzicoCardSavedAt),
      createdAt: dateOrNull(u.createdAt) ?? new Date(),
      updatedAt: dateOrNull(u.updatedAt) ?? new Date(),
    };
    await prisma.user.upsert({
      where: { id: u.id },
      create: data,
      update: data,
    });
    userCount++;
  }
  console.log(`[import] users: ${userCount}/${users.length}`);

  // ----- ORDERS -----
  let orderCount = 0;
  for (const o of orders) {
    const data = {
      id: o.id,
      userId: o.userId,
      items: o.items ?? [],
      totalPrice: o.totalPrice ?? 0,
      currency: o.currency ?? "TRY",
      paymentId: o.paymentId ?? null,
      conversationId: o.conversationId,
      status: o.status,
      iyzicoToken: o.iyzicoToken ?? null,
      isTrial: !!o.isTrial,
      trialExpiresAt: dateOrNull(o.trialExpiresAt),
      subscriptionExpiresAt: dateOrNull(o.subscriptionExpiresAt),
      billingCycle: o.billingCycle ?? null,
      autoRenewEnabled: o.autoRenewEnabled ?? null,
      lastRenewAttemptAt: dateOrNull(o.lastRenewAttemptAt),
      lastRenewError: o.lastRenewError ?? null,
      renewedFromOrderId: o.renewedFromOrderId ?? null,
      cancelledAt: dateOrNull(o.cancelledAt),
      cancelledBy: o.cancelledBy ?? null,
      cancellationReason: o.cancellationReason ?? null,
      expiringSoonEmailSentAt: dateOrNull(o.expiringSoonEmailSentAt),
      renewFailedEmailSentAt: dateOrNull(o.renewFailedEmailSentAt),
      creditsConsumed: o.creditsConsumed ?? null,
      createdAt: dateOrNull(o.createdAt) ?? new Date(),
      paidAt: dateOrNull(o.paidAt),
    };
    await prisma.order.upsert({
      where: { id: o.id },
      create: data,
      update: data,
    });
    orderCount++;
  }
  console.log(`[import] orders: ${orderCount}/${orders.length}`);

  // ----- LICENSE CODES -----
  let licenseCount = 0;
  for (const lc of licenseCodes) {
    const data = {
      code: lc.code,
      skuId: lc.skuId,
      productId: lc.productId,
      durationDays: lc.durationDays,
      batchId: lc.batchId ?? null,
      note: lc.note ?? null,
      createdAt: dateOrNull(lc.createdAt) ?? new Date(),
      expiresAt: dateOrNull(lc.expiresAt),
      redeemedBy: lc.redeemedBy ?? null,
      redeemedAt: dateOrNull(lc.redeemedAt),
      redeemedOrderId: lc.redeemedOrderId ?? null,
    };
    await prisma.licenseCode.upsert({
      where: { code: lc.code },
      create: data,
      update: data,
    });
    licenseCount++;
  }
  console.log(`[import] license codes: ${licenseCount}/${licenseCodes.length}`);

  // ----- BANK TRANSFERS -----
  let btCount = 0;
  for (const bt of bankTransfers) {
    const data = {
      code: bt.code,
      userId: bt.userId,
      userEmail: bt.userEmail,
      productId: bt.productId,
      skuIds: bt.skuIds ?? [],
      skuNames: bt.skuNames ?? null,
      amountUSD: bt.amountUSD,
      fxRate: bt.fxRate,
      fxRateDate: bt.fxRateDate,
      amountTRY: bt.amountTRY,
      ibanUsed: bt.ibanUsed,
      ibanHolder: bt.ibanHolder,
      status: bt.status,
      createdAt: dateOrNull(bt.createdAt) ?? new Date(),
      expiresAt: dateOrNull(bt.expiresAt) ?? new Date(),
      approvedBy: bt.approvedBy ?? null,
      approvedAt: dateOrNull(bt.approvedAt),
      rejectionReason: bt.rejectionReason ?? null,
      orderId: bt.orderId ?? null,
    };
    await prisma.bankTransferRequest.upsert({
      where: { code: bt.code },
      create: data,
      update: data,
    });
    btCount++;
  }
  console.log(`[import] bank transfers: ${btCount}/${bankTransfers.length}`);

  console.log("[import] done");
}

main()
  .catch((e) => {
    console.error("[import] FAILED:", e);
    process.exit(1);
  });
