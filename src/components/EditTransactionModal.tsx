import React, { useState, useEffect } from 'react';
import { TransactionType, CategoryKey, Transaction, CategoryConfig, Loan } from '../types/finance';
import { DEFAULT_CATEGORY_CONFIGS } from '../config/categoryConfig';
import { useCurrency } from '../context/CurrencyContext';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (updatedTx: Transaction) => void;
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
  loans?: Loan[];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSave,
  categoryConfigs = DEFAULT_CATEGORY_CONFIGS,
  loans = []
}) => {
  const { currencyCode, currencyInfo, formatCurrency } = useCurrency();
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryKey>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tagsInput, setTagsInput] = useState('');

  // Loan allocations: loanId -> allocated amount
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setTitle(transaction.title || '');
      setDescription(transaction.description || transaction.note || '');
      const txAmt = transaction.amount ? String(transaction.amount) : '';
      setAmount(txAmt);
      setCategory(transaction.category || 'General');
      setDate(transaction.date || new Date().toISOString().split('T')[0]);
      setTagsInput(transaction.tags ? transaction.tags.join(', ') : '');

      // Initialize loan selections
      const numericAmt = transaction.amount || 0;
      if (transaction.loanAllocations && Object.keys(transaction.loanAllocations).length > 0) {
        const ids = Object.keys(transaction.loanAllocations);
        setSelectedLoanIds(ids);
        setAllocations(transaction.loanAllocations);
      } else if (transaction.tags && transaction.tags.length > 0) {
        // Match by tag
        const matched = loans.filter(l => transaction.tags?.includes(l.linkedTag));
        if (matched.length > 0) {
          const ids = matched.map(l => l.id);
          setSelectedLoanIds(ids);
          
          if (matched.length === 1) {
            setAllocations({ [matched[0].id]: numericAmt });
          } else {
            // Auto split by monthly ratio
            const totalMonthly = matched.reduce((sum, l) => sum + (l.fixedMonthlyPayment || (l.initialPrincipal / (l.termMonths || 12))), 0);
            const initialAlloc: Record<string, number> = {};
            matched.forEach(l => {
              const monthly = l.fixedMonthlyPayment || (l.initialPrincipal / (l.termMonths || 12));
              const ratio = totalMonthly > 0 ? (monthly / totalMonthly) : (1 / matched.length);
              initialAlloc[l.id] = Math.round(numericAmt * ratio * 100) / 100;
            });
            setAllocations(initialAlloc);
          }
        } else {
          setSelectedLoanIds([]);
          setAllocations({});
        }
      } else {
        setSelectedLoanIds([]);
        setAllocations({});
      }
    }
  }, [transaction, loans]);

  if (!isOpen || !transaction) return null;

  const categories = Object.values(categoryConfigs);
  const activeCatConfig = categories.find((c) => c.key === category);
  const categoryPresetTags = activeCatConfig?.tags || [];
  const catColor = activeCatConfig?.color || '#0284c7';

  const toggleTagInInput = (tag: string) => {
    const cleanTag = tag.toLowerCase().replace(/^#/, '').trim();
    const currentTags = tagsInput
      .split(/[,;\s]+/)
      .map((t: string) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    if (currentTags.includes(cleanTag)) {
      setTagsInput(currentTags.filter((t: string) => t !== cleanTag).join(', '));
    } else {
      setTagsInput([...currentTags, cleanTag].join(', '));
    }
  };
  const currentTotalAmount = parseFloat(amount) || 0;

  // Toggle a loan selection
  const handleToggleLoan = (loanId: string) => {
    const toggledLoan = loans.find(l => l.id === loanId);
    setSelectedLoanIds(prev => {
      let next: string[];
      if (prev.includes(loanId)) {
        next = prev.filter(id => id !== loanId);
        // Automatically strip this loan's tag from tagsInput
        if (toggledLoan) {
          const currentTags = tagsInput
            .split(',')
            .map(t => t.trim().replace(/^#/, ''))
            .filter(t => t.toLowerCase() !== toggledLoan.linkedTag.toLowerCase());
          setTagsInput(currentTags.join(', '));
        }
      } else {
        next = [...prev, loanId];
        // Automatically add this loan's tag to tagsInput
        if (toggledLoan) {
          const currentTags = tagsInput
            .split(',')
            .map(t => t.trim().replace(/^#/, ''))
            .filter(Boolean);
          if (!currentTags.some(t => t.toLowerCase() === toggledLoan.linkedTag.toLowerCase())) {
            currentTags.push(toggledLoan.linkedTag);
          }
          setTagsInput(currentTags.join(', '));
        }
      }

      // Recompute allocations for active loans
      if (next.length === 0) {
        setAllocations({});
      } else if (next.length === 1) {
        setAllocations({ [next[0]]: currentTotalAmount });
      } else {
        // Auto-split by monthly ratio
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

  // Quick Action: Auto-split by scheduled monthly installment ratio
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

  // Quick Action: Split equally
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

    let parsedTags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    // If loans were unselected, strip their linked tags so they are not retained
    const unselectedLoans = loans.filter(l => !selectedLoanIds.includes(l.id));
    const unselectedTags = unselectedLoans.map(l => l.linkedTag.toLowerCase());
    parsedTags = parsedTags.filter(t => !unselectedTags.includes(t.toLowerCase()));

    // If no loans are selected at all, purge all known loan tags from this transaction
    if (selectedLoanIds.length === 0) {
      const allLoanTags = loans.map(l => l.linkedTag.toLowerCase());
      parsedTags = parsedTags.filter(t => !allLoanTags.includes(t.toLowerCase()));
    } else {
      // Ensure selected loan tags are present
      const selectedLoans = loans.filter(l => selectedLoanIds.includes(l.id));
      selectedLoans.forEach(l => {
        if (!parsedTags.some(t => t.toLowerCase() === l.linkedTag.toLowerCase())) {
          parsedTags.push(l.linkedTag);
        }
      });
    }

    // Set explicit allocation mapping (if none selected, set empty object {} so it does not fallback to tag matching)
    const finalAllocations: Record<string, number> = {};
    if (selectedLoanIds.length === 1) {
      finalAllocations[selectedLoanIds[0]] = numAmt;
    } else if (selectedLoanIds.length > 1) {
      selectedLoanIds.forEach(id => {
        finalAllocations[id] = allocations[id] !== undefined ? allocations[id] : 0;
      });
    }

    const updated: Transaction = {
      ...transaction,
      title: title.trim() || 'Untitled Transaction',
      description: description.trim() || undefined,
      note: description.trim() || transaction.note || 'Manual Record',
      amount: numAmt,
      type,
      category,
      date,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      loanAllocations: selectedLoanIds.length > 0 ? finalAllocations : {}
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ddd6fe'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit_note</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Edit Transaction
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Update title, amount, category, or loan payoff split
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Inflow / Outflow Toggle */}
          <div
            style={{
              display: 'flex',
              padding: '0.25rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              gap: '0.25rem'
            }}
          >
            <button
              type="button"
              onClick={() => setType('expense')}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                backgroundColor: type === 'expense' ? '#ffffff' : 'transparent',
                color: type === 'expense' ? '#ef4444' : '#64748b',
                boxShadow: type === 'expense' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_downward</span>
              Outflow (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                backgroundColor: type === 'income' ? '#ffffff' : 'transparent',
                color: type === 'income' ? '#10b981' : '#64748b',
                boxShadow: type === 'income' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_upward</span>
              Inflow (Income)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Amount ({currencyCode})
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '1rem', fontWeight: 800, color: type === 'expense' ? '#ef4444' : '#10b981', fontSize: '1.125rem' }}>
                {type === 'expense' ? '-' : '+'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  const newAmt = parseFloat(e.target.value) || 0;
                  if (selectedLoanIds.length === 1) {
                    setAllocations({ [selectedLoanIds[0]]: newAmt });
                  }
                }}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2rem',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  color: '#0f172a',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Merchant / Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FairPrice, Monthly Salary, Education Loan GIRO"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                color: '#0f172a',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* Category & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600
                }}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          {/* Smart Loan Allocation Section (If user has active loans) */}
          {loans.length > 0 && type === 'expense' && (
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '18px' }}>account_balance</span>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Link & Allocate to Loan(s)
                  </label>
                </div>
                {selectedLoanIds.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleAutoSplitRatio}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Split proportionally based on scheduled monthly payments"
                    >
                      Ratio Split
                    </button>
                    <button
                      type="button"
                      onClick={handleSplitEqually}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Split 50/50
                    </button>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                Select the loan(s) this payment reduces. If a single payment covers multiple loans, assign each loan's portion below.
              </div>

              {/* Loan selection pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: selectedLoanIds.length > 1 ? '12px' : '0px' }}>
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
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        color: isSelected ? '#1d4ed8' : '#475569'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span>{loan.name}</span>
                      <span style={{ fontSize: '10px', opacity: 0.8, color: isSelected ? '#2563eb' : '#94a3b8' }}>
                        (#{loan.linkedTag})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Allocation inputs if 2 or more loans are selected */}
              {selectedLoanIds.length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  {loans.filter(l => selectedLoanIds.includes(l.id)).map(loan => (
                    <div key={loan.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{loan.name}</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          Target: {formatCurrency(loan.fixedMonthlyPayment || (loan.initialPrincipal / (loan.termMonths || 12)))}/mo
                        </span>
                      </div>
                      <div style={{ position: 'relative', width: '130px' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '7px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{currencyInfo.symbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={allocations[loan.id] !== undefined ? allocations[loan.id] : ''}
                          onChange={(e) => handleAllocationChange(loan.id, e.target.value)}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '6px 8px 6px 20px',
                            fontSize: '12px',
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

                  {/* Allocation balance status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', fontSize: '11px', fontWeight: 700 }}>
                    <span style={{ color: '#64748b' }}>Total Allocated:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: Math.abs(allocationDifference) < 0.05 ? '#10b981' : '#f59e0b' }}>
                        {formatCurrency(totalAllocated)} / {formatCurrency(currentTotalAmount)}
                      </span>
                      {Math.abs(allocationDifference) < 0.05 ? (
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#10b981' }}>check_circle</span>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#f59e0b' }}>
                          ({allocationDifference > 0 ? `-${formatCurrency(allocationDifference)} unallocated` : `+${formatCurrency(Math.abs(allocationDifference))} over`})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description / Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly installment payment"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                color: '#0f172a',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* Custom Tags */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tags & Labels (Optional)
            </label>
            {categoryPresetTags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Preset Tags:</span>
                {categoryPresetTags.map((tag) => {
                  const currentTags = tagsInput
                    .split(/[,;\s]+/)
                    .map((t: string) => t.trim().toLowerCase().replace(/^#/, ''))
                    .filter(Boolean);
                  const isActive = currentTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTagInInput(tag)}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: isActive ? `1px solid ${catColor}` : '1px solid #cbd5e1',
                        backgroundColor: isActive ? `${catColor}20` : '#f8fafc',
                        color: isActive ? catColor : '#334155',
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
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. mrt, grab, taxi (comma separated)"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                color: '#0f172a',
                backgroundColor: '#ffffff'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2,
                padding: '0.75rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6d28d9')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
