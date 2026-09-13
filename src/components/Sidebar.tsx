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
  // Intelligent Runway & Health Status Calculation:
  // If balance > 0 and runway is infinite or >= 12 mo: Healthy/Thriving (100%, Green)
  // If runway >= 6 mo: Stable (75%, Teal)
  // If runway >= 3 mo: Moderate (45%, Amber)
  // If runway < 3 mo or balance <= 0: Critical (Red)
  let healthPercent = 100;
  let healthStatus = 'Healthy';
  let healthColor = '#10b981'; // Green
  let runwayDisplay = `${overallRunwayMonths} Mo`;

  if (totalBalance <= 0) {
    healthPercent = 10;
    healthStatus = 'Critical';
    healthColor = '#ef4444';
    runwayDisplay = '0 Mo';
  } else if (overallRunwayMonths >= 999 || overallRunwayMonths >= 99) {
    healthPercent = 100;
    healthStatus = 'Thriving';
    healthColor = '#10b981';
    runwayDisplay = '99+ Mo';
  } else if (overallRunwayMonths >= 12) {
    healthPercent = Math.min(100, Math.max(80, Math.round((overallRunwayMonths / 24) * 100)));
    healthStatus = 'Healthy';
    healthColor = '#10b981';
    runwayDisplay = `${overallRunwayMonths} Mo`;
  } else if (overallRunwayMonths >= 6) {
    healthPercent = Math.round((overallRunwayMonths / 12) * 80);
    healthStatus = 'Stable';
    healthColor = '#0d9488'; // Vibrant teal
    runwayDisplay = `${overallRunwayMonths} Mo`;
  } else if (overallRunwayMonths >= 3) {
    healthPercent = Math.round((overallRunwayMonths / 6) * 60);
    healthStatus = 'Moderate';
    healthColor = '#f59e0b'; // Amber
    runwayDisplay = `${overallRunwayMonths} Mo`;
  } else {
    healthPercent = Math.max(12, Math.round((overallRunwayMonths / 3) * 35));
    healthStatus = 'Critical';
    healthColor = '#ef4444'; // Red
    runwayDisplay = `${overallRunwayMonths} Mo`;
  }

  return (
    <aside className="sidebar">
      <div className="flex flex-col gap-6">
        {/* Brand */}
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>finance_chip</span>
          </div>
          <div className="brand-text">
            <span className="brand-title">BudgetLens</span>
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
      <div
        className="sidebar-cash-card"
        title={`Available Cash: ${formatSGD(totalBalance)}. Runway projection: ${runwayDisplay} (${healthStatus}).`}
        style={{ cursor: 'default' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Available Cash
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: healthColor,
              backgroundColor: `${healthColor}18`,
              border: `1px solid ${healthColor}40`,
              padding: '2px 8px',
              borderRadius: '6px',
              transition: 'all 0.3s ease'
            }}
          >
            {runwayDisplay}
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
          <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '11.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>
            {formatSGD(totalBalance)}
          </span>
          <span style={{ fontSize: '11px', color: healthColor, fontWeight: 700 }}>
            Health: {healthStatus}
          </span>
        </div>
      </div>
    </aside>
  );
};
