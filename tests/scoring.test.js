// Unit tests for the opportunity-scoring engine
'use strict';
const test = require('node:test');
const assert = require('node:assert');

global.window = globalThis;
require('../src/js/data/fee-schedule.js');
require('../src/js/fees.js');
require('../src/js/scoring.js');

const Scoring = globalThis.Scoring;

const strongProduct = () => ({
  id: 't-strong', name: 'Strong', category: 'Pet Supplies', price: 19.99,
  sizeTier: 'small-std', fbaFee: 3.35, estMonthlySales: 1200, sellers: 8,
  reviewsTop10: 250, rating: 4.6, amazonOnListing: false,
  trend12: [80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 124],
  seasonal: null, flags: [],
  sources: [{ marketplace: 'Alibaba', unitCost: 2.2, shipPerUnit: 0.6, moq: 100, leadDays: 30, rating: 4.7 }]
});

const weakProduct = () => ({
  id: 't-weak', name: 'Weak', category: 'Home & Kitchen', price: 24.99,
  sizeTier: 'large-bulky', fbaFee: 10.4, estMonthlySales: 150, sellers: 55,
  reviewsTop10: 9000, rating: 4.1, amazonOnListing: true,
  trend12: [140, 132, 124, 116, 108, 102, 96, 92, 88, 85, 82, 80],
  seasonal: null, flags: ['ip-risk', 'oversize', 'volatile'],
  sources: [{ marketplace: 'eBay Lots', unitCost: 14, shipPerUnit: 2.5, moq: 5, leadDays: 7, rating: 4.0 }]
});

test('component weights sum to 1', () => {
  const sum = Object.values(Scoring.WEIGHTS).reduce((s, w) => s + w, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test('a strong product scores high, a weak one scores low', () => {
  const s = Scoring.score(strongProduct());
  const w = Scoring.score(weakProduct());
  assert.ok(s.total >= 70, 'strong total ' + s.total);
  assert.ok(w.total < 50, 'weak total ' + w.total);
  assert.ok(s.total > w.total + 20);
  assert.equal(w.verdict.label, 'Weak');
});

test('all score components stay within [0, 1]', () => {
  for (const p of [strongProduct(), weakProduct()]) {
    const { parts } = Scoring.score(p);
    for (const [k, v] of Object.entries(parts)) {
      assert.ok(v >= 0 && v <= 1, k + ' out of range: ' + v);
    }
  }
});

test('trendPct is positive for rising and negative for fading demand', () => {
  assert.ok(Scoring.trendPct(strongProduct()) > 20);
  assert.ok(Scoring.trendPct(weakProduct()) < -20);
});

test('risk score never drops below its floor', () => {
  const p = strongProduct();
  p.flags = ['seasonal', 'fragile', 'ip-risk', 'gated', 'oversize', 'volatile', 'electric'];
  const { parts } = Scoring.score(p);
  assert.ok(Math.abs(parts.risk - 0.3) < 1e-9);
});

test('Amazon on the listing lowers the competition score', () => {
  const a = strongProduct();
  const b = strongProduct();
  b.amazonOnListing = true;
  assert.ok(Scoring.score(b).parts.competition < Scoring.score(a).parts.competition);
});

test('verdict bands map correctly', () => {
  assert.equal(Scoring.verdict(80).label, 'Excellent');
  assert.equal(Scoring.verdict(70).label, 'Strong');
  assert.equal(Scoring.verdict(55).label, 'Moderate');
  assert.equal(Scoring.verdict(40).label, 'Weak');
});

test('scoreAll sorts descending and attaches best source', () => {
  const list = Scoring.scoreAll([weakProduct(), strongProduct()]);
  assert.equal(list[0].id, 't-strong');
  assert.ok(list[0].best && list[0].best.econ.profit > 0);
});
