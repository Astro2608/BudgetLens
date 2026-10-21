import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AccountVault, PRESET_VAULT_COLORS, PRESET_VAULT_ICONS } from '../types/account';
import { SUPPORTED_CURRENCIES } from '../config/currencyConfig';

interface AccountModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  accountToEdit?: AccountVault | null;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    currency: string;
    icon: string;
    color: string;
    initialBalance: number;
  }) => Promise<void>;
  onUpdate: (id: string, data: {
    name: string;
    description?: string;
    currency: string;
    icon: string;
    color: string;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  canDelete?: boolean;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  mode,
  accountToEdit,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  canDelete = false
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('SGD');
  const [icon, setIcon] = useState('account_balance');
  const [color, setColor] = useState('#10b981');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && accountToEdit) {
        setName(accountToEdit.name);
        setDescription(accountToEdit.description || '');
        setCurrency(accountToEdit.currency);
        setIcon(accountToEdit.icon);
        setColor(accountToEdit.color);
      } else {
        setName('');
        setDescription('');
        setCurrency('SGD');
        setIcon('account_balance');
        setColor('#10b981');
        setInitialBalance(0);
      }
      setIsDeleting(false);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, mode, accountToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a valid account name');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      if (mode === 'create') {
        await onCreate({
          name: name.trim(),
          description: description.trim(),
          currency,
          icon,
          color,
          initialBalance: Number(initialBalance) || 0
        });
      } else if (mode === 'edit' && accountToEdit) {
        await onUpdate(accountToEdit.id, {
          name: name.trim(),
          description: description.trim(),
          currency,
          icon,
          color
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToEdit || !onDelete) return;
    try {
      setIsSubmitting(true);
      await onDelete(accountToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account');
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 13, 22, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        padding: '1.25rem',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          margin: 'auto',
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(92vh, 680px)',
          overflow: 'hidden',
          animation: 'toastSlideUp 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Modal Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: `${color}18`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {icon}
              </span>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {mode === 'create' ? 'Create New Account / Vault' : `Edit: ${accountToEdit?.name}`}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {mode === 'create'
                  ? 'Set up an independent ledger with its own currency and baseline'
                  : 'Customize your vault settings, color, or icon'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Scrollable Form Body */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              overflowY: 'auto',
              flex: '1 1 auto',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {error && (
              <div
                style={{
                  padding: '0.625rem 0.875rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: 'var(--radius-md)',
                  color: '#ef4444',
                  fontSize: '12.5px',
                  fontWeight: 600
                }}
              >
                {error}
              </div>
            )}

            {/* Account Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Account Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. DBS Checking, Freelance Vault, Savings..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Description / Bank Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Daily expenses & salary deposit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Currency Selection & Initial Baseline */}
            <div style={{ display: 'grid', gridTemplateColumns: mode === 'create' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Account Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {mode === 'create' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    Starting Baseline Balance
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={initialBalance || ''}
                    onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Accent Color Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Theme Accent Color
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PRESET_VAULT_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    title={c.label}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: c.hex,
                      border: color === c.hex ? '3px solid var(--bg-card)' : 'none',
                      boxShadow: color === c.hex ? `0 0 0 2px ${c.hex}` : 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      transform: color === c.hex ? 'scale(1.15)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Vault Icon
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {PRESET_VAULT_ICONS.map((i) => (
                  <button
                    type="button"
                    key={i.name}
                    onClick={() => setIcon(i.name)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-md)',
                      border: icon === i.name ? `1.5px solid ${color}` : '1px solid var(--border-subtle)',
                      backgroundColor: icon === i.name ? `${color}14` : 'var(--bg-canvas-subtle)',
                      color: icon === i.name ? color : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {i.name}
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 600 }}>{i.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Delete Danger Section (Edit Mode Only) */}
            {mode === 'edit' && canDelete && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>Danger Zone</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Delete this account and all its scoped data
                    </div>
                  </div>
                  {!isDeleting ? (
                    <button
                      type="button"
                      onClick={() => setIsDeleting(true)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          opacity: isSubmitting ? 0.7 : 1
                        }}
                      >
                        {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeleting(false)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--bg-canvas-subtle)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Modal Footer */}
          <div
            style={{
              flexShrink: 0,
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1rem',
                backgroundColor: 'var(--bg-canvas-subtle)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '12.5px',
                backgroundColor: color,
                boxShadow: `0 4px 12px ${color}40`,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {mode === 'create' ? 'add' : 'check'}
              </span>
              <span>{isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Account' : 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
