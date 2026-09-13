import React, { useState, useMemo } from 'react';
import { CategoryRunway } from '../types/finance';
import { formatSGD } from '../utils/financeCalculator';

interface PredictiveRunwayWidgetProps {
  overallMonthlyBurn: number;
  totalBalance: number;
  overallRunwayMonths: number;
  categoryRunways: CategoryRunway[];
}

export const PredictiveRunwayWidget: React.FC<PredictiveRunwayWidgetProps> = ({
  overallMonthlyBurn,
  totalBalance,
  overallRunwayMonths,
  categoryRunways
}) => {
  const [sliderVal, setSliderVal] = useState<number>(2);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(true);

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
        desc: 'Tightening your belt saves cash & extends your bank lifespan.'
      };
    }
    if (sliderVal === 3) {
      return {
        label: 'High Spend (+25%)',
        badge: 'High Outflow (+25%)',
        color: '#f43f5e',
        bg: '#fff1f2',
        border: '#fecdd3',
        desc: 'Unplanned expenses or splurges accelerate cash drain.'
      };
    }
    return {
      label: 'Normal Pace (Baseline)',
      badge: 'Normal Pace',
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-light)',
      border: 'var(--color-primary-border)',
      desc: 'Based on your actual historical average monthly spend.'
    };
  }, [sliderVal]);

  // Dynamic 7-day outflow
  const baselineWeeklyBurn = overallMonthlyBurn > 0 ? overallMonthlyBurn / 4.33 : 0;
  const anticipatedWeeklyOutflow = Math.round(baselineWeeklyBurn * multiplier);

  // Simulated runway months
  const simulatedRunwayMonths = useMemo(() => {
    const adjustedBurn = overallMonthlyBurn * multiplier;
    if (adjustedBurn > 0 && totalBalance > 0) {
      return Number((totalBalance / adjustedBurn).toFixed(1));
    }
    return overallRunwayMonths;
  }, [overallMonthlyBurn, totalBalance, multiplier, overallRunwayMonths]);

  // Difference in months compared to baseline
  const runwayDelta = Number((simulatedRunwayMonths - overallRunwayMonths).toFixed(1));

  // Top spending categories to display
  const topCategories = useMemo(() => {
    return [...categoryRunways]
      .filter((c) => c.monthlyBurn > 0)
      .sort((a, b) => b.monthlyBurn - a.monthlyBurn)
      .slice(0, 3);
  }, [categoryRunways]);

  return (
    <div
      className="lumina-card"
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        gap: '1.125rem'
      }}
    >
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              justifyContent: 'center',
              border: '1px solid var(--color-primary-border)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>psychology</span>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              "What-If" Spending Simulator
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              Test how spending changes affect your bank lifespan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHelpGuide((prev) => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}
          title="Toggle how to use guide"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>help_outline</span>
          <span>{showHelpGuide ? 'Hide Guide' : 'How to use'}</span>
        </button>
      </div>

      {/* 2. First-Time User Interactive Guide Banner */}
      {showHelpGuide && (
        <div
          style={{
            padding: '0.75rem 0.875rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(238, 242, 255, 0.7)',
            border: '1px solid #c7d2fe',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <span className="material-symbols-outlined" style={{ color: '#4f46e5', fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>
            lightbulb
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11.5px', color: '#3730a3', lineHeight: 1.45 }}>
            <strong>How to read this tool:</strong>
            <span>
              <strong>Example:</strong> Drag the scenario slider below to <em>"Frugal (-15%)"</em>. You will immediately see how cutting 15% of your weekly spending extends your bank account's total lifespan by extra months!
            </span>
          </div>
        </div>
      )}

      {/* 3. STEP 1: Scenario Selector */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.875rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Step 1: Choose Scenario
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: scenarioMeta.bg,
              color: scenarioMeta.color,
              border: `1px solid ${scenarioMeta.border}`
            }}
          >
            {scenarioMeta.label}
          </span>
        </div>

        {/* 3 Preset Scenario Buttons for Instant Visual Clarity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {[
            { val: 1, label: 'Frugal', sub: '-15%', color: '#10b981' },
            { val: 2, label: 'Normal', sub: 'Baseline', color: 'var(--color-primary)' },
            { val: 3, label: 'High Spend', sub: '+25%', color: '#f43f5e' }
          ].map((scen) => (
            <button
              key={scen.val}
              type="button"
              onClick={() => setSliderVal(scen.val)}
              style={{
                padding: '6px 4px',
                borderRadius: '8px',
                border: sliderVal === scen.val ? `2px solid ${scen.color}` : '1px solid var(--border-subtle)',
                backgroundColor: sliderVal === scen.val ? 'var(--bg-canvas-subtle)' : '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: sliderVal === scen.val ? 800 : 600, color: sliderVal === scen.val ? scen.color : 'var(--text-main)' }}>
                {scen.label}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>{scen.sub}</span>
            </button>
          ))}
        </div>

        {/* Range Slider Track */}
        <input
          type="range"
          min="1"
          max="3"
          step="1"
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          style={{ width: '100%', accentColor: scenarioMeta.color, cursor: 'pointer', marginTop: '2px' }}
        />
      </div>

      {/* 4. STEP 2: Dual Impact Outcome Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Step 2: Simulated Impact Outcomes
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          {/* Card A: Next 7 Days Cash Needed */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.875rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Next 7-Day Outflow
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ~{formatSGD(anticipatedWeeklyOutflow)}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>
              Cash leaving bank next week
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
                {simulatedRunwayMonths} Mo
              </span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: scenarioMeta.color }}>
              {runwayDelta > 0
                ? `🎉 +${runwayDelta} Mo extended!`
                : runwayDelta < 0
                ? `⚠️ ${runwayDelta} Mo shorter`
                : 'Matches rolling baseline'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Categorical Next Week Spend Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingTop: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Estimated Next Week Spend by Category:
        </span>

        {topCategories.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Record expenses to generate category pace predictions.
          </div>
        ) : (
          topCategories.map((cat) => {
            const catWeeklyPace = Math.round((cat.monthlyBurn / 4.33) * multiplier);
            const barWidth = Math.min(100, Math.max(15, cat.percentageOfSpend));

            return (
              <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }}></span>
                    {cat.label}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    ~SGD ${catWeeklyPace.toLocaleString()}
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
    </div>
  );
};
