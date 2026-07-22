// Amazon settlement / transaction report parser (global: Actuals).
// Accepts the "Transaction report" CSV exported from Seller Central → Payments.
// Pure function of the file text — also loaded by the Node test suite.
(function (global) {
  'use strict';

  // Split one CSV line respecting double-quoted fields
  function splitLine(line) {
    const out = [];
    let cell = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cell += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { out.push(cell); cell = ''; }
      else cell += ch;
    }
    out.push(cell);
    return out;
  }

  const toNum = (s) => {
    const v = parseFloat(String(s == null ? '' : s).replace(/[$,"\s]/g, ''));
    return isNaN(v) ? 0 : v;
  };

  function findCol(header, ...names) {
    for (const name of names) {
      const i = header.findIndex((h) => h.includes(name));
      if (i >= 0) return i;
    }
    return -1;
  }

  function parse(content) {
    const lines = String(content || '').split(/\r?\n/).filter((l) => l.trim());
    // The report sometimes has preamble lines; find the real header row.
    let hi = -1, header = null;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const cells = splitLine(lines[i]).map((c) => c.trim().toLowerCase());
      if (cells.includes('type') && cells.some((c) => c === 'total')) { hi = i; header = cells; break; }
    }
    if (hi < 0) return { ok: false, error: 'This does not look like an Amazon transaction report (no header row with “type” and “total”).' };

    const col = {
      date: findCol(header, 'date/time', 'date'),
      type: findCol(header, 'type'),
      orderId: findCol(header, 'order id'),
      sku: findCol(header, 'sku'),
      qty: findCol(header, 'quantity'),
      sales: findCol(header, 'product sales'),
      sellingFees: findCol(header, 'selling fees'),
      fbaFees: findCol(header, 'fba fees'),
      otherFees: findCol(header, 'other transaction fees'),
      other: findCol(header, 'other'),
      total: findCol(header, 'total')
    };

    const totals = { sales: 0, sellingFees: 0, fbaFees: 0, otherFees: 0, other: 0, net: 0, refunds: 0, serviceFees: 0 };
    const perSku = {};
    const orderIds = new Set();
    let minTs = Infinity, maxTs = -Infinity, rows = 0;

    for (let i = hi + 1; i < lines.length; i++) {
      const c = splitLine(lines[i]);
      if (c.length < 3) continue;
      const type = (c[col.type] || '').trim().toLowerCase();
      if (!type) continue;
      rows++;

      const total = toNum(c[col.total]);
      totals.net += total;
      totals.sales += toNum(c[col.sales]);
      totals.sellingFees += toNum(c[col.sellingFees]);
      totals.fbaFees += toNum(c[col.fbaFees]);
      totals.otherFees += toNum(c[col.otherFees]);
      totals.other += col.other >= 0 ? toNum(c[col.other]) : 0;

      if (type === 'refund') totals.refunds += total;
      if (type.includes('service fee') || type.includes('subscription')) totals.serviceFees += total;

      const ts = col.date >= 0 ? Date.parse((c[col.date] || '').replace(/ (PST|PDT|UTC|GMT).*$/, '')) : NaN;
      if (!isNaN(ts)) { minTs = Math.min(minTs, ts); maxTs = Math.max(maxTs, ts); }
      if (col.orderId >= 0 && c[col.orderId]) orderIds.add(c[col.orderId]);

      const sku = col.sku >= 0 ? (c[col.sku] || '').trim() : '';
      if (sku) {
        const rec = perSku[sku] || (perSku[sku] = { sku, units: 0, sales: 0, fees: 0, net: 0 });
        if (type === 'order') rec.units += Math.abs(toNum(c[col.qty])) || 0;
        if (type === 'refund') rec.units -= Math.abs(toNum(c[col.qty])) || 0;
        rec.sales += toNum(c[col.sales]);
        rec.fees += toNum(c[col.sellingFees]) + toNum(c[col.fbaFees]) + toNum(c[col.otherFees]);
        rec.net += total;
      }
    }

    if (!rows) return { ok: false, error: 'No transaction rows found in the file.' };

    return {
      ok: true,
      totals,
      perSku: Object.values(perSku).sort((a, b) => b.net - a.net),
      orders: orderIds.size,
      rows,
      period: {
        from: isFinite(minTs) ? minTs : null,
        to: isFinite(maxTs) ? maxTs : null
      }
    };
  }

  global.Actuals = { parse, splitLine, toNum };
})(typeof window !== 'undefined' ? window : globalThis);
