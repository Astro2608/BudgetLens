import Papa from 'papaparse';
import { Transaction, CategoryKey, TransactionType } from '../types/finance';
import { detectCategoryFromTitle } from '../config/categoryConfig';

export interface CSVParseResult {
  fileName: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  unrecognizedCount: number;
}

interface ColumnMapping {
  date: string | null;
  description: string | null;
  amount: string | null;
  debit: string | null;
  credit: string | null;
  category: string | null;
  type: string | null;
}

function cleanNumeric(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return new Date().toISOString().split('T')[0];
}

function detectColumnMapping(fields: string[]): ColumnMapping {
  const lower = fields.map((f) => f.toLowerCase().trim());

  const findMatch = (patterns: string[]): string | null => {
    for (const pat of patterns) {
      const idx = lower.findIndex((f) => f === pat || f.includes(pat));
      if (idx !== -1) return fields[idx];
    }
    return null;
  };

  const date = findMatch(['transaction date', 'txn date', 'posting date', 'value date', 'date', 'time']);
  const description = findMatch(['transaction description', 'narrative', 'description', 'particulars', 'remarks', 'details', 'payee', 'merchant']);
  const amount = findMatch(['transaction amount', 'amount', 'net amount', 'total', 'amt']);
  const debit = findMatch(['debit amount', 'withdrawal', 'debit', 'outflow', 'dr']);
  const credit = findMatch(['credit amount', 'deposit', 'credit', 'inflow', 'cr']);
  const category = findMatch(['category', 'expense category', 'tag']);
  const type = findMatch(['type', 'txn type', 'transaction type', 'cr/dr']);

  return {
    date: date || fields[0],
    description: description || fields[1] || fields[0],
    amount: amount || (!debit && !credit ? fields[2] || fields[0] : null),
    debit,
    credit,
    category,
    type
  };
}

export function parseBankCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const fields = results.meta.fields || [];
          const rows = results.data as Record<string, any>[];

          if (!rows || rows.length === 0) {
            throw new Error('The uploaded CSV file contains no data rows.');
          }

          const mapping = detectColumnMapping(fields);
          const parsedList: Transaction[] = [];
          let totalIncome = 0;
          let totalExpense = 0;
          let unrecognizedCount = 0;

          rows.forEach((row, index) => {
            const dateVal = row[mapping.date || ''] || new Date().toISOString().split('T')[0];
            const date = normalizeDate(String(dateVal));

            const rawTitle = (row[mapping.description || ''] || row[mapping.merchant || ''] || `CSV Tx #${index + 1}`);
            const title = String(rawTitle).trim();

            let amt = 0;
            let txType: TransactionType = 'expense';

            if (mapping.debit || mapping.credit) {
              const debitRaw = cleanNumeric(row[mapping.debit || '']);
              const creditRaw = cleanNumeric(row[mapping.credit || '']);

              if (creditRaw > 0) {
                amt = creditRaw;
                txType = 'income';
              } else if (debitRaw > 0) {
                amt = debitRaw;
                txType = 'expense';
              }
            } else if (mapping.amount) {
              const rawAmt = cleanNumeric(row[mapping.amount || '']);
              if (mapping.type) {
                const typeStr = String(row[mapping.type || '']).toLowerCase();
                if (typeStr.includes('cr') || typeStr.includes('income') || typeStr.includes('deposit')) {
                  txType = 'income';
                } else {
                  txType = 'expense';
                }
                amt = Math.abs(rawAmt);
              } else {
                if (rawAmt > 0) {
                  amt = rawAmt;
                  txType = 'income';
                } else {
                  amt = Math.abs(rawAmt);
                  txType = 'expense';
                }
              }
            }

            if (amt <= 0) return;

            // Auto-detect category
            let category: CategoryKey = 'General';
            if (txType === 'income') {
              category = 'Salary';
            } else {
              category = detectCategoryFromTitle(title);
              if (category === 'General') {
                unrecognizedCount++;
              }
            }

            if (txType === 'income') totalIncome += amt;
            else totalExpense += amt;

            parsedList.push({
              id: `csv-${Date.now()}-${index}`,
              date,
              title,
              amount: amt,
              type: txType,
              category,
              isRecurring: false,
              note: `e-Statement (${file.name})`,
              source: file.name
            });
          });

          resolve({
            fileName: file.name,
            transactions: parsedList,
            totalIncome,
            totalExpense,
            unrecognizedCount
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => {
        reject(err);
      }
    });
  });
}

export function generateSampleCSV(): string {
  return `Date,Description,Debit,Credit,Category
2026-09-12,DBS Direct Salary Tech Corp,,6200.00,Salary & Income
2026-09-10,Monthly Rental Transfer Landlord,1850.00,,Rent & Housing
2026-09-09,FairPrice Supermarket Orchard,164.20,,Food & Dining
2026-09-08,Grab Car Trip to Marina Bay,26.50,,Transport
2026-09-07,SP Services Electricity Bill,178.40,,Bills & Utilities
2026-09-06,Din Tai Fung Restaurant Dinner,98.50,,Food & Dining
2026-09-05,SimplyGo MRT Transport,18.00,,Transport
2026-09-04,Uniqlo Ion Orchard,89.00,,General / Others
2026-09-03,Starbucks Coffee Ion Mall,8.50,,Food & Dining
2026-09-02,Singtel Mobile & Fibre Broadband,62.00,,Bills & Utilities
2026-09-01,Shell Petrol Station Ang Mo Kio,75.00,,Transport
2026-08-28,Freelance Web Consultation,,950.00,Salary & Income
2026-08-25,Watsons Pharmacy Healthcare,45.00,,General / Others`;
}
