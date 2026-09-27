import React, { useState, useMemo } from 'react';
import { Loan } from '../types/finance';
import { useCurrency } from '../context/CurrencyContext';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoan: (loan: Omit<Loan, 'id'>) => void;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  onAddLoan,
}) => {
  const { currencyCode, formatCurrency } = useCurrency();
  const [name, setName] = useState('');
  const [initialPrincipal, setInitialPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [termMonths, setTermMonths] = useState('');
  const [linkedTag, setLinkedTag] = useState('');
  const [fixedMonthlyPayment, setFixedMonthlyPayment] = useState('');

  // Calculate reverse estimation logic in real-time
  const calculation = useMemo(() => {
    const parsedPrincipal = parseFloat(initialPrincipal);
    const parsedRate = parseFloat(interestRate);
    const parsedTerm = parseInt(termMonths, 10);
    const parsedPayment = parseFloat(fixedMonthlyPayment);

    const isPrincipalProvided = !isNaN(parsedPrincipal) && parsedPrincipal > 0;
    const isRateProvided = !isNaN(parsedRate) && parsedRate >= 0;
    const isTermProvided = !isNaN(parsedTerm) && parsedTerm > 0;
    const isPaymentProvided = !isNaN(parsedPayment) && parsedPayment > 0;

    // Trigger reverse estimation if Monthly Payment & Interest Rate are provided while Principal or Term is missing
    const isReverseCalculation = isPaymentProvided && isRateProvided && (!isPrincipalProvided || !isTermProvided);

    let effectivePrincipal = isPrincipalProvided ? parsedPrincipal : 0;
    let effectiveTerm = isTermProvided ? parsedTerm : 60; // Default term to 60 months if missing
    const effectiveRate = isRateProvided ? parsedRate : 0;
    const effectivePayment = isPaymentProvided ? parsedPayment : 0;

    if (isReverseCalculation) {
      const monthlyRate = (effectiveRate / 100) / 12;

      // Case A: Missing Principal, but Payment & Term (or default 60m) exist
      if (!isPrincipalProvided && effectivePayment > 0) {
        if (monthlyRate === 0) {
          effectivePrincipal = effectivePayment * effectiveTerm;
        } else {
          const factor = Math.pow(1 + monthlyRate, effectiveTerm);
          effectivePrincipal = effectivePayment * ((factor - 1) / (monthlyRate * factor));
        }
      } 
      // Case B: Principal & Payment exist, but Term is missing
      else if (isPrincipalProvided && !isTermProvided && effectivePayment > 0) {
        if (monthlyRate === 0) {
          effectiveTerm = Math.max(1, Math.round(effectivePrincipal / effectivePayment));
        } else if (effectivePayment > effectivePrincipal * monthlyRate) {
          const calculatedTerm = Math.log(effectivePayment / (effectivePayment - effectivePrincipal * monthlyRate)) / Math.log(1 + monthlyRate);
          effectiveTerm = Math.max(1, Math.round(calculatedTerm));
        }
      }
    }

    return {
      isReverseCalculation,
      effectivePrincipal: Math.round(effectivePrincipal * 100) / 100,
      effectiveTerm,
      effectiveRate,
      effectivePayment,
      isPrincipalProvided,
      isTermProvided,
      isPaymentProvided,
      isRateProvided
    };
  }, [initialPrincipal, interestRate, termMonths, fixedMonthlyPayment]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { effectivePrincipal, effectiveTerm, effectiveRate, effectivePayment, isReverseCalculation } = calculation;

    if (!name.trim() || !linkedTag.trim()) {
      return;
    }

    if (effectivePrincipal <= 0 || effectiveTerm <= 0) {
      alert('Please enter either Initial Principal & Term OR Monthly Payment & Interest Rate.');
      return;
    }

    onAddLoan({
      name: name.trim(),
      initialPrincipal: effectivePrincipal,
      interestRate: effectiveRate,
      startDate: startDate || new Date().toISOString().split('T')[0],
      termMonths: effectiveTerm,
      linkedTag: linkedTag.trim().toLowerCase().replace(/\s+/g, '-'),
      fixedMonthlyPayment: effectivePayment > 0 ? effectivePayment : undefined,
      isReverseEstimated: isReverseCalculation
    });

    setName('');
    setInitialPrincipal('');
    setInterestRate('');
    setTermMonths('');
    setLinkedTag('');
    setFixedMonthlyPayment('');
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Add New Loan</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Track a mortgage, auto loan, or student debt. Leave unknown fields blank for reverse calculation.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px'
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={labelStyle}>Loan Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Master's Degree Loan"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                Initial Principal ({currencyCode})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={calculation.isReverseCalculation ? `Est. ${calculation.effectivePrincipal}` : "50000 (Optional)"}
                value={initialPrincipal}
                onChange={e => setInitialPrincipal(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: calculation.isReverseCalculation && !calculation.isPrincipalProvided ? '#3b82f6' : '#cbd5e1',
                  backgroundColor: calculation.isReverseCalculation && !calculation.isPrincipalProvided ? '#eff6ff' : '#f8fafc'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Interest Rate (% p.a.) *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="4.5"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Term (Months)</label>
              <input
                type="number"
                min="1"
                placeholder={calculation.isReverseCalculation && !calculation.isTermProvided ? `Est. ${calculation.effectiveTerm}m` : "60 (Optional)"}
                value={termMonths}
                onChange={e => setTermMonths(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: calculation.isReverseCalculation && !calculation.isTermProvided ? '#3b82f6' : '#cbd5e1',
                  backgroundColor: calculation.isReverseCalculation && !calculation.isTermProvided ? '#eff6ff' : '#f8fafc'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Smart Tracking Tag *</label>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b' }}>
              Any expense logged with this tag will automatically pay down this loan.
            </p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8', fontWeight: 600 }}>#</span>
              <input
                type="text"
                required
                placeholder="edu-loan"
                value={linkedTag}
                onChange={e => setLinkedTag(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '28px' }}
              />
            </div>
          </div>
          
          <div>
            <label style={labelStyle}>
              Monthly Payment ({currencyCode})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter monthly payment to reverse calculate initial loan"
              value={fixedMonthlyPayment}
              onChange={e => setFixedMonthlyPayment(e.target.value)}
              style={{
                ...inputStyle,
                borderColor: fixedMonthlyPayment ? '#2563eb' : '#cbd5e1'
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
              💡 Know what you pay monthly? Enter it here to estimate unknown fields.
            </p>
          </div>

          {/* Reverse Calculation Banner Notification */}
          {calculation.isReverseCalculation && (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1d4ed8', fontWeight: 700, fontSize: '13px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#2563eb' }}>auto_awesome</span>
                Reverse Calculation Activated
              </div>
              <div style={{ fontSize: '12.5px', color: '#1e3a8a', lineHeight: 1.4 }}>
                Estimated Initial Principal: <strong>{formatCurrency(calculation.effectivePrincipal)}</strong> (based on {formatCurrency(calculation.effectivePayment)}/mo at {calculation.effectiveRate}% p.a. over {calculation.effectiveTerm} months).
              </div>
              <div style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
                🏷️ Tagged as: "Reverse estimation cost" since unknown details were left blank.
              </div>
            </div>
          )}

          <button
            type="submit"
            style={{
              backgroundColor: '#0f172a',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0f172a'}
          >
            {calculation.isReverseCalculation ? 'Add Estimated Loan' : 'Add Loan'}
          </button>
        </form>
      </div>
    </div>
  );
};

