import React from 'react';
import { CategoryRunway } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';
import { SectionInfoButton } from './SectionInfoButton';

interface RunwaySectionProps {
  totalBalance: number;
  overallRunwayMonths: number;
  overallMonthlyBurn: number;
  categoryRunways: CategoryRunway[];
  hasMinimumData?: boolean;
  daysRecorded?: number;
}

export const RunwaySection: React.FC<RunwaySectionProps> = ({
  totalBalance,
  overallMonthlyBurn,
  categoryRunways,
  hasMinimumData = true,
  daysRecorded = 0
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
              backgroundColor: hasMinimumData ? 'var(--color-primary-light)' : '#f1f5f9',
              color: hasMinimumData ? 'var(--color-primary)' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>timer</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Category Runway Breakdown
              </h2>
              {!hasMinimumData && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a'
                  }}
                >
                  Requires ≥ 1 Month Data ({daysRecorded}/30 Days)
                </span>
              )}
              <SectionInfoButton
                title="Category Runway"
                description="Projects how many months your available bank balance will last if dedicated to specific essential spending categories."
                howItWorks="Divides your Current Net Balance by each category's Average Monthly Spend rate (Formula: Balance ÷ Monthly Category Burn Rate)."
                example={`With ${formatCurrency(totalBalance)} in your account and ${currencyInfo.prefix}90/mo average Transport spend, your transport runway is ~${(totalBalance / 90).toFixed(1)} months.`}
              />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Longevity projection based on historical average monthly burn rate
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Overall Burn:</span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: hasMinimumData ? 'var(--text-main)' : 'var(--text-muted)',
              backgroundColor: 'var(--bg-canvas-subtle)',
              padding: '4px 10px',
              borderRadius: '8px'
            }}
          >
            {hasMinimumData ? `${currencyInfo.prefix}${overallMonthlyBurn.toLocaleString()} / mo avg` : '-- / mo'}
          </span>
        </div>
      </div>

      {/* Minimum Data Warning Banner (Only shown when < 30 days) */}
      {!hasMinimumData && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.875rem'
          }}
        >
          <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>
            hourglass_empty
          </span>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#92400e', margin: 0 }}>
              Feature requires minimum 1 month (30 days) of transaction data to be helpful
            </h4>
            <p style={{ fontSize: '12px', color: '#b45309', marginTop: '4px', lineHeight: 1.4 }}>
              Your ledger currently spans <strong>{daysRecorded} day(s)</strong>. To calculate statistically sound monthly burn rates and avoid skewed projections, longevity forecasts will automatically unlock once at least 30 days of data is recorded.
            </p>
            <p style={{ fontSize: '11px', color: '#92400e', marginTop: '6px', fontWeight: 600 }}>
              💡 <em>Formula: Runway (Months) = Total Liquid Balance ÷ Historical Monthly Spend</em>
            </p>
          </div>
        </div>
      )}

      {/* Category Runway Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          opacity: hasMinimumData ? 1 : 0.45,
          filter: hasMinimumData ? 'none' : 'grayscale(35%)',
          pointerEvents: hasMinimumData ? 'auto' : 'none'
        }}
      >
        {categoryRunways.map((cat) => {
          let customPhrase = hasMinimumData
            ? `Your current balance covers ${cat.remainingMonths} months of ${cat.label} (${currencyInfo.prefix}${cat.monthlyBurn.toLocaleString()}/mo avg)`
            : 'Requires at least 1 month of ledger data';

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
                cursor: hasMinimumData ? 'help' : 'default'
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
                  {hasMinimumData ? `${cat.percentageOfSpend}% spend` : '--'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: hasMinimumData ? cat.color : 'var(--text-muted)' }}>
                  {hasMinimumData ? cat.remainingMonths : '--'}{' '}
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>months</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                  {hasMinimumData ? `${currencyInfo.prefix}${cat.monthlyBurn.toLocaleString()} / mo avg` : 'Requires 1 mo data'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
