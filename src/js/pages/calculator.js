// Profit Calculator — full FBA unit-economics workbench
(function () {
  'use strict';

  const state = {
    name: '', price: 24.99, category: 'Home & Kitchen', sizeTier: 'large-std-1',
    fbaFee: null, unitCost: 5.5, shipPerUnit: 1.5, dutyPct: 0,
    adsPct: null, returnRatePct: null, storageMonths: null, monthlyUnits: 300
  };

  function prefill(params) {
    if (!params) return;
    for (const k of Object.keys(params)) {
      if (k in state) state[k] = params[k];
    }
  }

  function currentEcon() {
    return Fees.compute({
      price: state.price,
      category: state.category,
      sizeTier: state.sizeTier,
      fbaFeeOverride: state.fbaFee != null && state.fbaFee !== '' ? +state.fbaFee : null,
      unitCost: state.unitCost,
      shipPerUnit: state.shipPerUnit,
      dutyPct: state.dutyPct,
      adsPct: state.adsPct != null ? state.adsPct : Store.get('adsPctOfPrice'),
      returnRatePct: state.returnRatePct != null ? state.returnRatePct : Store.get('returnRatePct'),
      storageMonths: state.storageMonths != null ? state.storageMonths : Store.get('storageMonths')
    });
  }

  // Inputs are shown/typed in the display currency; state stays in USD so the
  // fee model (a USD rate card) keeps consistent units.
  const MONEY_FIELDS = ['price', 'unitCost', 'shipPerUnit', 'fbaFee'];
  const disp = (v) => Math.round(v * Fmt.rate() * 100) / 100;
  const toUsd = (v) => v / Fmt.rate();

  function render(el, ctx) {
    if (ctx.calcPrefill) { prefill(ctx.calcPrefill); ctx.calcPrefill = null; }
    const econ = currentEcon();
    const cats = Object.keys(Fees.SIZE_TIERS);
    const monthly = {
      revenue: econ.price * state.monthlyUnits,
      profit: econ.profit * state.monthlyUnits,
      spend: econ.landed * state.monthlyUnits
    };

    // sensitivity: profit at price/cost ±10%
    const sens = (dPrice, dCost) => Fees.compute({
      price: state.price * (1 + dPrice), category: state.category, sizeTier: state.sizeTier,
      fbaFeeOverride: state.fbaFee != null && state.fbaFee !== '' ? +state.fbaFee : null,
      unitCost: state.unitCost * (1 + dCost), shipPerUnit: state.shipPerUnit, dutyPct: state.dutyPct,
      adsPct: state.adsPct != null ? state.adsPct : Store.get('adsPctOfPrice'),
      returnRatePct: state.returnRatePct != null ? state.returnRatePct : Store.get('returnRatePct'),
      storageMonths: state.storageMonths != null ? state.storageMonths : Store.get('storageMonths')
    }).profit;

    const F = (id, label, value, attrs, hint) => `
      <div class="field-row">
        <label class="field-label" for="c-${id}">${label}</label>
        <input class="field num" id="c-${id}" data-k="${id}" type="number" value="${value}" ${attrs || ''}>
        ${hint ? `<span class="field-hint">${hint}</span>` : ''}
      </div>`;

    el.innerHTML = `
      <div class="calc-grid">
        <div class="card">
          <div class="card-head"><div>
            <div class="card-title">Inputs</div>
            <div class="card-sub">${state.name ? 'Prefilled from “' + Fmt.esc(state.name) + '”' : 'Model any product’s unit economics'}</div>
          </div></div>
          <div class="calc-form">
            ${F('price', 'Sale price (' + Fmt.sym() + ')', disp(state.price), 'step="0.01" min="0"')}
            <div class="field-row">
              <label class="field-label" for="c-category">Category (referral fee) ${Info.btn('referral')}</label>
              <select class="field" id="c-category" data-k="category">
                ${['Home & Kitchen','Kitchen & Dining','Pet Supplies','Sports & Outdoors','Beauty & Personal Care','Health & Household','Office Products','Toys & Games','Patio & Garden','Baby','Automotive','Electronics','Electronics Accessories','Clothing & Accessories','Grocery']
                  .map((c) => `<option ${c === state.category ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
              <span class="field-hint">${Fees.referralPct(state.category)}% referral fee</span>
            </div>
            ${F('unitCost', 'Unit cost (' + Fmt.sym() + ')', disp(state.unitCost), 'step="0.01" min="0"')}
            ${F('shipPerUnit', 'Shipping / unit (' + Fmt.sym() + ')', disp(state.shipPerUnit), 'step="0.01" min="0"', 'freight + inbound, per unit')}
            <div class="field-row">
              <label class="field-label" for="c-sizeTier">Size tier (FBA fee) ${Info.btn('sizeTier')}</label>
              <select class="field" id="c-sizeTier" data-k="sizeTier">
                ${cats.map((t) => `<option value="${t}" ${t === state.sizeTier ? 'selected' : ''}>${Fees.SIZE_TIERS[t].label}</option>`).join('')}
              </select>
              <span class="field-hint">est. ${Fmt.money(Fees.tier(state.sizeTier).fba)} fulfillment</span>
            </div>
            ${F('fbaFee', 'FBA fee override (' + Fmt.sym() + ')', state.fbaFee != null ? disp(state.fbaFee) : '', 'step="0.01" min="0" placeholder="auto"', 'leave blank to use size tier')}
            ${F('dutyPct', 'Import duty (%) ' + Info.btn('duty'), state.dutyPct, 'step="0.5" min="0"')}
            ${F('adsPct', 'Advertising (% of price) ' + Info.btn('tacos'), state.adsPct != null ? state.adsPct : Store.get('adsPctOfPrice'), 'step="0.5" min="0"', 'TACoS — total ad cost of sales')}
            ${F('returnRatePct', 'Return rate (%) ' + Info.btn('returnRate'), state.returnRatePct != null ? state.returnRatePct : Store.get('returnRatePct'), 'step="0.5" min="0"')}
            ${F('storageMonths', 'Months in storage ' + Info.btn('storageMonths'), state.storageMonths != null ? state.storageMonths : Store.get('storageMonths'), 'step="0.5" min="0"')}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="calc-hero">
              <div class="v num ${econ.profit < 0 ? 'neg' : ''}">${Fmt.money(econ.profit)}</div>
              <div class="l">net profit per unit ${econ.profit < 0 ? '· losing money at these numbers' : ''}</div>
            </div>
            <div class="mt-16">${Charts.stackBar([
              { label: 'Landed cost', value: econ.landed, color: Charts.SERIES[0] },
              { label: 'Amazon fees', value: econ.feesTotal, color: Charts.SERIES[1] },
              { label: 'Advertising', value: econ.ads, color: Charts.SERIES[3] },
              { label: 'Profit', value: Math.max(0, econ.profit), color: Charts.SERIES[2] }
            ])}</div>
            <div class="legend mt-8">
              <span><i style="background:${Charts.SERIES[0]}"></i>Landed ${Fmt.money(econ.landed)}</span>
              <span><i style="background:${Charts.SERIES[1]}"></i>Amazon fees ${Fmt.money(econ.feesTotal)}</span>
              <span><i style="background:${Charts.SERIES[3]}"></i>Ads ${Fmt.money(econ.ads)}</span>
              <span><i style="background:${Charts.SERIES[2]}"></i>Profit ${Fmt.money(Math.max(0, econ.profit))}</span>
            </div>
            <div class="pill-stats">
              <span class="pill-stat"><b class="num">${Fmt.pct(econ.marginPct)}</b> net margin ${Info.btn('netMargin')}</span>
              <span class="pill-stat"><b class="num">${Fmt.pct(econ.roiPct)}</b> ROI ${Info.btn('roi')}</span>
              <span class="pill-stat"><b class="num">${Fmt.money(econ.breakevenPrice)}</b> breakeven ${Info.btn('breakeven')}</span>
              <span class="pill-stat"><b class="num">${Fmt.money(econ.referral)}</b> referral</span>
              <span class="pill-stat"><b class="num">${Fmt.money(econ.fba)}</b> FBA</span>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div>
              <div class="card-title">Monthly projection</div>
              <div class="card-sub">Scale unit economics to a sales target</div>
            </div></div>
            <div class="range-row">
              <input type="range" class="slider" id="c-units" min="25" max="3000" step="25" value="${state.monthlyUnits}">
              <span class="range-val num">${Fmt.num(state.monthlyUnits)} units</span>
            </div>
            <div class="stat-trio">
              <div class="stat-mini"><b class="num">${Fmt.money(monthly.revenue, 0)}</b><span>Revenue / mo</span></div>
              <div class="stat-mini"><b class="num" style="color:${monthly.profit >= 0 ? 'var(--good-text)' : 'var(--bad-text)'}">${Fmt.money(monthly.profit, 0)}</b><span>Profit / mo</span></div>
              <div class="stat-mini"><b class="num">${Fmt.money(monthly.spend, 0)}</b><span>Inventory spend</span></div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div>
              <div class="card-title">Sensitivity</div>
              <div class="card-sub">Profit per unit if price or cost moves 10%</div>
            </div></div>
            <div class="table-wrap"><table class="table">
              <thead><tr><th></th><th class="th-r">Cost −10%</th><th class="th-r">Cost as-is</th><th class="th-r">Cost +10%</th></tr></thead>
              <tbody>
                ${[[0.1, 'Price +10%'], [0, 'Price as-is'], [-0.1, 'Price −10%']].map(([dp, label]) => `
                  <tr><td style="font-weight:600">${label}</td>
                  ${[-0.1, 0, 0.1].map((dc) => {
                    const v = sens(dp, dc);
                    return `<td class="td-r num" style="font-weight:${dp === 0 && dc === 0 ? 700 : 400};color:${v >= 0 ? 'var(--good-text)' : 'var(--bad-text)'}">${Fmt.money(v)}</td>`;
                  }).join('')}</tr>`).join('')}
              </tbody>
            </table></div>
          </div>
        </div>
      </div>
      <div class="disclaimer">Fee estimates follow simplified US FBA rate cards. Always confirm with Amazon’s
      revenue calculator for the exact ASIN dimensions before committing to inventory.</div>
    `;

    el.querySelectorAll('[data-k]').forEach((input) => {
      input.addEventListener('change', () => {
        const k = input.dataset.k;
        if (k === 'category' || k === 'sizeTier') state[k] = input.value;
        else if (k === 'fbaFee') state.fbaFee = input.value === '' ? null : toUsd(+input.value);
        else if (MONEY_FIELDS.includes(k)) state[k] = input.value === '' ? 0 : toUsd(+input.value);
        else state[k] = input.value === '' ? 0 : +input.value;
        render(el, ctx);
      });
    });
    const units = el.querySelector('#c-units');
    units.addEventListener('input', () => {
      state.monthlyUnits = +units.value;
      el.querySelector('.range-val').textContent = Fmt.num(state.monthlyUnits) + ' units';
    });
    units.addEventListener('change', () => render(el, ctx));
  }

  window.Pages = window.Pages || {};
  window.Pages.calculator = { id: 'calculator', title: 'Profit Calculator', nav: 'Profit Calculator', group: 'Tools', icon: 'calculator', render };
})();
