// Product Pipeline — kanban workflow from idea to live listing.
// Also exposes window.Pipeline used by the product drawer.
(function () {
  'use strict';

  const STAGES = ['Idea', 'Researching', 'Quoted', 'Sampled', 'Ordered', 'Live'];

  const Pipeline = {
    STAGES,
    all() { return Store.get('pipeline') || {}; },
    get(id) { return this.all()[id] || null; },
    set(id, patch) {
      const all = { ...this.all() };
      all[id] = { stage: 'Idea', notes: '', quotes: [], added: Date.now(), ...(all[id] || {}), ...patch };
      Store.set('pipeline', all);
      return all[id];
    },
    remove(id) {
      const all = { ...this.all() };
      delete all[id];
      Store.set('pipeline', all);
    }
  };
  window.Pipeline = Pipeline;

  function render(el, ctx) {
    const entries = Object.entries(Pipeline.all());
    const findProduct = (id) => ctx.products.find((p) => p.id === id);

    el.innerHTML = `
      <div class="card" style="padding:14px 18px">
        <div class="spread">
          <div>
            <div class="card-title">Product pipeline</div>
            <div class="card-sub">Track products from idea to live listing. Add products from their detail panel
            (open any product → “Track in pipeline”).</div>
          </div>
          <span class="chip chip-neutral">${entries.length} tracked</span>
        </div>
      </div>

      <div class="pl-board section-gap">
        ${STAGES.map((stage) => {
          const cards = entries
            .filter(([, v]) => v.stage === stage)
            .map(([id, v]) => ({ id, v, p: findProduct(id) }))
            .filter((x) => x.p);
          return `<div class="pl-col">
            <div class="pl-col-head"><span>${stage}</span><span class="micro num">${cards.length}</span></div>
            ${cards.map(({ id, v, p }) => `
              <div class="pl-card" data-open="${id}">
                <div class="row" style="gap:9px">
                  ${UI.ptile(p)}
                  <div style="flex:1;min-width:0">
                    <div class="pl-name">${Fmt.esc(p.name)}</div>
                    <div class="micro">${Fmt.money(p.price)} · score ${p.scoring.total}${v.quotes.length ? ' · ' + v.quotes.length + ' quote' + (v.quotes.length > 1 ? 's' : '') : ''}</div>
                  </div>
                </div>
                ${v.notes ? `<div class="pl-notes">${Fmt.esc(v.notes.slice(0, 90))}${v.notes.length > 90 ? '…' : ''}</div>` : ''}
                <div class="row mt-8" style="gap:6px">
                  <select class="field pl-move" data-move="${id}" style="height:26px;font-size:11.5px;flex:1">
                    ${STAGES.map((s) => `<option ${s === v.stage ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                  <button class="icon-btn" data-remove="${id}" title="Remove from pipeline" style="width:26px;height:26px">${Icons.close}</button>
                </div>
              </div>`).join('') || '<div class="pl-empty">—</div>'}
          </div>`;
        }).join('')}
      </div>
      ${entries.length === 0 ? `<div class="empty" style="padding-top:26px">Nothing tracked yet — open a product in the
        <a class="ext" data-nav="finder">Product Finder</a> and press “Track in pipeline”.</div>` : ''}
    `;

    el.querySelectorAll('.pl-card[data-open]').forEach((n) =>
      n.addEventListener('click', (e) => {
        if (e.target.closest('select') || e.target.closest('[data-remove]')) return;
        ctx.openProduct(n.dataset.open);
      }));
    el.querySelectorAll('[data-move]').forEach((n) =>
      n.addEventListener('change', () => {
        Pipeline.set(n.dataset.move, { stage: n.value });
        Log.info('Pipeline stage changed', { id: n.dataset.move, stage: n.value });
        render(el, ctx);
      }));
    el.querySelectorAll('[data-remove]').forEach((n) =>
      n.addEventListener('click', () => {
        Pipeline.remove(n.dataset.remove);
        ctx.toast('Removed from pipeline');
        render(el, ctx);
      }));
    el.querySelectorAll('[data-nav]').forEach((n) =>
      n.addEventListener('click', () => ctx.navigate(n.dataset.nav)));
  }

  window.Pages = window.Pages || {};
  window.Pages.pipeline = { id: 'pipeline', title: 'Pipeline', nav: 'Pipeline', group: 'Business', icon: 'flag', render };
})();
