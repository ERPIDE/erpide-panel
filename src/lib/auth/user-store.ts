import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  surname: string;
  passwordHash: string;
  gsmNumber?: string;
  identityNumber?: string;
  companyName?: string;
  taxNumber?: string;
  address?: string;
  city?: string;
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
}

export interface OrderRecord {
  id: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  currency: "TRY";
  paymentId?: string;
  conversationId: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  iyzicoToken?: string;
  createdAt: string;
  paidAt?: string;
}

// NOTE: This is a TEMPORARY in-memory + filesystem-backed store for MVP / iyzico
// review. Replace with Vercel KV / PostgreSQL once production launches.
// On Vercel serverless, in-memory state is per-instance and ephemeral — fine for
// inspection/demo, NOT for real production.

const STORAGE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".erpide-data");
const USERS_FILE = path.join(STORAGE_DIR, "users.json");
const ORDERS_FILE = path.join(STORAGE_DIR, "orders.json");

let users: Map<string, UserRecord> | null = null;
let orders: Map<string, OrderRecord> | null = null;

async function ensureDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch {}
}

async function load<T>(file: string): Promise<Map<string, T>> {
  try {
    const data = await fs.readFile(file, "utf-8");
    const obj = JSON.parse(data);
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

async function save<T>(file: string, map: Map<string, T>): Promise<void> {
  await ensureDir();
  const obj = Object.fromEntries(map);
  await fs.writeFile(file, JSON.stringify(obj, null, 2), "utf-8");
}

async function getUsers(): Promise<Map<string, UserRecord>> {
  if (!users) users = await load<UserRecord>(USERS_FILE);
  return users;
}

async function getOrders(): Promise<Map<string, OrderRecord>> {
  if (!orders) orders = await load<OrderRecord>(ORDERS_FILE);
  return orders;
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const u = await getUsers();
  const lower = email.toLowerCase().trim();
  for (const user of u.values()) {
    if (user.email.toLowerCase() === lower) return user;
  }
  return undefined;
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  const u = await getUsers();
  return u.get(id);
}

export async function createUser(input: Omit<UserRecord, "id" | "createdAt" | "updatedAt">): Promise<UserRecord> {
  const u = await getUsers();
  const existing = await findUserByEmail(input.email);
  if (existing) throw new Error("Bu e-mail ile zaten bir hesap var");
  const id = randomUUID();
  const now = new Date().toISOString();
  const user: UserRecord = { ...input, id, createdAt: now, updatedAt: now };
  u.set(id, user);
  await save(USERS_FILE, u);
  return user;
}

export async function updateUser(id: string, patch: Partial<UserRecord>): Promise<UserRecord | undefined> {
  const u = await getUsers();
  const user = u.get(id);
  if (!user) return undefined;
  const updated: UserRecord = { ...user, ...patch, id, updatedAt: new Date().toISOString() };
  u.set(id, updated);
  await save(USERS_FILE, u);
  return updated;
}

export async function createOrder(input: Omit<OrderRecord, "id" | "createdAt">): Promise<OrderRecord> {
  const o = await getOrders();
  const id = randomUUID();
  const order: OrderRecord = { ...input, id, createdAt: new Date().toISOString() };
  o.set(id, order);
  await save(ORDERS_FILE, o);
  return order;
}

export async function updateOrder(id: string, patch: Partial<OrderRecord>): Promise<OrderRecord | undefined> {
  const o = await getOrders();
  const order = o.get(id);
  if (!order) return undefined;
  const updated: OrderRecord = { ...order, ...patch, id };
  o.set(id, updated);
  await save(ORDERS_FILE, o);
  return updated;
}

export async function findOrderById(id: string): Promise<OrderRecord | undefined> {
  const o = await getOrders();
  return o.get(id);
}

export async function findOrderByConversationId(conversationId: string): Promise<OrderRecord | undefined> {
  const o = await getOrders();
  for (const order of o.values()) {
    if (order.conversationId === conversationId) return order;
  }
  return undefined;
}

export async function listOrdersByUserId(userId: string): Promise<OrderRecord[]> {
  const o = await getOrders();
  return Array.from(o.values())
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
