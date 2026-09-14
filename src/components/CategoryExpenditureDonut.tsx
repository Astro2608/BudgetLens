import React, { useState, useMemo } from 'react';
import { Transaction, CategoryConfig, CategoryKey } from '../types/finance';
import { DEFAULT_CATEGORY_CONFIGS, getCategoryConfig } from '../config/categoryConfig';
import { useCurrency } from '../context/CurrencyContext';
import { SectionInfoButton } from './SectionInfoButton';

interface CategoryExpenditureDonutProps {
  transactions: Transaction[];
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
}

type TimeframeOption = 'month' | 'year' | 'all';
type ViewTabOption = 'outflows' | 'inflows';

export const CategoryExpenditureDonut: React.FC<CategoryExpenditureDonutProps> = ({
  transactions,
  categoryConfigs = DEFAULT_CATEGORY_CONFIGS
}) => {
  const { formatCurrency, currencyInfo } = useCurrency();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('month');
  const [activeTab, setActiveTab] = useState<ViewTabOption>('outflows');
  const [hoveredCategory, setHoveredCategory] = useState<{ ring: 'outer' | 'inner'; key: string } | null>(null);

  // Determine current month/year reference
  const now = new Date();
  const currentYearStr = `${now.getFullYear()}`;
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Previous month string
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Previous year string
  const prevYearStr = `${now.getFullYear() - 1}`;

  // 1. Filter for living expenses and allocations (OUTER RING)
  const expenseData = useMemo(() => {
    const allExpenseTxs = transactions.filter(
      (t) => (t.type === 'expense' || t.type === 'savings' || t.category === 'Savings') && t.type !== 'income'
    );

    const filteredTxs = allExpenseTxs.filter((t) => {
      if (timeframe === 'month') return t.date.startsWith(currentMonthStr);
      if (timeframe === 'year') return t.date.startsWith(currentYearStr);
      return true;
    });

    const categoryTotals: Record<string, number> = {};
    let totalOutflows = 0;

    filteredTxs.forEach((t) => {
      const amt = Math.abs(Number(t.amount)) || 0;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
      totalOutflows += amt;
    });

    const items = Object.entries(categoryTotals)
      .map(([catKey, amount]) => {
        const config = getCategoryConfig(catKey, categoryConfigs);
        const percentage = totalOutflows > 0 ? (amount / totalOutflows) * 100 : 0;
        return {
          key: catKey,
          label: config.label,
          color: config.color,
          icon: config.icon,
          amount,
          percentage: Number(percentage.toFixed(1))
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Prior period comparisons
    let priorTotal = 0;
    let priorLabel = '';

    if (timeframe === 'month') {
      const prevMonthTxs = allExpenseTxs.filter((t) => t.date.startsWith(prevMonthStr));
      priorTotal = prevMonthTxs.reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);
      priorLabel = 'last month';
    } else if (timeframe === 'year') {
      const prevYearTxs = allExpenseTxs.filter((t) => t.date.startsWith(prevYearStr));
      priorTotal = prevYearTxs.reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);
      priorLabel = 'last year';
    }

    return {
      items,
      totalOutflows,
      categoriesCount: items.length,
      priorTotal,
      priorLabel
    };
  }, [transactions, categoryConfigs, timeframe, currentMonthStr, currentYearStr, prevMonthStr, prevYearStr]);

  // 2. Filter for Income Streams (INNER RING)
  const incomeData = useMemo(() => {
    const allIncomeTxs = transactions.filter((t) => t.type === 'income');

    const filteredTxs = allIncomeTxs.filter((t) => {
      if (timeframe === 'month') return t.date.startsWith(currentMonthStr);
      if (timeframe === 'year') return t.date.startsWith(currentYearStr);
      return true;
    });

    const categoryTotals: Record<string, number> = {};
    let totalInflows = 0;

    filteredTxs.forEach((t) => {
      const amt = Math.abs(Number(t.amount)) || 0;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
      totalInflows += amt;
    });

    const items = Object.entries(categoryTotals)
      .map(([catKey, amount]) => {
        const config = getCategoryConfig(catKey, categoryConfigs);
        const percentage = totalInflows > 0 ? (amount / totalInflows) * 100 : 0;
        return {
          key: catKey,
          label: config.label,
          color: config.color,
          icon: config.icon,
          amount,
          percentage: Number(percentage.toFixed(1))
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      items,
      totalInflows,
      categoriesCount: items.length
    };
  }, [transactions, categoryConfigs, timeframe, currentMonthStr, currentYearStr]);

  // Double-Donut Concentric Geometry (Scaled up & 2x thicker)
  const center = 170;

  // Outer Ring: Outflows (Twice as thick: 30px)
  const radiusOuter = 138;
  const strokeOuter = 30;
  const circumferenceOuter = 2 * Math.PI * radiusOuter;

  let cumulativePercentOuter = 0;
  const outerSlices = expenseData.items.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumferenceOuter} ${circumferenceOuter}`;
    const strokeDashoffset = -((cumulativePercentOuter / 100) * circumferenceOuter);
    cumulativePercentOuter += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  // Inner Ring: Inflows (Twice as thick: 26px)
  const radiusInner = 104;
  const strokeInner = 26;
  const circumferenceInner = 2 * Math.PI * radiusInner;

  let cumulativePercentInner = 0;
  const innerSlices = incomeData.items.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumferenceInner} ${circumferenceInner}`;
    const strokeDashoffset = -((cumulativePercentInner / 100) * circumferenceInner);
    cumulativePercentInner += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  // Calculate comparison metrics for outflows
  const comparison = useMemo(() => {
    if (expenseData.priorTotal <= 0) return null;
    const diff = expenseData.totalOutflows - expenseData.priorTotal;
    const pct = Math.round((Math.abs(diff) / expenseData.priorTotal) * 100);

    if (diff < 0) {
      return {
        type: 'saved',
        text: `📉 -${formatCurrency(Math.abs(diff))} (-${pct}%) vs ${expenseData.priorLabel} (Saved more)`,
        bg: '#ecfdf5',
        color: '#047857',
        border: '#a7f3d0'
      };
    } else if (diff > 0) {
      return {
        type: 'spent_more',
        text: `📈 +${formatCurrency(diff)} (+${pct}%) vs ${expenseData.priorLabel}`,
        bg: '#fff1f2',
        color: '#be123c',
        border: '#fecdd3'
      };
    } else {
      return {
        type: 'equal',
        text: `● Matches ${expenseData.priorLabel} spend`,
        bg: '#f8fafc',
        color: '#64748b',
        border: '#e2e8f0'
      };
    }
  }, [expenseData.totalOutflows, expenseData.priorTotal, expenseData.priorLabel, formatCurrency]);

  const netSurplus = incomeData.totalInflows - expenseData.totalOutflows;

  return (
    <div className="lumina-card" style={{ gap: '1.25rem' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)'
            }}
          >
            Dual-Tier Flow Composition
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Cash Flow & Expenditure Donut
            </h3>
            <SectionInfoButton
              title="Dual-Donut Cashflow Ring"
              description="A multi-tier concentric visualization comparing Income (Inner Ring) against Outflows & Allocations (Outer Ring)."
              howItWorks="The Inner Ring visualizes all incoming revenue streams (Salary, Freelance, etc.). The Outer Ring maps all expenses and savings allocations. Hover over any ring segment to see exact dollar breakdowns and percentages."
              example="Inner Ring shows SGD $2,145.60 Income (100%), while Outer Ring breaks down your $1,905.00 spend across Bills, Food, Transport, and Savings."
            />
          </div>
        </div>

        {/* Header Right Actions: Timeframe Pills & Total Outflow Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          {/* Timeframe Toggle Pills */}
          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {[
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeframe(tab.id as TimeframeOption)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: timeframe === tab.id ? 800 : 600,
                  backgroundColor: timeframe === tab.id ? '#ffffff' : 'transparent',
                  color: timeframe === tab.id ? 'var(--color-primary-hover)' : 'var(--text-muted)',
                  boxShadow: timeframe === tab.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0.35rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                fontSize: '11px',
                fontWeight: 700,
                color: '#065f46'
              }}
              title="Inner Ring: Total Income"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              <span>In: <strong>+{formatCurrency(incomeData.totalInflows)}</strong></span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0.35rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                fontSize: '11px',
                fontWeight: 700,
                color: '#be123c'
              }}
              title="Outer Ring: Total Outflows & Allocations"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
              <span>Out: <strong>-{formatCurrency(expenseData.totalOutflows)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Highlight: Period Comparison */}
      {comparison && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.5rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: comparison.bg,
            border: `1px solid ${comparison.border}`,
            color: comparison.color,
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            {comparison.type === 'saved' ? 'trending_down' : comparison.type === 'spent_more' ? 'trending_up' : 'compare_arrows'}
          </span>
          <span>{comparison.text}</span>
        </div>
      )}

      {/* Main Grid: Double Donut + Category Breakdown List */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}
      >
        {/* Left Side: Double Donut Chart & Center Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '0.875rem', alignSelf: 'start' }}>
          <div style={{ position: 'relative', width: '330px', height: '330px', maxWidth: '100%' }}>
            <svg
              viewBox="0 0 340 340"
              style={{
                width: '100%',
                height: '100%',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center'
              }}
            >
              {/* Outer Ring Background Track (Outflows) */}
              <circle
                cx={center}
                cy={center}
                r={radiusOuter}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={strokeOuter}
              />

              {/* Inner Ring Background Track (Inflows) */}
              <circle
                cx={center}
                cy={center}
                r={radiusInner}
                fill="none"
                stroke="#f8fafc"
                strokeWidth={strokeInner}
              />

              {/* 1. OUTER RING SEGMENTS (Expenses & Allocations) */}
              {expenseData.totalOutflows > 0 ? (
                outerSlices.map((slice) => {
                  const isHovered = hoveredCategory?.ring === 'outer' && hoveredCategory?.key === slice.key;
                  return (
                    <circle
                      key={`outer-${slice.key}`}
                      cx={center}
                      cy={center}
                      r={radiusOuter}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={isHovered ? strokeOuter + 4 : strokeOuter}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="butt"
                      style={{
                        transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                        opacity: hoveredCategory && !isHovered ? 0.45 : 1,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => {
                        setHoveredCategory({ ring: 'outer', key: slice.key });
                        setActiveTab('outflows');
                      }}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                })
              ) : (
                <circle
                  cx={center}
                  cy={center}
                  r={radiusOuter}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={strokeOuter}
                />
              )}

              {/* 2. INNER RING SEGMENTS (Income Streams) */}
              {incomeData.totalInflows > 0 ? (
                innerSlices.map((slice) => {
                  const isHovered = hoveredCategory?.ring === 'inner' && hoveredCategory?.key === slice.key;
                  return (
                    <circle
                      key={`inner-${slice.key}`}
                      cx={center}
                      cy={center}
                      r={radiusInner}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={isHovered ? strokeInner + 4 : strokeInner}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="butt"
                      style={{
                        transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                        opacity: hoveredCategory && !isHovered ? 0.45 : 1,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => {
                        setHoveredCategory({ ring: 'inner', key: slice.key });
                        setActiveTab('inflows');
                      }}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                })
              ) : (
                <circle
                  cx={center}
                  cy={center}
                  r={radiusInner}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={strokeInner}
                />
              )}
            </svg>

            {/* Center Content Hub */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                pointerEvents: 'none',
                padding: '0 28px'
              }}
            >
              {hoveredCategory ? (
                // Hovered Segment Details
                (() => {
                  const isOuter = hoveredCategory.ring === 'outer';
                  const item = isOuter
                    ? expenseData.items.find((i) => i.key === hoveredCategory.key)
                    : incomeData.items.find((i) => i.key === hoveredCategory.key);

                  if (!item) return null;

                  return (
                    <>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: isOuter ? '#be123c' : '#059669'
                        }}
                      >
                        {isOuter ? 'Outer Ring: Outflow' : 'Inner Ring: Income'}
                      </span>
                      <span
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 800,
                          color: 'var(--text-main)',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.25,
                          marginTop: '2px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatCurrency(item.amount)}
                      </span>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: item.color,
                          marginTop: '2px'
                        }}
                      >
                        {item.label} ({item.percentage}%)
                      </span>
                    </>
                  );
                })()
              ) : (
                // Default Center Overview
                <>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {timeframe === 'month' ? 'Month Spend' : timeframe === 'year' ? 'Year Spend' : 'Total Spend'}
                  </span>
                  <span
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                      marginTop: '2px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatCurrency(expenseData.totalOutflows)}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: netSurplus >= 0 ? '#10b981' : '#ef4444',
                      marginTop: '2px'
                    }}
                  >
                    {netSurplus >= 0 ? `Net +${formatCurrency(netSurplus)}` : `Deficit -${formatCurrency(Math.abs(netSurplus))}`}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Double-Ring Visual Indicator Key */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2.5px solid #ef4444', backgroundColor: 'transparent' }}></span>
              Outer: Outflows ({expenseData.items.length})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }}></span>
              Inner: Inflows ({incomeData.items.length})
            </span>
          </div>
        </div>

        {/* Right Side: Category Breakdown with Inflow / Outflow Toggle Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', alignSelf: 'start', minHeight: '330px' }}>
          {/* Tab Pill Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: 'var(--bg-canvas-subtle)', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('outflows')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: activeTab === 'outflows' ? 800 : 600,
                  backgroundColor: activeTab === 'outflows' ? '#ffffff' : 'transparent',
                  color: activeTab === 'outflows' ? '#be123c' : 'var(--text-muted)',
                  boxShadow: activeTab === 'outflows' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Outer: Outflows ({expenseData.items.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inflows')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: activeTab === 'inflows' ? 800 : 600,
                  backgroundColor: activeTab === 'inflows' ? '#ffffff' : 'transparent',
                  color: activeTab === 'inflows' ? '#047857' : 'var(--text-muted)',
                  boxShadow: activeTab === 'inflows' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Inner: Inflows ({incomeData.items.length})</span>
              </button>
            </div>

            <span style={{ fontSize: '11px', fontWeight: 700, color: activeTab === 'outflows' ? '#be123c' : '#047857' }}>
              Total: {formatCurrency(activeTab === 'outflows' ? expenseData.totalOutflows : incomeData.totalInflows)}
            </span>
          </div>

          {/* List Items */}
          {activeTab === 'outflows' ? (
            expenseData.items.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                No outflows or expenses recorded for this timeframe.
              </div>
            ) : (
              expenseData.items.map((item) => {
                const isHovered = hoveredCategory?.ring === 'outer' && hoveredCategory?.key === item.key;

                return (
                  <div
                    key={item.key}
                    onMouseEnter={() => setHoveredCategory({ ring: 'outer', key: item.key })}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      backgroundColor: isHovered ? 'rgba(241, 245, 249, 0.9)' : '#f8fafc',
                      borderRadius: 'var(--radius-lg)',
                      padding: '0.625rem 0.875rem',
                      border: isHovered ? `1.5px solid ${item.color}` : '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 150ms ease',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            backgroundColor: item.color,
                            flexShrink: 0
                          }}
                        ></span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                          {formatCurrency(item.amount)}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            minWidth: '38px',
                            textAlign: 'right'
                          }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(4, item.percentage))}%`,
                          height: '100%',
                          backgroundColor: item.color,
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            incomeData.items.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                No income streams recorded for this timeframe.
              </div>
            ) : (
              incomeData.items.map((item) => {
                const isHovered = hoveredCategory?.ring === 'inner' && hoveredCategory?.key === item.key;

                return (
                  <div
                    key={item.key}
                    onMouseEnter={() => setHoveredCategory({ ring: 'inner', key: item.key })}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      backgroundColor: isHovered ? 'rgba(236, 253, 245, 0.9)' : '#f8fafc',
                      borderRadius: 'var(--radius-lg)',
                      padding: '0.625rem 0.875rem',
                      border: isHovered ? `1.5px solid ${item.color}` : '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 150ms ease',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            backgroundColor: item.color,
                            flexShrink: 0
                          }}
                        ></span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#047857' }}>
                          +{formatCurrency(item.amount)}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            minWidth: '38px',
                            textAlign: 'right'
                          }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(4, item.percentage))}%`,
                          height: '100%',
                          backgroundColor: item.color,
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};
