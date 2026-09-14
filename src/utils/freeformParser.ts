import { Transaction, TransactionType } from '../types/finance';
import { detectCategoryFromTitle } from '../config/categoryConfig';
import { CSVParseResult } from './csvParser';

const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12'
};

const INCOME_KEYWORDS = [
  'salary', 'income', 'deposit', 'refund', 'freelance', 'dividend', 'bonus', 'cashback', 'interest', 'received', 'paycheck'
];

/**
 * Universal Token-Based Freeform Parser
 * Parses natural text notes, trip budgets, quick ledger math, or casual entries:
 * e.g. "June 12 2025 - 300 , transport"
 * e.g. "17th march- 10000-5000=5000"
 * e.g. "North trip- 68200 (Flight- 42880 ...)"
 * e.g. "Dinner with friends $45.50 on 15/05/2025"
 */
export function parseFreeformSync(text: string): Transaction[] {
  const lines = text.split('\n');
  const transactions: Transaction[] = [];
  let currentYear = new Date().getFullYear().toString();
  let currentGroup = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Check if sub-item in parenthesis or indented
    const isSubItem = rawLine.startsWith('(') || (currentGroup && (rawLine.includes(')') || lines[i].startsWith(' ') || lines[i].startsWith('\t')));
    const cleanLine = rawLine.replace(/^[()\[\]]+|[()\[\]]+$/g, '').trim();

    // 1. Explicit Year Header (e.g. "2026")
    if (/^(19|20)\d{2}$/.test(cleanLine)) {
      currentYear = cleanLine;
      continue;
    }

    // 2. Ignore pure balance/remaining indicators without an equation (e.g. "Remaining - 41400")
    if (/^remaining\s*[-:]?\s*\d+/i.test(cleanLine) || /^balance\s*[-:]?\s*\d+/i.test(cleanLine)) {
      continue;
    }

    let dateStr = '';
    let amount = 0;
    let type: TransactionType = 'expense';
    let lineBuffer = cleanLine;

    // 3. Extract Date (Anywhere in line)
    // Month first: "June 12 2025", "december 20, 2025", "June 12"
    const monthFirstRegex = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b(?:\s*,?\s*((?:19|20)\d{2})\b)?/i;
    // Day first: "12 June 2025", "2nd march", "17th march", "1st aug", "01 sept", "1.FEB", "2. MAR"
    const dayFirstRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\.?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?(?:\s*,?\s*((?:19|20)\d{2})\b)?/i;
    // ISO Date: "2025-06-12"
    const isoDateRegex = /\b((?:19|20)\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/;
    // Slash date: 15/05/2025 or 15/05
    const slashDateRegex = /\b(\d{1,2})\/(\d{1,2})(?:\/((?:19|20)\d{2}))?\b/;
    // Dash date: 2025-06-12 or 12-15-2025 or 15-05-2025
    const dashDateRegex = /\b(\d{1,2})-(\d{1,2})-((?:19|20)\d{2})\b/;
    // Dot date with 4 digit year: 15.05.2025
    const dotDateRegex = /\b(\d{1,2})\.(\d{1,2})\.((?:19|20)\d{2})\b/;

    let dMatch = lineBuffer.match(monthFirstRegex);
    if (dMatch) {
      const mStr = dMatch[1].toLowerCase();
      const mKey = Object.keys(MONTH_MAP).find((k) => mStr.startsWith(k)) || '01';
      const m = MONTH_MAP[mKey] || '01';
      const d = dMatch[2].padStart(2, '0');
      const y = dMatch[3] || currentYear;
      dateStr = `${y}-${m}-${d}`;
      lineBuffer = lineBuffer.replace(dMatch[0], ' ');
    } else if ((dMatch = lineBuffer.match(dayFirstRegex))) {
      const d = dMatch[1].padStart(2, '0');
      const mStr = dMatch[2].toLowerCase();
      const mKey = Object.keys(MONTH_MAP).find((k) => mStr.startsWith(k)) || '01';
      const m = MONTH_MAP[mKey] || '01';
      const y = dMatch[3] || currentYear;
      dateStr = `${y}-${m}-${d}`;
      lineBuffer = lineBuffer.replace(dMatch[0], ' ');
    } else if ((dMatch = lineBuffer.match(isoDateRegex))) {
      const y = dMatch[1];
      const m = dMatch[2].padStart(2, '0');
      const d = dMatch[3].padStart(2, '0');
      dateStr = `${y}-${m}-${d}`;
      lineBuffer = lineBuffer.replace(dMatch[0], ' ');
    } else if ((dMatch = lineBuffer.match(slashDateRegex))) {
      const p1 = dMatch[1].padStart(2, '0');
      const p2 = dMatch[2].padStart(2, '0');
      const y = dMatch[3] || currentYear;
      const day = parseInt(p1, 10) > 12 ? p1 : p2;
      const month = parseInt(p1, 10) > 12 ? p2 : p1;
      dateStr = `${y}-${month}-${day}`;
      lineBuffer = lineBuffer.replace(dMatch[0], ' ');
    } else if ((dMatch = lineBuffer.match(dashDateRegex)) || (dMatch = lineBuffer.match(dotDateRegex))) {
      const p1 = dMatch[1].padStart(2, '0');
      const p2 = dMatch[2].padStart(2, '0');
      const y = dMatch[3];
      const day = parseInt(p1, 10) > 12 ? p1 : p2;
      const month = parseInt(p1, 10) > 12 ? p2 : p1;
      dateStr = `${y}-${month}-${day}`;
      lineBuffer = lineBuffer.replace(dMatch[0], ' ');
    }

    // 4. Extract Ledger Equation if present: e.g. "10000-5000=5000"
    const mathRegex = /\d+\s*([+-])\s*(\d+(?:\.\d+)?)\s*=\s*\d+/;
    const mathMatch = lineBuffer.match(mathRegex);
    if (mathMatch) {
      const sign = mathMatch[1];
      amount = parseFloat(mathMatch[2]);
      type = sign === '+' ? 'income' : 'expense';
      lineBuffer = lineBuffer.replace(mathMatch[0], ' ');
    } else {
      // 5. Extract Amount: "$300", "- 300", "+5000", "300 SGD", "42880", "25.50"
      const amountRegex = /(?:SGD|\$|USD|EUR|£|¥)?\s*([+-]?\s*\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:SGD|USD|EUR|£|¥)?/i;
      const amtMatch = lineBuffer.match(amountRegex);
      if (amtMatch && amtMatch[1]) {
        const rawAmt = amtMatch[1].replace(/\s+/g, '').replace(/,/g, '');
        const parsedVal = Math.abs(parseFloat(rawAmt));
        if (!isNaN(parsedVal) && parsedVal > 0) {
          amount = parsedVal;
          if (rawAmt.startsWith('+')) {
            type = 'income';
          } else if (rawAmt.startsWith('-')) {
            type = 'expense';
          }
          lineBuffer = lineBuffer.replace(amtMatch[0], ' ');
        }
      }
    }

    // Clean up residual characters
    let remainder = lineBuffer.replace(/^[–—\s,;:\-.]+|[–—\s,;:\-.]+$/g, '').trim();
    remainder = remainder.replace(/\b(on|at|for|in|from|to)\s*$/i, '').trim();
    remainder = remainder.replace(/^[–—\s,;:\-.]+|[–—\s,;:\-.]+$/g, '').trim();

    // Check income keywords
    if (INCOME_KEYWORDS.some((kw) => remainder.toLowerCase().includes(kw))) {
      type = 'income';
    }

    // Parent group detection:
    // e.g. "North trip- 68200" followed by lines starting with "("
    if (i + 1 < lines.length && lines[i + 1].trim().startsWith('(')) {
      currentGroup = remainder || 'Group';
      transactions.push({
        id: `ff-${Date.now()}-${transactions.length}-${Math.random().toString(36).slice(2, 7)}`,
        date: dateStr || new Date().toISOString().split('T')[0],
        title: `${currentGroup} (Total Budget)`,
        amount,
        type,
        category: detectCategoryFromTitle(remainder),
        source: 'Freeform Notes'
      });
      continue;
    }

    let title = remainder;
    if (isSubItem && currentGroup) {
      title = `${currentGroup}: ${remainder || 'Expense'}`;
    } else if (!title) {
      title = dateStr ? `Transaction on ${dateStr}` : 'Notes Entry';
    }

    // Capitalize first letter of title for aesthetics if lowercase
    if (title && title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    if (rawLine.includes(')')) {
      currentGroup = '';
    }

    if (amount > 0) {
      transactions.push({
        id: `ff-${Date.now()}-${transactions.length}-${Math.random().toString(36).slice(2, 7)}`,
        date: dateStr || new Date().toISOString().split('T')[0],
        title,
        amount,
        type,
        category: detectCategoryFromTitle(title),
        source: 'Freeform Notes'
      });
    }
  }

  return transactions;
}

export async function parseFreeformText(text: string): Promise<CSVParseResult> {
  const transactions = parseFreeformSync(text);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return {
    fileName: 'Freeform Notes Import',
    transactions,
    totalIncome,
    totalExpense,
    unrecognizedCount: 0
  };
}
