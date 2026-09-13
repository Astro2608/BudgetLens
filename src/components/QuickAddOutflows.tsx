import React from 'react';
import { CategoryKey } from '../types/finance';

interface QuickAddOutflowsProps {
  onQuickAdd: (title: string, amount: number, category: CategoryKey) => void;
}

export const QuickAddOutflows: React.FC<QuickAddOutflowsProps> = ({ onQuickAdd }) => {
  const quickItems = [
    { title: 'Kopi & Toast', fullTitle: 'Kopi-O & Toast Breakfast', amount: 4.85, category: 'Food' as CategoryKey, icon: 'coffee', tag: 'Food • Morning Habit', color: '#f59e0b', bg: '#fef3c7' },
    { title: 'Grab Transit Ride', fullTitle: 'Grab Ride Transit', amount: 12.50, category: 'Transport' as CategoryKey, icon: 'local_taxi', tag: 'Transport • Commute', color: '#10b981', bg: '#d1fae5' },
    { title: 'Giga Telco Plan', fullTitle: 'SIM-Only Telco Bill', amount: 18.00, category: 'Bills' as CategoryKey, icon: 'cell_tower', tag: 'Bills • Monthly Telco', color: '#ef4444', bg: '#fee2e2' },
    { title: 'Watsons Pharmacy', fullTitle: 'Watsons Essentials', amount: 24.50, category: 'General' as CategoryKey, icon: 'medication', tag: 'General • Healthcare', color: '#94a3b8', bg: '#e2e8f0' }
  ];

  return (
    <div className="lumina-card" style={{ gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '20px' }}>bolt</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Quick Add Outflows</h3>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Frequent
        </span>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Tap to instantaneously log routine transactions based on repeating habits:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {quickItems.map((item) => (
          <button
            key={item.title}
            onClick={() => onQuickAdd(item.fullTitle, item.amount, item.category)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-canvas-subtle)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: item.bg,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{item.title}</span>
                <span style={{ fontSize: '10px', color: item.color, fontWeight: 600 }}>{item.tag}</span>
              </div>
            </div>

            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
              -SGD ${item.amount.toFixed(2)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
