// Amazon fee model + unit economics (global: Fees).
// Rates come from the versioned FeeSchedule (data/fee-schedule.js); all figures
// are estimates — treat results as research guidance, not accounting.
(function (global) {
  'use strict';

  const S = () => global.FeeSchedule;

  function referralPct(category) {
    const map = S().referralPct;
    return map[category] != null ? map[category] : map.Default;
  }

  function tier(id) {
    return S().sizeTiers[id] || S().sizeTiers['large-std-1'];
  }

  // Core economics. `input` fields:
  //   price, category (or referralPctOverride), sizeTier (or fbaFeeOverride),
  //   unitCost, shipPerUnit, dutyPct, adsPct, returnRatePct, storageMonths,
  //   peakStorage (bool — apply the Q4 multiplier)
  function compute(input) {
    const price = +input.price || 0;
    const refPct = input.referralPctOverride != null ? +input.referralPctOverride : referralPct(input.category);
    const t = tier(input.sizeTier);
    const fba = input.fbaFeeOverride != null ? +input.fbaFeeOverride : t.fba;
    const storageBase = input.storageOverride != null ? +input.storageOverride : t.storage;
    const storagePerMonth = storageBase * (input.peakStorage ? S().peakStorageMultiplier : 1);

    const unitCost = +input.unitCost || 0;
    const ship = +input.shipPerUnit || 0;
    const duty = unitCost * ((+input.dutyPct || 0) / 100);
    const landed = unitCost + ship + duty;

    const referral = Math.max(price > 0 ? S().minReferral : 0, price * refPct / 100);
    const storage = storagePerMonth * (input.storageMonths != null ? +input.storageMonths : 1.5);
    const returns = price * ((input.returnRatePct != null ? +input.returnRatePct : 2) / 100);
    const ads = price * ((input.adsPct != null ? +input.adsPct : 8) / 100);

    const feesTotal = referral + fba + storage + returns;
    const profit = price - landed - feesTotal - ads;
    const marginPct = price > 0 ? (profit / price) * 100 : 0;
    const roiPct = landed > 0 ? (profit / landed) * 100 : 0;
    // Price where profit = 0 (referral/returns/ads scale with price)
    const varPct = (refPct + (input.returnRatePct != null ? +input.returnRatePct : 2) + (input.adsPct != null ? +input.adsPct : 8)) / 100;
    const breakevenPrice = varPct < 0.95 ? (landed + fba + storage) / (1 - varPct) : landed + feesTotal + ads;

    return {
      price, landed, unitCost, ship, duty,
      referral, fba, storage, returns, ads,
      feesTotal, profit, marginPct, roiPct,
      breakevenPrice,
      refPct
    };
  }

  // Economics for a product + one of its sourcing options, using stored assumptions.
  function forProduct(product, source, overrides) {
    const o = overrides || {};
    const store = global.Store;
    return compute({
      price: product.price,
      category: product.category,
      sizeTier: product.sizeTier,
      fbaFeeOverride: product.fbaFee,
      unitCost: source.unitCost,
      shipPerUnit: source.shipPerUnit,
      dutyPct: o.dutyPct != null ? o.dutyPct : (store ? store.get('dutyPct') : 0),
      adsPct: o.adsPct != null ? o.adsPct : (store ? store.get('adsPctOfPrice') : 8),
      returnRatePct: o.returnRatePct != null ? o.returnRatePct : (store ? store.get('returnRatePct') : 2),
      storageMonths: o.storageMonths != null ? o.storageMonths : (store ? store.get('storageMonths') : 1.5)
    });
  }

  // Best (highest-ROI) source for a product, with its economics attached.
  function bestSource(product) {
    let best = null;
    for (const s of product.sources) {
      const econ = forProduct(product, s);
      if (!best || econ.roiPct > best.econ.roiPct) best = { source: s, econ };
    }
    return best;
  }

  global.Fees = {
    referralPct, tier, compute, forProduct, bestSource,
    get SIZE_TIERS() { return S().sizeTiers; },
    get SCHEDULE() { return S(); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
