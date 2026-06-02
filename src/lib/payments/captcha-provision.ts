/**
 * CaptchaERPIDE license provisioning.
 *
 * Server-to-server call to captcha.erpide.com's /internal/provision-license
 * endpoint. Invoked from /api/trial/start (free 3-day deneme) and from the
 * iyzico checkout success callback (paid orders).
 *
 * Returns the credentials the customer needs to start hitting the API:
 *   - apiKey  (cap_xxx) for the Authorization header
 *   - apiKeyId / backendUserId / backendLicenseId so we can revoke later
 *   - apiBaseUrl + dashboardUrl for display
 */
import type { SKU } from "@/lib/products";

const CAPTCHA_BASE = process.env.CAPTCHA_API_BASE_URL || "https://captcha.erpide.com";
const INTERNAL_TOKEN = process.env.CAPTCHA_INTERNAL_API_TOKEN || "";

type Plan = "starter" | "pro" | "enterprise";

export interface ProvisionInput {
  email: string;
  firstName: string;
  lastName?: string;
  sku: SKU;
  isTrial: boolean;
  expiresAt?: Date; // omit for perpetual (legacy monthly = renewed each cycle)
  upstreamRef?: string;
}

export interface ProvisionResult {
  ok: true;
  apiKey: string;
  apiKeyId: string;
  apiBaseUrl: string;
  dashboardUrl: string;
  backendUserId: string;
  backendLicenseId: string;
  maxSolvesPerDay: number;
  licenseKeyFromBackend: string; // LIC-XXXX style key on the backend (informational)
}

export interface ProvisionFailure {
  ok: false;
  error: string;
  status?: number;
}

/** Map an SKU id like "captchaerpide-starter-monthly" to a backend plan key. */
export function planFromSku(skuId: string): Plan {
  const lower = skuId.toLowerCase();
  if (lower.includes("enterprise")) return "enterprise";
  if (lower.includes("pro")) return "pro";
  return "starter";
}

export function captchaProvisionEnabled(): boolean {
  return !!INTERNAL_TOKEN;
}

export async function provisionCaptchaLicense(
  input: ProvisionInput
): Promise<ProvisionResult | ProvisionFailure> {
  if (!INTERNAL_TOKEN) {
    return {
      ok: false,
      error: "CAPTCHA_INTERNAL_API_TOKEN not configured on this server",
    };
  }

  const plan = planFromSku(input.sku.id);
  const body = {
    email: input.email,
    first_name: input.firstName || "Müşteri",
    last_name: input.lastName || "",
    plan,
    is_trial: input.isTrial,
    expires_at: input.expiresAt ? input.expiresAt.toISOString() : null,
    upstream_ref: input.upstreamRef || null,
  };

  let res: Response;
  try {
    res = await fetch(`${CAPTCHA_BASE.replace(/\/$/, "")}/internal/provision-license`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": INTERNAL_TOKEN,
      },
      body: JSON.stringify(body),
      // Server-to-server: don't let any HTTP cache touch this.
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, error: `Captcha backend unreachable: ${String(e)}` };
  }

  let data: Record<string, unknown> = {};
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const detail = (data as { detail?: string }).detail || `HTTP ${res.status}`;
    return { ok: false, error: `Captcha backend rejected provision: ${detail}`, status: res.status };
  }

  return {
    ok: true,
    apiKey: String(data.api_key),
    apiKeyId: String(data.api_key_id),
    apiBaseUrl: String(data.base_url),
    dashboardUrl: String(data.dashboard_url),
    backendUserId: String(data.user_id),
    backendLicenseId: String(data.license_id),
    maxSolvesPerDay: Number(data.max_solves_per_day) || 0,
    licenseKeyFromBackend: String(data.license_key),
  };
}

export interface RevokeInput {
  backendLicenseId: string;
}

export async function revokeCaptchaLicense(input: RevokeInput): Promise<boolean> {
  if (!INTERNAL_TOKEN) return false;
  try {
    const res = await fetch(`${CAPTCHA_BASE.replace(/\/$/, "")}/internal/revoke-license`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": INTERNAL_TOKEN,
      },
      body: JSON.stringify({ license_id: input.backendLicenseId }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
