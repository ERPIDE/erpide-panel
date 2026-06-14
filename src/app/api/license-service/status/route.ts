/**
 * LICENSE SERVICE — MASTER ENDPOINT
 *
 * ERPİDE ekosistemindeki TÜM ürünler (FinansERPIDE, CaptchaERPIDE, PocketERPIDE,
 * AI Kontör) lisans state'ini bu endpoint'ten beslenir. Tek doğru kaynağı:
 * panel'in OrderRecord + LicenseCode + BankTransferRequest tablolarıdır.
 *
 * GET /api/license-service/status?email=user@example.com
 * Header: X-License-Secret: <LICENSE_SERVICE_SECRET>
 *
 * Yanıt:
 * {
 *   email: "...",
 *   isPlatformOwner: false,
 *   products: {
 *     finanserpide: {
 *       active: true,
 *       status: "ACTIVE" | "EXPIRED" | "NONE",
 *       modules: ["satis", "muhasebe", ...],   // FinansERPIDE için modül listesi
 *       seats: 5,                              // ek kullanıcı sayısı
 *       planCode: "BASE" | "STARTER" | ...,
 *       expiresAt: "2026-12-31T00:00:00.000Z",
 *       billingCycle: "monthly",
 *       lastOrderId: "ord_..."
 *     },
 *     captchaerpide: { ... },
 *     pocketerpide: { ... },
 *     "ai-kontor": { active: true, creditsRemaining: 1245, ... }
 *   }
 * }
 *
 * Ürünler bu endpoint'i 5 dakikalık in-memory cache ile çağırır.
 * HMAC değil basit shared secret — internal endpoint, server-to-server.
 */
import { NextResponse } from "next/server";
import {
  findUserByEmail,
  listOrdersByUserId,
  type OrderRecord,
  type OrderItem,
} from "@/lib/auth/user-store";
import { getSku, getProductOfSku, type SKU } from "@/lib/products";

export const runtime = "nodejs";

const PLATFORM_OWNER_EMAILS = new Set(
  (process.env.PLATFORM_OWNER_EMAILS || "alimuratelll@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

// SKU'dan modül key türet — finanserpide modül SKU'ları için grantsModules[0]'dan
// path prefix'i ("/muhasebe" → "muhasebe", "/sabitkiymet" → "sabitkiymet")
function moduleKeyFromSku(sku: SKU): string | null {
  if (sku.kind !== "module" || !sku.grantsModules?.length) return null;
  const first = sku.grantsModules[0];
  return first.startsWith("/") ? first.slice(1) : first;
}

// FinansERPIDE temel paketin verdiği modüller (base SKU)
const BASE_MODULES_FOR_FINANSERPIDE = ["satis", "satinalma", "stok", "finans"];

interface ProductState {
  active: boolean;
  status: "ACTIVE" | "EXPIRED" | "NONE";
  modules: string[];
  seats: number;
  planCode: string;
  expiresAt: string | null;
  billingCycle: "monthly" | "yearly" | null;
  lastOrderId: string | null;
  /** AI Kontör için: bugüne kadar satın alınan tüm aktif paketlerin TOPLAM kontörü */
  creditsTotal?: number;
  /** AI Kontör için: bugüne kadar tüketilmiş toplam kontör */
  creditsConsumed?: number;
  /** AI Kontör için: granted - consumed (UI bunu gösterir) */
  creditsRemaining?: number;
}

function emptyProductState(): ProductState {
  return {
    active: false, status: "NONE", modules: [], seats: 0,
    planCode: "", expiresAt: null, billingCycle: null, lastOrderId: null,
  };
}

export async function GET(req: Request) {
  const expectedSecret = process.env.LICENSE_SERVICE_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "LICENSE_SERVICE_SECRET not configured" }, { status: 503 });
  }
  const providedSecret = req.headers.get("x-license-secret");
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email parameter required" }, { status: 400 });

  const isPlatformOwner = PLATFORM_OWNER_EMAILS.has(email);
  const user = await findUserByEmail(email);

  // OWNER BYPASS — kullanıcı kayıtsız olsa bile owner ise tüm ürünler aktif
  if (isPlatformOwner) {
    const fullActive: ProductState = {
      active: true, status: "ACTIVE",
      modules: ["satis", "satinalma", "stok", "finans", "muhasebe", "ik", "uretim", "sabitkiymet"],
      seats: 999, planCode: "OWNER",
      expiresAt: null, // hiç bitmez
      billingCycle: null, lastOrderId: null,
    };
    return NextResponse.json({
      email,
      isPlatformOwner: true,
      userExists: !!user,
      products: {
        finanserpide: fullActive,
        captchaerpide: { ...fullActive, modules: [] },
        pocketerpide: { ...fullActive, modules: [] },
        "ai-kontor": { ...fullActive, modules: [], creditsRemaining: 999_999 },
      },
    });
  }

  // Kullanıcı yoksa hiç ürün yok
  if (!user) {
    return NextResponse.json({
      email, isPlatformOwner: false, userExists: false,
      products: {
        finanserpide: emptyProductState(),
        captchaerpide: emptyProductState(),
        pocketerpide: emptyProductState(),
        "ai-kontor": emptyProductState(),
      },
    });
  }

  // ===== Normal müşteri: tüm sipariş geçmişini tarayıp state hesapla =====
  const orders = await listOrdersByUserId(user.id);
  const now = Date.now();

  // Ürün bazında PAID+TRIAL siparişleri grupla. En yeni biten tarihi kullan.
  const byProduct = new Map<string, ProductState>();
  function ensure(pid: string): ProductState {
    let s = byProduct.get(pid);
    if (!s) { s = emptyProductState(); byProduct.set(pid, s); }
    return s;
  }

  // Eski→yeni sırala; sonra gelenler öncekileri "ezsin" (renewal davranışı)
  const sorted = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const o of sorted) {
    if (o.status !== "PAID" && o.status !== "TRIAL") continue;
    const isTrialOrder = o.status === "TRIAL" || o.isTrial;
    const expiresAt = isTrialOrder ? o.trialExpiresAt : o.subscriptionExpiresAt;
    const expired = !!expiresAt && new Date(expiresAt).getTime() < now;

    // Bu sipariş hangi ürünleri etkiliyor?
    const productGroups = new Map<string, OrderItem[]>();
    for (const it of o.items) {
      const list = productGroups.get(it.productId) || [];
      list.push(it);
      productGroups.set(it.productId, list);
    }

    for (const [pid, items] of productGroups) {
      const s = ensure(pid);

      // En son sipariş aktifse onun expiresAt'ini kullan (renewal)
      if (!expired) {
        s.active = true;
        s.status = "ACTIVE";
        s.expiresAt = expiresAt || null;
        s.lastOrderId = o.id;
        s.billingCycle = o.billingCycle || s.billingCycle;
        // planCode: base SKU varsa onu kullan, yoksa ilk SKU
        const baseItem = items.find((i) => {
          const sku = getSku(i.skuId);
          return sku?.kind === "base";
        });
        s.planCode = baseItem ? "BASE" : s.planCode || items[0].skuName;

        // FinansERPIDE için modülleri topla (base + her modül SKU)
        if (pid === "finanserpide") {
          const mods = new Set<string>(s.modules);
          for (const m of BASE_MODULES_FOR_FINANSERPIDE) mods.add(m);
          for (const it of items) {
            const sku = getSku(it.skuId);
            if (!sku) continue;
            if (sku.kind === "module") {
              const m = moduleKeyFromSku(sku);
              if (m) mods.add(m);
            }
            if (sku.kind === "seat") s.seats += 1;
          }
          s.modules = Array.from(mods);
        }

        // AI Kontör için: bu order'da satin alinan paketleri topla, sonra bu
        // order'in kendi tuketim sayacini (creditsConsumed) cikar. Tum aktif
        // order'lar toplanir; sonuc UI'ye gauge cubugu icin uygun.
        if (pid === "ai-kontor") {
          let grantedThisOrder = 0;
          for (const it of items) {
            const sku = getSku(it.skuId);
            if (sku?.creditsGranted) grantedThisOrder += sku.creditsGranted;
          }
          const consumedThisOrder = o.creditsConsumed ?? 0;
          s.creditsTotal = (s.creditsTotal || 0) + grantedThisOrder;
          s.creditsConsumed = (s.creditsConsumed || 0) + consumedThisOrder;
          s.creditsRemaining = Math.max(0, (s.creditsTotal || 0) - (s.creditsConsumed || 0));
        }
      } else {
        // Expired — sadece status'u expired yap (önceki active'i ezme)
        if (s.status === "NONE") {
          s.status = "EXPIRED";
          s.expiresAt = expiresAt || null;
          s.lastOrderId = o.id;
        }
      }
    }
  }

  // 4 standart ürün için cevap hazırla (eksikler emptyProductState)
  const products: Record<string, ProductState> = {
    finanserpide: byProduct.get("finanserpide") || emptyProductState(),
    captchaerpide: byProduct.get("captchaerpide") || emptyProductState(),
    pocketerpide: byProduct.get("pocketerpide") || emptyProductState(),
    "ai-kontor": byProduct.get("ai-kontor") || emptyProductState(),
  };

  return NextResponse.json({
    email,
    isPlatformOwner: false,
    userExists: true,
    products,
  });
}
