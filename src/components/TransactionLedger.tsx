import React, { useState, useMemo } from 'react';
import { Transaction, CategoryConfig, CategoryKey } from '../types/finance';
import { getCategoryConfig, DEFAULT_CATEGORY_CONFIGS } from '../config/categoryConfig';
import { formatSGD } from '../utils/financeCalculator';

interface TransactionLedgerProps {
  transactions: Transaction[];
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  categoryConfigs = DEFAULT_CATEGORY_CONFIGS
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense' | 'recurring'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const itemsPerPage = 8;

  // Filter transactions
  const filtered = useMemo(() => {
    let list = transactions;

    if (activeFilter === 'income') {
      list = list.filter((t) => t.type === 'income');
    } else if (activeFilter === 'expense') {
      list = list.filter((t) => t.type === 'expense');
    } else if (activeFilter === 'recurring') {
      list = list.filter((t) => t.isRecurring);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.source && t.source.toLowerCase().includes(q)) ||
          (t.note && t.note.toLowerCase().includes(q)) ||
          t.date.includes(q)
      );
    }

    return list;
  }, [transactions, activeFilter, searchTerm]);

  // Reset page when filter or search changes
  const handleFilterChange = (filter: 'all' | 'income' | 'expense' | 'recurring') => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  // Determine which transactions to display
  const displayedList = useMemo(() => {
    if (!isArchiveOpen) {
      return filtered.slice(0, 6);
    }
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIdx, startIdx + itemsPerPage);
  }, [filtered, isArchiveOpen, currentPage]);

  return (
    <div className="lumina-card" id="transactions-section" style={{ gap: '1.25rem' }}>
      {/* 1. Header with Title & Badge */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Transaction Activity Ledger
              </h3>
              {isArchiveOpen && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-primary-border)'
                  }}
                >
                  Archive View Active
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Real-time ledger synced with personal checking & credit accounts
            </p>
          </div>
        </div>

        {/* Total Ledger Stats */}
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
          {transactions.length} Recorded Transactions
        </span>
      </div>

      {/* 2. Embedded Search Bar & Filter Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Full-width Search Input */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.5rem 0.875rem',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-xs)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search transactions by merchant, category, date, or notes..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-main)',
              width: '100%'
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
              title="Clear search"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-canvas-subtle)',
              padding: '2px 8px',
              borderRadius: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            {filtered.length} found
          </span>
        </div>

        {/* Filter Type Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflowX: 'auto' }}>
            {[
              { id: 'all', label: 'All Entries' },
              { id: 'income', label: 'Income (+)' },
              { id: 'expense', label: 'Expenses (-)' },
              { id: 'recurring', label: 'Recurring' }
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleFilterChange(chip.id as any)}
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

          {/* Archive Toggle Button */}
          <button
            type="button"
            onClick={() => setIsArchiveOpen((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: isArchiveOpen ? '#0f172a' : 'var(--bg-canvas-subtle)',
              color: isArchiveOpen ? 'white' : 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: isArchiveOpen ? '#38bdf8' : 'var(--color-primary)' }}>
              {isArchiveOpen ? 'unfold_less' : 'inventory_2'}
            </span>
            <span>{isArchiveOpen ? 'Compact Mode (Top 6)' : 'View Statement Archive'}</span>
          </button>
        </div>
      </div>

      {/* 3. Transaction Items Container (with scrollable max-height when in archive mode) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          maxHeight: isArchiveOpen ? '520px' : 'none',
          overflowY: isArchiveOpen ? 'auto' : 'visible',
          paddingRight: isArchiveOpen ? '4px' : '0'
        }}
      >
        {displayedList.length === 0 ? (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              backgroundColor: 'var(--bg-canvas-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
              receipt_long
            </span>
            No transactions match "{searchTerm || activeFilter}". Try adjusting your filters.
          </div>
        ) : (
          displayedList.map((tx) => {
            const config = getCategoryConfig(tx.category, categoryConfigs);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                style={{
                  padding: '0.75rem 0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-card)',
                  transition: 'all 150ms ease',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                {/* Left: Icon & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
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
                    <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{config.icon}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '240px'
                        }}
                      >
                        {tx.title}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: '6px',
                          backgroundColor: `${config.color}15`,
                          color: config.color,
                          border: `1px solid ${config.color}40`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {config.label}
                      </span>
                      {tx.isRecurring && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: '#e0f2fe',
                            color: '#0284c7',
                            border: '1px solid #bae6fd'
                          }}
                        >
                          Recurring
                        </span>
                      )}
                      {tx.note && (
                        <span style={{ fontSize: '10px', fontWeight: 500, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-canvas-subtle)', color: 'var(--text-muted)' }}>
                          {tx.note}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                      {tx.date} • {tx.source || 'Checking Account'}
                    </span>
                  </div>
                </div>

                {/* Right: Amount & Receipt Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: isIncome ? '#10b981' : '#ef4444'
                      }}
                    >
                      {isIncome ? `+${formatSGD(tx.amount)}` : `-${formatSGD(tx.amount)}`}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-subtle)' }}>
                      {isIncome ? 'Income' : 'Debit'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReceiptTx(tx)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-canvas-subtle)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="View Transaction Receipt Details"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>receipt_long</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Footer & Pagination Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '12px'
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          {isArchiveOpen
            ? `Showing page ${currentPage} of ${totalPages} (${filtered.length} filtered items)`
            : `Showing recent 6 of ${filtered.length} filtered transactions`}
        </span>

        {/* Pagination when Archive is open */}
        {isArchiveOpen && totalPages > 1 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                fontWeight: 700,
                color: currentPage === 1 ? '#cbd5e1' : 'var(--text-main)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_left</span>
              <span>Prev</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  border: currentPage === p ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: currentPage === p ? 'var(--color-primary)' : 'var(--bg-canvas-subtle)',
                  color: currentPage === p ? 'white' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                fontWeight: 700,
                color: currentPage === totalPages ? '#cbd5e1' : 'var(--text-main)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <span>Next</span>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
            </button>
          </div>
        ) : (
          !isArchiveOpen && (
            <button
              type="button"
              onClick={() => setIsArchiveOpen(true)}
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
              <span>View Statement Archive ({filtered.length})</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </button>
          )
        )}
      </div>

      {/* 5. Receipt Details Modal */}
      {selectedReceiptTx && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 130,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReceiptTx(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '420px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '22px' }}>receipt_long</span>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>Transaction Receipt</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptTx(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Merchant / Title</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedReceiptTx.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ fontWeight: 800, color: selectedReceiptTx.type === 'income' ? '#10b981' : '#ef4444' }}>
                  {selectedReceiptTx.type === 'income' ? '+' : '-'}{formatSGD(selectedReceiptTx.amount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Category</span>
                <span
                  style={{
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: `${getCategoryConfig(selectedReceiptTx.category, categoryConfigs).color}15`,
                    color: getCategoryConfig(selectedReceiptTx.category, categoryConfigs).color
                  }}
                >
                  {getCategoryConfig(selectedReceiptTx.category, categoryConfigs).label}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedReceiptTx.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Source Account</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedReceiptTx.source || 'Checking Account'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>Verified & Cleared</span>
              </div>
              {selectedReceiptTx.note && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Note</span>
                  <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>{selectedReceiptTx.note}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedReceiptTx(null)}
              style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
