import React from 'react';

interface CSVImportZoneProps {
  onTriggerUpload?: () => void;
}

export const CSVImportZone: React.FC<CSVImportZoneProps> = ({ onTriggerUpload }) => {
  return (
    <div className="lumina-card" id="import-section" style={{ gap: '1rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-primary-border)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Bank e-Statement Import
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Fast local extraction for CSV e-statements (100% Offline & Private)
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: '#ecfdf5',
            color: '#047857',
            border: '1px solid #a7f3d0'
          }}
        >
          Parser Active
        </span>
      </div>

      {/* Visual Drag and Drop Box */}
      <div
        onClick={onTriggerUpload}
        style={{
          border: '2px dashed #99f6e4',
          backgroundColor: 'rgba(240, 253, 250, 0.5)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          transition: 'all 180ms ease'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>file_upload</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
            Drop your bank CSV statements here, or <span style={{ color: 'var(--color-primary-hover)', textDecoration: 'underline' }}>browse files</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
            Supported: DBS, OCBC, UOB, HSBC, Standard Chartered, Citibank, Chase, Revolut
          </span>
        </div>
      </div>

      {/* Auto-categorized Preview Strip */}
      <div
        style={{
          backgroundColor: 'var(--bg-canvas-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.875rem 1rem',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#d1fae5',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Auto-categorized 42 transactions from DBS_Oct_Statement.csv
            </span>
            <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>
              94% accuracy with deterministic rule-matching
            </span>
          </div>
        </div>

        <button
          className="btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '12px' }}
        >
          Review Batch
        </button>
      </div>

      {/* Rule-Based Callout */}
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(254, 243, 199, 0.6)',
          border: '1px solid rgba(253, 230, 138, 0.8)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.625rem'
        }}
      >
        <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>
          shield_with_heart
        </span>
        <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45 }}>
          <strong style={{ color: '#0f172a' }}>Rule-based parser active:</strong> extracts standard tables & regex merchant patterns without AI (free, private & instant). Unrecognized merchants automatically map to General.
        </p>
      </div>
    </div>
  );
};
