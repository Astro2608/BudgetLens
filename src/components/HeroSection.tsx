import React from 'react';
import { formatSGD } from '../utils/financeCalculator';

interface HeroSectionProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  onOpenAddModal: () => void;
  onScrollToImport: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalBalance,
  totalIncome,
  totalExpenses,
  onOpenAddModal,
  onScrollToImport
}) => {
  return (
    <section className="lumina-card" style={{ padding: '1.75rem', gap: '1.25rem' }}>
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
                backgroundColor: '#ecfdf5',
                color: '#047857',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid #a7f3d0',
                cursor: 'help'
              }}
              title="Real-time sync calculation active on offline local vault state."
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
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
            Here is what you have with you
          </p>

          <div
            style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', cursor: 'help' }}
            title="Total Liquid Funds = Starting Balance + Recorded Inflows - Keyed Outflows (Savings retained)."
          >
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.03em',
                lineHeight: 1
              }}
            >
              {formatSGD(totalBalance)}
            </h1>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary-hover)',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              Current Bank Balance
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={onOpenAddModal} title="Record a manual expense or income into the ledger">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            <span>+ Key Expense / Income</span>
          </button>
          <button className="btn-secondary" onClick={onScrollToImport} title="Upload a bank CSV statement to parse and categorize transactions">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>upload_file</span>
            <span>Attach e-Statement</span>
          </button>
        </div>
      </div>

      {/* Lower row: 3 Styled KPI Cards with Tooltips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
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
              Keyed Cash In (Income)
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>info</span>
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{formatSGD(totalIncome, true)}</span>
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
              Keyed Outflows (Expenses)
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>info</span>
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{formatSGD(-totalExpenses, false)}</span>
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

        {/* Net Available */}
        <div
          style={{
            backgroundColor: '#f0fdfa',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'help',
            transition: 'border-color 0.2s ease, transform 0.2s ease'
          }}
          title="Net Liquid Balance: Live capital available in accounts ready for immediate runway allocation."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#115e59', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Net Available Balance
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#0d9488' }}>info</span>
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f766e' }}>{formatSGD(totalBalance)}</span>
          </div>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance_wallet</span>
          </div>
        </div>
      </div>
    </section>
  );
};
