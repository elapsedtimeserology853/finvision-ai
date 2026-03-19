/**
 * FinVision AI — Life Goals Input Form (Phase 3)
 * Stub: add/edit/delete goal cards with type, year, and today-value fields.
 */
import { GOAL_TYPES } from '@/utils/constants.js';
import { formatRupee } from '@/utils/formatters.js';

const GOAL_ICONS = { EDUCATION: '🎓', MARRIAGE: '💍', PROPERTY: '🏠', VEHICLE: '🚗', TRAVEL: '✈️', RETIREMENT: '🏖️', OTHER: '🎯' };

function renderGoalCards(container, goals, planStartYear, onUpdate) {
  const listEl = container.querySelector('#goals-list');
  if (!listEl) return;

  if (goals.length === 0) {
    listEl.innerHTML = `<div class="text-center py-12 text-slate-500">
      <p class="text-4xl mb-3">🎯</p>
      <p class="text-sm font-medium">No goals yet — add your first life milestone</p>
    </div>`;
    return;
  }

  listEl.innerHTML = goals.map(g => {
    const fy = g.targetYear ? `FY ${g.targetYear}-${String(g.targetYear + 1).slice(-2)}` : '–';
    const yearsAway = g.targetYear ? g.targetYear - planStartYear : 0;
    return `
    <div class="goal-card bg-surface-3 rounded-xl p-4 flex items-start gap-4" data-goal-id="${g.id}">
      <span class="text-2xl mt-0.5">${GOAL_ICONS[g.type] || '🎯'}</span>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="font-semibold text-white truncate">${g.name}</p>
          <button class="btn-delete-goal icon-btn text-slate-500 hover:text-red-400" data-id="${g.id}" title="Remove goal" aria-label="Delete goal">
            <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <p class="text-xs text-slate-400 mt-0.5">${GOAL_TYPES[g.type]?.label ?? g.type} · ${fy}${yearsAway > 0 ? ` · ${yearsAway} years away` : ''}</p>
        <p class="text-sm font-semibold text-brand mt-1.5">${formatRupee(g.todayValue)} <span class="text-slate-500 font-normal text-xs">today's value</span></p>
      </div>
    </div>`;
  }).join('');

  listEl.querySelectorAll('.btn-delete-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const updated = goals.filter(g => g.id !== id);
      onUpdate('goals', updated);
      renderGoalCards(container, updated, planStartYear, onUpdate);
    });
  });
}

export function mountGoalsForm(container, state, onUpdate) {
  const currentYear = state.planStartYear ?? new Date().getFullYear();

  container.innerHTML = `
    <div class="card">
      <h2 class="card-title mb-4">Add a Life Goal</h2>
      <form id="goal-add-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div class="form-group">
          <label for="goal-name" class="form-label">Goal Name</label>
          <input id="goal-name" type="text" class="form-input" required maxlength="60"
            placeholder="e.g. Daughter's Engineering Degree" />
        </div>

        <div class="form-group">
          <label for="goal-type" class="form-label">Goal Type</label>
          <select id="goal-type" class="form-input">
            ${Object.entries(GOAL_TYPES).map(([k, v]) =>
              `<option value="${k}">${v.icon ?? ''} ${v.label}</option>`
            ).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="goal-year" class="form-label">Target Year</label>
          <input id="goal-year" type="number" class="form-input" required
            min="${currentYear + 1}" max="${currentYear + 70}" step="1"
            placeholder="${currentYear + 10}" />
        </div>

        <div class="form-group">
          <label for="goal-value" class="form-label">Cost in Today's Rupees</label>
          <div class="form-input-prefix-group">
            <span class="form-input-prefix">₹</span>
            <input id="goal-value" type="number" class="form-input" required min="0" step="50000"
              placeholder="2000000" />
          </div>
          <p class="form-hint">Enter today's value — inflation is auto-applied</p>
        </div>

        <div class="md:col-span-2 flex justify-end">
          <button type="submit" class="btn-primary flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Goal
          </button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Your Goals <span id="goals-count-badge" class="text-sm text-slate-400 font-normal">(${state.goals?.length ?? 0})</span></h2>
      </div>
      <div id="goals-list" class="space-y-3 mt-3"></div>
    </div>
  `;

  // Initial render
  renderGoalCards(container, state.goals ?? [], currentYear, onUpdate);

  // Add goal form submit
  container.querySelector('#goal-add-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name  = container.querySelector('#goal-name').value.trim();
    const type  = container.querySelector('#goal-type').value;
    const year  = parseInt(container.querySelector('#goal-year').value, 10);
    const value = parseFloat(container.querySelector('#goal-value').value) || 0;

    if (!name || !year || !value) return;

    const newGoal = {
      id:           crypto.randomUUID(),
      name,
      type,
      targetYear:   year,
      todayValue:   value,
      inflationRate: GOAL_TYPES[type]?.inflation ?? 0.08,
    };

    const updated = [...(state.goals ?? []), newGoal];
    onUpdate('goals', updated);
    state.goals = updated;  // keep local reference in sync for re-render

    renderGoalCards(container, updated, currentYear, onUpdate);
    const badge = container.querySelector('#goals-count-badge');
    if (badge) badge.textContent = `(${updated.length})`;

    // Reset form
    e.target.reset();
  });
}
