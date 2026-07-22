// Unit tests for the Amazon transaction-report parser
'use strict';
const test = require('node:test');
const assert = require('node:assert');

global.window = globalThis;
require('../src/js/actuals.js');

const Actuals = globalThis.Actuals;

const SAMPLE = [
  '"Includes Amazon Marketplace, Fulfillment by Amazon (FBA), and Amazon Webstore transactions"',
  '"date/time","settlement id","type","order id","sku","description","quantity","marketplace","fulfillment","order city","order state","order postal","product sales","shipping credits","gift wrap credits","promotional rebates","selling fees","fba fees","other transaction fees","other","total"',
  '"Jan 5, 2026 1:23:45 PM PST","12345","Order","111-1111111-1111111","SS-DOGBOWL-2PK","Collapsible Bowl, 2-Pack","1","amazon.com","Amazon","Austin","TX","78701","13.99","0","0","0","-2.10","-3.35","0","0","8.54"',
  '"Jan 6, 2026 9:03:12 AM PST","12345","Order","111-2222222-2222222","SS-DOGBOWL-2PK","Collapsible Bowl, 2-Pack","2","amazon.com","Amazon","Denver","CO","80014","27.98","0","0","0","-4.20","-6.70","0","0","17.08"',
  '"Jan 7, 2026 4:44:00 PM PST","12345","Refund","111-1111111-1111111","SS-DOGBOWL-2PK","Collapsible Bowl, 2-Pack","1","amazon.com","Amazon","Austin","TX","78701","-13.99","0","0","0","2.10","0","0","0","-11.89"',
  '"Jan 8, 2026 11:00:00 AM PST","12345","Order","111-3333333-3333333","SS-SPICE-12","Spice Jars, 12-Set","1","amazon.com","Amazon","Tampa","FL","33601","25.99","0","0","0","-3.90","-4.90","0","0","17.19"',
  '"Jan 9, 2026 12:00:00 PM PST","12345","Service Fee","","","FBA storage fee","","amazon.com","","","","","0","0","0","0","0","0","0","-1.42","-1.42"'
].join('\n');

test('parses a transaction report with preamble and quoted fields', () => {
  const r = Actuals.parse(SAMPLE);
  assert.equal(r.ok, true);
  assert.equal(r.rows, 5);
  assert.equal(r.orders, 3);
});

test('totals aggregate sales, fees, refunds and net', () => {
  const r = Actuals.parse(SAMPLE);
  assert.ok(Math.abs(r.totals.sales - (13.99 + 27.98 - 13.99 + 25.99)) < 1e-9);
  assert.ok(Math.abs(r.totals.net - (8.54 + 17.08 - 11.89 + 17.19 - 1.42)) < 1e-9);
  assert.ok(Math.abs(r.totals.refunds - (-11.89)) < 1e-9);
  assert.ok(Math.abs(r.totals.fbaFees - (-3.35 - 6.70 - 4.90)) < 1e-9);
});

test('per-SKU rollup nets refunds against units and revenue', () => {
  const r = Actuals.parse(SAMPLE);
  const bowl = r.perSku.find((s) => s.sku === 'SS-DOGBOWL-2PK');
  assert.ok(bowl);
  assert.equal(bowl.units, 2); // 1 + 2 − 1 refund
  assert.ok(Math.abs(bowl.net - (8.54 + 17.08 - 11.89)) < 1e-9);
  const spice = r.perSku.find((s) => s.sku === 'SS-SPICE-12');
  assert.equal(spice.units, 1);
});

test('period covers the report date range', () => {
  const r = Actuals.parse(SAMPLE);
  assert.ok(r.period.from < r.period.to);
  assert.equal(new Date(r.period.from).getUTCDate(), 5);
});

test('rejects files that are not transaction reports', () => {
  const r = Actuals.parse('name,age\nalice,30\n');
  assert.equal(r.ok, false);
  assert.ok(r.error.length > 10);
});

test('csv line splitter handles embedded quotes and commas', () => {
  const cells = Actuals.splitLine('"a, ""quoted"" cell",plain,"3"');
  assert.deepEqual(cells, ['a, "quoted" cell', 'plain', '3']);
});
