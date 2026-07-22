// Unit tests for the fee model — run with `npm test` (node --test)
'use strict';
const test = require('node:test');
const assert = require('node:assert');

// The renderer modules attach to `window`; in Node, point that at globalThis.
global.window = globalThis;
require('../src/js/data/fee-schedule.js');
require('../src/js/fees.js');

const Fees = globalThis.Fees;

test('referral percentages follow the schedule with a default fallback', () => {
  assert.equal(Fees.referralPct('Home & Kitchen'), 15);
  assert.equal(Fees.referralPct('Electronics'), 8);
  assert.equal(Fees.referralPct('Automotive'), 12);
  assert.equal(Fees.referralPct('Clothing & Accessories'), 17);
  assert.equal(Fees.referralPct('Nonexistent Category'), 15);
});

test('unknown size tiers fall back to large-std-1', () => {
  assert.equal(Fees.tier('nope').fba, Fees.tier('large-std-1').fba);
});

test('known unit-economics case computes correctly', () => {
  const e = Fees.compute({
    price: 19.99, category: 'Home & Kitchen', sizeTier: 'large-std-1',
    unitCost: 3.2, shipPerUnit: 0.8, dutyPct: 0,
    adsPct: 8, returnRatePct: 2, storageMonths: 1.5
  });
  assert.ok(Math.abs(e.landed - 4.0) < 1e-9, 'landed = unit + ship');
  assert.ok(Math.abs(e.referral - 19.99 * 0.15) < 1e-9, 'referral = 15%');
  assert.equal(e.fba, 4.16);
  assert.ok(Math.abs(e.storage - 0.16 * 1.5) < 1e-9);
  assert.ok(Math.abs(e.ads - 19.99 * 0.08) < 1e-9);
  assert.ok(Math.abs(e.returns - 19.99 * 0.02) < 1e-9);
  const expectedProfit = 19.99 - 4.0 - e.referral - 4.16 - e.storage - e.returns - e.ads;
  assert.ok(Math.abs(e.profit - expectedProfit) < 1e-9);
  assert.ok(e.profit > 6 && e.profit < 7, 'sanity: ~$6.5 profit');
  assert.ok(Math.abs(e.roiPct - (e.profit / 4.0) * 100) < 1e-9);
});

test('minimum referral fee applies to very cheap items', () => {
  const e = Fees.compute({ price: 1.5, category: 'Home & Kitchen', sizeTier: 'small-std', unitCost: 0.5 });
  assert.equal(e.referral, 0.30);
});

test('breakeven price yields ~zero profit when recomputed', () => {
  const base = {
    category: 'Pet Supplies', sizeTier: 'small-std',
    unitCost: 2.4, shipPerUnit: 0.6, dutyPct: 0,
    adsPct: 8, returnRatePct: 2, storageMonths: 1.5
  };
  const e = Fees.compute({ ...base, price: 13.99 });
  const atBreakeven = Fees.compute({ ...base, price: e.breakevenPrice });
  assert.ok(Math.abs(atBreakeven.profit) < 0.01, 'profit at breakeven ≈ 0, got ' + atBreakeven.profit);
});

test('duty is applied to unit cost only', () => {
  const noDuty = Fees.compute({ price: 20, category: 'Default', sizeTier: 'small-std', unitCost: 4, shipPerUnit: 1, dutyPct: 0 });
  const duty10 = Fees.compute({ price: 20, category: 'Default', sizeTier: 'small-std', unitCost: 4, shipPerUnit: 1, dutyPct: 10 });
  assert.ok(Math.abs((duty10.landed - noDuty.landed) - 0.4) < 1e-9);
});

test('peak storage multiplies the storage cost', () => {
  const base = { price: 25, category: 'Default', sizeTier: 'large-std-2', unitCost: 5, storageMonths: 2 };
  const off = Fees.compute({ ...base, peakStorage: false });
  const on = Fees.compute({ ...base, peakStorage: true });
  const mult = globalThis.FeeSchedule.peakStorageMultiplier;
  assert.ok(Math.abs(on.storage - off.storage * mult) < 1e-9);
  assert.ok(on.profit < off.profit);
});

test('negative-margin situations report negative profit and margin', () => {
  const e = Fees.compute({ price: 10, category: 'Default', sizeTier: 'large-bulky', unitCost: 6, shipPerUnit: 1 });
  assert.ok(e.profit < 0);
  assert.ok(e.marginPct < 0);
});
