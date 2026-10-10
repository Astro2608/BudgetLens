import React, { useState, useEffect } from 'react';
import {
  checkOllamaStatus,
  pullModelStream,
  getLocalAiConfig,
  saveLocalAiConfig,
  OllamaModel,
  PullProgress
} from '../utils/localAiService';
import { Sparkles } from 'lucide-react';

interface LocalAIInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: (modelName: string) => void;
}

export const LocalAIInstallerModal: React.FC<LocalAIInstallerModalProps> = ({
  isOpen,
  onClose,
  onActivated
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemma4:e4b');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<PullProgress | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Poll Ollama status on mount or when modal opens
  const verifyConnection = async () => {
    setIsChecking(true);
    const status = await checkOllamaStatus();
    setIsConnected(status.isConnected);
    setModels(status.models);

    const config = getLocalAiConfig();
    const active = config.selectedModel || status.recommendedModel;
    setSelectedModel(active);

    // If an existing vision model exists
    const hasExisting = status.models.some((m) =>
      m.name.toLowerCase().includes('gemma4') ||
      m.name.toLowerCase().includes('qwen') ||
      m.name.toLowerCase().includes('vision')
    );
    if (status.isConnected && hasExisting) {
      setInstallSuccess(true);
    }

    setIsChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      verifyConnection();
      // Auto-poll every 3s in case user launches Ollama while looking at the screen
      const interval = setInterval(async () => {
        if (!isConnected && !isDownloading) {
          const status = await checkOllamaStatus();
          if (status.isConnected) {
            setIsConnected(true);
            setModels(status.models);
          }
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isConnected, isDownloading]);

  if (!isOpen) return null;

  const handleStartPull = async (modelToPull: string) => {
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadProgress({ status: 'Starting automated download...' });

    try {
      await pullModelStream(modelToPull, (progress) => {
        setDownloadProgress(progress);
      });
      setInstallSuccess(true);
      setSelectedModel(modelToPull);
      saveLocalAiConfig({ enabled: true, selectedModel: modelToPull });
      await verifyConnection();
    } catch (err: any) {
      setDownloadError(err?.message || 'Failed to download model');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFinishAndActivate = () => {
    saveLocalAiConfig({ enabled: true, selectedModel });
    onActivated(selectedModel);
    onClose();
  };

  const handleCopyWinget = () => {
    navigator.clipboard.writeText('winget install Ollama.Ollama');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const isModelAlreadyInstalled = models.some(
    (m) => m.name.toLowerCase() === selectedModel.toLowerCase()
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDownloading) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#0ea5e9',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                psychology
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Private Local AI Assistant
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #bbf7d0'
                  }}
                >
                  100% OFFLINE
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Zero data leaves your device. Powered by local hardware.
              </p>
            </div>
          </div>

          {!isDownloading && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted, #94a3b8)',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Stepper Progress */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-subtle, #f8fafc)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle, #e2e8f0)'
            }}
          >
            {/* Step 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '999px',
                  backgroundColor: isConnected ? '#10b981' : '#0ea5e9',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {isConnected ? '✓' : '1'}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>
                {isConnected ? 'Engine Ready' : 'Detect Engine'}
              </span>
            </div>

            <span style={{ color: '#cbd5e1' }}>―</span>

            {/* Step 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '999px',
                  backgroundColor: installSuccess ? '#10b981' : isConnected ? '#0ea5e9' : '#cbd5e1',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {installSuccess ? '✓' : '2'}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>
                {installSuccess ? 'Model Ready' : 'Setup AI Model'}
              </span>
            </div>

            <span style={{ color: '#cbd5e1' }}>―</span>

            {/* Step 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '999px',
                  backgroundColor: installSuccess ? '#10b981' : '#cbd5e1',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {installSuccess ? '✓' : '3'}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Start</span>
            </div>
          </div>

          {/* Scenario A: Ollama Not Found */}
          {!isConnected && !isChecking && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '24px' }}>
                  info
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#92400e' }}>
                    Ollama Local Service Not Detected
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b45309', lineHeight: 1.5 }}>
                    To run AI models 100% offline on your device for free, Ollama must be running in the background.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#78350f' }}>
                  Quick 1-Minute Automated Installation:
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                >
                  <span>winget install Ollama.Ollama</span>
                  <button
                    onClick={handleCopyWinget}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedCmd ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <a
                  href="https://ollama.com/download"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    color: '#0ea5e9',
                    textDecoration: 'underline',
                    fontWeight: 700
                  }}
                >
                  Or download from official website (ollama.com) →
                </a>
                <button
                  onClick={verifyConnection}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#d97706',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Check Again
                </button>
              </div>
            </div>
          )}

          {/* Scenario B: Ollama Connected! */}
          {isConnected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Status Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0'
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '28px' }}>
                  check_circle
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#15803d' }}>
                    Local AI Engine Connected
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#166534' }}>
                    Ollama is running on your machine with <strong>{models.length}</strong> model(s) available.
                  </p>
                </div>
              </div>

              {/* Model Choice Card */}
              <div
                style={{
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                    Active Vision AI Model:
                  </label>
                  {isModelAlreadyInstalled && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8'
                      }}
                    >
                      Installed & Ready
                    </span>
                  )}
                </div>

                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isDownloading}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    backgroundColor: 'var(--bg-card, #fff)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-main, #0f172a)'
                  }}
                >
                  {models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB)
                    </option>
                  ))}
                  {!models.some((m) => m.name.includes('qwen2.5-vl:3b')) && (
                    <option value="qwen2.5-vl:3b">qwen2.5-vl:3b (Recommended 2.5 GB - Click to Install)</option>
                  )}
                </select>

                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted, #64748b)', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={13} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                  <span>
                    {selectedModel.includes('gemma4')
                      ? 'Gemma 4 Vision Model: High accuracy multi-line statement reading.'
                      : selectedModel.includes('qwen')
                      ? 'Qwen 2.5 Vision: World-class document & table extraction precision.'
                      : 'Standard local model for text/statement generation.'}
                  </span>
                </p>
              </div>

              {/* Download / Progress Bar */}
              {isDownloading && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                      {downloadProgress?.status || 'Downloading model files...'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0ea5e9' }}>
                      {downloadProgress?.percent !== undefined ? `${downloadProgress.percent}%` : '...'}
                    </span>
                  </div>

                  <div
                    style={{
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: '#e2e8f0',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${downloadProgress?.percent || 15}%`,
                        backgroundColor: '#0ea5e9',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>

                  {downloadProgress?.total ? (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {((downloadProgress.completed || 0) / (1024 * 1024)).toFixed(0)} MB /{' '}
                      {((downloadProgress.total || 0) / (1024 * 1024)).toFixed(0)} MB
                    </span>
                  ) : null}
                </div>
              )}

              {downloadError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '12px'
                  }}
                >
                  Error: {downloadError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              backgroundColor: 'transparent',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted, #64748b)'
            }}
          >
            Cancel / Opt-Out
          </button>

          {isConnected && (
            <div>
              {!isModelAlreadyInstalled ? (
                <button
                  type="button"
                  onClick={() => handleStartPull(selectedModel)}
                  disabled={isDownloading}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0ea5e9',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isDownloading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(14, 165, 233, 0.3)'
                  }}
                >
                  {isDownloading ? 'Installing Model...' : `Install ${selectedModel}`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishAndActivate}
                  style={{
                    padding: '8px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    check
                  </span>
                  Activate Local AI Parser
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
