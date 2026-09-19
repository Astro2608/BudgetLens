import React, { useState } from 'react';
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
  const { currencyCode } = useCurrency();
  const [name, setName] = useState('');
  const [initialPrincipal, setInitialPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [termMonths, setTermMonths] = useState('');
  const [linkedTag, setLinkedTag] = useState('');
  const [fixedMonthlyPayment, setFixedMonthlyPayment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(initialPrincipal);
    const rate = parseFloat(interestRate);
    const months = parseInt(termMonths, 10);
    const payment = fixedMonthlyPayment ? parseFloat(fixedMonthlyPayment) : undefined;

    if (!name.trim() || isNaN(principal) || isNaN(rate) || isNaN(months) || !linkedTag.trim()) {
      return; // Basic validation
    }

    onAddLoan({
      name: name.trim(),
      initialPrincipal: principal,
      interestRate: rate,
      startDate,
      termMonths: months,
      linkedTag: linkedTag.trim().toLowerCase().replace(/\s+/g, '-'),
      fixedMonthlyPayment: payment && !isNaN(payment) ? payment : undefined
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
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Track a mortgage, auto loan, or student debt.</p>
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
            <label style={labelStyle}>Loan Name</label>
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
              <label style={labelStyle}>Initial Principal ({currencyCode})</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="50000"
                value={initialPrincipal}
                onChange={e => setInitialPrincipal(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Interest Rate (% p.a.)</label>
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
                required
                min="1"
                placeholder="60"
                value={termMonths}
                onChange={e => setTermMonths(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Smart Tracking Tag</label>
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
            <label style={labelStyle}>Fixed Monthly Payment (Optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Auto-calculated if blank"
              value={fixedMonthlyPayment}
              onChange={e => setFixedMonthlyPayment(e.target.value)}
              style={inputStyle}
            />
          </div>

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
            Add Loan
          </button>
        </form>
      </div>
    </div>
  );
};
