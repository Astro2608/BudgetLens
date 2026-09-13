import React from 'react';
import { CategoryRunway } from '../types/finance';
import { formatSGD } from '../utils/financeCalculator';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-primary-border)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>hourglass_top</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Runway & Longevity Projection
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fef3c7'
                }}
              >
                Longevity Calculator
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              How long your money will last under regular recurring outlays
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
            SGD ${overallMonthlyBurn.toLocaleString()} / mo avg
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
            You have <strong style={{ color: 'var(--color-primary-hover)', fontWeight: 800 }}>{formatSGD(totalBalance)} left</strong> — this will last <strong style={{ textDecoration: 'underline', textDecorationColor: 'var(--color-primary)', fontWeight: 800 }}>approx. {overallRunwayMonths} months</strong> based on current monthly expense trends (avg SGD ${overallMonthlyBurn.toLocaleString()}/mo).
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Without future income injections, your liquidity reserve safely sustains essential living costs until mid-March next year.
          </p>
        </div>
      </div>

      {/* 5 Category Runway Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {categoryRunways.map((cat) => {
          let customPhrase = `With current balance, you have ${cat.remainingMonths} months worth of ${cat.label} ($${cat.monthlyBurn}/mo avg)`;
          if (cat.category === 'Rent') {
            customPhrase = `With current balance, you have ${cat.remainingMonths} months worth of Rent ($${cat.monthlyBurn.toLocaleString()}/mo)`;
          } else if (cat.category === 'Bills') {
            customPhrase = `With current balance, you have ${cat.remainingMonths} months worth of Bills ($${cat.monthlyBurn}/mo)`;
          } else if (cat.category === 'General') {
            customPhrase = `With current balance, you have ${cat.remainingMonths} months worth of General expenses ($${cat.monthlyBurn}/mo)`;
          }

          const progressPct = Math.min(100, Math.max(15, Math.round(cat.percentageOfSpend * 2.2)));

          return (
            <div
              key={cat.category}
              style={{
                backgroundColor: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.875rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.625rem',
                transition: 'background-color 150ms ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }}></span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{cat.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: `${cat.color}18`,
                    color: cat.color
                  }}
                >
                  ${cat.monthlyBurn}/mo
                </span>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {customPhrase}
              </p>

              <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: cat.color, borderRadius: '9999px' }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
