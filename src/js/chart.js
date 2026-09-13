/**
 * Lumina Finance Dashboard - Interactive Multi-Timeframe Stacked Chart
 * Renders SVG/Canvas stacked visual bars for 1M, 3M, 1Y, and ALL timeframes with consistent category color-coding.
 */

export class DashboardChart {
  constructor(containerElement, tooltipElement, stateManager) {
    this.container = containerElement;
    this.tooltip = tooltipElement;
    this.stateManager = stateManager;
  }

  render() {
    if (!this.container) return;
    const state = this.stateManager.getState();
    const timeframe = state.activeTimeframe || '3M';
    const transactions = state.transactions;
    const categories = state.categories;

    // Filter transactions by timeframe
    const now = new Date();
    let cutoffDate = new Date();

    if (timeframe === '1M') {
      cutoffDate.setDate(now.getDate() - 30);
    } else if (timeframe === '3M') {
      cutoffDate.setDate(now.getDate() - 90);
    } else if (timeframe === '1Y') {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    } else {
      // ALL
      cutoffDate = new Date(0);
    }

    const filtered = transactions.filter(t => new Date(t.date) >= cutoffDate);

    // Group into time buckets
    const buckets = this.groupTransactionsIntoBuckets(filtered, timeframe, cutoffDate, now);

    // Compute maximum expense total across buckets for scaling
    const maxBucketExpense = Math.max(...buckets.map(b => b.totalExpense), 100);
    const maxBucketIncome = Math.max(...buckets.map(b => b.totalIncome), 0);
    const chartCeiling = Math.ceil(Math.max(maxBucketExpense, maxBucketIncome * 0.7) / 100) * 100;

    // Render SVG chart markup
    const width = this.container.clientWidth || 700;
    const height = 220;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 35;
    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Generate Y-axis gridlines
    const ySteps = 4;
    let gridLinesSvg = '';
    for (let i = 0; i <= ySteps; i++) {
      const val = (chartCeiling / ySteps) * i;
      const y = paddingTop + graphHeight - (i / ySteps) * graphHeight;
      gridLinesSvg += `
        <text x="${paddingLeft - 10}" y="${y + 4}" font-size="10" font-weight="700" fill="#94a3b8" text-anchor="end">${this.stateManager.formatCurrency(val, false, true)}</text>
        <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="${i === 0 ? '#cbd5e1' : '#e2e8f0'}" stroke-dasharray="${i === 0 ? 'none' : '4,4'}" stroke-width="1" />
      `;
    }

    // Generate Bars
    const numBuckets = buckets.length;
    const barSpacing = Math.max(12, Math.min(36, graphWidth / (numBuckets * 2.2)));
    const totalBarsWidth = numBuckets * barSpacing;
    const startX = paddingLeft + (graphWidth - totalBarsWidth) / 2;
    const barWidth = Math.max(16, Math.min(42, barSpacing * 0.75));

    let barsSvg = '';
    buckets.forEach((bucket, idx) => {
      const x = startX + idx * barSpacing + (barSpacing - barWidth) / 2;
      const bucketTotal = bucket.totalExpense;
      let currentY = paddingTop + graphHeight;

      let stackedSegments = '';
      if (bucketTotal > 0) {
        // Render category segments from bottom to top
        Object.entries(bucket.categoryExpenses).forEach(([catId, catAmt]) => {
          if (catAmt <= 0) return;
          const segHeight = (catAmt / chartCeiling) * graphHeight;
          const segY = currentY - segHeight;
          const cat = this.stateManager.getCategoryById(catId);

          stackedSegments += `
            <rect 
              x="${x}" 
              y="${segY}" 
              width="${barWidth}" 
              height="${segHeight}" 
              fill="${cat.color}" 
              data-cat-name="${cat.name}" 
              data-cat-color="${cat.color}" 
              data-cat-amt="${catAmt}"
              class="chart-bar-segment"
              rx="2"
            />
          `;
          currentY = segY;
        });
      } else {
        // Empty bucket placeholder stub
        stackedSegments = `
          <rect x="${x}" y="${paddingTop + graphHeight - 4}" width="${barWidth}" height="4" fill="#e2e8f0" rx="2" />
        `;
      }

      // Inflow indicator dot or top badge if bucket had income
      let incomeMarker = '';
      if (bucket.totalIncome > 0) {
        const incomeY = Math.max(paddingTop, paddingTop + graphHeight - (bucket.totalIncome / chartCeiling) * graphHeight);
        incomeMarker = `
          <circle cx="${x + barWidth / 2}" cy="${incomeY}" r="4" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />
        `;
      }

      // Rounded top cap for the entire bar
      barsSvg += `
        <g class="chart-bar-group" data-bucket-idx="${idx}" style="cursor: pointer;">
          <rect x="${x - 4}" y="${paddingTop}" width="${barWidth + 8}" height="${graphHeight}" fill="transparent" />
          ${stackedSegments}
          ${incomeMarker}
          <text x="${x + barWidth / 2}" y="${height - 10}" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">${bucket.label}</text>
        </g>
      `;
    });

    this.container.innerHTML = `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        ${gridLinesSvg}
        ${barsSvg}
      </svg>
    `;

    // Attach interactive tooltip hover listeners
    this.attachEventListeners(buckets);

    // Update the Category Allocation Stats Grid
    this.renderCategoryBreakdownGrid(filtered);
  }

  groupTransactionsIntoBuckets(transactions, timeframe, cutoffDate, now) {
    const buckets = [];

    if (timeframe === '1M') {
      // 4 Weekly intervals over the last 30 days
      for (let i = 3; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - (i + 1) * 7);
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        const label = i === 0 ? 'This Wk' : `Wk -${i}`;
        buckets.push(this.createBucket(label, start, end, transactions));
      }
    } else if (timeframe === '3M') {
      // 6 Bi-weekly intervals over the last 90 days
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - (i + 1) * 15);
        const end = new Date(now);
        end.setDate(now.getDate() - i * 15);
        const monthName = start.toLocaleString('en-US', { month: 'short' });
        const label = `${monthName} W${(i % 2) + 1}`;
        buckets.push(this.createBucket(label, start, end, transactions));
      }
    } else if (timeframe === '1Y') {
      // 12 Monthly buckets
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const label = d.toLocaleString('en-US', { month: 'short' });
        buckets.push(this.createBucket(label, d, end, transactions));
      }
    } else {
      // ALL - Monthly or Quarterly buckets
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i * 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - (i - 1) * 2, 0, 23, 59, 59);
        const label = `${d.toLocaleString('en-US', { month: 'short' })} '${d.getFullYear().toString().substr(2)}`;
        buckets.push(this.createBucket(label, d, end, transactions));
      }
    }

    return buckets;
  }

  createBucket(label, startDate, endDate, transactions) {
    const bucketTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });

    let totalExpense = 0;
    let totalIncome = 0;
    const categoryExpenses = {};

    bucketTxs.forEach(tx => {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        const catId = tx.categoryId || 'general';
        categoryExpenses[catId] = (categoryExpenses[catId] || 0) + amt;
      }
    });

    return {
      label,
      startDate,
      endDate,
      totalExpense,
      totalIncome,
      categoryExpenses,
      transactions: bucketTxs
    };
  }

  attachEventListeners(buckets) {
    const barGroups = this.container.querySelectorAll('.chart-bar-group');
    barGroups.forEach(group => {
      group.addEventListener('mouseenter', (e) => {
        const idx = Number(group.getAttribute('data-bucket-idx'));
        const bucket = buckets[idx];
        if (!bucket) return;

        const dateRangeStr = `${bucket.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${bucket.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        
        let catRows = '';
        Object.entries(bucket.categoryExpenses).forEach(([catId, amt]) => {
          const cat = this.stateManager.getCategoryById(catId);
          catRows += `
            <div class="chart-tooltip-row">
              <span style="display: flex; align-items: center; gap: 4px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${cat.color};"></span>
                <span>${cat.name}</span>
              </span>
              <strong style="color: #f1f5f9;">-${this.stateManager.formatCurrency(amt)}</strong>
            </div>
          `;
        });

        let incomeRow = '';
        if (bucket.totalIncome > 0) {
          incomeRow = `
            <div class="chart-tooltip-row" style="border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 4px; margin-top: 2px;">
              <span style="color: #10b981; font-weight: 700;">+ Income Inflow</span>
              <strong style="color: #10b981;">+${this.stateManager.formatCurrency(bucket.totalIncome)}</strong>
            </div>
          `;
        }

        const topTxList = bucket.transactions.slice(0, 3).map(t => 
          `<div style="font-size: 10px; color: #cbd5e1; display: flex; justify-content: space-between;">
             <span>• ${t.title}</span>
             <span>${t.type === 'income' ? '+' : '-'}${this.stateManager.formatCurrency(t.amount)}</span>
           </div>`
        ).join('');

        this.tooltip.innerHTML = `
          <div class="chart-tooltip-header">${bucket.label} (${dateRangeStr})</div>
          <div class="chart-tooltip-row">
            <span style="color: #94a3b8;">Total Outflow:</span>
            <strong style="color: #f43f5e;">-${this.stateManager.formatCurrency(bucket.totalExpense)}</strong>
          </div>
          ${catRows}
          ${incomeRow}
          ${bucket.transactions.length > 0 ? `<div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 4px; margin-top: 2px; font-weight: 700; color: #94a3b8; font-size: 10px;">Transactions (${bucket.transactions.length}):</div>${topTxList}` : ''}
        `;

        this.tooltip.style.display = 'flex';
      });

      group.addEventListener('mousemove', (e) => {
        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
      });

      group.addEventListener('mouseleave', () => {
        this.tooltip.style.display = 'none';
      });
    });
  }

  renderCategoryBreakdownGrid(filteredTransactions) {
    const gridEl = document.getElementById('category-stats-grid');
    if (!gridEl) return;

    const expenseTxs = filteredTransactions.filter(t => t.type === 'expense');
    const totalSpend = expenseTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const categories = this.stateManager.getState().categories.filter(c => c.type === 'expense');

    let html = '';
    categories.forEach(cat => {
      const catTotal = expenseTxs
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      const pct = totalSpend > 0 ? Math.round((catTotal / totalSpend) * 100) : 0;

      html += `
        <div class="cat-stat-card" data-cat-id="${cat.id}">
          <div class="cat-stat-header">
            <span class="cat-color-dot" style="background-color: ${cat.color};"></span>
            <span class="cat-stat-title" title="${cat.name}">${cat.name}</span>
          </div>
          <div class="cat-stat-amount">${this.stateManager.formatCurrency(catTotal)}</div>
          <div class="cat-progress-bar">
            <div class="cat-progress-fill" style="width: ${pct}%; background-color: ${cat.color};"></div>
          </div>
          <span class="cat-stat-pct" style="color: ${cat.color};">${pct}% of spend</span>
        </div>
      `;
    });

    gridEl.innerHTML = html;
  }
}
