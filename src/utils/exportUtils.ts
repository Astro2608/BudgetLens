import { Transaction } from '../types/finance';
import { formatSGD } from './financeCalculator';
import { getSmartTags } from './tagUtils';

export const exportToCSV = (transactions: Transaction[]) => {
  const headers = ['Date', 'Title', 'Description', 'Amount', 'Type', 'Category', 'Source', 'Tags', 'Note', 'Recurring'];
  const rows = transactions.map(t => {
    const smartTags = getSmartTags(t).join('; ');
    const desc = t.description || t.note || '';
    return [
      t.date,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(desc).replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
      `"${(t.source || '').replace(/"/g, '""')}"`,
      `"${(smartTags).replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.isRecurring ? 'Yes' : 'No'
    ];
  });
  
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  // Include UTF-8 BOM so Excel and Chromium browsers properly read character set & formatting
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const filename = `budgetlens_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadBlob(blob, filename);
};

export function exportToMarkdown(transactions: Transaction[], currencyCode?: string) {
  if (transactions.length === 0) return;

  const headers = [
    '| Date | Title | Description | Amount | Type | Category | Source | Tags | Note | Recurring |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |'
  ];
  const rows = transactions.map(t => {
    const smartTags = getSmartTags(t).join('; ');
    const desc = t.description || t.note || '';
    return `| ${t.date} | ${(t.title || '').replace(/\|/g, '-')} | ${(desc).replace(/\|/g, '-')} | ${formatSGD(t.amount, false, currencyCode)} | ${t.type} | ${t.category} | ${(t.source || '').replace(/\|/g, '-')} | ${smartTags.replace(/\|/g, '-')} | ${(t.note || '').replace(/\|/g, '-')} | ${t.isRecurring ? 'Yes' : 'No'} |`;
  });

  const mdContent = `# BudgetLens Export\n\nGenerated on: ${new Date().toLocaleString()}\n\n${headers.join('\n')}\n${rows.join('\n')}\n`;
  
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const filename = `budgetlens_export_${new Date().toISOString().split('T')[0]}.md`;
  downloadBlob(blob, filename);
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // Trigger user download
  link.click();
  
  // Chromium download manager requires the anchor and ObjectURL to remain alive briefly
  // Synchronous removal causes Chrome to drop the filename and download a raw blob UUID or fail
  setTimeout(() => {
    try {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Cleanup download error:', e);
    }
  }, 1500);
};
