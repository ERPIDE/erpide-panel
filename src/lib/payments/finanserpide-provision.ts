/**
 * FinansERPIDE modül/seat/credit provisioning.
 *
 * Panel iyzico callback'inde başarılı her satır için çağrılır. SKU.kind'a
 * göre finans.erpide.com'daki /api/internal/provision-module endpoint'i
 * tetikler — orada Subscription.modules güncellenir, seatLimit artar veya
 * AiUsage'a kontör topup yapılır.
 *
 * Eşleştirme buyer email + (varsa) tenant VKN üzerinden yapılır.
 */
import type { SKU } from "@/lib/products";

const FINANSERPIDE_BASE = process.env.FINANSERPIDE_API_BASE_URL || "https://finans.erpide.com";
const WEBHOOK_SECRET = process.env.PANEL_FINANSERPIDE_WEBHOOK_SECRET || "";

export interface FinansProvisionInput {
  buyerEmail: string;
  vkn?: string;
  paymentId: string;
  sku: SKU;
  quantity?: number;
}

export type FinansProvisionResult =
  | { ok: true; tenantId?: string; idempotent?: boolean; raw: unknown }
  | { ok: false; error: string; status?: number };

export async function provisionFinanserpideSku(input: FinansProvisionInput): Promise<FinansProvisionResult> {
  if (!WEBHOOK_SECRET) {
    return { ok: false, error: "PANEL_FINANSERPIDE_WEBHOOK_SECRET tanımlı değil" };
  }

  const kind = input.sku.kind ?? "base";
  if (kind !== "base" && kind !== "module" && kind !== "seat" && kind !== "credit") {
    return { ok: false, error: `Provision'lanmayan SKU tipi: ${kind}` };
  }

  // moduleKey'i grantsModules'tan türet — ilk path segment (/muhasebe → muhasebe)
  let moduleKey: string | undefined;
  if (kind === "module" && input.sku.grantsModules?.length) {
    const first = input.sku.grantsModules[0];
    moduleKey = first.startsWith("/") ? first.slice(1) : first;
  }

  const credits =
    kind === "credit" && typeof input.sku.creditsGranted === "number"
      ? input.sku.creditsGranted
      : undefined;

  const payload = {
    buyerEmail: input.buyerEmail,
    vkn: input.vkn,
    paymentId: input.paymentId,
    sku: {
      id: input.sku.id,
      kind,
      moduleKey,
      quantity: input.quantity ?? 1,
      credits,
    },
  };

  try {
    const res = await fetch(`${FINANSERPIDE_BASE}/api/internal/provision-module`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: (json as { error?: string })?.error || `HTTP ${res.status}`, status: res.status };
    }
    return { ok: true, tenantId: (json as { tenantId?: string })?.tenantId, idempotent: (json as { idempotent?: boolean })?.idempotent, raw: json };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `fetch-failed: ${message}` };
  }
}
