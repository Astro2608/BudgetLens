import { Transaction, CategoryKey, TransactionType } from '../types/finance';
import { detectCategoryFromTitle } from '../config/categoryConfig';
import { CSVParseResult } from './csvParser';

// Evaluate simple math expressions like "$10 + 60.5+ 15" or "$4.7" or "800"
function evaluateMathExpression(raw: string): number {
  if (!raw) return 0;
  // Clean all characters except digits, dots, plus signs, minus signs, and commas
  const cleaned = raw.replace(/[$,]/g, '').trim();
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

// Normalize Markdown table dates (e.g. "Jan 3", "Feb 16", "2026-01-03", "16 Jan 2026")
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

interface ColumnDef {
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
  let columns: ColumnDef[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.includes('|')) {
      const rawCols = line
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1 || (arr.length <= 2 && c.length > 0));

      if (rawCols.length >= 2) {
        headerIndex = i;
        columns = rawCols.map((colName, idx) => {
          const lower = colName.toLowerCase();
          let type: ColumnDef['type'] = 'expense';
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
            category = detectCategoryFromTitle(colName);
          }

          return {
            index: idx,
            header: colName,
            type,
            category
          };
        });
        break;
      }
    }
  }

  if (headerIndex === -1 || columns.length === 0) {
    throw new Error('Could not find a valid Markdown table in this file. Please ensure columns are formatted with pipes (|).');
  }

  const dateCol = columns.find((c) => c.type === 'date') || columns[0];
  const remarksCol = columns.find((c) => c.type === 'remarks');

  // 2. Parse table rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.includes('|')) continue;
    // Skip separator lines like |---|---|
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

    // Check each monetary column in this row
    columns.forEach((col) => {
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

      // If remarks exist, enrich title and category
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
  return `| Date   | Transport | Extra Expenditure | Income | Savings | Remarks                  |
| ------ | --------- | ----------------- | ------ | ------- | ------------------------ |
| Jan 3  | $3        | $4.70             |        |         | Morning Coffee & Toast   |
| Jan 6  | $3        | $10.00            |        |         | FairPrice Snacks         |
| Jan 12 | $3        |                   | $800   | $500    | Bi-weekly Payout         |
| Jan 16 | $3        | $10 + 60.50 + 15  |        |         | Starhub Broadband & Bills|
| Jan 20 | $8.50     | $10.00            |        |         | Grab Taxi & Lunch        |
| Jan 30 | $3        | $10.00            | $1200  |         | Monthly Salary           |
| Jan 31 | $3        | $25.00            |        |         | Shopee Online Purchase   |
| Feb 2  | $3        | $15.00            |        |         | Groceries FairPrice      |
| Feb 3  | $3        | $25.00            |        |         | Headphones Store         |
| Feb 7  | $3        | $30.00            | $400   |         | Freelance Bonus          |`;
}
