/**
 * pdfAccuracyEngine.ts
 *
 * Modular accuracy enhancements for BudgetLens PDF parsing.
 * Implements:
 *   - Mathematical Self-Healing Reconciler (income/expense auto-correction)
 *   - Per-bank Noise Quarantine (ignores header/footer noise lines)
 *   - Opening Balance Seeder (seeds the prevBalance chain from "Balance Brought Forward")
 *   - SG-specific multi-line narration title extractor
 *   - unrecognizedCount helper
 *
 * IMPORTANT: This module intentionally delegates currency parsing to
 * `parseCleanFinancialAmount` and date normalisation to `normalizeDateUniversal`
 * from bankTemplates.ts — both of which are more robust than equivalent
 * implementations in the external reference.
 */

import { Transaction, TransactionType } from '../types/finance';
import { parseCleanFinancialAmount } from './bankTemplates';

// ============================================================================
// INTERFACES
// ============================================================================

export interface MathReconciliationReport {
  is100PercentVerified: boolean;
  openingBalance?: number;
  closingBalance?: number;
  totalRowsVerified: number;
  discrepancies: Array<{
    rowIndex: number;
    date: string;
    expectedBalance: number;
    actualBalance: number;
    diff: number;
  }>;
}

/**
 * Optional extension fields for BankTemplate (in bankTemplates.ts).
 * Used to drive per-bank noise quarantine and opening-balance detection.
 */
export interface BankTemplatePdfExtensions {
  noisePatterns?: RegExp[];
  balanceBroughtForwardKeywords?: RegExp[];
}

// ============================================================================
// PER-BANK PDF EXTENSION DATA
// Covers the 3 primary SG banks with precise noise patterns,
// plus a generic_global fallback for all other banks.
// ============================================================================

export const BANK_PDF_EXTENSIONS: Record<string, BankTemplatePdfExtensions> = {
  dbs_posb: {
    noisePatterns: [
      /^Transaction\s+Details/i,
      /^Deposits$/i,
      /^Account\s+No\b/i,
      /POSB\s+eEveryday\s+Savings\s+Account/i,
      /DBS\s+Multiplier\s+Account/i,
      /^Page\s+\d+\s+of\s+\d+/i,
      /^Total$/i,
      /^Balance\s+Carried\s+Forward/i,
      /^Currency:/i,
    ],
    balanceBroughtForwardKeywords: [
      /^Balance\s+Brought\s+Forward$/i,
    ],
  },

  ocbc: {
    noisePatterns: [
      /^Account\s+No\b/i,
      /^Page\s+\d+\b/i,
      /^BALANCE\s+C\/F/i,
    ],
    balanceBroughtForwardKeywords: [
      /^(BALANCE\s+B\/F|Balance\s+Brought\s+Forward)$/i,
    ],
  },

  uob: {
    noisePatterns: [
      /^Account\s+Number\b/i,
      /^Page\s+\d+\b/i,
      /^Sub-Total$/i,
    ],
    balanceBroughtForwardKeywords: [
      /^(Balance\s+Brought\s+Forward|PREVIOUS\s+BALANCE)$/i,
    ],
  },

  // Universal safe defaults for all other 14+ global banks
  generic_global: {
    noisePatterns: [
      /^Page\s+\d+(\s*of\s*\d+)?$/i,
      /^Continued\s+on\s+next\s+page/i,
      /^Statement\s+of\s+Account$/i,
      /^Closing\s+Balance$/i,
    ],
    balanceBroughtForwardKeywords: [
      /^(Balance\s+Brought\s+Forward|Opening\s+Balance|Beginning\s+Balance|Previous\s+Balance|B\/F)$/i,
    ],
  },
};

// ============================================================================
// MODULE A: NOISE QUARANTINE
// ============================================================================

/**
 * Returns the merged extension config for a given bankId, falling back to
 * generic_global for any bank not explicitly listed.
 */
export function getBankPdfExtension(bankId?: string): BankTemplatePdfExtensions {
  const specific = bankId ? (BANK_PDF_EXTENSIONS[bankId] ?? {}) : {};
  const global = BANK_PDF_EXTENSIONS.generic_global;
  return {
    noisePatterns: [
      ...(specific.noisePatterns ?? []),
      ...(global.noisePatterns ?? []),
    ],
    balanceBroughtForwardKeywords: [
      ...(specific.balanceBroughtForwardKeywords ?? []),
      ...(global.balanceBroughtForwardKeywords ?? []),
    ],
  };
}

/**
 * Checks if a visual line of text is header/footer noise that should be
 * quarantined (skipped) before transaction parsing.
 *
 * Call this at the TOP of your lineMap.forEach() loop, before any other logic.
 */
export function isQuarantinedNoiseLine(lineText: string, bankId?: string): boolean {
  const ext = getBankPdfExtension(bankId);
  const trimmed = lineText.trim();
  return (ext.noisePatterns ?? []).some((rx) => rx.test(trimmed));
}

// ============================================================================
// MODULE B: OPENING BALANCE SEEDER
// ============================================================================

/**
 * Checks if a line is a "Balance Brought Forward" / "Opening Balance" row and
 * extracts the seed amount from it.
 *
 * Uses your existing `parseCleanFinancialAmount` for reliable currency parsing
 * across all supported locales (including Indian Lakh format).
 *
 * @param lineText  Full joined text of the line
 * @param lineTokenStrings  Individual token strings in the line (in X order)
 * @param bankId  Detected bank template ID
 * @returns The opening balance amount, or undefined if not a B/F line
 */
export function extractOpeningBalanceFromLine(
  lineText: string,
  lineTokenStrings: string[],
  bankId?: string
): number | undefined {
  const ext = getBankPdfExtension(bankId);
  const trimmed = lineText.trim();

  const isBalanceLine = (ext.balanceBroughtForwardKeywords ?? []).some((rx) =>
    rx.test(trimmed)
  );
  if (!isBalanceLine) return undefined;

  // Walk tokens right-to-left to find the rightmost valid currency value
  // (the balance is always the last numeric column on the row)
  for (let i = lineTokenStrings.length - 1; i >= 0; i--) {
    const parsed = parseCleanFinancialAmount(lineTokenStrings[i]);
    if (parsed.amount > 0) {
      return parsed.amount;
    }
  }

  return undefined;
}

// ============================================================================
// MODULE C: MATHEMATICAL SELF-HEALING RECONCILER
// ============================================================================

/**
 * Drop-in replacement / upgrade for `reconcileRunningBalances()` in bankTemplates.ts.
 *
 * Beyond flagging discrepancies, this function actively self-heals transactions
 * where `income` vs `expense` was mis-classified by the spatial parser:
 *
 *   If tx.type === 'income' but prevBalance - tx.amount === tx.runningBalance
 *   → the amount actually came OUT of the account → flip to 'expense'.
 *
 *   If tx.type === 'expense' but prevBalance + tx.amount === tx.runningBalance
 *   → the amount actually came IN to the account → flip to 'income'.
 *
 * Tolerance: 0.009 (sub-cent, avoids floating-point drift from PDF rounding).
 *
 * @param transactions  The parsed transaction array (mutated in-place for type fixes)
 * @param openingBalance  Optional seed balance from "Balance Brought Forward" line
 */
export function healAndReconcileTransactions(
  transactions: Transaction[],
  openingBalance?: number
): {
  transactions: Transaction[];
  reconciliation: MathReconciliationReport;
  balanceDiscrepancyCount: number;
} {
  const reconciliation: MathReconciliationReport = {
    is100PercentVerified: true,
    openingBalance,
    closingBalance:
      transactions.length > 0
        ? transactions[transactions.length - 1].runningBalance
        : openingBalance,
    totalRowsVerified: 0,
    discrepancies: [],
  };

  let prevBal = openingBalance;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];

    // Only reconcile if we have a running balance chain to compare against
    if (prevBal !== undefined && tx.runningBalance !== undefined && tx.runningBalance > 0) {
      const expectedIfExpense = roundCents(prevBal - tx.amount);
      const expectedIfIncome = roundCents(prevBal + tx.amount);

      // Self-Heal Case 1: Classified as income, but balance went DOWN by this amount
      if (
        tx.type === 'income' &&
        Math.abs(expectedIfExpense - tx.runningBalance) < 0.009 &&
        Math.abs(expectedIfIncome - tx.runningBalance) >= 0.009
      ) {
        tx.type = 'expense';
        // Re-assign category if it was auto-assigned from 'Salary'
        if (tx.category === 'Salary') {
          tx.category = 'General';
        }
      }
      // Self-Heal Case 2: Classified as expense, but balance went UP by this amount
      else if (
        tx.type === 'expense' &&
        Math.abs(expectedIfIncome - tx.runningBalance) < 0.009 &&
        Math.abs(expectedIfExpense - tx.runningBalance) >= 0.009
      ) {
        tx.type = 'income';
        if (tx.category === 'General') {
          tx.category = 'Salary';
        }
      }

      // Now check the (potentially healed) balance
      const signedDelta = tx.type === 'income' ? tx.amount : -tx.amount;
      const expectedBalance = roundCents(prevBal + signedDelta);
      const diff = roundCents(tx.runningBalance - expectedBalance);

      if (Math.abs(diff) >= 0.01) {
        reconciliation.is100PercentVerified = false;
        // Mark on the transaction for UI display
        tx.balanceMismatch = true;
        tx.expectedBalance = expectedBalance;
        reconciliation.discrepancies.push({
          rowIndex: i,
          date: tx.date,
          expectedBalance,
          actualBalance: tx.runningBalance,
          diff,
        });
      } else {
        // Clear any stale mismatch flag from prior reconcile calls
        tx.balanceMismatch = false;
        reconciliation.totalRowsVerified++;
      }
    }

    if (tx.runningBalance !== undefined && tx.runningBalance > 0) {
      prevBal = tx.runningBalance;
    }
  }

  reconciliation.closingBalance = prevBal;

  return {
    transactions,
    reconciliation,
    balanceDiscrepancyCount: reconciliation.discrepancies.length,
  };
}

// ============================================================================
// MODULE D: UNRECOGNIZED COUNT
// ============================================================================

/**
 * Counts transactions where the auto-categorizer fell back to 'General'.
 * Used to drive the "X transactions could not be categorized" UI warning.
 */
export function countUnrecognizedTransactions(transactions: Transaction[]): number {
  return transactions.filter(
    (tx) => !tx.category || tx.category === 'General' || tx.category === 'Uncategorized'
  ).length;
}

// ============================================================================
// MODULE E: SG MULTI-LINE NARRATION TITLE EXTRACTOR
// ============================================================================

/**
 * Extracts a clean merchant title, forex note, and reference ID from a DBS/POSB/OCBC/UOB
 * multi-line narration block.
 *
 * This is designed to run BEFORE `smartCleanBankTitle()` (which handles the final
 * polish). Here we parse the STRUCTURAL multi-line patterns (FAST Payment has
 * FROM:/TO: on line 3, Debit Card has merchant on line 2, etc.).
 *
 * Returns:
 *  - `rawTitle`: the best single-line title extracted from the lines
 *  - `note`: FX currency note if detected (e.g. "FX: USD 24.00")
 *  - `ref`: reference/transaction ID if found
 */
export function extractSgNarrationTitle(
  lines: string[],
  type: TransactionType
): { rawTitle: string; note: string; ref: string } {
  if (lines.length === 0) {
    return { rawTitle: 'Transaction', note: '', ref: '' };
  }

  const fullText = lines.join(' | ');
  const line1 = lines[0] || '';
  const line2 = lines[1] || '';
  const line3 = lines[2] || '';

  let rawTitle = line1; // safe default
  let note = '';
  let ref = '';

  // Detect foreign currency note (e.g. "USD24.00", "GBP 12.50")
  const fxMatch = fullText.match(
    /\b(USD|EUR|GBP|MYR|JPY|AUD|CNY|THB|HKD|CAD)\s*(\d+(?:\.\d{1,2})?)\b/i
  );
  if (fxMatch) {
    note = `FX: ${fxMatch[1].toUpperCase()} ${fxMatch[2]}`;
  }

  // 1. FAST Payment / Receipt (PayNow FAST transfers)
  if (/FAST\s+Payment\s*\/\s*Receipt/i.test(line1)) {
    const refMatch = fullText.match(/REF\s+([A-Z0-9]+)/i) ?? fullText.match(/(\d{15,20})/);
    if (refMatch) ref = refMatch[1];

    const fromToLine = lines.find((l) => /^(FROM|TO):\s*/i.test(l));
    if (fromToLine) {
      rawTitle = fromToLine.replace(/^(FROM|TO):\s*/i, '').replace(/\s*-\s*$/, '').trim();
    } else if (/TRUS:|I-BANK/i.test(line2)) {
      rawTitle = line2.replace(/TRUS:/i, 'Trust Bank ').trim();
    } else {
      rawTitle = type === 'income' ? 'FAST / PayNow Inward' : 'FAST / PayNow Outward';
    }
    return { rawTitle, note, ref };
  }

  // 2. Debit Card Transaction — merchant is on line 2
  if (/Debit\s+Card\s+Transaction/i.test(line1)) {
    ref = lines[3] || '';
    rawTitle = line2
      .replace(/\s+(?:SI\s+SGP|[A-Z]{2,3})\s+\d{2}[A-Z]{3}$/i, '')
      .replace(/\s+\d{2}[A-Z]{3}$/i, '')
      .trim();
    return { rawTitle: rawTitle || line2, note, ref };
  }

  // 3. Point-of-Sale / NETS QR
  if (/Point-of-Sale\s+Transaction/i.test(line1)) {
    const toLine = lines.find((l) => /^TO:\s*/i.test(l));
    const netsRef = line2.match(/NETS\s+QR\s+PAYMENT\s+(\S+)/i);
    if (netsRef) ref = netsRef[1];
    rawTitle = toLine ? toLine.replace(/^TO:\s*/i, '').trim() : line2;
    return { rawTitle: rawTitle || line2, note, ref };
  }

  // 4. Funds Transfer (internal or third-party)
  if (/Funds\s+Transfer/i.test(line1)) {
    ref = line2;
    rawTitle = line3 ? `Funds Transfer (${line3})` : 'Internal Funds Transfer';
    return { rawTitle, note, ref };
  }

  // 5. Remittance / Outward Telegraphic Transfer
  if (/Remittance\s+Transfer\s+of\s+Funds/i.test(line1)) {
    ref = line2;
    rawTitle = line3 || line2 || 'Remittance Transfer';
    return { rawTitle, note, ref };
  }

  // 6. GIRO / Advice payments
  if (/^Advice$/i.test(line1)) {
    const refMatch = line2.match(/REF(\S+)/i);
    if (refMatch) ref = refMatch[1];
    rawTitle = line2.replace(/REF\S+/i, '').replace(/^BY\s+/i, '').trim();
    return { rawTitle: rawTitle || line2, note, ref };
  }

  // 7. Service Charge / Bank Fee
  if (/Service\s+Charge/i.test(line1)) {
    return { rawTitle: 'Bank Service Charge', note, ref };
  }

  // 8. Payments via GIRO
  if (/Payments\s*\/\s*Collections\s+via\s+GIRO/i.test(line1)) {
    rawTitle = line2 || line1;
    return { rawTitle, note, ref };
  }

  // 9. Generic: if line2 exists and line1 is a transaction-type label, prefer line2
  const STRUCTURAL_PREFIXES = [
    /^Debit\s+Card\s+Transaction/i,
    /^FAST\s+Payment/i,
    /^Point-of-Sale/i,
    /^Funds\s+Transfer/i,
    /^Remittance/i,
    /^Advice$/i,
    /^Payments\s*\//i,
  ];
  const line1IsStructural = STRUCTURAL_PREFIXES.some((rx) => rx.test(line1));
  if (line1IsStructural && line2) {
    rawTitle = line2;
  }

  return { rawTitle, note, ref };
}

// ============================================================================
// INTERNAL UTILITY
// ============================================================================

function roundCents(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}
