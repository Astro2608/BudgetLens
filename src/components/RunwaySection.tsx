import React from 'react';
import { CategoryRunway } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';

interface RunwaySectionProps {
  totalBalance: number;
  overallRunwayMonths: number;
  overallMonthlyBurn: number;
  categoryRunways: CategoryRunway[];
}

export const RunwaySection: React.FC<RunwaySectionProps> = ({
  totalBalance,
  overallRunwayMonths,
  overallMonthlyBurn,
  categoryRunways
}) => {
  const { formatCurrency, currencyInfo } = useCurrency();

  return (
    <section className="lumina-card" id="runway-section" style={{ gap: '1.25rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>timer</span>
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Category Runway Breakdown
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Detailed longevity projection for each essential category
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Overall Burn:</span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-main)',
              backgroundColor: 'var(--bg-canvas-subtle)',
              padding: '4px 10px',
              borderRadius: '8px'
            }}
          >
            {currencyInfo.prefix}{overallMonthlyBurn.toLocaleString()} / mo avg
          </span>
        </div>
      </div>

      {/* Top Banner */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(90deg, rgba(240, 253, 250, 0.9) 0%, rgba(255, 255, 255, 1) 50%, rgba(236, 253, 245, 0.8) 100%)',
          border: '1px solid var(--color-primary-border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.875rem'
        }}
      >
        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>
          tips_and_updates
        </span>
        <div>
          <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.4 }}>
            You have <strong style={{ color: 'var(--color-primary-hover)', fontWeight: 800 }}>{formatCurrency(totalBalance)} left</strong> — this will last <strong style={{ textDecoration: 'underline', textDecorationColor: 'var(--color-primary)', fontWeight: 800 }}>approx. {overallRunwayMonths} months</strong> based on current monthly expense trends (avg {currencyInfo.prefix}{overallMonthlyBurn.toLocaleString()}/mo).
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Without future income injections, your liquidity reserve safely sustains essential living costs until mid-March next year.
          </p>
        </div>
      </div>

      {/* 5 Category Runway Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {categoryRunways.map((cat) => {
          let customPhrase = `Your current balance covers ${cat.remainingMonths} months of ${cat.label} (${currencyInfo.prefix}${cat.monthlyBurn.toLocaleString()}/mo avg)`;

          return (
            <div
              key={cat.category}
              style={{
                backgroundColor: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'border-color 0.2s ease',
                cursor: 'help'
              }}
              title={customPhrase}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: `${cat.color}15`,
                      color: cat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{cat.icon}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{cat.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {cat.percentageOfSpend}% spend
                </span>
              </div>

              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: cat.color }}>
                  {cat.remainingMonths} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>months</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                  {currencyInfo.prefix}{cat.monthlyBurn.toLocaleString()} / mo avg
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
