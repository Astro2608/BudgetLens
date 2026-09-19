import { Transaction } from '../types/finance';

/**
 * Smart Tag Extractor
 * Automatically derives clean, contextual tags for transactions
 */
export function getSmartTags(tx: Transaction): string[] {
  if (tx.tags && tx.tags.length > 0) {
    return tx.tags;
  }

  const tags: string[] = [];
  const combinedText = `${tx.title} ${tx.description || ''} ${tx.note || ''} ${tx.source || ''}`.toLowerCase();

  // 1. File & Import Source Tags
  if (combinedText.includes('.pdf') || combinedText.includes('pdf e-statement') || combinedText.includes('pdf import')) {
    tags.push('PDF e-Statement');
  } else if (combinedText.includes('.csv') || combinedText.includes('csv import')) {
    tags.push('CSV Import');
  } else if (combinedText.includes('.md') || combinedText.includes('markdown')) {
    tags.push('Obsidian MD');
  } else if (combinedText.includes('freeform') || combinedText.includes('notes import')) {
    tags.push('Notes Ledger');
  }

  // 2. Bank & Payment Channel Tags
  if (combinedText.includes('dbs') || combinedText.includes('posb')) {
    tags.push('DBS / POSB');
  } else if (combinedText.includes('uob')) {
    tags.push('UOB Bank');
  } else if (combinedText.includes('ocbc')) {
    tags.push('OCBC Bank');
  } else if (combinedText.includes('citibank') || combinedText.includes('citi')) {
    tags.push('Citibank');
  } else if (combinedText.includes('hsbc')) {
    tags.push('HSBC');
  }

  if (combinedText.includes('paynow')) {
    tags.push('PayNow');
  } else if (combinedText.includes('giro')) {
    tags.push('GIRO');
  } else if (combinedText.includes('grabpay') || combinedText.includes('grab car') || combinedText.includes('grab food')) {
    tags.push('GrabPay');
  } else if (combinedText.includes('simplygo') || combinedText.includes('mrt')) {
    tags.push('Transit');
  }

  // 3. Status & Recurring
  if (tx.isRecurring) {
    tags.push('Recurring');
  }

  // Fallback: If no tags derived, use source or type badge if present
  if (tags.length === 0 && tx.source && !tx.source.toLowerCase().includes('checking')) {
    const cleanSource = tx.source.replace(/\.(pdf|csv|md)$/i, '').trim();
    if (cleanSource.length > 0 && cleanSource.length < 25) {
      tags.push(cleanSource);
    }
  }

  return tags;
}
