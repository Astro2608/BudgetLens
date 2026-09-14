import { Transaction, TransactionType } from '../types/finance';
import { detectCategoryFromTitle } from '../config/categoryConfig';
import { CSVParseResult } from './csvParser';
import { v4 as uuidv4 } from 'uuid';

export async function parseFreeformText(text: string): Promise<CSVParseResult> {
  const lines = text.split('\n');
  const transactions: Transaction[] = [];
  let currentYear = new Date().getFullYear().toString();
  let currentGroup = '';

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Remove brackets for easier parsing like (Flight- 42880) -> Flight- 42880
    // Also remove any trailing brackets or commas
    let cleanLine = line.replace(/^[()\[\]]+|[()\[\]]+$/g, '').trim();

    // 1. Detect Year explicitly (e.g. "2026")
    if (/^(19|20)\d{2}$/.test(cleanLine)) {
      currentYear = cleanLine;
      continue;
    }

    // 2. Date regex: e.g. "2nd march", "17th march", "1.FEB", "01 sept"
    // Also captures the rest of the line
    const dateMatch = cleanLine.match(/^(\d{1,2}(?:st|nd|rd|th)?\.?\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)\s*[-:]?\s*(.*)/i);
    
    let dateStr = '';
    let content = cleanLine;
    let title = '';
    let amount = 0;
    let type: TransactionType = 'expense';

    if (dateMatch) {
      // It's a date-based transaction
      const rawDate = dateMatch[1];
      content = dateMatch[2]; // e.g. "10000-5000=5000" or "5000"

      // Parse date to YYYY-MM-DD
      const dateParts = rawDate.replace(/\./g, ' ').replace(/st|nd|rd|th/i, '').trim().split(/\s+/);
      let day = dateParts[0].padStart(2, '0');
      let monthStr = dateParts[1].substring(0, 3).toLowerCase();
      const monthMap: Record<string, string> = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
        'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
      let month = monthMap[monthStr] || '01';
      dateStr = `${currentYear}-${month}-${day}`;
      
      // Parse math equation from content
      // E.g. "10000-5000=5000" or "10000+5000=15000"
      const mathMatch = content.match(/\d+\s*([+-])\s*(\d+(?:\.\d+)?)\s*=\s*\d+/);
      if (mathMatch) {
        const sign = mathMatch[1];
        const val = parseFloat(mathMatch[2]);
        amount = val;
        type = sign === '+' ? 'income' : 'expense';
        title = `Ledger Entry on ${rawDate}`;
      } else {
        // e.g. "5000" or "Expense 5000"
        const amtMatch = content.match(/([+-]?\d+(?:\.\d+)?)/);
        if (amtMatch) {
           amount = parseFloat(amtMatch[1].replace(/[+-]/g, ''));
           type = amtMatch[1].includes('+') ? 'income' : 'expense';
        }
        title = content.replace(/[+-]?\d+(?:\.\d+)?/g, '').trim() || `Transaction on ${rawDate}`;
      }
    } else {
      // Group or sub-item (e.g. "North trip- 68200" or "Flight- 42880")
      // Check for Amount
      const amtMatch = cleanLine.match(/([+-]?\d+(?:\.\d+)?)$/);
      if (amtMatch) {
        amount = parseFloat(amtMatch[1].replace(/[+-]/g, ''));
        const textPart = cleanLine.replace(amtMatch[1], '').replace(/[-:]$/, '').trim();
        
        // Skip "Remaining - 41400" entirely since it's just a balance indicator
        if (textPart.toLowerCase().includes('remaining')) {
           continue; 
        }

        if (textPart.toLowerCase().includes('trip') || !currentGroup) {
          currentGroup = textPart;
          title = textPart;
        } else {
          title = `${currentGroup}: ${textPart}`;
        }
        
        // We don't have a date for this, so use today's date
        dateStr = new Date().toISOString().split('T')[0];
        type = 'expense';
      } else {
         // No amount, might be just a group header
         if (cleanLine.length > 0) {
            currentGroup = cleanLine.replace(/[-:]$/, '').trim();
         }
         continue;
      }
    }

    if (amount > 0) {
      transactions.push({
        id: uuidv4(),
        date: dateStr || new Date().toISOString().split('T')[0],
        title: title || 'Freeform Transaction',
        amount,
        type,
        category: detectCategoryFromTitle(title),
        source: 'Freeform Notes'
      });
    }
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return {
    fileName: 'Freeform Notes Import',
    transactions,
    totalIncome,
    totalExpense,
    unrecognizedCount: 0
  };
}
