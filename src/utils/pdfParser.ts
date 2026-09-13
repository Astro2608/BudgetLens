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

  // Pattern: 15 Oct 2026 or 15 Oct
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

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
  const amountRegex = /(?:SGD|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\s*(CR|DR)?/gi;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (!items || items.length === 0) continue;

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
      // Sort words in line from left to right
      line.items.sort((a, b) => a.x - b.x);
      const fullLineText = line.items.map((i) => i.str.trim()).join(' ');

      // Check if line contains a date and an amount
      const dateMatch = fullLineText.match(dateRegex);
      if (!dateMatch) return;

      const rawAmounts: { str: string; amount: number; isCR: boolean; isDR: boolean }[] = [];
      let m: RegExpExecArray | null;

      const amtScanner = new RegExp(amountRegex);
      while ((m = amtScanner.exec(fullLineText)) !== null) {
        const num = cleanNumeric(m[1]);
        const flag = (m[2] || '').toUpperCase();
        if (num > 0) {
          rawAmounts.push({
            str: m[0],
            amount: num,
            isCR: flag === 'CR' || fullLineText.toUpperCase().includes('SALARY') || fullLineText.toUpperCase().includes('DEPOSIT') || fullLineText.toUpperCase().includes('PAYROLL') || fullLineText.toUpperCase().includes('CREDIT'),
            isDR: flag === 'DR' || fullLineText.toUpperCase().includes('DEBIT') || fullLineText.toUpperCase().includes('WITHDRAWAL')
          });
        }
      }

      if (rawAmounts.length === 0) return;

      // Extract transaction date
      const date = normalizeDate(dateMatch[0]);

      // Remove date and amounts from the line text to isolate the merchant/description
      let description = fullLineText.replace(dateMatch[0], '');
      rawAmounts.forEach((a) => {
        description = description.replace(a.str, '');
      });

      // Clean up description
      description = description
        .replace(/SGD|\$|CR|DR|Balance|Transfer/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!description || description.length < 2) {
        description = `Bank Transaction (${date})`;
      }

      // First valid amount is typically the transaction amount
      const chosenAmountObj = rawAmounts[0];
      const amount = chosenAmountObj.amount;

      let txType: TransactionType = 'expense';
      if (chosenAmountObj.isCR && !chosenAmountObj.isDR) {
        txType = 'income';
      }

      // Match category
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
      'Could not detect structured transaction tables in this PDF. Please ensure the statement is an official digital e-statement (not a scanned image).'
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
