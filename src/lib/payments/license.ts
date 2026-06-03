import { randomBytes, createHash } from "crypto";
import type { ProductId } from "../products";

const PREFIX: Record<ProductId, string> = {
  finanserpide: "FRP",
  captchaerpide: "CAP",
  // 1C products are contact-only (no automated licensing); placeholders kept
  // so the Record stays exhaustive — keys won't be hit in normal flows.
  "1c-erp": "ERP",
  "1c-drive": "DRV",
};

export function generateLicenseKey(productId: ProductId): string {
  const prefix = PREFIX[productId];
  const year = new Date().getUTCFullYear();
  const random = randomBytes(8).toString("hex").toUpperCase();
  const segments = [
    random.slice(0, 4),
    random.slice(4, 8),
    random.slice(8, 12),
    random.slice(12, 16),
  ];
  return `${prefix}-${year}-${segments.join("-")}`;
}

export function generateReferenceCode(): string {
  const random = randomBytes(3).toString("hex").toUpperCase();
  const year = new Date().getUTCFullYear();
  return `ERP-${year}-${random}`;
}

export function hashLicense(licenseKey: string): string {
  return createHash("sha256").update(licenseKey).digest("hex");
}
