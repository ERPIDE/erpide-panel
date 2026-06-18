/**
 * Data Engine — phone-home lisans helper'ları.
 *
 * Eskiden bu dosya hardcoded `Record<string, License>` tutuyordu; artık
 * lisanslar Prisma `DataEngineLicense` model'inde, /admin/dataengine UI'sından
 * yönetiliyor. Helper'lar route'lar arası ortak normalize/validate
 * mantığını paylaşır.
 */

const KEY_PATTERN = /^DE(-[A-Z0-9]{4}){4}$/;

export function normalizeLicenseKey(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidKeyFormat(key: string): boolean {
  return KEY_PATTERN.test(key);
}

/** Random 4-char hex segment (A-F, 0-9). 16^4 = 65k per segment, 4 segment + brand
 * prefix = ~17 billion key space — abundant for any reasonable customer count. */
function randomSeg(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ambiguous 0/O, 1/I/L kaldırıldı
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Yeni lisans key üret. Müşteri kodu opsiyonel (4 char) — verilirse 2. segment
 * o olur, böylece görsel olarak hangi müşteri olduğu okunabilir. */
export function generateLicenseKey(customerCode?: string): string {
  const cc = customerCode?.trim().toUpperCase().slice(0, 4).padEnd(4, "X");
  return ["DE", cc && cc.length === 4 ? cc : randomSeg(), randomSeg(), randomSeg(), randomSeg()].join("-");
}
