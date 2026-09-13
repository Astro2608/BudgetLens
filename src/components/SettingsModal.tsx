import React, { useState, useEffect } from 'react';
import { CategoryConfig, CategoryKey } from '../types/finance';
import { DEFAULT_CATEGORY_CONFIGS } from '../config/categoryConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryConfigs: Record<CategoryKey, CategoryConfig>;
  onSaveCategoryConfigs: (configs: Record<CategoryKey, CategoryConfig>) => void;
  initialBalance: number;
  onSaveInitialBalance: (balance: number) => void;
  onResetDefaults: () => void;
}

const PRESET_PALETTE = [
  '#10b981', // Emerald Green
  '#0d9488', // Teal
  '#f59e0b', // Amber / Gold
  '#f97316', // Orange
  '#ef4444', // Red
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate Grey
  '#0f172a'  // Dark Navy
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  categoryConfigs,
  onSaveCategoryConfigs,
  initialBalance,
  onSaveInitialBalance,
  onResetDefaults
}) => {
  const [localConfigs, setLocalConfigs] = useState<Record<CategoryKey, CategoryConfig>>(categoryConfigs);
  const [localBalance, setLocalBalance] = useState<string>(initialBalance.toString());
  const [activeTab, setActiveTab] = useState<'categories' | 'balance'>('categories');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLocalConfigs(categoryConfigs);
    setLocalBalance(initialBalance.toString());
  }, [categoryConfigs, initialBalance, isOpen]);

  if (!isOpen) return null;

  const handleColorChange = (key: CategoryKey, newColor: string) => {
    setLocalConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        color: newColor
      }
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCategoryConfigs(localConfigs);

    const parsedBalance = parseFloat(localBalance);
    if (!isNaN(parsedBalance) && parsedBalance >= 0) {
      onSaveInitialBalance(parsedBalance);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 400);
  };

  const handleReset = () => {
    if (window.confirm('Reset all categories, colors, and baseline balance to defaults?')) {
      onResetDefaults();
      setLocalConfigs(DEFAULT_CATEGORY_CONFIGS);
      setLocalBalance('50000');
    }
  };

  const categories = Object.values(localConfigs);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}
        >
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
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>tune</span>
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                System Settings
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Configure category color mapping and account baseline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px'
            }}
            title="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div style={{ padding: '0.75rem 1.5rem 0.25rem 1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'categories' ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: 700,
              fontSize: '13px',
              color: activeTab === 'categories' ? 'var(--color-primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'categories' ? 'var(--color-primary-light)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>palette</span>
            <span>Category Color Mapping</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('balance')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'balance' ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: 700,
              fontSize: '13px',
              color: activeTab === 'balance' ? 'var(--color-primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'balance' ? 'var(--color-primary-light)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_balance</span>
            <span>Baseline Account Balance</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeTab === 'categories' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Customize the theme color for each expense, income, and savings category. Changes will immediately sync across the stacked chart, legend, ledger, and runway matrix.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {categories.map((cat) => (
                    <div
                      key={cat.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--bg-canvas-subtle)',
                        border: '1px solid var(--border-subtle)',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      {/* Left Category Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '150px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{cat.icon}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {cat.label}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {cat.type}
                          </span>
                        </div>
                      </div>

                      {/* Right Color Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Quick Color Swatches */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {PRESET_PALETTE.slice(0, 6).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleColorChange(cat.key, c)}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: c,
                                border: cat.color.toLowerCase() === c.toLowerCase() ? '2px solid #0f172a' : '1px solid rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                padding: 0,
                                transform: cat.color.toLowerCase() === c.toLowerCase() ? 'scale(1.15)' : 'none',
                                transition: 'transform 0.15s ease'
                              }}
                              title={c}
                            />
                          ))}
                        </div>

                        {/* Native Color Picker & Hex Code */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                          <input
                            type="color"
                            value={cat.color}
                            onChange={(e) => handleColorChange(cat.key, e.target.value)}
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: '0',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: 'transparent'
                            }}
                            title="Custom Hex Picker"
                          />
                          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: '55px' }}>
                            {cat.color.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'balance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Initial Baseline Opening Balance (SGD)
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    This represents your liquid starting capital before recorded transactions. The total balance and runway longevity automatically calculate from this baseline.
                  </p>
                  <div style={{ position: 'relative', maxWidth: '320px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)', fontSize: '14px' }}>
                      SGD $
                    </span>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={localBalance}
                      onChange={(e) => setLocalBalance(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 65px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-input)',
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(240, 253, 250, 0.7)',
                    border: '1px solid var(--color-primary-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px', flexShrink: 0 }}>
                    info
                  </span>
                  <p style={{ fontSize: '12px', color: '#115e59', lineHeight: 1.45, margin: 0 }}>
                    Formula applied: <strong>Current Bank Balance = Baseline + Total Inflow - Total Outflow (excluding Savings)</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: '#fafbfc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restart_alt</span>
              <span>Reset Defaults</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                style={{ fontSize: '13px', padding: '0.5rem 1rem' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  fontSize: '13px',
                  padding: '0.5rem 1.25rem',
                  backgroundColor: saveSuccess ? '#10b981' : undefined
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {saveSuccess ? 'check' : 'save'}
                </span>
                <span>{saveSuccess ? 'Applied!' : 'Save & Apply'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
