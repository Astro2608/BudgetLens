import { Transaction, TransactionType } from '../types/finance';
import { detectCategoryFromTitle } from '../config/categoryConfig';

export type ColumnRole =
  | 'date'
  | 'description'
  | 'debit'
  | 'credit'
  | 'amount'
  | 'type'
  | 'balance'
  | 'ref'
  | 'ignore';

export interface ColumnMappingConfig {
  dateCol: number;
  descCol: number;
  debitCol?: number | null;
  creditCol?: number | null;
  amountCol?: number | null;
  typeCol?: number | null;
  balanceCol?: number | null;
  refCol?: number | null;
}

export interface BankTemplate {
  id: string;
  name: string;
  currency: string; // e.g. 'INR', 'USD', 'SGD', 'EUR', 'GBP', 'CAD', 'AUD', 'ALL'
  isBuiltIn?: boolean;
  signatureKeywords: string[];
  mapping: ColumnMappingConfig;
}

const STORAGE_KEY = 'budgetlens_saved_bank_templates';

export const BUILT_IN_TEMPLATES: BankTemplate[] = [
  // INR - India
  {
    id: 'sbi',
    name: 'State Bank of India (SBI)',
    currency: 'INR',
    isBuiltIn: true,
    signatureKeywords: ['txn date', 'value date', 'description', 'ref no', 'debit', 'credit', 'balance'],
    mapping: { dateCol: 0, refCol: 3, descCol: 2, debitCol: 4, creditCol: 5, balanceCol: 6 }
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    currency: 'INR',
    isBuiltIn: true,
    signatureKeywords: ['narration', 'chq/ref no', 'withdrawal amt', 'deposit amt', 'closing balance'],
    mapping: { dateCol: 0, descCol: 1, refCol: 2, debitCol: 4, creditCol: 5, balanceCol: 6 }
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    currency: 'INR',
    isBuiltIn: true,
    signatureKeywords: ['value date', 'transaction date', 'cheque no', 'transaction remarks', 'withdrawal amount', 'deposit amount', 'balance'],
    mapping: { dateCol: 1, refCol: 2, descCol: 3, debitCol: 4, creditCol: 5, balanceCol: 6 }
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    currency: 'INR',
    isBuiltIn: true,
    signatureKeywords: ['tran date', 'chq no', 'particulars', 'debit', 'credit', 'balance'],
    mapping: { dateCol: 0, refCol: 2, descCol: 1, debitCol: 3, creditCol: 4, balanceCol: 5 }
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    currency: 'INR',
    isBuiltIn: true,
    signatureKeywords: ['date', 'narration', 'chq/ref no', 'amount', 'dr/cr', 'balance'],
    mapping: { dateCol: 0, descCol: 1, refCol: 2, amountCol: 3, typeCol: 4, balanceCol: 5 }
  },

  // USD - United States / Global
  {
    id: 'chase',
    name: 'JPMorgan Chase Bank',
    currency: 'USD',
    isBuiltIn: true,
    signatureKeywords: ['posting date', 'description', 'amount', 'type', 'balance'],
    mapping: { dateCol: 0, descCol: 1, amountCol: 2, typeCol: 3, balanceCol: 4 }
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    currency: 'USD',
    isBuiltIn: true,
    signatureKeywords: ['date', 'description', 'amount', 'running balance'],
    mapping: { dateCol: 0, descCol: 1, amountCol: 2, balanceCol: 3 }
  },
  {
    id: 'wells_fargo',
    name: 'Wells Fargo',
    currency: 'USD',
    isBuiltIn: true,
    signatureKeywords: ['date', 'check number', 'description', 'withdrawals', 'deposits', 'balance'],
    mapping: { dateCol: 0, refCol: 1, descCol: 2, debitCol: 3, creditCol: 4, balanceCol: 5 }
  },
  {
    id: 'citi_us',
    name: 'Citibank (US)',
    currency: 'USD',
    isBuiltIn: true,
    signatureKeywords: ['date', 'description', 'debit', 'credit', 'balance'],
    mapping: { dateCol: 0, descCol: 1, debitCol: 2, creditCol: 3, balanceCol: 4 }
  },

  // SGD - Singapore
  {
    id: 'dbs_posb',
    name: 'DBS / POSB Bank (Singapore)',
    currency: 'SGD',
    isBuiltIn: true,
    signatureKeywords: ['transaction date', 'reference', 'description', 'debit amount', 'credit amount', 'balance'],
    mapping: { dateCol: 0, refCol: 1, descCol: 2, debitCol: 3, creditCol: 4, balanceCol: 5 }
  },
  {
    id: 'ocbc',
    name: 'OCBC Bank (Singapore)',
    currency: 'SGD',
    isBuiltIn: true,
    signatureKeywords: ['transaction date', 'value date', 'description', 'withdrawals', 'deposits', 'balance'],
    mapping: { dateCol: 0, descCol: 2, debitCol: 3, creditCol: 4, balanceCol: 5 }
  },
  {
    id: 'uob',
    name: 'UOB Bank (Singapore)',
    currency: 'SGD',
    isBuiltIn: true,
    signatureKeywords: ['date', 'transaction details', 'withdrawal', 'deposit', 'balance'],
    mapping: { dateCol: 0, descCol: 1, debitCol: 2, creditCol: 3, balanceCol: 4 }
  },

  // EUR - Eurozone
  {
    id: 'deutsche_bank',
    name: 'Deutsche Bank (Europe)',
    currency: 'EUR',
    isBuiltIn: true,
    signatureKeywords: ['booking date', 'value date', 'payment details', 'debit', 'credit', 'balance'],
    mapping: { dateCol: 0, descCol: 2, debitCol: 3, creditCol: 4, balanceCol: 5 }
  },
  {
    id: 'ing_bank',
    name: 'ING Bank (Europe)',
    currency: 'EUR',
    isBuiltIn: true,
    signatureKeywords: ['date', 'name / description', 'account', 'amount (eur)', 'type', 'notifications'],
    mapping: { dateCol: 0, descCol: 1, refCol: 2, amountCol: 3, typeCol: 4 }
  },

  // GBP - United Kingdom
  {
    id: 'barclays',
    name: 'Barclays Bank (UK)',
    currency: 'GBP',
    isBuiltIn: true,
    signatureKeywords: ['number', 'date', 'account', 'amount', 'sub type', 'memo'],
    mapping: { dateCol: 1, refCol: 0, descCol: 5, amountCol: 3, typeCol: 4 }
  },
  {
    id: 'hsbc_uk',
    name: 'HSBC UK',
    currency: 'GBP',
    isBuiltIn: true,
    signatureKeywords: ['date', 'payment type', 'details', 'paid out', 'paid in', 'balance'],
    mapping: { dateCol: 0, typeCol: 1, descCol: 2, debitCol: 3, creditCol: 4, balanceCol: 5 }
  },

  // Global Standards
  {
    id: 'generic_6col',
    name: 'Standard 6-Column (Date, Ref, Desc, Debit, Credit, Balance)',
    currency: 'ALL',
    isBuiltIn: true,
    signatureKeywords: ['date', 'ref', 'description', 'debit', 'credit', 'balance'],
    mapping: { dateCol: 0, refCol: 1, descCol: 2, debitCol: 3, creditCol: 4, balanceCol: 5 }
  },
  {
    id: 'generic_5col',
    name: 'Standard 5-Column (Date, Desc, Debit, Credit, Balance)',
    currency: 'ALL',
    isBuiltIn: true,
    signatureKeywords: ['date', 'particulars', 'withdrawal', 'deposit', 'balance'],
    mapping: { dateCol: 0, descCol: 1, debitCol: 2, creditCol: 3, balanceCol: 4 }
  }
];

export function getSavedBankTemplates(): BankTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILT_IN_TEMPLATES;
    const parsed: BankTemplate[] = JSON.parse(raw);
    const combined = [...BUILT_IN_TEMPLATES];
    parsed.forEach((custom) => {
      if (!combined.some((t) => t.id === custom.id)) {
        combined.push(custom);
      }
    });
    return combined;
  } catch {
    return BUILT_IN_TEMPLATES;
  }
}

export function getTemplatesForCurrency(currencyCode: string): {
  primaryTemplates: BankTemplate[];
  otherTemplates: BankTemplate[];
  customTemplates: BankTemplate[];
} {
  const all = getSavedBankTemplates();
  const customTemplates = all.filter((t) => !t.isBuiltIn);

  const cur = (currencyCode || 'INR').toUpperCase();
  const primaryTemplates = all.filter(
    (t) => t.isBuiltIn && (t.currency === cur || t.currency === 'ALL')
  );
  const otherTemplates = all.filter(
    (t) => t.isBuiltIn && t.currency !== cur && t.currency !== 'ALL'
  );

  return { primaryTemplates, otherTemplates, customTemplates };
}

export function saveCustomBankTemplate(template: BankTemplate): void {
  try {
    const existing = getSavedBankTemplates().filter((t) => !t.isBuiltIn && t.id !== template.id);
    existing.push({ ...template, isBuiltIn: false });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save bank template', err);
  }
}

export function deleteCustomBankTemplate(templateId: string): void {
  try {
    const existing = getSavedBankTemplates().filter((t) => !t.isBuiltIn && t.id !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to delete bank template', err);
  }
}

/**
 * Universal financial amount cleaner that handles:
 * - Commaless numbers: "42000.00"
 * - Standard comma numbers: "42,000.00"
 * - Indian Lakhs/Crores comma format: "1,42,000.00"
 * - Suffix or parenthesized flags: "42000.00(Cr)", "150.00(Dr)", "42000.00 CR"
 * - Negative amounts: "-42000.00", "(42000.00)"
 */
export function parseCleanFinancialAmount(raw: any): {
  amount: number;
  isCR: boolean;
  isDR: boolean;
  rawNumeric: number;
} {
  if (typeof raw === 'number') {
    return {
      amount: Math.abs(raw),
      isCR: raw > 0,
      isDR: raw < 0,
      rawNumeric: raw
    };
  }

  const str = String(raw || '').trim();
  if (!str) {
    return { amount: 0, isCR: false, isDR: false, rawNumeric: 0 };
  }

  const upper = str.toUpperCase();
  const isCR =
    upper.includes('(CR)') ||
    /\bCR\b/.test(upper) ||
    upper.includes('+') ||
    upper.includes('(CREDIT)') ||
    /\bCREDIT\b/.test(upper);

  const isDR =
    upper.includes('(DR)') ||
    /\bDR\b/.test(upper) ||
    upper.includes('-') ||
    upper.includes('(DEBIT)') ||
    /\bDEBIT\b/.test(upper);

  // Strip currency prefixes, CR/DR flags, and unwanted wrapper characters
  let cleaned = str
    .replace(/SGD|USD|INR|EUR|GBP|JPY|AUD|CAD|MYR|CNY|₹|€|£|¥|\$|RM/gi, '')
    .replace(/\((?:CR|DR|CREDIT|DEBIT|\+|-)\)/gi, '')
    .replace(/\b(?:CR|DR|CREDIT|DEBIT)\b/gi, '')
    .replace(/[^0-9.,-]/g, '')
    .trim();

  // Strip commas (handles standard US/EU 1,000 and Indian Lakhs 1,00,000)
  cleaned = cleaned.replace(/,/g, '');

  const parsed = parseFloat(cleaned);
  const amount = isNaN(parsed) ? 0 : Math.abs(parsed);

  return {
    amount,
    isCR,
    isDR,
    rawNumeric: isNaN(parsed) ? 0 : parsed
  };
}

/**
 * Universal date normalizer: YYYY-MM-DD
 */
export function normalizeDateUniversal(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  const str = raw.trim();

  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  // e.g. 10-Sep-2026 or 10 Sep 2026 or 10/Sep/26
  const textMatch = str.match(/(\d{1,2})[\s/-]([a-zA-Z]{3})[\s/-]?(\d{2,4})?/i);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const month = monthNames[textMatch[2].toLowerCase()] || '01';
    let year = textMatch[3] ? textMatch[3] : `${new Date().getFullYear()}`;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // e.g. DD-MM-YYYY or DD/MM/YYYY
  const numMatch = str.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (numMatch) {
    const p1 = parseInt(numMatch[1], 10);
    const p2 = parseInt(numMatch[2], 10);
    let year = numMatch[3];
    if (year.length === 2) year = `20${year}`;

    // If second number > 12, then format is MM-DD-YYYY
    if (p1 <= 12 && p2 > 12) {
      return `${year}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
    }
    // Default to Indian/UK DD-MM-YYYY
    return `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
  }

  // Try standard Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Reconcile transactions sequentially against running balance
 */
export function reconcileRunningBalances(transactions: Transaction[]): {
  discrepancyCount: number;
} {
  let discrepancyCount = 0;

  for (let i = 1; i < transactions.length; i++) {
    const prev = transactions[i - 1];
    const curr = transactions[i];

    if (
      typeof prev.runningBalance === 'number' &&
      typeof curr.runningBalance === 'number' &&
      curr.runningBalance > 0 &&
      prev.runningBalance > 0
    ) {
      const isDeposit = curr.type === 'income';
      const expectedBalance = isDeposit
        ? prev.runningBalance + curr.amount
        : prev.runningBalance - curr.amount;

      const diff = Math.abs(curr.runningBalance - expectedBalance);
      // Tolerance of 0.05 for rounding differences
      if (diff > 0.05) {
        curr.balanceMismatch = true;
        curr.expectedBalance = expectedBalance;
        discrepancyCount++;
      }
    }
  }

  return { discrepancyCount };
}

/**
 * Parses raw grid rows according to a chosen column mapping configuration
 */
export function parseGridWithMapping(
  rows: string[][],
  mapping: ColumnMappingConfig,
  fileName: string
): Transaction[] {
  const result: Transaction[] = [];

  rows.forEach((row, idx) => {
    if (!row || row.length === 0) return;

    // Extract Date
    const rawDate = row[mapping.dateCol] || '';
    const date = normalizeDateUniversal(rawDate);

    // Extract Description / Narration
    let description = (row[mapping.descCol] || '').trim();
    if (!description && mapping.refCol !== undefined && mapping.refCol !== null) {
      description = (row[mapping.refCol] || '').trim();
    }
    if (!description) {
      description = `Transaction #${idx + 1}`;
    }

    // Extract Debit / Credit / Amount
    let amount = 0;
    let txType: TransactionType = 'expense';

    if (
      mapping.debitCol !== undefined &&
      mapping.debitCol !== null &&
      mapping.creditCol !== undefined &&
      mapping.creditCol !== null
    ) {
      const debitParsed = parseCleanFinancialAmount(row[mapping.debitCol]);
      const creditParsed = parseCleanFinancialAmount(row[mapping.creditCol]);

      if (creditParsed.amount > 0) {
        amount = creditParsed.amount;
        txType = 'income';
      } else if (debitParsed.amount > 0) {
        amount = debitParsed.amount;
        txType = 'expense';
      }
    } else if (mapping.amountCol !== undefined && mapping.amountCol !== null) {
      const amtParsed = parseCleanFinancialAmount(row[mapping.amountCol]);
      amount = amtParsed.amount;

      if (mapping.typeCol !== undefined && mapping.typeCol !== null) {
        const typeStr = (row[mapping.typeCol] || '').toLowerCase();
        if (typeStr.includes('cr') || typeStr.includes('in') || typeStr.includes('deposit')) {
          txType = 'income';
        } else {
          txType = 'expense';
        }
      } else if (amtParsed.isCR) {
        txType = 'income';
      } else if (amtParsed.isDR) {
        txType = 'expense';
      }
    }

    if (amount <= 0) return;

    // Running balance if available
    let runningBalance: number | undefined;
    if (mapping.balanceCol !== undefined && mapping.balanceCol !== null) {
      const balParsed = parseCleanFinancialAmount(row[mapping.balanceCol]);
      if (balParsed.amount > 0) {
        runningBalance = balParsed.amount;
      }
    }

    const category = txType === 'income' ? 'Salary' : detectCategoryFromTitle(description);

    result.push({
      id: `mapped-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      title: description,
      amount,
      type: txType,
      category,
      isRecurring: false,
      note: `Bank e-Statement (${fileName})`,
      source: fileName,
      runningBalance
    });
  });

  reconcileRunningBalances(result);
  return result;
}
