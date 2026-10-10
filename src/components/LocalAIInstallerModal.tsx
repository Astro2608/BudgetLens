import React, { useState, useEffect } from 'react';
import {
  checkOllamaStatus,
  pullModelStream,
  getLocalAiConfig,
  saveLocalAiConfig,
  OllamaModel,
  PullProgress
} from '../utils/localAiService';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  Download,
  RefreshCw,
  AlertCircle,
  X,
  ShieldCheck,
  Layers,
  ExternalLink,
  Check,
  Loader2
} from 'lucide-react';

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

  // Poll Ollama status on mount or when modal opens
  const verifyConnection = async () => {
    setIsChecking(true);
    try {
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
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
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
            if (status.recommendedModel) {
              setSelectedModel(status.recommendedModel);
            }
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
    setDownloadProgress({ status: 'Starting automated 1-click download...' });

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
              <Brain size={22} />
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
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={11} /> 100% OFFLINE
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Zero bank statements leave your device. Powered entirely by your local computer.
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
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close"
            >
              <X size={18} />
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
                {isConnected ? 'Engine Ready' : '1. Connect Engine'}
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
                {installSuccess ? 'Model Ready' : '2. Setup Model'}
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
              <span style={{ fontSize: '12px', fontWeight: 700 }}>3. Ready</span>
            </div>
          </div>

          {/* Loading Indicator */}
          {isChecking && !isConnected && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '2rem 1rem',
                color: 'var(--text-muted, #64748b)',
                fontSize: '13px'
              }}
            >
              <Loader2 size={20} className="animate-spin" style={{ color: '#0ea5e9' }} />
              <span>Checking for local AI engine on your device...</span>
            </div>
          )}

          {/* Scenario A: Ollama Not Found - Zero Technical Jargon, 1-Click Action */}
          {!isConnected && !isChecking && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Download size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    1-Click Setup: Local AI Engine
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                    To scan bank statements 100% offline with zero cloud fees and full privacy, download and run the installer.
                  </p>
                </div>
              </div>

              {/* 1-Click Big Action Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <a
                  href="https://ollama.com/download/OllamaSetup.exe"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    backgroundColor: '#0ea5e9',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '14px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <Download size={18} />
                  Download 1-Click Installer (Windows)
                </a>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    fontSize: '11px',
                    color: '#64748b'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={13} className="animate-spin" style={{ color: '#0ea5e9' }} />
                    <span>Auto-detecting... Once installed, this page connects automatically.</span>
                  </div>
                  <button
                    onClick={verifyConnection}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    <RefreshCw size={12} />
                    Check Now
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                <a
                  href="https://ollama.com/download"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textDecoration: 'underline',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Using Mac or Linux? Download here <ExternalLink size={10} />
                </a>
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
                <CheckCircle2 size={24} style={{ color: '#16a34a', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#15803d' }}>
                    Local AI Engine Connected & Active
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#166534' }}>
                    Running securely on your device with <strong>{models.length}</strong> installed model(s).
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
                  gap: '10px',
                  backgroundColor: 'var(--bg-subtle, #f8fafc)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} style={{ color: '#0ea5e9' }} />
                    Active Local AI Model:
                  </label>
                  {isModelAlreadyInstalled && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: '#dbeafe',
                        color: '#1d4ed8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check size={11} /> Installed & Ready
                    </span>
                  )}
                </div>

                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isDownloading}
                  style={{
                    padding: '9px 12px',
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

                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted, #64748b)', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} style={{ color: '#0ea5e9', flexShrink: 0 }} />
                  <span>
                    {selectedModel.includes('gemma4')
                      ? 'Gemma 4 Vision: High precision bank statement reader and title summarizer.'
                      : selectedModel.includes('qwen')
                      ? 'Qwen 2.5 Vision: World-class table extraction accuracy.'
                      : 'Standard offline AI model for financial transaction analysis.'}
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
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>Error: {downloadError}</span>
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
                    boxShadow: '0 2px 4px rgba(14, 165, 233, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={15} />
                  {isDownloading ? 'Installing Model...' : `Install ${selectedModel} (1-Click)`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishAndActivate}
                  style={{
                    padding: '9px 22px',
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
                  <CheckCircle2 size={16} />
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
