// My Business — Amazon Seller account connection + performance dashboard
(function () {
  'use strict';

  const state = { connected: false, testing: false, testResult: null, liveOrders: null, formOpen: false };

  function kpisFromDays(days) {
    const last30 = days.slice(-30);
    const prev30 = days.slice(-60, -30);
    const sum = (arr, k) => arr.reduce((s, d) => s + d[k], 0);
    const rev30 = sum(last30, 'revenue'), revPrev = sum(prev30, 'revenue');
    return {
      rev30,
      revDelta: revPrev ? ((rev30 - revPrev) / revPrev) * 100 : 0,
      profit30: sum(last30, 'profit'),
      units30: sum(last30, 'units'),
      marginPct: rev30 ? (sum(last30, 'profit') / rev30) * 100 : 0
    };
  }

  function render(el, ctx) {
    const creds = {
      id: Store.secretState('spapi.lwaClientId'),
      secret: Store.secretState('spapi.lwaClientSecret'),
      token: Store.secretState('spapi.refreshToken')
    };
    const hasCreds = creds.id.set && creds.secret.set && creds.token.set;
    const B = DemoData.business;
    const k = kpisFromDays(B.days);
    const rev30 = B.days.slice(-30);

    el.innerHTML = `
      ${renderConnect(creds, hasCreds)}

      <div class="spread section-gap" style="margin-bottom:2px">
        <div class="card-sub" style="font-size:12px">
          ${state.connected
            ? '<span class="chip chip-opp">Live — connected to Seller Central</span>'
            : '<span class="chip chip-moderate">Simulated data</span> <span style="margin-left:6px">Connect your account above to replace this with your real numbers.</span>'}
        </div>
      </div>

      <div class="kpis section-gap" style="margin-top:10px">
        <div class="card kpi">
          <div class="kpi-label">${Icons.dollar} Revenue · 30 days</div>
          <div class="kpi-value num">${Fmt.money(k.rev30, 0)}</div>
          <div class="kpi-foot"><span class="${k.revDelta >= 0 ? 'delta-up' : 'delta-down'}">${Fmt.signPct(k.revDelta, 1)}</span> vs. prior 30 days</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">${Icons.wallet} Est. net profit ${Info.btn('profitEst')}</div>
          <div class="kpi-value num">${Fmt.money(k.profit30, 0)}</div>
          <div class="kpi-foot">${Fmt.pct(k.marginPct, 1)} blended margin</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">${Icons.box} Units sold</div>
          <div class="kpi-value num">${Fmt.num(k.units30)}</div>
          <div class="kpi-foot">${Fmt.num(Math.round(k.units30 / 30))} / day average</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">${Icons.alert} Restock alerts ${Info.btn('cover')}</div>
          <div class="kpi-value num">${B.skus.filter((s) => s.stock / s.daily < 21).length}</div>
          <div class="kpi-foot">SKUs under 21 days of cover</div>
        </div>
      </div>

      <div class="grid grid-main-side section-gap">
        <div class="card">
          <div class="card-head"><div>
            <div class="card-title">Revenue — last 30 days</div>
            <div class="card-sub">Daily ordered product sales</div>
          </div></div>
          ${Charts.areaChart(rev30.map((d) => d.revenue), {
            w: 640, h: 210, labels: Fmt.lastNDayLabels(30), fmt: 'money', color: Charts.SERIES[0]
          })}
        </div>
        <div class="card">
          <div class="card-head"><div>
            <div class="card-title">Revenue by category</div>
            <div class="card-sub">Trailing 30 days</div>
          </div></div>
          <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
            ${Charts.donut(B.categorySplit.map((c, i) => ({ ...c, color: Charts.SERIES[i] })), {
              size: 150, thickness: 18, centerValue: Fmt.money(B.categorySplit.reduce((s, c) => s + c.value, 0), 0), centerTitle: '30-day total'
            })}
            <div style="display:flex;flex-direction:column;gap:7px;flex:1;min-width:150px">
              ${B.categorySplit.map((c, i) => `
                <div class="spread" style="font-size:12px">
                  <span class="row" style="gap:7px"><i style="width:9px;height:9px;border-radius:3px;background:${Charts.SERIES[i]};display:inline-block"></i>${Fmt.esc(c.label)}</span>
                  <b class="num">${Fmt.money(c.value, 0)}</b>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      ${actualsCard()}

      <div class="grid grid-2 section-gap">
        <div class="card" style="padding:14px 8px 8px">
          <div class="card-head" style="padding:0 12px"><div>
            <div class="card-title">Inventory health</div>
            <div class="card-sub">Days of cover at current velocity</div>
          </div></div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>SKU</th><th class="th-r">Stock</th><th class="th-r">Daily</th><th>Cover</th><th></th></tr></thead>
            <tbody>
              ${B.skus.map((s) => {
                const days = s.stock / s.daily;
                const cls = days < 14 ? 'var(--bad)' : days < 21 ? 'var(--warn)' : 'var(--good)';
                return `<tr>
                  <td><div class="cell-product" style="min-width:170px">
                    <span class="ptile" style="width:30px;height:30px;font-size:15px;background:hsl(${s.hue} 75% 92%)">${s.emoji}</span>
                    <div><div class="p-name" style="font-size:12.5px">${Fmt.esc(s.name)}</div><div class="p-cat">${s.sku}</div></div></div></td>
                  <td class="td-r num">${Fmt.num(s.stock)}</td>
                  <td class="td-r num">${s.daily}</td>
                  <td><span class="inv-bar"><i style="width:${Math.min(100, (days / 45) * 100)}%;background:${cls}"></i></span>
                    <span class="micro num" style="margin-left:6px">${Math.round(days)}d</span></td>
                  <td>${days < 21 ? '<span class="chip chip-risk">Reorder</span>' : '<span class="chip chip-neutral">OK</span>'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table></div>
        </div>

        <div class="card" style="padding:14px 8px 8px">
          <div class="card-head" style="padding:0 12px"><div>
            <div class="card-title">Recent orders</div>
            <div class="card-sub">${state.connected ? 'Latest from SP-API' : 'Simulated order flow'}</div>
          </div></div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Order</th><th class="th-r">Total</th><th>Status</th><th class="th-r">When</th></tr></thead>
            <tbody>
              ${(state.liveOrders || B.orders).slice(0, 9).map((o) => `
                <tr>
                  <td><div class="cell-product" style="min-width:170px">
                    <span class="ptile" style="width:30px;height:30px;font-size:15px;background:hsl(${o.hue != null ? o.hue : 210} 75% 92%)">${o.emoji || '📦'}</span>
                    <div><div class="p-name" style="font-size:12.5px">${Fmt.esc(o.name)}${o.qty > 1 ? ' ×' + o.qty : ''}</div>
                    <div class="p-cat">${Fmt.esc(o.city || o.id)}</div></div></div></td>
                  <td class="td-r num" style="font-weight:650">${Fmt.money(o.total)}</td>
                  <td><span class="chip ${o.status === 'Pending' ? 'chip-moderate' : o.status === 'Shipped' ? 'chip-strong' : 'chip-opp'}">${o.status}</span></td>
                  <td class="td-r micro">${o.hoursAgo < 24 ? o.hoursAgo + 'h ago' : Math.round(o.hoursAgo / 24) + 'd ago'}</td>
                </tr>`).join('')}
            </tbody>
          </table></div>
        </div>
      </div>

      <div class="disclaimer">Profit figures shown here are estimates derived from revenue and modeled costs.
      Connect your account and reconcile with Seller Central settlement reports for exact numbers.</div>
    `;

    wireConnect(el, ctx);

    // Actuals wiring
    const aImport = el.querySelector('#a-import');
    if (aImport) aImport.addEventListener('click', () => importActuals(ctx, el));
    const aClear = el.querySelector('#a-clear');
    if (aClear) aClear.addEventListener('click', () => {
      Store.set('actuals', null); Store.set('cogs', {});
      ctx.toast('Imported data cleared');
      render(el, ctx);
    });
    el.querySelectorAll('[data-cogs]').forEach((input) =>
      input.addEventListener('change', () => {
        const cogs = { ...(Store.get('cogs') || {}) };
        if (input.value === '') delete cogs[input.dataset.cogs];
        else cogs[input.dataset.cogs] = (+input.value) / Fmt.rate(); // store USD
        Store.set('cogs', cogs);
        render(el, ctx);
      }));

    Charts.activate(el);
  }

  // ------------------------------------------------------------------
  // Actuals — imported Seller Central transaction report + COGS
  // ------------------------------------------------------------------

  function actualsCard() {
    const a = Store.get('actuals');
    if (!a) {
      return `<div class="card section-gap">
        <div class="card-head"><div>
          <div class="card-title">Actual P&L — import your transaction report</div>
          <div class="card-sub" style="max-width:640px">Replace estimates with your real numbers, no API needed:
          in Seller Central go to <b>Payments → Reports repository</b>, request a <b>Transaction report</b> (CSV),
          then import it here. Add your cost per unit to see true profit per SKU.</div>
        </div>
        <button class="btn btn-primary btn-sm" id="a-import">${Icons.doc} Import CSV</button></div>
      </div>`;
    }

    const cogs = Store.get('cogs') || {};
    const fmtD = (ts) => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '?';
    let trueProfit = 0, cogsKnown = true;
    for (const s of a.perSku) {
      if (cogs[s.sku] != null) trueProfit += s.net - s.units * cogs[s.sku];
      else cogsKnown = false;
    }

    return `<div class="card section-gap">
      <div class="card-head">
        <div>
          <div class="card-title">Actual P&L <span class="chip chip-opp" style="vertical-align:2px">Imported</span></div>
          <div class="card-sub">${Fmt.esc(a.fileName)} · ${fmtD(a.period.from)} – ${fmtD(a.period.to)} ·
            ${a.orders} orders · ${a.rows} rows</div>
        </div>
        <div class="row">
          <button class="btn btn-quiet btn-sm" id="a-import">${Icons.refresh} Re-import</button>
          <button class="btn btn-quiet btn-sm" id="a-clear">Clear</button>
        </div>
      </div>
      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat-mini"><b class="num">${Fmt.money(a.totals.sales, 0)}</b><span>Product sales</span></div>
        <div class="stat-mini"><b class="num">${Fmt.money(a.totals.sellingFees + a.totals.fbaFees + a.totals.otherFees, 0)}</b><span>Amazon fees</span></div>
        <div class="stat-mini"><b class="num">${Fmt.money(a.totals.refunds, 0)}</b><span>Refunds</span></div>
        <div class="stat-mini"><b class="num" style="color:${a.totals.net >= 0 ? 'var(--good-text)' : 'var(--bad-text)'}">${Fmt.money(a.totals.net, 0)}</b><span>Net proceeds</span></div>
      </div>
      <div class="table-wrap mt-16"><table class="table">
        <thead><tr><th>SKU</th><th class="th-r">Units</th><th class="th-r">Sales</th><th class="th-r">Fees</th>
          <th class="th-r">Net</th><th class="th-r">COGS/unit</th><th class="th-r">True profit</th></tr></thead>
        <tbody>
          ${a.perSku.slice(0, 12).map((s) => {
            const c = cogs[s.sku];
            const tp = c != null ? s.net - s.units * c : null;
            return `<tr>
              <td style="font-weight:600">${Fmt.esc(s.sku)}</td>
              <td class="td-r num">${s.units}</td>
              <td class="td-r num">${Fmt.money(s.sales)}</td>
              <td class="td-r num">${Fmt.money(s.fees)}</td>
              <td class="td-r num">${Fmt.money(s.net)}</td>
              <td class="td-r"><input class="field num" data-cogs="${Fmt.esc(s.sku)}" type="number" step="0.01" min="0"
                value="${c != null ? (c * Fmt.rate()).toFixed(2) : ''}" placeholder="${Fmt.sym()}" style="width:76px;height:26px;text-align:right"></td>
              <td class="td-r num" style="font-weight:650;color:${tp == null ? 'var(--ink-3)' : tp >= 0 ? 'var(--good-text)' : 'var(--bad-text)'}">${tp == null ? 'add COGS' : Fmt.money(tp)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
      <div class="spread mt-12">
        <span class="micro">Net proceeds already include Amazon fees; true profit subtracts your product cost.</span>
        <span style="font-size:13px">Total true profit${cogsKnown ? '' : ' (COGS incomplete)'}:
          <b class="num" style="color:${trueProfit >= 0 ? 'var(--good-text)' : 'var(--bad-text)'}">${Fmt.money(trueProfit)}</b></span>
      </div>
    </div>`;
  }

  async function importActuals(ctx, el) {
    let name, content;
    if (window.sellscout) {
      const res = await window.sellscout.file.openText('Amazon transaction report', ['csv', 'txt']);
      if (!res.ok) { if (!res.canceled) ctx.toast(res.error || 'Could not open file'); return; }
      name = res.name; content = res.content;
      finishImport(ctx, el, name, content);
    } else {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.csv,.txt';
      input.onchange = () => {
        const f = input.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => finishImport(ctx, el, f.name, reader.result);
        reader.readAsText(f);
      };
      input.click();
    }
  }

  function finishImport(ctx, el, name, content) {
    const parsed = Actuals.parse(content);
    if (!parsed.ok) { ctx.toast(parsed.error); Log.warn('Actuals import rejected', { file: name, error: parsed.error }); return; }
    Store.set('actuals', { ...parsed, fileName: name, importedAt: Date.now() });
    Log.info('Actuals imported', { file: name, rows: parsed.rows, orders: parsed.orders });
    ctx.toast('Imported ' + parsed.rows + ' transactions');
    render(el, ctx);
  }

  function renderConnect(creds, hasCreds) {
    if (state.connected) {
      return `<div class="card connect-hero" style="padding:16px 20px">
        <div class="connect-icon">${Icons.check}</div>
        <div style="flex:1">
          <div class="card-title">Amazon account connected</div>
          <div class="card-sub">${state.testResult && state.testResult.marketplaces ? 'Marketplaces: ' + Fmt.esc(state.testResult.marketplaces.join(', ')) : 'Credentials verified with SP-API.'}</div>
        </div>
        <button class="btn btn-quiet btn-sm" id="b-disconnect">Disconnect</button>
      </div>`;
    }
    return `<div class="card connect-hero">
      <div class="connect-icon">${Icons.plug}</div>
      <div style="flex:1">
        <div class="card-title">Connect your Amazon Seller account ${Info.btn('spapi')}</div>
        <div class="card-sub" style="max-width:620px;margin-top:4px;line-height:1.5">
          Link via the official Selling Partner API to pull your real orders, revenue and inventory into this dashboard.
          Credentials are stored only on this computer, encrypted with Windows security (DPAPI) — they never leave your machine
          except to authenticate directly with Amazon.
        </div>
        ${state.formOpen ? `
          <div class="cred-grid">
            <div class="field-row">
              <label class="field-label">Region</label>
              <select class="field" id="b-region">
                <option value="na" ${Store.get('spapi.region') === 'na' ? 'selected' : ''}>North America</option>
                <option value="eu" ${Store.get('spapi.region') === 'eu' ? 'selected' : ''}>Europe</option>
                <option value="fe" ${Store.get('spapi.region') === 'fe' ? 'selected' : ''}>Far East</option>
              </select>
            </div>
            <div class="field-row">
              <label class="field-label">Marketplace</label>
              <select class="field" id="b-marketplace">
                <option value="ATVPDKIKX0DER">Amazon.com (US)</option>
                <option value="A2EUQ1WTGCTBG2">Amazon.ca</option>
                <option value="A1F83G8C2ARO7P">Amazon.co.uk</option>
                <option value="A1PA6795UKMFR9">Amazon.de</option>
              </select>
            </div>
            <div class="field-row span-2">
              <label class="field-label">LWA Client ID ${creds.id.set ? `<span class="micro">(saved: ${creds.id.hint})</span>` : ''}</label>
              <input class="field" id="b-clientid" type="password" placeholder="amzn1.application-oa2-client…" autocomplete="off">
            </div>
            <div class="field-row span-2">
              <label class="field-label">LWA Client Secret ${creds.secret.set ? `<span class="micro">(saved: ${creds.secret.hint})</span>` : ''}</label>
              <input class="field" id="b-secret" type="password" placeholder="••••••••" autocomplete="off">
            </div>
            <div class="field-row span-2">
              <label class="field-label">Refresh Token ${creds.token.set ? `<span class="micro">(saved: ${creds.token.hint})</span>` : ''}</label>
              <input class="field" id="b-token" type="password" placeholder="Atzr|…" autocomplete="off">
            </div>
          </div>
          <div class="row mt-12">
            <button class="btn btn-primary" id="b-save">${state.testing ? 'Testing…' : 'Save & test connection'}</button>
            <button class="btn btn-quiet" id="b-cancel">Cancel</button>
            ${state.testResult && !state.testResult.ok ? `<span class="micro" style="color:var(--bad-text)">${Fmt.esc(state.testResult.error || '')}</span>` : ''}
          </div>
        ` : `
          <div class="row mt-12">
            <button class="btn btn-primary" id="b-open">${Icons.plug} ${hasCreds ? 'Test saved connection' : 'Connect account'}</button>
            ${hasCreds ? '<button class="btn btn-quiet" id="b-edit">Edit credentials</button>' : ''}
          </div>
        `}
        <details class="howto">
          <summary>How do I get these credentials?</summary>
          <ol>
            <li>Sign in to <b>Seller Central</b> → Apps & Services → <b>Develop Apps</b> and register as a developer (self-authorization is fine for your own account).</li>
            <li>Create a new app client. Amazon issues an <b>LWA Client ID</b> and <b>Client Secret</b>.</li>
            <li>Under the app’s <b>Authorize</b> action, generate a <b>Refresh Token</b> for your own seller account.</li>
            <li>Paste all three here — SellScout exchanges them directly with Amazon to read your orders and inventory. Nothing is sent anywhere else.</li>
          </ol>
          <div class="row mt-12" style="gap:8px">
            <button class="btn btn-quiet btn-sm" data-ext="https://sellercentral.amazon.com/sellingpartner/developerconsole">${Icons.external} Developer Console</button>
            <button class="btn btn-quiet btn-sm" data-ext="https://developer-docs.amazon.com/sp-api/">${Icons.external} SP-API docs</button>
          </div>
        </details>
      </div>
    </div>`;
  }

  function wireConnect(el, ctx) {
    const on = (id, fn) => { const n = el.querySelector(id); if (n) n.addEventListener('click', fn); };

    on('#b-open', async () => {
      const hasCreds = Store.secretState('spapi.lwaClientId').set &&
                       Store.secretState('spapi.lwaClientSecret').set &&
                       Store.secretState('spapi.refreshToken').set;
      if (hasCreds && Store.hasBridge) await testConnection(el, ctx);
      else { state.formOpen = true; render(el, ctx); }
    });
    on('#b-edit', () => { state.formOpen = true; render(el, ctx); });
    on('#b-cancel', () => { state.formOpen = false; state.testResult = null; render(el, ctx); });
    on('#b-disconnect', () => {
      state.connected = false; state.liveOrders = null; state.testResult = null;
      ctx.toast('Disconnected — showing simulated data');
      render(el, ctx);
    });

    on('#b-save', async () => {
      const v = (id) => { const n = el.querySelector(id); return n ? n.value.trim() : ''; };
      const region = v('#b-region') || 'na';
      const marketplace = v('#b-marketplace') || 'ATVPDKIKX0DER';
      Store.set('spapi.region', region);
      Store.set('spapi.marketplaceId', marketplace);
      if (v('#b-clientid')) Store.set('spapi.lwaClientId', v('#b-clientid'));
      if (v('#b-secret')) Store.set('spapi.lwaClientSecret', v('#b-secret'));
      if (v('#b-token')) Store.set('spapi.refreshToken', v('#b-token'));

      if (!Store.hasBridge) {
        ctx.toast('Live connection needs the desktop app (npm start)');
        return;
      }
      await testConnection(el, ctx);
    });
  }

  async function testConnection(el, ctx) {
    state.testing = true; render(el, ctx);
    try {
      const res = await window.sellscout.spapi.test();
      state.testResult = res;
      if (res.ok) {
        state.connected = true; state.formOpen = false;
        Log.info('SP-API connected', { marketplaces: res.marketplaces });
        ctx.toast('Connected to Amazon SP-API');
        // Pull live orders (best-effort)
        const ord = await window.sellscout.spapi.orders(30);
        if (ord.ok && Array.isArray(ord.orders) && ord.orders.length) {
          state.liveOrders = ord.orders.slice(0, 9).map((o) => ({
            name: o.AmazonOrderId, emoji: '🛒', hue: 210,
            qty: o.NumberOfItemsShipped + o.NumberOfItemsUnshipped || 1,
            total: o.OrderTotal ? +o.OrderTotal.Amount : 0,
            city: (o.ShippingAddress && (o.ShippingAddress.City + ', ' + (o.ShippingAddress.StateOrRegion || ''))) || o.SalesChannel || '',
            status: o.OrderStatus === 'Pending' ? 'Pending' : o.OrderStatus === 'Shipped' ? 'Shipped' : 'Delivered',
            hoursAgo: Math.max(1, Math.round((Date.now() - Date.parse(o.PurchaseDate)) / 3600000))
          }));
        }
      } else {
        Log.warn('SP-API connection failed', { error: res.error });
        ctx.toast('Connection failed — check credentials');
      }
    } catch (e) {
      state.testResult = { ok: false, error: e.message };
      Log.error('SP-API test threw', { error: e.message });
    }
    state.testing = false;
    render(el, ctx);
  }

  window.Pages = window.Pages || {};
  window.Pages.business = { id: 'business', title: 'My Business', nav: 'My Business', group: 'Business', icon: 'business', render };
})();
