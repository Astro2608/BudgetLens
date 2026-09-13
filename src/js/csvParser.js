/**
 * Lumina Finance Dashboard - Bank e-Statement CSV Parser
 * 100% Offline client-side CSV extraction with automatic header detection and keyword category mapping.
 */

import Papa from 'papaparse';

export class BankStatementParser {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  parseFile(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const parsedTransactions = this.processRawRows(results.data, results.meta.fields);
            resolve(parsedTransactions);
          } catch (err) {
            reject(err);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  parseCSVText(text) {
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const parsedTransactions = this.processRawRows(results.data, results.meta.fields);
            resolve(parsedTransactions);
          } catch (err) {
            reject(err);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  processRawRows(rows, fields) {
    if (!rows || rows.length === 0) {
      throw new Error('The uploaded CSV file contains no data rows.');
    }

    const fieldMap = this.detectColumnMapping(fields);
    const parsedList = [];

    rows.forEach((row, index) => {
      // Extract date
      let dateVal = row[fieldMap.date] || new Date().toISOString().split('T')[0];
      const normalizedDate = this.normalizeDate(dateVal);

      // Extract title / description
      const title = (row[fieldMap.description] || row[fieldMap.merchant] || `Transaction #${index + 1}`).trim();

      // Extract amount and transaction type
      let amount = 0;
      let type = 'expense';

      if (fieldMap.debit && fieldMap.credit) {
        // Dual column bank export (e.g. DBS / OCBC / UOB)
        const debitRaw = this.cleanNumeric(row[fieldMap.debit]);
        const creditRaw = this.cleanNumeric(row[fieldMap.credit]);

        if (creditRaw > 0) {
          amount = creditRaw;
          type = 'income';
        } else if (debitRaw > 0) {
          amount = debitRaw;
          type = 'expense';
        }
      } else if (fieldMap.amount) {
        // Single Amount column
        const rawAmount = this.cleanNumeric(row[fieldMap.amount]);
        
        // If there's an explicit type column
        if (fieldMap.type) {
          const typeStr = (row[fieldMap.type] || '').toLowerCase();
          if (typeStr.includes('cr') || typeStr.includes('income') || typeStr.includes('deposit')) {
            type = 'income';
          } else {
            type = 'expense';
          }
          amount = Math.abs(rawAmount);
        } else {
          // Standard sign: positive = credit/income, negative = debit/expense
          if (rawAmount > 0) {
            amount = rawAmount;
            type = 'income';
          } else {
            amount = Math.abs(rawAmount);
            type = 'expense';
          }
        }
      }

      if (amount <= 0) return; // Skip invalid zero amounts

      // Category matching: check if row has a category column, otherwise auto-match by keyword
      let categoryId = 'general';
      if (type === 'income') {
        categoryId = 'salary';
      } else if (fieldMap.category && row[fieldMap.category]) {
        const found = this.stateManager.getState().categories.find(c => 
          c.name.toLowerCase() === row[fieldMap.category].toLowerCase() ||
          c.id.toLowerCase() === row[fieldMap.category].toLowerCase()
        );
        categoryId = found ? found.id : this.stateManager.matchCategoryFromTitle(title);
      } else {
        categoryId = this.stateManager.matchCategoryFromTitle(title);
      }

      parsedList.push({
        id: `csv-${Date.now()}-${index}`,
        title,
        amount,
        type,
        categoryId,
        date: normalizedDate,
        isRecurring: false,
        note: 'Imported from e-Statement'
      });
    });

    return parsedList;
  }

  detectColumnMapping(fields) {
    const lower = fields.map(f => f.toLowerCase().trim());
    const mapping = {};

    const findMatch = (patterns) => {
      for (const pat of patterns) {
        const idx = lower.findIndex(f => f === pat || f.includes(pat));
        if (idx !== -1) return fields[idx];
      }
      return null;
    };

    mapping.date = findMatch(['transaction date', 'txn date', 'posting date', 'value date', 'date', 'time']);
    mapping.description = findMatch(['transaction description', 'narrative', 'description', 'particulars', 'remarks', 'details', 'payee', 'merchant']);
    mapping.amount = findMatch(['transaction amount', 'amount', 'net amount', 'total', 'amt']);
    mapping.debit = findMatch(['debit amount', 'withdrawal', 'debit', 'outflow', 'dr']);
    mapping.credit = findMatch(['credit amount', 'deposit', 'credit', 'inflow', 'cr']);
    mapping.category = findMatch(['category', 'expense category', 'tag']);
    mapping.type = findMatch(['type', 'txn type', 'transaction type', 'cr/dr']);

    if (!mapping.date) mapping.date = fields[0];
    if (!mapping.description) mapping.description = fields[1] || fields[0];
    if (!mapping.amount && !mapping.debit && !mapping.credit) {
      mapping.amount = fields[2] || fields[0];
    }

    return mapping;
  }

  cleanNumeric(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    // Remove currency symbols, commas, and extraneous text
    const cleaned = str.replace(/[^0-9.-]/g, '');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  }

  normalizeDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    // Attempt standard parse
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    // Handle DD/MM/YYYY or DD-MM-YYYY formats common in Singapore & UK
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  }

  // Generates ready-to-use Sample Bank Statement CSV
  getSampleCSVContent() {
    return `Date,Description,Debit,Credit,Category
2026-09-12,DBS Direct Salary Tech Corp,,6200.00,Salary & Income
2026-09-10,Monthly Rental Transfer Landlord,1850.00,,Rent & Housing
2026-09-09,FairPrice Supermarket Orchard,164.20,,Food & Dining
2026-09-08,Grab Car Trip to Marina Bay,26.50,,Transport
2026-09-07,SP Services Electricity Bill,178.40,,Bills & Utilities
2026-09-06,Din Tai Fung Restaurant Dinner,98.50,,Food & Dining
2026-09-05,SimplyGo MRT Transport,18.00,,Transport
2026-09-04,Uniqlo Ion Orchard,89.00,,Shopping & Leisure
2026-09-03,Starbucks Coffee Ion Mall,8.50,,Food & Dining
2026-09-02,Singtel Mobile & Fibre Broadband,62.00,,Bills & Utilities
2026-09-01,Shell Petrol Station Ang Mo Kio,75.00,,Transport
2026-08-28,Freelance Web Consultation,,950.00,Salary & Income
2026-08-25,General Hardware Store Purchase,45.00,,General / Miscellaneous`;
  }
}
