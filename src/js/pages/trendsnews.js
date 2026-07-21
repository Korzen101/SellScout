// Trends & News — rising/fading categories, seasonal planner, market headlines
(function () {
  'use strict';

  const state = { newsFilter: 'all', trendTab: 'rising' };

  function classifyLive(item) {
    // Naive sentiment tagging for live RSS items
    const t = (item.title + ' ' + (item.summary || '')).toLowerCase();
    if (/tariff|ban|lawsuit|counterfeit|crackdown|fee increase|restrict|recall|suspend|fraud|scrutiny|penalt/.test(t)) return 'risk';
    if (/growth|surge|record|rise|rising|boom|expand|opportunit|lower fee|discount|gain|soar|strong/.test(t)) return 'opp';
    return 'neutral';
  }

  function render(el, ctx) {
    const T = DemoData.trends;
    const list = state.trendTab === 'rising' ? T.rising : T.fading;
    const nowMonth = new Date().getMonth();

    let news = (ctx.news.items || DemoData.news).map((n) => ({
      ...n, sentiment: n.sentiment || classifyLive(n)
    }));
    if (state.newsFilter !== 'all') news = news.filter((n) => n.sentiment === state.newsFilter);

    el.innerHTML = `
      <div class="grid grid-side-main">
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-head">
              <div><div class="card-title">Category trends</div>
              <div class="card-sub">12-month search-demand movement</div></div>
              <div class="seg" id="t-tab">
                <button data-t="rising" class="${state.trendTab === 'rising' ? 'active' : ''}">Rising</button>
                <button data-t="fading" class="${state.trendTab === 'fading' ? 'active' : ''}">Fading</button>
              </div>
            </div>
            ${list.map((t, i) => `
              <div class="trend-item">
                <span class="trend-rank num">${i + 1}</span>
                <div class="trend-main">
                  <div class="trend-name">${Fmt.esc(t.name)}</div>
                  <div class="trend-sub">${Fmt.esc(t.note)}</div>
                </div>
                ${Charts.sparkline(t.spark, { w: 84, h: 26, color: t.growthPct >= 0 ? '#1baf7a' : '#d03b3b' })}
                <span class="num ${t.growthPct >= 0 ? 'delta-up' : 'delta-down'}" style="min-width:46px;text-align:right">${Fmt.signPct(t.growthPct)}</span>
              </div>`).join('')}
          </div>

          <div class="card">
            <div class="card-head"><div>
              <div class="card-title">Seasonal planner</div>
              <div class="card-sub">What to source and list, month by month</div>
            </div></div>
            <div class="season-grid">
              ${T.seasonal.map((s, i) => `
                <div class="season-cell ${i === nowMonth ? 'now' : ''}">
                  <div class="season-m">${s.m}${i === nowMonth ? ' · now' : ''}</div>
                  <div class="season-t">${Fmt.esc(s.t)}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Market news</div>
              <div class="card-sub">${ctx.newsLive
                ? 'Live from Retail Dive, Practical Ecommerce, TechCrunch & Marketplace Pulse'
                : 'Sample headlines — press ↻ in the title bar to pull live feeds'}</div>
            </div>
            <div class="seg" id="n-filter">
              <button data-f="all" class="${state.newsFilter === 'all' ? 'active' : ''}">All</button>
              <button data-f="opp" class="${state.newsFilter === 'opp' ? 'active' : ''}">Opportunities</button>
              <button data-f="risk" class="${state.newsFilter === 'risk' ? 'active' : ''}">Risks</button>
            </div>
          </div>
          ${news.length ? news.map((n) => UI.newsRow(n)).join('') : '<div class="empty">Nothing here under this filter.</div>'}
        </div>
      </div>
    `;

    el.querySelectorAll('#t-tab button').forEach((b) =>
      b.addEventListener('click', () => { state.trendTab = b.dataset.t; render(el, ctx); }));
    el.querySelectorAll('#n-filter button').forEach((b) =>
      b.addEventListener('click', () => { state.newsFilter = b.dataset.f; render(el, ctx); }));
    el.querySelectorAll('[data-ext]').forEach((n) =>
      n.addEventListener('click', () => UI.ext(n.dataset.ext)));
  }

  window.Pages = window.Pages || {};
  window.Pages.trendsnews = { id: 'trendsnews', title: 'Trends & News', nav: 'Trends & News', group: 'Research', icon: 'trends', render };
})();
