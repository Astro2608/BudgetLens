/**
 * @summary Smart match suggestion banner displaying untagged transactions matching a loan installment.
 * Allows one-click bulk review, individual selection, and batch approval or dismissal.
 *
 * @ai-directive Strictly maintain modularity; keep this banner decoupled from loan amortization math.
 * Adhere to SOLID and DRY principles; pass action callbacks from parent without embedding business logic.
 */

import React from 'react';
import { Transaction } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';

interface LoanSmartMatchBannerProps {
  candidates: Transaction[];
  selectedCandidateIds: string[];
  monthlyTargetPayment: number;
  onToggleCandidate: (id: string) => void;
  onToggleSelectAll: () => void;
  onApproveSelected: (e: React.MouseEvent) => void;
  onDismissMatches: (e: React.MouseEvent) => void;
}

export const LoanSmartMatchBanner: React.FC<LoanSmartMatchBannerProps> = ({
  candidates,
  selectedCandidateIds,
  monthlyTargetPayment,
  onToggleCandidate,
  onToggleSelectAll,
  onApproveSelected,
  onDismissMatches
}) => {
  const { formatCurrency } = useCurrency();

  if (candidates.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        border: '1.5px solid #c7d2fe',
        borderRadius: '12px',
        padding: '12px 14px',
        marginTop: '8px',
        marginBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)'
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: '#e0e7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4f46e5',
              flexShrink: 0
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e1b4b' }}>
              Smart Match: {candidates.length} Untagged Payment{candidates.length > 1 ? 's' : ''} Found
            </div>
            <div style={{ fontSize: '11px', color: '#4338ca', lineHeight: 1.3 }}>
              Matches ~{formatCurrency(monthlyTargetPayment)} (±$2.00). Are these payments for this loan?
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismissMatches}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}
          title="Dismiss suggestions"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
          Dismiss
        </button>
      </div>

      {/* Selection Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          padding: '4px 0',
          borderTop: '1px solid #e0e7ff',
          borderBottom: '1px solid #e0e7ff'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, color: '#312e81' }}>
          <input
            type="checkbox"
            checked={selectedCandidateIds.length === candidates.length && candidates.length > 0}
            onChange={onToggleSelectAll}
            style={{ cursor: 'pointer', accentColor: '#4f46e5' }}
          />
          Select All ({candidates.length})
        </label>
        <span style={{ color: '#6366f1', fontWeight: 600 }}>
          {selectedCandidateIds.length} of {candidates.length} selected
        </span>
      </div>

      {/* Transaction List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          maxHeight: '160px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {candidates.map(tx => {
          const isSelected = selectedCandidateIds.includes(tx.id);
          return (
            <div
              key={tx.id}
              onClick={() => onToggleCandidate(tx.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                border: `1px solid ${isSelected ? '#c7d2fe' : '#e2e8f0'}`,
                cursor: 'pointer',
                fontSize: '11.5px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  style={{ cursor: 'pointer', accentColor: '#4f46e5' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.title}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {tx.date} • #{tx.category}
                  </span>
                </div>
              </div>
              <div style={{ fontWeight: 800, color: '#dc2626', flexShrink: 0 }}>
                {formatCurrency(tx.amount)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
        <button
          type="button"
          onClick={onDismissMatches}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#64748b',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Ignore
        </button>
        <button
          type="button"
          disabled={selectedCandidateIds.length === 0}
          onClick={onApproveSelected}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: selectedCandidateIds.length === 0 ? '#cbd5e1' : '#4f46e5',
            color: '#ffffff',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: selectedCandidateIds.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: selectedCandidateIds.length > 0 ? '0 2px 4px rgba(79, 70, 229, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check</span>
          Approve & Tag ({selectedCandidateIds.length})
        </button>
      </div>
    </div>
  );
};
