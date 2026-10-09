/**
 * @summary Educational drawer detailing banking loan mechanics, daily interest accrual, and payment splits.
 * Visually communicates how fixed installments reduce debt over time without checking-account penalties.
 *
 * @ai-directive Keep this component focused exclusively on educational presentation and visual feedback.
 * Preserve SOLID and DRY principles; delegate mathematical amortization logic to utils/loanAmortization.
 */

import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

interface LoanEducationDrawerProps {
  interestRate: number;
  latestPayment: number;
  latestPrincipal: number;
  latestInterest: number;
}

export const LoanEducationDrawer: React.FC<LoanEducationDrawerProps> = ({
  interestRate,
  latestPayment,
  latestPrincipal,
  latestInterest
}) => {
  const { formatCurrency } = useCurrency();

  const safePayment = latestPayment > 0 ? latestPayment : 1;
  const principalPct = Math.min(100, Math.max(0, (latestPrincipal / safePayment) * 100));
  const interestPct = Math.max(0, 100 - principalPct);

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #bfdbfe',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'fadeIn 0.2s ease-out',
        boxShadow: '0 4px 12px -2px rgba(37, 99, 235, 0.08)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dynamic Payment Split Visualizer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e3a8a' }}>
            Where Does Your {formatCurrency(latestPayment)}/mo Payment Go?
          </span>
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            Based on your current balance
          </span>
        </div>

        {/* Two-tone visual split bar */}
        <div style={{ height: '10px', backgroundColor: '#fee2e2', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
          <div
            style={{
              width: `${principalPct}%`,
              backgroundColor: '#10b981',
              height: '100%',
              transition: 'width 0.4s ease'
            }}
            title={`Principal: ${formatCurrency(latestPrincipal)} (${principalPct.toFixed(1)}%)`}
          />
          <div
            style={{
              width: `${interestPct}%`,
              backgroundColor: '#ef4444',
              height: '100%',
              transition: 'width 0.4s ease'
            }}
            title={`Interest: ${formatCurrency(latestInterest)} (${interestPct.toFixed(1)}%)`}
          />
        </div>

        {/* Dynamic Multi-Currency Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
          <span style={{ color: '#059669', fontWeight: 700 }}>
            🟩 Principal: ~{formatCurrency(latestPrincipal)} ({principalPct.toFixed(1)}%)
          </span>
          <span style={{ color: '#dc2626', fontWeight: 700 }}>
            🟥 Bank Interest: ~{formatCurrency(latestInterest)} ({interestPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* 3 Modular Step Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
        {/* Point 1: Fixed GIRO */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>credit_card</span>
          </div>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.35 }}>
            <strong style={{ color: '#0f172a' }}>1. Fixed GIRO deduction:</strong> Only your fixed installment ({formatCurrency(latestPayment)}) leaves your bank account. No separate interest charge is debited from your checking account.
          </div>
        </div>

        {/* Point 2: 365-Day Rule */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>calendar_month</span>
          </div>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.35 }}>
            <strong style={{ color: '#0f172a' }}>2. The 365-Day Daily Rule:</strong> The bank calculates interest daily on your <em>remaining</em> balance: <code>(Balance × {interestRate}% ÷ 365) × Days</code>. That interest is added to your loan, and your GIRO pays both the interest and the principal.
          </div>
        </div>

        {/* Point 3: Snowball acceleration */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>trending_down</span>
          </div>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.35 }}>
            <strong style={{ color: '#0f172a' }}>3. The Payoff Snowball:</strong> As your balance drops over time, the bank's interest cut shrinks every single month, accelerating how fast your principal is wiped out!
          </div>
        </div>
      </div>
    </div>
  );
};
