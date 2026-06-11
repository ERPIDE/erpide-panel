/**
 * PocketERPIDE data shape mirror — backend tarafı.
 *
 * Mobile app C:\tmp\pocketerpide-mobile\src\lib\types.ts içinde bu yapıyı tutar
 * ve /api/pocket/sync ile push/pull eder. Backend tarafında bill-finder gibi
 * fonksiyonlar bu shape üzerinde çalışıyor; mobile schema'sı değişirse buraya
 * da yansıt.
 *
 * NOT: Tüm alanlar partial/optional değil — bill-finder defensive (default ??
 * [] kullanır) ama tip için truthful tutuyoruz.
 */

export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  date: string;
  cardId?: string;
}

export interface SalaryInfo {
  gross: number;
  net: number;
  payDay?: number;
  effectiveFrom?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  last4: string;
  limit: number;
  statementDay: number;
  dueDay: number;
  interestRate: number;
}

export interface CardStatement {
  id: string;
  cardId: string;
  period: string;          // YYYY-MM
  totalSpent: number;
  minimumPayment: number;
  totalDue: number;
  paidAmount: number;
  interestCharged: number;
  paidDate?: string;
}

export interface Loan {
  id: string;
  name: string;
  lender: string;
  principal: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;       // YYYY-MM-DD
  termMonths: number;
  type: "konut" | "tasit" | "ihtiyac" | "kobi" | "diger";
}

export interface LoanPayment {
  id: string;
  loanId: string;
  period: string;          // YYYY-MM
  principalPart: number;
  interestPart: number;
  totalPaid: number;
  paidDate: string;
}

export interface RecurringTx {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
  cardId?: string;
}

export interface PocketData {
  txs: Transaction[];
  salary: SalaryInfo | null;
  cards: CreditCard[];
  statements: CardStatement[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  recurring: RecurringTx[];
  // Diğer alanlar (goals, bigItems, investments, investmentReturns) bill-finder
  // için gerekmiyor — sync endpoint shape'i daha geniş ama burada minimum tut.
}
