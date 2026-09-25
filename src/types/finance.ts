export type TransactionType = 'income' | 'expense' | 'savings';

export type CategoryKey = string;

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  color: string;
  icon: string;
  type: TransactionType;
  keywords: string[];
  tags?: string[];
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  amount: number;
  type: TransactionType;
  category: CategoryKey;
  isRecurring?: boolean;
  note?: string;
  source?: string;
  tags?: string[];
  loanAllocations?: Record<string, number>; // loanId -> allocated amount
  runningBalance?: number;
  balanceMismatch?: boolean;
  expectedBalance?: number;
}

export interface CategoryRunway {
  category: CategoryKey;
  label: string;
  color: string;
  icon: string;
  monthlyBurn: number;
  remainingMonths: number;
  percentageOfSpend: number;
}

export interface FinanceSummary {
  initialBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalBalance: number;
  overallMonthlyBurn: number;
  overallRunwayMonths: number;
  safeWeeklySpend: number;
  categoryRunways: CategoryRunway[];
  hasMinimumDataForRunway: boolean;
  daysRecorded: number;
}

export type TimeframeFilter = '1M' | '3M' | '1Y' | 'ALL';
export type ViewTab = 'Day' | 'Week' | 'Month';

export interface CategoryAmount {
  category: CategoryKey;
  amount: number;
  color: string;
}

export interface ChartBucket {
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  totalInflow: number;
  totalOutflow: number;
  inflowCategories: CategoryAmount[];
  outflowCategories: CategoryAmount[];
}

export interface Loan {
  id: string;
  name: string;             // e.g. "Student Loan"
  initialPrincipal: number; // e.g. 50000
  interestRate: number;     // Annual % (e.g. 4.5)
  startDate: string;        // YYYY-MM-DD
  termMonths: number;       // e.g. 60 months
  linkedTag: string;        // e.g. "edu-loan" (matches transaction tags)
  fixedMonthlyPayment?: number; 
}
