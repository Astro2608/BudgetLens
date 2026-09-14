import React, { useState, useRef } from 'react';
import { Transaction, CategoryKey, CategoryConfig } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';
import { DateWheelPicker } from './DateWheelPicker';

interface QuickEntryBarProps {
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  categoryConfigs: Record<CategoryKey, CategoryConfig>;
}

export const QuickEntryBar: React.FC<QuickEntryBarProps> = ({
  onAddTransaction,
  categoryConfigs
}) => {
  const { currencyInfo } = useCurrency();
  const amountInputRef = useRef<HTMLInputElement>(null);

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(getTodayString());

  // Default category to 'General' if exists, else first available
  const categoryKeys = Object.keys(categoryConfigs);
  const defaultCategoryKey = categoryConfigs['General']
    ? 'General'
    : (categoryKeys[0] || 'General');

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(defaultCategoryKey);
  const [amount, setAmount] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [inputError, setInputError] = useState<boolean>(false);

  const activeConfig = categoryConfigs[selectedCategory] || {
    label: selectedCategory,
    color: '#0d9488',
    type: 'expense' as const
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setInputError(true);
      amountInputRef.current?.focus();
      return;
    }

    setInputError(false);
    const title = remark.trim() || activeConfig.label;
    const note = remark.trim() || 'Quick Entry';

    onAddTransaction({
      date,
      title,
      amount: parsedAmount,
      type: activeConfig.type || 'expense',
      category: selectedCategory,
      isRecurring: false,
      note,
      source: 'Quick Entry Bar'
    });

    // Reset amount & remark for rapid successive entry
    setAmount('');
    setRemark('');

    // Re-focus amount input for frictionless successive logs
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="lumina-card"
      style={{
        padding: '1rem 1.25rem',
        gap: '0.75rem',
        border: `1px solid ${activeConfig.color}40`,
        borderLeft: `5px solid ${activeConfig.color}`,
        backgroundColor: `color-mix(in srgb, ${activeConfig.color} 5%, var(--bg-card))`,
        boxShadow: `0 6px 22px -4px ${activeConfig.color}1c`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Header / Sub-label with Category Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: `${activeConfig.color}20`,
              color: activeConfig.color,
              transition: 'all 0.3s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>
          </span>
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-main)' }}>
            Quick Log Entry
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: `${activeConfig.color}18`,
              color: activeConfig.color,
              border: `1px solid ${activeConfig.color}35`,
              transition: 'all 0.3s ease'
            }}
          >
            {activeConfig.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '10.5px', color: 'var(--text-subtle)' }}>
            [↵ Enter anywhere to log]
          </span>
        </div>
      </div>

      {/* 1-Liner Fields Layout: Price ➔ Remark ➔ Category ➔ Date ➔ Log Entry */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.625rem',
          alignItems: 'center'
        }}
      >
        {/* Field 1: Amount / Price Entry */}
        <div
          style={{
            flex: '0 0 125px',
            minWidth: '115px',
            display: 'flex',
            alignItems: 'center',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            border: inputError ? '1.5px solid #ef4444' : `1px solid ${activeConfig.color}55`,
            backgroundColor: inputError ? '#fef2f2' : 'var(--bg-canvas-subtle)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <span
            style={{
              padding: '0 0.5rem',
              fontSize: '11.5px',
              fontWeight: 800,
              color: activeConfig.color,
              backgroundColor: `${activeConfig.color}15`,
              borderRight: `1px solid ${activeConfig.color}35`,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease'
            }}
          >
            {currencyInfo.prefix}
          </span>
          <input
            ref={amountInputRef}
            type="number"
            step="any"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (inputError) setInputError(false);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: 'transparent',
              padding: '0 0.5rem',
              color: 'var(--text-main)',
              fontSize: '13.5px',
              fontWeight: 800,
              outline: 'none',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box'
            }}
            title="Amount / Price"
          />
        </div>

        {/* Field 2: Remark / Description */}
        <div style={{ flex: '1 1 140px', minWidth: '120px' }}>
          <input
            type="text"
            placeholder="Remark (e.g. Lunch, Groceries)..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              height: '38px',
              padding: '0 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-canvas-subtle)',
              color: 'var(--text-main)',
              fontSize: '12.5px',
              fontWeight: 500,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
            title="Remark / Description"
          />
        </div>

        {/* Field 3: Category Dropdown */}
        <div style={{ flex: '1 1 165px', minWidth: '150px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${activeConfig.color}60`,
              backgroundColor: 'var(--bg-canvas-subtle)',
              padding: '0 0.5rem',
              boxSizing: 'border-box',
              gap: '6px',
              transition: 'border-color 0.3s ease'
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: activeConfig.color,
                flexShrink: 0,
                transition: 'background-color 0.3s ease'
              }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                fontSize: '12.5px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
              title="Category"
            >
              {categoryKeys.map((key) => {
                const cfg = categoryConfigs[key];
                const typeBadge = cfg.type === 'income' ? ' (Income)' : cfg.type === 'savings' ? ' (Savings)' : '';
                return (
                  <option key={key} value={key}>
                    {cfg.label}{typeBadge}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Field 4: Modern Date Wheel Picker */}
        <div style={{ flex: '0 0 auto' }}>
          <DateWheelPicker
            value={date}
            onChange={setDate}
            accentColor={activeConfig.color}
          />
        </div>

        {/* Field 5: Submit Button */}
        <div style={{ flex: '0 0 auto' }}>
          <button
            type="submit"
            style={{
              height: '38px',
              padding: '0 1.25rem',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxSizing: 'border-box',
              backgroundColor: activeConfig.color,
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 2px 8px ${activeConfig.color}40`,
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            title="Log transaction into ledger (or press Enter)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            <span>Log Entry</span>
          </button>
        </div>
      </div>
    </form>
  );
};
