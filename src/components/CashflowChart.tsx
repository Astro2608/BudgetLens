import React, { useState, useMemo } from 'react';
import { Transaction, TimeframeFilter, ChartBucket } from '../types/finance';
import { generateChartBuckets, formatSGD } from '../utils/financeCalculator';

interface CashflowChartProps {
  transactions: Transaction[];
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ transactions }) => {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('1M');
  const [activeBarIdx, setActiveBarIdx] = useState<number | null>(null);

  // Generate dynamic buckets based on transactions and timeframe
  const currentBuckets: ChartBucket[] = useMemo(
    () => generateChartBuckets(transactions, timeframe),
    [transactions, timeframe]
  );

  // Find max value for scaling (min 1 to avoid division by zero)
  const maxValue = useMemo(() => {
    if (currentBuckets.length === 0) return 1;
    const max = Math.max(
      ...currentBuckets.map((b) => Math.max(b.totalInflow, b.totalOutflow))
    );
    return max > 0 ? max : 1;
  }, [currentBuckets]);

  // Calculate Cumulative Spread (Net Income - Expenses over the period)
  const cumulativeSpread = useMemo(() => {
    const spread = currentBuckets.reduce(
      (sum, b) => sum + b.totalInflow - b.totalOutflow,
      0
    );
    return spread;
  }, [currentBuckets]);

  const activeBucket = activeBarIdx !== null ? currentBuckets[activeBarIdx] : null;

  return (
    <div className="lumina-card" id="analytics-section">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Cash In / Out Flow Analysis
            </h2>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary-hover)',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              Smart Stacked View
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Where money entered (+) vs where it left (-) across timelines. Click any bar for detailed categorical breakdown.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="tab-toggle-group">
          {(['1M', '3M', '1Y', 'ALL'] as TimeframeFilter[]).map((tf) => (
            <button
              key={tf}
              className={`tab-toggle-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => {
                setTimeframe(tf);
                setActiveBarIdx(null); // Reset open popups on timeframe change
              }}
            >
              {tf === '1M' ? '1 Month' : tf === '3M' ? '3 Months' : tf === '1Y' ? '1 Year' : 'Overall'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Box */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#fafbfc',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1rem 1.5rem 1rem',
          marginTop: '1rem'
        }}
      >
        {/* Top Status & Legend Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-subtle)',
            marginBottom: '1rem',
            paddingBottom: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f97316' }}></span>
              + Inflow (Top)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f43f5e' }}></span>
              - Outflow (Bottom)
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              • {currentBuckets.length} Time Bins ({timeframe === '1M' ? '2 Days / Bar' : timeframe === '3M' ? '1 Week / Bar' : timeframe === '1Y' ? '1 Month / Bar' : '1 Year / Bar'})
            </span>
          </div>
          <span style={{ color: cumulativeSpread >= 0 ? '#10b981' : '#f43f5e', fontWeight: 800 }}>
            Cumulative Period Spread: {cumulativeSpread >= 0 ? '+' : '-'}{formatSGD(Math.abs(cumulativeSpread))}
          </span>
        </div>

        {/* Bar Container */}
        <div
          id="chart-canvas"
          style={{
            height: '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.375rem',
            position: 'relative',
            padding: '20px 0'
          }}
        >
          {/* Middle Zero Line */}
          <div style={{ position: 'absolute', inset: 'auto 0', top: '50%', borderBottom: '2px solid #cbd5e1', zIndex: 1 }}></div>
          {/* Top/Bottom Reference Lines */}
          <div style={{ position: 'absolute', inset: 'auto 0', top: '15%', borderBottom: '1px dashed #e2e8f0', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', inset: 'auto 0', bottom: '15%', borderBottom: '1px dashed #e2e8f0', zIndex: 0 }}></div>

          {currentBuckets.map((bucket, idx) => {
            const isActive = activeBarIdx === idx;
            const inflowPxPct = (bucket.totalInflow / maxValue) * 100;
            const outflowPxPct = (bucket.totalOutflow / maxValue) * 100;
            const hasActivity = bucket.totalInflow > 0 || bucket.totalOutflow > 0;

            return (
              <div
                key={bucket.label + idx}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  zIndex: isActive ? 20 : 10,
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  backgroundColor: isActive ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
                onClick={() => {
                  setActiveBarIdx(isActive ? null : idx);
                }}
                title={`Click to expand breakdown for ${bucket.label} (${bucket.startDate})`}
              >
                {/* Active Indicator Arrow */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      color: 'var(--color-primary)',
                      fontSize: '12px',
                      fontWeight: 800,
                      animation: 'bounce 1s infinite'
                    }}
                  >
                    ▼
                  </div>
                )}

                {/* Top Half: Inflow Stack */}
                <div
                  style={{
                    height: '50%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '70%',
                      maxWidth: '32px',
                      height: `${inflowPxPct}%`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      transition: 'all 200ms ease',
                      filter: isActive ? 'brightness(1.1) drop-shadow(0 0 3px rgba(13, 148, 136, 0.4))' : 'none'
                    }}
                  >
                    {[...bucket.inflowCategories].reverse().map((cat, cIdx) => {
                      const hPct = (cat.amount / bucket.totalInflow) * 100;
                      return (
                        <div
                          key={cIdx}
                          style={{
                            width: '100%',
                            height: `${hPct}%`,
                            backgroundColor: cat.color,
                            borderTopLeftRadius: cIdx === 0 ? '4px' : '0',
                            borderTopRightRadius: cIdx === 0 ? '4px' : '0',
                            borderTop: cIdx > 0 ? '1px solid rgba(255,255,255,0.25)' : 'none'
                          }}
                        ></div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Half: Outflow Stack */}
                <div
                  style={{
                    height: '50%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '70%',
                      maxWidth: '32px',
                      height: `${outflowPxPct}%`,
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 200ms ease',
                      filter: isActive ? 'brightness(1.1) drop-shadow(0 0 3px rgba(13, 148, 136, 0.4))' : 'none'
                    }}
                  >
                    {bucket.outflowCategories.map((cat, cIdx, arr) => {
                      const hPct = (cat.amount / bucket.totalOutflow) * 100;
                      return (
                        <div
                          key={cIdx}
                          style={{
                            width: '100%',
                            height: `${hPct}%`,
                            backgroundColor: cat.color,
                            borderBottomLeftRadius: cIdx === arr.length - 1 ? '4px' : '0',
                            borderBottomRightRadius: cIdx === arr.length - 1 ? '4px' : '0',
                            borderBottom: cIdx < arr.length - 1 ? '1px solid rgba(255,255,255,0.25)' : 'none'
                          }}
                        ></div>
                      );
                    })}
                  </div>
                </div>

                {/* X-Axis Label */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-22px',
                    fontSize: '10px',
                    fontWeight: isActive ? 800 : hasActivity ? 600 : 500,
                    color: isActive ? 'var(--color-primary)' : hasActivity ? 'var(--text-main)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    maxWidth: '100%',
                    textAlign: 'center'
                  }}
                >
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Dedicated Expandable Breakdown Section (shown when activeBarIdx is selected) */}
      {activeBucket && (
        <div
          style={{
            marginTop: '1rem',
            backgroundColor: '#ffffff',
            border: '1.5px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: '0 4px 20px -2px rgba(13, 148, 136, 0.12)',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '22px' }}>
                analytics
              </span>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Detailed Breakdown: {activeBucket.label} ({activeBucket.startDate} to {activeBucket.endDate})
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Selected Time Bucket Categorical Analytics
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setActiveBarIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              <span>Close Breakdown</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Inflows Card */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  + Total Inflow
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>
                  +{formatSGD(activeBucket.totalInflow)}
                </span>
              </div>

              {activeBucket.inflowCategories.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeBucket.inflowCategories.map((cat, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: cat.color }}></span>
                        {cat.category}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>
                        +{formatSGD(cat.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#86efac', fontStyle: 'italic', padding: '4px 0' }}>
                  No incoming cash recorded in this window.
                </div>
              )}
            </div>

            {/* Outflows Card */}
            <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  - Total Outflow
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#be123c' }}>
                  -{formatSGD(activeBucket.totalOutflow)}
                </span>
              </div>

              {activeBucket.outflowCategories.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeBucket.outflowCategories.map((cat, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #ffe4e6' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: cat.color }}></span>
                        {cat.category}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#e11d48' }}>
                        -{formatSGD(cat.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#fda4af', fontStyle: 'italic', padding: '4px 0' }}>
                  No outflows or expenses recorded in this window.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
