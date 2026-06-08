/**
 * POST /api/admin/bank-transfers/approve
 * Body: { code: string }
 *
 * Bekleyen havale isteğini onayla:
 * 1. BankTransferRequest status = APPROVED
 * 2. Order yarat (PAID, subscriptionExpiresAt = now + 30g)
 * 3. CaptchaERPIDE ise provisionCaptchaLicense, FinansERPIDE ise provisionFinanserpideModules
 * 4. Order ID'yi BankTransferRequest.orderId'ye yaz
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import {
  getBankTransferRequest,
  approveBankTransferRequest,
  findUserById,
  createOrder,
  type OrderItem,
} from "@/lib/auth/user-store";
import { getSku, getProductOfSku } from "@/lib/products";
import { provisionCaptchaLicense } from "@/lib/payments/captcha-provision";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session || session.userType !== "admin") return null;
  return session;
}

function generateLicenseKey(productId: string): string {
  const prefix = productId === "captchaerpide" ? "CAP" : productId === "finanserpide" ? "FRP" : "ERP";
  const rnd = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 6).toUpperCase()).join("-");
  const year = new Date().getUTCFullYear();
  return `${prefix}-${year}-${rnd}`;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: { code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const code = (body.code || "").trim();
  if (!code) return NextResponse.json({ error: "Kod gerekli" }, { status: 400 });

  const reqRec = await getBankTransferRequest(code);
  if (!reqRec) return NextResponse.json({ error: "Havale isteği bulunamadı" }, { status: 404 });
  if (reqRec.status !== "PENDING") return NextResponse.json({ error: `Zaten ${reqRec.status}` }, { status: 409 });

  const user = await findUserById(reqRec.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 86_400_000);

  // Order item'larını hazırla (her SKU için)
  const items: OrderItem[] = [];
  for (const skuId of reqRec.skuIds) {
    const sku = getSku(skuId);
    const product = getProductOfSku(skuId);
    if (!sku || !product) continue;
    const licenseKey = generateLicenseKey(product.id);
    const item: OrderItem = {
      skuId: sku.id,
      productId: product.id,
      productName: product.name,
      skuName: sku.name,
      price: sku.prices?.USD || sku.price || 0,
      licenseKey,
    };

    if (product.id === "captchaerpide") {
      try {
        const prov = await provisionCaptchaLicense({
          email: user.email,
          firstName: user.name || user.email.split("@")[0],
          lastName: user.surname,
          sku,
          isTrial: false,
          expiresAt,
          upstreamRef: `havale:${reqRec.code}`,
        });
        if (prov.ok) {
          item.apiKey = prov.apiKey;
          item.apiBaseUrl = prov.apiBaseUrl;
          item.dashboardUrl = prov.dashboardUrl;
          item.maxSolvesPerDay = prov.maxSolvesPerDay;
        }
      } catch (e) { console.error("[bank-approve] captcha provision failed:", e); }
    }
    items.push(item);
  }

  const order = await createOrder({
    userId: user.id,
    items,
    totalPrice: reqRec.amountUSD,
    currency: "USD",
    conversationId: `havale-${reqRec.code}`,
    status: "PAID",
    subscriptionExpiresAt: expiresAt.toISOString(),
    billingCycle: "monthly",
    autoRenewEnabled: false,
    paidAt: now.toISOString(),
  });

  await approveBankTransferRequest(reqRec.code, admin.userName, order.id);

  return NextResponse.json({ ok: true, orderId: order.id, expiresAt: expiresAt.toISOString() });
}
