import * as pdfjsLib from 'pdfjs-dist';
// Vite ?url import creates a local offline URL for the worker script
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Transaction, CategoryKey, TransactionType } from '../types/finance';
import { detectCategoryFromTitle } from '../config/categoryConfig';
import { CSVParseResult } from './csvParser';

// Set offline local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Helper to normalize amount string e.g. "$ 1,234.50" -> 1234.50
function cleanNumeric(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper to normalize dates into YYYY-MM-DD
function normalizeDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentYear = now.getFullYear();

  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  // Pattern: 15 Oct 2026 or 15 Oct or 15-Oct-2026
  const textMatch = raw.match(/(\d{1,2})[\s/-]([a-zA-Z]{3})[\s/-]?(\d{2,4})?/i);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const month = monthNames[textMatch[2].toLowerCase()] || '01';
    let year = textMatch[3] ? textMatch[3] : `${currentYear}`;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Pattern: DD/MM/YYYY or DD-MM-YYYY
  const numMatch = raw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (numMatch) {
    const day = numMatch[1].padStart(2, '0');
    const month = numMatch[2].padStart(2, '0');
    let year = numMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

const DEPOSIT_KEYWORDS = [
  'salary', 'payroll', 'paynow in', 'paynow rec', 'paynow qr',
  'fast / inward', 'fast in', 'inward fast', 'transfer from', 'funds transfer from',
  'giro credit', 'deposit', 'dividend', 'refund', 'reversal', 'reimbursement',
  'interest credit', 'interest earned', 'cash in', 'cash deposit', 'inward remitt',
  'credit adv', 'direct credit', 'interbank giro cr', 'fixed deposit', 'rebate', 'cashback'
];

export async function parseBankPDF(file: File): Promise<CSVParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const parsedList: Transaction[] = [];
  let totalIncome = 0;
  let totalExpense = 0;
  let unrecognizedCount = 0;

  // Regex patterns to detect transaction lines
  const dateRegex = /\b(\d{1,2}[\s/-][a-zA-Z]{3}(?:[\s/-]\d{2,4})?|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/i;
  const amountRegex = /(?:SGD|USD|INR|EUR|GBP|JPY|AUD|CAD|MYR|CNY|₹|€|£|¥|\$|RM)?\s*([+-]?[0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\s*(CR|DR|\+|-)?/gi;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (!items || items.length === 0) continue;

    // Detect Table Column Header Coordinates on this page
    let debitColX: number | null = null;
    let depositColX: number | null = null;
    let balanceColX: number | null = null;

    items.forEach((it) => {
      const s = (it.str || '').toLowerCase().trim();
      const x = it.transform[4];
      if (s.includes('withdrawal') || s.includes('debit') || s.includes('money out') || s.includes('paid out')) {
        debitColX = x;
      } else if (s.includes('deposit') || s.includes('credit') || s.includes('money in') || s.includes('paid in')) {
        depositColX = x;
      } else if (s.includes('balance')) {
        balanceColX = x;
      }
    });

    // Group text items into lines based on Y coordinates (tolerance of ~3px)
    const lineMap: { y: number; items: TextItem[] }[] = [];

    items.forEach((it) => {
      if (!it.str || it.str.trim() === '') return;
      const x = it.transform[4];
      const y = Math.round(it.transform[5]);
      const str = it.str;
      const width = it.width;
      const height = it.height;

      const existingLine = lineMap.find((l) => Math.abs(l.y - y) <= 3);
      if (existingLine) {
        existingLine.items.push({ str, x, y, width, height });
      } else {
        lineMap.push({ y, items: [{ str, x, y, width, height }] });
      }
    });

    // Sort lines from top of page to bottom (descending Y)
    lineMap.sort((a, b) => b.y - a.y);

    // Process each line as a potential bank statement record
    lineMap.forEach((line) => {
      line.items.sort((a, b) => a.x - b.x);
      const fullLineText = line.items.map((i) => i.str.trim()).join(' ');
      const lowerLineText = fullLineText.toLowerCase();

      // Check if line contains a date
      const dateMatch = fullLineText.match(dateRegex);
      if (!dateMatch) return;

      // Extract all monetary numbers on the line with their positions
      const amountMatches: { str: string; amount: number; x: number; isCR: boolean; isDR: boolean }[] = [];

      line.items.forEach((item) => {
        let m: RegExpExecArray | null;
        const scanner = new RegExp(amountRegex);
        while ((m = scanner.exec(item.str)) !== null) {
          const num = cleanNumeric(m[1]);
          const flag = (m[2] || '').toUpperCase();
          if (num > 0) {
            const hasPlusSign = m[1].includes('+') || flag === '+';
            const hasMinusSign = m[1].includes('-') || flag === '-';
            const hasCR = flag === 'CR' || item.str.toUpperCase().includes('CR');
            const hasDR = flag === 'DR' || item.str.toUpperCase().includes('DR');

            amountMatches.push({
              str: m[0],
              amount: num,
              x: item.x,
              isCR: hasPlusSign || hasCR,
              isDR: hasMinusSign || hasDR
            });
          }
        }
      });

      if (amountMatches.length === 0) return;

      // Extract transaction date
      const date = normalizeDate(dateMatch[0]);

      // Determine whether line represents an Income (Deposit) or Expense (Withdrawal)
      const hasDepositKeyword = DEPOSIT_KEYWORDS.some((kw) => lowerLineText.includes(kw));

      // Choose transaction amount:
      // If there are multiple amounts (e.g. Tx Amount + Running Balance), filter out the balance column if known
      let candidateAmounts = amountMatches;
      if (balanceColX && amountMatches.length > 1) {
        // Exclude the amount closest to balance column
        const nonBalance = amountMatches.filter((a) => Math.abs(a.x - (balanceColX || 0)) > 40);
        if (nonBalance.length > 0) {
          candidateAmounts = nonBalance;
        }
      }

      const primaryAmtObj = candidateAmounts[0];
      const amount = primaryAmtObj.amount;

      // Determine Type (Income vs Expense) via 3-tier heuristic:
      let isIncome = false;

      // Signal 1: Explicit sign / CR / DR flag
      if (primaryAmtObj.isCR && !primaryAmtObj.isDR) {
        isIncome = true;
      } else if (primaryAmtObj.isDR) {
        isIncome = false;
      }
      // Signal 2: Header X-coordinate column boundaries
      else if (debitColX !== null && depositColX !== null) {
        const midPoint = (debitColX + depositColX) / 2;
        if (depositColX > debitColX) {
          // Standard: Debit on Left, Deposit on Right
          isIncome = primaryAmtObj.x >= midPoint;
        } else {
          // Deposit on Left, Debit on Right
          isIncome = primaryAmtObj.x <= midPoint;
        }
      }
      // Signal 3: Banking description keyword match
      else if (hasDepositKeyword) {
        isIncome = true;
      }

      // If keywords strongly indicate deposit even without clear columns, prioritize income
      if (hasDepositKeyword) {
        isIncome = true;
      }

      const txType: TransactionType = isIncome ? 'income' : 'expense';

      // Clean description: remove dates and numeric matches
      let description = fullLineText.replace(dateMatch[0], '');
      amountMatches.forEach((a) => {
        description = description.replace(a.str, '');
      });

      description = description
        .replace(/SGD|USD|INR|EUR|GBP|JPY|AUD|CAD|MYR|CNY|₹|€|£|¥|\$|RM|CR|DR|Balance|Transfer/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!description || description.length < 2) {
        description = isIncome ? `Inward Bank Transfer (${date})` : `Bank Payment (${date})`;
      }

      // Categorize
      let category: CategoryKey = 'General';
      if (txType === 'income') {
        category = 'Salary';
      } else {
        category = detectCategoryFromTitle(description);
        if (category === 'General') {
          unrecognizedCount++;
        }
      }

      if (txType === 'income') totalIncome += amount;
      else totalExpense += amount;

      parsedList.push({
        id: `pdf-${Date.now()}-${parsedList.length}`,
        date,
        title: description,
        amount,
        type: txType,
        category,
        isRecurring: false,
        note: `PDF e-Statement (${file.name})`,
        source: file.name
      });
    });
  }

  if (parsedList.length === 0) {
    throw new Error(
      'Could not detect structured transaction tables in this PDF. Please ensure the statement is an official digital bank e-statement (not a scanned image).'
    );
  }

  return {
    fileName: file.name,
    transactions: parsedList,
    totalIncome,
    totalExpense,
    unrecognizedCount
  };
}
