/**
 * Lumina Finance Dashboard - UI Controller & DOM Renderer
 * Manages UI reactivity, transaction lists, category pills, modals, and toasts.
 */

import { calculateRunway } from './runway.js';

export class UIController {
  constructor(stateManager, chartInstance, csvParser) {
    this.state = stateManager;
    this.chart = chartInstance;
    this.csvParser = csvParser;
    this.pendingCSVTransactions = [];
  }

  init() {
    this.bindDOM();
    this.bindEvents();
    this.renderAll();
    
    // Subscribe to state updates
    this.state.subscribe(() => {
      this.renderAll();
    });
  }

  bindDOM() {
    // Hero Elements
    this.heroBankAmount = document.getElementById('hero-bank-val');
    this.heroIncomeVal = document.getElementById('hero-income-val');
    this.heroExpenseVal = document.getElementById('hero-expense-val');
    this.heroNetVal = document.getElementById('hero-net-val');
    this.safeSpendVal = document.getElementById('safe-spend-val');
    this.safeSpendFill = document.getElementById('safe-spend-fill');
    this.safeSpendPct = document.getElementById('safe-spend-pct');
    this.heroSafeWeekly = document.getElementById('hero-safe-weekly');

    // Transaction List & Filters
    this.txListBody = document.getElementById('tx-list-body');
    this.txCountLabel = document.getElementById('tx-count-label');
    this.filterChips = document.querySelectorAll('.filter-chip');
    this.searchInput = document.getElementById('header-search-input');

    // Runway Elements
    this.runwayHeadline = document.getElementById('runway-headline-text');
    this.categoryRunwayList = document.getElementById('category-runway-list');
    this.runwaySlider = document.getElementById('runway-slider');
    this.sliderDisplay = document.getElementById('slider-display');

    // Currency Switcher
    this.currencySelect = document.getElementById('currency-selector');

    // Timeframe Buttons
    this.timeframeBtns = document.querySelectorAll('.timeframe-btn');

    // Modals
    this.addTxModal = document.getElementById('add-tx-modal');
    this.csvModal = document.getElementById('csv-modal');
    this.settingsModal = document.getElementById('settings-modal');

    // Toast
    this.toastContainer = document.getElementById('toast-container');
  }

  bindEvents() {
    // Currency Switcher
    if (this.currencySelect) {
      this.currencySelect.value = this.state.getState().currency;
      this.currencySelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const symbols = {
          'SGD': 'SGD $',
          'USD': '$',
          'EUR': '€',
          'GBP': '£',
          'AUD': 'A$',
          'MYR': 'RM'
        };
        this.state.setCurrency(val, symbols[val] || `${val} `);
        this.showToast(`Currency switched to ${val}`);
      });
    }

    // Timeframe buttons
    this.timeframeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.timeframeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tf = btn.getAttribute('data-tf');
        this.state.setTimeframe(tf);
      });
    });

    // Transaction filter chips
    this.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.getAttribute('data-filter');
        this.state.setFilter(filter);
      });
    });

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.state.setSearchQuery(e.target.value);
      });
    }

    // Runway Sensitivity Slider
    if (this.runwaySlider) {
      this.runwaySlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        let mult = 1.0;
        let label = 'Baseline (1.0x)';
        if (val === 1) {
          mult = 0.85;
          label = 'Lean (-15% spend)';
        } else if (val === 2) {
          mult = 1.0;
          label = 'Baseline (Current Avg)';
        } else {
          mult = 1.25;
          label = 'Cautious (+25% buffer)';
        }
        if (this.sliderDisplay) this.sliderDisplay.innerText = label;
        this.state.setSensitivity(mult);
      });
    }

    // Add Transaction Modal
    const openAddBtn = document.getElementById('open-add-tx-btn');
    const closeAddBtn = document.getElementById('close-add-tx');
    const cancelAddBtn = document.getElementById('cancel-add-tx');
    const addTxForm = document.getElementById('add-tx-form');
    const typeIncomeBtn = document.getElementById('type-toggle-income');
    const typeExpenseBtn = document.getElementById('type-toggle-expense');
    const txTypeInput = document.getElementById('input-tx-type');
    const categorySelect = document.getElementById('input-tx-cat');

    if (openAddBtn) openAddBtn.addEventListener('click', () => this.openAddModal());
    if (closeAddBtn) closeAddBtn.addEventListener('click', () => this.closeAddModal());
    if (cancelAddBtn) cancelAddBtn.addEventListener('click', () => this.closeAddModal());

    if (typeIncomeBtn && typeExpenseBtn) {
      typeIncomeBtn.addEventListener('click', () => {
        typeIncomeBtn.classList.add('active', 'income');
        typeExpenseBtn.classList.remove('active', 'expense');
        txTypeInput.value = 'income';
        this.populateCategorySelect(categorySelect, 'income');
      });
      typeExpenseBtn.addEventListener('click', () => {
        typeExpenseBtn.classList.add('active', 'expense');
        typeIncomeBtn.classList.remove('active', 'income');
        txTypeInput.value = 'expense';
        this.populateCategorySelect(categorySelect, 'expense');
      });
    }

    if (addTxForm) {
      addTxForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('input-tx-title').value;
        const amount = parseFloat(document.getElementById('input-tx-amount').value);
        const type = txTypeInput.value;
        const categoryId = categorySelect.value;
        const date = document.getElementById('input-tx-date').value || new Date().toISOString().split('T')[0];
        const isRecurring = document.getElementById('input-tx-recurring').checked;

        this.state.addTransaction({
          title,
          amount,
          type,
          categoryId,
          date,
          isRecurring,
          note: 'Manual Record'
        });

        this.showToast(`Recorded: ${title} (${type === 'income' ? '+' : '-'}${this.state.formatCurrency(amount)})`);
        addTxForm.reset();
        this.closeAddModal();
      });
    }

    // CSV Importer Dropzone & File Input
    const dropzone = document.getElementById('csv-dropzone');
    const fileInput = document.getElementById('csv-file-input');
    const loadSampleBtn = document.getElementById('load-sample-csv-btn');
    const downloadTemplateBtn = document.getElementById('download-template-csv-btn');
    const confirmImportBtn = document.getElementById('confirm-csv-import-btn');
    const closeCSVBtn = document.getElementById('close-csv-modal');
    const cancelCSVBtn = document.getElementById('cancel-csv-modal');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleCSVFile(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleCSVFile(e.target.files[0]);
        }
      });
    }

    if (loadSampleBtn) {
      loadSampleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const sampleText = this.csvParser.getSampleCSVContent();
        const parsed = await this.csvParser.parseCSVText(sampleText);
        this.showCSVPreviewModal(parsed);
      });
    }

    if (downloadTemplateBtn) {
      downloadTemplateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sampleText = this.csvParser.getSampleCSVContent();
        const blob = new Blob([sampleText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'lumina_bank_statement_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast('Template CSV downloaded successfully!');
      });
    }

    if (confirmImportBtn) {
      confirmImportBtn.addEventListener('click', () => {
        if (this.pendingCSVTransactions.length > 0) {
          this.state.addTransactionsBatch(this.pendingCSVTransactions);
          this.showToast(`Imported ${this.pendingCSVTransactions.length} transactions from e-Statement!`);
          this.pendingCSVTransactions = [];
          this.closeCSVModal();
        }
      });
    }

    if (closeCSVBtn) closeCSVBtn.addEventListener('click', () => this.closeCSVModal());
    if (cancelCSVBtn) cancelCSVBtn.addEventListener('click', () => this.closeCSVModal());

    // Settings Modal
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const openSettingsNav = document.getElementById('open-settings-nav');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const resetDataBtn = document.getElementById('reset-demo-data-btn');
    const addCatForm = document.getElementById('add-custom-cat-form');
    const initialBalInput = document.getElementById('settings-initial-balance');
    const saveBalBtn = document.getElementById('save-balance-btn');

    if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => this.openSettingsModal());
    if (openSettingsNav) openSettingsNav.addEventListener('click', (e) => { e.preventDefault(); this.openSettingsModal(); });
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());

    if (saveBalBtn && initialBalInput) {
      saveBalBtn.addEventListener('click', () => {
        const val = parseFloat(initialBalInput.value);
        if (!isNaN(val)) {
          this.state.setInitialBankBalance(val);
          this.showToast('Initial Bank Balance updated!');
        }
      });
    }

    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', () => {
        if (confirm('Reset all transactions and categories back to clean prototype defaults?')) {
          this.state.resetToDefaultData();
          this.showToast('Reset back to default demo data.');
          this.closeSettingsModal();
        }
      });
    }

    if (addCatForm) {
      addCatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-cat-name').value;
        const color = document.getElementById('new-cat-color').value;
        const type = document.getElementById('new-cat-type').value;
        const kwString = document.getElementById('new-cat-keywords').value;
        const keywords = kwString.split(',').map(s => s.trim()).filter(Boolean);

        this.state.addCustomCategory(name, color, type, keywords);
        this.showToast(`Added custom category: ${name}`);
        addCatForm.reset();
        this.renderCategoryManager();
      });
    }

    // Quick-Add Outflow Buttons
    const quickAddContainer = document.getElementById('quick-add-group');
    if (quickAddContainer) {
      quickAddContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-pill-btn');
        if (!btn) return;
        const title = btn.getAttribute('data-title');
        const amount = parseFloat(btn.getAttribute('data-amount'));
        const catId = btn.getAttribute('data-cat-id');

        this.state.addTransaction({
          title,
          amount,
          type: 'expense',
          categoryId: catId,
          date: new Date().toISOString().split('T')[0],
          isRecurring: false,
          note: '1-Click Quick Add'
        });

        this.showToast(`Logged: ${title} (-${this.state.formatCurrency(amount)})`);
      });
    }

    // Global Keyboard Shortcuts (N = New Expense, S = Settings, Esc = Close Modals)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.openAddModal();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.openSettingsModal();
      } else if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  async handleCSVFile(file) {
    try {
      this.showToast(`Parsing ${file.name}...`);
      const parsed = await this.csvParser.parseFile(file);
      this.showCSVPreviewModal(parsed);
    } catch (err) {
      this.showToast(`Error parsing CSV: ${err.message}`, 'error');
    }
  }

  showCSVPreviewModal(transactions) {
    this.pendingCSVTransactions = transactions;
    const tableBody = document.getElementById('csv-preview-body');
    const rowCountEl = document.getElementById('csv-preview-count');
    if (!tableBody) return;

    if (rowCountEl) rowCountEl.innerText = `${transactions.length} rows extracted`;

    let html = '';
    transactions.forEach((tx, idx) => {
      const cat = this.state.getCategoryById(tx.categoryId);
      const isIncome = tx.type === 'income';

      html += `
        <tr>
          <td>${tx.date}</td>
          <td>
            <div style="font-weight: 700;">${tx.title}</div>
            <div style="font-size: 10px; color: #94a3b8;">${tx.note}</div>
          </td>
          <td>
            <select class="form-select csv-cat-select" data-tx-idx="${idx}" style="padding: 2px 6px; font-size: 11px;">
              ${this.state.getState().categories.map(c => 
                `<option value="${c.id}" ${c.id === tx.categoryId ? 'selected' : ''}>${c.name}</option>`
              ).join('')}
            </select>
          </td>
          <td style="text-align: right; font-weight: 800; color: ${isIncome ? '#10b981' : '#0f172a'};">
            ${isIncome ? '+' : '-'}${this.state.formatCurrency(tx.amount)}
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    // Attach category change listeners in preview table
    tableBody.querySelectorAll('.csv-cat-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-tx-idx'));
        if (this.pendingCSVTransactions[idx]) {
          this.pendingCSVTransactions[idx].categoryId = e.target.value;
        }
      });
    });

    if (this.csvModal) this.csvModal.classList.add('open');
  }

  renderAll() {
    this.renderHero();
    this.renderTransactionList();
    this.renderRunway();
    this.chart.render();
  }

  renderHero() {
    const currentBank = this.state.getCurrentBankBalance();
    const income = this.state.getTotalIncome();
    const expenses = this.state.getTotalExpenses();
    const net = income - expenses;

    if (this.heroBankAmount) {
      this.heroBankAmount.innerText = this.state.formatCurrency(currentBank);
    }
    if (this.heroIncomeVal) {
      this.heroIncomeVal.innerText = `+${this.state.formatCurrency(income)}`;
    }
    if (this.heroExpenseVal) {
      this.heroExpenseVal.innerText = `-${this.state.formatCurrency(expenses)}`;
    }
    if (this.heroNetVal) {
      this.heroNetVal.innerText = net >= 0 ? `+${this.state.formatCurrency(net)}` : `-${this.state.formatCurrency(Math.abs(net))}`;
      this.heroNetVal.style.color = net >= 0 ? 'var(--income-green)' : 'var(--expense-red)';
    }

    // Weekly safe spend headroom
    const weeklySafe = Math.max(0, currentBank * 0.08); // 8% safe rule
    if (this.heroSafeWeekly) {
      this.heroSafeWeekly.innerText = this.state.formatCurrency(weeklySafe);
    }

    // Sidebar Safe Spend
    const safeSpendRatio = currentBank > 0 ? Math.min(100, Math.round((currentBank / (currentBank + expenses * 0.5)) * 100)) : 0;
    if (this.safeSpendVal) this.safeSpendVal.innerText = this.state.formatCurrency(currentBank);
    if (this.safeSpendFill) this.safeSpendFill.style.width = `${safeSpendRatio}%`;
    if (this.safeSpendPct) this.safeSpendPct.innerText = `${safeSpendRatio}%`;
  }

  renderTransactionList() {
    if (!this.txListBody) return;
    const state = this.state.getState();
    const { activeFilter, searchQuery, transactions } = state;

    let filtered = transactions;

    if (activeFilter === 'income') {
      filtered = filtered.filter(t => t.type === 'income');
    } else if (activeFilter === 'expense') {
      filtered = filtered.filter(t => t.type === 'expense');
    } else if (activeFilter === 'recurring') {
      filtered = filtered.filter(t => t.isRecurring);
    }

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery) ||
        (t.note && t.note.toLowerCase().includes(searchQuery)) ||
        this.state.getCategoryById(t.categoryId).name.toLowerCase().includes(searchQuery)
      );
    }

    if (this.txCountLabel) {
      this.txCountLabel.innerText = `Showing ${filtered.length} of ${transactions.length} total entries`;
    }

    if (filtered.length === 0) {
      this.txListBody.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: #94a3b8; font-size: 0.8125rem;">
          <span class="material-symbols-outlined" style="font-size: 32px; color: #cbd5e1; margin-bottom: 0.5rem;">receipt_long</span>
          <div>No transactions match your current filter.</div>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(tx => {
      const cat = this.state.getCategoryById(tx.categoryId);
      const isIncome = tx.type === 'income';

      html += `
        <div class="tx-item" data-tx-id="${tx.id}">
          <div class="tx-left">
            <div class="tx-icon-box" style="background-color: ${cat.color}15; color: ${cat.color};">
              <span class="material-symbols-outlined">${cat.icon || (isIncome ? 'payments' : 'receipt_long')}</span>
            </div>
            <div class="tx-details">
              <div class="tx-title-row">
                <span class="tx-title" title="${tx.title}">${tx.title}</span>
                <span class="category-badge" style="background-color: ${cat.color}18; color: ${cat.color}; border: 1px solid ${cat.color}40;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: ${cat.color};"></span>
                  ${cat.name}
                </span>
                ${tx.isRecurring ? '<span class="category-badge" style="background-color: #f1f5f9; color: #64748b;">Recurring</span>' : ''}
              </div>
              <span class="tx-meta">${tx.date} • ${tx.note}</span>
            </div>
          </div>
          <div class="tx-right">
            <div class="tx-amount-col">
              <span class="tx-amount ${isIncome ? 'credit' : 'debit'}" style="${isIncome ? 'color: var(--income-green);' : ''}">
                ${isIncome ? '+' : '-'}${this.state.formatCurrency(tx.amount)}
              </span>
              <span class="tx-status">${isIncome ? 'Cleared' : 'Settled'}</span>
            </div>
            <button class="tx-delete-btn" data-delete-id="${tx.id}" title="Delete entry">
              <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
            </button>
          </div>
        </div>
      `;
    });

    this.txListBody.innerHTML = html;

    // Attach delete handlers
    this.txListBody.querySelectorAll('.tx-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        this.state.deleteTransaction(id);
        this.showToast('Transaction removed.');
      });
    });
  }

  renderRunway() {
    const projection = calculateRunway(this.state);
    
    if (this.runwayHeadline) {
      this.runwayHeadline.innerHTML = projection.headline;
    }

    if (!this.categoryRunwayList) return;

    if (projection.categoryProjections.length === 0) {
      this.categoryRunwayList.innerHTML = `
        <div style="font-size: 0.75rem; color: #94a3b8; text-align: center; padding: 1rem;">
          Record or import expenses to calculate category runway projections.
        </div>
      `;
      return;
    }

    let html = '';
    projection.categoryProjections.slice(0, 5).forEach(item => {
      const cat = item.category;

      html += `
        <div class="category-runway-item">
          <div class="cat-runway-left">
            <div class="cat-runway-icon" style="background-color: ${cat.color}15; color: ${cat.color};">
              <span class="material-symbols-outlined">${cat.icon || 'sell'}</span>
            </div>
            <div class="cat-runway-desc">
              <span class="cat-runway-text">${item.translationPhrase}</span>
              <span class="cat-runway-burn">Avg burn: ${this.state.formatCurrency(item.catMonthlyBurn)}/mo</span>
            </div>
          </div>
          <span class="cat-runway-badge" style="background-color: ${cat.color}18; color: ${cat.color}; border: 1px solid ${cat.color}40;">
            ${item.runwayBadgeText}
          </span>
        </div>
      `;
    });

    this.categoryRunwayList.innerHTML = html;
  }

  renderCategoryManager() {
    const listEl = document.getElementById('settings-category-list');
    if (!listEl) return;

    const categories = this.state.getState().categories;
    let html = '';

    categories.forEach(cat => {
      html += `
        <div class="category-manager-row">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="color" class="color-picker-input cat-color-edit" data-cat-id="${cat.id}" value="${cat.color}" title="Change category color" />
            <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${cat.name}</span>
            <span style="font-size: 10px; color: #64748b; background: #f1f5f9; padding: 2px 6px; rounded: 4px;">${cat.type}</span>
          </div>
          <span style="font-size: 11px; font-weight: 700; color: ${cat.color};">${cat.color.toUpperCase()}</span>
        </div>
      `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.cat-color-edit').forEach(picker => {
      picker.addEventListener('input', (e) => {
        const catId = e.target.getAttribute('data-cat-id');
        this.state.updateCategoryColor(catId, e.target.value);
      });
    });
  }

  populateCategorySelect(selectElement, type) {
    if (!selectElement) return;
    const cats = this.state.getState().categories.filter(c => c.type === type || type === 'all');
    selectElement.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  openAddModal() {
    const catSelect = document.getElementById('input-tx-cat');
    this.populateCategorySelect(catSelect, 'expense');
    document.getElementById('input-tx-date').value = new Date().toISOString().split('T')[0];
    if (this.addTxModal) this.addTxModal.classList.add('open');
  }

  closeAddModal() {
    if (this.addTxModal) this.addTxModal.classList.remove('open');
  }

  openSettingsModal() {
    const balInput = document.getElementById('settings-initial-balance');
    if (balInput) balInput.value = this.state.getState().initialBankBalance;
    this.renderCategoryManager();
    if (this.settingsModal) this.settingsModal.classList.add('open');
  }

  closeSettingsModal() {
    if (this.settingsModal) this.settingsModal.classList.remove('open');
  }

  closeCSVModal() {
    if (this.csvModal) this.csvModal.classList.remove('open');
  }

  closeAllModals() {
    this.closeAddModal();
    this.closeSettingsModal();
    this.closeCSVModal();
  }

  showToast(message, type = 'success') {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 18px;">${type === 'success' ? 'check_circle' : 'error'}</span>
      <span>${message}</span>
    `;
    this.toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
