import React, { useState } from 'react';

export const PredictiveRunwayWidget: React.FC = () => {
  const [sliderVal, setSliderVal] = useState<number>(2);

  const getSensitivityLabel = (val: number) => {
    if (val === 1) return 'Lean (-15%)';
    if (val === 2) return 'Moderate (Baseline)';
    return 'Cautious (+25%)';
  };

  const getEstimatedOutflow = (val: number) => {
    if (val === 1) return '~$295.00';
    if (val === 2) return '~$345.00';
    return '~$430.00';
  };

  return (
    <div
      className="lumina-card"
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>psychology</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Predictive Runway</h3>
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
          Rolling 3-Mo
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Next 7 days anticipated automated outflows:
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: '4px' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {getEstimatedOutflow(sliderVal)}
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
            97% Confidence
          </span>
        </div>
      </div>

      {/* Simulation Slider */}
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
          <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{getSensitivityLabel(sliderVal)}</span>
        </div>

        <input
          type="range"
          min="1"
          max="3"
          step="1"
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'var(--text-subtle)' }}>
          <span>Lean</span>
          <span>Baseline</span>
          <span>Cautious</span>
        </div>
      </div>

      {/* Visual Predictions Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
              Dining Out Expectation
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>~$280.00</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: '75%', height: '100%', backgroundColor: '#f59e0b', borderRadius: '9999px' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
              Regular Utility Auto-Debit
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>~$65.00</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: '25%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '9999px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
