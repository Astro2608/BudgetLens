import React from 'react';
import { Loan, Transaction } from '../types/finance';
import { LoanCard } from './LoanCard';

interface DebtHubSectionProps {
  loans: Loan[];
  transactions: Transaction[];
  onAddLoanClick: () => void;
  onDeleteLoan: (id: string) => void;
}

export const DebtHubSection: React.FC<DebtHubSectionProps> = ({
  loans,
  transactions,
  onAddLoanClick,
  onDeleteLoan
}) => {
  return (
    <div
      className="BudgetLens-card"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
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
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #dbeafe'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance</span>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Debt & Liabilities
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
              Track & project loan payoffs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddLoanClick}
          style={{
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
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
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = '#dbeafe';
            e.currentTarget.style.borderColor = '#93c5fd';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
            e.currentTarget.style.borderColor = '#bfdbfe';
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
            backgroundColor: '#f8fafc',
            border: '1.5px dashed #cbd5e1',
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
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '20px' }}>real_estate_agent</span>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>No active loans tracked</h4>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b' }}>
              Add student loan, mortgage, or car loan to view payoff timelines.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddLoanClick}
            style={{
              backgroundColor: '#0f172a',
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
              onDelete={onDeleteLoan}
            />
          ))}
        </div>
      )}
    </div>
  );
};
