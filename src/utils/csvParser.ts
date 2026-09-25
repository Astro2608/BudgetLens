import Papa from 'papaparse';
import { Transaction, CategoryKey, TransactionType } from '../types/finance';
import { detectCategoryFromTitle, matchCategory } from '../config/categoryConfig';

import { parseCleanFinancialAmount, reconcileRunningBalances } from './bankTemplates';

export interface CSVParseResult {
  fileName: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  unrecognizedCount: number;
  rawColumns?: string[];
  rawRows?: string[][];
  bankDetected?: string;
  balanceDiscrepancyCount?: number;
}

interface ColumnMapping {
  date: string | null;
  title: string | null;
  description: string | null;
  amount: string | null;
  debit: string | null;
  credit: string | null;
  balance: string | null;
  category: string | null;
  type: string | null;
  source: string | null;
  note: string | null;
  tags: string | null;
  recurring: string | null;
}

function cleanNumeric(val: any): number {
  return parseCleanFinancialAmount(val).amount;
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
      const idx = lower.findIndex((f) => {
        if (pat.length <= 2) {
          // Exact token or isolated word boundary (e.g. stops 'cr' matching 'description')
          return f === pat || new RegExp(`(^|[^a-z0-9])${pat}([^a-z0-9]|$)`, 'i').test(f);
        }
        return f === pat || f.includes(pat);
      });
      if (idx !== -1) return fields[idx];
    }
    return null;
  };

  const date = findMatch(['transaction date', 'txn date', 'posting date', 'value date', 'date', 'time']);
  const title = findMatch(['title', 'merchant', 'payee']);
  const description = findMatch(['description', 'transaction description', 'narrative', 'particulars', 'remarks', 'details']);
  const amount = findMatch(['transaction amount', 'amount', 'net amount', 'total', 'amt', 'price', 'sgd', 'usd', 'inr', 'eur', 'gbp', 'jpy', 'aud', 'cad', 'myr', 'cny', 'val']);
  let debit = findMatch(['debit amount', 'withdrawal', 'debit', 'outflow', 'dr']);
  let credit = findMatch(['credit amount', 'deposit', 'credit', 'inflow', 'cr']);
  const balance = findMatch(['closing balance', 'balance', 'bal', 'running balance']);
  const category = findMatch(['category', 'expense category']);
  const type = findMatch(['type', 'txn type', 'transaction type', 'cr/dr']);
  const source = findMatch(['source', 'account', 'bank', 'card']);
  const tags = findMatch(['tags', 'tag', 'labels', 'keywords']);
  const note = findMatch(['note', 'notes', 'memo']);
  const recurring = findMatch(['recurring', 'isrecurring', 'subscription']);

  // Guard: debit/credit must never falsely alias title, description, date, or amount
  if (debit && (debit === title || debit === description || debit === date)) debit = null;
  if (credit && (credit === title || credit === description || credit === date)) credit = null;

  return {
    date: date || fields[0],
    title: title || description || fields[1] || fields[0],
    description,
    amount: amount || (!debit && !credit ? fields[2] || fields[0] : null),
    debit,
    credit,
    balance,
    category,
    type,
    source,
    tags,
    note,
    recurring
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

          const WITHDRAWAL_KEYWORDS = [
            'fairprice', 'ntuc', 'grab', 'gojek', 'foodpanda', 'deliveroo', 'starbucks', 'mcdonald',
            'uniqlo', 'shopee', 'lazada', 'amazon', 'singtel', 'starhub', 'm1', 'sp services', 'sp digital',
            'shell', 'esso', 'caltex', 'sinopec', 'din tai fung', 'watsons', 'guardian', 'sephora',
            'supermarket', 'mart', 'restaurant', 'cafe', 'baking', 'coffee', 'bakery', 'transport',
            'simplygo', 'mrt', 'bus', 'taxi', 'petrol', 'fuel', 'insurance', 'rental', 'rent',
            'subscription', 'netflix', 'spotify', 'apple.com', 'google *', 'payment to', 'transfer to',
            'withdraw', 'atm', 'outward fast', 'fee', 'charge', 'tax', 'interest charged'
          ];

          rows.forEach((row, index) => {
            const dateVal = row[mapping.date || ''] || new Date().toISOString().split('T')[0];
            const date = normalizeDate(String(dateVal));

            const rawTitle = (mapping.title && row[mapping.title]) 
              || (mapping.description && row[mapping.description]) 
              || `CSV Tx #${index + 1}`;
            const title = String(rawTitle).trim();
            const lowerTitle = title.toLowerCase();

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
              if (mapping.type && row[mapping.type]) {
                const typeStr = String(row[mapping.type]).toLowerCase().trim();
                if (
                  typeStr.includes('income') || 
                  typeStr.includes('deposit') || 
                  typeStr.includes('inflow') || 
                  typeStr.includes('salary') ||
                  typeStr === 'cr' ||
                  /\bcr\b/i.test(typeStr)
                ) {
                  txType = 'income';
                } else if (typeStr.includes('saving') || typeStr.includes('vault') || typeStr.includes('invest')) {
                  txType = 'savings';
                } else {
                  txType = 'expense';
                }
                amt = Math.abs(rawAmt);
              } else {
                if (rawAmt > 0) {
                  amt = rawAmt;
                  // If raw amount is positive but title indicates expense vs income:
                  if (lowerTitle.includes('salary') || lowerTitle.includes('payroll') || lowerTitle.includes('freelance') || lowerTitle.includes('dividend') || lowerTitle.includes('paynow in')) {
                    txType = 'income';
                  } else {
                    txType = 'expense';
                  }
                } else {
                  amt = Math.abs(rawAmt);
                  txType = 'expense';
                }
              }
            }

            // Title Sentiment Override for obvious expense merchants (only if no explicit type column was provided)
            if (!mapping.type && WITHDRAWAL_KEYWORDS.some((kw) => lowerTitle.includes(kw))) {
              txType = 'expense';
            }

            if (amt <= 0) return;

            // Resolve Category: prioritize explicitly mapped category column
            let category: CategoryKey = 'General';
            const rawCategory = mapping.category ? row[mapping.category] : null;

            if (rawCategory && String(rawCategory).trim()) {
              category = matchCategory(String(rawCategory));
            } else if (txType === 'income') {
              category = 'Salary';
            } else {
              category = detectCategoryFromTitle(title);
              if (category === 'General') {
                unrecognizedCount++;
              }
            }

            const isRecurring = mapping.recurring
              ? ['yes', 'true', '1', 'recurring'].includes(String(row[mapping.recurring]).toLowerCase().trim())
              : false;

            const source = mapping.source && row[mapping.source] ? String(row[mapping.source]).trim() : file.name;
            const note = mapping.note && row[mapping.note] ? String(row[mapping.note]).trim() : `e-Statement (${file.name})`;
            const descRaw = mapping.description && mapping.description !== mapping.title && row[mapping.description] 
              ? String(row[mapping.description]).trim() 
              : undefined;
            const tagsRaw = mapping.tags && row[mapping.tags] ? String(row[mapping.tags]).split(/[;,]/).map((s) => s.trim()).filter(Boolean) : undefined;

            const runningBalance = mapping.balance && row[mapping.balance] ? cleanNumeric(row[mapping.balance]) : undefined;

            parsedList.push({
              id: `csv-${Date.now()}-${index}`,
              date,
              title,
              description: descRaw,
              amount: amt,
              type: txType,
              category,
              isRecurring,
              note,
              source,
              tags: tagsRaw,
              runningBalance: runningBalance && runningBalance > 0 ? runningBalance : undefined
            });
          });

          // Holistic Batch Anomaly Detection (only if no explicit type column was provided)
          if (!mapping.type) {
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
          }

          const { discrepancyCount } = reconcileRunningBalances(parsedList);

          parsedList.forEach((t) => {
            if (t.type === 'income') totalIncome += t.amount;
            else totalExpense += t.amount;
          });

          const rawRows = rows.map((r) => fields.map((f) => String(r[f] ?? '')));

          resolve({
            fileName: file.name,
            transactions: parsedList,
            totalIncome,
            totalExpense,
            unrecognizedCount,
            rawColumns: fields,
            rawRows,
            balanceDiscrepancyCount: discrepancyCount
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
  return `Date,Title,Amount,Type,Category,Source,Note,Recurring
2026-09-12,DBS Direct Salary Tech Corp,6200.00,income,Salary,DBS Multi-Currency,Bi-weekly Salary,Yes
2026-09-10,Monthly Rental Transfer Landlord,1850.00,expense,Rent,UOB Auto Giro,Monthly Fixed,Yes
2026-09-09,FairPrice Supermarket Orchard,164.20,expense,Food,DBS Debit Card,Weekly Grocery Haul,No
2026-09-08,Grab Car Trip to Marina Bay,26.50,expense,Transport,GrabPay,Commute,No
2026-09-07,SP Services Electricity Bill,178.40,expense,Bills,SP Services,Utilities,Yes
2026-09-06,Din Tai Fung Restaurant Dinner,98.50,expense,Food,DBS PayLah!,Family Dinner,No
2026-09-05,SimplyGo MRT Transport,18.00,expense,Transport,SimplyGo Transit,Daily MRT,No
2026-09-04,Uniqlo Ion Orchard,89.00,expense,General,Visa Debit,Apparel,No
2026-09-03,Starbucks Coffee Ion Mall,8.50,expense,Food,Contactless Chip,Morning Coffee,No
2026-09-02,Singtel Mobile & Fibre Broadband,62.00,expense,Bills,GIRO,Broadband,Yes
2026-09-01,Shell Petrol Station Ang Mo Kio,75.00,expense,Transport,Shell Card,Fuel Top-up,No
2026-08-28,Freelance Web Consultation,950.00,income,Salary,PayNow,Client Consultation,No
2026-08-25,Watsons Pharmacy Healthcare,45.00,expense,General,Visa Debit,Health & Personal,No`;
}
