import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { put, list } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import { getPrisma, HAS_DB } from "../db";

export type CustomerType = "individual" | "corporate";

export interface SavedAddress {
  id: string;
  label: string;
  type: CustomerType;

  firstName: string;
  lastName: string;
  phone: string;

  identityNumber?: string;

  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
  eInvoiceUser?: boolean;

  country: string;
  city: string;
  district: string;
  neighborhood?: string;
  postalCode?: string;
  fullAddress: string;

  isBillingDefault?: boolean;
  isShippingDefault?: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  surname: string;
  passwordHash: string;
  emailVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: string;
  gsmNumber?: string;
  identityNumber?: string;
  companyName?: string;
  taxNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  district?: string;
  savedAddresses?: SavedAddress[];
  acceptedTermsAt?: string;
  acceptedKvkkAt?: string;
  marketingConsentAt?: string;
  oauthProvider?: "google" | "facebook" | "github";
  oauthProviderId?: string;
  avatarUrl?: string;

  // iyzico saved-card vault. Set when the customer ticks "kartımı kaydet" on
  // checkout. cardUserKey is the customer pointer in iyzico's vault, cardToken
  // is the specific card. The masked PAN bits below are display-only.
  iyzicoCardUserKey?: string;
  iyzicoCardToken?: string;
  iyzicoCardLastFour?: string;
  iyzicoCardAssociation?: string; // VISA, MASTER_CARD
  iyzicoCardSavedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  skuId: string;
  productId: string;
  productName: string;
  skuName: string;
  price: number;
  licenseKey: string;

  // Cross-system provision: filled when the product backend (e.g.
  // captcha.erpide.com) mints the customer's runtime credentials.
  apiKey?: string;
  apiKeyId?: string;
  apiBaseUrl?: string;
  dashboardUrl?: string;
  // Backend identifiers so we can later revoke or extend.
  backendUserId?: string;
  backendLicenseId?: string;
  maxSolvesPerDay?: number;
}

export interface OrderRecord {
  id: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  currency: "TRY" | "USD" | "EUR" | "GBP";
  paymentId?: string;
  conversationId: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "TRIAL" | "EXPIRED";
  iyzicoToken?: string;
  isTrial?: boolean;
  trialExpiresAt?: string;

  // Paid subscription cycle: when this subscription period ends. After this
  // date the backend License is no longer valid and API calls 403 — unless
  // auto-renewal fires and creates a new follow-on order.
  subscriptionExpiresAt?: string;
  billingCycle?: "monthly" | "yearly";
  autoRenewEnabled?: boolean;
  // When the auto-renew cron last attempted to charge this order. Used to
  // dedupe — the cron should retry once a day after a failure, not every
  // minute.
  lastRenewAttemptAt?: string;
  lastRenewError?: string;
  // If this order was created by an auto-renewal, the parent order id.
  renewedFromOrderId?: string;

  // Cancellation — kullanıcı (veya admin) abonelği iptal ettiğinde set edilir.
  // status hala "PAID" kalır subscriptionExpiresAt'a kadar; cron renewal'i atlar.
  // Süre dolunca status="EXPIRED" olur, license inactive olur, FinansERPIDE cache
  // invalidate edilir.
  cancelledAt?: string;
  cancelledBy?: "USER" | "ADMIN" | "PAYMENT_FAILED";
  cancellationReason?: string;
  // Kullanıcıya bitiyor uyarısı en son ne zaman gönderildi. 7 gün önce 1 kez,
  // 1 gün önce 1 kez ata; idempotency için bu alana yaz.
  expiringSoonEmailSentAt?: string;
  // Renewal başarısız email tarihi — aynı failure için spam atmamak için.
  renewFailedEmailSentAt?: string;

  // AI Kontör paketleri için (kind="credit" SKU içerenler). FE her mesaj
  // sonrası /api/internal/credits-consume çağırır; ilk havuzu dolu olan
  // order'dan düşer. creditsConsumed > sku.creditsGranted toplamına ulaşırsa
  // havuz biter.
  creditsConsumed?: number;

  createdAt: string;
  paidAt?: string;
}

/**
 * Aktivasyon kodları — admin/seri üretilir, kullanıcı /hesabim ekranında
 * girer. Karşılığında yeni PAID order yaratılır (durationDays kadar geçerli).
 * Hepsiburada/N11 gibi pazaryerlerinde e-pin olarak satılabilir.
 */
export interface LicenseCodeRecord {
  code: string; // ERP-XXXX-XXXX-XXXX format (büyük harf, tire ayırıcı)
  skuId: string;
  productId: string;
  durationDays: number; // genelde 30, yıllık için 365
  batchId?: string;     // toplu üretim grubu (opsiyonel takip)
  note?: string;        // ne için üretildiği (örn "Hepsiburada Q3 2026")
  createdAt: string;
  expiresAt?: string;   // kodun KENDİSİNİN kullanım son tarihi (geç gelen e-pin)
  redeemedBy?: string;  // userId
  redeemedAt?: string;
  redeemedOrderId?: string;
}

/**
 * Havale ödeme isteği — kullanıcı checkout'ta "Havale" seçerse oluşur.
 * Unique kod (HAV-XXXXXXXX) üretilir, kullanıcı IBAN'a transfer yaparken
 * açıklamaya bu kodu yazar. Admin /admin/odemeler ekranından gelen havaleyi
 * "Onayla" basınca order PAID'e geçer + lisans aktif olur.
 */
export interface BankTransferRequest {
  code: string;         // HAV-XXXXXXXX format
  userId: string;
  userEmail: string;
  productId: string;
  skuIds: string[];     // tek istek birden fazla SKU içerebilir (sepet)
  skuNames?: string[];  // human-readable kayıt
  amountUSD: number;    // sepet toplamı USD
  fxRate: number;       // o ankü TCMB USD/TRY satış kuru
  fxRateDate: string;   // YYYY-MM-DD
  amountTRY: number;    // round-down (4307→4300)
  ibanUsed: string;     // hangi IBAN'a gönderileceği
  ibanHolder: string;   // hesap sahibi adı
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;     // varsayılan 7 gün
  approvedBy?: string;   // admin email
  approvedAt?: string;
  rejectionReason?: string;
  orderId?: string;      // approve sonrası yaratılan order
}

// ============== JSON FALLBACK (local dev / preview without DB) ==============
//
// When DATABASE_URL is not set we keep the legacy single-JSON path so local
// `npm run dev` keeps working unchanged. The Blob path is retained too in
// case anyone wants to run against the existing blob during transition —
// not recommended given the rate-limit incident.

interface State {
  users: Record<string, UserRecord>;
  orders: Record<string, OrderRecord>;
  licenseCodes?: Record<string, LicenseCodeRecord>;
  bankTransfers?: Record<string, BankTransferRequest>;
  __version: 1;
}

const STATE_KEY = "erpide-state.json";
const CACHE_TTL_MS = 3000;
const USE_BLOB = !HAS_DB && !!process.env.BLOB_READ_WRITE_TOKEN;

const STORAGE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".erpide-data");
const STATE_FILE = path.join(STORAGE_DIR, STATE_KEY);

let cache: State | null = null;
let cacheLoadedAt = 0;

function emptyState(): State {
  return { users: {}, orders: {}, __version: 1 };
}

async function findBlobUrl(): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: STATE_KEY });
    const found = blobs.find((b) => b.pathname === STATE_KEY);
    return found?.url ?? null;
  } catch (e) {
    console.error("[user-store] blob list failed:", e);
    return null;
  }
}

async function loadFromBlob(): Promise<State> {
  const url = await findBlobUrl();
  if (!url) return emptyState();
  try {
    const res = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return emptyState();
    const data = await res.json();
    if (data && typeof data === "object" && data.__version === 1) return data as State;
    return emptyState();
  } catch (e) {
    console.error("[user-store] blob fetch failed:", e);
    return emptyState();
  }
}

async function loadFromFile(): Promise<State> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && data.__version === 1) return data as State;
    return emptyState();
  } catch {
    return emptyState();
  }
}

async function loadState(forceFresh = false): Promise<State> {
  const now = Date.now();
  if (!forceFresh && cache && now - cacheLoadedAt < CACHE_TTL_MS) return cache;
  cache = USE_BLOB ? await loadFromBlob() : await loadFromFile();
  cacheLoadedAt = now;
  return cache;
}

async function saveState(state: State): Promise<void> {
  state.__version = 1;
  cache = state;
  cacheLoadedAt = Date.now();
  if (USE_BLOB) {
    try {
      await put(STATE_KEY, JSON.stringify(state), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
    } catch (e) {
      console.error("[user-store] blob put failed:", e);
      throw e;
    }
  } else {
    try { await fs.mkdir(STORAGE_DIR, { recursive: true }); } catch {}
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  }
}

// ============== PRISMA <-> TS RECORD MAPPERS ==============
//
// Prisma returns Date objects + null; the legacy record types are ISO strings
// + undefined. These mappers keep the boundary clean so callers see the same
// shape they always have.

type AnyRow = Record<string, unknown>;

function iso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

function dateOrNull(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function rowToUser(row: AnyRow): UserRecord {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    surname: row.surname as string,
    passwordHash: row.passwordHash as string,
    emailVerified: (row.emailVerified as boolean) || undefined,
    verificationToken: (row.verificationToken as string) || undefined,
    verificationTokenExpiresAt: iso(row.verificationTokenExpiresAt),
    gsmNumber: (row.gsmNumber as string) || undefined,
    identityNumber: (row.identityNumber as string) || undefined,
    companyName: (row.companyName as string) || undefined,
    taxNumber: (row.taxNumber as string) || undefined,
    address: (row.address as string) || undefined,
    city: (row.city as string) || undefined,
    postalCode: (row.postalCode as string) || undefined,
    district: (row.district as string) || undefined,
    savedAddresses: (row.savedAddresses as SavedAddress[]) ?? undefined,
    acceptedTermsAt: iso(row.acceptedTermsAt),
    acceptedKvkkAt: iso(row.acceptedKvkkAt),
    marketingConsentAt: iso(row.marketingConsentAt),
    oauthProvider: (row.oauthProvider as UserRecord["oauthProvider"]) || undefined,
    oauthProviderId: (row.oauthProviderId as string) || undefined,
    avatarUrl: (row.avatarUrl as string) || undefined,
    iyzicoCardUserKey: (row.iyzicoCardUserKey as string) || undefined,
    iyzicoCardToken: (row.iyzicoCardToken as string) || undefined,
    iyzicoCardLastFour: (row.iyzicoCardLastFour as string) || undefined,
    iyzicoCardAssociation: (row.iyzicoCardAssociation as string) || undefined,
    iyzicoCardSavedAt: iso(row.iyzicoCardSavedAt),
    createdAt: iso(row.createdAt) || new Date().toISOString(),
    updatedAt: iso(row.updatedAt) || new Date().toISOString(),
  };
}

function userToPrisma(rec: Partial<UserRecord>): AnyRow {
  // Only includes keys the caller set (so Prisma update doesn't null out
  // fields by accident).
  const out: AnyRow = {};
  if (rec.email !== undefined) out.email = rec.email;
  if (rec.name !== undefined) out.name = rec.name;
  if (rec.surname !== undefined) out.surname = rec.surname;
  if (rec.passwordHash !== undefined) out.passwordHash = rec.passwordHash;
  if (rec.emailVerified !== undefined) out.emailVerified = rec.emailVerified;
  if (rec.verificationToken !== undefined) out.verificationToken = rec.verificationToken || null;
  if (rec.verificationTokenExpiresAt !== undefined) out.verificationTokenExpiresAt = dateOrNull(rec.verificationTokenExpiresAt);
  if (rec.gsmNumber !== undefined) out.gsmNumber = rec.gsmNumber || null;
  if (rec.identityNumber !== undefined) out.identityNumber = rec.identityNumber || null;
  if (rec.companyName !== undefined) out.companyName = rec.companyName || null;
  if (rec.taxNumber !== undefined) out.taxNumber = rec.taxNumber || null;
  if (rec.address !== undefined) out.address = rec.address || null;
  if (rec.city !== undefined) out.city = rec.city || null;
  if (rec.postalCode !== undefined) out.postalCode = rec.postalCode || null;
  if (rec.district !== undefined) out.district = rec.district || null;
  if (rec.savedAddresses !== undefined) out.savedAddresses = rec.savedAddresses ?? null;
  if (rec.acceptedTermsAt !== undefined) out.acceptedTermsAt = dateOrNull(rec.acceptedTermsAt);
  if (rec.acceptedKvkkAt !== undefined) out.acceptedKvkkAt = dateOrNull(rec.acceptedKvkkAt);
  if (rec.marketingConsentAt !== undefined) out.marketingConsentAt = dateOrNull(rec.marketingConsentAt);
  if (rec.oauthProvider !== undefined) out.oauthProvider = rec.oauthProvider || null;
  if (rec.oauthProviderId !== undefined) out.oauthProviderId = rec.oauthProviderId || null;
  if (rec.avatarUrl !== undefined) out.avatarUrl = rec.avatarUrl || null;
  if (rec.iyzicoCardUserKey !== undefined) out.iyzicoCardUserKey = rec.iyzicoCardUserKey || null;
  if (rec.iyzicoCardToken !== undefined) out.iyzicoCardToken = rec.iyzicoCardToken || null;
  if (rec.iyzicoCardLastFour !== undefined) out.iyzicoCardLastFour = rec.iyzicoCardLastFour || null;
  if (rec.iyzicoCardAssociation !== undefined) out.iyzicoCardAssociation = rec.iyzicoCardAssociation || null;
  if (rec.iyzicoCardSavedAt !== undefined) out.iyzicoCardSavedAt = dateOrNull(rec.iyzicoCardSavedAt);
  return out;
}

function rowToOrder(row: AnyRow): OrderRecord {
  return {
    id: row.id as string,
    userId: row.userId as string,
    items: (row.items as OrderItem[]) ?? [],
    totalPrice: row.totalPrice as number,
    currency: row.currency as OrderRecord["currency"],
    paymentId: (row.paymentId as string) || undefined,
    conversationId: row.conversationId as string,
    status: row.status as OrderRecord["status"],
    iyzicoToken: (row.iyzicoToken as string) || undefined,
    isTrial: (row.isTrial as boolean) || undefined,
    trialExpiresAt: iso(row.trialExpiresAt),
    subscriptionExpiresAt: iso(row.subscriptionExpiresAt),
    billingCycle: (row.billingCycle as OrderRecord["billingCycle"]) || undefined,
    autoRenewEnabled: (row.autoRenewEnabled as boolean) ?? undefined,
    lastRenewAttemptAt: iso(row.lastRenewAttemptAt),
    lastRenewError: (row.lastRenewError as string) || undefined,
    renewedFromOrderId: (row.renewedFromOrderId as string) || undefined,
    cancelledAt: iso(row.cancelledAt),
    cancelledBy: (row.cancelledBy as OrderRecord["cancelledBy"]) || undefined,
    cancellationReason: (row.cancellationReason as string) || undefined,
    expiringSoonEmailSentAt: iso(row.expiringSoonEmailSentAt),
    renewFailedEmailSentAt: iso(row.renewFailedEmailSentAt),
    creditsConsumed: (row.creditsConsumed as number) ?? undefined,
    createdAt: iso(row.createdAt) || new Date().toISOString(),
    paidAt: iso(row.paidAt),
  };
}

function orderToPrisma(rec: Partial<OrderRecord>): AnyRow {
  const out: AnyRow = {};
  if (rec.userId !== undefined) out.userId = rec.userId;
  if (rec.items !== undefined) out.items = rec.items;
  if (rec.totalPrice !== undefined) out.totalPrice = rec.totalPrice;
  if (rec.currency !== undefined) out.currency = rec.currency;
  if (rec.paymentId !== undefined) out.paymentId = rec.paymentId || null;
  if (rec.conversationId !== undefined) out.conversationId = rec.conversationId;
  if (rec.status !== undefined) out.status = rec.status;
  if (rec.iyzicoToken !== undefined) out.iyzicoToken = rec.iyzicoToken || null;
  if (rec.isTrial !== undefined) out.isTrial = !!rec.isTrial;
  if (rec.trialExpiresAt !== undefined) out.trialExpiresAt = dateOrNull(rec.trialExpiresAt);
  if (rec.subscriptionExpiresAt !== undefined) out.subscriptionExpiresAt = dateOrNull(rec.subscriptionExpiresAt);
  if (rec.billingCycle !== undefined) out.billingCycle = rec.billingCycle || null;
  if (rec.autoRenewEnabled !== undefined) out.autoRenewEnabled = rec.autoRenewEnabled ?? null;
  if (rec.lastRenewAttemptAt !== undefined) out.lastRenewAttemptAt = dateOrNull(rec.lastRenewAttemptAt);
  if (rec.lastRenewError !== undefined) out.lastRenewError = rec.lastRenewError || null;
  if (rec.renewedFromOrderId !== undefined) out.renewedFromOrderId = rec.renewedFromOrderId || null;
  if (rec.cancelledAt !== undefined) out.cancelledAt = dateOrNull(rec.cancelledAt);
  if (rec.cancelledBy !== undefined) out.cancelledBy = rec.cancelledBy || null;
  if (rec.cancellationReason !== undefined) out.cancellationReason = rec.cancellationReason || null;
  if (rec.expiringSoonEmailSentAt !== undefined) out.expiringSoonEmailSentAt = dateOrNull(rec.expiringSoonEmailSentAt);
  if (rec.renewFailedEmailSentAt !== undefined) out.renewFailedEmailSentAt = dateOrNull(rec.renewFailedEmailSentAt);
  if (rec.creditsConsumed !== undefined) out.creditsConsumed = rec.creditsConsumed ?? null;
  if (rec.paidAt !== undefined) out.paidAt = dateOrNull(rec.paidAt);
  return out;
}

function rowToLicenseCode(row: AnyRow): LicenseCodeRecord {
  return {
    code: row.code as string,
    skuId: row.skuId as string,
    productId: row.productId as string,
    durationDays: row.durationDays as number,
    batchId: (row.batchId as string) || undefined,
    note: (row.note as string) || undefined,
    createdAt: iso(row.createdAt) || new Date().toISOString(),
    expiresAt: iso(row.expiresAt),
    redeemedBy: (row.redeemedBy as string) || undefined,
    redeemedAt: iso(row.redeemedAt),
    redeemedOrderId: (row.redeemedOrderId as string) || undefined,
  };
}

function rowToBankTransfer(row: AnyRow): BankTransferRequest {
  return {
    code: row.code as string,
    userId: row.userId as string,
    userEmail: row.userEmail as string,
    productId: row.productId as string,
    skuIds: (row.skuIds as string[]) ?? [],
    skuNames: (row.skuNames as string[]) ?? undefined,
    amountUSD: row.amountUSD as number,
    fxRate: row.fxRate as number,
    fxRateDate: row.fxRateDate as string,
    amountTRY: row.amountTRY as number,
    ibanUsed: row.ibanUsed as string,
    ibanHolder: row.ibanHolder as string,
    status: row.status as BankTransferRequest["status"],
    createdAt: iso(row.createdAt) || new Date().toISOString(),
    expiresAt: iso(row.expiresAt) || new Date().toISOString(),
    approvedBy: (row.approvedBy as string) || undefined,
    approvedAt: iso(row.approvedAt),
    rejectionReason: (row.rejectionReason as string) || undefined,
    orderId: (row.orderId as string) || undefined,
  };
}

function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

// ============== PUBLIC API ==============

export async function findUserByEmail(email: string, _forceFresh = false): Promise<UserRecord | undefined> {
  const lower = email.toLowerCase().trim();
  if (HAS_DB) {
    const row = await getPrisma().user.findUnique({ where: { email: lower } });
    return row ? rowToUser(row as unknown as AnyRow) : undefined;
  }
  const s = await loadState(_forceFresh);
  for (const user of Object.values(s.users)) {
    if (user.email.toLowerCase() === lower) return user;
  }
  return undefined;
}

export async function findUserById(id: string, _forceFresh = false): Promise<UserRecord | undefined> {
  if (HAS_DB) {
    const row = await getPrisma().user.findUnique({ where: { id } });
    return row ? rowToUser(row as unknown as AnyRow) : undefined;
  }
  const s = await loadState(_forceFresh);
  return s.users[id];
}

export async function findUserByOAuth(provider: "google" | "facebook" | "github", providerId: string): Promise<UserRecord | undefined> {
  if (HAS_DB) {
    const row = await getPrisma().user.findUnique({
      where: { oauth_provider_lookup: { oauthProvider: provider, oauthProviderId: providerId } },
    });
    return row ? rowToUser(row as unknown as AnyRow) : undefined;
  }
  const s = await loadState(true);
  for (const user of Object.values(s.users)) {
    if (user.oauthProvider === provider && user.oauthProviderId === providerId) return user;
  }
  return undefined;
}

export async function findUserByVerificationToken(token: string): Promise<UserRecord | undefined> {
  if (HAS_DB) {
    const row = await getPrisma().user.findUnique({ where: { verificationToken: token } });
    return row ? rowToUser(row as unknown as AnyRow) : undefined;
  }
  const s = await loadState(true);
  for (const user of Object.values(s.users)) {
    if (user.verificationToken === token) return user;
  }
  return undefined;
}

export async function createUser(input: Omit<UserRecord, "id" | "createdAt" | "updatedAt">): Promise<UserRecord> {
  const lower = input.email.toLowerCase().trim();
  if (HAS_DB) {
    const id = randomUUID();
    const data = { id, ...userToPrisma({ ...input, email: lower }) };
    try {
      const row = await getPrisma().user.create({ data: data as any });
      return rowToUser(row as unknown as AnyRow);
    } catch (e: any) {
      // Prisma unique-violation code (P2002) means the email is taken.
      if (e?.code === "P2002") throw new Error("Bu e-mail ile zaten bir hesap var");
      throw e;
    }
  }
  const s = await loadState(true);
  for (const existing of Object.values(s.users)) {
    if (existing.email.toLowerCase() === lower) throw new Error("Bu e-mail ile zaten bir hesap var");
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  const user: UserRecord = { ...input, id, createdAt: now, updatedAt: now };
  s.users[id] = user;
  await saveState(s);
  return user;
}

export async function updateUser(id: string, patch: Partial<UserRecord>): Promise<UserRecord | undefined> {
  if (HAS_DB) {
    try {
      const row = await getPrisma().user.update({
        where: { id },
        data: userToPrisma(patch) as any,
      });
      return rowToUser(row as unknown as AnyRow);
    } catch (e: any) {
      if (e?.code === "P2025") return undefined; // not found
      throw e;
    }
  }
  const s = await loadState(true);
  const existing = s.users[id];
  if (!existing) return undefined;
  const updated: UserRecord = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
  s.users[id] = updated;
  await saveState(s);
  return updated;
}

export async function createOrder(input: Omit<OrderRecord, "id" | "createdAt">): Promise<OrderRecord> {
  if (HAS_DB) {
    const id = randomUUID();
    const data = { id, ...orderToPrisma(input) };
    const row = await getPrisma().order.create({ data: data as any });
    return rowToOrder(row as unknown as AnyRow);
  }
  const s = await loadState(true);
  const id = randomUUID();
  const order: OrderRecord = { ...input, id, createdAt: new Date().toISOString() };
  s.orders[id] = order;
  await saveState(s);
  return order;
}

export async function updateOrder(id: string, patch: Partial<OrderRecord>): Promise<OrderRecord | undefined> {
  if (HAS_DB) {
    try {
      const row = await getPrisma().order.update({
        where: { id },
        data: orderToPrisma(patch) as any,
      });
      return rowToOrder(row as unknown as AnyRow);
    } catch (e: any) {
      if (e?.code === "P2025") return undefined;
      throw e;
    }
  }
  const s = await loadState(true);
  const existing = s.orders[id];
  if (!existing) return undefined;
  const updated: OrderRecord = { ...existing, ...patch, id };
  s.orders[id] = updated;
  await saveState(s);
  return updated;
}

export async function findOrderById(id: string): Promise<OrderRecord | undefined> {
  if (HAS_DB) {
    const row = await getPrisma().order.findUnique({ where: { id } });
    return row ? rowToOrder(row as unknown as AnyRow) : undefined;
  }
  const s = await loadState();
  return s.orders[id];
}

export async function findOrderByConversationId(conversationId: string): Promise<OrderRecord | undefined> {
  if (HAS_DB) {
    const row = await getPrisma().order.findUnique({ where: { conversationId } });
    return row ? rowToOrder(row as unknown as AnyRow) : undefined;
  }
  const s = await loadState();
  for (const order of Object.values(s.orders)) {
    if (order.conversationId === conversationId) return order;
  }
  return undefined;
}

export async function listOrdersByUserId(userId: string): Promise<OrderRecord[]> {
  if (HAS_DB) {
    const rows = await getPrisma().order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r: unknown) => rowToOrder(r as AnyRow));
  }
  const s = await loadState();
  return Object.values(s.orders)
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllOrders(): Promise<OrderRecord[]> {
  if (HAS_DB) {
    const rows = await getPrisma().order.findMany();
    return rows.map((r: unknown) => rowToOrder(r as AnyRow));
  }
  const s = await loadState(true);
  return Object.values(s.orders);
}

export async function findActiveTrialForUserSku(userId: string, skuId: string): Promise<OrderRecord | undefined> {
  if (HAS_DB) {
    // Filter by user + trial status in SQL, then check items + expiry in JS.
    // The items field is a JSON column so we can't filter it server-side
    // without a generated column — but trial+user already narrows hard.
    const rows = await getPrisma().order.findMany({
      where: { userId, isTrial: true, status: "TRIAL" },
    });
    const now = Date.now();
    for (const r of rows) {
      const order = rowToOrder(r as unknown as AnyRow);
      if (!order.items.some((it) => it.skuId === skuId)) continue;
      if (order.trialExpiresAt && new Date(order.trialExpiresAt).getTime() < now) continue;
      return order;
    }
    return undefined;
  }
  const s = await loadState();
  const now = Date.now();
  for (const order of Object.values(s.orders)) {
    if (order.userId !== userId) continue;
    if (!order.isTrial) continue;
    if (order.status !== "TRIAL") continue;
    if (!order.items.some((it) => it.skuId === skuId)) continue;
    if (order.trialExpiresAt && new Date(order.trialExpiresAt).getTime() < now) continue;
    return order;
  }
  return undefined;
}

export async function hasUsedTrialForSku(userId: string, skuId: string, _forceFresh = false): Promise<boolean> {
  if (HAS_DB) {
    const rows = await getPrisma().order.findMany({
      where: { userId, isTrial: true },
    });
    for (const r of rows) {
      const order = rowToOrder(r as unknown as AnyRow);
      if (order.items.some((it) => it.skuId === skuId)) return true;
    }
    return false;
  }
  const s = await loadState(_forceFresh);
  for (const order of Object.values(s.orders)) {
    if (order.userId !== userId) continue;
    if (!order.isTrial) continue;
    if (!order.items.some((it) => it.skuId === skuId)) continue;
    return true;
  }
  return false;
}

// ============== LICENSE CODES ==============

export async function getLicenseCode(code: string): Promise<LicenseCodeRecord | undefined> {
  const key = normalizeCode(code);
  if (HAS_DB) {
    const row = await getPrisma().licenseCode.findUnique({ where: { code: key } });
    return row ? rowToLicenseCode(row as unknown as AnyRow) : undefined;
  }
  const s = await loadState();
  return s.licenseCodes?.[key];
}

export async function createLicenseCode(input: Omit<LicenseCodeRecord, "createdAt" | "redeemedBy" | "redeemedAt" | "redeemedOrderId">): Promise<LicenseCodeRecord> {
  const code = normalizeCode(input.code);
  if (HAS_DB) {
    try {
      const row = await getPrisma().licenseCode.create({
        data: {
          code,
          skuId: input.skuId,
          productId: input.productId,
          durationDays: input.durationDays,
          batchId: input.batchId ?? null,
          note: input.note ?? null,
          expiresAt: dateOrNull(input.expiresAt),
        },
      });
      return rowToLicenseCode(row as unknown as AnyRow);
    } catch (e: any) {
      if (e?.code === "P2002") throw new Error("Bu kod zaten mevcut");
      throw e;
    }
  }
  const s = await loadState(true);
  if (!s.licenseCodes) s.licenseCodes = {};
  if (s.licenseCodes[code]) throw new Error("Bu kod zaten mevcut");
  const record: LicenseCodeRecord = { ...input, code, createdAt: new Date().toISOString() };
  s.licenseCodes[code] = record;
  await saveState(s);
  return record;
}

export async function markLicenseCodeRedeemed(code: string, userId: string, orderId: string): Promise<void> {
  const key = normalizeCode(code);
  if (HAS_DB) {
    const existing = await getPrisma().licenseCode.findUnique({ where: { code: key } });
    if (!existing) throw new Error("Kod bulunamadı");
    if ((existing as any).redeemedBy) throw new Error("Kod zaten kullanılmış");
    await getPrisma().licenseCode.update({
      where: { code: key },
      data: { redeemedBy: userId, redeemedAt: new Date(), redeemedOrderId: orderId },
    });
    return;
  }
  const s = await loadState(true);
  const rec = s.licenseCodes?.[key];
  if (!rec) throw new Error("Kod bulunamadı");
  if (rec.redeemedBy) throw new Error("Kod zaten kullanılmış");
  rec.redeemedBy = userId;
  rec.redeemedAt = new Date().toISOString();
  rec.redeemedOrderId = orderId;
  await saveState(s);
}

export async function listLicenseCodes(): Promise<LicenseCodeRecord[]> {
  if (HAS_DB) {
    const rows = await getPrisma().licenseCode.findMany();
    return rows.map((r: unknown) => rowToLicenseCode(r as AnyRow));
  }
  const s = await loadState();
  return Object.values(s.licenseCodes || {});
}

// ============ HAVALE / EFT ÖDEME İSTEKLERİ ============

export async function createBankTransferRequest(input: Omit<BankTransferRequest, "createdAt" | "status">): Promise<BankTransferRequest> {
  if (HAS_DB) {
    try {
      const row = await getPrisma().bankTransferRequest.create({
        data: {
          code: input.code,
          userId: input.userId,
          userEmail: input.userEmail,
          productId: input.productId,
          skuIds: input.skuIds,
          skuNames: input.skuNames ?? Prisma.DbNull,
          amountUSD: input.amountUSD,
          fxRate: input.fxRate,
          fxRateDate: input.fxRateDate,
          amountTRY: input.amountTRY,
          ibanUsed: input.ibanUsed,
          ibanHolder: input.ibanHolder,
          status: "PENDING",
          expiresAt: new Date(input.expiresAt),
        },
      });
      return rowToBankTransfer(row as unknown as AnyRow);
    } catch (e: any) {
      if (e?.code === "P2002") throw new Error("Bu kod zaten mevcut");
      throw e;
    }
  }
  const s = await loadState(true);
  if (!s.bankTransfers) s.bankTransfers = {};
  if (s.bankTransfers[input.code]) throw new Error("Bu kod zaten mevcut");
  const record: BankTransferRequest = { ...input, status: "PENDING", createdAt: new Date().toISOString() };
  s.bankTransfers[input.code] = record;
  await saveState(s);
  return record;
}

export async function getBankTransferRequest(code: string): Promise<BankTransferRequest | undefined> {
  if (HAS_DB) {
    const row = await getPrisma().bankTransferRequest.findUnique({ where: { code } });
    return row ? rowToBankTransfer(row as unknown as AnyRow) : undefined;
  }
  const s = await loadState();
  return s.bankTransfers?.[code];
}

export async function listBankTransferRequests(opts?: { status?: BankTransferRequest["status"]; userId?: string }): Promise<BankTransferRequest[]> {
  if (HAS_DB) {
    const rows = await getPrisma().bankTransferRequest.findMany({
      where: {
        ...(opts?.status ? { status: opts.status } : {}),
        ...(opts?.userId ? { userId: opts.userId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r: unknown) => rowToBankTransfer(r as AnyRow));
  }
  const s = await loadState();
  let list = Object.values(s.bankTransfers || {});
  if (opts?.status) list = list.filter((b) => b.status === opts.status);
  if (opts?.userId) list = list.filter((b) => b.userId === opts.userId);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function approveBankTransferRequest(code: string, adminEmail: string, orderId: string): Promise<BankTransferRequest> {
  if (HAS_DB) {
    const existing = await getPrisma().bankTransferRequest.findUnique({ where: { code } });
    if (!existing) throw new Error("Havale isteği bulunamadı");
    if ((existing as any).status !== "PENDING") throw new Error(`İstek zaten ${(existing as any).status}`);
    const row = await getPrisma().bankTransferRequest.update({
      where: { code },
      data: {
        status: "APPROVED",
        approvedBy: adminEmail,
        approvedAt: new Date(),
        orderId,
      },
    });
    return rowToBankTransfer(row as unknown as AnyRow);
  }
  const s = await loadState(true);
  const rec = s.bankTransfers?.[code];
  if (!rec) throw new Error("Havale isteği bulunamadı");
  if (rec.status !== "PENDING") throw new Error(`İstek zaten ${rec.status}`);
  rec.status = "APPROVED";
  rec.approvedBy = adminEmail;
  rec.approvedAt = new Date().toISOString();
  rec.orderId = orderId;
  await saveState(s);
  return rec;
}

export async function rejectBankTransferRequest(code: string, adminEmail: string, reason: string): Promise<BankTransferRequest> {
  if (HAS_DB) {
    const existing = await getPrisma().bankTransferRequest.findUnique({ where: { code } });
    if (!existing) throw new Error("Havale isteği bulunamadı");
    if ((existing as any).status !== "PENDING") throw new Error(`İstek zaten ${(existing as any).status}`);
    const row = await getPrisma().bankTransferRequest.update({
      where: { code },
      data: {
        status: "REJECTED",
        approvedBy: adminEmail,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    });
    return rowToBankTransfer(row as unknown as AnyRow);
  }
  const s = await loadState(true);
  const rec = s.bankTransfers?.[code];
  if (!rec) throw new Error("Havale isteği bulunamadı");
  if (rec.status !== "PENDING") throw new Error(`İstek zaten ${rec.status}`);
  rec.status = "REJECTED";
  rec.approvedBy = adminEmail;
  rec.approvedAt = new Date().toISOString();
  rec.rejectionReason = reason;
  await saveState(s);
  return rec;
}
