/**
 * Lumina Finance Dashboard - Predictive Runway & Category Translation Engine
 * Calculates overall burn rate, remaining funds runway, and per-category translations.
 */

export function calculateRunway(stateManager) {
  const state = stateManager.getState();
  const currentBankBalance = stateManager.getCurrentBankBalance();
  const sensitivity = state.sensitivityMultiplier || 1.0;
  
  const expenseTx = state.transactions.filter(t => t.type === 'expense');
  
  if (expenseTx.length === 0 || currentBankBalance <= 0) {
    return {
      currentBankBalance,
      overallDays: 0,
      overallWeeks: 0,
      overallMonths: 0,
      dailyBurnRate: 0,
      weeklyBurnRate: 0,
      monthlyBurnRate: 0,
      headline: currentBankBalance <= 0 
        ? `You have depleted your cash balance (${stateManager.formatCurrency(currentBankBalance)}).` 
        : `You have ${stateManager.formatCurrency(currentBankBalance)} with no expense history to project runway.`,
      categoryProjections: []
    };
  }

  // Determine date span of expenses
  const dates = expenseTx.map(t => new Date(t.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates, Date.now());
  const daysDiff = Math.max(7, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)));
  const totalExpenseSum = expenseTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Daily, Weekly, Monthly baseline burn rates
  const rawDailyBurn = totalExpenseSum / daysDiff;
  const dailyBurn = rawDailyBurn * sensitivity;
  const weeklyBurn = dailyBurn * 7;
  const monthlyBurn = dailyBurn * 30.4167; // average month length

  // Overall runway calculations
  const overallDays = dailyBurn > 0 ? currentBankBalance / dailyBurn : 0;
  const overallWeeks = overallDays / 7;
  const overallMonths = overallDays / 30.4167;

  let timeDurationString = '';
  if (overallDays < 14) {
    timeDurationString = `${Math.round(overallDays)} days`;
  } else if (overallWeeks < 10) {
    timeDurationString = `${overallWeeks.toFixed(1)} weeks`;
  } else {
    timeDurationString = `${overallMonths.toFixed(1)} months`;
  }

  const headline = `You are left with <strong>${stateManager.formatCurrency(currentBankBalance)}</strong> which will last <strong>${timeDurationString}</strong> based on current expense trends (~${stateManager.formatCurrency(weeklyBurn)}/week).`;

  // Category specific calculations
  const categories = state.categories.filter(c => c.type === 'expense');
  const categoryProjections = categories.map(cat => {
    const catTxs = expenseTx.filter(t => t.categoryId === cat.id);
    const catTotal = catTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const catDailyBurn = catTotal > 0 ? (catTotal / daysDiff) * sensitivity : 0;
    const catWeeklyBurn = catDailyBurn * 7;
    const catMonthlyBurn = catDailyBurn * 30.4167;

    let translationPhrase = '';
    let runwayBadgeText = '';

    if (catDailyBurn === 0) {
      translationPhrase = `With current savings, you have no recorded ${cat.name.toLowerCase()} outflows.`;
      runwayBadgeText = 'No Outflows';
    } else {
      const catDays = currentBankBalance / catDailyBurn;
      const catWeeks = catDays / 7;
      const catMonths = catDays / 30.4167;

      if (cat.id === 'rent') {
        const months = catMonths.toFixed(1);
        translationPhrase = `With current savings, you can pay <strong>${months} months</strong> of ${cat.name}`;
        runwayBadgeText = `${months} mo rent`;
      } else if (cat.id === 'transport') {
        const months = catMonths >= 2 ? `${catMonths.toFixed(1)} months` : `${catWeeks.toFixed(1)} weeks`;
        translationPhrase = `With current savings, you are left with <strong>${months}</strong> worth of ${cat.name}`;
        runwayBadgeText = `${months} transit`;
      } else if (cat.id === 'food') {
        const duration = catWeeks < 8 ? `${catWeeks.toFixed(1)} weeks` : `${catMonths.toFixed(1)} months`;
        translationPhrase = `With current savings, you are left with <strong>${duration}</strong> of ${cat.name}`;
        runwayBadgeText = `${duration} food`;
      } else if (cat.id === 'bills') {
        const months = catMonths.toFixed(1);
        translationPhrase = `With current savings, you can cover <strong>${months} months</strong> of ${cat.name}`;
        runwayBadgeText = `${months} mo bills`;
      } else {
        const duration = catMonths >= 2 ? `${catMonths.toFixed(1)} months` : `${catWeeks.toFixed(1)} weeks`;
        translationPhrase = `With current savings, you have <strong>${duration}</strong> worth of ${cat.name}`;
        runwayBadgeText = `${duration}`;
      }
    }

    return {
      category: cat,
      catTotal,
      catDailyBurn,
      catWeeklyBurn,
      catMonthlyBurn,
      translationPhrase,
      runwayBadgeText
    };
  });

  // Sort categories by highest spend first
  categoryProjections.sort((a, b) => b.catTotal - a.catTotal);

  return {
    currentBankBalance,
    overallDays,
    overallWeeks,
    overallMonths,
    dailyBurnRate: dailyBurn,
    weeklyBurnRate: weeklyBurn,
    monthlyBurnRate: monthlyBurn,
    headline,
    categoryProjections
  };
}
