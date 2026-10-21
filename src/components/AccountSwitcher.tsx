import React, { useState, useRef, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { AccountVault } from '../types/account';
import { AccountModal } from './AccountModal';

export const AccountSwitcher: React.FC = () => {
  const {
    accounts,
    activeAccount,
    switchAccount,
    createAccount,
    updateAccount,
    deleteAccount
  } = useAccounts();

  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountVault | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenCreate = () => {
    setIsOpen(false);
    setModalMode('create');
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: AccountVault, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setModalMode('edit');
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  return (
    <>
      <div ref={containerRef} style={{ position: 'relative' }}>
        {/* Switcher Pill Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="account-switcher-trigger"
          title={`Active Account: ${activeAccount.name} (${activeAccount.currency})`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.35rem 0.65rem 0.35rem 0.45rem',
            backgroundColor: 'var(--bg-card)',
            border: `1.5px solid ${activeAccount.color}35`,
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          {/* Icon Badge */}
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: `${activeAccount.color}20`,
              color: activeAccount.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
              {activeAccount.icon || 'account_balance'}
            </span>
          </div>

          {/* Account Label & Currency */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: 'var(--text-main)',
                maxWidth: '130px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {activeAccount.name}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
              {activeAccount.currency} Vault
            </span>
          </div>

          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '18px',
              color: 'var(--text-subtle)',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease'
            }}
          >
            expand_more
          </span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              minWidth: '260px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 999,
              padding: '0.4rem',
              animation: 'headerDrawerSlide 0.15s ease-out'
            }}
          >
            {/* Dropdown Header */}
            <div
              style={{
                padding: '0.45rem 0.65rem 0.4rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.05em' }}>
                Accounts & Vaults
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-canvas-subtle)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  color: 'var(--text-muted)'
                }}
              >
                {accounts.length}
              </span>
            </div>

            {/* List of Accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '4px 0', maxHeight: '220px', overflowY: 'auto' }}>
              {accounts.map((acc) => {
                const isActive = acc.id === activeAccount.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      switchAccount(acc.id);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--bg-canvas-subtle)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-canvas-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '5px',
                          backgroundColor: `${acc.color}20`,
                          color: acc.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                          {acc.icon || 'account_balance'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: isActive ? 800 : 600,
                              color: 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '120px'
                            }}
                          >
                            {acc.name}
                          </span>
                          {isActive && (
                            <span
                              className="material-symbols-outlined fill"
                              style={{ fontSize: '14px', color: acc.color }}
                            >
                              check_circle
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {acc.currency}
                        </span>
                      </div>
                    </div>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(acc, e)}
                      title={`Edit ${acc.name}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-subtle)',
                        cursor: 'pointer',
                        padding: '3px',
                        display: 'flex',
                        borderRadius: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                        edit
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Dropdown Footer: Add New Account */}
            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '4px',
                marginTop: '2px'
              }}
            >
              <button
                type="button"
                onClick={handleOpenCreate}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-canvas-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                  add_circle
                </span>
                <span>Add New Account / Vault</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        mode={modalMode}
        accountToEdit={editingAccount}
        onClose={() => setIsModalOpen(false)}
        onCreate={async (data) => {
          await createAccount(data);
        }}
        onUpdate={async (id, data) => {
          await updateAccount(id, data);
        }}
        onDelete={async (id) => {
          await deleteAccount(id);
        }}
        canDelete={accounts.length > 1}
      />
    </>
  );
};
