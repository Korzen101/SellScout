// Settings — preferences, data sources, assumptions, activity log, about
(function () {
  'use strict';

  function render(el, ctx) {
    const keepa = Store.secretState('keepaApiKey');
    const rainforest = Store.secretState('rainforestApiKey');

    el.innerHTML = `
      <div class="settings-stack">

        <div class="card">
          <div class="card-head"><div>
            <div class="card-title">Preferences</div>
            <div class="card-sub">Personalization and display</div>
          </div></div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Your name</div>
              <div class="set-desc">Used for the dashboard greeting.</div>
            </div>
            <div class="set-ctl"><input class="field" id="s-name" value="${Fmt.esc(Store.get('userName') || '')}" style="width:180px"></div>
          </div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Display currency ${Info.btn('currency')}</div>
              <div class="set-desc">Converts every money figure at approximate fixed rates. Catalog and fee data stay USD underneath.</div>
            </div>
            <div class="set-ctl">
              <select class="field" id="s-currency" style="width:220px">
                ${Object.entries(Fmt.CURRENCIES).map(([code, c]) =>
                  `<option value="${code}" ${Fmt.currency() === code ? 'selected' : ''}>${c.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">First-time setup</div>
              <div class="set-desc">Rerun the welcome walkthrough.</div>
            </div>
            <div class="set-ctl"><button class="btn btn-quiet btn-sm" id="s-rerun">Show setup again</button></div>
          </div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Desktop notifications</div>
              <div class="set-desc">Daily alerts for restock warnings and big opportunity-score moves on followed products.</div>
            </div>
            <div class="set-ctl">
              <label class="switch"><input type="checkbox" id="s-notify" ${Store.get('notificationsEnabled') === false ? '' : 'checked'}><span class="knob"></span></label>
            </div>
          </div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Backup & restore</div>
              <div class="set-desc">Export preferences, watchlist, pipeline, snapshots and imported P&L to a JSON file
              (API keys and Amazon credentials are never included). Import merges a backup back in.</div>
            </div>
            <div class="set-ctl">
              <button class="btn btn-quiet btn-sm" id="s-backup">${Icons.export} Export</button>
              <button class="btn btn-quiet btn-sm" id="s-restore">${Icons.doc} Import</button>
            </div>
          </div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Reset to defaults</div>
              <div class="set-desc">Restores currency, data mode and all economics assumptions. Keeps your API keys, watchlist and Amazon connection.</div>
            </div>
            <div class="set-ctl"><button class="btn btn-quiet btn-sm" id="s-reset" style="color:var(--bad-text)">${Icons.reset} Reset defaults</button></div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><div>
            <div class="card-title">Data sources</div>
            <div class="card-sub">Where product and market numbers come from ${Info.btn('demoData')}</div>
          </div></div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Live news feeds</div>
              <div class="set-desc">Pull retail & marketplace headlines from Retail Dive, Practical Ecommerce,
                TechCrunch Commerce and Marketplace Pulse via RSS. Free, no key needed.</div>
            </div>
            <div class="set-ctl">
              <button class="btn btn-quiet btn-sm" id="s-refresh-news">${Icons.refresh} Fetch now</button>
            </div>
          </div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Amazon SP-API catalog <span class="micro">· free</span></div>
              <div class="set-desc">Your own seller connection doubles as a free product-data source: price,
                offer count, sales rank and dimensions for any ASIN. No review or price history (Keepa covers that).
                Used automatically by “Analyze ASIN” when no Keepa key is set.</div>
            </div>
            <div class="set-ctl"><button class="btn btn-quiet btn-sm" id="s-gobusiness2">Connect ${Icons.chevR}</button></div>
          </div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Keepa API key ${Info.btn('keepa')} <span class="micro">${keepa.set ? '· saved ' + keepa.hint : '· optional'}</span></div>
              <div class="set-desc">Unlocks the “Analyze ASIN” feature and live Amazon catalog data (paid service).
                Without a key, the catalog uses bundled research data.
                <a class="ext" data-ext="https://keepa.com/#!api">Get a key at keepa.com ↗</a></div>
            </div>
            <div class="set-ctl">
              <input class="field" id="s-keepa" type="password" placeholder="${keepa.set ? 'Replace key…' : 'Paste API key…'}" autocomplete="off">
              <button class="btn btn-quiet btn-sm" data-savekey="keepaApiKey" data-src="#s-keepa">Save</button>
            </div>
          </div>

          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Rainforest API key <span class="micro">${rainforest.set ? '· saved ' + rainforest.hint : '· optional'}</span></div>
              <div class="set-desc">Alternative live product-data provider for search results and listings.
                <a class="ext" data-ext="https://www.rainforestapi.com/">Get a key at rainforestapi.com ↗</a></div>
            </div>
            <div class="set-ctl">
              <input class="field" id="s-rainforest" type="password" placeholder="${rainforest.set ? 'Replace key…' : 'Paste API key…'}" autocomplete="off">
              <button class="btn btn-quiet btn-sm" data-savekey="rainforestApiKey" data-src="#s-rainforest">Save</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><div>
            <div class="card-title">Economics assumptions</div>
            <div class="card-sub">Used by the opportunity score, sourcing tables and calculator defaults ·
              <b>${Fees.SCHEDULE.label}</b></div>
          </div></div>

          ${[
            ['adsPctOfPrice', 'Advertising (% of price)', 'tacos', 'Average total ad cost of sales. Typical healthy range is 5–12%.', 0.5],
            ['returnRatePct', 'Return rate (%)', 'returnRate', 'Share of units returned. 2% is typical for hard goods; apparel runs higher.', 0.5],
            ['storageMonths', 'Months in FBA storage', 'storageMonths', 'Average time a unit sits in a fulfillment center before selling.', 0.5],
            ['dutyPct', 'Import duty (%)', 'duty', 'Applied to unit cost for overseas sourcing options.', 0.5]
          ].map(([key, name, infoKey, desc, step]) => `
            <div class="set-row">
              <div class="set-info"><div class="set-name">${name} ${Info.btn(infoKey)}</div><div class="set-desc">${desc}</div></div>
              <div class="set-ctl"><input class="field num" style="width:110px" type="number" step="${step}" min="0"
                data-assume="${key}" value="${Store.get(key)}"></div>
            </div>`).join('')}
        </div>

        <div class="card">
          <div class="card-head"><div>
            <div class="card-title">Amazon connection ${Info.btn('spapi')}</div>
            <div class="card-sub">Selling Partner API credentials are managed on the My Business page</div>
          </div></div>
          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Credential storage</div>
              <div class="set-desc">Secrets are encrypted at rest with Windows DPAPI via Electron safeStorage and stored in your
              user profile. They are only ever sent to amazon.com endpoints to authenticate.</div>
            </div>
            <div class="set-ctl"><button class="btn btn-quiet btn-sm" id="s-gobusiness">Open My Business ${Icons.chevR}</button></div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Activity log</div>
              <div class="card-sub">What the app has been doing — useful when something misbehaves</div>
            </div>
            <div class="row">
              <button class="btn btn-quiet btn-sm" id="s-log-refresh">${Icons.refresh} Refresh</button>
              ${Store.hasBridge ? `<button class="btn btn-quiet btn-sm" id="s-log-folder">${Icons.external} Open folder</button>` : ''}
              <button class="btn btn-quiet btn-sm" id="s-log-clear">Clear</button>
            </div>
          </div>
          <div class="log-view" id="s-log-view">Loading…</div>
        </div>

        <div class="card">
          <div class="card-head"><div>
            <div class="card-title">About SellScout</div>
          </div></div>
          <div class="set-row">
            <div class="set-info">
              <div class="set-name">Version <span class="micro" id="s-version">1.2</span></div>
              <div class="set-desc" style="margin-top:6px">SellScout surfaces resale opportunities by combining demand,
              trend, competition, margin and risk signals into one transparent score. All estimates are research guidance —
              validate with live data before buying inventory. This tool is independent and not affiliated with or endorsed
              by Amazon.com, Inc.</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // --- Preferences ---
    el.querySelector('#s-name').addEventListener('change', (e) => {
      Store.set('userName', e.target.value.trim());
      ctx.toast('Name updated');
    });

    el.querySelector('#s-currency').addEventListener('change', (e) => {
      Store.set('currency', e.target.value);
      Fmt.setCurrency(e.target.value);
      Log.info('Currency changed', { currency: e.target.value });
      ctx.rescore();
      ctx.toast('Showing values in ' + e.target.value);
    });

    el.querySelector('#s-rerun').addEventListener('click', () => Onboarding.show(ctx));

    el.querySelector('#s-notify').addEventListener('change', (e) => {
      Store.set('notificationsEnabled', e.target.checked);
      ctx.toast(e.target.checked ? 'Notifications on' : 'Notifications off');
    });

    el.querySelector('#s-backup').addEventListener('click', async () => {
      const SECRETS = ['keepaApiKey', 'rainforestApiKey', 'spapi.lwaClientId', 'spapi.lwaClientSecret', 'spapi.refreshToken'];
      const data = {};
      for (const [k, v] of Object.entries(Store.all())) {
        if (!SECRETS.includes(k)) data[k] = v;
      }
      const json = JSON.stringify({ app: 'SellScout', exportedAt: new Date().toISOString(), data }, null, 2);
      const name = 'sellscout-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      if (window.sellscout) {
        const res = await window.sellscout.file.save(name, json, 'JSON backup', 'json');
        if (res.ok) { ctx.toast('Backup saved'); Log.info('Backup exported', { path: res.path }); }
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        a.download = name; a.click(); URL.revokeObjectURL(a.href);
        ctx.toast('Backup downloaded');
      }
    });

    el.querySelector('#s-restore').addEventListener('click', async () => {
      const apply = (text) => {
        try {
          const parsed = JSON.parse(text);
          if (!parsed || parsed.app !== 'SellScout' || typeof parsed.data !== 'object') {
            ctx.toast('Not a SellScout backup file'); return;
          }
          const SECRETS = ['keepaApiKey', 'rainforestApiKey', 'spapi.lwaClientId', 'spapi.lwaClientSecret', 'spapi.refreshToken'];
          let n = 0;
          for (const [k, v] of Object.entries(parsed.data)) {
            if (!SECRETS.includes(k)) { Store.set(k, v); n++; }
          }
          Fmt.setCurrency(Store.get('currency'));
          Log.info('Backup imported', { keys: n });
          ctx.rescore();
          ctx.toast('Backup restored — ' + n + ' settings applied');
        } catch { ctx.toast('Could not read that backup file'); }
      };
      if (window.sellscout) {
        const res = await window.sellscout.file.openText('SellScout backup', ['json']);
        if (res.ok) apply(res.content);
      } else {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = () => {
          const f = input.files[0]; if (!f) return;
          const r = new FileReader(); r.onload = () => apply(r.result); r.readAsText(f);
        };
        input.click();
      }
    });

    el.querySelector('#s-reset').addEventListener('click', () => {
      const wrap = UI.modal(`
        <div class="card-title" style="font-size:16px">Reset settings to defaults?</div>
        <p class="card-sub" style="margin-top:8px;line-height:1.55">Currency, data mode and all economics assumptions
        go back to factory values. API keys, your watchlist and Amazon credentials are kept.</p>
        <div class="row mt-16" style="justify-content:flex-end">
          <button class="btn btn-quiet" id="rst-cancel">Cancel</button>
          <button class="btn btn-primary" id="rst-go" style="background:var(--bad)">Reset</button>
        </div>`);
      wrap.querySelector('#rst-cancel').addEventListener('click', () => wrap.remove());
      wrap.querySelector('#rst-go').addEventListener('click', () => {
        const n = Store.resetDefaults();
        Fmt.setCurrency(Store.get('currency'));
        Log.info('Settings reset to defaults', { keys: n });
        wrap.remove();
        ctx.rescore();
        ctx.toast('Settings restored to defaults');
      });
    });

    // --- Keys ---
    el.querySelectorAll('[data-savekey]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = el.querySelector(btn.dataset.src);
        const val = input.value.trim();
        if (!val) { ctx.toast('Enter a key first'); return; }
        Store.set(btn.dataset.savekey, val);
        input.value = '';
        Log.info('API key saved', { key: btn.dataset.savekey });
        ctx.toast('Key saved securely');
        render(el, ctx);
      });
    });

    // --- Assumptions ---
    el.querySelectorAll('[data-assume]').forEach((input) => {
      input.addEventListener('change', () => {
        Store.set(input.dataset.assume, +input.value || 0);
        Log.info('Assumption changed', { key: input.dataset.assume, value: +input.value || 0 });
        ctx.rescore();
        ctx.toast('Assumptions updated — scores recalculated');
      });
    });

    // --- Log viewer ---
    const logView = el.querySelector('#s-log-view');
    const paintLog = async () => {
      const lines = await Log.recent(120);
      logView.innerHTML = lines.length
        ? lines.slice().reverse().map((l) => {
            const cls = l.includes('[ERROR]') ? 'lv-error' : l.includes('[WARN ]') ? 'lv-warn' : '';
            return `<div class="${cls}">${Fmt.esc(l)}</div>`;
          }).join('')
        : '<span class="micro">No activity recorded yet.</span>';
    };
    paintLog();
    el.querySelector('#s-log-refresh').addEventListener('click', paintLog);
    el.querySelector('#s-log-clear').addEventListener('click', async () => {
      await Log.clear();
      paintLog();
      ctx.toast('Log cleared');
    });
    const folderBtn = el.querySelector('#s-log-folder');
    if (folderBtn) folderBtn.addEventListener('click', () => Log.openFolder());

    // --- Misc ---
    el.querySelector('#s-refresh-news').addEventListener('click', () => ctx.refreshNews());
    el.querySelector('#s-gobusiness').addEventListener('click', () => ctx.navigate('business'));
    const goBiz2 = el.querySelector('#s-gobusiness2');
    if (goBiz2) goBiz2.addEventListener('click', () => ctx.navigate('business'));

    if (window.sellscout) {
      window.sellscout.version().then((v) => {
        const n = el.querySelector('#s-version');
        if (n) n.textContent = String(v).split('.').slice(0, 2).join('.'); // marketing version only
      }).catch(() => {});
    }
  }

  window.Pages = window.Pages || {};
  window.Pages.settings = { id: 'settings', title: 'Settings', nav: 'Settings', group: 'System', icon: 'settings', render };
})();
