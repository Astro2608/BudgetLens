import React, { useState } from 'react';
import { CategoryKey, CategoryConfig } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';
import { SectionInfoButton } from './SectionInfoButton';

interface QuickAddOutflowsProps {
  onQuickAdd: (title: string, amount: number, category: CategoryKey, tags?: string[]) => void;
  categoryConfigs: Record<CategoryKey, CategoryConfig>;
}

export const QuickAddOutflows: React.FC<QuickAddOutflowsProps> = ({
  onQuickAdd,
  categoryConfigs
}) => {
  const { currencyInfo } = useCurrency();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const [selectedTagsMap, setSelectedTagsMap] = useState<Record<string, string[]>>({});
  const [customTagInputMap, setCustomTagInputMap] = useState<Record<string, string>>({});

  const categories = Object.values(categoryConfigs);

  const handleAmountChange = (key: string, val: string) => {
    // Only allow valid numeric / decimal values
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setAmounts((prev) => ({ ...prev, [key]: val }));
    }
  };

  const toggleTagForCategory = (catKey: string, tag: string) => {
    const clean = tag.toLowerCase().replace(/^#/, '').trim();
    setSelectedTagsMap((prev) => {
      const current = prev[catKey] || [];
      const updated = current.includes(clean)
        ? current.filter((t) => t !== clean)
        : [...current, clean];
      return { ...prev, [catKey]: updated };
    });
  };

  const handleCommit = (cat: CategoryConfig) => {
    const rawVal = amounts[cat.key];
    const num = parseFloat(rawVal || '');
    if (isNaN(num) || num <= 0) return;

    const presetSelected = selectedTagsMap[cat.key] || [];
    const customInput = customTagInputMap[cat.key] || '';
    const customParsed = customInput
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const merged = Array.from(new Set([...presetSelected, ...customParsed]));

    onQuickAdd(cat.label, num, cat.key, merged.length > 0 ? merged : undefined);

    // Clear input and show feedback
    setAmounts((prev) => ({ ...prev, [cat.key]: '' }));
    setSelectedTagsMap((prev) => ({ ...prev, [cat.key]: [] }));
    setCustomTagInputMap((prev) => ({ ...prev, [cat.key]: '' }));
    setJustAddedKey(cat.key);
    setTimeout(() => {
      setJustAddedKey(null);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent, cat: CategoryConfig) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit(cat);
    }
  };

  return (
    <div className="lumina-card" style={{ gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '20px' }}>bolt</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Quick Log
          </h3>
          <SectionInfoButton
            title="Quick Log"
            description="Allows instant 1-click recording of daily expenses and deposits into your ledger without opening forms."
            howItWorks="Type an amount into any category input and hit Enter or click '+ Log'. The transaction is immediately committed to local memory with today's date."
            example="Key in '14.50' under Food & Dining and hit Enter. The entry is recorded instantly and dashboard charts refresh in real-time."
          />
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a'
          }}
        >
          {categories.length} Categories
        </span>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
        Key in an amount to instantly log expenses or income into your ledger:
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem'
        }}
      >
        {categories.map((cat) => {
          const currentVal = amounts[cat.key] || '';
          const hasVal = parseFloat(currentVal) > 0;
          const isSuccess = justAddedKey === cat.key;

          return (
            <div
              key={cat.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isSuccess ? '#ecfdf5' : 'var(--bg-canvas-subtle)',
                border: isSuccess ? '1px solid #6ee7b7' : '1px solid var(--border-subtle)',
                transition: 'all 200ms ease',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                {/* Category Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {cat.icon || 'category'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {cat.label}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: cat.color,
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    >
                      {cat.type}
                    </span>
                  </div>
                </div>

                {/* Price Input & Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: '88px' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '7px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                      }}
                    >
                      {currencyInfo.symbol}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={currentVal}
                      onChange={(e) => handleAmountChange(cat.key, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, cat)}
                      style={{
                        width: '100%',
                        padding: '5px 6px 5px 18px',
                        borderRadius: '6px',
                        border: hasVal ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        textAlign: 'right',
                        outline: 'none',
                        transition: 'border 120ms ease'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCommit(cat)}
                    disabled={!hasVal && !isSuccess}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      padding: '5px 9px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: hasVal ? 'pointer' : 'default',
                      backgroundColor: isSuccess
                        ? '#10b981'
                        : hasVal
                        ? 'var(--color-primary)'
                        : '#e2e8f0',
                      color: isSuccess || hasVal ? '#ffffff' : '#94a3b8',
                      transition: 'all 150ms ease',
                      minWidth: '52px'
                    }}
                    title={hasVal ? `Log ${currencyInfo.prefix}${currentVal} to ${cat.label}` : 'Enter an amount to log'}
                  >
                    {isSuccess ? (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                        <span>Log</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tag Pills sub-row for this Category */}
              {((cat.tags && cat.tags.length > 0) || (selectedTagsMap[cat.key] && selectedTagsMap[cat.key].length > 0)) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px dashed var(--border-subtle)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-subtle)' }}>Tags:</span>
                  {(cat.tags || []).map((tag) => {
                    const activeTags = selectedTagsMap[cat.key] || [];
                    const isActive = activeTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTagForCategory(cat.key, tag)}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: isActive ? `1px solid ${cat.color}` : '1px solid var(--border-subtle)',
                          backgroundColor: isActive ? `${cat.color}20` : '#ffffff',
                          color: isActive ? cat.color : 'var(--text-main)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isActive ? '✓ ' : '+ '}#{tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
