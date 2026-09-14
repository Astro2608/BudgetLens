import { Transaction, FinanceSummary, CategoryRunway, CategoryKey, TimeframeFilter, ChartBucket, CategoryConfig } from '../types/finance';
import { DEFAULT_CATEGORY_CONFIGS } from '../config/categoryConfig';

export function calculateFinanceSummary(
  transactions: Transaction[],
  initialBalance: number = 0,
  configs: Record<CategoryKey, CategoryConfig> = DEFAULT_CATEGORY_CONFIGS
): FinanceSummary {
  // 1. Calculate Incomes, Expenses, and Savings
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavings = 0;

  transactions.forEach((tx) => {
    const amt = Math.abs(Number(tx.amount)) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else if (tx.type === 'savings') {
      totalSavings += amt;
    } else {
      // type === 'expense'
      // CRITICAL MATH RULE: 'Savings' category or type is NOT added to totalExpenses
      if (tx.category !== 'Savings') {
        totalExpenses += amt;
      } else {
        totalSavings += amt;
      }
    }
  });

  // CRITICAL MATH RULE: totalBalance = initialBalance + totalIncome - totalExpenses (Savings is retained)
  const totalBalance = initialBalance + totalIncome - totalExpenses;

  // 2. Compute date range for burn-rate calculation
  const expenseTransactions = transactions.filter(
    (tx) => tx.type === 'expense' && tx.category !== 'Savings'
  );

  let daysRecorded = 0;
  let hasMinimumDataForRunway = false;
  let monthsSpan = 1;

  if (transactions.length > 0) {
    const timestamps = transactions.map((tx) => new Date(tx.date).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const spanDays = Math.round((maxTime - minTime) / (1000 * 60 * 60 * 24)) + 1;
    daysRecorded = spanDays;
    hasMinimumDataForRunway = spanDays >= 30;
    monthsSpan = Math.max(1, spanDays / 30.4167);
  }

  // 3. Category Runways & Burn Rates
  const expenseCategories: CategoryKey[] = ['Transport', 'Food', 'Rent', 'Bills', 'General'];
  
  const categoryRunways: CategoryRunway[] = expenseCategories.map((catKey) => {
    const catConfig = configs[catKey] || configs.General || DEFAULT_CATEGORY_CONFIGS.General;
    const catTxs = expenseTransactions.filter((tx) => tx.category === catKey);
    const catTotal = catTxs.reduce((sum, tx) => sum + (Math.abs(Number(tx.amount)) || 0), 0);

    const monthlyBurn = monthsSpan > 0 ? catTotal / monthsSpan : 0;
    const remainingMonths = monthlyBurn > 0 && totalBalance > 0 ? totalBalance / monthlyBurn : 0;
    const percentageOfSpend = totalExpenses > 0 ? (catTotal / totalExpenses) * 100 : 0;

    return {
      category: catKey,
      label: catConfig.label,
      color: catConfig.color,
      icon: catConfig.icon,
      monthlyBurn: Math.round(monthlyBurn),
      remainingMonths: Number(remainingMonths.toFixed(1)),
      percentageOfSpend: Math.round(percentageOfSpend)
    };
  });

  // Total monthly expense burn
  const overallMonthlyBurn = categoryRunways.reduce((sum, c) => sum + c.monthlyBurn, 0);
  let overallRunwayMonths = 0;
  if (totalBalance > 0) {
    if (overallMonthlyBurn > 0) {
      overallRunwayMonths = Number((totalBalance / overallMonthlyBurn).toFixed(1));
    } else {
      overallRunwayMonths = 999;
    }
  } else {
    overallRunwayMonths = 0;
  }

  const safeWeeklySpend = overallMonthlyBurn > 0 
    ? Math.round(overallMonthlyBurn / 4.33) 
    : Math.round(totalBalance * 0.05);

  return {
    initialBalance,
    totalIncome,
    totalExpenses,
    totalSavings,
    totalBalance,
    overallMonthlyBurn,
    overallRunwayMonths,
    safeWeeklySpend,
    categoryRunways,
    hasMinimumDataForRunway,
    daysRecorded
  };
}

import { formatCurrency as formatCurrencyUtil, DEFAULT_CURRENCY_CODE } from '../config/currencyConfig';

export function formatSGD(amount: number, forceSign: boolean = false, currencyCode: string = DEFAULT_CURRENCY_CODE): string {
  return formatCurrencyUtil(amount, currencyCode, forceSign);
}

export function generateChartBuckets(
  transactions: Transaction[],
  timeframe: TimeframeFilter,
  configs: Record<CategoryKey, CategoryConfig> = DEFAULT_CATEGORY_CONFIGS
): ChartBucket[] {
  const sortedTxs = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  let buckets: ChartBucket[] = [];

  if (timeframe === '1M') {
    // 30 days divided into 30 individual daily bins (1 day per bar), anchored strictly to Today
    const totalBins = 30;
    const binDuration = 1 * MS_PER_DAY;
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const startTime = todayEnd - totalBins * binDuration + 1;

    for (let i = 0; i < totalBins; i++) {
      const bStart = new Date(startTime + i * binDuration);
      const bEnd = new Date(startTime + (i + 1) * binDuration - 1);
      const labelDate = bEnd;
      buckets.push({
        label: `${labelDate.getDate()} ${labelDate.toLocaleString('default', { month: 'short' })}`,
        startDate: bStart.toISOString().split('T')[0],
        endDate: bEnd.toISOString().split('T')[0],
        totalInflow: 0,
        totalOutflow: 0,
        inflowCategories: [],
        outflowCategories: []
      });
    }

    // Allocate transactions (any transactions older than 15 bins are discarded to the left)
    sortedTxs.forEach((tx) => {
      const tTime = new Date(tx.date + 'T12:00:00').getTime();
      if (tTime >= startTime && tTime <= todayEnd) {
        const binIndex = Math.min(
          totalBins - 1,
          Math.max(0, Math.floor((tTime - startTime) / binDuration))
        );
        const bucket = buckets[binIndex];
        const amt = Math.abs(Number(tx.amount)) || 0;
        const catConfig = configs[tx.category] || configs.General || DEFAULT_CATEGORY_CONFIGS.General;

        if (tx.type === 'income') {
          bucket.totalInflow += amt;
          const existing = bucket.inflowCategories.find((c) => c.category === tx.category);
          if (existing) existing.amount += amt;
          else bucket.inflowCategories.push({ category: tx.category, amount: amt, color: catConfig.color });
        } else if (tx.type === 'expense' || tx.type === 'savings' || tx.category === 'Savings') {
          bucket.totalOutflow += amt;
          const existing = bucket.outflowCategories.find((c) => c.category === tx.category);
          if (existing) existing.amount += amt;
          else bucket.outflowCategories.push({ category: tx.category, amount: amt, color: catConfig.color });
        }
      }
    });
  } else if (timeframe === '3M') {
    // 13 weekly bins (91 days), anchored strictly to Today
    const totalBins = 13;
    const binDuration = 7 * MS_PER_DAY;
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const startTime = todayEnd - totalBins * binDuration + 1;

    for (let i = 0; i < totalBins; i++) {
      const bStart = new Date(startTime + i * binDuration);
      const bEnd = new Date(startTime + (i + 1) * binDuration - 1);
      const labelDate = bEnd;
      buckets.push({
        label: `${labelDate.getDate()} ${labelDate.toLocaleString('default', { month: 'short' })}`,
        startDate: bStart.toISOString().split('T')[0],
        endDate: bEnd.toISOString().split('T')[0],
        totalInflow: 0,
        totalOutflow: 0,
        inflowCategories: [],
        outflowCategories: []
      });
    }

    sortedTxs.forEach((tx) => {
      const tTime = new Date(tx.date + 'T12:00:00').getTime();
      if (tTime >= startTime && tTime <= todayEnd) {
        const binIndex = Math.min(
          totalBins - 1,
          Math.max(0, Math.floor((tTime - startTime) / binDuration))
        );
        const bucket = buckets[binIndex];
        const amt = Math.abs(Number(tx.amount)) || 0;
        const catConfig = configs[tx.category] || configs.General || DEFAULT_CATEGORY_CONFIGS.General;

        if (tx.type === 'income') {
          bucket.totalInflow += amt;
          const existing = bucket.inflowCategories.find((c) => c.category === tx.category);
          if (existing) existing.amount += amt;
          else bucket.inflowCategories.push({ category: tx.category, amount: amt, color: catConfig.color });
        } else if (tx.type === 'expense' || tx.type === 'savings' || tx.category === 'Savings') {
          bucket.totalOutflow += amt;
          const existing = bucket.outflowCategories.find((c) => c.category === tx.category);
          if (existing) existing.amount += amt;
          else bucket.outflowCategories.push({ category: tx.category, amount: amt, color: catConfig.color });
        }
      }
    });
  } else if (timeframe === '1Y') {
    // 12 calendar months ending in current month
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    for (let i = 11; i >= 0; i--) {
      const mDate = new Date(curYear, curMonth - i, 1);
      const mEnd = new Date(curYear, curMonth - i + 1, 0, 23, 59, 59);
      buckets.push({
        label: mDate.toLocaleString('default', { month: 'short' }),
        startDate: mDate.toISOString().split('T')[0],
        endDate: mEnd.toISOString().split('T')[0],
        totalInflow: 0,
        totalOutflow: 0,
        inflowCategories: [],
        outflowCategories: []
      });
    }

    sortedTxs.forEach((tx) => {
      const tDate = new Date(tx.date);
      const bucket = buckets.find((b) => {
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        bEnd.setHours(23, 59, 59, 999);
        return tDate >= bStart && tDate <= bEnd;
      });

      if (bucket) {
        const amt = Math.abs(Number(tx.amount)) || 0;
        const catConfig = configs[tx.category] || configs.General || DEFAULT_CATEGORY_CONFIGS.General;

        if (tx.type === 'income') {
          bucket.totalInflow += amt;
          const existing = bucket.inflowCategories.find((c) => c.category === tx.category);
          if (existing) existing.amount += amt;
          else bucket.inflowCategories.push({ category: tx.category, amount: amt, color: catConfig.color });
        } else if (tx.type === 'expense' || tx.type === 'savings' || tx.category === 'Savings') {
          bucket.totalOutflow += amt;
          const existing = bucket.outflowCategories.find((c) => c.category === tx.category);
          if (existing) existing.amount += amt;
          else bucket.outflowCategories.push({ category: tx.category, amount: amt, color: catConfig.color });
        }
      }
    });
  } else {
    // ALL - yearly bins
    const earliestYear = sortedTxs.length > 0 ? new Date(sortedTxs[0].date).getFullYear() : now.getFullYear() - 1;
    const latestYear = now.getFullYear();
    const minYear = Math.min(earliestYear, latestYear - 1); // guarantee at least 2 bars

    for (let y = minYear; y <= latestYear; y++) {
      const yStart = new Date(y, 0, 1);
      const yEnd = new Date(y, 11, 31, 23, 59, 59);
      buckets.push({
        label: `${y}`,
        startDate: yStart.toISOString().split('T')[0],
        endDate: yEnd.toISOString().split('T')[0],
        totalInflow: 0,
        totalOutflow: 0,
        inflowCategories: [],
        outflowCategories: []
      });
    }

    sortedTxs.forEach((tx) => {
      const tYear = new Date(tx.date).getFullYear();
      const bucket = buckets.find((b) => b.label === `${tYear}`);
      if (bucket) {
        const amt = Math.abs(Number(tx.amount)) || 0;
        const catConfig = configs[tx.category] || configs.General || DEFAULT_CATEGORY_CONFIGS.General;

        if (tx.type === 'income') {
          bucket.totalInflow += amt;
          const existing = bucket.inflowCategories.find((c) => c.category === tx.category);
          if (existing) existing.amount += amt;
          else bucket.inflowCategories.push({ category: tx.category, amount: amt, color: catConfig.color });
        } else if (tx.type === 'expense' || tx.type === 'savings' || tx.category === 'Savings') {
          bucket.totalOutflow += amt;
          const existing = bucket.outflowCategories.find((c) => c.category === tx.category);
          if (existing) existing.amount += amt;
          else bucket.outflowCategories.push({ category: tx.category, amount: amt, color: catConfig.color });
        }
      }
    });

    if (buckets.length > 31) {
      buckets = buckets.slice(-31);
    }
  }

  return buckets;
}
