import { Transaction } from '../types/finance';
import { formatSGD } from './financeCalculator';

export const exportToCSV = (transactions: Transaction[]) => {
  const headers = ['Date', 'Title', 'Amount', 'Type', 'Category', 'Source', 'Note', 'Recurring'];
  const rows = transactions.map(t => [
    t.date,
    `"${t.title.replace(/"/g, '""')}"`,
    t.amount,
    t.type,
    t.category,
    `"${t.source?.replace(/"/g, '""') || ''}"`,
    `"${t.note?.replace(/"/g, '""') || ''}"`,
    t.isRecurring ? 'Yes' : 'No'
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadBlob(blob, `lumina_export_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportToMarkdown = (transactions: Transaction[]) => {
  const headers = ['| Date | Title | Amount | Type | Category | Source | Note | Recurring |', '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |'];
  const rows = transactions.map(t => 
    `| ${t.date} | ${t.title} | ${formatSGD(t.amount)} | ${t.type} | ${t.category} | ${t.source || ''} | ${t.note || ''} | ${t.isRecurring ? 'Yes' : 'No'} |`
  );

  const mdContent = `# Lumina Finance Export\n\nGenerated on: ${new Date().toLocaleString()}\n\n${headers.join('\n')}\n${rows.join('\n')}`;
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  
  downloadBlob(blob, `lumina_export_${new Date().toISOString().split('T')[0]}.md`);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
