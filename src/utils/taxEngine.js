/**
 * FinVision AI — Tax Calculation Engine
 * ============================================================
 * PHASE 2 FILE — Stub structure defined; full logic in Phase 2.
 *
 * Implements:
 *   • New Tax Regime (Section 115BAC) — FY 2025-26
 *   • Old Tax Regime — FY 2025-26
 *   • Marginal relief algorithm (for income just above ₹12L)
 *   • Surcharge + cess computations
 *   • LTCG tax harvesting simulator
 *   • Regime comparator and recommender
 */

import { NEW_REGIME, OLD_REGIME, SURCHARGE, CAPITAL_GAINS, RETURNS } from './constants.js';

/**
 * @typedef {Object} TaxInputs
 * @property {number} grossSalary      - Annual gross salary (₹)
 * @property {number} age              - User's age (determines exemption limits)
 * @property {number} [epfContrib]     - Employee EPF contribution (₹/year, goes into 80C)
 * @property {number} [ppfContrib]     - PPF contribution (₹/year)
 * @property {number} [elssContrib]    - ELSS mutual fund investment (₹/year)
 * @property {number} [lifeInsurance]  - Life insurance premium (₹/year)
 * @property {number} [homeLoanInterest]  - Home loan interest paid (₹/year, Sec 24b)
 * @property {number} [medicalPremiumSelf] - Health insurance premium — self (₹/year)
 * @property {number} [medicalPremiumParents] - Health insurance premium — parents (₹/year)
 * @property {number} [npsContrib80CCD1B] - NPS contribution for extra deduction (₹/year)
 * @property {boolean} [parentsAbove60] - Whether parents are senior citizens
 */

/**
 * @typedef {Object} TaxResult
 * @property {number} grossSalary
 * @property {number} standardDeduction
 * @property {number} totalDeductions   - Chapter VI-A deductions (old regime only)
 * @property {number} taxableIncome
 * @property {number} taxBeforeRebate
 * @property {number} rebate87A
 * @property {number} taxAfterRebate
 * @property {number} surcharge
 * @property {number} cess
 * @property {number} totalTax
 * @property {number} effectiveRate     - totalTax / grossSalary
 * @property {Object[]} slabBreakdown   - Per-slab calculation details
 */

/**
 * @typedef {Object} TaxComparison
 * @property {TaxResult} newRegime
 * @property {TaxResult} oldRegime
 * @property {'NEW' | 'OLD' | 'EQUAL'} recommended
 * @property {number} saving            - Tax saved by choosing recommended regime (₹)
 */

/**
 * Compute slab-wise tax using an ordered slab array.
 * Pure helper — no regime-specific logic.
 * @param {number} taxableIncome
 * @param {Array<{from: number, to: number, rate: number}>} slabs
 * @returns {{ total: number, breakdown: Array }}
 */
export function computeSlabTax(taxableIncome, slabs) {
  // Phase 2 — full implementation
  let total = 0;
  const breakdown = [];

  for (const slab of slabs) {
    if (taxableIncome <= slab.from) break;
    const upper = slab.to === Infinity ? taxableIncome : Math.min(taxableIncome, slab.to);
    const taxable = upper - slab.from;
    const tax = taxable * slab.rate;
    total += tax;
    breakdown.push({ slab, taxable, tax });
  }

  return { total, breakdown };
}

/**
 * Compute surcharge on base tax amount.
 * @param {number} income    - Gross income (₹)
 * @param {number} baseTax   - Tax before surcharge (₹)
 * @param {'NEW' | 'OLD'} regime
 * @returns {number} Surcharge amount (₹)
 */
export function computeSurcharge(income, baseTax, regime) {
  // Phase 2 — full implementation
  const tiers = [SURCHARGE.TIER_1, SURCHARGE.TIER_2];
  if (regime === 'OLD') tiers.push(SURCHARGE.TIER_3, SURCHARGE.TIER_4_OLD);
  else tiers.push(SURCHARGE.TIER_4_NEW);

  for (let i = tiers.length - 1; i >= 0; i--) {
    const t = tiers[i];
    if (income > t.above) return baseTax * t.rate;
  }
  return 0;
}

/**
 * Calculate tax under the New Tax Regime (Section 115BAC).
 * @param {TaxInputs} inputs
 * @returns {TaxResult}
 */
export function calcNewRegimeTax(inputs) {
  const { grossSalary } = inputs;

  // Step 1: Standard deduction (salaried)
  const standardDeduction = NEW_REGIME.STANDARD_DEDUCTION;
  const taxableIncome = Math.max(0, grossSalary - standardDeduction);

  // Step 2: Slab tax on taxable income
  const { total: taxBeforeRebate, breakdown: slabBreakdown } =
    computeSlabTax(taxableIncome, NEW_REGIME.SLABS);

  // Step 3: Section 87A rebate + marginal relief
  // - If NTI ≤ ₹12L → full rebate (zero tax)
  // - If NTI > ₹12L → tax capped at (NTI − ₹12L) to prevent cliff-edge jump
  let taxAfterRebate;
  if (taxableIncome <= NEW_REGIME.REBATE_87A_INCOME_LIMIT) {
    taxAfterRebate = 0;
  } else {
    const excessOverThreshold = taxableIncome - NEW_REGIME.REBATE_87A_INCOME_LIMIT;
    taxAfterRebate = Math.min(taxBeforeRebate, excessOverThreshold);
  }
  const rebate87A = taxBeforeRebate - taxAfterRebate;

  // Step 4: Surcharge (based on gross salary bracket)
  const surcharge = computeSurcharge(grossSalary, taxAfterRebate, 'NEW');

  // Step 5: 4% Health & Education Cess
  const cess     = (taxAfterRebate + surcharge) * SURCHARGE.CESS_RATE;
  const totalTax = taxAfterRebate + surcharge + cess;

  return {
    grossSalary,
    standardDeduction,
    totalDeductions:  0,
    taxableIncome,
    taxBeforeRebate,
    rebate87A,
    taxAfterRebate,
    surcharge,
    cess,
    totalTax,
    effectiveRate: grossSalary > 0 ? totalTax / grossSalary : 0,
    slabBreakdown,
  };
}

/**
 * Calculate Tax Payable under Old Tax Regime.
 * Accounts for standard deduction, Sections 80C / 80D / 24b / 80CCD(1B).
 * @param {TaxInputs} inputs
 * @returns {TaxResult}
 */
export function calcOldRegimeTax(inputs) {
  const {
    grossSalary,
    age = 30,
    epfContrib           = 0,
    ppfContrib           = 0,
    elssContrib          = 0,
    lifeInsurance        = 0,
    homeLoanInterest     = 0,
    medicalPremiumSelf   = 0,
    medicalPremiumParents = 0,
    npsContrib80CCD1B    = 0,
    parentsAbove60       = false,
  } = inputs;

  // Step 1: Standard deduction
  const standardDeduction = OLD_REGIME.STANDARD_DEDUCTION;

  // Step 2: Section 80C — capped at ₹1.5L
  const sec80C = Math.min(
    epfContrib + ppfContrib + elssContrib + lifeInsurance,
    OLD_REGIME.SEC_80C_LIMIT,
  );

  // Step 3: Section 80D — health insurance (age-dependent limits)
  const selfLimit    = age >= 60 ? OLD_REGIME.SEC_80D.SELF_ABOVE_60    : OLD_REGIME.SEC_80D.SELF_BELOW_60;
  const parentsLimit = parentsAbove60 ? OLD_REGIME.SEC_80D.PARENTS_ABOVE_60 : OLD_REGIME.SEC_80D.PARENTS_BELOW_60;
  const sec80D = Math.min(medicalPremiumSelf, selfLimit)
               + Math.min(medicalPremiumParents, parentsLimit);

  // Step 4: Section 24b — home loan interest (capped at ₹2L)
  const sec24B = Math.min(homeLoanInterest, OLD_REGIME.SEC_24B_LIMIT);

  // Step 5: Section 80CCD(1B) — NPS additional deduction (capped at ₹50K)
  const sec80CCD1B = Math.min(npsContrib80CCD1B, OLD_REGIME.SEC_80CCD_1B_LIMIT);

  const totalDeductions = sec80C + sec80D + sec24B + sec80CCD1B;
  const taxableIncome   = Math.max(0, grossSalary - standardDeduction - totalDeductions);

  // Step 6: Age-based slab selection
  const slabs = age >= 80
    ? OLD_REGIME.SLABS_SUPER_SENIOR
    : age >= 60
      ? OLD_REGIME.SLABS_SENIOR
      : OLD_REGIME.SLABS_BELOW_60;

  const { total: taxBeforeRebate, breakdown: slabBreakdown } =
    computeSlabTax(taxableIncome, slabs);

  // Step 7: Section 87A rebate (old regime: NTI ≤ ₹5L, max ₹12,500)
  let rebate87A = 0;
  if (taxableIncome <= OLD_REGIME.REBATE_87A_INCOME_LIMIT) {
    rebate87A = Math.min(taxBeforeRebate, OLD_REGIME.REBATE_87A_MAX);
  }
  const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87A);

  // Step 8: Surcharge
  const surcharge = computeSurcharge(grossSalary, taxAfterRebate, 'OLD');

  // Step 9: 4% Health & Education Cess
  const cess     = (taxAfterRebate + surcharge) * SURCHARGE.CESS_RATE;
  const totalTax = taxAfterRebate + surcharge + cess;

  return {
    grossSalary,
    standardDeduction,
    totalDeductions,
    taxableIncome,
    taxBeforeRebate,
    rebate87A,
    taxAfterRebate,
    surcharge,
    cess,
    totalTax,
    effectiveRate: grossSalary > 0 ? totalTax / grossSalary : 0,
    slabBreakdown,
  };
}

/**
 * Compare both regimes and produce a recommendation.
 * @param {TaxInputs} inputs
 * @returns {TaxComparison}
 */
export function compareTaxRegimes(inputs) {
  const newR = calcNewRegimeTax(inputs);
  const oldR = calcOldRegimeTax(inputs);

  let recommended = 'NEW';
  let saving = 0;

  if (oldR.totalTax < newR.totalTax) {
    recommended = 'OLD';
    saving = newR.totalTax - oldR.totalTax;
  } else if (newR.totalTax < oldR.totalTax) {
    recommended = 'NEW';
    saving = oldR.totalTax - newR.totalTax;
  } else {
    recommended = 'EQUAL';
    saving = 0;
  }

  return { newRegime: newR, oldRegime: oldR, recommended, saving };
}

/**
 * LTCG Tax Harvesting Simulator.
 * Simulates annual booking of ₹1.25L gains to reset cost basis.
 *
 * @param {number} equityPortfolioValue - Current equity portfolio value (₹)
 * @param {number} unrealisedGainRate   - Unrealised gain % (e.g., 0.20 = 20%)
 * @param {number} years                - Investment horizon for compounding benefit
 * @returns {{ annualSaving: number, lifetimeSaving: number, strategy: string }}
 */
export function simulateLTCGHarvesting(equityPortfolioValue, unrealisedGainRate, years) {
  const exemptLimit = CAPITAL_GAINS.LTCG_EXEMPT_LIMIT;  // ₹1,25,000
  const ltcgRate    = CAPITAL_GAINS.LTCG_RATE;           // 12.5%
  const cagr        = RETURNS.EQUITY;                    // 13% equity growth

  let portfolioValue  = equityPortfolioValue;
  let unrealisedGains = portfolioValue * Math.max(0, Math.min(1, unrealisedGainRate));
  let totalTaxSaved   = 0;
  let harvestYears    = 0;

  for (let year = 1; year <= years; year++) {
    // Attempt harvesting: book up to ₹1.25L gains if sufficient unrealised gains exist
    if (unrealisedGains >= exemptLimit) {
      totalTaxSaved  += exemptLimit * ltcgRate;  // ₹15,625 saved this year
      unrealisedGains -= exemptLimit;            // Cost basis reset upward by ₹1.25L
      harvestYears++;
    }

    // Portfolio compounds; new unrealised gains accrue on grown portfolio
    portfolioValue  *= (1 + cagr);
    unrealisedGains += portfolioValue * cagr * unrealisedGainRate;
  }

  const annualSaving = exemptLimit * ltcgRate; // ₹15,625 when fully harvested

  return {
    annualSaving,
    lifetimeSaving: Math.round(totalTaxSaved),
    harvestYears,
    strategy: harvestYears === 0
      ? 'Insufficient unrealised gains to harvest. Gains must exceed ₹1.25L annually.'
      : `Harvested ₹1.25L gains in ${harvestYears} of ${years} years. Estimated total tax saved: ₹${Math.round(totalTaxSaved).toLocaleString('en-IN')} (₹${annualSaving.toLocaleString('en-IN')}/year when active).`,
  };
}
