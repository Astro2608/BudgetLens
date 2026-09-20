import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export type ExportFormatChoice = 'csv' | 'md' | 'none';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (exportFormat: ExportFormatChoice) => void;
  transactionsCount: number;
  totalBalance: number;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  transactionsCount,
  totalBalance
}) => {
  const { formatCurrency } = useCurrency();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatChoice>('csv');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '500px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #fecdd3'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                restart_alt
              </span>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Reset Dashboard to Fresh Session
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Re-initialize active ledger with zero balance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Safety Notice Box */}
          <div
            style={{
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              gap: '0.75rem'
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>
              security
            </span>
            <div style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
              <strong style={{ color: '#78350f', display: 'block', marginBottom: '2px' }}>
                Automated Backup & Archival
              </strong>
              Your <strong>{transactionsCount} recorded transactions</strong> ({formatCurrency(totalBalance)}) can be exported before resetting so you never lose financial history.
            </div>
          </div>

          {/* Backup Format Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
              Select Backup Format to Save:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  backgroundColor: selectedFormat === 'csv' ? '#f0fdf4' : '#fafafa',
                  border: `1px solid ${selectedFormat === 'csv' ? '#bbf7d0' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--text-main)'
                }}
              >
                <input
                  type="radio"
                  name="resetFormat"
                  value="csv"
                  checked={selectedFormat === 'csv'}
                  onChange={() => setSelectedFormat('csv')}
                  style={{ accentColor: '#10b981' }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#10b981' }}>download</span>
                <span>Export as CSV Spreadsheet (.csv)</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  backgroundColor: selectedFormat === 'md' ? '#faf5ff' : '#fafafa',
                  border: `1px solid ${selectedFormat === 'md' ? '#e9d5ff' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--text-main)'
                }}
              >
                <input
                  type="radio"
                  name="resetFormat"
                  value="md"
                  checked={selectedFormat === 'md'}
                  onChange={() => setSelectedFormat('md')}
                  style={{ accentColor: '#9333ea' }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9333ea' }}>description</span>
                <span>Export as Markdown Table (.md)</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  backgroundColor: selectedFormat === 'none' ? '#fef2f2' : '#fafafa',
                  border: `1px solid ${selectedFormat === 'none' ? '#fecdd3' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--text-main)'
                }}
              >
                <input
                  type="radio"
                  name="resetFormat"
                  value="none"
                  checked={selectedFormat === 'none'}
                  onChange={() => setSelectedFormat('none')}
                  style={{ accentColor: '#ef4444' }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ef4444' }}>do_not_disturb_on</span>
                <span>Skip Backup (Reset Directly)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirmReset(selectedFormat)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1.15rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px 0 rgba(220, 38, 38, 0.4)',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              restart_alt
            </span>
            <span>Confirm & Reset Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

