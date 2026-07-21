// Amazon fee model + unit economics (global: Fees).
// All figures are estimates modeled on published US FBA rate cards; treat
// results as research guidance, not accounting.
(function () {
  'use strict';

  // Referral fee % by category (simplified US schedule)
  const REFERRAL_PCT = {
    'Home & Kitchen': 15,
    'Kitchen & Dining': 15,
    'Pet Supplies': 15,
    'Sports & Outdoors': 15,
    'Beauty & Personal Care': 15,
    'Health & Household': 15,
    'Office Products': 15,
    'Toys & Games': 15,
    'Patio & Garden': 15,
    'Baby': 15,
    'Arts & Crafts': 15,
    'Automotive': 12,
    'Tools & Home Improvement': 15,
    'Electronics': 8,
    'Electronics Accessories': 15,
    'Clothing & Accessories': 17,
    'Grocery': 15,
    'Default': 15
  };

  // FBA fulfillment fee + monthly storage estimate by size tier (US, non-peak)
  const SIZE_TIERS = {
    'small-std':   { label: 'Small standard (≤ 16 oz)',        fba: 3.35,  storage: 0.10 },
    'large-std-1': { label: 'Large standard (≤ 1 lb)',         fba: 4.16,  storage: 0.16 },
    'large-std-2': { label: 'Large standard (1–2 lb)',         fba: 4.90,  storage: 0.22 },
    'large-std-3': { label: 'Large standard (2–3 lb)',         fba: 5.68,  storage: 0.28 },
    'large-std-h': { label: 'Large standard (3–20 lb)',        fba: 7.10,  storage: 0.42 },
    'large-bulky': { label: 'Large bulky (oversize)',          fba: 10.40, storage: 0.85 },
    'extra-large': { label: 'Extra large / heavy',             fba: 16.80, storage: 1.60 }
  };

  const MIN_REFERRAL = 0.30;

  function referralPct(category) {
    return REFERRAL_PCT[category] != null ? REFERRAL_PCT[category] : REFERRAL_PCT.Default;
  }

  function tier(id) {
    return SIZE_TIERS[id] || SIZE_TIERS['large-std-1'];
  }

  // Core economics. `input` fields:
  //   price, category (or referralPctOverride), sizeTier (or fbaFeeOverride),
  //   unitCost, shipPerUnit, dutyPct, adsPct, returnRatePct, storageMonths
  function compute(input) {
    const price = +input.price || 0;
    const refPct = input.referralPctOverride != null ? +input.referralPctOverride : referralPct(input.category);
    const t = tier(input.sizeTier);
    const fba = input.fbaFeeOverride != null ? +input.fbaFeeOverride : t.fba;
    const storagePerMonth = input.storageOverride != null ? +input.storageOverride : t.storage;

    const unitCost = +input.unitCost || 0;
    const ship = +input.shipPerUnit || 0;
    const duty = unitCost * ((+input.dutyPct || 0) / 100);
    const landed = unitCost + ship + duty;

    const referral = Math.max(price > 0 ? MIN_REFERRAL : 0, price * refPct / 100);
    const storage = storagePerMonth * (input.storageMonths != null ? +input.storageMonths : 1.5);
    const returns = price * ((input.returnRatePct != null ? +input.returnRatePct : 2) / 100);
    const ads = price * ((input.adsPct != null ? +input.adsPct : 8) / 100);

    const feesTotal = referral + fba + storage + returns;
    const profit = price - landed - feesTotal - ads;
    const marginPct = price > 0 ? (profit / price) * 100 : 0;
    const roiPct = landed > 0 ? (profit / landed) * 100 : 0;
    const breakeven = landed + feesTotal + ads; // price at which profit = 0 (approx: fees scale w/ price, so iterate once)
    // One refinement pass since referral/returns/ads scale with price:
    const varPct = (refPct + (input.returnRatePct != null ? +input.returnRatePct : 2) + (input.adsPct != null ? +input.adsPct : 8)) / 100;
    const breakevenPrice = varPct < 0.95 ? (landed + fba + storage) / (1 - varPct) : breakeven;

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
    return compute({
      price: product.price,
      category: product.category,
      sizeTier: product.sizeTier,
      fbaFeeOverride: product.fbaFee,
      unitCost: source.unitCost,
      shipPerUnit: source.shipPerUnit,
      dutyPct: o.dutyPct != null ? o.dutyPct : (window.Store ? Store.get('dutyPct') : 0),
      adsPct: o.adsPct != null ? o.adsPct : (window.Store ? Store.get('adsPctOfPrice') : 8),
      returnRatePct: o.returnRatePct != null ? o.returnRatePct : (window.Store ? Store.get('returnRatePct') : 2),
      storageMonths: o.storageMonths != null ? o.storageMonths : (window.Store ? Store.get('storageMonths') : 1.5)
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

  window.Fees = { referralPct, tier, SIZE_TIERS, compute, forProduct, bestSource };
})();
