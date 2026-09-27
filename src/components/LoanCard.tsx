import React, { useState, useMemo, useEffect } from 'react';
import { Loan, Transaction } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface LoanCardProps {
  loan: Loan;
  transactions: Transaction[];
  allLoans?: Loan[];
  onDelete?: (id: string) => void;
  onLinkTransactions?: (transactionIds: string[], loan: Loan) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({ loan, transactions, allLoans = [], onDelete, onLinkTransactions }) => {
  const { formatCurrency, currencyInfo } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Smart calculation of total payments received for this loan
  const totalPaid = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => {
        // 1. Strict Priority: If transaction has explicit loanAllocations, only use that!
        if (tx.loanAllocations !== undefined) {
          const allocatedAmt = tx.loanAllocations[loan.id];
          return sum + (allocatedAmt ? Number(allocatedAmt) : 0);
        }

        // 2. Fallback ONLY if tx.loanAllocations is undefined (e.g. legacy or quick-tagged entry)
        if (loan.linkedTag && tx.tags?.includes(loan.linkedTag)) {
          const sharingLoans = allLoans.filter(l => l.linkedTag.toLowerCase() === loan.linkedTag.toLowerCase());
          if (sharingLoans.length <= 1) {
            return sum + tx.amount;
          }

          // Proportion by scheduled monthly payment
          const totalTargetPmt = sharingLoans.reduce((acc, l) => {
            const monthly = l.fixedMonthlyPayment || (l.initialPrincipal / (l.termMonths || 12));
            return acc + (monthly > 0 ? monthly : 1);
          }, 0);

          const thisTargetPmt = loan.fixedMonthlyPayment || (loan.initialPrincipal / (loan.termMonths || 12));
          const effectivePmt = thisTargetPmt > 0 ? thisTargetPmt : 1;
          const ratio = totalTargetPmt > 0 ? (effectivePmt / totalTargetPmt) : (1 / sharingLoans.length);

          return sum + (tx.amount * ratio);
        }

        return sum;
      }, 0);
  }, [transactions, loan, allLoans]);

  // Accurate banking amortization calculation:
  // Each monthly payment covers that month's interest on the balance: (Balance * AnnualRate / 12)
  // The remainder goes directly towards principal reduction.
  const monthlyRate = ((loan.interestRate || 0) / 100) / 12;

  const matchingPaymentsCount = useMemo(() => {
    const count = transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      if (tx.loanAllocations !== undefined) {
        return Boolean(tx.loanAllocations[loan.id] && tx.loanAllocations[loan.id] > 0);
      }
      return Boolean(loan.linkedTag && tx.tags?.includes(loan.linkedTag));
    }).length;
    return Math.max(count, totalPaid > 0 ? 1 : 0);
  }, [transactions, loan, totalPaid]);

  // Calculate realistic interest & principal split
  const estimatedInterestPaid = useMemo(() => {
    if (monthlyRate === 0 || totalPaid <= 0) return 0;
    // Monthly interest on initial balance
    const singleMonthInterest = loan.initialPrincipal * monthlyRate;
    // Across recorded payments, interest accumulates monthly
    const totalEstInterest = singleMonthInterest * matchingPaymentsCount;
    // Interest cannot exceed 40% of total payment (standard amortization safeguard)
    return Math.min(totalPaid * 0.4, totalEstInterest);
  }, [monthlyRate, loan.initialPrincipal, matchingPaymentsCount, totalPaid]);

  const principalPaid = Math.max(0, totalPaid - estimatedInterestPaid);
  const remainingPrincipal = Math.max(0, loan.initialPrincipal - principalPaid);
  const progressPercent = loan.initialPrincipal > 0 
    ? Math.min(100, Math.max(0, (principalPaid / loan.initialPrincipal) * 100))
    : 0;

  // Monthly target payment
  const monthlyTargetPayment = useMemo(() => {
    if (loan.fixedMonthlyPayment && loan.fixedMonthlyPayment > 0) {
      return loan.fixedMonthlyPayment;
    }
    const term = loan.termMonths || 12;
    if (monthlyRate === 0) return loan.initialPrincipal / term;
    const factor = Math.pow(1 + monthlyRate, term);
    const pmt = (loan.initialPrincipal * monthlyRate * factor) / (factor - 1);
    return isNaN(pmt) || !isFinite(pmt) ? loan.initialPrincipal / term : pmt;
  }, [loan, monthlyRate]);

  // Projected debt-free timeline
  const monthsRemaining = useMemo(() => {
    if (remainingPrincipal <= 0) return 0;
    if (monthlyTargetPayment <= 0) return 0;
    return Math.ceil(remainingPrincipal / monthlyTargetPayment);
  }, [remainingPrincipal, monthlyTargetPayment]);

  const projectedDebtFreeDate = useMemo(() => {
    if (monthsRemaining <= 0) return 'Fully Paid';
    const d = new Date();
    d.setMonth(d.getMonth() + monthsRemaining);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [monthsRemaining]);

  // Generate burndown data for the projection chart
  const chartData = useMemo(() => {
    const data = [];
    const initial = loan.initialPrincipal || 0;
    const term = loan.termMonths || 12;
    const pmt = monthlyTargetPayment;

    let currentBalance = initial;
    const startDateRaw = new Date(loan.startDate);
    const start = isNaN(startDateRaw.getTime()) ? new Date() : startDateRaw;

    for (let i = 0; i <= term; i++) {
      if (currentBalance < 0 && i > 0) break;
      
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      
      data.push({
        month: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        Remaining: Math.round(Math.max(0, currentBalance))
      });

      const interest = currentBalance * monthlyRate;
      const principal = pmt - interest;
      currentBalance -= principal;
    }
    return data;
  }, [loan, monthlyRate, monthlyTargetPayment]);

  // Smart match detection: find untagged previous expense transactions matching this loan's monthly installment (±$2.00)
  const [dismissedTxIds, setDismissedTxIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`budgetlens_loan_dismissed_${loan.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  const matchingCandidates = useMemo(() => {
    if (!monthlyTargetPayment || monthlyTargetPayment <= 0) return [];

    return transactions.filter(tx => {
      if (tx.type !== 'expense') return false;

      // Skip if already tagged or allocated to this loan
      const hasTag = tx.tags?.some(t => t.toLowerCase() === loan.linkedTag.toLowerCase());
      const hasAlloc = tx.loanAllocations && tx.loanAllocations[loan.id] !== undefined;
      if (hasTag || hasAlloc) return false;

      // Skip if explicitly dismissed
      if (dismissedTxIds.includes(tx.id)) return false;

      // Check amount within +/- 2 units
      const diff = Math.abs(tx.amount - monthlyTargetPayment);
      if (diff > 2.00) return false;

      // Check date: if loan was started in the past, filter tx.date >= loan.startDate
      if (loan.startDate && !loan.isReverseEstimated) {
        const start = new Date(loan.startDate);
        const now = new Date();
        // If start date is more than 7 days in the past, respect start date boundary
        if ((now.getTime() - start.getTime()) > 7 * 24 * 60 * 60 * 1000) {
          if (new Date(tx.date) < start) return false;
        }
      }

      return true;
    });
  }, [transactions, loan, monthlyTargetPayment, dismissedTxIds]);

  // Keep selected candidates synced when matching candidates change
  useEffect(() => {
    setSelectedCandidateIds(matchingCandidates.map(c => c.id));
  }, [matchingCandidates.length]);

  const handleToggleCandidate = (id: string) => {
    setSelectedCandidateIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedCandidateIds.length === matchingCandidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(matchingCandidates.map(c => c.id));
    }
  };

  const handleApproveSelected = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCandidateIds.length === 0 || !onLinkTransactions) return;
    onLinkTransactions(selectedCandidateIds, loan);
  };

  const handleDismissMatches = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIds = matchingCandidates.map(c => c.id);
    const nextDismissed = Array.from(new Set([...dismissedTxIds, ...allIds]));
    setDismissedTxIds(nextDismissed);
    try {
      localStorage.setItem(`budgetlens_loan_dismissed_${loan.id}`, JSON.stringify(nextDismissed));
    } catch {}
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '18px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
        cursor: expanded ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden'
      }}
      onClick={() => !expanded && setExpanded(true)}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '20px', flexShrink: 0 }}>account_balance</span>
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={loan.name}>
              {loan.name}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
              #{loan.linkedTag}
            </span>
            {loan.isReverseEstimated && (
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#1d4ed8',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Estimated initial cost reverse-calculated from monthly payment & interest rate"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#2563eb' }}>auto_awesome</span>
                Reverse estimation cost
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            {formatCurrency(remainingPrincipal)}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Remaining Balance</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px', fontWeight: 700 }}>
          <span style={{ color: '#10b981' }}>{progressPercent.toFixed(1)}% Paid Off</span>
          <span style={{ color: '#64748b' }}>Total: {formatCurrency(loan.initialPrincipal)}</span>
        </div>
        <div style={{ height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#10b981',
              borderRadius: '4px',
              transition: 'width 0.5s ease-out'
            }}
          />
        </div>
      </div>

      {/* Quick Summary Pill Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: expanded ? '14px' : '4px' }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Debt-Free Goal</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{projectedDebtFreeDate}</span>
        </div>
        <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Monthly Target</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(monthlyTargetPayment)}/mo</span>
        </div>
      </div>

      {/* Smart Match Suggestions Section (Only appears if untagged matches are found) */}
      {matchingCandidates.length > 0 && (
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
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4f46e5',
                flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e1b4b' }}>
                  Smart Match: {matchingCandidates.length} Untagged Payment{matchingCandidates.length > 1 ? 's' : ''} Found
                </div>
                <div style={{ fontSize: '11px', color: '#4338ca', lineHeight: 1.3 }}>
                  Matches ~{formatCurrency(monthlyTargetPayment)} (±$2.00). Are these payments for this loan?
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleDismissMatches}
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            padding: '4px 0',
            borderTop: '1px solid #e0e7ff',
            borderBottom: '1px solid #e0e7ff'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, color: '#312e81' }}>
              <input
                type="checkbox"
                checked={selectedCandidateIds.length === matchingCandidates.length && matchingCandidates.length > 0}
                onChange={handleToggleSelectAll}
                style={{ cursor: 'pointer', accentColor: '#4f46e5' }}
              />
              Select All ({matchingCandidates.length})
            </label>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>
              {selectedCandidateIds.length} of {matchingCandidates.length} selected
            </span>
          </div>

          {/* Transaction List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '160px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {matchingCandidates.map(tx => {
              const isSelected = selectedCandidateIds.includes(tx.id);
              return (
                <div
                  key={tx.id}
                  onClick={() => handleToggleCandidate(tx.id)}
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
                      onChange={() => {}} // handled by row click
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
              onClick={handleDismissMatches}
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
              onClick={handleApproveSelected}
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
      )}

      {/* Expanded Details Section */}
      {expanded && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Payoff Projection & Breakdown</h4>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 700 }}
            >
              Close <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>expand_less</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Burndown Amortization Chart */}
            <div style={{ width: '100%', height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${loan.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={24} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(val) => `${currencyInfo.symbol}${val/1000}k`} />
                  <RechartsTooltip 
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Balance']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="Remaining" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill={`url(#grad-${loan.id})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Clear Payment Breakdown Card */}
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155' }}>
                Payment Distribution To Date
              </span>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ color: '#475569' }}>Principal Reduced</span>
                </div>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{formatCurrency(principalPaid)}</span>
              </div>

              {loan.interestRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <span style={{ color: '#475569' }}>Estimated Interest Fee ({loan.interestRate}%)</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatCurrency(estimatedInterestPaid)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '2px' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>Total Recorded Payments</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(totalPaid)}</span>
              </div>

              {loan.isReverseEstimated && (
                <div style={{ fontSize: '11px', color: '#1e3a8a', backgroundColor: '#eff6ff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', marginTop: '4px', lineHeight: 1.3 }}>
                  ℹ️ <strong>Reverse estimation cost:</strong> Created without exact initial details. Reverse estimated based on monthly payment of {formatCurrency(loan.fixedMonthlyPayment || monthlyTargetPayment)}/mo at {loan.interestRate}% p.a.
                </div>
              )}

              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
                💡 Tip: Tagging or allocating your expense transactions automatically reduces your balance and updates this projection.
              </div>
            </div>

            {/* Remove Loan Button */}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isConfirmingDelete) {
                    setIsConfirmingDelete(true);
                    setTimeout(() => setIsConfirmingDelete(false), 3500);
                  } else {
                    onDelete(loan.id);
                  }
                }}
                style={{
                  backgroundColor: isConfirmingDelete ? '#dc2626' : '#fee2e2',
                  color: isConfirmingDelete ? '#ffffff' : '#ef4444',
                  border: isConfirmingDelete ? '1px solid #b91c1c' : '1px solid #fecdd3',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={e => {
                  if (!isConfirmingDelete) e.currentTarget.style.backgroundColor = '#fecaca';
                }}
                onMouseOut={e => {
                  if (!isConfirmingDelete) e.currentTarget.style.backgroundColor = '#fee2e2';
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  {isConfirmingDelete ? 'warning' : 'delete'}
                </span>
                {isConfirmingDelete ? 'Click Again to Confirm Delete' : 'Remove Loan'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
