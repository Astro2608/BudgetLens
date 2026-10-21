/**
 * @summary LoanCard component presenting loan progress, target payments, and payoff breakdown.
 * Connects transactions with reducing-balance banking amortization and educational insights.
 *
 * @ai-directive Strictly preserve modularity; avoid bloating this into a God component.
 * Maintain SOLID & DRY principles by delegating math to utils and sub-views to modular components.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Loan, Transaction, CategoryKey, CategoryConfig } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import {
  calculateLoanAmortization,
  calculateMonthlyTargetPayment,
  generateBurndownData,
  detectMissingLoanMonths
} from '../utils/loanAmortization';
import { LoanEducationDrawer } from './LoanEducationDrawer';
import { LoanSmartMatchBanner } from './LoanSmartMatchBanner';
import { LoanBacktrackModal } from './LoanBacktrackModal';

interface LoanCardProps {
  loan: Loan;
  transactions: Transaction[];
  allLoans?: Loan[];
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
  onDelete?: (id: string) => void;
  onLinkTransactions?: (transactionIds: string[], loan: Loan) => void;
  onAddBatchTransactions?: (txs: Omit<Transaction, 'id'>[]) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  transactions,
  allLoans = [],
  categoryConfigs = {},
  onDelete,
  onLinkTransactions,
  onAddBatchTransactions
}) => {
  const { formatCurrency, currencyInfo } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [isBacktrackModalOpen, setIsBacktrackModalOpen] = useState(false);

  // Target monthly payment
  const monthlyTargetPayment = useMemo(() => {
    return calculateMonthlyTargetPayment(loan);
  }, [loan]);

  // Banking-grade reducing-balance amortization
  const amortizationData = useMemo(() => {
    return calculateLoanAmortization(loan, transactions, allLoans, monthlyTargetPayment);
  }, [loan, transactions, allLoans, monthlyTargetPayment]);

  const {
    totalPaid,
    totalInterest: estimatedInterestPaid,
    totalPrincipal: principalPaid,
    remainingBalance: remainingPrincipal,
    progressPercent,
    latestInterest,
    latestPrincipal,
    latestPayment
  } = amortizationData;

  // Projected debt-free timeline
  const monthsRemaining = useMemo(() => {
    if (remainingPrincipal <= 0 || monthlyTargetPayment <= 0) return 0;
    return Math.ceil(remainingPrincipal / monthlyTargetPayment);
  }, [remainingPrincipal, monthlyTargetPayment]);

  const projectedDebtFreeDate = useMemo(() => {
    if (monthsRemaining <= 0) return 'Fully Paid';
    const d = new Date();
    d.setMonth(d.getMonth() + monthsRemaining);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [monthsRemaining]);

  // Burndown projection data
  const chartData = useMemo(() => {
    return generateBurndownData(loan, monthlyTargetPayment);
  }, [loan, monthlyTargetPayment]);

  // Detect unrecorded historical months for catch-up
  const missingProposals = useMemo(() => {
    return detectMissingLoanMonths(loan, transactions, monthlyTargetPayment);
  }, [loan, transactions, monthlyTargetPayment]);

  // Smart match candidate detection
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

      const hasTag = tx.tags?.some(t => t.toLowerCase() === loan.linkedTag.toLowerCase());
      const hasAlloc = tx.loanAllocations && tx.loanAllocations[loan.id] !== undefined;
      if (hasTag || hasAlloc) return false;

      if (dismissedTxIds.includes(tx.id)) return false;

      const diff = Math.abs(tx.amount - monthlyTargetPayment);
      if (diff > 2.00) return false;

      if (loan.startDate && !loan.isReverseEstimated) {
        const start = new Date(loan.startDate);
        const now = new Date();
        if ((now.getTime() - start.getTime()) > 7 * 24 * 60 * 60 * 1000) {
          if (new Date(tx.date) < start) return false;
        }
      }

      return true;
    });
  }, [transactions, loan, monthlyTargetPayment, dismissedTxIds]);

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
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-card)',
        padding: '18px',
        boxShadow: 'var(--shadow-sm)',
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
            <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '20px', flexShrink: 0 }}>account_balance</span>
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={loan.name}>
              {loan.name}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', backgroundColor: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: '6px' }}>
              #{loan.linkedTag}
            </span>
            {loan.isReverseEstimated && (
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#3b82f6',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Estimated initial cost reverse-calculated from monthly payment & interest rate"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#3b82f6' }}>auto_awesome</span>
                Reverse estimation cost
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
            {formatCurrency(remainingPrincipal)}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Remaining Balance</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px', fontWeight: 700 }}>
          <span style={{ color: '#10b981' }}>{progressPercent.toFixed(1)}% Paid Off</span>
          <span style={{ color: 'var(--text-muted)' }}>Total: {formatCurrency(loan.initialPrincipal)}</span>
        </div>
        <div style={{ height: '7px', backgroundColor: 'var(--bg-canvas-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
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
        <div style={{ backgroundColor: 'var(--bg-canvas-subtle)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Debt-Free Goal</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>{projectedDebtFreeDate}</span>
        </div>
        <div style={{ backgroundColor: 'var(--bg-canvas-subtle)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Target</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(monthlyTargetPayment)}/mo</span>
        </div>
      </div>

      {/* Smart Match Suggestions Section */}
      <LoanSmartMatchBanner
        candidates={matchingCandidates}
        selectedCandidateIds={selectedCandidateIds}
        monthlyTargetPayment={monthlyTargetPayment}
        onToggleCandidate={handleToggleCandidate}
        onToggleSelectAll={handleToggleSelectAll}
        onApproveSelected={handleApproveSelected}
        onDismissMatches={handleDismissMatches}
      />

      {/* Expanded Details Section */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>Payoff Projection & Breakdown</h4>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 700 }}
            >
              Close <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>expand_less</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Historical Catch-Up Suggestion Banner */}
            {missingProposals.length > 0 && onAddBatchTransactions && (
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history_toggle_off</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#14532d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Catch Up Historical Payments ({missingProposals.length} Missing Month{missingProposals.length > 1 ? 's' : ''})
                    </div>
                    <div style={{ fontSize: '11px', color: '#166534', lineHeight: 1.3 }}>
                      Started {loan.startDate}. Missing ~{formatCurrency(missingProposals.length * monthlyTargetPayment)} across past unrecorded months.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBacktrackModalOpen(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>auto_mode</span>
                  Review & Catch Up
                </button>
              </div>
            )}

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

            {/* Payment Distribution Card with Option A Educational Dropdown */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Header with Education Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#334155' }}>pie_chart</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>
                    Payment Distribution To Date
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEducation(prev => !prev);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: showEducation ? '#eff6ff' : '#ffffff',
                    color: showEducation ? '#2563eb' : '#475569',
                    border: `1px solid ${showEducation ? '#93c5fd' : '#cbd5e1'}`,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Learn how banks calculate daily interest and deduct it from your payment"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#2563eb' }}>
                    school
                  </span>
                  <span>How Bank Interest Works</span>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '15px',
                      transition: 'transform 0.2s ease',
                      transform: showEducation ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    expand_more
                  </span>
                </button>
              </div>

              {/* Summary Metric Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                      <span style={{ color: '#475569' }}>Estimated Interest Fee ({loan.interestRate}% p.a.)</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatCurrency(estimatedInterestPaid)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px', marginTop: '2px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Total Recorded Payments</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(totalPaid)}</span>
                </div>
              </div>

              {/* Option A: Dropdown Educational Drawer */}
              {showEducation && (
                <LoanEducationDrawer
                  interestRate={loan.interestRate}
                  latestPayment={latestPayment}
                  latestPrincipal={latestPrincipal}
                  latestInterest={latestInterest}
                />
              )}

              {loan.isReverseEstimated && (
                <div style={{ fontSize: '11px', color: '#1e3a8a', backgroundColor: '#eff6ff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', marginTop: '2px', lineHeight: 1.3 }}>
                  <strong>Note: Reverse estimation cost —</strong> Created without exact initial details. Reverse estimated based on monthly payment of {formatCurrency(loan.fixedMonthlyPayment || monthlyTargetPayment)}/mo at {loan.interestRate}% p.a.
                </div>
              )}

              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
                Tip: Tagging or allocating your expense transactions automatically reduces your balance and updates this projection.
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

      {/* Loan Backtrack Catch-Up Modal */}
      {isBacktrackModalOpen && onAddBatchTransactions && (
        <LoanBacktrackModal
          isOpen={isBacktrackModalOpen}
          onClose={() => setIsBacktrackModalOpen(false)}
          loan={loan}
          proposals={missingProposals}
          categoryConfigs={categoryConfigs}
          onConfirmBacktrack={onAddBatchTransactions}
        />
      )}
    </div>
  );
};
