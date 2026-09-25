import React, { useState, useEffect } from 'react';
import { CategoryConfig, CategoryKey, TransactionType } from '../types/finance';
import { DEFAULT_CATEGORY_CONFIGS, getNextUniqueColor } from '../config/categoryConfig';
import { useCurrency } from '../context/CurrencyContext';
import {
  BankTemplate,
  getSavedBankTemplates,
  deleteCustomBankTemplate,
  BUILT_IN_TEMPLATES
} from '../utils/bankTemplates';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryConfigs: Record<CategoryKey, CategoryConfig>;
  onSaveCategoryConfigs: (configs: Record<CategoryKey, CategoryConfig>) => void;
  initialBalance: number;
  onSaveInitialBalance: (balance: number) => void;
  onResetDefaults: () => void;
}

const AVAILABLE_ICONS = [
  'restaurant', 'local_cafe', 'directions_subway', 'local_taxi',
  'bolt', 'apartment', 'payments', 'savings', 'shopping_bag',
  'fitness_center', 'flight', 'sports_esports', 'medical_services',
  'school', 'pets', 'work', 'redeem', 'category'
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  categoryConfigs,
  onSaveCategoryConfigs,
  initialBalance,
  onSaveInitialBalance,
  onResetDefaults
}) => {
  const { currencyCode, currencyInfo } = useCurrency();
  const [localConfigs, setLocalConfigs] = useState<Record<CategoryKey, CategoryConfig>>(categoryConfigs);
  const [localBalance, setLocalBalance] = useState<string>(initialBalance.toString());
  const [activeTab, setActiveTab] = useState<'categories' | 'balance' | 'bank_templates'>('categories');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedBankTemplates, setSavedBankTemplates] = useState<BankTemplate[]>([]);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('expense');
  const [newCatColor, setNewCatColor] = useState('#ec4899');
  const [newCatIcon, setNewCatIcon] = useState('category');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    setLocalConfigs(categoryConfigs);
    setLocalBalance(initialBalance.toString());
    setNewCatColor(getNextUniqueColor(categoryConfigs));
    if (isOpen) {
      const all = getSavedBankTemplates();
      setSavedBankTemplates(all.filter((t) => !t.isBuiltIn));
    }
  }, [categoryConfigs, initialBalance, isOpen]);

  const handleDeleteBankTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this custom bank template profile?')) {
      deleteCustomBankTemplate(id);
      const updated = getSavedBankTemplates().filter((t) => !t.isBuiltIn);
      setSavedBankTemplates(updated);
    }
  };

  if (!isOpen) return null;

  const handleOpenAddCategory = () => {
    setNewCatColor(getNextUniqueColor(localConfigs));
    setIsAddingCategory((prev) => !prev);
  };

  const handleColorChange = (key: CategoryKey, newColor: string) => {
    const duplicate = Object.values(localConfigs).find(
      (c) => c.key !== key && c.color.toLowerCase() === newColor.toLowerCase()
    );
    if (duplicate) {
      alert(`The color ${newColor.toUpperCase()} is already assigned to "${duplicate.label}". Each category must have a unique color code.`);
      return;
    }
    setLocalConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        color: newColor
      }
    }));
  };

  const handleLabelChange = (key: CategoryKey, newLabel: string) => {
    setLocalConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        label: newLabel
      }
    }));
  };

  const handleTypeChange = (key: CategoryKey, newType: TransactionType) => {
    setLocalConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        type: newType
      }
    }));
  };

  const handleAddTagToCategory = (key: CategoryKey, tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;
    setLocalConfigs((prev) => {
      const existingTags = prev[key].tags || [];
      if (existingTags.includes(cleanTag)) return prev;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          tags: [...existingTags, cleanTag]
        }
      };
    });
  };

  const handleRemoveTagFromCategory = (key: CategoryKey, tagToRemove: string) => {
    setLocalConfigs((prev) => {
      const existingTags = prev[key].tags || [];
      return {
        ...prev,
        [key]: {
          ...prev[key],
          tags: existingTags.filter((t) => t !== tagToRemove)
        }
      };
    });
  };

  const handleDeleteCategory = (key: CategoryKey) => {
    if (Object.keys(localConfigs).length <= 1) {
      alert('You must retain at least one category.');
      return;
    }
    setLocalConfigs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleAddNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const key = trimmed.replace(/[^a-zA-Z0-9]/g, '_');
    if (localConfigs[key]) {
      alert('A category with this name already exists.');
      return;
    }

    const duplicateColor = Object.values(localConfigs).find(
      (c) => c.color.toLowerCase() === newCatColor.toLowerCase()
    );
    if (duplicateColor) {
      alert(`The color ${newCatColor.toUpperCase()} is already assigned to "${duplicateColor.label}". Please select a unique color.`);
      return;
    }

    const newConfig: CategoryConfig = {
      key,
      label: trimmed,
      color: newCatColor,
      icon: newCatIcon,
      type: newCatType,
      keywords: [trimmed.toLowerCase()]
    };

    setLocalConfigs((prev) => ({
      ...prev,
      [key]: newConfig
    }));

    setNewCatName('');
    setIsAddingCategory(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all categories have unique colors
    const colorEntries = Object.values(localConfigs).map((c) => ({
      label: c.label,
      color: c.color.toLowerCase()
    }));
    const colorMap = new Map<string, string>();
    for (const entry of colorEntries) {
      if (colorMap.has(entry.color)) {
        alert(
          `Duplicate color detected: ${entry.color.toUpperCase()} is shared between "${colorMap.get(
            entry.color
          )}" and "${entry.label}". Each category must have a unique color code.`
        );
        return;
      }
      colorMap.set(entry.color, entry.label);
    }

    onSaveCategoryConfigs(localConfigs);

    const parsedBalance = parseFloat(localBalance);
    if (!isNaN(parsedBalance) && parsedBalance >= 0) {
      onSaveInitialBalance(parsedBalance);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 400);
  };

  const handleReset = () => {
    if (window.confirm('Reset all categories, colors, and baseline balance to defaults?')) {
      onResetDefaults();
      setLocalConfigs(DEFAULT_CATEGORY_CONFIGS);
      setLocalBalance('50000');
    }
  };

  const categories = Object.values(localConfigs);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '680px',
          height: '88vh',
          maxHeight: '820px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>tune</span>
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                System Settings
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Customize expandable categories, direct color swatches, and opening baseline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px'
            }}
            title="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div style={{ padding: '0.75rem 1.5rem 0.25rem 1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'categories' ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: 700,
              fontSize: '13px',
              color: activeTab === 'categories' ? 'var(--color-primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'categories' ? 'var(--color-primary-light)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>category</span>
            <span>Dynamic Category Manager ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('balance')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'balance' ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: 700,
              fontSize: '13px',
              color: activeTab === 'balance' ? 'var(--color-primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'balance' ? 'var(--color-primary-light)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_balance</span>
            <span>Baseline Account Balance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank_templates')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'bank_templates' ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: 700,
              fontSize: '13px',
              color: activeTab === 'bank_templates' ? 'var(--color-primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'bank_templates' ? 'var(--color-primary-light)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_column</span>
            <span>Bank Statement Templates ({savedBankTemplates.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeTab === 'categories' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    Tap any color swatch directly to change color, rename categories, or add new custom categories:
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddCategory}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary-light)',
                      border: '1px solid var(--color-primary-border)',
                      color: 'var(--color-primary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {isAddingCategory ? 'close' : 'add'}
                    </span>
                    <span>{isAddingCategory ? 'Cancel' : 'Add New Category'}</span>
                  </button>
                </div>

                {/* Add New Category Panel */}
                {isAddingCategory && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: '#f8fafc',
                      border: '1px dashed var(--color-primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                      Create Custom Category
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Category Name (e.g. Gym & Fitness, Shopping)"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '12px',
                          fontWeight: 600,
                          outline: 'none',
                          backgroundColor: '#ffffff'
                        }}
                      />

                      <select
                        value={newCatType}
                        onChange={(e) => setNewCatType(e.target.value as TransactionType)}
                        style={{
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '12px',
                          backgroundColor: '#ffffff',
                          outline: 'none'
                        }}
                      >
                        <option value="expense">Expense (-)</option>
                        <option value="income">Income (+)</option>
                        <option value="savings">Savings (Vault)</option>
                      </select>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Direct Color Picker */}
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: newCatColor,
                            border: '2px solid #ffffff',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer'
                          }}
                          title="Click to choose color"
                        >
                          <input
                            type="color"
                            value={newCatColor}
                            onChange={(e) => setNewCatColor(e.target.value)}
                            style={{
                              position: 'absolute',
                              inset: '-10px',
                              width: '50px',
                              height: '50px',
                              cursor: 'pointer',
                              opacity: 0
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAddNewCategory}
                          disabled={!newCatName.trim()}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Icon Picker Strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Icon:</span>
                      {AVAILABLE_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewCatIcon(icon)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: newCatIcon === icon ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                            backgroundColor: newCatIcon === icon ? 'var(--color-primary-light)' : '#ffffff',
                            color: newCatIcon === icon ? 'var(--color-primary)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {categories.map((cat) => (
                    <div
                      key={cat.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--bg-canvas-subtle)',
                        border: '1px solid var(--border-subtle)',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      {/* Left: Color Icon Button in front of Text & Category Label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '220px' }}>
                        {/* Interactive Color Swatch Icon */}
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: `${cat.color}25`,
                            color: cat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            cursor: 'pointer',
                            border: `2px solid ${cat.color}`,
                            flexShrink: 0
                          }}
                          title="Click to change color"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            {cat.icon || 'category'}
                          </span>
                          <input
                            type="color"
                            value={cat.color}
                            onChange={(e) => handleColorChange(cat.key, e.target.value)}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              opacity: 0,
                              cursor: 'pointer'
                            }}
                            title="Tap to pick custom color"
                          />
                        </div>

                        {/* Editable Label */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <input
                            type="text"
                            value={cat.label}
                            onChange={(e) => handleLabelChange(cat.key, e.target.value)}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'var(--text-main)',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              outline: 'none'
                            }}
                          />
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                            Key: {cat.key} • Color: <strong>{cat.color.toUpperCase()}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Type Dropdown & Delete Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={cat.type}
                          onChange={(e) => handleTypeChange(cat.key, e.target.value as TransactionType)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            color: 'var(--text-main)'
                          }}
                        >
                          <option value="expense">Expense (-)</option>
                          <option value="income">Income (+)</option>
                          <option value="savings">Savings (Vault)</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.key)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                          title={`Delete ${cat.label}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ef4444' }}>
                            delete
                          </span>
                        </button>
                      </div>

                      {/* Sub-row: Category Preset Tags */}
                      <div style={{ width: '100%', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>label</span>
                          Preset Tags:
                        </span>
                        {(cat.tags || []).map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: cat.color,
                              backgroundColor: `${cat.color}15`,
                              border: `1px solid ${cat.color}35`,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            #{t}
                            <button
                              type="button"
                              onClick={() => handleRemoveTagFromCategory(cat.key, t)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: cat.color,
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: '11px',
                                lineHeight: 1,
                                fontWeight: 800
                              }}
                              title={`Remove tag #${t}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder="+ add tag (Enter)"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTagToCategory(cat.key, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: '#ffffff',
                            width: '110px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'balance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Initial Baseline Opening Balance ({currencyCode})
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    This represents your liquid starting capital before recorded transactions. The total balance and runway longevity automatically calculate from this baseline.
                  </p>
                  <div style={{ position: 'relative', maxWidth: '320px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)', fontSize: '14px' }}>
                      {currencyInfo.prefix}
                    </span>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={localBalance}
                      onChange={(e) => setLocalBalance(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 65px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-input)',
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(240, 253, 250, 0.7)',
                    border: '1px solid var(--color-primary-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px', flexShrink: 0 }}>
                    info
                  </span>
                  <p style={{ fontSize: '12px', color: '#115e59', lineHeight: 1.45, margin: 0 }}>
                    Formula applied: <strong>Current Bank Balance = Baseline + Total Inflow - Total Outflow (excluding Savings)</strong>.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'bank_templates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Section 1: Saved Custom Profiles */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                        Your Saved Custom Bank Profiles ({savedBankTemplates.length})
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        Custom column mappings created via the e-Statement Column Mapper
                      </p>
                    </div>
                  </div>

                  {savedBankTemplates.length === 0 ? (
                    <div
                      style={{
                        padding: '2rem 1rem',
                        textAlign: 'center',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px dashed #cbd5e1',
                        color: '#64748b',
                        fontSize: '12.5px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                        view_column
                      </span>
                      <strong>No Custom Bank Profiles Saved Yet</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                        When uploading bank statements, click <strong>[Map Columns] → Save as Bank Profile</strong> to store custom column layouts here for instant reuse!
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {savedBankTemplates.map((tmpl) => (
                        <div
                          key={tmpl.id}
                          style={{
                            padding: '0.875rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                                fontWeight: 800,
                                fontSize: '11px',
                                border: '1px solid var(--color-primary-border)'
                              }}
                            >
                              {tmpl.currency || 'GEN'}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                                {tmpl.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                <span>Date: Col {tmpl.mapping.dateCol + 1}</span>
                                <span>Desc: Col {tmpl.mapping.descCol + 1}</span>
                                {tmpl.mapping.debitCol != null && <span>Debit: Col {tmpl.mapping.debitCol + 1}</span>}
                                {tmpl.mapping.creditCol != null && <span>Credit: Col {tmpl.mapping.creditCol + 1}</span>}
                                {tmpl.mapping.balanceCol != null && <span>Bal: Col {tmpl.mapping.balanceCol + 1}</span>}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteBankTemplate(tmpl.id)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#fee2e2',
                              color: '#ef4444',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Delete this saved profile"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                            Delete Profile
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Preset Global Bank Templates Explorer */}
                <div style={{ marginTop: '0.5rem' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                    Built-in Bank Presets Explorer
                  </h3>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Pre-configured auto-detecting bank statement templates provided out-of-the-box
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.625rem' }}>
                    {BUILT_IN_TEMPLATES.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        style={{
                          padding: '0.75rem 0.875rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          fontSize: '11.5px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '12px', color: 'var(--text-main)' }}>{tmpl.name}</strong>
                          <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                            {tmpl.currency}
                          </span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '10.5px' }}>
                          Auto-detects: {tmpl.signatureKeywords.slice(0, 3).join(', ')}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: '#fafbfc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restart_alt</span>
              <span>Reset Defaults</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                style={{ fontSize: '13px', padding: '0.5rem 1rem' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  fontSize: '13px',
                  padding: '0.5rem 1.25rem',
                  backgroundColor: saveSuccess ? '#10b981' : undefined
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {saveSuccess ? 'check' : 'save'}
                </span>
                <span>{saveSuccess ? 'Applied!' : 'Save & Apply'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
