import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

interface HeroSectionProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  onOpenAddModal?: () => void;
  onScrollToImport: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalBalance,
  totalIncome,
  totalExpenses,
  onScrollToImport
}) => {
  const { formatCurrency, currencyInfo } = useCurrency();
  const isNegative = totalBalance < 0;
  const isZero = totalBalance === 0;

  // Dynamic color coding: Red for negative/deficit, Green for positive surplus, neutral for zero
  const headlineColor = isNegative ? '#ef4444' : isZero ? 'var(--text-main)' : '#059669';

  const balanceBadge = isNegative
    ? { text: 'Deficit / Negative Balance', bg: '#fee2e2', color: '#dc2626', border: '#fecdd3' }
    : isZero
      ? { text: `Current Bank Balance (${formatCurrency(0)})`, bg: 'var(--bg-canvas-subtle)', color: 'var(--text-muted)', border: 'var(--border-subtle)' }
      : { text: 'Current Bank Balance (Surplus)', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };

  return (
    <section className="BudgetLens-card" style={{ padding: '1.75rem', gap: '1.25rem' }}>
      {/* Upper row: Balance + Action buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                backgroundColor: isNegative ? '#fff1f2' : '#ecfdf5',
                color: isNegative ? '#be123c' : '#047857',
                fontSize: '11px',
                fontWeight: 700,
                border: `1px solid ${isNegative ? '#fecdd3' : '#a7f3d0'}`,
                cursor: 'help'
              }}
              title="Real-time sync calculation active on offline local vault state."
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isNegative ? '#ef4444' : '#10b981',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              ></span>
              Live Sync Active
            </span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-subtle)' }}>
              Calculated live: keyed cash in minus outflows
            </span>
          </div>

          <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: '4px' }}>
            Safe-to-Spend Balance ({currencyInfo.code})
          </p>

          <div
            style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', cursor: 'help' }}
            title="Total Liquid Funds = Starting Balance + Recorded Inflows - Keyed Outflows (Savings retained)."
          >
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: headlineColor,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                transition: 'color 0.2s ease'
              }}
            >
              {formatCurrency(totalBalance)}
            </h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: balanceBadge.bg,
                color: balanceBadge.color,
                border: `1px solid ${balanceBadge.border}`,
                transition: 'all 0.2s ease'
              }}
            >
              {balanceBadge.text}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={onScrollToImport} title="Upload a bank CSV statement to parse and categorize transactions">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>upload_file</span>
            <span>Bulk Upload</span>
          </button>
        </div>
      </div>

      {/* Lower row: 2 Clean Metric Cards (Money In & Money Out) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.875rem' }}>
        {/* Total Income */}
        <div
          style={{
            backgroundColor: 'var(--bg-canvas-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'help',
            transition: 'border-color 0.2s ease, transform 0.2s ease'
          }}
          title="Total Cash In: Sum of all salary, freelance, investment dividends, and incoming transfers recorded."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Total Money In
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>info</span>
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(totalIncome, true)}</span>
          </div>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>trending_up</span>
          </div>
        </div>

        {/* Total Outflows */}
        <div
          style={{
            backgroundColor: 'var(--bg-canvas-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'help',
            transition: 'border-color 0.2s ease, transform 0.2s ease'
          }}
          title="Total Cash Out: Sum of all categorical living expenses, rent, bills, and dining (excludes savings transfers)."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Total Money Out
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>info</span>
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{formatCurrency(-totalExpenses, false)}</span>
          </div>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>trending_down</span>
          </div>
        </div>
      </div>
    </section>
  );
};
