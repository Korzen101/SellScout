// Product Finder — ranked, filterable catalog + product detail drawer
(function () {
  'use strict';

  const state = { cat: 'all', sort: 'score', min: '', max: '', watchOnly: false };

  const SORTS = {
    score:  (a, b) => b.scoring.total - a.scoring.total,
    margin: (a, b) => b.best.econ.marginPct - a.best.econ.marginPct,
    roi:    (a, b) => b.best.econ.roiPct - a.best.econ.roiPct,
    sales:  (a, b) => b.estMonthlySales - a.estMonthlySales,
    price:  (a, b) => a.price - b.price,
    trend:  (a, b) => Scoring.trendPct(b) - Scoring.trendPct(a)
  };

  function filtered(ctx) {
    const q = (ctx.query || '').toLowerCase();
    return ctx.products.filter((p) => {
      if (q && !(p.name + ' ' + p.category).toLowerCase().includes(q)) return false;
      if (state.cat !== 'all' && p.category !== state.cat) return false;
      if (state.min !== '' && p.price < +state.min) return false;
      if (state.max !== '' && p.price > +state.max) return false;
      if (state.watchOnly && !Store.isWatched(p.id)) return false;
      return true;
    }).sort(SORTS[state.sort]);
  }

  function render(el, ctx) {
    const cats = [...new Set(ctx.products.map((p) => p.category))].sort();
    const list = filtered(ctx);

    el.innerHTML = `
      <div class="card finder-bar">
        <select class="field" id="f-cat">
          <option value="all">All categories</option>
          ${cats.map((c) => `<option value="${Fmt.esc(c)}" ${state.cat === c ? 'selected' : ''}>${Fmt.esc(c)}</option>`).join('')}
        </select>
        <select class="field" id="f-sort">
          <option value="score" ${state.sort === 'score' ? 'selected' : ''}>Sort · Opportunity score</option>
          <option value="margin" ${state.sort === 'margin' ? 'selected' : ''}>Sort · Margin</option>
          <option value="roi" ${state.sort === 'roi' ? 'selected' : ''}>Sort · ROI</option>
          <option value="sales" ${state.sort === 'sales' ? 'selected' : ''}>Sort · Est. sales</option>
          <option value="trend" ${state.sort === 'trend' ? 'selected' : ''}>Sort · Trend</option>
          <option value="price" ${state.sort === 'price' ? 'selected' : ''}>Sort · Price (low first)</option>
        </select>
        <input class="field" id="f-min" type="number" placeholder="Min $" style="width:84px" value="${state.min}">
        <input class="field" id="f-max" type="number" placeholder="Max $" style="width:84px" value="${state.max}">
        <button class="btn btn-sm ${state.watchOnly ? 'btn-primary' : 'btn-quiet'}" id="f-watch">${Icons.star} Watchlist</button>
        <button class="btn btn-quiet btn-sm" id="f-how">${Icons.info} How scoring works</button>
        <button class="btn btn-quiet btn-sm" id="f-export">${Icons.export} Export CSV</button>
        <span style="display:inline-flex;gap:6px;align-items:center;margin-left:auto">
          <input class="field" id="f-asin" placeholder="ASIN or Amazon URL…" style="width:170px" spellcheck="false">
          <button class="btn btn-tint btn-sm" id="f-analyze">${Icons.spark} Analyze</button>
        </span>
        <span class="finder-count" style="margin-left:0">${list.length} product${list.length === 1 ? '' : 's'}</span>
      </div>

      <div class="card section-gap" style="padding:6px 8px">
        <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>Product</th><th>Score${Info.btn('score')}</th><th class="th-r">Price</th><th class="th-r">Est. sales/mo</th>
            <th class="th-r">Margin${Info.btn('netMargin')}</th><th class="th-r">ROI${Info.btn('roi')}</th>
            <th>Competition${Info.btn('competition')}</th><th>12-mo trend${Info.btn('trend')}</th><th></th>
          </tr></thead>
          <tbody>
            ${list.map((p) => {
              const comp = Scoring.competitionLevel(p);
              return `<tr class="rowlink" data-open="${p.id}">
                <td><div class="cell-product">${UI.ptile(p)}
                  <div><div class="p-name">${Fmt.esc(p.name)}${p.live ? ' <span class="chip chip-opp" style="vertical-align:1px">Live</span>' : ''}</div>
                  <div class="p-cat">${Fmt.esc(p.category)}</div></div>
                </div></td>
                <td><div class="scorecell">${Charts.scoreRing(p.scoring.total, { size: 34, thickness: 4 })}
                  <span class="chip chip-${p.scoring.verdict.cls}">${p.scoring.verdict.label}</span></div></td>
                <td class="td-r num">${Fmt.money(p.price)}</td>
                <td class="td-r num">${Fmt.compact(p.estMonthlySales)}</td>
                <td class="td-r num" style="font-weight:650">${Fmt.pct(p.best.econ.marginPct)}</td>
                <td class="td-r num">${Fmt.pct(p.best.econ.roiPct)}</td>
                <td>${UI.compMeter(comp)} <span class="micro" style="margin-left:5px">${comp.label}</span></td>
                <td>${Charts.sparkline(p.trend12, { w: 84, h: 26, color: Scoring.trendPct(p) >= 0 ? '#1baf7a' : '#d03b3b' })}
                  <span class="micro num ${Scoring.trendPct(p) >= 0 ? 'delta-up' : 'delta-down'}" style="margin-left:4px">${Fmt.signPct(Scoring.trendPct(p))}</span></td>
                <td style="color:var(--ink-3)">${Icons.chevR.replace('<svg ', '<svg width="13" height="13" ')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${list.length === 0 ? '<div class="empty">No products match these filters.</div>' : ''}
        </div>
      </div>
    `;

    const rerender = () => render(el, ctx);
    el.querySelector('#f-cat').addEventListener('change', (e) => { state.cat = e.target.value; rerender(); });
    el.querySelector('#f-sort').addEventListener('change', (e) => { state.sort = e.target.value; rerender(); });
    el.querySelector('#f-min').addEventListener('change', (e) => { state.min = e.target.value; rerender(); });
    el.querySelector('#f-max').addEventListener('change', (e) => { state.max = e.target.value; rerender(); });
    el.querySelector('#f-watch').addEventListener('click', () => { state.watchOnly = !state.watchOnly; rerender(); });
    el.querySelector('#f-how').addEventListener('click', showHow);
    el.querySelector('#f-export').addEventListener('click', () => exportCsv(filtered(ctx), ctx));
    const asinInput = el.querySelector('#f-asin');
    const analyze = () => analyzeAsin(asinInput.value, ctx, el.querySelector('#f-analyze'));
    el.querySelector('#f-analyze').addEventListener('click', analyze);
    asinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') analyze(); });
    el.querySelectorAll('[data-open]').forEach((n) =>
      n.addEventListener('click', () => ctx.openProduct(n.dataset.open)));
  }

  async function analyzeAsin(input, ctx, btn) {
    const raw = (input || '').trim();
    if (!raw) { ctx.toast('Paste an ASIN or Amazon product URL first'); return; }
    if (!window.sellscout) { ctx.toast('Live analysis needs the desktop app (npm start)'); return; }
    if (!Store.secretState('keepaApiKey').set) {
      UI.modal(`<div class="card-title" style="font-size:16px">Keepa key needed</div>
        <p class="card-sub" style="margin-top:8px;line-height:1.55">Live product analysis pulls price, rank and review
        data from Keepa. Add an API key in Settings → Data sources.
        <a class="ext" data-ext="https://keepa.com/#!api">Get a key at keepa.com ${'↗'}</a></p>`);
      return;
    }
    btn.disabled = true; btn.textContent = 'Analyzing…';
    try {
      const res = await window.sellscout.keepa.product(raw);
      if (!res.ok) { ctx.toast(res.error || 'Analysis failed'); return; }
      const analyzed = (Store.get('analyzed') || []).filter((p) => p.id !== res.product.id);
      analyzed.unshift(res.product);
      Store.set('analyzed', analyzed.slice(0, 40));
      ctx.rescore();
      ctx.toast('Analyzed — ' + (res.tokensLeft != null ? res.tokensLeft + ' Keepa tokens left' : 'added to catalog'));
      ctx.openProduct(res.product.id);
    } finally {
      btn.disabled = false;
      btn.innerHTML = Icons.spark + ' Analyze';
    }
  }

  async function exportCsv(list, ctx) {
    const escCell = (v) => {
      const s = String(v == null ? '' : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const header = ['Product', 'Category', 'Price USD', 'Score', 'Verdict', 'Est monthly sales', 'Net margin %',
      'ROI %', 'Competition', 'Trend 12mo %', 'Best source', 'Landed cost USD', 'Profit per unit USD'];
    const rows = list.map((p) => [
      p.name, p.category, p.price.toFixed(2), p.scoring.total, p.scoring.verdict.label, p.estMonthlySales,
      p.best.econ.marginPct.toFixed(1), p.best.econ.roiPct.toFixed(1), Scoring.competitionLevel(p).label,
      Scoring.trendPct(p).toFixed(1), p.best.source.marketplace, p.best.econ.landed.toFixed(2), p.best.econ.profit.toFixed(2)
    ]);
    const csv = [header, ...rows].map((r) => r.map(escCell).join(',')).join('\r\n');
    const name = 'sellscout-products-' + new Date().toISOString().slice(0, 10) + '.csv';

    if (window.sellscout) {
      const res = await window.sellscout.exportCsv(name, csv);
      if (res.ok) { ctx.toast('Exported ' + list.length + ' products'); Log.info('Finder CSV exported', { rows: list.length }); }
      else if (!res.canceled) ctx.toast('Export failed: ' + (res.error || 'unknown error'));
    } else {
      try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
        ctx.toast('Exported ' + list.length + ' products');
      } catch { ctx.toast('Export needs the desktop app'); }
    }
  }

  function showHow() {
    UI.modal(`
      <div class="card-title" style="font-size:17px">How the opportunity score works</div>
      <p class="card-sub" style="margin:8px 0 14px;line-height:1.55">Every product gets a 0–100 score from five
      transparent components. Nothing is hidden — the same numbers appear in each product’s detail panel.</p>
      ${[
        ['Demand', Scoring.WEIGHTS.demand, 'Estimated monthly sales, log-scaled so mega-sellers don’t drown out niches.'],
        ['Margin', Scoring.WEIGHTS.margin, 'Net margin and ROI at the best sourcing option, after referral, FBA, storage, returns and ad costs.'],
        ['Trend', Scoring.WEIGHTS.trend, '12-month demand momentum — recent three months vs. the first three.'],
        ['Competition', Scoring.WEIGHTS.competition, 'Review moat of top listings, number of sellers, and whether Amazon itself sells on the listing.'],
        ['Risk', Scoring.WEIGHTS.risk, 'Deductions for seasonality, IP exposure, gating, fragility, oversize and price volatility.']
      ].map(([name, w, desc]) => `
        <div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--hairline-2)">
          <span class="chip chip-neutral num" style="min-width:44px;justify-content:center">${Math.round(w * 100)}%</span>
          <div><b style="font-size:13px">${name}</b><div class="card-sub" style="margin-top:1px">${desc}</div></div>
        </div>`).join('')}
      <p class="micro" style="margin-top:14px">Verdicts: 78+ Excellent · 65–77 Strong · 50–64 Moderate · below 50 Weak.</p>
    `);
  }

  // ------------------------------------------------------------------
  // Product detail drawer (shared — opened from any page)
  // ------------------------------------------------------------------

  function econLines(econ) {
    const C = Charts.SERIES;
    return `
      ${Charts.stackBar([
        { label: 'Landed cost', value: econ.landed, color: C[0] },
        { label: 'Amazon fees', value: econ.feesTotal, color: C[1] },
        { label: 'Advertising', value: econ.ads, color: C[3] },
        { label: 'Profit', value: Math.max(0, econ.profit), color: C[2] }
      ])}
      <div class="legend mt-8">
        <span><i style="background:${C[0]}"></i>Landed</span>
        <span><i style="background:${C[1]}"></i>Fees</span>
        <span><i style="background:${C[3]}"></i>Ads</span>
        <span><i style="background:${C[2]}"></i>Profit</span>
      </div>
      <div class="econ-lines mt-12">
        <div class="econ-line"><span class="lbl">Sale price</span><b class="num">${Fmt.money(econ.price)}</b></div>
        <div class="econ-line"><span class="lbl"><span class="dot" style="background:${C[0]}"></span>Landed cost (unit + ship + duty)</span><span class="num">−${Fmt.money(econ.landed)}</span></div>
        <div class="econ-line"><span class="lbl"><span class="dot" style="background:${C[1]}"></span>Referral fee (${econ.refPct}%)</span><span class="num">−${Fmt.money(econ.referral)}</span></div>
        <div class="econ-line"><span class="lbl"><span class="dot" style="background:${C[1]}"></span>FBA fulfillment</span><span class="num">−${Fmt.money(econ.fba)}</span></div>
        <div class="econ-line"><span class="lbl"><span class="dot" style="background:${C[1]}"></span>Storage + returns</span><span class="num">−${Fmt.money(econ.storage + econ.returns)}</span></div>
        <div class="econ-line"><span class="lbl"><span class="dot" style="background:${C[3]}"></span>Advertising (est.)</span><span class="num">−${Fmt.money(econ.ads)}</span></div>
        <div class="econ-line total"><span class="lbl">Net profit / unit</span>
          <b class="num" style="color:${econ.profit > 0 ? 'var(--good-text)' : 'var(--bad-text)'}">${Fmt.money(econ.profit)}</b></div>
      </div>
      <div class="stat-trio">
        <div class="stat-mini"><b class="num" style="color:${econ.marginPct > 0 ? 'inherit' : 'var(--bad-text)'}">${Fmt.pct(econ.marginPct)}</b><span>Net margin</span></div>
        <div class="stat-mini"><b class="num">${Fmt.pct(econ.roiPct)}</b><span>ROI on cash</span></div>
        <div class="stat-mini"><b class="num">${Fmt.money(econ.breakevenPrice)}</b><span>Breakeven price</span></div>
      </div>`;
  }

  function pipelineSection(p) {
    const pl = Pipeline.get(p.id);
    if (!pl) {
      return `<div class="d-section">
        <div class="d-section-title">Pipeline</div>
        <button class="btn btn-quiet btn-sm" id="d-track">${Icons.flag} Track in pipeline</button>
        <span class="micro" style="margin-left:8px">Stages, notes and supplier quotes live here once tracked.</span>
      </div>`;
    }
    return `<div class="d-section">
      <div class="d-section-title">Pipeline · ${Fmt.esc(pl.stage)}</div>
      <div class="row" style="gap:8px">
        <select class="field" id="d-stage" style="width:150px">
          ${Pipeline.STAGES.map((s) => `<option ${s === pl.stage ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <button class="btn btn-quiet btn-sm" id="d-untrack" style="color:var(--bad-text)">Untrack</button>
      </div>
      <textarea class="field mt-12" id="d-notes" rows="2" placeholder="Notes — supplier conversations, sample feedback, launch plans…">${Fmt.esc(pl.notes)}</textarea>
      <div class="mt-12">
        <div class="micro" style="font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-bottom:4px">Supplier quotes</div>
        ${pl.quotes.map((q, i) => `
          <div class="quote-row">
            <b style="flex:1">${Fmt.esc(q.supplier)}</b>
            <span class="num">${Fmt.money(q.price)}/unit</span>
            <span class="micro num">MOQ ${q.moq || '—'}</span>
            <span class="micro num">${q.leadDays || '—'}d</span>
            <button class="icon-btn" data-delquote="${i}" style="width:22px;height:22px">${Icons.close}</button>
          </div>`).join('') || '<div class="micro">No quotes yet.</div>'}
        <div class="quote-add">
          <input class="field" id="q-supplier" placeholder="Supplier">
          <input class="field num" id="q-price" type="number" step="0.01" min="0" placeholder="${Fmt.sym()}/unit">
          <input class="field num" id="q-moq" type="number" min="0" placeholder="MOQ">
          <input class="field num" id="q-lead" type="number" min="0" placeholder="Lead d">
          <button class="btn btn-tint btn-sm" id="q-add">Add</button>
        </div>
      </div>
    </div>`;
  }

  function historySection(p) {
    const snaps = (Store.get('snapshots') || [])
      .map((s) => ({ date: s.date, item: (s.items || []).find((i) => i.id === p.id) }))
      .filter((x) => x.item);
    if (snaps.length < 2) {
      return `<div class="d-section">
        <div class="d-section-title">Score history</div>
        <div class="micro">History builds one point per day while this product is on your watchlist or in the pipeline.</div>
      </div>`;
    }
    const scores = snaps.map((x) => x.item.score);
    const first = snaps[0], last = snaps[snaps.length - 1];
    return `<div class="d-section">
      <div class="d-section-title">Score history · ${snaps.length} days</div>
      <div class="row" style="gap:14px">
        ${Charts.sparkline(scores, { w: 180, h: 34 })}
        <span style="font-size:12.5px">${first.item.score} <span class="muted">(${first.date})</span>
          → <b>${last.item.score}</b> <span class="muted">(${last.date})</span></span>
      </div>
    </div>`;
  }

  function open(p, ctx) {
    let srcIdx = p.sources.indexOf(p.best.source);
    if (srcIdx < 0) srcIdx = 0;

    const html = () => {
      const econ = Fees.forProduct(p, p.sources[srcIdx]);
      const comp = Scoring.competitionLevel(p);
      const parts = p.scoring.parts;
      const watched = Store.isWatched(p.id);
      return `
        <div class="d-head">
          ${UI.ptile(p, true)}
          <div class="d-head-main">
            <div class="d-title">${Fmt.esc(p.name)}</div>
            <div class="d-chips">
              ${p.live ? '<span class="chip chip-opp">Live · amazon.com</span>' : ''}
              <span class="chip chip-neutral">${Fmt.esc(p.category)}</span>
              <span class="chip chip-${p.scoring.verdict.cls}">${p.scoring.verdict.label} opportunity</span>
              ${p.seasonal ? `<span class="chip chip-moderate">${Fmt.esc(p.seasonal)} seasonal</span>` : ''}
            </div>
            <div class="d-price num">${Fmt.money(p.price)} <span>target sale price · ${Fmt.compact(p.estMonthlySales)} est. sales/mo</span></div>
          </div>
          ${Charts.scoreRing(p.scoring.total, { size: 62, thickness: 6 })}
        </div>

        <div class="d-section">
          <div class="d-section-title">Score breakdown ${Info.btn('score')}</div>
          ${Charts.barsH([
            { label: 'Demand', value: parts.demand * 100, color: Charts.SERIES[0] },
            { label: 'Margin', value: parts.margin * 100, color: Charts.SERIES[2] },
            { label: 'Trend', value: parts.trend * 100, color: Charts.SERIES[1] },
            { label: 'Competition', value: parts.competition * 100, color: Charts.SERIES[4] },
            { label: 'Low risk', value: parts.risk * 100, color: Charts.SERIES[3] }
          ], { max: 100, fmt: (v) => Math.round(v) })}
        </div>

        <div class="d-section">
          <div class="d-section-title">12-month demand trend
            <span class="num ${Scoring.trendPct(p) >= 0 ? 'delta-up' : 'delta-down'}" style="text-transform:none;letter-spacing:0;margin-left:6px">${Fmt.signPct(Scoring.trendPct(p))}</span>
          </div>
          ${Charts.areaChart(p.trend12, { w: 500, h: 150, labels: Fmt.last12Labels(), color: Scoring.trendPct(p) >= 0 ? '#1baf7a' : '#d03b3b' })}
        </div>

        <div class="d-section">
          <div class="d-section-title">Sourcing options ${Info.btn('landed')}</div>
          ${p.assumedCost ? `<div class="micro" style="margin:-4px 0 8px">Live listing — the unit cost below is an
            assumption (25% of price). Get real quotes and add them under Pipeline below.</div>` : ''}
          ${p.sources.map((s, i) => {
            const e = Fees.forProduct(p, s);
            return `<div class="src-option ${i === srcIdx ? 'sel' : ''}" data-src="${i}">
              <span class="src-radio"></span>
              <div class="src-main">
                <div class="src-name">${Fmt.esc(s.marketplace)}</div>
                <div class="src-meta">${Fmt.money(s.unitCost)}/unit + ${Fmt.money(s.shipPerUnit)} ship · MOQ ${s.moq} · ${s.leadDays}d lead · ★${s.rating}</div>
              </div>
              <div class="src-right"><b class="num" style="color:${e.profit > 0 ? 'var(--good-text)' : 'var(--bad-text)'}">${Fmt.pct(e.roiPct)}</b><span>ROI</span></div>
            </div>`;
          }).join('')}
        </div>

        <div class="d-section">
          <div class="d-section-title">Unit economics · ${Fmt.esc(p.sources[srcIdx].marketplace)} ${Info.btn('fees')}</div>
          ${econLines(econ)}
          <button class="btn btn-primary mt-16" id="d-calc" style="width:100%">${Icons.calculator} Open in profit calculator</button>
        </div>

        <div class="d-section">
          <div class="d-section-title">Competition ${Info.btn('reviewMoat')}</div>
          <div class="stat-trio" style="margin-top:0">
            <div class="stat-mini"><b class="num">${p.sellers}</b><span>Active sellers</span></div>
            <div class="stat-mini"><b class="num">${Fmt.compact(p.reviewsTop10)}</b><span>Avg reviews, top 10</span></div>
            <div class="stat-mini"><b class="num">★ ${p.rating.toFixed(1)}</b><span>Avg rating</span></div>
          </div>
          <div class="row mt-12" style="gap:8px">
            ${UI.compMeter(comp)} <span style="font-size:12.5px;font-weight:600">${comp.label} competition</span>
            ${p.amazonOnListing ? '<span class="chip chip-risk">Amazon sells this</span>' : '<span class="chip chip-opp">No Amazon retail on listing</span>'}
          </div>
        </div>

        ${(p.flags || []).length ? `<div class="d-section">
          <div class="d-section-title">Risk factors</div>
          ${p.flags.map((f) => {
            const info = Scoring.FLAG_INFO[f] || { label: f, text: '' };
            return `<div class="risk-item">${Icons.alert.replace('stroke="currentColor"', 'stroke="#c22f2f"')}
              <div class="t"><b>${info.label}.</b> <span>${info.text}</span></div></div>`;
          }).join('')}
        </div>` : ''}

        ${pipelineSection(p)}

        ${historySection(p)}

        <div class="d-section">
          <div class="d-section-title">Research links</div>
          <div class="row" style="flex-wrap:wrap;gap:8px">
            ${p.asin ? `<button class="btn btn-quiet btn-sm" data-ext="https://www.amazon.com/dp/${p.asin}">${Icons.external} Open listing</button>` : ''}
            <button class="btn btn-quiet btn-sm" data-ext="https://www.amazon.com/s?k=${encodeURIComponent(p.name)}">${Icons.external} Amazon results</button>
            <button class="btn btn-quiet btn-sm" data-ext="https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(p.name)}">${Icons.external} Alibaba suppliers</button>
            <button class="btn btn-quiet btn-sm" data-ext="https://www.aliexpress.com/w/wholesale-${encodeURIComponent(p.name.replace(/\s+/g, '-'))}.html">${Icons.external} AliExpress</button>
            <button class="btn ${watched ? 'btn-primary' : 'btn-quiet'} btn-sm" id="d-watch">${Icons.star} ${watched ? 'Watching' : 'Add to watchlist'}</button>
            ${p.live ? `<button class="btn btn-quiet btn-sm" id="d-removelive" style="color:var(--bad-text)">Remove from catalog</button>` : ''}
          </div>
        </div>
      `;
    };

    const wire = (root) => {
      root.querySelectorAll('[data-src]').forEach((n) =>
        n.addEventListener('click', () => { srcIdx = +n.dataset.src; UI.drawerContent(html(), wire); }));
      const w = root.querySelector('#d-watch');
      if (w) w.addEventListener('click', () => {
        const on = Store.toggleWatch(p.id);
        ctx.toast(on ? 'Added to watchlist' : 'Removed from watchlist');
        UI.drawerContent(html(), wire);
      });
      // Pipeline controls
      const rerenderDrawer = () => UI.drawerContent(html(), wire);
      const track = root.querySelector('#d-track');
      if (track) track.addEventListener('click', () => {
        Pipeline.set(p.id, {});
        Log.info('Product tracked in pipeline', { id: p.id });
        ctx.toast('Tracking in pipeline');
        rerenderDrawer();
      });
      const untrack = root.querySelector('#d-untrack');
      if (untrack) untrack.addEventListener('click', () => {
        Pipeline.remove(p.id);
        ctx.toast('Removed from pipeline');
        rerenderDrawer();
      });
      const stageSel = root.querySelector('#d-stage');
      if (stageSel) stageSel.addEventListener('change', () => {
        Pipeline.set(p.id, { stage: stageSel.value });
        rerenderDrawer();
      });
      const notes = root.querySelector('#d-notes');
      if (notes) notes.addEventListener('change', () => Pipeline.set(p.id, { notes: notes.value }));
      const qAdd = root.querySelector('#q-add');
      if (qAdd) qAdd.addEventListener('click', () => {
        const v = (id) => root.querySelector(id).value.trim();
        if (!v('#q-supplier') || !v('#q-price')) { ctx.toast('Supplier and price are required'); return; }
        const pl = Pipeline.get(p.id);
        Pipeline.set(p.id, {
          quotes: [...pl.quotes, {
            supplier: v('#q-supplier'), price: (+v('#q-price')) / Fmt.rate(), // store USD
            moq: +v('#q-moq') || 0, leadDays: +v('#q-lead') || 0, date: Date.now()
          }]
        });
        rerenderDrawer();
      });
      root.querySelectorAll('[data-delquote]').forEach((n) =>
        n.addEventListener('click', () => {
          const pl = Pipeline.get(p.id);
          Pipeline.set(p.id, { quotes: pl.quotes.filter((_, i) => i !== +n.dataset.delquote) });
          rerenderDrawer();
        }));
      const removeLive = root.querySelector('#d-removelive');
      if (removeLive) removeLive.addEventListener('click', () => {
        Store.set('analyzed', (Store.get('analyzed') || []).filter((x) => x.id !== p.id));
        Pipeline.remove(p.id);
        UI.closeDrawer();
        ctx.rescore();
        ctx.toast('Removed analyzed product');
      });

      const c = root.querySelector('#d-calc');
      if (c) c.addEventListener('click', () => {
        const s = p.sources[srcIdx];
        UI.closeDrawer();
        ctx.navigate('calculator', {
          name: p.name, price: p.price, category: p.category, sizeTier: p.sizeTier,
          fbaFee: p.fbaFee, unitCost: s.unitCost, shipPerUnit: s.shipPerUnit,
          monthlyUnits: p.estMonthlySales
        });
      });
      Charts.activate(root);
    };

    UI.openDrawer(html(), wire);
  }

  window.Pages = window.Pages || {};
  window.Pages.finder = { id: 'finder', title: 'Product Finder', nav: 'Product Finder', group: 'Research', icon: 'finder', render };
  window.ProductDrawer = { open };
})();
