import React, { useState, useMemo } from 'react';
import { Transaction, TimeframeFilter, ChartBucket, CategoryKey, CategoryConfig } from '../types/finance';
import { generateChartBuckets } from '../utils/financeCalculator';
import { DEFAULT_CATEGORY_CONFIGS } from '../config/categoryConfig';
import { useCurrency } from '../context/CurrencyContext';
import { SectionInfoButton } from './SectionInfoButton';

interface CashflowChartProps {
  transactions: Transaction[];
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
}

export const CashflowChart: React.FC<CashflowChartProps> = ({
  transactions,
  categoryConfigs = DEFAULT_CATEGORY_CONFIGS
}) => {
  const { formatCurrency } = useCurrency();
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('1M');
  const [activeBarIdx, setActiveBarIdx] = useState<number | null>(null);

  const formatScaleVal = (val: number) => {
    const abs = Math.abs(val);
    if (abs >= 1000000) return `${Math.round(abs / 1000000)}M`;
    if (abs >= 1000) return `${Math.round(abs / 1000)}k`;
    return `${Math.round(abs)}`;
  };

  // Generate dynamic buckets based on transactions, timeframe, and categoryConfigs
  const currentBuckets: ChartBucket[] = useMemo(
    () => generateChartBuckets(transactions, timeframe, categoryConfigs),
    [transactions, timeframe, categoryConfigs]
  );

  // Find max value for scaling (min 1 to avoid division by zero)
  const maxValue = useMemo(() => {
    if (currentBuckets.length === 0) return 1;
    const max = Math.max(
      ...currentBuckets.map((b) => Math.max(b.totalInflow, b.totalOutflow))
    );
    return max > 0 ? max : 1;
  }, [currentBuckets]);

  // Clean rounded scale max for gridlines (e.g., 2145 -> 2000 / 2k, 1100 -> 1000 / 1k)
  const scaleMax = useMemo(() => {
    if (maxValue <= 100) return 100;
    if (maxValue <= 500) return 500;
    if (maxValue <= 1000) return 1000;
    return Math.max(1000, Math.round(maxValue / 1000) * 1000);
  }, [maxValue]);

  const scaleHalf = Math.round(scaleMax / 2);
  // Full domain max ensures bars extend to their exact full height without clamping
  const domainMax = Math.max(scaleMax, maxValue);

  // Calculate Cumulative Spread (Net Income - Expenses over the period)
  const cumulativeSpread = useMemo(() => {
    const spread = currentBuckets.reduce(
      (sum, b) => sum + b.totalInflow - b.totalOutflow,
      0
    );
    return spread;
  }, [currentBuckets]);

  // Generate sharp linear background overlay data (Profit = Green, Deficit = Red)
  const overlayData = useMemo(() => {
    if (currentBuckets.length === 0) return null;
    const n = currentBuckets.length;
    const yZero = 120;
    const maxH = 95; // Bounded vertical amplitude

    const points: { x: number; y: number; netVal: number }[] = [];
    points.push({ x: 0, y: yZero, netVal: 0 });

    currentBuckets.forEach((b, i) => {
      const x = ((i + 0.5) / n) * 1000;
      const netVal = b.totalInflow - b.totalOutflow;
      const ratio = Math.min(1, Math.abs(netVal) / domainMax);
      const y = netVal >= 0 ? yZero - ratio * maxH : yZero + ratio * maxH;
      points.push({ x, y, netVal });
    });

    points.push({ x: 1000, y: yZero, netVal: 0 });

    const segments: {
      polygonPoints: string;
      linePoints: string;
      isProfit: boolean;
    }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (p1.y <= yZero && p2.y <= yZero) {
        segments.push({
          polygonPoints: `${p1.x},${yZero} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p2.x},${yZero}`,
          linePoints: `${p1.x},${p1.y} ${p2.x},${p2.y}`,
          isProfit: true
        });
      } else if (p1.y >= yZero && p2.y >= yZero) {
        segments.push({
          polygonPoints: `${p1.x},${yZero} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p2.x},${yZero}`,
          linePoints: `${p1.x},${p1.y} ${p2.x},${p2.y}`,
          isProfit: false
        });
      } else {
        const t = (yZero - p1.y) / (p2.y - p1.y);
        const xCross = p1.x + t * (p2.x - p1.x);

        segments.push({
          polygonPoints: `${p1.x},${yZero} ${p1.x},${p1.y} ${xCross},${yZero}`,
          linePoints: `${p1.x},${p1.y} ${xCross},${yZero}`,
          isProfit: p1.y < yZero
        });

        segments.push({
          polygonPoints: `${xCross},${yZero} ${p2.x},${p2.y} ${p2.x},${yZero}`,
          linePoints: `${xCross},${yZero} ${p2.x},${p2.y}`,
          isProfit: p2.y < yZero
        });
      }
    }

    const dataNodes = points.slice(1, -1);
    return { segments, dataNodes };
  }, [currentBuckets, domainMax]);

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
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Cash Flow Trend
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
            <SectionInfoButton
              title="Cash Flow Trend"
              description="Visualizes when and where money entered (+) vs where it left (-) across time."
              howItWorks="Top bars represent income/inflows. Bottom bars represent living expenses & fund allocations. The background shadow indicates whether your cumulative period was in Net Profit (green) or Deficit (red)."
              example="Click on any daily bar to open the Detailed Breakdown drawer and inspect the exact dollar amounts per category on that date."
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Money entered (+) vs money left (-) over time. Click any bar for detailed categorical breakdown.
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

      {/* Chart Canvas Box with Y-Axis and Dotted Gridlines */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#fafbfc',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1rem 2.25rem 1rem',
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
              Money In (+)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f43f5e' }}></span>
              Money Out (-)
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              • View: {timeframe === '1M' ? 'Daily' : timeframe === '3M' ? 'Weekly' : timeframe === '1Y' ? 'Monthly' : 'Overall'}
            </span>
          </div>
          <span style={{ color: cumulativeSpread >= 0 ? '#10b981' : '#f43f5e', fontWeight: 800 }}>
            Net Savings: {cumulativeSpread >= 0 ? '+' : '-'}{formatCurrency(Math.abs(cumulativeSpread))}
          </span>
        </div>

        {/* Main Chart Area (Y-Axis on Left + Bar Canvas on Right) */}
        <div style={{ display: 'flex', height: '240px', position: 'relative' }}>
          {/* Left Y-Axis Scale Column */}
          <div
            style={{
              width: '38px',
              height: '100%',
              position: 'relative',
              paddingRight: '8px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#64748b',
              userSelect: 'none',
              zIndex: 5
            }}
          >
            <span style={{ position: 'absolute', right: '8px', top: `${50 - (scaleMax / domainMax) * 50}%`, transform: 'translateY(-50%)', color: '#10b981' }}>
              +{formatScaleVal(scaleMax)}
            </span>
            <span style={{ position: 'absolute', right: '8px', top: `${50 - (scaleHalf / domainMax) * 50}%`, transform: 'translateY(-50%)' }}>
              +{formatScaleVal(scaleHalf)}
            </span>
            <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-main)' }}>
              0
            </span>
            <span style={{ position: 'absolute', right: '8px', top: `${50 + (scaleHalf / domainMax) * 50}%`, transform: 'translateY(-50%)' }}>
              -{formatScaleVal(scaleHalf)}
            </span>
            <span style={{ position: 'absolute', right: '8px', top: `${50 + (scaleMax / domainMax) * 50}%`, transform: 'translateY(-50%)', color: '#f43f5e' }}>
              -{formatScaleVal(scaleMax)}
            </span>
          </div>

          {/* Right Bar Canvas with Dotted Guidelines */}
          <div
            id="chart-canvas"
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.375rem',
              position: 'relative'
            }}
          >
            {/* Horizontal Dotted Gridlines at scale positions */}
            <div style={{ position: 'absolute', inset: 'auto 0', top: `${50 - (scaleMax / domainMax) * 50}%`, borderBottom: '1px dotted rgba(203, 213, 225, 0.85)', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', inset: 'auto 0', top: `${50 - (scaleHalf / domainMax) * 50}%`, borderBottom: '1px dotted rgba(203, 213, 225, 0.85)', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', inset: 'auto 0', top: '50%', borderBottom: '2px solid #cbd5e1', zIndex: 1 }}></div>
            <div style={{ position: 'absolute', inset: 'auto 0', top: `${50 + (scaleHalf / domainMax) * 50}%`, borderBottom: '1px dotted rgba(203, 213, 225, 0.85)', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', inset: 'auto 0', top: `${50 + (scaleMax / domainMax) * 50}%`, borderBottom: '1px dotted rgba(203, 213, 225, 0.85)', zIndex: 0 }}></div>

            {/* Background Linear Profit/Deficit Overlay Graph */}
            {overlayData && (
              <svg
                viewBox="0 0 1000 240"
                preserveAspectRatio="none"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 0,
                  opacity: 0.30
                }}
              >
                <defs>
                  <linearGradient id="overlayProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
                  </linearGradient>
                  <linearGradient id="overlayDeficitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.85" />
                  </linearGradient>
                </defs>

                {/* Shaded Area Polygons */}
                {overlayData.segments.map((seg, sIdx) => (
                  <polygon
                    key={`poly-${sIdx}`}
                    points={seg.polygonPoints}
                    fill={seg.isProfit ? 'url(#overlayProfitGrad)' : 'url(#overlayDeficitGrad)'}
                  />
                ))}

                {/* Linear Sharp Trend Line */}
                {overlayData.segments.map((seg, sIdx) => (
                  <polyline
                    key={`line-${sIdx}`}
                    points={seg.linePoints}
                    fill="none"
                    stroke={seg.isProfit ? '#10b981' : '#ef4444'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="miter"
                  />
                ))}

                {/* Data Node Dots */}
                {overlayData.dataNodes.map((node, nIdx) => (
                  <circle
                    key={`node-${nIdx}`}
                    cx={node.x}
                    cy={node.y}
                    r="3.5"
                    fill={node.netVal >= 0 ? '#10b981' : '#ef4444'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            )}

            {currentBuckets.map((bucket, idx) => {
              const isActive = activeBarIdx === idx;
              const inflowPxPct = (bucket.totalInflow / domainMax) * 100;
              const outflowPxPct = (bucket.totalOutflow / domainMax) * 100;
              const hasActivity = bucket.totalInflow > 0 || bucket.totalOutflow > 0;

              // Parse stacked date (day + month)
              const parts = bucket.label.split(' ');
              const dayText = parts[0] || '';
              const monthText = parts[1] || '';
              
              // Intelligent spacing interval for 30 daily bars
              const showLabel = currentBuckets.length <= 15 || idx % 2 === 0 || idx === currentBuckets.length - 1 || isActive;

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
                              borderTopLeftRadius: cIdx === 0 ? 'var(--radius-xs)' : '0',
                              borderTopRightRadius: cIdx === 0 ? 'var(--radius-xs)' : '0',
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
                              borderBottomLeftRadius: cIdx === arr.length - 1 ? 'var(--radius-xs)' : '0',
                              borderBottomRightRadius: cIdx === arr.length - 1 ? 'var(--radius-xs)' : '0',
                              borderBottom: cIdx < arr.length - 1 ? '1px solid rgba(255,255,255,0.25)' : 'none'
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stacked X-Axis Date Label (Day on top, Month below) */}
                  {showLabel && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-32px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        lineHeight: 1.15,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: isActive ? 800 : hasActivity ? 700 : 500,
                          color: isActive ? 'var(--color-primary)' : hasActivity ? 'var(--text-main)' : 'var(--text-muted)'
                        }}
                      >
                        {dayText}
                      </span>
                      {monthText && (
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: 600,
                            color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                            textTransform: 'uppercase'
                          }}
                        >
                          {monthText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
                  +{formatCurrency(activeBucket.totalInflow)}
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
                        +{formatCurrency(cat.amount)}
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
                  -{formatCurrency(activeBucket.totalOutflow)}
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
                        -{formatCurrency(cat.amount)}
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
