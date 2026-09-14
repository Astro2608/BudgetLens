import React, { useState, useMemo } from 'react';
import { CategoryRunway } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';
import { SectionInfoButton } from './SectionInfoButton';

interface PredictiveRunwayWidgetProps {
  overallMonthlyBurn: number;
  totalBalance: number;
  overallRunwayMonths: number;
  categoryRunways: CategoryRunway[];
  hasMinimumData?: boolean;
  daysRecorded?: number;
}

export const PredictiveRunwayWidget: React.FC<PredictiveRunwayWidgetProps> = ({
  overallMonthlyBurn,
  totalBalance,
  overallRunwayMonths,
  categoryRunways,
  hasMinimumData = true
}) => {
  const { formatCurrency, currencyInfo } = useCurrency();
  const [sliderVal, setSliderVal] = useState<number>(2);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);

  // Simulation sensitivity multiplier
  const multiplier = useMemo(() => {
    if (sliderVal === 1) return 0.85; // Frugal: -15%
    if (sliderVal === 3) return 1.25; // High Outflow: +25%
    return 1.0; // Baseline: 0%
  }, [sliderVal]);

  const scenarioMeta = useMemo(() => {
    if (sliderVal === 1) {
      return {
        label: 'Frugal Pace (-15%)',
        badge: 'Frugal Mode (-15%)',
        color: '#10b981',
        bg: '#ecfdf5',
        border: '#a7f3d0',
        desc: 'Simulates 15% budget reduction in daily dining & non-essential living costs.'
      };
    }
    if (sliderVal === 3) {
      return {
        label: 'High Outflow (+25%)',
        badge: 'High Spending (+25%)',
        color: '#ef4444',
        bg: '#fff1f2',
        border: '#fecdd3',
        desc: 'Simulates unplanned emergency medical, vehicle maintenance, or travel expenses.'
      };
    }
    return {
      label: 'Current Baseline (100%)',
      badge: 'Standard Baseline',
      color: 'var(--color-primary)',
      bg: '#f0fdfa',
      border: 'var(--color-primary-border)',
      desc: 'Based on your actual historical monthly living spend.'
    };
  }, [sliderVal]);

  const simulatedMonthlyBurn = Math.round(overallMonthlyBurn * multiplier);

  const simulatedRunwayMonths = useMemo(() => {
    if (totalBalance <= 0) return 0;
    if (simulatedMonthlyBurn <= 0) return 999;
    return Number((totalBalance / simulatedMonthlyBurn).toFixed(1));
  }, [totalBalance, simulatedMonthlyBurn]);

  const runwayDelta = Number((simulatedRunwayMonths - overallRunwayMonths).toFixed(1));

  // Top spend categories sorted by spend
  const topCategories = useMemo(() => {
    return [...categoryRunways].sort((a, b) => b.monthlyBurn - a.monthlyBurn).slice(0, 4);
  }, [categoryRunways]);

  return (
    <section className="lumina-card" style={{ gap: '1.25rem' }}>
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
              backgroundColor: '#ecfdf5',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>insights</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Predictive Runway Simulator
              </h2>
              <SectionInfoButton
                title="Predictive Runway"
                description="Simulates how lifestyle adjustments (Frugal, Baseline, High Outflow) impact your bank account longevity."
                howItWorks="Scales your average monthly outflow by -15% or +25% to forecast future 30-day burn and calculate exact months of liquidity extension or reduction."
                example="Switching to Frugal Mode (-15%) immediately recalculates your projected next-month spend and shows how many extra months of runway you gain."
              />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Simulate how changes in living spend impact bank account longevity
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHelpGuide(!showHelpGuide)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-primary)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            {showHelpGuide ? 'visibility_off' : 'help_outline'}
          </span>
          <span>{showHelpGuide ? 'Hide' : 'Details'}</span>
        </button>
      </div>

      {/* Interactive Explanation Box */}
      {showHelpGuide && (
        <div
          style={{
            backgroundColor: 'var(--bg-canvas-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.875rem 1.125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            fontSize: '12.5px',
            color: 'var(--text-main)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--color-primary-hover)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>psychology</span>
            <span>Predictive Intelligence Breakdown:</span>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Adjust the spending slider below to simulate hypothetical spending habits. The widget re-calculates your estimated next-month outflow and projects how many months your remaining funds will sustain you.
          </p>
        </div>
      )}

      {/* Main Grid: Control Slider & KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {/* Slider Controls */}
        <div
          style={{
            backgroundColor: 'var(--bg-canvas-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Spending Stress-Test Slider
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: scenarioMeta.bg,
                color: scenarioMeta.color,
                border: `1px solid ${scenarioMeta.border}`
              }}
            >
              {scenarioMeta.badge}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="3"
            step="1"
            value={sliderVal}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: scenarioMeta.color }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
            <span style={{ color: sliderVal === 1 ? '#10b981' : 'inherit' }}>Frugal (-15%)</span>
            <span style={{ color: sliderVal === 2 ? 'var(--color-primary)' : 'inherit' }}>Baseline</span>
            <span style={{ color: sliderVal === 3 ? '#ef4444' : 'inherit' }}>High (+25%)</span>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
            {scenarioMeta.desc}
          </p>
        </div>

        {/* 2 Simulation KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Card A: Next Month Outflow */}
          <div
            style={{
              backgroundColor: 'var(--bg-canvas-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.875rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Next Month Outflow
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ~{formatCurrency(simulatedMonthlyBurn)}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>
              Projected cash out next 30 days
            </span>
          </div>

          {/* Card B: Projected Bank Lifespan */}
          <div
            style={{
              backgroundColor: scenarioMeta.bg,
              border: `1px solid ${scenarioMeta.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '0.875rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Bank Money Lifespan
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: scenarioMeta.color }}>
                {hasMinimumData ? `${simulatedRunwayMonths} Mo` : '-- Mo'}
              </span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: scenarioMeta.color }}>
              {!hasMinimumData
                ? 'Requires 30d data'
                : runwayDelta > 0
                ? `🎉 +${runwayDelta} Mo extended!`
                : runwayDelta < 0
                ? `⚠️ ${runwayDelta} Mo shorter`
                : 'Matches rolling baseline'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Categorical Next Month Spend Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingTop: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Estimated Next Month Spend by Category:
        </span>

        {topCategories.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Record expenses to generate category pace predictions.
          </div>
        ) : (
          topCategories.map((cat) => {
            const catMonthlyPace = Math.round(cat.monthlyBurn * multiplier);
            const barWidth = Math.min(100, Math.max(15, cat.percentageOfSpend));

            return (
              <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }}></span>
                    {cat.label}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    ~{currencyInfo.prefix}{catMonthlyPace.toLocaleString()}
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      backgroundColor: cat.color,
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
