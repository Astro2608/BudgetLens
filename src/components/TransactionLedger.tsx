import React, { useState } from 'react';
import { Transaction, CategoryConfig, CategoryKey } from '../types/finance';
import { getCategoryConfig, DEFAULT_CATEGORY_CONFIGS } from '../config/categoryConfig';
import { formatSGD } from '../utils/financeCalculator';

interface TransactionLedgerProps {
  transactions: Transaction[];
  searchQuery?: string;
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  searchQuery: externalSearchQuery = '',
  categoryConfigs = DEFAULT_CATEGORY_CONFIGS
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense' | 'recurring'>('all');
  const [internalSearch, setInternalSearch] = useState('');
  const [expandedView, setExpandedView] = useState(false);

  const query = (externalSearchQuery || internalSearch).toLowerCase().trim();

  // Filter transactions
  let filtered = transactions;
  if (activeFilter === 'income') {
    filtered = filtered.filter(t => t.type === 'income');
  } else if (activeFilter === 'expense') {
    filtered = filtered.filter(t => t.type === 'expense');
  } else if (activeFilter === 'recurring') {
    filtered = filtered.filter(t => t.isRecurring);
  }

  if (query) {
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      (t.source && t.source.toLowerCase().includes(query)) ||
      (t.note && t.note.toLowerCase().includes(query))
    );
  }

  const displayedList = expandedView ? filtered : filtered.slice(0, 6);

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

        {/* Search & Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Quick inline search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-canvas-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '2px 8px',
              gap: '4px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
            <input
              type="text"
              placeholder="Search ledger..."
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                outline: 'none',
                width: '120px',
                color: 'var(--text-main)'
              }}
            />
            {internalSearch && (
              <button
                type="button"
                onClick={() => setInternalSearch('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflowX: 'auto' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'income', label: 'Income (+)' },
              { id: 'expense', label: 'Expenses (-)' },
              { id: 'recurring', label: 'Recurring' }
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id as any)}
                style={{
                  padding: '0.35rem 0.625rem',
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
      </div>

      {/* Transactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {displayedList.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No transactions match the selected filter or search query.
          </div>
        ) : (
          displayedList.map((tx) => {
            const config = getCategoryConfig(tx.category, categoryConfigs);
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
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
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
                          border: `1px solid ${config.color}40`,
                          transition: 'all 0.2s ease'
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
                </div>
              </div>
            );
          })
        )}
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
        <span style={{ color: 'var(--text-muted)' }}>
          Showing {displayedList.length} of {filtered.length} matching transactions ({transactions.length} total)
        </span>
        {filtered.length > 6 && (
          <button
            type="button"
            onClick={() => setExpandedView(prev => !prev)}
            style={{
              fontWeight: 700,
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <span>{expandedView ? 'Show Less (Top 6)' : `View All ${filtered.length} Transactions`}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {expandedView ? 'expand_less' : 'arrow_forward'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
