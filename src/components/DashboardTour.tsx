import React, { useState, useEffect, useCallback } from 'react';

const TOUR_DONE_KEY = 'budgetlens_tour_done';

interface TourPoint {
  icon: string;
  title: string;
  text: string;
}

interface TourStep {
  targetSelector: string;
  badge: string;
  title: string;
  description: string;
  keyPoints: TourPoint[];
  position: 'bottom' | 'top' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '.tour-hero',
    badge: 'Step 1 of 5 • Money Summary',
    title: '💰 Bank Balance & Live Cash Status',
    description: 'Provides an accurate, real-time summary of your current bank balance and overall cashflow.',
    keyPoints: [
      {
        icon: 'account_balance_wallet',
        title: 'Safe-to-Spend Balance',
        text: 'The large dollar number displaying your live net balance (Starting Balance + Income - Expenses).'
      },
      {
        icon: 'label',
        title: 'Surplus / Deficit Text Tag',
        text: 'Look for the green text pill right next to your dollar balance: it shows "Current Bank Balance (Surplus)" in green, or "Deficit / Negative Balance" in red if spending goes over.'
      },
      {
        icon: 'payments',
        title: 'Total Money In & Money Out',
        text: 'Two summary cards below your balance showing total income received vs total expenses paid.'
      }
    ],
    position: 'bottom'
  },
  {
    targetSelector: '.tour-quick-entry',
    badge: 'Step 2 of 5 • Fast Data Entry',
    title: '⚡ 1-Liner Quick Log Bar',
    description: 'Log daily expenses or income in seconds without leaving your keyboard.',
    keyPoints: [
      {
        icon: 'edit_note',
        title: 'Title & Description Fields',
        text: 'Enter the Amount ➔ Title / Merchant Name ➔ optional Description ➔ pick Category & Date.'
      },
      {
        icon: 'palette',
        title: 'Dynamic Category Color Accent',
        text: 'The input box automatically updates its color accent to match your selected category.'
      },
      {
        icon: 'keyboard_return',
        title: 'Press Enter Anywhere',
        text: 'Press Enter on your keyboard at any point to instantly record the transaction into your ledger.'
      }
    ],
    position: 'bottom'
  },
  {
    targetSelector: '.tour-chart',
    badge: 'Step 3 of 5 • Visual Trends',
    title: '📊 Cash Flow Activity Chart',
    description: 'Visual breakdown showing how your money moves over days, weeks, and months.',
    keyPoints: [
      {
        icon: 'show_chart',
        title: 'Income vs Expense Bars',
        text: 'Green bars on top show incoming money (+); red bars below show expenses (-).'
      },
      {
        icon: 'calendar_month',
        title: 'Timeframe Filters',
        text: 'Switch chart timeline views between 1 Month, 3 Months, 1 Year, or All time.'
      }
    ],
    position: 'bottom'
  },
  {
    targetSelector: '.tour-donut',
    badge: 'Step 4 of 5 • Spending Breakdown',
    title: '🍩 Category Distribution Donut Chart',
    description: 'Visual breakdown showing which categories account for your largest expenditures.',
    keyPoints: [
      {
        icon: 'pie_chart',
        title: 'Categorized Slices',
        text: 'See the percentage allocation of your spending across Food, Bills, Rent, and Transport.'
      },
      {
        icon: 'touch_app',
        title: 'Interactive Inspection',
        text: 'Hover or tap any slice to view exact dollar amounts and percentage shares.'
      }
    ],
    position: 'top'
  },
  {
    targetSelector: 'center',
    badge: 'Step 5 of 5 • Extra Tools',
    title: '🌟 Dashboard Tools & Privacy Features',
    description: 'BudgetLens is 100% offline and browser-based to keep your data private.',
    keyPoints: [
      {
        icon: 'upload_file',
        title: 'Statement Import',
        text: 'Drop bank e-Statements (PDF, CSV, MD) to auto-extract transactions with verification safety.'
      },
      {
        icon: 'download',
        title: 'Export & Reset Backups',
        text: 'Export your ledger anytime to CSV or Markdown, or reset with full backup format choices.'
      },
      {
        icon: 'info',
        title: 'Info Tooltips (ℹ️)',
        text: 'Click the info button on any header to learn how metrics are calculated.'
      },
      {
        icon: 'currency_exchange',
        title: 'Multi-Currency Support',
        text: 'Switch your active currency code in Settings anytime (SGD, USD, EUR, GBP, etc.).'
      }
    ],
    position: 'center'
  }
];

interface DashboardTourProps {
  manualRun?: boolean;
  onTourEnd?: () => void;
}

export const DashboardTour: React.FC<DashboardTourProps> = ({ manualRun = false, onTourEnd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Trigger tour when manualRun changes to true
  useEffect(() => {
    if (manualRun) {
      setCurrentStepIdx(0);
      setIsOpen(true);
    }
  }, [manualRun]);

  const updateRect = useCallback(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStepIdx];
    if (!step || step.position === 'center' || step.targetSelector === 'center') {
      setTargetRect(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen, currentStepIdx]);

  useEffect(() => {
    updateRect();
    const handleResize = () => updateRect();
    const handleScroll = () => {
      const step = TOUR_STEPS[currentStepIdx];
      if (step && step.targetSelector !== 'center' && step.position !== 'center') {
        const el = document.querySelector(step.targetSelector);
        if (el) setTargetRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [updateRect, currentStepIdx]);

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_DONE_KEY, 'true');
    setIsOpen(false);
    onTourEnd?.();
  };

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIdx];
  const isCenter = currentStep.position === 'center' || !targetRect;
  const isTop = currentStep.position === 'top';

  const cardBaseStyle: React.CSSProperties = {
    width: '420px',
    maxWidth: 'calc(100vw - 32px)',
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '18px 20px',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.38), 0 0 0 1px rgba(226, 232, 240, 0.9)',
    animation: 'tourFadeScale 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  };

  let positionStyle: React.CSSProperties = {};

  if (targetRect && !isCenter) {
    const left = Math.max(16, Math.min(window.innerWidth - 440, targetRect.left + (targetRect.width / 2) - 210));
    if (isTop) {
      positionStyle = {
        position: 'fixed',
        zIndex: 99999,
        top: `${Math.max(16, targetRect.top - 280)}px`,
        left: `${left}px`,
        maxHeight: 'min(480px, calc(100vh - 48px))',
        transition: 'top 0.25s ease, left 0.25s ease'
      };
    } else {
      positionStyle = {
        position: 'fixed',
        zIndex: 99999,
        top: `${Math.min(window.innerHeight - 320, targetRect.bottom + 12)}px`,
        left: `${left}px`,
        maxHeight: 'min(480px, calc(100vh - 48px))',
        transition: 'top 0.25s ease, left 0.25s ease'
      };
    }
  }

  return (
    <>
      <style>{`
        @keyframes tourFadeScale {
          from { opacity: 0; transform: scale(0.96) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes tourPulseGlow {
          0%, 100% { box-shadow: 0 0 0 3px #10b981, 0 0 25px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 0 4px #059669, 0 0 35px rgba(16, 185, 129, 0.65); }
        }
      `}</style>

      {/* Dark Backdrop Mask */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(3px)',
          zIndex: 99990,
          pointerEvents: 'auto'
        }}
        onClick={handleComplete}
      />

      {/* Spotlight cutout border over the active element */}
      {targetRect && !isCenter && (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderRadius: '16px',
            border: '2px solid #10b981',
            zIndex: 99995,
            pointerEvents: 'none',
            animation: 'tourPulseGlow 2.5s infinite ease-in-out'
          }}
        />
      )}

      {/* Tour Step Popover Card */}
      {isCenter ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            pointerEvents: 'none',
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              ...cardBaseStyle,
              pointerEvents: 'auto',
              maxHeight: 'min(480px, calc(100vh - 36px))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Step Badge & Close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#047857',
                  backgroundColor: '#ecfdf5',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  border: '1px solid #a7f3d0'
                }}
              >
                {currentStep.badge}
              </span>
              <button
                onClick={handleComplete}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Skip Tour"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {/* Title */}
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>
              {currentStep.title}
            </h3>

            {/* Description */}
            <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: '#475569', lineHeight: 1.4, flexShrink: 0 }}>
              {currentStep.description}
            </p>

            {/* Scrollable Keypoints Container */}
            {currentStep.keyPoints && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '12px',
                  overflowY: 'auto',
                  flex: 1,
                  paddingRight: '4px'
                }}
              >
                {currentStep.keyPoints.map((point) => (
                  <div
                    key={point.title}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '7px 9px'
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '17px', color: '#10b981', marginTop: '1px', flexShrink: 0 }}
                    >
                      {point.icon}
                    </span>
                    <div style={{ fontSize: '12px', lineHeight: 1.35 }}>
                      <strong style={{ color: '#0f172a' }}>{point.title}: </strong>
                      <span style={{ color: '#475569' }}>{point.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sticky Footer Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid #e2e8f0',
                flexShrink: 0
              }}
            >
              <button
                onClick={handlePrev}
                disabled={currentStepIdx === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentStepIdx === 0 ? '#cbd5e1' : '#475569',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: currentStepIdx === 0 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                <span>Back</span>
              </button>

              {/* Dots Indicator */}
              <div style={{ display: 'flex', gap: '5px' }}>
                {TOUR_STEPS.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: i === currentStepIdx ? '16px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: i === currentStepIdx ? '#10b981' : '#cbd5e1',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                <span>{currentStepIdx === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {currentStepIdx === TOUR_STEPS.length - 1 ? 'done' : 'arrow_forward'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            ...cardBaseStyle,
            ...positionStyle
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: Step Badge & Close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#047857',
                backgroundColor: '#ecfdf5',
                padding: '3px 9px',
                borderRadius: '6px',
                border: '1px solid #a7f3d0'
              }}
            >
              {currentStep.badge}
            </span>
            <button
              onClick={handleComplete}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Skip Tour"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>

          {/* Title */}
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>
            {currentStep.title}
          </h3>

          {/* Description */}
          <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: '#475569', lineHeight: 1.4, flexShrink: 0 }}>
            {currentStep.description}
          </p>

          {/* Scrollable Keypoints Container */}
          {currentStep.keyPoints && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '12px',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '4px'
              }}
            >
              {currentStep.keyPoints.map((point) => (
                <div
                  key={point.title}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '7px 9px'
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '17px', color: '#10b981', marginTop: '1px', flexShrink: 0 }}
                  >
                    {point.icon}
                  </span>
                  <div style={{ fontSize: '12px', lineHeight: 1.35 }}>
                    <strong style={{ color: '#0f172a' }}>{point.title}: </strong>
                    <span style={{ color: '#475569' }}>{point.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sticky Footer Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid #e2e8f0',
              flexShrink: 0
            }}
          >
            <button
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              style={{
                background: 'none',
                border: 'none',
                color: currentStepIdx === 0 ? '#cbd5e1' : '#475569',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: currentStepIdx === 0 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
              <span>Back</span>
            </button>

            {/* Dots Indicator */}
            <div style={{ display: 'flex', gap: '5px' }}>
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: i === currentStepIdx ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: i === currentStepIdx ? '#10b981' : '#cbd5e1',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <span>{currentStepIdx === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {currentStepIdx === TOUR_STEPS.length - 1 ? 'done' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
