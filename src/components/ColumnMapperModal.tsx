import React, { useState, useEffect, useMemo } from 'react';
import { Transaction } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';
import {
  BankTemplate,
  ColumnMappingConfig,
  ColumnRole,
  getSavedBankTemplates,
  getTemplatesForCurrency,
  saveCustomBankTemplate,
  deleteCustomBankTemplate,
  parseGridWithMapping
} from '../utils/bankTemplates';

interface ColumnMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawColumns: string[];
  rawRows: string[][];
  fileName: string;
  onApplyMapping: (transactions: Transaction[]) => void;
}

export const ColumnMapperModal: React.FC<ColumnMapperModalProps> = ({
  isOpen,
  onClose,
  rawColumns,
  rawRows,
  fileName,
  onApplyMapping
}) => {
  const { currencyCode } = useCurrency();
  const [templates, setTemplates] = useState<BankTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [showSaveTemplateInput, setShowSaveTemplateInput] = useState(false);

  // Column roles mapped to each column index
  const [colRoles, setColRoles] = useState<ColumnRole[]>([]);

  // Categorized templates by active currency
  const { primaryTemplates, otherTemplates, customTemplates } = useMemo(() => {
    return getTemplatesForCurrency(currencyCode);
  }, [currencyCode, templates]);

  // Load templates on mount / open
  useEffect(() => {
    if (isOpen) {
      const loaded = getSavedBankTemplates();
      setTemplates(loaded);

      // Guess initial roles from column names if present
      const initialRoles: ColumnRole[] = rawColumns.map((colName, idx) => {
        const s = colName.toLowerCase();
        if (s.includes('date') || s.includes('time')) return 'date';
        if (s.includes('chq') || s.includes('ref')) return 'ref';
        if (s.includes('desc') || s.includes('narrat') || s.includes('particular') || s.includes('detail') || s.includes('remark')) return 'description';
        if (s.includes('debit') || s.includes('withdrawal') || s.includes('paid out') || s.includes('dr')) return 'debit';
        if (s.includes('credit') || s.includes('deposit') || s.includes('paid in') || s.includes('cr')) return 'credit';
        if (s.includes('bal')) return 'balance';
        if (s.includes('amount') || s.includes('amt')) return 'amount';
        if (idx === 0) return 'date';
        if (idx === 1) return 'description';
        return 'ignore';
      });

      setColRoles(initialRoles);
    }
  }, [isOpen, rawColumns]);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;

    const nextRoles: ColumnRole[] = rawColumns.map(() => 'ignore');
    const { mapping } = tmpl;

    if (mapping.dateCol < nextRoles.length) nextRoles[mapping.dateCol] = 'date';
    if (mapping.descCol < nextRoles.length) nextRoles[mapping.descCol] = 'description';
    if (mapping.refCol !== undefined && mapping.refCol !== null && mapping.refCol < nextRoles.length) {
      nextRoles[mapping.refCol] = 'ref';
    }
    if (mapping.debitCol !== undefined && mapping.debitCol !== null && mapping.debitCol < nextRoles.length) {
      nextRoles[mapping.debitCol] = 'debit';
    }
    if (mapping.creditCol !== undefined && mapping.creditCol !== null && mapping.creditCol < nextRoles.length) {
      nextRoles[mapping.creditCol] = 'credit';
    }
    if (mapping.balanceCol !== undefined && mapping.balanceCol !== null && mapping.balanceCol < nextRoles.length) {
      nextRoles[mapping.balanceCol] = 'balance';
    }
    if (mapping.amountCol !== undefined && mapping.amountCol !== null && mapping.amountCol < nextRoles.length) {
      nextRoles[mapping.amountCol] = 'amount';
    }
    if (mapping.typeCol !== undefined && mapping.typeCol !== null && mapping.typeCol < nextRoles.length) {
      nextRoles[mapping.typeCol] = 'type';
    }

    setColRoles(nextRoles);
  };

  const handleRoleChange = (colIdx: number, newRole: ColumnRole) => {
    setSelectedTemplateId('custom');
    setColRoles((prev) => {
      const copy = [...prev];
      copy[colIdx] = newRole;
      return copy;
    });
  };

  // Build current mapping config from colRoles
  const currentMapping = useMemo((): ColumnMappingConfig => {
    let dateCol = colRoles.indexOf('date');
    if (dateCol === -1) dateCol = 0;

    let descCol = colRoles.indexOf('description');
    if (descCol === -1) descCol = colRoles.indexOf('ref') !== -1 ? colRoles.indexOf('ref') : 1;

    const debitCol = colRoles.indexOf('debit') !== -1 ? colRoles.indexOf('debit') : null;
    const creditCol = colRoles.indexOf('credit') !== -1 ? colRoles.indexOf('credit') : null;
    const balanceCol = colRoles.indexOf('balance') !== -1 ? colRoles.indexOf('balance') : null;
    const refCol = colRoles.indexOf('ref') !== -1 ? colRoles.indexOf('ref') : null;
    const amountCol = colRoles.indexOf('amount') !== -1 ? colRoles.indexOf('amount') : null;
    const typeCol = colRoles.indexOf('type') !== -1 ? colRoles.indexOf('type') : null;

    return {
      dateCol,
      descCol,
      debitCol,
      creditCol,
      balanceCol,
      refCol,
      amountCol,
      typeCol
    };
  }, [colRoles]);

  // Preview live parsed count
  const previewTransactions = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return [];
    return parseGridWithMapping(rawRows, currentMapping, fileName);
  }, [rawRows, currentMapping, fileName]);

  const handleSaveTemplate = () => {
    const trimmed = newTemplateName.trim();
    if (!trimmed) {
      alert('Please enter a profile name for your bank template.');
      return;
    }

    const newTmpl: BankTemplate = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      currency: currencyCode || 'USD',
      signatureKeywords: [trimmed.toLowerCase()],
      mapping: currentMapping
    };

    saveCustomBankTemplate(newTmpl);
    const updated = getSavedBankTemplates();
    setTemplates(updated);
    setSelectedTemplateId(newTmpl.id);
    setShowSaveTemplateInput(false);
    setNewTemplateName('');
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomBankTemplate(id);
    const updated = getSavedBankTemplates();
    setTemplates(updated);
    if (selectedTemplateId === id) {
      setSelectedTemplateId('custom');
    }
  };

  const handleApply = () => {
    if (previewTransactions.length === 0) {
      alert('The current mapping produced 0 valid transactions. Please ensure Date and Amount/Debit/Credit columns are assigned properly.');
      return;
    }
    onApplyMapping(previewTransactions);
    onClose();
  };

  if (!isOpen) return null;

  const previewSlice = rawRows.slice(0, 8);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1120px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                view_column
              </span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                Interactive Bank Statement Column Mapper
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Map column headers for <strong>{fileName}</strong> (Active Currency: <strong>{currencyCode}</strong>)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Bank Templates Ribbon */}
        <div
          style={{
            padding: '0.875rem 1.5rem',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Bank Template Profile:
            </span>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1.5px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-main)',
                backgroundColor: '#ffffff',
                outline: 'none',
                minWidth: '260px'
              }}
            >
              <option value="custom">-- Custom / Auto-Detected Mapping --</option>
              
              {customTemplates.length > 0 && (
                <optgroup label="👤 Your Saved Custom Profiles">
                  {customTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.currency})
                    </option>
                  ))}
                </optgroup>
              )}

              <optgroup label={`⭐ Popular ${currencyCode} Region Banks`}>
                {primaryTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>

              {otherTemplates.length > 0 && (
                <optgroup label="🌐 Global & Other Region Banks">
                  {otherTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} [{t.currency}]
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {selectedTemplateId !== 'custom' && !templates.find((t) => t.id === selectedTemplateId)?.isBuiltIn && (
              <button
                type="button"
                onClick={(e) => handleDeleteTemplate(selectedTemplateId, e)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Delete this custom template"
              >
                Delete Custom Profile
              </button>
            )}
          </div>

          <div>
            {!showSaveTemplateInput ? (
              <button
                type="button"
                onClick={() => setShowSaveTemplateInput(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bookmark_add</span>
                Save as Bank Profile
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  placeholder={`e.g. My ${currencyCode} Salary Bank`}
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--color-primary)',
                    fontSize: '12px',
                    outline: 'none',
                    width: '210px'
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateInput(false)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    border: 'none',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Mapping Preview Table with Smooth Horizontal Scroll */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            padding: '1.25rem 1.5rem',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              overflowX: 'auto',
              overflowY: 'auto',
              maxWidth: '100%',
              overscrollBehavior: 'contain',
              backgroundColor: '#ffffff'
            }}
          >
            <table
              style={{
                width: 'max-content',
                minWidth: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
                textAlign: 'left',
                tableLayout: 'auto'
              }}
            >
              <thead
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  backgroundColor: '#f8fafc',
                  borderBottom: '2px solid #e2e8f0'
                }}
              >
                <tr>
                  {rawColumns.map((colName, idx) => (
                    <th key={idx} style={{ padding: '10px 12px', minWidth: '170px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                          Col {idx + 1}: <strong style={{ color: 'var(--text-main)' }}>{colName || `Column ${idx + 1}`}</strong>
                        </div>
                        <select
                          value={colRoles[idx] || 'ignore'}
                          onChange={(e) => handleRoleChange(idx, e.target.value as ColumnRole)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1.5px solid',
                            borderColor:
                              colRoles[idx] === 'date'
                                ? '#3b82f6'
                                : colRoles[idx] === 'description'
                                ? '#8b5cf6'
                                : colRoles[idx] === 'debit'
                                ? '#ef4444'
                                : colRoles[idx] === 'credit'
                                ? '#10b981'
                                : colRoles[idx] === 'balance'
                                ? '#0284c7'
                                : '#cbd5e1',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#ffffff',
                            color: 'var(--text-main)',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="ignore">❌ Ignore / Skip</option>
                          <option value="date">📅 Date (Required)</option>
                          <option value="description">📝 Description / Narration</option>
                          <option value="ref">🔖 Ref / Cheque No</option>
                          <option value="debit">🔻 Debit / Withdrawal (-)</option>
                          <option value="credit">🟢 Credit / Deposit (+)</option>
                          <option value="amount">💰 Single Amount Column</option>
                          <option value="type">🏷️ CR/DR Type Flag</option>
                          <option value="balance">🏦 Running Balance</option>
                        </select>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewSlice.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                    {rawColumns.map((_, cIdx) => (
                      <td
                        key={cIdx}
                        style={{
                          padding: '8px 12px',
                          color: colRoles[cIdx] === 'ignore' ? '#94a3b8' : 'var(--text-main)',
                          fontFamily: ['debit', 'credit', 'amount', 'balance'].includes(colRoles[cIdx]) ? 'monospace' : 'inherit',
                          fontSize: '11.5px',
                          fontWeight: ['debit', 'credit', 'amount'].includes(colRoles[cIdx]) ? 700 : 500,
                          backgroundColor:
                            colRoles[cIdx] === 'credit'
                              ? 'rgba(16, 185, 129, 0.04)'
                              : colRoles[cIdx] === 'debit'
                              ? 'rgba(239, 68, 68, 0.04)'
                              : 'transparent',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {row[cIdx] || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: previewTransactions.length > 0 ? '#10b981' : '#ef4444',
                backgroundColor: previewTransactions.length > 0 ? '#ecfdf5' : '#fef2f2',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: previewTransactions.length > 0 ? '#a7f3d0' : '#fecaca'
              }}
            >
              ✓ {previewTransactions.length} Transactions Recognized
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              from {rawRows.length} extracted statement rows
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={previewTransactions.length === 0}
              style={{
                padding: '7px 18px',
                borderRadius: '8px',
                backgroundColor: previewTransactions.length > 0 ? 'var(--color-primary)' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 800,
                cursor: previewTransactions.length > 0 ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
              Apply Mapping & Re-parse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
