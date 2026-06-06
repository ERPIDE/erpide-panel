/**
 * PocketERPIDE — veri modeli + localStorage helper.
 *
 * MVP'de tüm veriler tarayıcıda. Abonelik açıldığında finanserpide tenant
 * DB'sine taşınır (her ay snapshot + audit log). Aynı shape'i koruyoruz ki
 * geçiş zamanı hiç bir UI değişmeden çalışsın.
 */

export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO YYYY-MM-DD
  /** Bir kredi kartından harcandıysa onun id'si. Otomatik gider olmaz (kart ödenince fiili gider o ay olur). */
  cardId?: string;
}

export interface SalaryInfo {
  gross: number;
  net: number;
  /** Her ayın bu gününde otomatik maaş geliri sayılır (default 1). */
  payDay?: number;
}

export interface SavingsGoal {
  target: number;
  deadline: string; // ISO date
  title?: string;
}

export interface CreditCard {
  id: string;
  name: string;          // örn: "Garanti Bonus"
  last4: string;         // **** 1234
  limit: number;
  statementDay: number;  // hesap kesim günü (1-28)
  dueDay: number;        // son ödeme günü
  interestRate: number;  // aylık faiz %
  color?: string;        // UI rengi (tailwind class)
}

/** Aylık kart ekstresi — kullanıcı manuel ya da otomatik kayıt ekler. */
export interface CardStatement {
  id: string;
  cardId: string;
  period: string;          // "2026-06"
  totalSpent: number;      // o ay yapılan toplam harcama
  minimumPayment: number;  // bankadan asgari ödeme tutarı
  totalDue: number;        // toplam borç
  paidAmount: number;      // gerçekten ödediğin tutar
  interestCharged: number; // bankanın işlettiği faiz
  paidDate?: string;       // ödeme tarihi
}

export interface Loan {
  id: string;
  name: string;             // örn: "Garanti Konut Kredisi"
  lender: string;           // banka
  principal: number;        // çekilen anapara
  interestRate: number;     // aylık faiz %
  monthlyPayment: number;   // sabit aylık ödeme
  startDate: string;        // başlangıç tarihi (ISO)
  termMonths: number;       // toplam ay sayısı
  type: "konut" | "tasit" | "ihtiyac" | "kobi" | "diger";
}

export interface LoanPayment {
  id: string;
  loanId: string;
  period: string;        // "2026-06"
  principalPart: number; // anapara kısmı
  interestPart: number;  // faiz kısmı
  totalPaid: number;     // ikisinin toplamı
  paidDate: string;
}

export type BigItemCategory = "vehicle" | "phone" | "electronics" | "property" | "furniture" | "jewelry" | "other";

export interface BigItem {
  id: string;
  category: BigItemCategory;
  name: string;        // örn: "Renault Megane 2024"
  purchasePrice: number;
  purchaseDate: string;
  /** Eğer satıldıysa */
  soldPrice?: number;
  soldDate?: string;
  notes?: string;
}

export interface PocketData {
  txs: Transaction[];
  salary: SalaryInfo | null;
  goals: SavingsGoal[];
  cards: CreditCard[];
  statements: CardStatement[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  bigItems: BigItem[];
}

const STORAGE_KEY = "pocket:v2";

export const EMPTY: PocketData = {
  txs: [], salary: null, goals: [], cards: [], statements: [], loans: [], loanPayments: [], bigItems: [],
};

export function loadData(): PocketData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Eski v1 verisini taşı (sadece txs/salary/goal vardı)
      const oldTxs = localStorage.getItem("pocket:txs");
      const oldSal = localStorage.getItem("pocket:salary");
      const oldGoal = localStorage.getItem("pocket:goal");
      const migrated: PocketData = {
        ...EMPTY,
        txs: oldTxs ? JSON.parse(oldTxs) : [],
        salary: oldSal ? JSON.parse(oldSal) : null,
        goals: oldGoal ? [JSON.parse(oldGoal)] : [],
      };
      return migrated;
    }
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

export function saveData(d: PocketData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function periodOf(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function fmt(n: number): string {
  return `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function periodLabel(period: string): string {
  const [y, m] = period.split("-");
  const months = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

/** "2026-06" → bir önceki ay "2026-05" */
export function prevPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** "2026-06" → bir sonraki ay "2026-07" */
export function nextPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function currentPeriod(): string {
  return periodOf(new Date());
}

export const TX_CATEGORIES = {
  income:  ["Maaş", "Ek Gelir", "Kira Geliri", "Yatırım Getirisi", "Satış (Big Item)", "Diğer"],
  expense: ["Market", "Kira", "Fatura", "Ulaşım", "Yemek", "Sağlık", "Eğlence", "Giyim", "Eğitim", "Kart Ödemesi", "Kredi Taksiti", "Big Item Alım", "Diğer"],
} as const;

export const BIG_ITEM_LABEL: Record<BigItemCategory, string> = {
  vehicle:     "Araç",
  phone:       "Telefon",
  electronics: "Elektronik",
  property:    "Gayrimenkul",
  furniture:   "Mobilya",
  jewelry:     "Ziynet",
  other:       "Diğer",
};

export const LOAN_TYPE_LABEL: Record<Loan["type"], string> = {
  konut:   "Konut Kredisi",
  tasit:   "Taşıt Kredisi",
  ihtiyac: "İhtiyaç Kredisi",
  kobi:    "KOBİ Kredisi",
  diger:   "Diğer",
};

/** Bir kredinin belirli bir periyottaki kalan anaparasını hesaplar (basit annuite). */
export function loanRemainingPrincipal(loan: Loan, asOfPeriod: string, payments: LoanPayment[]): number {
  const paidThisLoan = payments
    .filter((p) => p.loanId === loan.id && p.period <= asOfPeriod)
    .reduce((s, p) => s + p.principalPart, 0);
  return Math.max(0, loan.principal - paidThisLoan);
}
