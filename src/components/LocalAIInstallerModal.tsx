import React, { useState, useEffect } from 'react';
import {
  checkOllamaStatus,
  saveLocalAiConfig,
  OllamaModel
} from '../utils/localAiService';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  X,
  ShieldCheck,
  Layers,
  Check,
  Loader2,
  Zap,
  Play
} from 'lucide-react';

interface LocalAIInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: (modelName: string) => void;
}

interface StreamEvent {
  step: number;
  stage: string;
  title?: string;
  message?: string;
  percent?: number;
  completed?: number;
  total?: number;
  model?: string;
  success?: boolean;
  error?: string;
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
  const [installSuccess, setInstallSuccess] = useState(false);

  // Automated 1-Click setup states
  const [isAutomating, setIsAutomating] = useState(false);
  const [autoStep, setAutoStep] = useState<number>(1);
  const [autoTitle, setAutoTitle] = useState<string>('Initializing...');
  const [autoMessage, setAutoMessage] = useState<string>('');
  const [autoPercent, setAutoPercent] = useState<number | null>(null);
  const [autoError, setAutoError] = useState<string | null>(null);

  // Poll status from backend
  const verifyConnection = async () => {
    setIsChecking(true);
    setAutoError(null);
    try {
      // 1. Check via Vite backend automation status endpoint
      const res = await fetch('/api/local-ai/status');
      if (res.ok) {
        const data = await res.json();
        const connected = Boolean(data.isRunning);
        setIsConnected(connected);

        if (data.models && data.models.length > 0) {
          const mappedModels: OllamaModel[] = data.models.map((name: string) => ({
            name,
            size: 0,
            modified_at: ''
          }));
          setModels(mappedModels);
        }

        const active = data.recommendedModel || 'gemma4:e4b';
        setSelectedModel(active);

        if (connected && data.hasVisionModel) {
          setInstallSuccess(true);
        }
      } else {
        // Fallback to direct client-side check
        const clientStatus = await checkOllamaStatus();
        setIsConnected(clientStatus.isConnected);
        setModels(clientStatus.models);
        if (clientStatus.recommendedModel) {
          setSelectedModel(clientStatus.recommendedModel);
        }
        const hasExisting = clientStatus.models.some((m) =>
          m.name.toLowerCase().includes('gemma4') ||
          m.name.toLowerCase().includes('qwen') ||
          m.name.toLowerCase().includes('vision')
        );
        if (clientStatus.isConnected && hasExisting) {
          setInstallSuccess(true);
        }
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Run 1-Click automated background setup
  const handleRunAutomatedSetup = () => {
    setIsAutomating(true);
    setAutoError(null);
    setAutoStep(1);
    setAutoTitle('Starting Setup Engine...');
    setAutoMessage('Connecting to local installation pipeline...');
    setAutoPercent(null);

    const eventSource = new EventSource('/api/local-ai/setup-stream');

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);

        if (data.error) {
          setAutoError(data.error);
          setIsAutomating(false);
          eventSource.close();
          return;
        }

        if (data.step) setAutoStep(data.step);
        if (data.title) setAutoTitle(data.title);
        if (data.message) setAutoMessage(data.message);
        if (data.percent !== undefined) setAutoPercent(data.percent);

        if (data.stage === 'completed' || data.success) {
          setInstallSuccess(true);
          setIsConnected(true);
          if (data.model) setSelectedModel(data.model);
          saveLocalAiConfig({ enabled: true, selectedModel: data.model || selectedModel });
          setIsAutomating(false);
          eventSource.close();
          verifyConnection();
        }
      } catch (err: any) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsAutomating(false);
      verifyConnection();
    };
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
        if (e.target === e.currentTarget && !isAutomating) onClose();
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

          {!isAutomating && (
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
                  backgroundColor: isConnected ? '#10b981' : isAutomating && autoStep === 1 ? '#0ea5e9' : '#cbd5e1',
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
                  backgroundColor: installSuccess ? '#10b981' : isAutomating && autoStep === 2 ? '#0ea5e9' : isConnected ? '#0ea5e9' : '#cbd5e1',
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

          {/* Loading initial status */}
          {isChecking && !isConnected && !isAutomating && (
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
              <span>Verifying local AI engine status...</span>
            </div>
          )}

          {/* Automated Setup In Progress Card */}
          {isAutomating && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: '#0284c7' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0369a1' }}>
                      {autoTitle}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#0284c7' }}>
                      {autoMessage}
                    </p>
                  </div>
                </div>
                {autoPercent !== null && (
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>
                    {autoPercent}%
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: '8px',
                  borderRadius: '999px',
                  backgroundColor: '#e0f2fe',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: autoPercent !== null ? `${autoPercent}%` : '50%',
                    backgroundColor: '#0284c7',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              <span style={{ fontSize: '11px', color: '#0369a1', opacity: 0.85 }}>
                Automated installation is in progress. Please keep this window open.
              </span>
            </div>
          )}

          {/* Scenario A: Engine Not Ready Yet (1-Click Automated Action) */}
          {!isConnected && !isChecking && !isAutomating && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Zap size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    1-Click Automated AI Setup
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                    BudgetLens will automatically detect, launch, and configure the local offline AI engine on your computer. Zero command line or manual configuration required.
                  </p>
                </div>
              </div>

              {/* Big 1-Click Action Button */}
              <button
                type="button"
                onClick={handleRunAutomatedSetup}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  backgroundColor: '#0ea5e9',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Play size={18} fill="#ffffff" />
                Start 1-Click Automated Setup
              </button>

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
                <span>Already running Ollama in your system tray?</span>
                <button
                  type="button"
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
          )}

          {/* Scenario B: Connected & Ready */}
          {isConnected && !isAutomating && (
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
                      {m.name}
                    </option>
                  ))}
                  {!models.some((m) => m.name.includes('gemma4:e4b')) && (
                    <option value="gemma4:e4b">gemma4:e4b (Recommended)</option>
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
            </div>
          )}

          {autoError && (
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
              <span>Error: {autoError}</span>
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
            disabled={isAutomating}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              backgroundColor: 'transparent',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isAutomating ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted, #64748b)'
            }}
          >
            Cancel / Opt-Out
          </button>

          {isConnected && (
            <button
              type="button"
              onClick={handleFinishAndActivate}
              disabled={isAutomating}
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
      </div>
    </div>
  );
};
