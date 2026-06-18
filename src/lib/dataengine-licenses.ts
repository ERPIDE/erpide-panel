/**
 * Data Engine — phone-home lisans listesi.
 *
 * Şimdilik hardcoded; müşteri sayısı 5-10'u geçince Prisma model'ine
 * (DataEngineLicense) geçilecek. Lisans eklemek için bu dosyaya satır
 * ekle + commit + Vercel auto-deploy.
 *
 * Key formatı: DE-XXXX-YYYY-ZZZZ-NNNN (4 grup, 4'er hex char)
 * expiresAt: ISO 8601 UTC; null → perpetual (önerilmez)
 */

export interface DataEngineLicense {
  customer: string;        // Müşteri adı (görsel + log)
  expiresAt: string | null;
  active: boolean;         // false → revoke (geçici durdurma)
  note?: string;
}

export const DATAENGINE_LICENSES: Record<string, DataEngineLicense> = {
  "DE-ATMC-A001-K000-2606": {
    customer: "ATM Construction Kazakhstan",
    expiresAt: "2027-06-30T23:59:59Z",
    active: true,
    note: "İlk müşteri, dataengine.erpide.com'a tunnel via Win Server 192.168.60.42",
  },
};
