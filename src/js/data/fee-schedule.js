// Versioned Amazon fee schedule (global: FeeSchedule).
// Rates change every year — update THIS file only; fees.js consumes it.
// The `effective` date is shown in the UI so estimates are never silently stale.
(function (global) {
  'use strict';

  global.FeeSchedule = {
    effective: '2026-01-15',
    label: 'US FBA rate card · effective Jan 2026',
    minReferral: 0.30,

    // Referral fee % by category (simplified US schedule)
    referralPct: {
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
    },

    // FBA fulfillment fee + monthly storage estimate by size tier (non-peak)
    sizeTiers: {
      'small-std':   { label: 'Small standard (≤ 16 oz)',  fba: 3.35,  storage: 0.10 },
      'large-std-1': { label: 'Large standard (≤ 1 lb)',   fba: 4.16,  storage: 0.16 },
      'large-std-2': { label: 'Large standard (1–2 lb)',   fba: 4.90,  storage: 0.22 },
      'large-std-3': { label: 'Large standard (2–3 lb)',   fba: 5.68,  storage: 0.28 },
      'large-std-h': { label: 'Large standard (3–20 lb)',  fba: 7.10,  storage: 0.42 },
      'large-bulky': { label: 'Large bulky (oversize)',    fba: 10.40, storage: 0.85 },
      'extra-large': { label: 'Extra large / heavy',       fba: 16.80, storage: 1.60 }
    },

    // Oct–Dec storage runs ~3× the non-peak rate
    peakStorageMultiplier: 3.0
  };
})(typeof window !== 'undefined' ? window : globalThis);
