import React, { useState, useEffect } from 'react';

// Using simple SHA-256 via Web Crypto API
async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface PinLockProps {
  onUnlock: () => void;
}

export const PinLock: React.FC<PinLockProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  
  useEffect(() => {
    const storedHash = localStorage.getItem('BudgetLens_pin_hash');
    setIsSetup(!storedHash);
  }, []);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    const processPin = async () => {
      if (pin.length === 4) {
        const storedHash = localStorage.getItem('BudgetLens_pin_hash');
        const inputHash = await hashPin(pin);
        
        if (isSetup) {
          localStorage.setItem('BudgetLens_pin_hash', inputHash);
          onUnlock();
        } else {
          if (storedHash === inputHash) {
            onUnlock();
          } else {
            setError(true);
            setTimeout(() => setPin(''), 500);
          }
        }
      }
    };
    processPin();
  }, [pin, isSetup, onUnlock]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem'
      }}
    >
      <div
        style={{
          maxWidth: '320px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              margin: '0 auto 1rem auto'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
              {isSetup ? 'lock_reset' : 'lock'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
            {isSetup ? 'Set Security PIN' : 'Enter PIN'}
          </h2>
          <p style={{ fontSize: '14px', color: error ? '#ef4444' : 'var(--text-muted)', margin: 0, height: '20px' }}>
            {error ? 'Incorrect PIN. Try again.' : isSetup ? 'Create a 4-digit PIN to secure your data' : 'Enter your 4-digit PIN to unlock'}
          </p>
        </div>

        {/* PIN Dots */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '1rem 0' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: i < pin.length ? 'var(--color-primary)' : '#1e293b',
                transition: 'all 0.2s ease',
                boxShadow: i < pin.length ? '0 0 10px rgba(14, 165, 233, 0.5)' : 'none'
              }}
            />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseDown={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
              onMouseUp={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            >
              {num}
            </button>
          ))}
          <div /> {/* Empty slot for bottom-left */}
          <button
            onClick={() => handleKeyPress('0')}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'white')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>backspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
