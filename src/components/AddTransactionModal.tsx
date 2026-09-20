import React, { useState } from 'react';
import { TransactionType, CategoryKey, Transaction, CategoryConfig, Loan } from '../types/finance';
import { DEFAULT_CATEGORY_CONFIGS } from '../config/categoryConfig';
import { useCurrency } from '../context/CurrencyContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
  loans?: Loan[];
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  categoryConfigs = DEFAULT_CATEGORY_CONFIGS,
  loans = []
}) => {
  const { currencyCode, currencyInfo, formatCurrency, autoDetectCurrency } = useCurrency();
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryKey>('General');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Loan allocations
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const categories = Object.values(categoryConfigs);
  const activeCatConfig = categories.find((c) => c.key === category);
  const categoryPresetTags = activeCatConfig?.tags || [];
  const catColor = activeCatConfig?.color || '#0284c7';

  const toggleTag = (tag: string) => {
    const clean = tag.toLowerCase().replace(/^#/, '').trim();
    setSelectedTags((prev) =>
      prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean]
    );
  };

  if (!isOpen) return null;

  const currentTotalAmount = parseFloat(amount) || 0;

  const handleToggleLoan = (loanId: string) => {
    setSelectedLoanIds(prev => {
      let next: string[];
      if (prev.includes(loanId)) {
        next = prev.filter(id => id !== loanId);
      } else {
        next = [...prev, loanId];
      }

      if (next.length === 0) {
        setAllocations({});
      } else if (next.length === 1) {
        setAllocations({ [next[0]]: currentTotalAmount });
      } else {
        const activeLoans = loans.filter(l => next.includes(l.id));
        const totalMonthly = activeLoans.reduce((sum, l) => sum + (l.fixedMonthlyPayment || (l.initialPrincipal / (l.termMonths || 12))), 0);
        const newAlloc: Record<string, number> = {};
        activeLoans.forEach(l => {
          const monthly = l.fixedMonthlyPayment || (l.initialPrincipal / (l.termMonths || 12));
          const ratio = totalMonthly > 0 ? (monthly / totalMonthly) : (1 / activeLoans.length);
          newAlloc[l.id] = Math.round(currentTotalAmount * ratio * 100) / 100;
        });
        setAllocations(newAlloc);
      }
      return next;
    });
  };

  const handleAutoSplitRatio = () => {
    if (selectedLoanIds.length === 0) return;
    const activeLoans = loans.filter(l => selectedLoanIds.includes(l.id));
    const totalMonthly = activeLoans.reduce((sum, l) => sum + (l.fixedMonthlyPayment || (l.initialPrincipal / (l.termMonths || 12))), 0);
    const newAlloc: Record<string, number> = {};
    activeLoans.forEach(l => {
      const monthly = l.fixedMonthlyPayment || (l.initialPrincipal / (l.termMonths || 12));
      const ratio = totalMonthly > 0 ? (monthly / totalMonthly) : (1 / activeLoans.length);
      newAlloc[l.id] = Math.round(currentTotalAmount * ratio * 100) / 100;
    });
    setAllocations(newAlloc);
  };

  const handleSplitEqually = () => {
    if (selectedLoanIds.length === 0) return;
    const splitVal = Math.round((currentTotalAmount / selectedLoanIds.length) * 100) / 100;
    const newAlloc: Record<string, number> = {};
    selectedLoanIds.forEach(id => {
      newAlloc[id] = splitVal;
    });
    setAllocations(newAlloc);
  };

  const handleAllocationChange = (loanId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setAllocations(prev => ({
      ...prev,
      [loanId]: num
    }));
  };

  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const allocationDifference = Math.round((currentTotalAmount - totalAllocated) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) return;

    const tags: string[] = [];
    if (selectedLoanIds.length > 0) {
      const selectedLoans = loans.filter(l => selectedLoanIds.includes(l.id));
      selectedLoans.forEach(l => {
        if (!tags.includes(l.linkedTag)) {
          tags.push(l.linkedTag);
        }
      });
    }

    const parsedCustom = tagsInput
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const mergedTags = Array.from(new Set([...tags, ...selectedTags, ...parsedCustom]));

    onAddTransaction({
      title: title.trim() || 'Untitled Transaction',
      description: description.trim() || undefined,
      amount: numAmt,
      type,
      category,
      date,
      isRecurring,
      note: description.trim() || 'Manual Record',
      source: 'User Entry',
      tags: mergedTags.length > 0 ? mergedTags : undefined,
      loanAllocations: selectedLoanIds.length > 0 ? allocations : undefined
    });

    setTitle('');
    setDescription('');
    setAmount('');
    setIsRecurring(false);
    setSelectedLoanIds([]);
    setAllocations({});
    setSelectedTags([]);
    setTagsInput('');
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
          gap: '1.25rem',
          maxHeight: '90vh',
          overflowY: 'auto'
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
              padding: '0.25rem',
              backgroundColor: 'var(--bg-canvas-subtle)',
              borderRadius: 'var(--radius-md)',
              gap: '0.25rem'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'Salary') setCategory('Food');
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                backgroundColor: type === 'expense' ? '#ffffff' : 'transparent',
                color: type === 'expense' ? '#ef4444' : 'var(--text-muted)',
                boxShadow: type === 'expense' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 150ms ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_downward</span>
              Outflow (Expense)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                backgroundColor: type === 'income' ? '#ffffff' : 'transparent',
                color: type === 'income' ? '#10b981' : 'var(--text-muted)',
                boxShadow: type === 'income' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 150ms ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_upward</span>
              Inflow (Income)
            </button>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Description / Title</label>
            <input
              type="text"
              required
              placeholder={type === 'expense' ? "e.g. FairPrice, Din Tai Fung, MOE Loan GIRO" : "e.g. Monthly Salary, Freelance Design"}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                autoDetectCurrency(e.target.value);
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                fontSize: '13px',
                fontWeight: 500,
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
                onChange={(e) => {
                  setAmount(e.target.value);
                  const newAmt = parseFloat(e.target.value) || 0;
                  if (selectedLoanIds.length === 1) {
                    setAllocations({ [selectedLoanIds[0]]: newAmt });
                  }
                }}
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

          {/* Category Preset Tags & Custom Tags Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Tags (Optional)</span>
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 400 }}>Click chips or type custom tags</span>
            </label>

            {categoryPresetTags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-subtle)' }}>Preset Tags:</span>
                {categoryPresetTags.map((tag) => {
                  const isActive = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: isActive ? `1px solid ${catColor}` : '1px solid var(--border-subtle)',
                        backgroundColor: isActive ? `${catColor}20` : 'var(--bg-canvas-subtle)',
                        color: isActive ? catColor : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {isActive ? '✓ ' : '+ '}#{tag}
                    </button>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              placeholder="Custom tags (e.g. mrt, grab, taxi)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>

          {/* Link to Loan(s) if active loans exist and type is expense */}
          {loans.length > 0 && type === 'expense' && (
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '18px' }}>account_balance</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>Link to Loan(s)</span>
                </div>
                {selectedLoanIds.length > 1 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={handleAutoSplitRatio}
                      style={{
                        fontSize: '10.5px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #bfdbfe',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Ratio Split
                    </button>
                    <button
                      type="button"
                      onClick={handleSplitEqually}
                      style={{
                        fontSize: '10.5px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      50/50
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: selectedLoanIds.length > 1 ? '10px' : '0' }}>
                {loans.map(loan => {
                  const isSelected = selectedLoanIds.includes(loan.id);
                  return (
                    <button
                      key={loan.id}
                      type="button"
                      onClick={() => handleToggleLoan(loan.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        color: isSelected ? '#1d4ed8' : '#475569'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span>{loan.name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedLoanIds.length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  {loans.filter(l => selectedLoanIds.includes(l.id)).map(loan => (
                    <div key={loan.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#1e293b' }}>{loan.name}</span>
                      <div style={{ position: 'relative', width: '110px' }}>
                        <span style={{ position: 'absolute', left: '6px', top: '5px', fontSize: '11px', color: '#64748b' }}>{currencyInfo.symbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={allocations[loan.id] !== undefined ? allocations[loan.id] : ''}
                          onChange={(e) => handleAllocationChange(loan.id, e.target.value)}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '4px 6px 4px 16px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            outline: 'none',
                            color: '#0f172a',
                            textAlign: 'right'
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1', fontSize: '10.5px', fontWeight: 700 }}>
                    <span style={{ color: '#64748b' }}>Allocated:</span>
                    <span style={{ color: Math.abs(allocationDifference) < 0.05 ? '#10b981' : '#f59e0b' }}>
                      {formatCurrency(totalAllocated)} / {formatCurrency(currentTotalAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recurring Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: isRecurring ? '#eff6ff' : '#f8fafc',
              border: isRecurring ? '1px solid #bfdbfe' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)', cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: isRecurring ? '#1d4ed8' : 'var(--text-main)' }}>
                🔁 Recurring Transaction (Monthly / Subscription)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Flag this charge as regular repeating expense or scheduled income
              </span>
            </div>
          </label>

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
