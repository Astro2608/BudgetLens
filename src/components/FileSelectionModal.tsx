import React, { useRef } from 'react';

interface FileSelectionModalProps {
  onSelectFile: () => void;
  onCreateFile: () => void;
  onFallbackImport: (file: File) => void;
}

export const FileSelectionModal: React.FC<FileSelectionModalProps> = ({ onSelectFile, onCreateFile, onFallbackImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if File System Access API is supported
  const isFSApiSupported = 'showOpenFilePicker' in window;

  const handleFallbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFallbackImport(file);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem'
      }}
    >
      <div
        className="lumina-card"
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '2rem'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            marginBottom: '0.5rem'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>database</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Raw Data Connection Missing
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            BudgetLens operates 100% locally and stores data in a raw file format (MD, CSV, JSON, TXT). 
            Please connect an existing data file or create a new one to proceed.
          </p>
          {!isFSApiSupported && (
            <p style={{ fontSize: '12px', color: '#f59e0b', margin: '0.5rem 0 0 0', fontWeight: 600 }}>
              Note: Your browser does not support live file syncing. Data will be stored locally in your browser. You can use the Export button to save changes.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          {isFSApiSupported ? (
            <button
              onClick={onSelectFile}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder_open</span>
              Browse Existing File
            </button>
          ) : (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".md,.csv,.txt"
                onChange={handleFallbackChange} 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
                Import Existing File
              </button>
            </>
          )}
          
          <button
            onClick={onCreateFile}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.875rem',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-canvas-subtle)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>note_add</span>
            {isFSApiSupported ? 'Create New Raw File' : 'Start Fresh (Local Browser Storage)'}
          </button>
        </div>
      </div>
    </div>
  );
};
