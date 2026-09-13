import React, { useState } from 'react';
import { Transaction } from '../types/finance';
import { getCategoryConfig } from '../config/categoryConfig';
import { formatSGD } from '../utils/financeCalculator';

interface TransactionLedgerProps {
  transactions: Transaction[];
  searchQuery: string;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  searchQuery
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense' | 'recurring'>('all');

  // Filter transactions
  let filtered = transactions;
  if (activeFilter === 'income') {
    filtered = filtered.filter(t => t.type === 'income');
  } else if (activeFilter === 'expense') {
    filtered = filtered.filter(t => t.type === 'expense');
  } else if (activeFilter === 'recurring') {
    filtered = filtered.filter(t => t.isRecurring);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.source && t.source.toLowerCase().includes(q))
    );
  }

  return (
    <div className="lumina-card" id="transactions-section" style={{ gap: '1rem' }}>
      {/* Header & Filter Chips */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)'
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
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance</span>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Transaction Activity
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Real-time ledger synced with personal checking & credit wallets
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All Entries' },
            { id: 'income', label: 'Income (+)' },
            { id: 'expense', label: 'Expenses (-)' },
            { id: 'recurring', label: 'Recurring' }
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id as any)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: activeFilter === chip.id ? 700 : 600,
                backgroundColor: activeFilter === chip.id ? 'var(--color-primary)' : 'var(--bg-canvas-subtle)',
                color: activeFilter === chip.id ? 'white' : 'var(--text-muted)',
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {filtered.slice(0, 6).map((tx) => {
          const config = getCategoryConfig(tx.category);
          const isIncome = tx.type === 'income';

          return (
            <div
              key={tx.id}
              style={{
                padding: '0.875rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                borderRadius: 'var(--radius-lg)',
                transition: 'background-color 150ms ease',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              {/* Left Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: `${config.color}18`,
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{config.icon}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '260px' }}>
                      {tx.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: `${config.color}15`,
                        color: config.color,
                        border: `1px solid ${config.color}40`
                      }}
                    >
                      {config.label}
                    </span>
                    {tx.note && (
                      <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-canvas-subtle)', color: 'var(--text-muted)' }}>
                        {tx.note}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                    {tx.date} • {tx.source || 'Checking Account'}
                  </span>
                </div>
              </div>

              {/* Right Amount */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: isIncome ? '#10b981' : '#ef4444'
                    }}
                  >
                    {isIncome ? `+${formatSGD(tx.amount)}` : `-${formatSGD(tx.amount)}`}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-subtle)' }}>
                    {isIncome ? 'Cleared' : 'Processed'}
                  </span>
                </div>

                <button
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-subtle)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Receipt"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '12px'
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Showing 6 of {transactions.length} total transactions</span>
        <a
          href="#"
          style={{
            fontWeight: 700,
            color: 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            textDecoration: 'none'
          }}
        >
          <span>View Detailed Statement Archive</span>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
        </a>
      </div>
    </div>
  );
};
