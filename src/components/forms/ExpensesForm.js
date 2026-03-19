/**
 * FinVision AI — Monthly Expenses Input Form (Phase 3)
 * Stub: lifestyle, medical, EMI expense inputs.
 */
import { DEFAULTS } from '@/utils/constants.js';
import { formatRupee } from '@/utils/formatters.js';

export function mountExpensesForm(container, state, onUpdate) {
  const me = state.monthlyExpenses       ?? 60000;
  const mm = state.monthlyMedicalPremium ?? 2000;
  const mi = state.monthlyEMI           ?? 0;
  const surplus = Math.max(0, (state.monthlyIncome ?? 150000) - me - mm - mi);

  container.innerHTML = `
    <div class="card">
      <h2 class="card-title mb-4">Monthly Expenses</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div class="form-group">
          <label for="inp-lifestyle-exp" class="form-label">Monthly Lifestyle Expenses</label>
          <div class="form-input-prefix-group">
            <span class="form-input-prefix">₹</span>
            <input id="inp-lifestyle-exp" type="number" class="form-input" min="0" step="1000"
              value="${me}" placeholder="60000" />
          </div>
          <p class="form-hint">Rent, groceries, utilities, entertainment · Inflated at <span class="text-brand">8%/yr</span></p>
        </div>

        <div class="form-group">
          <label for="inp-medical-premium" class="form-label">Monthly Medical Insurance Premium</label>
          <div class="form-input-prefix-group">
            <span class="form-input-prefix">₹</span>
            <input id="inp-medical-premium" type="number" class="form-input" min="0" step="100"
              value="${mm}" placeholder="2000" />
          </div>
          <p class="form-hint">Health insurance + out-of-pocket · Inflated at <span class="text-red-400">13.5%/yr</span></p>
        </div>

        <div class="form-group">
          <label for="inp-emi" class="form-label">Monthly EMI / Loan Payments</label>
          <div class="form-input-prefix-group">
            <span class="form-input-prefix">₹</span>
            <input id="inp-emi" type="number" class="form-input" min="0" step="500"
              value="${mi}" placeholder="0" />
          </div>
          <p class="form-hint">Home loan, car loan, personal loan EMIs</p>
        </div>

        <div class="bg-surface-3 rounded-xl p-4 flex flex-col gap-2">
          <p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Monthly Summary</p>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Total Outflows</span>
            <span id="exp-total-outflow" class="font-semibold text-white">${formatRupee(me + mm + mi)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Investable Surplus</span>
            <span id="exp-investable" class="font-semibold text-emerald-400">${formatRupee(surplus)}</span>
          </div>
          <p class="text-xs text-slate-600 mt-1">Based on current monthly income</p>
        </div>
      </div>
    </div>
  `;

  function recalcSummary() {
    const eff = parseFloat(container.querySelector('#inp-lifestyle-exp').value) || 0;
    const emf = parseFloat(container.querySelector('#inp-medical-premium').value) || 0;
    const eif = parseFloat(container.querySelector('#inp-emi').value) || 0;
    const total = eff + emf + eif;
    const inv   = Math.max(0, (state.monthlyIncome ?? 150000) - total);
    container.querySelector('#exp-total-outflow').textContent = formatRupee(total);
    container.querySelector('#exp-investable').textContent    = formatRupee(inv);
  }

  container.querySelector('#inp-lifestyle-exp')?.addEventListener('input', (e) => {
    onUpdate('monthlyExpenses', parseFloat(e.target.value) || 0);
    recalcSummary();
  });
  container.querySelector('#inp-medical-premium')?.addEventListener('input', (e) => {
    onUpdate('monthlyMedicalPremium', parseFloat(e.target.value) || 0);
    recalcSummary();
  });
  container.querySelector('#inp-emi')?.addEventListener('input', (e) => {
    onUpdate('monthlyEMI', parseFloat(e.target.value) || 0);
    recalcSummary();
  });
}
