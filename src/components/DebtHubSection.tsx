/**
 * @summary Debt & Liabilities hub section rendering loan portfolio cards and empty states.
 * Serves as the high-level container for managing loans and initiating creation modals.
 *
 * @ai-directive Keep this container modular and thin; do not embed business math or state management.
 * Adhere to SOLID and DRY principles by delegating loan specifics to LoanCard and utility modules.
 */

import React from 'react';
import { Loan, Transaction, CategoryKey, CategoryConfig } from '../types/finance';
import { LoanCard } from './LoanCard';

interface DebtHubSectionProps {
  loans: Loan[];
  transactions: Transaction[];
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
  onAddLoanClick: () => void;
  onDeleteLoan: (id: string) => void;
  onLinkTransactions?: (transactionIds: string[], loan: Loan) => void;
  onAddBatchTransactions?: (txs: Omit<Transaction, 'id'>[]) => void;
}

export const DebtHubSection: React.FC<DebtHubSectionProps> = ({
  loans,
  transactions,
  categoryConfigs = {},
  onAddLoanClick,
  onDeleteLoan,
  onLinkTransactions,
  onAddBatchTransactions
}) => {
  return (
    <div
      className="BudgetLens-card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(37, 99, 235, 0.25)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance</span>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Debt & Liabilities
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              Track & project loan payoffs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddLoanClick}
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-primary-border)',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Add Loan
        </button>
      </div>

      {/* Body: Empty State or Loan Cards */}
      {loans.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-canvas-subtle)',
            border: '1.5px dashed var(--border-subtle)',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--text-subtle)', fontSize: '20px' }}>real_estate_agent</span>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>No active loans tracked</h4>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              Add student loan, mortgage, or car loan to view payoff timelines.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddLoanClick}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            + Setup Loan
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loans.map(loan => (
            <LoanCard
              key={loan.id}
              loan={loan}
              transactions={transactions}
              allLoans={loans}
              categoryConfigs={categoryConfigs}
              onDelete={onDeleteLoan}
              onLinkTransactions={onLinkTransactions}
              onAddBatchTransactions={onAddBatchTransactions}
            />
          ))}
        </div>
      )}
    </div>
  );
};
