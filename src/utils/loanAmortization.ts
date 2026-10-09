/**
 * @summary Utility module for loan math, banking amortization, and burndown chart projections.
 * Computes chronological daily reducing-balance amortization and monthly payment splits.
 *
 * @ai-directive Keep this utility strictly pure and decoupled from React components.
 * Adhere to SOLID and DRY principles; avoid adding UI logic or creating monolithic functions.
 */

import { Loan, Transaction } from '../types/finance';

export interface AmortizationResult {
  totalPaid: number;
  totalInterest: number;
  totalPrincipal: number;
  remainingBalance: number;
  latestInterest: number;
  latestPrincipal: number;
  latestPayment: number;
  progressPercent: number;
}

export interface BurndownDataPoint {
  month: string;
  Remaining: number;
}

/**
 * Calculates total payments made specifically towards this loan.
 */
export function calculateTotalPaid(
  loan: Loan,
  transactions: Transaction[],
  allLoans: Loan[] = []
): number {
  return transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => {
      // 1. Strict Priority: If transaction has explicit loanAllocations, only use that
      if (tx.loanAllocations !== undefined) {
        const allocatedAmt = tx.loanAllocations[loan.id];
        return sum + (allocatedAmt ? Number(allocatedAmt) : 0);
      }

      // 2. Fallback: Tag-based allocation with proportional sharing
      if (loan.linkedTag && tx.tags?.some(t => t.toLowerCase() === loan.linkedTag.toLowerCase())) {
        const sharingLoans = allLoans.filter(
          l => l.linkedTag.toLowerCase() === loan.linkedTag.toLowerCase()
        );
        if (sharingLoans.length <= 1) {
          return sum + tx.amount;
        }

        const totalTargetPmt = sharingLoans.reduce((acc, l) => {
          const monthly = l.fixedMonthlyPayment || (l.initialPrincipal / (l.termMonths || 12));
          return acc + (monthly > 0 ? monthly : 1);
        }, 0);

        const thisTargetPmt = loan.fixedMonthlyPayment || (loan.initialPrincipal / (loan.termMonths || 12));
        const effectivePmt = thisTargetPmt > 0 ? thisTargetPmt : 1;
        const ratio = totalTargetPmt > 0 ? effectivePmt / totalTargetPmt : 1 / sharingLoans.length;

        return sum + tx.amount * ratio;
      }

      return sum;
    }, 0);
}

/**
 * Filters and sorts payments matching this loan chronologically.
 */
export function getSortedLoanPayments(loan: Loan, transactions: Transaction[]): Transaction[] {
  return transactions
    .filter(tx => {
      if (tx.type !== 'expense') return false;
      if (tx.loanAllocations !== undefined) {
        return Boolean(tx.loanAllocations[loan.id] && tx.loanAllocations[loan.id] > 0);
      }
      return Boolean(loan.linkedTag && tx.tags?.some(t => t.toLowerCase() === loan.linkedTag.toLowerCase()));
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Computes bank-grade reducing balance amortization using the daily rate formula:
 * Interest = (Balance * AnnualRate / 365) * Days
 */
export function calculateLoanAmortization(
  loan: Loan,
  transactions: Transaction[],
  allLoans: Loan[] = [],
  monthlyTarget: number = 0
): AmortizationResult {
  const totalPaid = calculateTotalPaid(loan, transactions, allLoans);
  const loanPayments = getSortedLoanPayments(loan, transactions);
  const annualRate = (loan.interestRate || 0) / 100;
  const term = loan.termMonths || 12;
  const defaultMonthly = loan.fixedMonthlyPayment || (monthlyTarget > 0 ? monthlyTarget : (term > 0 ? loan.initialPrincipal / term : 0));

  if (annualRate === 0) {
    const principalPaid = Math.min(loan.initialPrincipal, totalPaid);
    return {
      totalPaid,
      totalInterest: 0,
      totalPrincipal: principalPaid,
      remainingBalance: Math.max(0, loan.initialPrincipal - totalPaid),
      latestInterest: 0,
      latestPrincipal: defaultMonthly,
      latestPayment: defaultMonthly,
      progressPercent: loan.initialPrincipal > 0 ? Math.min(100, (principalPaid / loan.initialPrincipal) * 100) : 0
    };
  }

  if (loanPayments.length === 0) {
    const singleMonthInterest = loan.initialPrincipal * (annualRate / 12);
    return {
      totalPaid: 0,
      totalInterest: 0,
      totalPrincipal: 0,
      remainingBalance: loan.initialPrincipal,
      latestInterest: singleMonthInterest,
      latestPrincipal: Math.max(0, defaultMonthly - singleMonthInterest),
      latestPayment: defaultMonthly,
      progressPercent: 0
    };
  }

  let balance = loan.initialPrincipal;
  let cumInterest = 0;
  let cumPrincipal = 0;
  let lastMonthlyInterest = 0;
  let lastMonthlyPrincipal = 0;
  let lastPaymentAmount = 0;

  let prevDate = loan.startDate ? new Date(loan.startDate) : new Date(loanPayments[0].date);

  for (let i = 0; i < loanPayments.length; i++) {
    const tx = loanPayments[i];
    let paymentAmt = 0;

    if (tx.loanAllocations !== undefined) {
      paymentAmt = tx.loanAllocations[loan.id] || 0;
    } else if (loan.linkedTag && tx.tags?.some(t => t.toLowerCase() === loan.linkedTag.toLowerCase())) {
      const sharingLoans = allLoans.filter(l => l.linkedTag.toLowerCase() === loan.linkedTag.toLowerCase());
      if (sharingLoans.length <= 1) {
        paymentAmt = tx.amount;
      } else {
        const totalTargetPmt = sharingLoans.reduce((acc, l) => {
          const monthly = l.fixedMonthlyPayment || (l.initialPrincipal / (l.termMonths || 12));
          return acc + (monthly > 0 ? monthly : 1);
        }, 0);
        const thisTargetPmt = loan.fixedMonthlyPayment || (loan.initialPrincipal / (loan.termMonths || 12));
        const effectivePmt = thisTargetPmt > 0 ? thisTargetPmt : 1;
        const ratio = totalTargetPmt > 0 ? effectivePmt / totalTargetPmt : 1 / sharingLoans.length;
        paymentAmt = tx.amount * ratio;
      }
    }

    if (paymentAmt <= 0) continue;

    const curDate = new Date(tx.date);
    let days = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    if (isNaN(days) || days <= 0 || days > 62) {
      days = 30; // standard month cycle fallback
    }
    prevDate = curDate;

    // Bank formula: (Balance * Rate / 365) * Days
    const monthInterest = balance * (annualRate / 365) * days;
    const cappedInterest = Math.min(paymentAmt * 0.95, monthInterest);
    const principalReduced = Math.min(balance, Math.max(0, paymentAmt - cappedInterest));

    cumInterest += cappedInterest;
    cumPrincipal += principalReduced;
    balance = Math.max(0, balance - principalReduced);

    lastMonthlyInterest = cappedInterest;
    lastMonthlyPrincipal = principalReduced;
    lastPaymentAmount = paymentAmt;
  }

  const progressPercent = loan.initialPrincipal > 0
    ? Math.min(100, Math.max(0, (cumPrincipal / loan.initialPrincipal) * 100))
    : 0;

  return {
    totalPaid,
    totalInterest: cumInterest,
    totalPrincipal: cumPrincipal,
    remainingBalance: balance,
    latestInterest: lastMonthlyInterest,
    latestPrincipal: lastMonthlyPrincipal,
    latestPayment: lastPaymentAmount || defaultMonthly,
    progressPercent
  };
}

/**
 * Calculates standard monthly target installment.
 */
export function calculateMonthlyTargetPayment(loan: Loan): number {
  if (loan.fixedMonthlyPayment && loan.fixedMonthlyPayment > 0) {
    return loan.fixedMonthlyPayment;
  }
  const term = loan.termMonths || 12;
  const monthlyRate = ((loan.interestRate || 0) / 100) / 12;

  if (monthlyRate === 0) return loan.initialPrincipal / term;
  const factor = Math.pow(1 + monthlyRate, term);
  const pmt = (loan.initialPrincipal * monthlyRate * factor) / (factor - 1);
  return isNaN(pmt) || !isFinite(pmt) ? loan.initialPrincipal / term : pmt;
}

/**
 * Generates burndown data points for projection chart.
 */
export function generateBurndownData(
  loan: Loan,
  monthlyTargetPayment: number
): BurndownDataPoint[] {
  const data: BurndownDataPoint[] = [];
  const initial = loan.initialPrincipal || 0;
  const term = loan.termMonths || 12;
  const pmt = monthlyTargetPayment;
  const monthlyRate = ((loan.interestRate || 0) / 100) / 12;

  let currentBalance = initial;
  const startDateRaw = new Date(loan.startDate);
  const start = isNaN(startDateRaw.getTime()) ? new Date() : startDateRaw;

  for (let i = 0; i <= term; i++) {
    if (currentBalance < 0 && i > 0) break;

    const d = new Date(start);
    d.setMonth(d.getMonth() + i);

    data.push({
      month: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      Remaining: Math.round(Math.max(0, currentBalance))
    });

    const interest = currentBalance * monthlyRate;
    const principal = pmt - interest;
    currentBalance -= principal;
  }

  return data;
}
