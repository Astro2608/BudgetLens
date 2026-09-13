/**
 * Lumina Finance Dashboard - Main Application Entrypoint
 */

import './styles/main.css';
import './styles/components.css';

import { stateManager } from './js/state.js';
import { DashboardChart } from './js/chart.js';
import { BankStatementParser } from './js/csvParser.js';
import { UIController } from './js/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const chartContainer = document.getElementById('chart-container-box');
  const chartTooltip = document.getElementById('chart-tooltip');

  const chart = new DashboardChart(chartContainer, chartTooltip, stateManager);
  const csvParser = new BankStatementParser(stateManager);
  const ui = new UIController(stateManager, chart, csvParser);

  ui.init();

  // Resize listener for responsive chart re-render
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      chart.render();
    }, 150);
  });
});
