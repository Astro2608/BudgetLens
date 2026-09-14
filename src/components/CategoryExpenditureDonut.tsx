import React, { useState, useMemo } from 'react';
import { Transaction, CategoryConfig, CategoryKey } from '../types/finance';
import { DEFAULT_CATEGORY_CONFIGS, getCategoryConfig } from '../config/categoryConfig';
import { useCurrency } from '../context/CurrencyContext';

interface CategoryExpenditureDonutProps {
  transactions: Transaction[];
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
}

type TimeframeOption = 'month' | 'year' | 'all';

export const CategoryExpenditureDonut: React.FC<CategoryExpenditureDonutProps> = ({
  transactions,
  categoryConfigs = DEFAULT_CATEGORY_CONFIGS
}) => {
  const { formatCurrency, currencyInfo } = useCurrency();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('month');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Determine current month/year reference
  const now = new Date();
  const currentYearStr = `${now.getFullYear()}`;
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Previous month string
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Previous year string
  const prevYearStr = `${now.getFullYear() - 1}`;

  // Filter for living expenses and allocations (including Savings & Vault)
  const expenseData = useMemo(() => {
    const allExpenseTxs = transactions.filter(
      (t) => t.type === 'expense' || t.type === 'savings' || t.category === 'Savings'
    );

    // Filter by selected timeframe
    const filteredTxs = allExpenseTxs.filter((t) => {
      if (timeframe === 'month') {
        return t.date.startsWith(currentMonthStr);
      }
      if (timeframe === 'year') {
        return t.date.startsWith(currentYearStr);
      }
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

  // Donut geometry calculations with expanded dimensions to prevent text overflow
  const radius = 98;
  const strokeWidth = 20;
  const center = 130;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const slices = expenseData.items.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  // Calculate comparison metrics
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
            Outflow Composition Analysis
          </span>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Category Expenditure Breakdown
          </h3>
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

          {/* Right Badge: Total Outflows */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              fontSize: '12px',
              fontWeight: 700,
              color: '#be123c'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
            <span>Outflows: <strong style={{ fontWeight: 800 }}>{formatCurrency(expenseData.totalOutflows)}</strong></span>
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

      {/* Main Grid: Donut + Category List */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          alignItems: 'center'
        }}
      >
        {/* Left Side: Donut Chart & Center Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '260px', height: '260px', maxWidth: '100%' }}>
            <svg
              viewBox="0 0 260 260"
              style={{
                width: '100%',
                height: '100%',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center'
              }}
            >
              {/* Background Track Circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />

              {/* Category Segment Arcs */}
              {expenseData.totalOutflows > 0 ? (
                slices.map((slice) => {
                  const isHovered = hoveredCategory === slice.key;
                  return (
                    <circle
                      key={slice.key}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="butt"
                      style={{
                        transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                        opacity: hoveredCategory && !isHovered ? 0.45 : 1,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => setHoveredCategory(slice.key)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                })
              ) : (
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={strokeWidth}
                />
              )}
            </svg>

            {/* Center Content Hub (Generously sized with dynamic scaling) */}
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
                padding: '0 20px'
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)'
                }}
              >
                {timeframe === 'month' ? 'Month Spend' : timeframe === 'year' ? 'Year Spend' : 'Disbursed Total'}
              </span>
              {(() => {
                const displayedAmount = hoveredCategory
                  ? formatCurrency(expenseData.items.find((i) => i.key === hoveredCategory)?.amount || 0)
                  : `${currencyInfo.prefix}${expenseData.totalOutflows.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                
                const len = displayedAmount.length;
                const dynamicFontSize = len <= 11 ? '1.25rem' : len <= 14 ? '1.08rem' : len <= 17 ? '0.96rem' : '0.86rem';

                return (
                  <span
                    style={{
                      fontSize: dynamicFontSize,
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.25,
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      textAlign: 'center'
                    }}
                    title={displayedAmount}
                  >
                    {displayedAmount}
                  </span>
                );
              })()}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: hoveredCategory
                    ? expenseData.items.find((i) => i.key === hoveredCategory)?.color
                    : 'var(--color-primary)',
                  marginTop: '2px'
                }}
              >
                {hoveredCategory
                  ? `${expenseData.items.find((i) => i.key === hoveredCategory)?.label} (${expenseData.items.find((i) => i.key === hoveredCategory)?.percentage}%)`
                  : `${expenseData.categoriesCount} Categories`}
              </span>
            </div>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 500 }}>
            Aggregated from Verified Local Ledger
          </span>
        </div>

        {/* Right Side: Category Breakdown Progress Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          {expenseData.items.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
              No expenses recorded for this timeframe.
            </div>
          ) : (
            expenseData.items.map((item) => {
              const isHovered = hoveredCategory === item.key;

              return (
                <div
                  key={item.key}
                  onMouseEnter={() => setHoveredCategory(item.key)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  style={{
                    backgroundColor: isHovered ? 'rgba(241, 245, 249, 0.9)' : '#f8fafc',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.625rem 0.875rem',
                    border: isHovered ? `1px solid ${item.color}60` : '1px solid #f1f5f9',
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

                  {/* Horizontal Progress Fill Bar */}
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
          )}
        </div>
      </div>
    </div>
  );
};
