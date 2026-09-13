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

  // Simulation sensitivity multiplier
  const multiplier = useMemo(() => {
    if (sliderVal === 1) return 0.85; // Lean: -15%
    if (sliderVal === 3) return 1.25; // Cautious: +25%
    return 1.0; // Baseline: 0%
  }, [sliderVal]);

  const sensitivityInfo = useMemo(() => {
    if (sliderVal === 1) return { label: 'Lean (-15%)', color: '#10b981', badge: 'Runway Extended' };
    if (sliderVal === 3) return { label: 'Cautious (+25%)', color: '#f43f5e', badge: 'Runway Reduced' };
    return { label: 'Moderate (Baseline)', color: 'var(--color-primary)', badge: 'Rolling Baseline' };
  }, [sliderVal]);

  // Dynamic anticipated 7-day outflow based on live burn rate
  const baselineWeeklyBurn = overallMonthlyBurn > 0 ? overallMonthlyBurn / 4.33 : 0;
  const anticipatedWeeklyOutflow = Math.round(baselineWeeklyBurn * multiplier);

  // Simulated runway months under this scenario
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
        gap: '1rem'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>
            psychology
          </span>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Predictive Runway
          </h3>
        </div>
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
          {sensitivityInfo.badge}
        </span>
      </div>

      {/* Main KPI: Anticipated 7-day Outflow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Next 7 days anticipated automated outflows:
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: '4px' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            ~{formatSGD(anticipatedWeeklyOutflow)}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary-hover)',
              border: '1px solid var(--color-primary-border)'
            }}
          >
            Runway: {simulatedRunwayMonths} Mo
            {runwayDelta !== 0 && (
              <span style={{ marginLeft: '4px', color: runwayDelta > 0 ? '#10b981' : '#f43f5e', fontWeight: 800 }}>
                ({runwayDelta > 0 ? `+${runwayDelta}` : runwayDelta} mo)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Interactive Simulation Slider */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Simulation Sensitivity</span>
          <span style={{ fontWeight: 800, color: sensitivityInfo.color }}>
            {sensitivityInfo.label}
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="3"
          step="1"
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
          title="Adjust outflow pace simulation"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'var(--text-subtle)' }}>
          <span>Lean (-15%)</span>
          <span>Baseline</span>
          <span>Cautious (+25%)</span>
        </div>
      </div>

      {/* Live Category Outflow Expectations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          Anticipated Categorical Pace (7-Day Avg):
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
              <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }}></span>
                    {cat.label}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    ~SGD ${catWeeklyPace.toLocaleString()}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
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
