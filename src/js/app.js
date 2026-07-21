// SellScout — application shell: UI helpers, router, drawer, boot
(function () {
  'use strict';

  const PAGE_ORDER = ['dashboard', 'finder', 'sourcing', 'trendsnews', 'calculator', 'business', 'settings'];
  const GROUPS = ['Research', 'Tools', 'Business', 'System'];

  // ------------------------------------------------------------------
  // Shared UI helpers
  // ------------------------------------------------------------------
  const UI = {
    ptile(p, lg) {
      return `<span class="ptile ${lg ? 'ptile-lg' : ''}" style="background:hsl(${p.hue} 75% 92%)">${p.emoji}</span>`;
    },

    compMeter(level) {
      const on = level.cls === 'low' ? 1 : level.cls === 'mid' ? 2 : 3;
      let html = '<span class="meter">';
      for (let i = 0; i < 3; i++) html += `<i class="${i < on ? 'on-' + level.cls : ''}"></i>`;
      return html + '</span>';
    },

    newsRow(n) {
      const dotColor = n.sentiment === 'opp' ? 'var(--good)' : n.sentiment === 'risk' ? 'var(--bad)' : 'rgba(0,0,0,0.2)';
      const chip = n.sentiment === 'opp' ? '<span class="chip chip-opp">Opportunity</span>'
        : n.sentiment === 'risk' ? '<span class="chip chip-risk">Risk</span>' : '';
      return `<div class="news-item">
        <span class="news-dot" style="background:${dotColor}"></span>
        <div class="news-main">
          <div class="news-title">${n.link ? `<a data-ext="${Fmt.esc(n.link)}">${Fmt.esc(n.title)}</a>` : Fmt.esc(n.title)}</div>
          <div class="news-meta"><b>${Fmt.esc(n.source)}</b><span>·</span><span>${Fmt.timeAgo(n.ts)}</span>${chip}${n.demo ? '<span class="chip chip-neutral">Sample</span>' : ''}</div>
          ${n.summary ? `<div class="news-sum">${Fmt.esc(n.summary)}</div>` : ''}
        </div>
      </div>`;
    },

    ext(url) {
      if (window.sellscout) window.sellscout.openExternal(url);
      else window.open(url, '_blank', 'noopener');
    },

    // Drawer
    openDrawer(html, wire) {
      const drawer = document.getElementById('drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      UI.drawerContent(html, wire);
      setTimeout(() => {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
      }, 15);
    },

    drawerContent(html, wire) {
      const inner = document.getElementById('drawer-inner');
      const scroll = inner.scrollTop;
      inner.innerHTML = `<button class="drawer-close" id="drawer-close">${Icons.close}</button>` + html;
      inner.querySelector('#drawer-close').addEventListener('click', UI.closeDrawer);
      if (wire) wire(inner);
      inner.scrollTop = scroll;
      inner.querySelectorAll('[data-ext]').forEach((n) => {
        if (n.tagName === 'A') n.addEventListener('click', (e) => { e.preventDefault(); UI.ext(n.dataset.ext); });
      });
    },

    closeDrawer() {
      const drawer = document.getElementById('drawer');
      document.getElementById('drawer-backdrop').classList.remove('open');
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    },

    modal(html) {
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = `<div class="modal">${html}</div>`;
      wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
      document.body.appendChild(wrap);
      const esc = (e) => { if (e.key === 'Escape') { wrap.remove(); document.removeEventListener('keydown', esc); } };
      document.addEventListener('keydown', esc);
      return wrap;
    },

    toast(msg) {
      const root = document.getElementById('toast-root');
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      root.appendChild(t);
      setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 2400);
    }
  };
  window.UI = UI;

  // ------------------------------------------------------------------
  // App state / context
  // ------------------------------------------------------------------
  const ctx = {
    products: [],
    query: '',
    calcPrefill: null,
    news: { items: null },
    newsLive: false,
    current: 'dashboard',

    navigate(id, params) {
      if (id === 'calculator' && params) ctx.calcPrefill = params;
      if (location.hash !== '#/' + id) location.hash = '#/' + id;
      else renderPage(id);
    },

    openProduct(id) {
      const p = ctx.products.find((x) => x.id === id);
      if (p) ProductDrawer.open(p, ctx);
    },

    toast: UI.toast,

    rescore() {
      ctx.products = Scoring.scoreAll(DemoData.products);
      renderPage(ctx.current);
    },

    async refreshNews() {
      const btn = document.getElementById('btn-refresh');
      btn.classList.add('spin');
      try {
        if (window.sellscout) {
          const res = await window.sellscout.news.fetch();
          if (res.ok && res.items && res.items.length) {
            ctx.news.items = res.items;
            ctx.newsLive = true;
            Log.info('News refreshed', { stories: res.items.length });
            UI.toast('Live news updated — ' + res.items.length + ' stories');
          } else {
            Log.warn('News refresh returned no items', { error: res.error || null });
            UI.toast('Feeds unreachable — showing bundled headlines');
          }
        } else {
          UI.toast('Live feeds need the desktop app (npm start)');
        }
      } catch (e) {
        UI.toast('Could not refresh feeds');
      }
      btn.classList.remove('spin');
      if (ctx.current === 'dashboard' || ctx.current === 'trendsnews') renderPage(ctx.current);
    }
  };

  // ------------------------------------------------------------------
  // Router + rendering
  // ------------------------------------------------------------------
  function renderPage(id) {
    const page = window.Pages[id] || window.Pages.dashboard;
    ctx.current = page.id;

    document.getElementById('page-title').textContent = page.title;
    document.querySelectorAll('.nav-item').forEach((n) =>
      n.classList.toggle('active', n.dataset.page === page.id));

    const el = document.getElementById('page');
    el.innerHTML = '';
    // retrigger the entrance animation
    const content = document.querySelector('.content');
    content.style.animation = 'none';
    void content.offsetHeight;
    content.style.animation = '';

    page.render(el, ctx);
    document.getElementById('main').scrollTop = 0;
  }

  function route() {
    const id = (location.hash || '#/dashboard').replace('#/', '') || 'dashboard';
    renderPage(window.Pages[id] ? id : 'dashboard');
  }

  function buildNav() {
    const nav = document.getElementById('nav-main');
    let html = '';
    for (const group of GROUPS) {
      const pages = PAGE_ORDER.map((id) => window.Pages[id]).filter((p) => p && p.group === group);
      if (!pages.length) continue;
      html += `<div class="nav-group">` +
        (group !== 'System' ? `<div class="nav-label">${group}</div>` : '') +
        pages.map((p) => `<button class="nav-item" data-page="${p.id}">${Icons[p.icon] || ''}<span>${p.nav}</span></button>`).join('') +
        `</div>`;
    }
    nav.innerHTML = html;
    nav.querySelectorAll('.nav-item').forEach((n) =>
      n.addEventListener('click', () => ctx.navigate(n.dataset.page)));
  }

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  async function boot() {
    document.getElementById('brand-mark').innerHTML = Icons.logo;
    document.getElementById('search-icon').innerHTML = Icons.search;
    document.getElementById('btn-refresh').innerHTML = Icons.refresh;

    await Store.init();
    Fmt.setCurrency(Store.get('currency'));
    ctx.products = Scoring.scoreAll(DemoData.products);
    Log.info('Renderer started', { currency: Fmt.currency(), products: ctx.products.length });

    buildNav();

    // Global ⓘ explainer delegation — any element with data-info opens its entry
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-info]');
      if (!b) return;
      const d = Info.DICT[b.dataset.info];
      if (d) UI.modal(`<div class="card-title" style="font-size:16px">${d.t}</div>
        <p class="card-sub" style="margin-top:10px;line-height:1.6;font-size:13px">${d.b}</p>`);
    });

    // Search
    const search = document.getElementById('global-search');
    let searchTimer = null;
    search.addEventListener('input', () => {
      ctx.query = search.value.trim();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        if (ctx.current !== 'finder') ctx.navigate('finder');
        else renderPage('finder');
      }, 220);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'SELECT') {
        e.preventDefault();
        search.focus();
        search.select();
      }
      if (e.key === 'Escape') UI.closeDrawer();
    });

    // Refresh + badge
    document.getElementById('btn-refresh').addEventListener('click', ctx.refreshNews);
    document.getElementById('drawer-backdrop').addEventListener('click', UI.closeDrawer);

    const badge = document.getElementById('data-badge');
    const syncBadge = () => {
      const live = ctx.newsLive;
      badge.textContent = live ? 'Live + demo data' : 'Demo data';
      badge.classList.toggle('live', live);
    };
    Store.onChange(syncBadge);
    setInterval(syncBadge, 1500);
    syncBadge();

    if (window.sellscout) {
      window.sellscout.version().then((v) => {
        document.getElementById('sidebar-version').textContent = 'v' + v;
      }).catch(() => {});
    }

    window.addEventListener('hashchange', route);
    route();

    // First-run setup
    Onboarding.maybeShow(ctx);

    // Quietly try live news once at startup (desktop only)
    if (window.sellscout) {
      window.sellscout.news.fetch().then((res) => {
        if (res.ok && res.items && res.items.length) {
          ctx.news.items = res.items;
          ctx.newsLive = true;
          if (ctx.current === 'dashboard' || ctx.current === 'trendsnews') renderPage(ctx.current);
        }
      }).catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
