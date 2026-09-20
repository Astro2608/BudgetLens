import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Transaction, CategoryKey } from '../types/finance';
import { parseBankCSV, CSVParseResult } from '../utils/csvParser';
import { parseBankPDF } from '../utils/pdfParser';
import { parseMarkdownTable } from '../utils/mdParser';
import { parseFreeformText, parseFreeformSync } from '../utils/freeformParser';
import { CATEGORY_LIST } from '../config/categoryConfig';
import { useCurrency } from '../context/CurrencyContext';
import { SectionInfoButton } from './SectionInfoButton';

interface CSVImportZoneProps {
  onImportTransactions: (newTxs: Transaction[]) => void;
  existingTransactions?: Transaction[];
  onClose?: () => void;
}

export const CSVImportZone: React.FC<CSVImportZoneProps> = ({
  onImportTransactions,
  existingTransactions = [],
  onClose
}) => {
  const { formatCurrency, autoDetectCurrency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [modalTransactions, setModalTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'duplicate'>('all');
  const [confirmDuplicatesModal, setConfirmDuplicatesModal] = useState(false);
  const [showVerifyConfirmModal, setShowVerifyConfirmModal] = useState(false);
  const [freeformText, setFreeformText] = useState('');

  const liveDetectedTransactions = useMemo(() => {
    if (!freeformText.trim()) return [];
    return parseFreeformSync(freeformText);
  }, [freeformText]);

  const liveTotalAmount = useMemo(() => {
    return liveDetectedTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [liveDetectedTransactions]);

  // Lock background body scroll when review modal is open
  useEffect(() => {
    if (parseResult) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [parseResult]);

  const handleProcessFile = async (file: File) => {
    const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
    const isMD = file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown') || file.type.includes('markdown');

    if (!isPDF && !isCSV && !isMD) {
      setErrorMsg('Please upload a valid .PDF, .CSV, or .MD (Markdown table) bank/expenditure file.');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);

    try {
      let result: CSVParseResult;
      if (isPDF) {
        result = await parseBankPDF(file);
      } else if (isMD) {
        result = await parseMarkdownTable(file);
      } else {
        result = await parseBankCSV(file);
      }
      setParseResult(result);
      setModalTransactions(result.transactions);
      setFilterType('all');
      setConfirmDuplicatesModal(false);
      setShowVerifyConfirmModal(false);

      if (result.transactions && result.transactions.length > 0) {
        const sampleText = result.transactions.map((t) => `${t.title} ${t.source || ''} ${t.note || ''}`).join(' ');
        autoDetectCurrency(sampleText);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse file. Please verify it is a valid PDF, CSV, or Markdown table.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleParseFreeform = async () => {
    if (!freeformText.trim()) return;
    setIsParsing(true);
    setErrorMsg(null);
    try {
      const result = await parseFreeformText(freeformText);
      if (result.transactions.length === 0) {
        setErrorMsg('Could not find any readable transactions in the text.');
        setIsParsing(false);
        return;
      }
      setParseResult(result);
      setModalTransactions(result.transactions);
      setFilterType('all');
      setConfirmDuplicatesModal(false);
      setShowVerifyConfirmModal(false);
      setFreeformText('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse text notes.');
    } finally {
      setIsParsing(false);
    }
  };

  // Toggle single transaction type
  const handleToggleType = (id: string) => {
    setModalTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== id) return tx;
        const newType = tx.type === 'income' ? 'expense' : 'income';
        const newCat: CategoryKey = newType === 'income' ? 'Salary' : tx.category === 'Salary' ? 'General' : tx.category;
        return {
          ...tx,
          type: newType,
          category: newCat
        };
      })
    );
  };

  // Change category of a row
  const handleChangeCategory = (id: string, newCat: CategoryKey) => {
    setModalTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, category: newCat } : tx))
    );
  };

  // Remove a row
  const handleDeleteRow = (id: string) => {
    setModalTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // Invert all transaction types
  const handleFlipAllTypes = () => {
    setModalTransactions((prev) =>
      prev.map((tx) => {
        const newType = tx.type === 'income' ? 'expense' : 'income';
        const newCat: CategoryKey = newType === 'income' ? 'Salary' : tx.category === 'Salary' ? 'General' : tx.category;
        return {
          ...tx,
          type: newType,
          category: newCat
        };
      })
    );
  };

  // Detect duplicate transactions matching existing ledger
  const duplicateIds = new Set<string>();
  modalTransactions.forEach((tx) => {
    const isDup = existingTransactions.some(
      (ext) =>
        ext.date === tx.date &&
        Math.abs(Number(ext.amount) - Number(tx.amount)) < 0.01 &&
        ext.type === tx.type
    );
    if (isDup) {
      duplicateIds.add(tx.id);
    }
  });

  const duplicateCount = duplicateIds.size;

  // 1-Click Exclude all duplicates
  const handleExcludeAllDuplicates = () => {
    setModalTransactions((prev) => prev.filter((tx) => !duplicateIds.has(tx.id)));
    setConfirmDuplicatesModal(false);
  };

  const computedTotalIncome = modalTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const computedTotalExpense = modalTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflow = computedTotalIncome - computedTotalExpense;

  const incomeCount = modalTransactions.filter((t) => t.type === 'income').length;
  const expenseCount = modalTransactions.filter((t) => t.type === 'expense').length;

  const filteredModalTransactions = modalTransactions.filter((t) => {
    if (filterType === 'income') return t.type === 'income';
    if (filterType === 'expense') return t.type === 'expense';
    if (filterType === 'duplicate') return duplicateIds.has(t.id);
    return true;
  });

  // Direct Finalization into ledger
  const executeFinalImport = () => {
    if (parseResult && modalTransactions.length > 0) {
      onImportTransactions(modalTransactions);
      setParseResult(null);
      setModalTransactions([]);
      setConfirmDuplicatesModal(false);
      setShowVerifyConfirmModal(false);
    }
  };

  const handleConfirmImport = () => {
    if (duplicateCount > 0 && !confirmDuplicatesModal) {
      setConfirmDuplicatesModal(true);
      return;
    }
    // Always trigger the verification confirmation modal first
    setShowVerifyConfirmModal(true);
  };


  const getFormatBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return { label: 'PDF', bg: '#fee2e2', color: '#ef4444', border: '#fecdd3' };
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) return { label: 'MD Table', bg: '#f3e8ff', color: '#9333ea', border: '#e9d5ff' };
    return { label: 'CSV', bg: '#ecfdf5', color: '#10b981', border: '#a7f3d0' };
  };

  return (
    <div className="lumina-card" id="import-section" style={{ gap: '1rem' }}>
      {/* Hidden File Input for PDF, CSV, and MD */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.csv,.md,.markdown,application/pdf,text/csv,text/markdown,text/plain"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-primary-border)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Bulk Import E-Statements & Files
              </h3>
              <SectionInfoButton
                title="Universal Statement Import"
                description="100% private, offline statement parsing with auto-categorization and duplicate detection."
                howItWorks="Drag & drop bank PDF statements (DBS, OCBC, UOB, Citibank, HSBC), CSV exports, or Obsidian Markdown tables. Transactions are parsed locally in browser memory without sending data to any external server."
                example="Drop a monthly bank PDF or CSV to auto-extract transaction rows, classify merchants, and review before merging into your ledger."
              />
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  border: '1px solid #fecdd3'
                }}
              >
                PDF
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#ecfdf5',
                  color: '#10b981',
                  border: '1px solid #a7f3d0'
                }}
              >
                CSV
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#f3e8ff',
                  color: '#9333ea',
                  border: '1px solid #e9d5ff'
                }}
              >
                MD Table
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              100% private, offline parsing for bank PDFs, CSVs, and Markdown tables with duplicate protection
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
            title="Close modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        )}
      </div>

      {/* Drag and Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? '2px dashed var(--color-primary)' : '2px dashed #99f6e4',
          backgroundColor: isDragging ? 'rgba(204, 251, 241, 0.6)' : 'rgba(240, 253, 250, 0.5)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          transition: 'all 180ms ease'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            {isParsing ? 'sync' : 'upload_file'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
            {isParsing ? (
              'Extracting transactions from file (100% Offline)...'
            ) : (
              <>
                Drop your bank <strong>PDF, CSV statement, or Obsidian Markdown (.md) table</strong> here, or{' '}
                <span style={{ color: 'var(--color-primary-hover)', textDecoration: 'underline' }}>browse files</span>
              </>
            )}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '3px' }}>
            Supports: DBS, POSB, OCBC, UOB, HSBC, Citibank e-Statements & Markdown Budget Tables
          </span>
        </div>
      </div>

      {/* Freeform Notes Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>edit_note</span>
            Paste Freeform Notes, Casual Entries & Ledgers:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Try samples:</span>
            <button
              type="button"
              onClick={() => setFreeformText("June 12 2025 - 300 , transport\ndecember 20 2025 - 600, bills\n25 Oct - $45.50, Food")}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                cursor: 'pointer',
                color: 'var(--text-main)'
              }}
            >
              📅 Date & Category
            </button>
            <button
              type="button"
              onClick={() => setFreeformText("17th march- 10000-5000=5000\n28th march- 10000+5000=15000\n01st may - 11000+7000=18000")}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                cursor: 'pointer',
                color: 'var(--text-main)'
              }}
            >
              🧮 Ledger Math (+/-)
            </button>
            <button
              type="button"
              onClick={() => setFreeformText("North trip- 68200\n(Flight- 42880\nTransport- 18360\nStay- 6960)")}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                cursor: 'pointer',
                color: 'var(--text-main)'
              }}
            >
              ✈️ Trip Budget
            </button>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            value={freeformText}
            onChange={(e) => {
              setFreeformText(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Paste any format here, for example:&#10;June 12 2025 - 300 , transport&#10;december 20 2025 - 600, bills&#10;17th march- 10000-5000=5000"
            style={{
              width: '100%',
              height: '110px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-main)',
              padding: '0.75rem',
              fontSize: '13px',
              resize: 'vertical',
              fontFamily: 'monospace',
              backgroundColor: '#fafafa',
              boxSizing: 'border-box'
            }}
          />
          {freeformText && (
            <button
              type="button"
              onClick={() => setFreeformText('')}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                padding: '2px 6px',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Live Detected Preview Pill / Chips */}
        {freeformText.trim() && (
          <div
            style={{
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: liveDetectedTransactions.length > 0 ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${liveDetectedTransactions.length > 0 ? '#bbf7d0' : '#fef08a'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: liveDetectedTransactions.length > 0 ? '#15803d' : '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {liveDetectedTransactions.length > 0 ? 'check_circle' : 'help'}
                </span>
                {liveDetectedTransactions.length > 0
                  ? `Live Ready: ${liveDetectedTransactions.length} transaction${liveDetectedTransactions.length === 1 ? '' : 's'} detected (${formatCurrency(liveTotalAmount)})`
                  : 'No numeric amount detected yet'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Universal Order-Agnostic Engine
              </span>
            </div>

            {liveDetectedTransactions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '72px', overflowY: 'auto' }}>
                {liveDetectedTransactions.map((tx, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: '#fff',
                      border: '1px solid #dcfce7',
                      color: tx.type === 'income' ? '#16a34a' : '#334155',
                      fontWeight: 600
                    }}
                  >
                    <span>{tx.date}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{tx.title}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontWeight: 800 }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleParseFreeform}
          disabled={isParsing || liveDetectedTransactions.length === 0}
          style={{
            alignSelf: 'flex-start',
            padding: '0.6rem 1.5rem',
            backgroundColor: liveDetectedTransactions.length > 0 ? 'var(--color-primary)' : 'var(--text-main)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: liveDetectedTransactions.length > 0 ? 'pointer' : 'not-allowed',
            opacity: liveDetectedTransactions.length > 0 ? 1 : 0.5,
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: liveDetectedTransactions.length > 0 ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {isParsing ? 'sync' : 'table_view'}
          </span>
          {isParsing
            ? 'Parsing Notes...'
            : liveDetectedTransactions.length > 0
              ? `Review & Import ${liveDetectedTransactions.length} Items`
              : 'Parse Notes'}
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', fontSize: '12px', fontWeight: 600 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Privacy & Engine Notice */}
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(254, 243, 199, 0.6)',
          border: '1px solid rgba(253, 230, 138, 0.8)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.625rem'
        }}
      >
        <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>
          shield_with_heart
        </span>
        <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45, margin: 0 }}>
          <strong style={{ color: '#0f172a' }}>100% Offline & Universal:</strong> Statements & Markdown tables are parsed locally in your browser. All duplicate amounts on identical dates are cross-checked against your ledger to safeguard your balance.
        </p>
      </div>

      {/* Batch Review Modal */}
      {parseResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            overflow: 'hidden'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setParseResult(null);
              setModalTransactions([]);
              setConfirmDuplicatesModal(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-2xl)',
              width: '100%',
              maxWidth: '860px',
              height: '88vh',
              maxHeight: '820px',
              minHeight: '450px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#d1fae5',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>fact_check</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Review & Reclassify Extracted Records
                    </h3>
                    {(() => {
                      const badge = getFormatBadge(parseResult.fileName);
                      return (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}
                        >
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    File: <strong>{parseResult.fileName}</strong> ({modalTransactions.length} transactions ready)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={handleFlipAllTypes}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                  title="Invert all items if deposits & withdrawals were swapped"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>swap_horiz</span>
                  <span>Flip All Types</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setParseResult(null);
                    setModalTransactions([]);
                    setConfirmDuplicatesModal(false);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* DUPLICATE WARNING HIGHLIGHT BANNER */}
            {duplicateCount > 0 && (
              <div
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#fffbeb',
                  borderBottom: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '20px' }}>
                    warning
                  </span>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400e' }}>
                      Duplicate Match Warning: {duplicateCount} item(s) already exist in your ledger!
                    </span>
                    <p style={{ fontSize: '11px', color: '#b45309', margin: '2px 0 0 0' }}>
                      Identical dates & amounts matched existing ledger transactions. Exclude them to prevent inflated expenses.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setFilterType('duplicate')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fcd34d',
                      color: '#b45309',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    View Duplicates ({duplicateCount})
                  </button>
                  <button
                    type="button"
                    onClick={handleExcludeAllDuplicates}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete_sweep</span>
                    <span>Exclude All {duplicateCount} Duplicates</span>
                  </button>
                </div>
              </div>
            )}

            {/* Summary Ribbon */}
            <div
              style={{
                padding: '0.875rem 1.5rem',
                backgroundColor: 'var(--bg-canvas-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Items</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {modalTransactions.length} Records
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Inflows (+)</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>
                  +{formatCurrency(computedTotalIncome)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Outflows (-)</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444' }}>
                  -{formatCurrency(computedTotalExpense)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Net Position</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: netCashflow >= 0 ? '#10b981' : '#ef4444' }}>
                  {netCashflow >= 0 ? `+${formatCurrency(netCashflow)} (Surplus)` : `-${formatCurrency(Math.abs(netCashflow))} (Deficit)`}
                </span>
              </div>
            </div>

            {/* Sub-header Filter bar & Hint */}
            <div
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: '#ffffff',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: '1px solid',
                    cursor: 'pointer',
                    backgroundColor: filterType === 'all' ? 'var(--color-primary)' : '#f8fafc',
                    color: filterType === 'all' ? '#ffffff' : '#64748b',
                    borderColor: filterType === 'all' ? 'var(--color-primary)' : '#e2e8f0'
                  }}
                >
                  All ({modalTransactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('income')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: '1px solid',
                    cursor: 'pointer',
                    backgroundColor: filterType === 'income' ? '#10b981' : '#ecfdf5',
                    color: filterType === 'income' ? '#ffffff' : '#047857',
                    borderColor: filterType === 'income' ? '#10b981' : '#a7f3d0'
                  }}
                >
                  Deposits / Inflows ({incomeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('expense')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: '1px solid',
                    cursor: 'pointer',
                    backgroundColor: filterType === 'expense' ? '#ef4444' : '#fff1f2',
                    color: filterType === 'expense' ? '#ffffff' : '#be123c',
                    borderColor: filterType === 'expense' ? '#ef4444' : '#fecdd3'
                  }}
                >
                  Expenses / Outflows ({expenseCount})
                </button>
                {duplicateCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterType('duplicate')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: '1px solid',
                      cursor: 'pointer',
                      backgroundColor: filterType === 'duplicate' ? '#d97706' : '#fef3c7',
                      color: filterType === 'duplicate' ? '#ffffff' : '#b45309',
                      borderColor: filterType === 'duplicate' ? '#d97706' : '#fde68a'
                    }}
                  >
                    Duplicates ({duplicateCount})
                  </button>
                )}
              </div>

              <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#0284c7' }}>info</span>
                Click the <strong>[+ Income]</strong> or <strong>[- Expense]</strong> badge on any row to instantly toggle type.
              </span>
            </div>

            {/* Scrollable Preview Table */}
            <div
              style={{
                padding: '0.75rem 1.5rem',
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  overscrollBehavior: 'contain',
                  backgroundColor: '#ffffff'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      backgroundColor: '#f8fafc',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                    }}
                  >
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th style={{ padding: '9px 12px', fontWeight: 700, width: '90px' }}>Date</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700 }}>Description</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700, width: '130px', textAlign: 'center' }}>Type Toggle</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700, width: '140px' }}>Category</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700, width: '110px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '9px 12px', fontWeight: 700, width: '40px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModalTransactions.map((tx, idx) => {
                      const isIncome = tx.type === 'income';
                      const isDuplicate = duplicateIds.has(tx.id);
                      return (
                        <tr
                          key={tx.id || idx}
                          style={{
                            backgroundColor: isDuplicate ? '#fffbeb' : idx % 2 === 0 ? '#ffffff' : '#fafbfc',
                            borderBottom: '1px solid #f1f5f9'
                          }}
                        >
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                            {tx.date}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-main)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{tx.title}</span>
                              {isDuplicate && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: '#fef3c7',
                                    color: '#b45309',
                                    border: '1px solid #fde68a',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Matches date and amount with an existing transaction in ledger"
                                >
                                  ⚠️ Duplicate
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleType(tx.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 800,
                                border: '1px solid',
                                cursor: 'pointer',
                                backgroundColor: isIncome ? '#dcfce7' : '#ffe4e6',
                                color: isIncome ? '#15803d' : '#be123c',
                                borderColor: isIncome ? '#86efac' : '#fda4af',
                                transition: 'all 120ms ease'
                              }}
                              title="Click to toggle between Income and Expense"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                                {isIncome ? 'arrow_downward' : 'arrow_upward'}
                              </span>
                              <span>{isIncome ? 'Income (+)' : 'Expense (-)'}</span>
                            </button>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <select
                              value={tx.category}
                              onChange={(e) => handleChangeCategory(tx.id, e.target.value as CategoryKey)}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '11px',
                                color: 'var(--text-main)',
                                backgroundColor: '#ffffff',
                                outline: 'none'
                              }}
                            >
                              {CATEGORY_LIST.map((c) => (
                                <option key={c.key} value={c.key}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              textAlign: 'right',
                              fontWeight: 800,
                              color: isIncome ? '#10b981' : '#ef4444',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(tx.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="Exclude this line from import"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions & Confirmation Warning */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flexShrink: 0
              }}
            >
              {confirmDuplicatesModal && duplicateCount > 0 && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fcd34d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}
                >
                  <span style={{ color: '#92400e', fontWeight: 700 }}>
                    ⚠️ {duplicateCount} duplicate transaction(s) detected. Are you sure you want to add them?
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleExcludeAllDuplicates}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #f59e0b',
                        color: '#92400e',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Exclude Duplicates
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Yes, Import Anyway
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setParseResult(null);
                    setModalTransactions([]);
                    setConfirmDuplicatesModal(false);
                    setShowVerifyConfirmModal(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConfirmImport}
                  disabled={modalTransactions.length === 0}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_task</span>
                  <span>Import {modalTransactions.length} Transactions into Ledger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification & Confirmation Overlay Modal */}
      {showVerifyConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Title & Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>warning</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Verify Transaction Allocations
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Final Confirmation Step before adding to your ledger
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
              ⚠️ Bank e-Statements can occasionally list expenses under deposits or vice versa. Please verify that your <strong>Income</strong> and <strong>Expense</strong> totals match your expectations before importing.
            </div>

            {/* Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.875rem', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                  📥 Total Inflow ({incomeCount} items)
                </span>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                  {formatCurrency(computedTotalIncome)}
                </span>
              </div>

              <div style={{ padding: '0.875rem', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecdd3', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                  📤 Total Outflow ({expenseCount} items)
                </span>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
                  {formatCurrency(computedTotalExpense)}
                </span>
              </div>
            </div>

            {/* Swap Types Shortcut Button inside Modal */}
            <button
              type="button"
              onClick={handleFlipAllTypes}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontWeight: 700,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>swap_horiz</span>
              <span>Looks Inverted? Swap All Income ↔ Expense Types</span>
            </button>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowVerifyConfirmModal(false)}
              >
                Go Back & Review Rows
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={executeFinalImport}
                style={{ backgroundColor: '#10b981', borderColor: '#059669' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                <span>Confirm & Import Ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

