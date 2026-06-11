/**
 * Yaklaşan ödemeler bulucu.
 *
 * Verilen PocketData içinden hedef tarih penceresinde (default: yarın) vadesi
 * olan ödemeleri çıkarır. 3 kaynak:
 *   1. RecurringTx — her ayın `dayOfMonth`'ı, type="expense" olanlar
 *   2. Loan       — aylık taksit (startDate + her ay aynı gün, paid değilse)
 *   3. CreditCard — `dueDay` (ay içinde) — eğer kart için open statement varsa
 *
 * Tek bir push mesajı üretmek için her kullanıcıya summary döner (ör. "Yarın
 * 3 ödeme: 2.500 TL — Kira, İnternet, Garanti Kart"). Tek tek notification
 * spam olmasın.
 */

import type {
  PocketData, RecurringTx, Loan, CreditCard, CardStatement, LoanPayment,
} from "./pocket-types";

export interface UpcomingBill {
  kind: "recurring" | "loan" | "card";
  /** Yaklaşan ödeme tarihi (YYYY-MM-DD). */
  dueDate: string;
  /** Tutar — bilinmiyorsa 0 */
  amount: number;
  /** Kullanıcıya gösterilecek başlık ("Kira", "Garanti Kart", "Konut Kredisi"). */
  label: string;
  /** Kaynak kayıt id'si (debug + deep-link). */
  sourceId: string;
}

/* ---------------- Date helpers ---------------- */

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayOfMonthFromIso(iso: string): number {
  return parseInt(iso.slice(8, 10), 10);
}

function clampDayInMonth(year: number, month: number, day: number): Date {
  // month 1-12. Ay sonundaki overflow için: 31 Şubat → 28/29 Şubat.
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate(); // month is 1-based; new Date(y, m, 0) = last day of m-1 (0-based)
  // Wait — JS Date constructor: month is 0-based. new Date(2026, 1, 0) → Jan 31. So for "last day of month X (1-based)", use new Date(year, X, 0).
  const safeDay = Math.min(day, lastDay);
  return new Date(Date.UTC(year, month - 1, safeDay));
}

/* ---------------- Source extractors ---------------- */

function recurringForTargetDate(recurring: RecurringTx[], target: Date): UpcomingBill[] {
  const targetDay = target.getUTCDate();
  const targetIso = isoDate(target);
  const out: UpcomingBill[] = [];

  for (const r of recurring) {
    if (r.type !== "expense") continue;
    if (r.dayOfMonth !== targetDay) continue;
    // Aktiflik kontrolü: startDate ≤ target ve (endDate yok veya endDate ≥ target)
    if (r.startDate > targetIso) continue;
    if (r.endDate && r.endDate < targetIso) continue;
    out.push({
      kind: "recurring",
      dueDate: targetIso,
      amount: r.amount,
      label: r.note || r.category,
      sourceId: r.id,
    });
  }
  return out;
}

function loanInstallmentForTargetDate(
  loans: Loan[],
  payments: LoanPayment[],
  target: Date,
): UpcomingBill[] {
  const targetIso = isoDate(target);
  const out: UpcomingBill[] = [];
  const targetDay = target.getUTCDate();

  for (const loan of loans) {
    // Taksit günü = startDate'in günü
    const startDay = dayOfMonthFromIso(loan.startDate);
    if (startDay !== targetDay) continue;

    // Vade dolmuş mu? — startDate + termMonths < target ise bittiği farzedilir
    const start = new Date(loan.startDate + "T00:00:00Z");
    const endTime = new Date(Date.UTC(
      start.getUTCFullYear(), start.getUTCMonth() + loan.termMonths, start.getUTCDate(),
    ));
    if (target > endTime) continue;
    if (target < start) continue;

    // Hangi taksit no? Aralık
    const monthsFromStart =
      (target.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (target.getUTCMonth() - start.getUTCMonth());
    if (monthsFromStart < 0 || monthsFromStart >= loan.termMonths) continue;

    // Bu taksit ödenmiş mi? loan.id + period (YYYY-MM) ile kontrol
    const period = targetIso.slice(0, 7);
    const alreadyPaid = payments.some((p) => p.loanId === loan.id && p.period === period);
    if (alreadyPaid) continue;

    out.push({
      kind: "loan",
      dueDate: targetIso,
      amount: loan.monthlyPayment,
      label: `${loan.name} taksit`,
      sourceId: loan.id,
    });
  }
  return out;
}

function cardDueForTargetDate(
  cards: CreditCard[],
  statements: CardStatement[],
  target: Date,
): UpcomingBill[] {
  const targetIso = isoDate(target);
  const period = targetIso.slice(0, 7);
  const targetDay = target.getUTCDate();
  const out: UpcomingBill[] = [];

  for (const card of cards) {
    if (card.dueDay !== targetDay) continue;
    // Aktif ekstre var mı bu period için?
    const stmt = statements.find((s) => s.cardId === card.id && s.period === period);
    if (!stmt) continue;
    if (stmt.paidDate) continue;
    if (stmt.totalDue <= 0) continue;

    out.push({
      kind: "card",
      dueDate: targetIso,
      amount: stmt.totalDue - (stmt.paidAmount ?? 0),
      label: `${card.name} (****${card.last4})`,
      sourceId: card.id,
    });
  }
  return out;
}

/* ---------------- Public API ---------------- */

export interface BillReminderSummary {
  /** Tarih (YYYY-MM-DD) — push body'sinde gösterilen */
  date: string;
  bills: UpcomingBill[];
  totalAmount: number;
}

/**
 * Verilen `now`'a göre YARIN vade olan tüm ödemeleri döner.
 * `daysAhead` ile 2-3 gün öncesi de tetiklenebilir (test için).
 */
export function findUpcomingBills(
  data: PocketData,
  now: Date,
  daysAhead = 1,
): BillReminderSummary | null {
  const target = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead,
  ));

  const bills: UpcomingBill[] = [
    ...recurringForTargetDate(data.recurring ?? [], target),
    ...loanInstallmentForTargetDate(data.loans ?? [], data.loanPayments ?? [], target),
    ...cardDueForTargetDate(data.cards ?? [], data.statements ?? [], target),
  ];

  if (bills.length === 0) return null;

  const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
  return {
    date: isoDate(target),
    bills,
    totalAmount,
  };
}

/**
 * Push notification başlık + body üretimi.
 */
export function buildNotificationContent(summary: BillReminderSummary): {
  title: string;
  body: string;
} {
  const count = summary.bills.length;
  const formatter = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
  const total = formatter.format(summary.totalAmount);

  const labels = summary.bills.map((b) => b.label).slice(0, 3);
  const more = summary.bills.length > 3 ? ` +${summary.bills.length - 3} daha` : "";

  return {
    title: count === 1
      ? "Yarın bir ödemen var"
      : `Yarın ${count} ödemen var (${total})`,
    body: labels.join(" · ") + more,
  };
}

// avoid unused warning if clampDayInMonth unused (currently unused but kept for
// future use in computing next-installment exactly when dueDay > monthMax)
void clampDayInMonth;
