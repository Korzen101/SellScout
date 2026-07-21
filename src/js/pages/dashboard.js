// Dashboard page
(function () {
  'use strict';

  function render(el, ctx) {
    const products = ctx.products;
    const top = products.slice(0, 5);
    const top10 = products.slice(0, 10);
    const avgScore = Math.round(top10.reduce((s, p) => s + p.scoring.total, 0) / top10.length);
    const medianRoi = (() => {
      const r = top10.map((p) => p.best.econ.roiPct).sort((a, b) => a - b);
      return r[Math.floor(r.length / 2)];
    })();
    const rising = DemoData.trends.rising[0];
    const oppCount = products.filter((p) => p.scoring.total >= 65).length;

    // Category strength: avg score by category (top 6)
    const byCat = {};
    for (const p of products) {
      (byCat[p.category] = byCat[p.category] || []).push(p.scoring.total);
    }
    const catBars = Object.entries(byCat)
      .map(([c, arr]) => ({ label: c, value: arr.reduce((s, x) => s + x, 0) / arr.length }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((x, i) => ({ ...x, color: Charts.ringColor(x.value) }));

    // Market pulse: 3 top rising category indexes
    const pulse = DemoData.trends.rising.slice(0, 3).map((t, i) => ({
      name: t.name.split(' ')[0], values: t.spark, color: Charts.SERIES[i]
    }));

    const news = (ctx.news.items || DemoData.news).slice(0, 4);

    el.innerHTML = `
      <div class="hero">
        <div class="hero-hi">${Fmt.greeting()}${Store.get('userName') ? ', ' + Fmt.esc(Store.get('userName')) : ''}</div>
        <div class="hero-date">${Fmt.longDate()} · ${ctx.newsLive ? 'Live market feed connected' : 'Here’s where the market stands.'}</div>
      </div>

      <div class="kpis">
        <div class="card kpi">
          <div class="kpi-label">${Icons.spark} Viable opportunities ${Info.btn('score')}</div>
          <div class="kpi-value num">${oppCount}</div>
          <div class="kpi-foot">score 65+ of ${products.length} tracked</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">${Icons.finder} Avg score · top 10 ${Info.btn('score')}</div>
          <div class="kpi-value num">${avgScore}<span class="unit"> / 100</span></div>
          <div class="kpi-foot"><span class="chip chip-${Scoring.verdict(avgScore).cls}">${Scoring.verdict(avgScore).label}</span></div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">${Icons.dollar} Median ROI · top 10 ${Info.btn('roi')}</div>
          <div class="kpi-value num">${Fmt.pct(medianRoi)}</div>
          <div class="kpi-foot">after fees, ads & shipping</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">${Icons.trends} Hottest trend</div>
          <div class="kpi-value" style="font-size:17px;line-height:1.25;margin-top:8px">${Fmt.esc(rising.name)}</div>
          <div class="kpi-foot"><span class="delta-up">${Fmt.signPct(rising.growthPct)}</span> search demand · 12 mo</div>
        </div>
      </div>

      <div class="grid grid-main-side section-gap">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Top opportunities</div>
              <div class="card-sub">Highest combined demand, margin, trend and competition scores</div>
            </div>
            <button class="btn btn-tint btn-sm" data-nav="finder">View all ${Icons.chevR}</button>
          </div>
          <div class="opp-list">
            ${top.map((p) => `
              <div class="opp-item" data-open="${p.id}">
                ${UI.ptile(p)}
                <div class="opp-main">
                  <div class="opp-name">${Fmt.esc(p.name)}</div>
                  <div class="opp-meta">${Fmt.esc(p.category)} · ${Fmt.money(p.price)} · ${Fmt.compact(p.estMonthlySales)} sales/mo</div>
                </div>
                <div class="opp-stats">
                  <div class="opp-stat"><b class="num">${Fmt.pct(p.best.econ.marginPct)}</b><span>margin</span></div>
                  <div class="opp-stat"><b class="num">${Fmt.pct(p.best.econ.roiPct)}</b><span>ROI</span></div>
                  <div class="opp-stat" style="min-width:96px">${Charts.sparkline(p.trend12, { w: 92, h: 28 })}</div>
                  ${Charts.scoreRing(p.scoring.total, { size: 42, thickness: 4.5 })}
                </div>
              </div>`).join('')}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-head">
              <div>
                <div class="card-title">Market pulse</div>
                <div class="card-sub">Search-demand index, 12 months</div>
              </div>
            </div>
            ${Charts.multiLine(pulse, { w: 420, h: 190, labels: Fmt.last12Labels() })}
            <div class="legend mt-8">
              ${pulse.map((s) => `<span><i style="background:${s.color}"></i>${Fmt.esc(s.name)}</span>`).join('')}
            </div>
          </div>
          <div class="card">
            <div class="card-head">
              <div><div class="card-title">Category strength</div>
              <div class="card-sub">Average opportunity score</div></div>
            </div>
            ${Charts.barsH(catBars, { max: 100 })}
          </div>
        </div>
      </div>

      <div class="grid grid-main-side section-gap">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Latest market intel</div>
              <div class="card-sub">${ctx.newsLive ? 'Live from retail & marketplace feeds' : 'Bundled sample headlines — press refresh for live feeds'}</div>
            </div>
            <button class="btn btn-tint btn-sm" data-nav="trendsnews">All news ${Icons.chevR}</button>
          </div>
          ${news.map((n) => UI.newsRow(n)).join('')}
        </div>

        <div class="card">
          <div class="card-head">
            <div><div class="card-title">Quick actions</div></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:9px">
            <button class="btn btn-quiet" style="justify-content:flex-start" data-nav="finder">${Icons.finder} Browse ranked products</button>
            <button class="btn btn-quiet" style="justify-content:flex-start" data-nav="sourcing">${Icons.sourcing} Compare sourcing costs</button>
            <button class="btn btn-quiet" style="justify-content:flex-start" data-nav="calculator">${Icons.calculator} Run a profit calculation</button>
            <button class="btn btn-quiet" style="justify-content:flex-start" data-nav="business">${Icons.business} Review my business</button>
          </div>
          <div class="micro mt-16">Tip: press <b>/</b> anywhere to search the catalog.</div>
        </div>
      </div>

      <div class="disclaimer">Scores, fees and profit figures are research estimates based on catalog data and
      simplified fee schedules — verify against Amazon’s revenue calculator and live quotes before ordering inventory.</div>
    `;

    el.querySelectorAll('[data-open]').forEach((n) =>
      n.addEventListener('click', () => ctx.openProduct(n.dataset.open)));
    el.querySelectorAll('[data-nav]').forEach((n) =>
      n.addEventListener('click', () => ctx.navigate(n.dataset.nav)));
    Charts.activate(el);
  }

  window.Pages = window.Pages || {};
  window.Pages.dashboard = { id: 'dashboard', title: 'Dashboard', nav: 'Dashboard', group: 'Research', icon: 'dashboard', render };
})();
