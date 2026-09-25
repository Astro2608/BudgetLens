import * as pdfjsLib from 'pdfjs-dist';
// Vite ?url import creates a local offline URL for the worker script
// @ts-ignore
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// In-memory module import for guaranteed fail-safe execution (works on file://, password-protected hosts, offline)
// @ts-ignore
import * as pdfjsWorkerModule from 'pdfjs-dist/build/pdf.worker.min.mjs';
import { Transaction, CategoryKey, TransactionType } from '../types/finance';
import { detectCategoryFromTitle } from '../config/categoryConfig';
import { CSVParseResult } from './csvParser';
import {
  parseCleanFinancialAmount,
  normalizeDateUniversal,
  reconcileRunningBalances
} from './bankTemplates';

// Attach to globalThis so PDF.js fake worker fallback ALWAYS succeeds without network fetch
if (typeof globalThis !== 'undefined') {
  (globalThis as any).pdfjsWorker = pdfjsWorkerModule;
}

// Set offline local worker
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
}

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ColumnZone {
  key: 'date' | 'ref' | 'description' | 'debit' | 'credit' | 'balance';
  label: string;
  minX: number;
  maxX: number;
  centerX: number;
}

const DEPOSIT_KEYWORDS = [
  'salary', 'payroll', 'paynow in', 'paynow rec', 'paynow qr',
  'fast / inward', 'fast in', 'inward fast', 'transfer from', 'funds transfer from',
  'giro credit', 'deposit', 'dividend', 'refund', 'reversal', 'reimbursement',
  'interest credit', 'interest earned', 'cash in', 'cash deposit', 'inward remitt',
  'credit adv', 'direct credit', 'interbank giro cr', 'fixed deposit', 'rebate', 'cashback',
  'freelance', 'paycheck', 'imps/inward', 'neft/inward', 'rtgs/inward', 'upi/cr'
];

const WITHDRAWAL_KEYWORDS = [
  'fairprice', 'ntuc', 'grab', 'gojek', 'foodpanda', 'deliveroo', 'starbucks', 'mcdonald',
  'uniqlo', 'shopee', 'lazada', 'amazon', 'singtel', 'starhub', 'm1', 'sp services', 'sp digital',
  'shell', 'esso', 'caltex', 'sinopec', 'din tai fung', 'watsons', 'guardian', 'sephora',
  'supermarket', 'mart', 'restaurant', 'cafe', 'baking', 'coffee', 'bakery', 'transport',
  'simplygo', 'mrt', 'bus', 'taxi', 'petrol', 'fuel', 'insurance', 'rental', 'rent',
  'subscription', 'netflix', 'spotify', 'apple.com', 'google *', 'payment to', 'transfer to',
  'withdraw', 'atm', 'outward fast', 'fee', 'charge', 'tax', 'interest charged', 'card purchase',
  'upi/dr', 'pos purchase'
];

// Date matcher regex
const DATE_REGEX = /\b(\d{1,2}[\s/-][a-zA-Z]{3}(?:[\s/-]\d{2,4})?|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/i;

export async function parseBankPDF(file: File): Promise<CSVParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const parsedList: Transaction[] = [];
  let totalIncome = 0;
  let totalExpense = 0;
  let unrecognizedCount = 0;

  const extractedRawRows: string[][] = [];
  const rawColumnLabels = ['Date', 'Ref / Chq No', 'Description / Narration', 'Withdrawal (Debit)', 'Deposit (Credit)', 'Closing Balance'];

  // Track discovered column X positions globally across pages
  let detectedZones: ColumnZone[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (!items || items.length === 0) continue;

    // Group text items into lines based on Y coordinate (3.5px tolerance)
    const lineMap: { y: number; items: TextItem[] }[] = [];

    items.forEach((it) => {
      const str = (it.str || '').trim();
      if (!str) return;
      const x = it.transform[4];
      const y = Math.round(it.transform[5]);
      const width = it.width || 0;
      const height = it.height || 0;

      const existingLine = lineMap.find((l) => Math.abs(l.y - y) <= 3.5);
      if (existingLine) {
        existingLine.items.push({ str: it.str, x, y, width, height });
      } else {
        lineMap.push({ y, items: [{ str: it.str, x, y, width, height }] });
      }
    });

    // Sort lines from top of page to bottom (descending Y)
    lineMap.sort((a, b) => b.y - a.y);

    // 1. Detect Header Line on this page if not yet established or page has own headers
    lineMap.forEach((line) => {
      const lineText = line.items.map((i) => i.str.toLowerCase()).join(' ');

      const hasDateWord = lineText.includes('date') || lineText.includes('txn dt');
      const hasNarrationWord = lineText.includes('narration') || lineText.includes('description') || lineText.includes('particulars') || lineText.includes('details');
      const hasDebitWord = lineText.includes('withdrawal') || lineText.includes('debit') || lineText.includes('paid out') || lineText.includes('money out') || lineText.includes('dr');
      const hasCreditWord = lineText.includes('deposit') || lineText.includes('credit') || lineText.includes('paid in') || lineText.includes('money in') || lineText.includes('cr');
      const hasBalWord = lineText.includes('balance') || lineText.includes('bal');

      // If at least 3 column keywords appear on the same horizontal line, it's a table header!
      const headerMatches = [hasDateWord, hasNarrationWord, hasDebitWord, hasCreditWord, hasBalWord].filter(Boolean).length;
      if (headerMatches >= 3) {
        line.items.sort((a, b) => a.x - b.x);

        let dateX = -1;
        let refX = -1;
        let descX = -1;
        let debitX = -1;
        let creditX = -1;
        let balanceX = -1;

        line.items.forEach((it) => {
          const s = it.str.toLowerCase().trim();
          if (s.includes('date')) dateX = it.x;
          else if (s.includes('chq') || s.includes('ref') || s.includes('cheque')) refX = it.x;
          else if (s.includes('narration') || s.includes('particular') || s.includes('desc') || s.includes('detail')) descX = it.x;
          else if (s.includes('withdrawal') || s.includes('debit') || s.includes('dr') || s.includes('outflow')) debitX = it.x;
          else if (s.includes('deposit') || s.includes('credit') || s.includes('cr') || s.includes('inflow')) creditX = it.x;
          else if (s.includes('balance') || s.includes('bal')) balanceX = it.x;
        });

        // Build sorted list of detected column centers
        const cols: { key: ColumnZone['key']; label: string; x: number }[] = [];
        if (dateX !== -1) cols.push({ key: 'date', label: 'Date', x: dateX });
        if (refX !== -1) cols.push({ key: 'ref', label: 'Ref No', x: refX });
        if (descX !== -1) cols.push({ key: 'description', label: 'Description', x: descX });
        if (debitX !== -1) cols.push({ key: 'debit', label: 'Debit', x: debitX });
        if (creditX !== -1) cols.push({ key: 'credit', label: 'Credit', x: creditX });
        if (balanceX !== -1) cols.push({ key: 'balance', label: 'Balance', x: balanceX });

        cols.sort((a, b) => a.x - b.x);

        if (cols.length >= 3) {
          detectedZones = cols.map((col, idx) => {
            const prevCol = cols[idx - 1];
            const nextCol = cols[idx + 1];
            const minX = prevCol ? (prevCol.x + col.x) / 2 : 0;
            const maxX = nextCol ? (col.x + nextCol.x) / 2 : 9999;
            return {
              key: col.key,
              label: col.label,
              minX,
              maxX,
              centerX: col.x
            };
          });
        }
      }
    });

    // 2. Process each line
    lineMap.forEach((line) => {
      line.items.sort((a, b) => a.x - b.x);
      const fullLineText = line.items.map((i) => i.str.trim()).join(' ');

      // Check for date in line
      const dateMatch = fullLineText.match(DATE_REGEX);

      // If we have spatial zones established, bucket tokens into table columns
      if (detectedZones.length >= 3) {
        const cellMap: Record<string, string[]> = {
          date: [],
          ref: [],
          description: [],
          debit: [],
          credit: [],
          balance: []
        };

        line.items.forEach((item) => {
          const itemMidX = item.x + (item.width || 0) / 2;
          const matchedZone = detectedZones.find((z) => itemMidX >= z.minX && itemMidX < z.maxX);
          if (matchedZone) {
            cellMap[matchedZone.key].push(item.str.trim());
          } else {
            // Fallback to closest zone center
            let closest = detectedZones[0];
            let minDist = Math.abs(itemMidX - closest.centerX);
            for (let i = 1; i < detectedZones.length; i++) {
              const d = Math.abs(itemMidX - detectedZones[i].centerX);
              if (d < minDist) {
                minDist = d;
                closest = detectedZones[i];
              }
            }
            cellMap[closest.key].push(item.str.trim());
          }
        });

        const rowDateStr = cellMap.date.join(' ').trim();
        const rowRefStr = cellMap.ref.join(' ').trim();
        const rowDescStr = cellMap.description.join(' ').trim();
        const rowDebitStr = cellMap.debit.join(' ').trim();
        const rowCreditStr = cellMap.credit.join(' ').trim();
        const rowBalanceStr = cellMap.balance.join(' ').trim();

        // Check if this row is a transaction row:
        const hasDate = DATE_REGEX.test(rowDateStr) || (dateMatch && !rowDescStr.toLowerCase().includes('statement'));
        const debitParsed = parseCleanFinancialAmount(rowDebitStr);
        const creditParsed = parseCleanFinancialAmount(rowCreditStr);
        const balanceParsed = parseCleanFinancialAmount(rowBalanceStr);

        if (hasDate && (debitParsed.amount > 0 || creditParsed.amount > 0 || balanceParsed.amount > 0)) {
          const validDate = normalizeDateUniversal(rowDateStr || (dateMatch ? dateMatch[0] : ''));

          let amount = 0;
          let txType: TransactionType = 'expense';

          if (creditParsed.amount > 0) {
            amount = creditParsed.amount;
            txType = 'income';
          } else if (debitParsed.amount > 0) {
            amount = debitParsed.amount;
            txType = 'expense';
          } else if (balanceParsed.amount > 0 && creditParsed.isCR) {
            amount = balanceParsed.amount;
            txType = 'income';
          }

          // Build clean title
          let title = rowDescStr;
          if (rowRefStr && !title.includes(rowRefStr)) {
            title = `${rowRefStr} ${title}`.trim();
          }
          if (!title || title.length < 2) {
            title = txType === 'income' ? `Inward Bank Transfer (${validDate})` : `Bank Payment (${validDate})`;
          }

          // Determine category
          let category: CategoryKey = 'General';
          if (txType === 'income') {
            category = 'Salary';
          } else {
            category = detectCategoryFromTitle(title);
            if (category === 'General') unrecognizedCount++;
          }

          const runningBalance = balanceParsed.amount > 0 ? balanceParsed.amount : undefined;

          // Push raw row for user-assisted Column Mapper
          extractedRawRows.push([
            rowDateStr || (dateMatch ? dateMatch[0] : ''),
            rowRefStr,
            rowDescStr,
            rowDebitStr,
            rowCreditStr,
            rowBalanceStr
          ]);

          parsedList.push({
            id: `pdf-${Date.now()}-${parsedList.length}`,
            date: validDate,
            title,
            amount,
            type: txType,
            category,
            isRecurring: false,
            note: `PDF e-Statement (${file.name})`,
            source: file.name,
            runningBalance
          });
          return;
        }

        // Multi-line narration continuation:
        // If line has no date, but has text in description and no amounts, attach to previous transaction title
        if (!hasDate && rowDescStr && parsedList.length > 0 && debitParsed.amount === 0 && creditParsed.amount === 0) {
          const lastTx = parsedList[parsedList.length - 1];
          if (!lastTx.title.includes(rowDescStr) && rowDescStr.length > 2 && !rowDescStr.toLowerCase().includes('page')) {
            lastTx.title = `${lastTx.title} ${rowDescStr}`.trim();
          }
          return;
        }
      }

      // 3. Fallback Heuristic Line Parser (for PDFs where column headers were not detectable)
      if (!dateMatch) return;

      // Extract all potential monetary amounts in this line
      const amountsFound: { raw: string; amount: number; isCR: boolean; isDR: boolean; x: number }[] = [];
      line.items.forEach((item) => {
        const itemStr = item.str.trim();
        const parsed = parseCleanFinancialAmount(itemStr);
        if (parsed.amount > 0) {
          amountsFound.push({
            raw: itemStr,
            amount: parsed.amount,
            isCR: parsed.isCR,
            isDR: parsed.isDR,
            x: item.x
          });
        }
      });

      if (amountsFound.length === 0) return;

      const date = normalizeDateUniversal(dateMatch[0]);

      // If multiple amounts, the last one (rightmost X) is typically the running balance
      amountsFound.sort((a, b) => a.x - b.x);
      let runningBalance: number | undefined;
      let txAmountObj = amountsFound[0];

      if (amountsFound.length >= 2) {
        runningBalance = amountsFound[amountsFound.length - 1].amount;
        // Transaction amount is the one before running balance
        txAmountObj = amountsFound[amountsFound.length - 2];
      }

      const amount = txAmountObj.amount;
      const lowerLineText = fullLineText.toLowerCase();

      const hasDepositKeyword = DEPOSIT_KEYWORDS.some((kw) => lowerLineText.includes(kw));
      const hasWithdrawalKeyword = WITHDRAWAL_KEYWORDS.some((kw) => lowerLineText.includes(kw));

      let isIncome = false;
      if (hasWithdrawalKeyword && !hasDepositKeyword) {
        isIncome = false;
      } else if (hasDepositKeyword && !hasWithdrawalKeyword) {
        isIncome = true;
      } else if (txAmountObj.isCR && !txAmountObj.isDR) {
        isIncome = true;
      } else if (txAmountObj.isDR) {
        isIncome = false;
      }

      const txType: TransactionType = isIncome ? 'income' : 'expense';

      // Clean description without destroying numbers
      let description = fullLineText.replace(dateMatch[0], '');
      amountsFound.forEach((a) => {
        description = description.replace(a.raw, '');
      });

      description = description
        .replace(/SGD|USD|INR|EUR|GBP|JPY|AUD|CAD|MYR|CNY|₹|€|£|¥|\$|RM/gi, '')
        .replace(/\((?:CR|DR|\+|-)\)/gi, '')
        .replace(/\b(?:CR|DR)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!description || description.length < 2) {
        description = isIncome ? `Inward Bank Transfer (${date})` : `Bank Payment (${date})`;
      }

      let category: CategoryKey = isIncome ? 'Salary' : detectCategoryFromTitle(description);
      if (category === 'General') unrecognizedCount++;

      extractedRawRows.push([date, '', description, isIncome ? '' : String(amount), isIncome ? String(amount) : '', runningBalance ? String(runningBalance) : '']);

      parsedList.push({
        id: `pdf-${Date.now()}-${parsedList.length}`,
        date,
        title: description,
        amount,
        type: txType,
        category,
        isRecurring: false,
        note: `PDF e-Statement (${file.name})`,
        source: file.name,
        runningBalance
      });
    });
  }

  if (parsedList.length === 0) {
    throw new Error(
      'Could not detect structured transaction tables in this PDF. Please ensure the statement is an official digital bank e-statement (not a scanned image).'
    );
  }

  // Holistic Batch Anomaly Detection
  let expenseKeywordCount = 0;
  let expenseKeywordAsIncomeCount = 0;

  parsedList.forEach((t) => {
    const lower = t.title.toLowerCase();
    if (WITHDRAWAL_KEYWORDS.some((kw) => lower.includes(kw))) {
      expenseKeywordCount++;
      if (t.type === 'income') expenseKeywordAsIncomeCount++;
    }
  });

  if (expenseKeywordCount > 0 && expenseKeywordAsIncomeCount / expenseKeywordCount > 0.4) {
    parsedList.forEach((t) => {
      const newType: TransactionType = t.type === 'income' ? 'expense' : 'income';
      t.type = newType;
      if (newType === 'income') {
        t.category = 'Salary';
      } else if (t.category === 'Salary') {
        t.category = detectCategoryFromTitle(t.title);
      }
    });
  }

  // Reconcile balances sequentially
  const { discrepancyCount } = reconcileRunningBalances(parsedList);

  // Calculate final totals
  parsedList.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  return {
    fileName: file.name,
    transactions: parsedList,
    totalIncome,
    totalExpense,
    unrecognizedCount,
    rawColumns: rawColumnLabels,
    rawRows: extractedRawRows,
    balanceDiscrepancyCount: discrepancyCount
  };
}
