// Sourcing — cross-marketplace cost comparison & arbitrage view
(function () {
  'use strict';

  const state = { productId: null, mkt: 'all' };

  const MARKET_NOTES = [
    { name: 'Alibaba', icon: '🏭', note: 'Factory-direct, lowest unit cost. MOQs 50–500+, 30–45 day sea lead times. Best for private label at scale.' },
    { name: 'AliExpress', icon: '📦', note: 'No MOQ, 2–3 week delivery. Higher unit cost — good for validating demand before a bulk order.' },
    { name: 'DHgate', icon: '🛒', note: 'Small-lot wholesale between AliExpress and Alibaba pricing. Watch supplier ratings closely.' },
    { name: 'Walmart / Target clearance', icon: '🏬', note: 'Retail arbitrage: instant sourcing, zero lead time, thin margins. Scan clearance aisles and rollbacks.' },
    { name: 'eBay lots', icon: '🧾', note: 'Bulk lots and liquidations. Inspect condition policies — returns hurt at thin margins.' },
    { name: 'Faire', icon: '🎁', note: 'US wholesale marketplace, fast shipping, boutique brands. Net-60 terms help cash flow.' }
  ];

  function render(el, ctx) {
    const products = ctx.products;
    if (!state.productId) state.productId = products[0].id;
    const p = products.find((x) => x.id === state.productId) || products[0];

    // Arbitrage table: every product × source, computed
    const markets = [...new Set(products.flatMap((x) => x.sources.map((s) => s.marketplace)))].sort();
    let rows = [];
    for (const prod of products) {
      for (const s of prod.sources) {
        const econ = Fees.forProduct(prod, s);
        rows.push({ prod, s, econ });
      }
    }
    if (state.mkt !== 'all') rows = rows.filter((r) => r.s.marketplace === state.mkt);
    rows.sort((a, b) => b.econ.roiPct - a.econ.roiPct);
    rows = rows.slice(0, 18);

    el.innerHTML = `
      <div class="grid grid-main-side">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Best sourcing plays right now</div>
              <div class="card-sub">Every catalog product × supplier, ranked by ROI after all fees</div>
            </div>
            <select class="field" id="s-mkt" style="width:auto;min-width:150px">
              <option value="all">All marketplaces</option>
              ${markets.map((m) => `<option ${state.mkt === m ? 'selected' : ''} value="${Fmt.esc(m)}">${Fmt.esc(m)}</option>`).join('')}
            </select>
          </div>
          <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Product</th><th>Buy from</th><th class="th-r">Landed</th><th class="th-r">Sell</th>
              <th class="th-r">Net/unit</th><th class="th-r">ROI</th><th class="th-r">MOQ cash</th></tr></thead>
            <tbody>
              ${rows.map((r) => `
                <tr class="rowlink" data-open="${r.prod.id}">
                  <td><div class="cell-product" style="min-width:190px">${UI.ptile(r.prod)}
                    <div><div class="p-name">${Fmt.esc(r.prod.name)}</div><div class="p-cat">${Fmt.esc(r.prod.category)}</div></div></div></td>
                  <td>${Fmt.esc(r.s.marketplace)}<div class="micro">MOQ ${r.s.moq} · ${r.s.leadDays}d</div></td>
                  <td class="td-r num">${Fmt.money(r.econ.landed)}</td>
                  <td class="td-r num">${Fmt.money(r.prod.price)}</td>
                  <td class="td-r num" style="font-weight:650;color:${r.econ.profit > 0 ? 'var(--good-text)' : 'var(--bad-text)'}">${Fmt.money(r.econ.profit)}</td>
                  <td class="td-r num" style="font-weight:650">${Fmt.pct(r.econ.roiPct)}</td>
                  <td class="td-r num">${Fmt.money(r.s.moq * (r.s.unitCost + r.s.shipPerUnit), 0)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-head"><div>
              <div class="card-title">Compare sources</div>
              <div class="card-sub">Landed cost vs. profit for one product</div>
            </div></div>
            <select class="field" id="s-prod">
              ${products.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${Fmt.esc(x.name)}</option>`).join('')}
            </select>
            <div class="mt-16">
              ${p.sources.map((s, i) => {
                const e = Fees.forProduct(p, s);
                return `<div class="src-option" data-open="${p.id}" style="cursor:pointer">
                  <div class="src-main">
                    <div class="src-name">${Fmt.esc(s.marketplace)}</div>
                    <div class="src-meta">${Fmt.money(s.unitCost)} unit + ${Fmt.money(s.shipPerUnit)} ship · ${s.leadDays} days</div>
                    <div class="mt-8">${Charts.stackBar([
                      { label: 'Landed', value: e.landed, color: Charts.SERIES[0] },
                      { label: 'Fees + ads', value: e.feesTotal + e.ads, color: Charts.SERIES[1] },
                      { label: 'Profit', value: Math.max(0, e.profit), color: Charts.SERIES[2] }
                    ])}</div>
                  </div>
                  <div class="src-right"><b class="num" style="color:${e.profit > 0 ? 'var(--good-text)' : 'var(--bad-text)'}">${Fmt.money(e.profit)}</b><span>net/unit</span></div>
                </div>`;
              }).join('')}
              <div class="legend mt-8">
                <span><i style="background:${Charts.SERIES[0]}"></i>Landed</span>
                <span><i style="background:${Charts.SERIES[1]}"></i>Fees + ads</span>
                <span><i style="background:${Charts.SERIES[2]}"></i>Profit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card section-gap">
        <div class="card-head"><div>
          <div class="card-title">Marketplace playbook</div>
          <div class="card-sub">Where each sourcing channel fits in a resale strategy</div>
        </div></div>
        <div class="grid grid-3">
          ${MARKET_NOTES.map((m) => `
            <div class="stat-mini" style="padding:14px">
              <div style="font-size:20px">${m.icon}</div>
              <b style="font-size:13px;margin-top:6px">${Fmt.esc(m.name)}</b>
              <div class="card-sub" style="margin-top:4px;line-height:1.5">${Fmt.esc(m.note)}</div>
            </div>`).join('')}
        </div>
      </div>
    `;

    el.querySelector('#s-mkt').addEventListener('change', (e) => { state.mkt = e.target.value; render(el, ctx); });
    el.querySelector('#s-prod').addEventListener('change', (e) => { state.productId = e.target.value; render(el, ctx); });
    el.querySelectorAll('[data-open]').forEach((n) =>
      n.addEventListener('click', () => ctx.openProduct(n.dataset.open)));
  }

  window.Pages = window.Pages || {};
  window.Pages.sourcing = { id: 'sourcing', title: 'Sourcing', nav: 'Sourcing', group: 'Research', icon: 'sourcing', render };
})();
