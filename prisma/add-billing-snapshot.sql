-- Order.billingSnapshot: odeme anindaki fatura adresinin anlik goruntusu.
-- Nullable JSONB — mevcut siparisler NULL kalir, fatura tarafi onlarda
-- eski davranisa duser. Veri kaybettirmez, iki kez calisabilir.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billingSnapshot" JSONB;
