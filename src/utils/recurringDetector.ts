import { Transaction } from '../types/finance';

/**
 * Known subscription, utility, bill, and recurring service keywords
 */
const RECURRING_KEYWORDS_REGEX = /(netflix|spotify|disney\+|disney plus|prime video|amazon prime|youtube premium|apple\.com\/bill|itunes|google \*|patreon|chatgpt|openai|github|adobe|icloud|dropbox|canva|singtel|starhub|m1|giga|simba|circles\.life|myrepublic|broadband|sp services|sp group|senoko|tuas power|keppel electric|fitness|gym|anytime fitness|pure fitness|virgin active|fitness first|prudential|aia|great eastern|aviva|manulife|fwd|income insurance|etiqa|rental|monthly rent|landlord|giro|auto giro|salary|payroll|paycheck|direct salary|maintenance fee|conservancy|hdb season parking)/i;

/**
 * Clean and normalize transaction title for grouping
 */
export function normalizeMerchantTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/^(dbs|ocbc|uob|posb|citi|citibank|hsbc|giro|paynow|fast|nets)\s*[-:]?\s*/i, '')
    .replace(/\b(pte ltd|ltd|inc|llc|corp|co|sg|singapore)\b/gi, '')
    .replace(/\b(ref|txn|id|no)[\s#:]*[a-z0-9]+/gi, '')
    .replace(/\b\d{4,}\b/g, '') // strip long reference numbers
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Calculates day difference between two YYYY-MM-DD dates
 */
function daysBetween(dateStrA: string, dateStrB: string): number {
  const d1 = new Date(dateStrA).getTime();
  const d2 = new Date(dateStrB).getTime();
  return Math.abs(Math.round((d1 - d2) / (1000 * 60 * 60 * 24)));
}

/**
 * Checks if a single transaction looks inherently like a recurring subscription/bill
 */
export function isLikelyRecurringKeyword(tx: Partial<Transaction>): boolean {
  const text = `${tx.title || ''} ${tx.description || ''} ${tx.note || ''} ${tx.source || ''}`;
  return RECURRING_KEYWORDS_REGEX.test(text);
}

/**
 * Smart Recurring Engine
 * 1. Matches known subscription/bill/utility/salary merchants.
 * 2. Matches regular monthly (25-35 days) or weekly (6-8 days) repeating charges with similar amounts.
 * 3. Cross-references newly imported items with existing historical ledger transactions.
 */
export function detectRecurringTransactions(
  newTransactions: Transaction[],
  historicalTransactions: Transaction[] = []
): Transaction[] {
  const allPool = [...newTransactions, ...historicalTransactions];

  // Group by normalized title
  const merchantGroups = new Map<string, Transaction[]>();

  allPool.forEach((tx) => {
    const key = normalizeMerchantTitle(tx.title);
    if (!key || key.length < 3) return;
    const list = merchantGroups.get(key) || [];
    list.push(tx);
    merchantGroups.set(key, list);
  });

  const recurringIds = new Set<string>();

  // 1. Cadence & repeat check per merchant group
  merchantGroups.forEach((group) => {
    if (group.length < 2) return;

    // Sort by date ascending
    group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const txA = group[i];
        const txB = group[j];

        // Must be same type (both expenses or both incomes)
        if (txA.type !== txB.type) continue;

        // Check amount similarity: within 5% or difference <= $1.00 (e.g. slight tax variance)
        const amtDiff = Math.abs(txA.amount - txB.amount);
        const maxAmt = Math.max(txA.amount, txB.amount);
        const isSimilarAmt = maxAmt > 0 && (amtDiff <= 1.0 || amtDiff / maxAmt <= 0.05);

        if (!isSimilarAmt) continue;

        const gapDays = daysBetween(txA.date, txB.date);

        // Monthly cadence: 25 to 35 days, or multiple of months (55-65 days, 85-95 days)
        const isMonthlyCadence =
          (gapDays >= 25 && gapDays <= 35) ||
          (gapDays >= 55 && gapDays <= 65) ||
          (gapDays >= 85 && gapDays <= 95);

        // Weekly cadence: 6 to 8 days, or 13-15 days
        const isWeeklyCadence = (gapDays >= 6 && gapDays <= 8) || (gapDays >= 13 && gapDays <= 15);

        if (isMonthlyCadence || isWeeklyCadence) {
          recurringIds.add(txA.id);
          recurringIds.add(txB.id);
        }
      }
    }
  });

  // 2. Keyword check for known subscriptions & bills
  allPool.forEach((tx) => {
    if (isLikelyRecurringKeyword(tx)) {
      recurringIds.add(tx.id);
    }
  });

  // Return newTransactions with isRecurring assigned
  return newTransactions.map((tx) => {
    const shouldBeRecurring = tx.isRecurring === true || recurringIds.has(tx.id);
    return {
      ...tx,
      isRecurring: shouldBeRecurring
    };
  });
}

/**
 * Retroactive upgrade for existing transactions already in memory/storage
 */
export function upgradeExistingTransactionsWithRecurring(
  transactions: Transaction[]
): Transaction[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const evaluated = detectRecurringTransactions(transactions, []);
  return evaluated.map((t, idx) => {
    const original = transactions[idx];
    if (!original.isRecurring && t.isRecurring) {
      return { ...original, isRecurring: true };
    }
    return original;
  });
}
