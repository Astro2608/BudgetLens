import React, { useState } from 'react';
import { TransactionType, CategoryKey, Transaction, CategoryConfig } from '../types/finance';
import { DEFAULT_CATEGORY_CONFIGS } from '../config/categoryConfig';
import { useCurrency } from '../context/CurrencyContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  categoryConfigs = DEFAULT_CATEGORY_CONFIGS
}) => {
  const { currencyCode, autoDetectCurrency } = useCurrency();
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryKey>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = Object.values(categoryConfigs);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) return;

    onAddTransaction({
      title: title.trim() || 'Untitled Transaction',
      amount: numAmt,
      type,
      category,
      date,
      note: 'Manual Record',
      source: 'User Entry'
    });

    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-2xl)',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '480px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: type === 'expense' ? '#fee2e2' : '#d1fae5',
                color: type === 'expense' ? '#ef4444' : '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 180ms ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {type === 'expense' ? 'arrow_downward' : 'arrow_upward'}
              </span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {type === 'expense' ? 'Record Outflow' : 'Record Inflow'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {type === 'expense' ? 'Add a new expense to your ledger' : 'Add an income / deposit to your ledger'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1-Click Instant Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-canvas-subtle)',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Transaction Nature</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: type === 'expense' ? '#ef4444' : '#10b981' }}>
                {type === 'expense' ? '💸 Expense (Money Out)' : '💰 Income (Money In)'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextType = type === 'expense' ? 'income' : 'expense';
                setType(nextType);
                setCategory(nextType === 'income' ? 'Salary' : 'Food');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: type === 'expense' ? '#fee2e2' : '#ecfdf5',
                color: type === 'expense' ? '#dc2626' : '#059669',
                borderColor: type === 'expense' ? '#fca5a5' : '#6ee7b7',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 150ms ease'
              }}
              title="Click to toggle between Expense and Income"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>swap_horiz</span>
              <span>Switch to {type === 'expense' ? 'Income (+)' : 'Expense (-)'}</span>
            </button>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Merchant / Title</label>
            <input
              type="text"
              required
              placeholder="e.g. FairPrice, Grab, Monthly Salary"
              value={title}
              onChange={(e) => {
                const val = e.target.value;
                setTitle(val);
                autoDetectCurrency(val);
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Amount and Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Amount ({currencyCode})</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  fontSize: '14px',
                  fontWeight: 800,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                {categories.filter(c => type === 'income' ? c.type === 'income' : c.type !== 'income').map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
