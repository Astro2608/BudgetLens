import React from 'react';
import { CategoryConfig, CategoryKey } from '../types/finance';
import { DEFAULT_CATEGORY_CONFIGS } from '../config/categoryConfig';

interface CategoryLegendProps {
  categoryConfigs?: Record<CategoryKey, CategoryConfig>;
  onOpenSettings?: () => void;
}

export const CategoryLegend: React.FC<CategoryLegendProps> = ({
  categoryConfigs = DEFAULT_CATEGORY_CONFIGS,
  onOpenSettings
}) => {
  const displayCategories = Object.values(categoryConfigs);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.875rem',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-subtle)' }}>palette</span>
        <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-main)' }}>
          Category Color Key:
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '12px' }}>
        {displayCategories.map((cat) => (
          <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '50%',
                backgroundColor: cat.color,
                flexShrink: 0,
                transition: 'background-color 0.2s ease'
              }}
            ></span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.label}</span>
          </div>
        ))}
      </div>

      <a
        href="#settings"
        onClick={(e) => {
          e.preventDefault();
          if (onOpenSettings) onOpenSettings();
        }}
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--color-primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          textDecoration: 'none',
          cursor: 'pointer'
        }}
        title="Open Settings to customize category colors and baseline balance"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
        <span>Edit in Settings</span>
      </a>
    </div>
  );
};
