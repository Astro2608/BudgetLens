import * as pdfjsLib from 'pdfjs-dist';
import { Transaction, TransactionType, CategoryKey } from '../types/finance';
import { detectCategoryFromTitle } from '../config/categoryConfig';
import { CSVParseResult } from './csvParser';
import { normalizeDateUniversal, reconcileRunningBalances } from './bankTemplates';

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  details?: any;
  capabilities?: string;
}

export interface PullProgress {
  status: string;
  completed?: number;
  total?: number;
  percent?: number;
}

export interface LocalAiConfig {
  enabled: boolean;
  endpoint: string;
  selectedModel: string;
}

const STORAGE_KEY = 'budgetlens_local_ai_config';

export function getLocalAiConfig(): LocalAiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    enabled: false,
    endpoint: '/ollama',
    selectedModel: 'gemma4:e4b'
  };
}

export function saveLocalAiConfig(config: Partial<LocalAiConfig>): void {
  const current = getLocalAiConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Check if local Ollama service is reachable and discover models
 */
export async function checkOllamaStatus(customEndpoint?: string): Promise<{
  isConnected: boolean;
  models: OllamaModel[];
  recommendedModel: string;
  error?: string;
}> {
  const baseUrls = [
    customEndpoint,
    getLocalAiConfig().endpoint,
    '/ollama',
    'http://localhost:11434',
    'http://127.0.0.1:11434'
  ].filter(Boolean) as string[];

  for (const base of baseUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${base}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const models: OllamaModel[] = (data.models || []).map((m: any) => ({
          name: m.name,
          size: m.size,
          modified_at: m.modified_at,
          details: m.details,
          capabilities: typeof m.capabilities === 'string' ? m.capabilities : (m.details?.families || []).join(' ')
        }));

        let recommended = 'gemma4:e4b';
        const modelNames = models.map((m) => m.name.toLowerCase());

        if (modelNames.some((n) => n.includes('gemma4:e4b'))) {
          recommended = models.find((m) => m.name.toLowerCase().includes('gemma4:e4b'))!.name;
        } else if (modelNames.some((n) => n.includes('qwen2.5-vl'))) {
          recommended = models.find((m) => m.name.toLowerCase().includes('qwen2.5-vl'))!.name;
        } else if (modelNames.some((n) => n.includes('llama3.2-vision'))) {
          recommended = models.find((m) => m.name.toLowerCase().includes('llama3.2-vision'))!.name;
        } else if (modelNames.some((n) => n.includes('gemma4'))) {
          recommended = models.find((m) => m.name.toLowerCase().includes('gemma4'))!.name;
        } else if (models.length > 0) {
          recommended = models[0].name;
        }

        saveLocalAiConfig({ endpoint: base, selectedModel: recommended });

        return {
          isConnected: true,
          models,
          recommendedModel: recommended
        };
      }
    } catch {
      // try next fallback base url
    }
  }

  return {
    isConnected: false,
    models: [],
    recommendedModel: 'gemma4:e4b',
    error: 'Could not connect to Ollama on localhost:11434'
  };
}

/**
 * Stream pull an Ollama model with live progress updates
 */
export async function pullModelStream(
  modelName: string,
  onProgress: (progress: PullProgress) => void
): Promise<boolean> {
  const config = getLocalAiConfig();
  const base = config.endpoint || '/ollama';

  try {
    const res = await fetch(`${base}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName })
    });

    if (!res.ok) {
      throw new Error(`Failed to pull model: HTTP ${res.status}`);
    }

    if (!res.body) {
      throw new Error('No readable response body from Ollama stream');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const completed = parsed.completed || 0;
          const total = parsed.total || 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : undefined;

          onProgress({
            status: parsed.status || 'Downloading...',
            completed,
            total,
            percent
          });

          if (parsed.status === 'success') {
            saveLocalAiConfig({ selectedModel: modelName });
            return true;
          }
        } catch {
          // ignore chunk parse errors
        }
      }
    }

    saveLocalAiConfig({ selectedModel: modelName });
    return true;
  } catch (err: any) {
    throw new Error(err?.message || 'Error downloading local model');
  }
}

/**
 * Render PDF pages to base64 JPEG images using client-side canvas
 */
export async function renderPdfPagesToImages(
  pdfFile: File,
  maxPages: number = 8,
  scale: number = 1.5
): Promise<{ pageNumber: number; base64: string }[]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pagesToProcess = Math.min(pdf.numPages, maxPages);
  const images: { pageNumber: number; base64: string }[] = [];

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport } as any).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];
    images.push({ pageNumber: pageNum, base64 });
  }

  return images;
}

export function smartCleanBankTitle(raw: string): string {
  if (!raw) return 'Transaction';
  let t = raw.trim();

  // 1. PayNow Inward / Outward extraction
  const paynowTo = t.match(/TO:\s*([A-Z0-9\s.,&'-]+?)(?:\s+\d+\.|\s+OTHER|\s+PAYNOW|$)/i);
  if (paynowTo && paynowTo[1].trim()) {
    return `PayNow to ${cleanMerchantName(paynowTo[1])}`;
  }

  const paynowFrom = t.match(/FROM:\s*([A-Z0-9\s.,&'-]+?)(?:\s+AIMERY|\s+OTHER|\s+PAYNOW|$)/i);
  if (paynowFrom && paynowFrom[1].trim()) {
    return `PayNow from ${cleanMerchantName(paynowFrom[1])}`;
  }

  // 2. Trust Bank / I-Bank transfers
  if (/TRUS:\d+:I-BANK\s*TRANSFER/i.test(t)) {
    return 'Trust Bank Transfer';
  }

  // 3. Loans & Credit Card
  if (/BY\s+CARD\s+CENTRE\s+LOAN/i.test(t)) {
    return 'Card Centre Loan Payment';
  }

  // 4. Transit / SimplyGo
  if (/TRANSIT\s+\d+/i.test(t) || /SIMPLYGO/i.test(t)) {
    return 'Transit SimplyGo (Bus/MRT)';
  }

  // 5. GIRO / Supplier / Remittance
  if (/SAF\s+IMPREST\s+ACCOUNT\s+SUPPLIER\s+PAYMENT/i.test(t)) {
    return 'SAF Supplier Payment';
  }
  if (/MAGES\s+STUDIO\s+PRIVATE/i.test(t)) {
    return 'Mages Studio Private';
  }
  if (/MAGES\s+INSTITUTE\s+OF\s+E/i.test(t)) {
    return 'Mages Institute of Education';
  }
  if (/INTEREST\s+EARNED/i.test(t)) {
    return 'Interest Earned';
  }
  if (/SERVICE\s+CHARGE/i.test(t)) {
    return 'Bank Service Charge';
  }

  // 6. Strip standard bank transaction prefixes
  t = t
    .replace(/^FAST\s+Payment\s*\/\s*Receipt\s*/i, '')
    .replace(/^Debit\s+Card\s+Transaction\s*/i, '')
    .replace(/^Point-of-Sale\s+Transaction\s*/i, '')
    .replace(/^Payments\s*\/\s*Collections\s+via\s+GIRO\s*/i, '')
    .replace(/^Remittance\s+Transfer\s+of\s+Funds\s*/i, '')
    .replace(/^Advice\s+(?:Remittance\s+Transfer\s+of\s+Funds|Outward\s+Telegraphic\s+Transfer)?\s*/i, '')
    .replace(/^PAYNOW\s+TRANSFER\s+\d+\s*/i, '')
    .replace(/^INCOMING\s+PAYNOW\s+REF\s+\d+\s*/i, '');

  // 7. Strip trailing card/transit metadata & reference numbers
  t = t
    .replace(/\bSI\s+SGP\s+\d{1,2}[A-Z]{3}\b.*/i, '')
    .replace(/\bSGP\s+\d{1,2}[A-Z]{3}\b.*/i, '')
    .replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b.*/i, '')
    .replace(/\b00000\d+\b/g, '')
    .replace(/\b\d{10,}\b/g, '')
    .replace(/\bREF[0-9A-Z]+\b/gi, '')
    .replace(/\bVALUE\s+DATE\s*:.*$/gi, '')
    .replace(/\bOTHER\b/gi, '')
    .replace(/,\s*[A-Z0-9]+$/g, '')
    .trim();

  // 8. Specific cleanups
  t = t
    .replace(/^CHEERS\s*-\s*/i, 'Cheers - ')
    .replace(/^GRAB\*\s*/i, 'Grab ')
    .replace(/^AMZNPRIMESG\s+MEMBERSHI/i, 'Amazon Prime')
    .replace(/^UNIQLO\s+WATERWAY\s+POINT/i, 'Uniqlo (Waterway Point)')
    .replace(/^ATLAS\s+VENDING\s+SINGAPORE/i, 'Atlas Vending')
    .replace(/^STARHUB\s+LTD\s+\d+/i, 'StarHub Ltd')
    .replace(/^CGTRADER\s+VILNIUS\s+LTU/i, 'CGTrader')
    .replace(/^\d+,([A-Z\s&]+)/, '$1');

  return cleanMerchantName(t);
}

function cleanMerchantName(str: string): string {
  const cleaned = str
    .replace(/[-_.,]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Transaction';

  if (cleaned === cleaned.toUpperCase() && cleaned.length > 3) {
    return cleaned
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace(/\bSgp\b/g, 'Singapore')
      .replace(/\bLtd\b/g, 'Ltd')
      .replace(/\bSaf\b/g, 'SAF');
  }

  return cleaned;
}

export async function summarizeTitlesWithAi(
  titles: string[],
  model: string,
  base: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (titles.length === 0) return map;

  const uniqueTitles = Array.from(new Set(titles)).slice(0, 35);
  const prompt = `You are a bank statement transaction title cleaner.
Convert these raw messy transaction lines into clean, concise merchant or payee names (under 30 characters).
Strip out prefixes like "Debit Card Transaction", "FAST Payment / Receipt", "Point-of-Sale Transaction", "Advice".
Strip card numbers, transit terminal IDs, and reference numbers.
Extract the true merchant or person (e.g. StarHub Ltd, Grab, Cheers, Uniqlo, PayNow from Aimery, SAF Supplier, Transit SimplyGo).

RAW LIST:
${JSON.stringify(uniqueTitles)}

Return STRICT JSON ARRAY OF CLEAN STRINGS in the EXACT same length and order:
["Clean Title 1", "Clean Title 2", ...]`;

  try {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.1 }
      })
    });
    if (res.ok) {
      const data = await res.json();
      const content = data.response || '';
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        const cleanedArr = JSON.parse(match[0]);
        if (Array.isArray(cleanedArr) && cleanedArr.length === uniqueTitles.length) {
          uniqueTitles.forEach((orig, idx) => {
            const c = (cleanedArr[idx] || '').trim();
            if (c && c.length > 2 && c.length < 50) {
              map.set(orig, c);
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn('AI title summarization fallback to regex cleaner', e);
  }

  return map;
}

interface RawAiTransaction {
  date?: string;
  description?: string;
  title?: string;
  withdrawal?: number | string | null;
  deposit?: number | string | null;
  amount?: number | string | null;
  type?: 'expense' | 'income';
  balance?: number | string | null;
  runningBalance?: number | string | null;
}

/**
 * Parse an e-statement PDF using the local Vision AI model running in Ollama
 */
export async function parsePdfWithLocalAi(
  file: File,
  options?: {
    modelName?: string;
    onProgress?: (message: string, current: number, total: number) => void;
  }
): Promise<CSVParseResult> {
  const config = getLocalAiConfig();
  const model = options?.modelName || config.selectedModel || 'gemma4:e4b';
  const base = config.endpoint || '/ollama';

  options?.onProgress?.('Preparing document & rendering pages...', 0, 1);

  // 1. Render PDF pages into base64 images
  const pages = await renderPdfPagesToImages(file, 8, 1.5);
  if (pages.length === 0) {
    throw new Error('Could not render any readable pages from this PDF.');
  }

  const allTransactions: Transaction[] = [];
  const rawRows: string[][] = [];
  const rawColumns = ['Date', 'Title', 'Withdrawal (Debit)', 'Deposit (Credit)', 'Balance'];

  const systemPrompt = `You are a strict, highly accurate financial accountant parser.
Your task is to visually read this bank statement page image and extract every single transaction row into a clean JSON array.

COLUMN RECOGNITION RULES:
1. Examine column headers carefully:
   - "Withdrawal (-)" / "Debit" is money OUT (Expense). Place this in "withdrawal".
   - "Deposit (+)" / "Credit" is money IN (Income/Deposit). Place this in "deposit".
   - DO NOT confuse columns! If a number is under "Deposit (+)" (e.g. 7.00, 20.89, 1275.00, 400.00), set "deposit": <number> and "withdrawal": null.
2. Group multi-line descriptions into a clean, single merchant/transaction title (e.g. "StarHub Ltd PayNow", "Grab", "Uniqlo Waterway Point", "PayNow from Aimery Tay Radzi").
3. DO NOT include "Balance Brought Forward", "Total Balance Carried Forward", account summary blocks, or promotional disclaimers.
4. Output STRICT JSON format only. No preamble, no explanation, no markdown text outside the json block.
5. JSON Schema:
[
  {
    "date": "YYYY-MM-DD",
    "description": "Merchant or transaction title",
    "withdrawal": 30.37,
    "deposit": null,
    "balance": 1245.06
  }
]
If the page contains no transaction rows (e.g. only terms & conditions or summaries), return an empty array: []`;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    options?.onProgress?.(
      `Analyzing Page ${page.pageNumber} of ${pages.length} with ${model}...`,
      i + 1,
      pages.length
    );

    try {
      const response = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: 'Extract all individual transaction records from this statement page image into a JSON array.',
              images: [page.base64]
            }
          ],
          stream: false,
          options: {
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        console.warn(`Local AI page ${page.pageNumber} error: HTTP ${response.status}`);
        continue;
      }

      const resData = await response.json();
      const content = resData.message?.content || '';

      // Extract JSON array block from LLM output
      let jsonStr = '';
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        const bracketMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (bracketMatch) {
          jsonStr = bracketMatch[0].trim();
        }
      }

      if (!jsonStr) continue;

      let parsedItems: RawAiTransaction[] = [];
      try {
        parsedItems = JSON.parse(jsonStr);
      } catch (e) {
        console.warn(`Failed to parse AI JSON on page ${page.pageNumber}`, e);
        continue;
      }

      if (!Array.isArray(parsedItems)) continue;

      for (const item of parsedItems) {
        const dateRaw = item.date || '';
        if (!dateRaw || dateRaw.toLowerCase().includes('balance')) continue;

        const date = normalizeDateUniversal(dateRaw);
        const title = (item.description || item.title || 'Transaction').trim();

        const withdrawalNum = typeof item.withdrawal === 'number'
          ? item.withdrawal
          : parseFloat(String(item.withdrawal || '').replace(/[^0-9.]/g, '')) || 0;

        const depositNum = typeof item.deposit === 'number'
          ? item.deposit
          : parseFloat(String(item.deposit || '').replace(/[^0-9.]/g, '')) || 0;

        const generalAmount = typeof item.amount === 'number'
          ? item.amount
          : parseFloat(String(item.amount || '').replace(/[^0-9.]/g, '')) || 0;

        const balanceRaw = item.balance ?? item.runningBalance;
        const balanceNum = typeof balanceRaw === 'number'
          ? balanceRaw
          : balanceRaw ? parseFloat(String(balanceRaw).replace(/[^0-9.]/g, '')) : undefined;

        let amount = 0;
        let type: TransactionType = 'expense';

        if (depositNum > 0) {
          amount = depositNum;
          type = 'income';
        } else if (withdrawalNum > 0) {
          amount = withdrawalNum;
          type = 'expense';
        } else if (generalAmount > 0) {
          amount = generalAmount;
          type = item.type === 'income' ? 'income' : 'expense';
        }

        if (amount <= 0) continue;

        let category: CategoryKey = type === 'income' ? 'Salary' : detectCategoryFromTitle(title);

        const txId = `ai-${Date.now()}-${allTransactions.length}`;
        allTransactions.push({
          id: txId,
          date,
          title,
          amount,
          type,
          category,
          isRecurring: false,
          note: `Extracted via Local AI (${model}) - Page ${page.pageNumber}`,
          source: file.name,
          runningBalance: !isNaN(balanceNum as number) ? balanceNum : undefined
        });

        rawRows.push([
          date,
          title,
          type === 'expense' ? String(amount) : '',
          type === 'income' ? String(amount) : '',
          balanceNum !== undefined ? String(balanceNum) : ''
        ]);
      }
    } catch (pageErr) {
      console.warn(`Error processing page ${page.pageNumber} with local AI:`, pageErr);
    }
  }

  if (allTransactions.length === 0) {
    throw new Error(
      `Local AI (${model}) did not find structured transaction rows. Please ensure the local model has vision enabled or fallback to standard parser.`
    );
  }

  // Stage 2: Deposit Quality Check & Mathematical Running Balance Verification
  for (let j = 0; j < allTransactions.length; j++) {
    const current = allTransactions[j];
    const prev = j > 0 ? allTransactions[j - 1] : null;

    const lowerTitle = (current.title || '').toLowerCase();
    const isExplicitDepositKeyword = [
      'incoming paynow', 'fast / inward', 'inward fast', 'transfer from',
      'giro credit', 'deposit', 'dividend', 'refund', 'interest earned',
      'interest credit', 'supplier payment', 'remittance transfer of funds',
      'salary', 'payroll', 'paynow from'
    ].some((kw) => lowerTitle.includes(kw));

    if (isExplicitDepositKeyword) {
      current.type = 'income';
      current.category = 'Salary';
    }

    // Mathematical balance delta cross-check:
    if (prev && current.runningBalance !== undefined && prev.runningBalance !== undefined) {
      const delta = Number((current.runningBalance - prev.runningBalance).toFixed(2));
      // If balance clearly went UP: 100% mathematically a Deposit!
      if (delta > 0.01 && Math.abs(delta - current.amount) < 0.1) {
        current.type = 'income';
        current.category = 'Salary';
      }
      // If balance clearly went DOWN: 100% mathematically an Expense!
      else if (delta < -0.01 && Math.abs(Math.abs(delta) - current.amount) < 0.1) {
        current.type = 'expense';
        if (current.category === 'Salary') {
          current.category = detectCategoryFromTitle(current.title);
        }
      }
    }
  }

  // Stage 3: Smart Title Summarization
  options?.onProgress?.('Polishing & summarizing transaction titles with AI...', pages.length, pages.length);
  const rawTitles = allTransactions.map((t) => t.title);
  const aiCleanedMap = await summarizeTitlesWithAi(rawTitles, model, base);

  allTransactions.forEach((t) => {
    const orig = t.title;
    const cleaned = aiCleanedMap.get(orig) || smartCleanBankTitle(orig);
    t.title = cleaned;
    t.note = `${t.note}\nRaw Description: ${orig}`;
    if (t.type === 'expense') {
      t.category = detectCategoryFromTitle(cleaned);
    }
  });

  // Reconcile running balances
  const { discrepancyCount } = reconcileRunningBalances(allTransactions);

  let totalIncome = 0;
  let totalExpense = 0;
  allTransactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  return {
    fileName: file.name,
    transactions: allTransactions,
    totalIncome,
    totalExpense,
    unrecognizedCount: allTransactions.filter((t) => t.category === 'General').length,
    rawColumns,
    rawRows,
    balanceDiscrepancyCount: discrepancyCount
  };
}
