/**
 * FinVision AI — Assets & Portfolio Input Form (Phase 3)
 * Stub: renders allocation slider and current portfolio inputs.
 */
import { DEFAULTS, RETURNS, blendedReturn } from '@/utils/constants.js';
import { formatRupee, formatPercent } from '@/utils/formatters.js';

export function mountAssetsForm(container, state, onUpdate) {
  const ef = state.equityPercent ?? 60;
  const df = state.debtPercent   ?? 40;
  const blended = blendedReturn(ef / 100);

  container.innerHTML = `
    <div class="card">
      <h2 class="card-title mb-4">Asset Allocation</h2>
      <div class="form-group">
        <label class="form-label">
          Equity Allocation
          <span id="alloc-equity-val" class="text-brand font-semibold">${ef}%</span>
          <span class="text-slate-500 text-xs ml-2">(Debt: <span id="alloc-debt-val">${df}%</span>)</span>
        </label>
        <input id="inp-equity-pct" type="range" class="form-range" min="0" max="100" step="5" value="${ef}" />
        <div class="flex justify-between text-xs text-slate-500 mt-1"><span>0% Equity</span><span>50/50</span><span>100% Equity</span></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div class="bg-surface-3 rounded-xl p-3 text-center">
          <p class="text-xs text-slate-500 mb-1">Equity CAGR</p>
          <p class="font-bold text-brand">13.0%</p>
        </div>
        <div class="bg-surface-3 rounded-xl p-3 text-center">
          <p class="text-xs text-slate-500 mb-1">Debt CAGR</p>
          <p class="font-bold text-blue-400">6.0%</p>
        </div>
        <div class="bg-surface-3 rounded-xl p-3 text-center">
          <p class="text-xs text-slate-500 mb-1">Blended CAGR</p>
          <p id="alloc-blended-display" class="font-bold text-emerald-400">${(blended * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title mb-4">Current Portfolio</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="form-group">
          <label for="inp-equity-val" class="form-label">Equity Investments</label>
          <div class="form-input-prefix-group">
            <span class="form-input-prefix">₹</span>
            <input id="inp-equity-val" type="number" class="form-input" min="0" step="10000"
              value="${state.currentEquity ?? 500000}" placeholder="500000" />
          </div>
          <p class="form-hint">Mutual funds, direct stocks, ELSS</p>
        </div>
        <div class="form-group">
          <label for="inp-debt-val" class="form-label">Debt Investments</label>
          <div class="form-input-prefix-group">
            <span class="form-input-prefix">₹</span>
            <input id="inp-debt-val" type="number" class="form-input" min="0" step="10000"
              value="${state.currentDebt ?? 200000}" placeholder="200000" />
          </div>
          <p class="form-hint">FDs, PPF, bonds, debt funds</p>
        </div>
        <div class="form-group">
          <label for="inp-epf-val" class="form-label">EPF Balance</label>
          <div class="form-input-prefix-group">
            <span class="form-input-prefix">₹</span>
            <input id="inp-epf-val" type="number" class="form-input" min="0" step="10000"
              value="${state.currentEPF ?? 300000}" placeholder="300000" />
          </div>
          <p class="form-hint">Employee Provident Fund corpus</p>
        </div>
      </div>
    </div>
  `;

  // Equity slider — keeps equity + debt = 100%
  container.querySelector('#inp-equity-pct')?.addEventListener('input', (e) => {
    const eq = parseInt(e.target.value, 10);
    const dt = 100 - eq;
    container.querySelector('#alloc-equity-val').textContent = `${eq}%`;
    container.querySelector('#alloc-debt-val').textContent   = `${dt}%`;
    container.querySelector('#alloc-blended-display').textContent =
      `${(blendedReturn(eq / 100) * 100).toFixed(1)}%`;
    onUpdate('equityPercent', eq);
    onUpdate('debtPercent',   dt);
  });

  for (const [id, field] of [['inp-equity-val','currentEquity'],['inp-debt-val','currentDebt'],['inp-epf-val','currentEPF']]) {
    container.querySelector(`#${id}`)?.addEventListener('input', (e) => {
      onUpdate(field, parseFloat(e.target.value) || 0);
    });
  }
}
