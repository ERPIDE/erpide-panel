/**
 * Unit tests for pocket-bill-finder.
 *
 * Çalıştır:  npx tsx src/lib/pocket-bill-finder.test.ts
 */
import assert from "node:assert/strict";
import { findUpcomingBills, buildNotificationContent } from "./pocket-bill-finder";
import type { PocketData } from "./pocket-types";

let passed = 0, failed = 0;
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.error(`  ✗ ${name}\n    ${e instanceof Error ? e.message : String(e)}`); }
}

function emptyData(): PocketData {
  return { txs: [], salary: null, cards: [], statements: [], loans: [], loanPayments: [], recurring: [] };
}

console.log("\n=== findUpcomingBills — recurring ===");

test("dayOfMonth eşleşmesi → bill döner", () => {
  const data = emptyData();
  data.recurring = [
    { id: "r1", type: "expense", amount: 5000, category: "Kira",
      note: "Ev Kirası", dayOfMonth: 15, startDate: "2026-01-01" },
  ];
  const now = new Date(Date.UTC(2026, 5, 14)); // Haziran 14 → yarın 15
  const r = findUpcomingBills(data, now, 1);
  assert.ok(r, "summary olmalıydı");
  assert.equal(r!.bills.length, 1);
  assert.equal(r!.bills[0].label, "Ev Kirası");
  assert.equal(r!.totalAmount, 5000);
});

test("gelir (income) atlanır, sadece expense", () => {
  const data = emptyData();
  data.recurring = [
    { id: "r1", type: "income", amount: 12000, category: "Maaş",
      note: "Maaş", dayOfMonth: 15, startDate: "2026-01-01" },
  ];
  const now = new Date(Date.UTC(2026, 5, 14));
  const r = findUpcomingBills(data, now, 1);
  assert.equal(r, null);
});

test("endDate geçmişse atlanır", () => {
  const data = emptyData();
  data.recurring = [
    { id: "r1", type: "expense", amount: 500, category: "Spor",
      note: "Salon", dayOfMonth: 15, startDate: "2025-01-01", endDate: "2026-04-01" },
  ];
  const now = new Date(Date.UTC(2026, 5, 14));
  const r = findUpcomingBills(data, now, 1);
  assert.equal(r, null);
});

console.log("\n=== findUpcomingBills — loan ===");

test("Aktif loan + bugün taksit günü = yarın → bill", () => {
  const data = emptyData();
  data.loans = [
    { id: "l1", name: "İhtiyaç Kredisi", lender: "Garanti",
      principal: 50000, interestRate: 35, monthlyPayment: 4500,
      startDate: "2026-01-15", termMonths: 12, type: "ihtiyac" },
  ];
  const now = new Date(Date.UTC(2026, 5, 14));
  const r = findUpcomingBills(data, now, 1);
  assert.ok(r);
  assert.equal(r!.bills.length, 1);
  assert.equal(r!.bills[0].kind, "loan");
  assert.equal(r!.totalAmount, 4500);
});

test("Bu ay zaten ödenmiş taksit → atlanır", () => {
  const data = emptyData();
  data.loans = [
    { id: "l1", name: "Konut", lender: "Garanti",
      principal: 100000, interestRate: 25, monthlyPayment: 8000,
      startDate: "2026-01-15", termMonths: 60, type: "konut" },
  ];
  data.loanPayments = [
    { id: "lp1", loanId: "l1", period: "2026-06",
      principalPart: 7000, interestPart: 1000, totalPaid: 8000, paidDate: "2026-06-15" },
  ];
  const now = new Date(Date.UTC(2026, 5, 14));
  const r = findUpcomingBills(data, now, 1);
  assert.equal(r, null);
});

test("Vade dolmuş loan → atlanır", () => {
  const data = emptyData();
  data.loans = [
    { id: "l1", name: "Eski Kredi", lender: "Yapı Kredi",
      principal: 30000, interestRate: 30, monthlyPayment: 3000,
      startDate: "2025-01-15", termMonths: 12, type: "tasit" }, // 12 ay → 2026-01-15'te bitmiş
  ];
  const now = new Date(Date.UTC(2026, 5, 14));
  const r = findUpcomingBills(data, now, 1);
  assert.equal(r, null);
});

console.log("\n=== findUpcomingBills — card ===");

test("Open statement + dueDay yarın → bill", () => {
  const data = emptyData();
  data.cards = [
    { id: "c1", name: "Bonus", last4: "1234", limit: 30000,
      statementDay: 5, dueDay: 25, interestRate: 4.5 },
  ];
  data.statements = [
    { id: "s1", cardId: "c1", period: "2026-06",
      totalSpent: 8500, minimumPayment: 850, totalDue: 8500,
      paidAmount: 0, interestCharged: 0 },
  ];
  const now = new Date(Date.UTC(2026, 5, 24)); // 24 Haziran → yarın 25
  const r = findUpcomingBills(data, now, 1);
  assert.ok(r);
  assert.equal(r!.bills.length, 1);
  assert.equal(r!.bills[0].kind, "card");
  assert.equal(r!.totalAmount, 8500);
});

test("Ödenmiş statement → atlanır", () => {
  const data = emptyData();
  data.cards = [
    { id: "c1", name: "Bonus", last4: "1234", limit: 30000,
      statementDay: 5, dueDay: 25, interestRate: 4.5 },
  ];
  data.statements = [
    { id: "s1", cardId: "c1", period: "2026-06",
      totalSpent: 8500, minimumPayment: 850, totalDue: 8500,
      paidAmount: 8500, interestCharged: 0, paidDate: "2026-06-20" },
  ];
  const now = new Date(Date.UTC(2026, 5, 24));
  const r = findUpcomingBills(data, now, 1);
  assert.equal(r, null);
});

console.log("\n=== findUpcomingBills — combined ===");

test("3 farklı kaynak aynı gün → tek summary'de toplanır", () => {
  const data = emptyData();
  data.recurring = [
    { id: "r1", type: "expense", amount: 5000, category: "Kira",
      note: "Ev Kirası", dayOfMonth: 25, startDate: "2026-01-01" },
  ];
  data.loans = [
    { id: "l1", name: "İhtiyaç", lender: "İş Bankası",
      principal: 20000, interestRate: 30, monthlyPayment: 2200,
      startDate: "2026-02-25", termMonths: 12, type: "ihtiyac" },
  ];
  data.cards = [
    { id: "c1", name: "Maximum", last4: "9999", limit: 25000,
      statementDay: 10, dueDay: 25, interestRate: 4.5 },
  ];
  data.statements = [
    { id: "s1", cardId: "c1", period: "2026-06",
      totalSpent: 3300, minimumPayment: 330, totalDue: 3300,
      paidAmount: 0, interestCharged: 0 },
  ];
  const now = new Date(Date.UTC(2026, 5, 24));
  const r = findUpcomingBills(data, now, 1);
  assert.ok(r);
  assert.equal(r!.bills.length, 3);
  assert.equal(r!.totalAmount, 5000 + 2200 + 3300);
});

console.log("\n=== buildNotificationContent ===");

test("Tek bill → 'Yarın bir ödemen var'", () => {
  const c = buildNotificationContent({
    date: "2026-06-15",
    totalAmount: 5000,
    bills: [{ kind: "recurring", dueDate: "2026-06-15", amount: 5000, label: "Kira", sourceId: "r1" }],
  });
  assert.equal(c.title, "Yarın bir ödemen var");
  assert.equal(c.body, "Kira");
});

test("3 bill + total → başlıkta tutar gözükür", () => {
  const c = buildNotificationContent({
    date: "2026-06-15",
    totalAmount: 10500,
    bills: [
      { kind: "recurring", dueDate: "2026-06-15", amount: 5000, label: "Kira", sourceId: "r1" },
      { kind: "loan",      dueDate: "2026-06-15", amount: 3000, label: "Konut taksit", sourceId: "l1" },
      { kind: "card",      dueDate: "2026-06-15", amount: 2500, label: "Bonus ****1234", sourceId: "c1" },
    ],
  });
  assert.ok(c.title.includes("3 ödemen"));
  assert.ok(c.title.includes("10.500"));
  assert.equal(c.body, "Kira · Konut taksit · Bonus ****1234");
});

test("5 bill → '+2 daha'", () => {
  const c = buildNotificationContent({
    date: "2026-06-15",
    totalAmount: 1500,
    bills: [
      { kind: "recurring", dueDate: "2026-06-15", amount: 300, label: "A", sourceId: "1" },
      { kind: "recurring", dueDate: "2026-06-15", amount: 300, label: "B", sourceId: "2" },
      { kind: "recurring", dueDate: "2026-06-15", amount: 300, label: "C", sourceId: "3" },
      { kind: "recurring", dueDate: "2026-06-15", amount: 300, label: "D", sourceId: "4" },
      { kind: "recurring", dueDate: "2026-06-15", amount: 300, label: "E", sourceId: "5" },
    ],
  });
  assert.ok(c.body.includes("+2 daha"), `body was: ${c.body}`);
});

console.log(`\n=== Sonuç: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
