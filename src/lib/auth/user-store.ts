import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { put, list } from "@vercel/blob";

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
  currency: "TRY";
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

  createdAt: string;
  paidAt?: string;
}

interface State {
  users: Record<string, UserRecord>;
  orders: Record<string, OrderRecord>;
  __version: 1;
}

const STATE_KEY = "erpide-state.json";
const CACHE_TTL_MS = 3000;
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// Local-dev fallback paths (only used when BLOB_READ_WRITE_TOKEN is missing)
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

// ---- public API ----

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const s = await loadState();
  const lower = email.toLowerCase().trim();
  for (const user of Object.values(s.users)) {
    if (user.email.toLowerCase() === lower) return user;
  }
  return undefined;
}

export async function findUserById(id: string, forceFresh = false): Promise<UserRecord | undefined> {
  const s = await loadState(forceFresh);
  return s.users[id];
}

export async function findUserByOAuth(provider: "google" | "facebook" | "github", providerId: string): Promise<UserRecord | undefined> {
  const s = await loadState(true);
  for (const user of Object.values(s.users)) {
    if (user.oauthProvider === provider && user.oauthProviderId === providerId) return user;
  }
  return undefined;
}

export async function findUserByVerificationToken(token: string): Promise<UserRecord | undefined> {
  // Always read fresh state for verification token lookups — they're security-sensitive
  // and a stale cache could either miss a just-registered token or return one already burned.
  const s = await loadState(true);
  for (const user of Object.values(s.users)) {
    if (user.verificationToken === token) return user;
  }
  return undefined;
}

export async function createUser(input: Omit<UserRecord, "id" | "createdAt" | "updatedAt">): Promise<UserRecord> {
  const s = await loadState(true);
  const lower = input.email.toLowerCase().trim();
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
  const s = await loadState(true);
  const existing = s.users[id];
  if (!existing) return undefined;
  const updated: UserRecord = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
  s.users[id] = updated;
  await saveState(s);
  return updated;
}

export async function createOrder(input: Omit<OrderRecord, "id" | "createdAt">): Promise<OrderRecord> {
  const s = await loadState(true);
  const id = randomUUID();
  const order: OrderRecord = { ...input, id, createdAt: new Date().toISOString() };
  s.orders[id] = order;
  await saveState(s);
  return order;
}

export async function updateOrder(id: string, patch: Partial<OrderRecord>): Promise<OrderRecord | undefined> {
  const s = await loadState(true);
  const existing = s.orders[id];
  if (!existing) return undefined;
  const updated: OrderRecord = { ...existing, ...patch, id };
  s.orders[id] = updated;
  await saveState(s);
  return updated;
}

export async function findOrderById(id: string): Promise<OrderRecord | undefined> {
  const s = await loadState();
  return s.orders[id];
}

export async function findOrderByConversationId(conversationId: string): Promise<OrderRecord | undefined> {
  const s = await loadState();
  for (const order of Object.values(s.orders)) {
    if (order.conversationId === conversationId) return order;
  }
  return undefined;
}

export async function listOrdersByUserId(userId: string): Promise<OrderRecord[]> {
  const s = await loadState();
  return Object.values(s.orders)
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllOrders(): Promise<OrderRecord[]> {
  // Used by the renewal cron — must see absolutely the freshest state.
  const s = await loadState(true);
  return Object.values(s.orders);
}

export async function findActiveTrialForUserSku(userId: string, skuId: string): Promise<OrderRecord | undefined> {
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

export async function hasUsedTrialForSku(userId: string, skuId: string): Promise<boolean> {
  const s = await loadState();
  for (const order of Object.values(s.orders)) {
    if (order.userId !== userId) continue;
    if (!order.isTrial) continue;
    if (!order.items.some((it) => it.skuId === skuId)) continue;
    return true;
  }
  return false;
}
