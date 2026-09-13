import { Transaction, CategoryKey, TransactionType } from '../types/finance';
import { detectCategoryFromTitle, matchCategory } from '../config/categoryConfig';
import { CSVParseResult } from './csvParser';

// Evaluate simple math expressions like "$10 + 60.5+ 15" or "$4.7" or "SGD 800.00"
function evaluateMathExpression(raw: string): number {
  if (!raw) return 0;
  // Clean all characters except digits, dots, plus signs, minus signs, and commas
  const cleaned = raw.replace(/[$,SGDsgd\s]/g, '').trim();
  if (!cleaned) return 0;

  // Split by plus signs and sum
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    let sum = 0;
    for (const part of parts) {
      const num = parseFloat(part.replace(/[^0-9.-]/g, '').trim());
      if (!isNaN(num)) sum += num;
    }
    return sum;
  }

  const singleNum = parseFloat(cleaned.replace(/[^0-9.-]/g, ''));
  return isNaN(singleNum) ? 0 : singleNum;
}

// Normalize Markdown table dates (e.g. "Jan 3", "Feb 16", "2026-01-03", "16 Jan 2026", "14/09/2026")
function normalizeMarkdownDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentYear = now.getFullYear();

  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', may_: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };

  const clean = raw.trim();

  // Pattern: "Jan 3" or "Jan 16"
  const monthDayMatch = clean.match(/^([a-zA-Z]{3,9})\s+(\d{1,2})$/i);
  if (monthDayMatch) {
    const month = monthNames[monthDayMatch[1].toLowerCase()] || '01';
    const day = monthDayMatch[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }

  // Pattern: "3 Jan" or "16 Jan 2026"
  const dayMonthMatch = clean.match(/^(\d{1,2})[\s/-]([a-zA-Z]{3,9})(?:[\s/-](\d{2,4}))?$/i);
  if (dayMonthMatch) {
    const day = dayMonthMatch[1].padStart(2, '0');
    const month = monthNames[dayMonthMatch[2].toLowerCase()] || '01';
    let year = dayMonthMatch[3] ? dayMonthMatch[3] : `${currentYear}`;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // Standard ISO or numeric date: "2026-01-16" or "16/01/2026"
  const numMatch = clean.match(/^(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})$/);
  if (numMatch) {
    if (numMatch[1].length === 4) {
      return `${numMatch[1]}-${numMatch[2].padStart(2, '0')}-${numMatch[3].padStart(2, '0')}`;
    } else {
      let year = numMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${numMatch[2].padStart(2, '0')}-${numMatch[1].padStart(2, '0')}`;
    }
  }

  return new Date().toISOString().split('T')[0];
}

interface MatrixColumnDef {
  index: number;
  header: string;
  type: 'date' | 'remarks' | 'income' | 'savings' | 'expense';
  category: CategoryKey;
}

export async function parseMarkdownTable(file: File): Promise<CSVParseResult> {
  const text = await file.text();
  const lines = text.split(/\r?\n/);

  const parsedList: Transaction[] = [];
  let totalIncome = 0;
  let totalExpense = 0;
  let unrecognizedCount = 0;

  // 1. Locate the Markdown table header (line containing pipes |)
  let headerIndex = -1;
  let rawHeaders: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.includes('|')) {
      const cols = line
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1 || (arr.length <= 2 && c.length > 0));

      if (cols.length >= 2) {
        headerIndex = i;
        rawHeaders = cols;
        break;
      }
    }
  }

  if (headerIndex === -1 || rawHeaders.length === 0) {
    throw new Error('Could not find a valid Markdown table in this file. Please ensure columns are formatted with pipes (|).');
  }

  const lowerHeaders = rawHeaders.map(h => h.toLowerCase().trim());

  // Check if this is a ROW-BASED standard transaction table
  // e.g. | Date | Title | Amount | Type | Category | Source | Note | Recurring |
  const isRowBased = lowerHeaders.some(h => 
    h === 'amount' || h === 'amt' || h === 'price' || h === 'debit' || h === 'credit'
  );

  if (isRowBased) {
    const findColIdx = (patterns: string[]) => {
      for (const pat of patterns) {
        const idx = lowerHeaders.findIndex(h => h === pat || h.includes(pat));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const dateIdx = findColIdx(['date', 'time', 'day']);
    const titleIdx = findColIdx(['title', 'description', 'particulars', 'narrative', 'item', 'merchant', 'remarks']);
    const amountIdx = findColIdx(['amount', 'amt', 'price', 'total', 'net']);
    const debitIdx = findColIdx(['debit', 'withdrawal', 'dr', 'outflow']);
    const creditIdx = findColIdx(['credit', 'deposit', 'cr', 'inflow']);
    const typeIdx = findColIdx(['type', 'txn type']);
    const categoryIdx = findColIdx(['category', 'tag']);
    const sourceIdx = findColIdx(['source', 'account', 'bank', 'card']);
    const noteIdx = findColIdx(['note', 'notes', 'memo', 'comment']);
    const recurringIdx = findColIdx(['recurring', 'isrecurring', 'subscription']);

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || !line.includes('|')) continue;
      if (/^\|?[\s-:]+(\|[\s-:]+)+\|?$/.test(line)) continue;

      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1 || (arr.length <= 2 && c.length > 0));

      if (cells.length === 0) continue;

      const rawDate = dateIdx !== -1 ? cells[dateIdx] : cells[0];
      if (!rawDate) continue;
      const date = normalizeMarkdownDate(rawDate);

      const title = titleIdx !== -1 && cells[titleIdx] ? cells[titleIdx] : `Transaction #${parsedList.length + 1}`;

      let amount = 0;
      let txType: TransactionType = 'expense';

      if (debitIdx !== -1 || creditIdx !== -1) {
        const debitVal = debitIdx !== -1 ? evaluateMathExpression(cells[debitIdx] || '') : 0;
        const creditVal = creditIdx !== -1 ? evaluateMathExpression(cells[creditIdx] || '') : 0;
        if (creditVal > 0) {
          amount = creditVal;
          txType = 'income';
        } else if (debitVal > 0) {
          amount = debitVal;
          txType = 'expense';
        }
      } else if (amountIdx !== -1) {
        amount = evaluateMathExpression(cells[amountIdx] || '');
        if (typeIdx !== -1 && cells[typeIdx]) {
          const typeStr = cells[typeIdx].toLowerCase().trim();
          if (typeStr.includes('income') || typeStr.includes('cr') || typeStr.includes('deposit') || typeStr.includes('salary')) {
            txType = 'income';
          } else if (typeStr.includes('saving') || typeStr.includes('vault') || typeStr.includes('invest')) {
            txType = 'savings';
          } else {
            txType = 'expense';
          }
        } else {
          if (title.toLowerCase().includes('salary') || title.toLowerCase().includes('freelance') || title.toLowerCase().includes('payout')) {
            txType = 'income';
          } else {
            txType = 'expense';
          }
        }
      }

      if (amount <= 0) continue;

      let category: CategoryKey = 'General';
      const rawCat = categoryIdx !== -1 ? cells[categoryIdx] : null;
      if (rawCat && rawCat.trim()) {
        category = matchCategory(rawCat);
      } else if (txType === 'income') {
        category = 'Salary';
      } else {
        category = detectCategoryFromTitle(title);
        if (category === 'General') {
          unrecognizedCount++;
        }
      }

      if (txType === 'income') totalIncome += amount;
      else totalExpense += amount;

      const isRecurring = recurringIdx !== -1
        ? ['yes', 'true', '1'].includes((cells[recurringIdx] || '').toLowerCase().trim())
        : false;

      const source = sourceIdx !== -1 && cells[sourceIdx] ? cells[sourceIdx] : file.name;
      const note = noteIdx !== -1 && cells[noteIdx] ? cells[noteIdx] : '';

      parsedList.push({
        id: `md-${Date.now()}-${parsedList.length}`,
        date,
        title,
        amount,
        type: txType,
        category,
        isRecurring,
        note,
        source
      });
    }
  } else {
    // MATRIX / Multi-column budget table format
    // e.g. | Date | Transport | Extra Expenditure | Income | Savings | Remarks |
    const matrixColumns: MatrixColumnDef[] = rawHeaders.map((colName, idx) => {
      const lower = colName.toLowerCase();
      let type: MatrixColumnDef['type'] = 'expense';
      let category: CategoryKey = 'General';

      if (lower.includes('date') || lower === 'day') {
        type = 'date';
      } else if (lower.includes('remark') || lower.includes('note') || lower.includes('description') || lower.includes('item')) {
        type = 'remarks';
      } else if (lower.includes('income') || lower.includes('salary') || lower.includes('credit') || lower.includes('deposit')) {
        type = 'income';
        category = 'Salary';
      } else if (lower.includes('saving') || lower.includes('vault') || lower.includes('invest')) {
        type = 'savings';
        category = 'Savings';
      } else if (lower.includes('transport') || lower.includes('travel') || lower.includes('mrt') || lower.includes('grab')) {
        type = 'expense';
        category = 'Transport';
      } else if (lower.includes('food') || lower.includes('dining') || lower.includes('meal')) {
        type = 'expense';
        category = 'Food';
      } else if (lower.includes('bill') || lower.includes('utilit')) {
        type = 'expense';
        category = 'Bills';
      } else if (lower.includes('rent') || lower.includes('housing')) {
        type = 'expense';
        category = 'Rent';
      } else {
        type = 'expense';
        category = matchCategory(colName);
      }

      return {
        index: idx,
        header: colName,
        type,
        category
      };
    });

    const dateCol = matrixColumns.find((c) => c.type === 'date') || matrixColumns[0];
    const remarksCol = matrixColumns.find((c) => c.type === 'remarks');

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || !line.includes('|')) continue;
      if (/^\|?[\s-:]+(\|[\s-:]+)+\|?$/.test(line)) continue;

      const rawCells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1 || (arr.length <= 2 && c.length > 0));

      if (rawCells.length === 0) continue;

      const rawDate = rawCells[dateCol.index] || '';
      if (!rawDate) continue;

      const date = normalizeMarkdownDate(rawDate);
      const remarks = remarksCol && rawCells[remarksCol.index] ? rawCells[remarksCol.index].trim() : '';

      matrixColumns.forEach((col) => {
        if (col.type === 'date' || col.type === 'remarks') return;

        const cellVal = rawCells[col.index] || '';
        if (!cellVal) return;

        const amount = evaluateMathExpression(cellVal);
        if (amount <= 0) return;

        let txType: TransactionType = 'expense';
        let category: CategoryKey = col.category;
        let title = col.header;

        if (col.type === 'income') {
          txType = 'income';
          category = 'Salary';
        } else if (col.type === 'savings') {
          txType = 'savings';
          category = 'Savings';
        } else {
          txType = 'expense';
        }

        if (remarks) {
          title = `${remarks} (${col.header})`;
          const detectedFromRemarks = detectCategoryFromTitle(remarks);
          if (detectedFromRemarks !== 'General' && col.category === 'General') {
            category = detectedFromRemarks;
          }
        }

        if (txType === 'income') {
          totalIncome += amount;
        } else {
          totalExpense += amount;
        }

        if (category === 'General') {
          unrecognizedCount++;
        }

        parsedList.push({
          id: `md-${Date.now()}-${parsedList.length}`,
          date,
          title,
          amount,
          type: txType,
          category,
          isRecurring: false,
          note: `Markdown Table (${file.name})`,
          source: file.name
        });
      });
    }
  }

  if (parsedList.length === 0) {
    throw new Error('No transaction amounts found in the Markdown table.');
  }

  return {
    fileName: file.name,
    transactions: parsedList,
    totalIncome,
    totalExpense,
    unrecognizedCount
  };
}

export function generateSampleMarkdown(): string {
  return `| Date | Title | Amount | Type | Category | Source | Note | Recurring |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-09-12 | DBS Direct Salary Tech Corp | $6,200.00 | income | Salary | DBS Multi-Currency | Bi-weekly Salary | Yes |
| 2026-09-10 | Monthly Rental Transfer Landlord | $1,850.00 | expense | Rent | UOB Auto Giro | Monthly Fixed | Yes |
| 2026-09-09 | FairPrice Supermarket Orchard | $164.20 | expense | Food | DBS Debit Card | Weekly Grocery Haul | No |
| 2026-09-08 | Grab Car Trip to Marina Bay | $26.50 | expense | Transport | GrabPay | Commute | No |
| 2026-09-07 | SP Services Electricity Bill | $178.40 | expense | Bills | SP Services | Utilities | Yes |
| 2026-09-06 | Din Tai Fung Restaurant Dinner | $98.50 | expense | Food | DBS PayLah! | Family Dinner | No |
| 2026-09-05 | SimplyGo MRT Transport | $18.00 | expense | Transport | SimplyGo Transit | Daily MRT | No |
| 2026-09-04 | Uniqlo Ion Orchard | $89.00 | expense | General | Visa Debit | Apparel | No |
| 2026-09-03 | Starbucks Coffee Ion Mall | $8.50 | expense | Food | Contactless Chip | Morning Coffee | No |
| 2026-09-02 | Singtel Mobile & Fibre Broadband | $62.00 | expense | Bills | GIRO | Broadband | Yes |
| 2026-09-01 | Shell Petrol Station Ang Mo Kio | $75.00 | expense | Transport | Shell Card | Fuel Top-up | No |
| 2026-08-28 | Freelance Web Consultation | $950.00 | income | Salary | PayNow | Client Consultation | No |
| 2026-08-25 | Watsons Pharmacy Healthcare | $45.00 | expense | General | Visa Debit | Health & Personal | No |`;
}
