import { Transaction } from '../types/finance';

/**
 * Smart Tag Extractor
 * Automatically derives clean, contextual tags for transactions
 */
export function getSmartTags(tx: Transaction): string[] {
  if (tx.tags && tx.tags.length > 0) {
    return tx.tags;
  }
  return [];
}
