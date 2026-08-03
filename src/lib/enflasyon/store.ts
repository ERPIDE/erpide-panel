/**
 * Enflasyon modülü DB katmanı + rapor gönderimi.
 *
 * Koşu sonuçları InflationRun'a JSON olarak yazılır (parametreler tek tek
 * sorgulanmaz), abone listesi InflationSubscriber'da yaşar. Mail gönderimi
 * payments/email.ts kalıbını izler: Resend anahtarı yoksa throw etmez,
 * { skipped } döner.
 */

import { Resend } from "resend";
import { getPrisma } from "@/lib/db";
import { runInflationEngine, RunData, ManualValues, ManualEntry } from "./engine";
import { buildInflationEmailHtml, periodLabel } from "./report";

// ── Manuel bülten değerleri (TÜİK/ENAG) ──────────────────────────

function parseManualEntry(v: unknown): ManualEntry | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.yearly !== "number" || typeof o.monthly !== "number" || typeof o.period !== "string") return null;
  return { yearly: o.yearly, monthly: o.monthly, period: o.period };
}

export async function getManualValues(): Promise<ManualValues> {
  const rows = await getPrisma().inflationOverride.findMany({ where: { key: { in: ["tuik", "enag"] } } });
  const out: ManualValues = {};
  for (const r of rows) {
    const entry = parseManualEntry(r.data);
    if (r.key === "tuik") out.tuik = entry;
    if (r.key === "enag") out.enag = entry;
  }
  return out;
}

export async function setManualValue(key: "tuik" | "enag", entry: ManualEntry) {
  await getPrisma().inflationOverride.upsert({
    where: { key },
    create: { key, data: entry as unknown as object },
    update: { data: entry as unknown as object },
  });
}

// ── Koşular ──────────────────────────────────────────────────────

export async function createRun(trigger: "cron" | "manual"): Promise<{ id: string; data: RunData }> {
  const manual = await getManualValues().catch(() => ({} as ManualValues));
  const data = await runInflationEngine(manual);
  const run = await getPrisma().inflationRun.create({
    data: {
      period: data.period,
      trigger,
      realRate: data.headline.felt ?? data.headline.real,
      officialRate: data.headline.official,
      liveParams: data.stats.live,
      totalParams: data.stats.total,
      data: data as unknown as object,
    },
  });
  return { id: run.id, data };
}

export async function getLatestRun() {
  return getPrisma().inflationRun.findFirst({ orderBy: { createdAt: "desc" } });
}

export async function getRun(id: string) {
  return getPrisma().inflationRun.findUnique({ where: { id } });
}

export async function listRuns(limit = 12) {
  return getPrisma().inflationRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, period: true, trigger: true, realRate: true, officialRate: true, createdAt: true, sentAt: true, sentCount: true, liveParams: true, totalParams: true },
  });
}

// ── Aboneler ─────────────────────────────────────────────────────

export async function listSubscribers() {
  return getPrisma().inflationSubscriber.findMany({ orderBy: { createdAt: "asc" } });
}

export async function addSubscriber(email: string, name?: string) {
  const normalized = email.trim().toLowerCase();
  return getPrisma().inflationSubscriber.upsert({
    where: { email: normalized },
    create: { email: normalized, name: name?.trim() || null },
    update: { active: true, name: name?.trim() || undefined },
  });
}

export async function removeSubscriber(id: string) {
  await getPrisma().inflationSubscriber.delete({ where: { id } });
}

export async function toggleSubscriber(id: string, active: boolean) {
  return getPrisma().inflationSubscriber.update({ where: { id }, data: { active } });
}

// ── Gönderim ─────────────────────────────────────────────────────

export async function sendReport(runId: string): Promise<{ sent: number; failed: number; skipped?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[enflasyon] RESEND_API_KEY yok — gönderim atlandı");
    return { sent: 0, failed: 0, skipped: "RESEND_API_KEY tanımlı değil" };
  }
  const run = await getRun(runId);
  if (!run) return { sent: 0, failed: 0, skipped: "koşu bulunamadı" };

  const subscribers = (await listSubscribers()).filter((s) => s.active);
  if (subscribers.length === 0) return { sent: 0, failed: 0, skipped: "aktif abone yok" };

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "bildirim@erpide.com";
  const data = run.data as unknown as RunData;
  const html = buildInflationEmailHtml(data);
  const subject = `ERPIDE Gerçek Enflasyon Raporu — ${periodLabel(run.period)}`;

  let sent = 0, failed = 0;
  for (const sub of subscribers) {
    try {
      const { error } = await resend.emails.send({ from, to: sub.email, subject, html });
      if (error) throw error;
      sent++;
    } catch (e) {
      console.error("[enflasyon] mail gönderilemedi:", sub.email, e);
      failed++;
    }
  }

  await getPrisma().inflationRun.update({
    where: { id: runId },
    data: { sentAt: new Date(), sentCount: sent },
  });
  return { sent, failed };
}
