import React from 'react';
import { formatSGD } from '../utils/financeCalculator';

interface SidebarProps {
  totalBalance: number;
  overallRunwayMonths: number;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  totalBalance,
  overallRunwayMonths,
  onOpenSettings
}) => {
  // Dynamic health calculation: 0 months -> 5%, 6 months -> 40%, 12 months -> 75%, >=18 months -> 100%
  const healthPercent = Math.min(100, Math.max(8, Math.round((overallRunwayMonths / 18) * 100)));
  const healthStatus = overallRunwayMonths >= 12 ? 'Healthy' : overallRunwayMonths >= 6 ? 'Stable' : 'Critical';
  const healthColor = overallRunwayMonths >= 12 ? '#10b981' : overallRunwayMonths >= 6 ? 'var(--color-primary)' : '#ef4444';

  return (
    <aside className="sidebar">
      <div className="flex flex-col gap-6">
        {/* Brand */}
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>finance_chip</span>
          </div>
          <div className="brand-text">
            <span className="brand-title">Lumina</span>
            <span className="brand-sub">Finance</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="nav-menu">
          <a
            className="nav-item active"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="material-symbols-outlined fill">grid_view</span>
            <span>Dashboard</span>
          </a>
          <a
            className="nav-item"
            href="#analytics-section"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('analytics-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="material-symbols-outlined">trending_up</span>
            <span>Analytics & Projections</span>
          </a>
          <button
            className="nav-item"
            type="button"
            onClick={onOpenSettings}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit'
            }}
          >
            <span className="material-symbols-outlined">tune</span>
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Available Cash Health Card */}
      <div className="sidebar-cash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Available Cash
          </span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-primary-hover)', background: 'var(--color-primary-border)', padding: '2px 8px', borderRadius: '6px' }}>
            {overallRunwayMonths} Mo
          </span>
        </div>

        <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${healthPercent}%`,
              height: '100%',
              background: healthColor,
              borderRadius: '9999px',
              transition: 'width 0.3s ease, background-color 0.3s ease'
            }}
          ></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', paddingTop: '2px' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{formatSGD(totalBalance)}</span>
          <span style={{ fontSize: '11px', color: healthColor, fontWeight: 700 }}>
            Health: {healthStatus}
          </span>
        </div>
      </div>
    </aside>
  );
};
