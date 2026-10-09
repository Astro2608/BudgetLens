/**
 * @summary Modal dialog for reviewing and batch-generating historical unrecorded loan payments.
 * Lets users review detected missing months, adjust installment amounts, and catch up their ledger in 1 click.
 *
 * @ai-directive Keep this modal focused exclusively on historical catch-up review and batch confirmation.
 * Adhere to SOLID and DRY principles; delegate transaction insertion and state updates to parent callbacks.
 */

import React, { useState, useMemo } from 'react';
import { Loan, Transaction, CategoryKey, CategoryConfig } from '../types/finance';
import { BacktrackMonthProposal } from '../utils/loanAmortization';
import { useCurrency } from '../context/CurrencyContext';

interface LoanBacktrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  proposals: BacktrackMonthProposal[];
  categoryConfigs: Record<CategoryKey, CategoryConfig>;
  onConfirmBacktrack: (txs: Omit<Transaction, 'id'>[]) => void;
}

export const LoanBacktrackModal: React.FC<LoanBacktrackModalProps> = ({
  isOpen,
  onClose,
  loan,
  proposals,
  categoryConfigs,
  onConfirmBacktrack
}) => {
  const { formatCurrency, currencyInfo } = useCurrency();

  const defaultAmount = proposals.length > 0 ? proposals[0].amount : (loan.fixedMonthlyPayment || 0);
  const [installmentAmount, setInstallmentAmount] = useState<string>(defaultAmount.toFixed(2));

  // Default category to one with 'loan' or 'bill' or first available expense category
  const defaultCategory = useMemo(() => {
    const keys = Object.keys(categoryConfigs);
    const loanCat = keys.find(k => k.toLowerCase().includes('loan'));
    if (loanCat) return loanCat;
    const billCat = keys.find(k => k.toLowerCase().includes('bill'));
    if (billCat) return billCat;
    return keys[0] || 'General';
  }, [categoryConfigs]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(defaultCategory);
  const [selectedYearMonths, setSelectedYearMonths] = useState<Set<string>>(
    () => new Set(proposals.map(p => p.yearMonth))
  );

  // Keep selection synced when proposals change
  React.useEffect(() => {
    setSelectedYearMonths(new Set(proposals.map(p => p.yearMonth)));
    if (proposals.length > 0) {
      setInstallmentAmount(proposals[0].amount.toFixed(2));
    }
  }, [proposals]);

  const numAmount = parseFloat(installmentAmount) || defaultAmount;

  const selectedCount = selectedYearMonths.size;
  const totalCatchUpAmount = selectedCount * numAmount;

  if (!isOpen) return null;

  const handleToggleMonth = (ym: string) => {
    setSelectedYearMonths(prev => {
      const next = new Set(prev);
      if (next.has(ym)) {
        next.delete(ym);
      } else {
        next.add(ym);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedYearMonths.size === proposals.length) {
      setSelectedYearMonths(new Set());
    } else {
      setSelectedYearMonths(new Set(proposals.map(p => p.yearMonth)));
    }
  };

  const handleConfirm = () => {
    if (selectedCount === 0 || numAmount <= 0) return;

    const toCreate: Omit<Transaction, 'id'>[] = proposals
      .filter(p => selectedYearMonths.has(p.yearMonth))
      .map(p => ({
        date: p.date,
        title: `${loan.name} Installment`,
        description: `Historical backtrack payment for ${p.monthLabel}`,
        amount: numAmount,
        type: 'expense' as const,
        category: selectedCategory,
        isRecurring: true,
        note: `Auto-backtracked historical installment (${p.monthLabel})`,
        source: 'Loan Backtrack Catch-Up',
        tags: [loan.linkedTag],
        loanAllocations: {
          [loan.id]: numAmount
        }
      }));

    onConfirmBacktrack(toCreate);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(5px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '28px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>history_toggle_off</span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Catch Up Historical Payments
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                {loan.name} • Tag: #{loan.linkedTag} • Started: {loan.startDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Highlight Card */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Missing Months
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              {selectedCount} of {proposals.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Per Month
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              {formatCurrency(numAmount)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Total Catch-Up
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a' }}>
              {formatCurrency(totalCatchUpAmount)}
            </div>
          </div>
        </div>

        {/* Configuration Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              MONTHLY INSTALLMENT ({currencyInfo.code})
            </label>
            <input
              type="number"
              step="0.01"
              value={installmentAmount}
              onChange={e => setInstallmentAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 700,
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              ASSIGN CATEGORY
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 700,
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff'
              }}
            >
              {Object.values(categoryConfigs).map(c => (
                <option key={c.key} value={c.key}>
                  {c.label} ({c.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Select All Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11.5px',
            padding: '4px 2px',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, color: '#334155' }}>
            <input
              type="checkbox"
              checked={selectedYearMonths.size === proposals.length && proposals.length > 0}
              onChange={handleToggleSelectAll}
              style={{ cursor: 'pointer', accentColor: '#16a34a' }}
            />
            Select All ({proposals.length} months)
          </label>
          <span style={{ color: '#64748b', fontSize: '11px' }}>
            {selectedCount} months selected
          </span>
        </div>

        {/* Scrollable Proposals List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '220px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}
        >
          {proposals.map(p => {
            const isSelected = selectedYearMonths.has(p.yearMonth);
            return (
              <div
                key={p.yearMonth}
                onClick={() => handleToggleMonth(p.yearMonth)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                  border: `1px solid ${isSelected ? '#86efac' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ cursor: 'pointer', accentColor: '#16a34a' }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {p.monthLabel}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: '6px' }}>
                      Scheduled: {p.date}
                    </span>
                  </div>
                </div>

                <div style={{ fontWeight: 800, color: isSelected ? '#16a34a' : '#64748b' }}>
                  {formatCurrency(numAmount)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#64748b',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={selectedCount === 0 || numAmount <= 0}
            onClick={handleConfirm}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: selectedCount === 0 || numAmount <= 0 ? '#cbd5e1' : '#16a34a',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: selectedCount === 0 || numAmount <= 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: selectedCount > 0 ? '0 2px 6px rgba(22, 163, 74, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>auto_mode</span>
            Backtrack & Log {selectedCount} Entries
          </button>
        </div>
      </div>
    </div>
  );
};
