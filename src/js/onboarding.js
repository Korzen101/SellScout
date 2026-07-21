// First-time setup wizard (global: Onboarding)
(function () {
  'use strict';

  let step = 0;
  let draft = {};

  function featureRow(icon, title, text) {
    return `<div class="ob-feat">${Icons[icon]}<div><b>${title}</b><span>${text}</span></div></div>`;
  }

  function stepHtml() {
    if (step === 0) {
      return `
        <div class="ob-hero">
          <span class="ob-mark">${Icons.logo}</span>
          <div class="ob-title">Welcome to SellScout</div>
          <div class="ob-sub">Find products worth selling, price them honestly, source them smartly —
          and track the Amazon business you build on them.</div>
        </div>
        <div class="ob-features">
          ${featureRow('finder', 'Ranked opportunities', 'Every product scored 0–100 on demand, margin, trend, competition and risk.')}
          ${featureRow('calculator', 'True unit economics', 'Referral, FBA, storage, returns, ads and duty — no surprise costs.')}
          ${featureRow('sourcing', 'Cross-market sourcing', 'Alibaba to retail clearance, ranked by real ROI.')}
          ${featureRow('business', 'Your business, live', 'Connect your seller account for revenue, orders and restock alerts.')}
        </div>`;
    }
    if (step === 1) {
      return `
        <div class="ob-hero" style="padding-bottom:10px">
          <div class="ob-title" style="font-size:18px">Make it yours</div>
          <div class="ob-sub">You can change any of this later in Settings.</div>
        </div>
        <div class="ob-form">
          <div class="field-row">
            <label class="field-label">Your name</label>
            <input class="field" id="ob-name" value="${Fmt.esc(draft.userName)}" autocomplete="off">
          </div>
          <div class="field-row">
            <label class="field-label">Display currency</label>
            <select class="field" id="ob-currency">
              ${Object.entries(Fmt.CURRENCIES).map(([code, c]) =>
                `<option value="${code}" ${draft.currency === code ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="field-row">
            <label class="field-label">Advertising budget (% of price)</label>
            <input class="field num" id="ob-ads" type="number" step="0.5" min="0" value="${draft.adsPctOfPrice}">
            <span class="field-hint">Typical healthy range is 5–12% (TACoS)</span>
          </div>
          <div class="field-row">
            <label class="field-label">Expected return rate (%)</label>
            <input class="field num" id="ob-returns" type="number" step="0.5" min="0" value="${draft.returnRatePct}">
            <span class="field-hint">~2% is normal for hard goods</span>
          </div>
        </div>`;
    }
    return `
      <div class="ob-hero" style="padding-bottom:10px">
        <div class="ob-title" style="font-size:18px">Where the numbers come from</div>
        <div class="ob-sub">SellScout is honest about its data so your decisions can be too.</div>
      </div>
      <div class="ob-list">
        <div class="ob-feat">${Icons.box}<div><b>Product catalog — bundled research data</b>
          <span>Realistic demo data, clearly labeled. Add a Keepa key in Settings for live Amazon catalog data.</span></div></div>
        <div class="ob-feat">${Icons.news}<div><b>Market news — live</b>
          <span>Free RSS feeds from Retail Dive, Practical Ecommerce, TechCrunch and Marketplace Pulse. Press ↻ anytime.</span></div></div>
        <div class="ob-feat">${Icons.business}<div><b>Your business — connect when ready</b>
          <span>Link your Amazon Seller account on the My Business page. Credentials are encrypted on this PC and only ever sent to Amazon.</span></div></div>
      </div>
      <p class="micro" style="margin-top:14px;text-align:center">All profit figures are research estimates —
      verify with Amazon’s revenue calculator before buying inventory.</p>`;
  }

  function render(wrap, ctx) {
    const modal = wrap.querySelector('.modal');
    modal.innerHTML = `
      ${stepHtml()}
      <div class="ob-actions">
        <div class="ob-dots">${[0, 1, 2].map((i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
        <div class="row">
          ${step > 0 ? '<button class="btn btn-quiet" id="ob-back">Back</button>' : '<button class="btn btn-quiet" id="ob-skip">Skip</button>'}
          <button class="btn btn-primary" id="ob-next">${step === 2 ? 'Start scouting' : 'Continue'}</button>
        </div>
      </div>`;

    const capture = () => {
      const g = (id) => modal.querySelector(id);
      if (g('#ob-name')) draft.userName = g('#ob-name').value.trim() || 'there';
      if (g('#ob-currency')) draft.currency = g('#ob-currency').value;
      if (g('#ob-ads')) draft.adsPctOfPrice = +g('#ob-ads').value || 8;
      if (g('#ob-returns')) draft.returnRatePct = +g('#ob-returns').value || 2;
    };

    const nextBtn = modal.querySelector('#ob-next');
    nextBtn.addEventListener('click', () => {
      capture();
      if (step < 2) { step++; render(wrap, ctx); return; }
      finish(wrap, ctx);
    });
    const back = modal.querySelector('#ob-back');
    if (back) back.addEventListener('click', () => { capture(); step--; render(wrap, ctx); });
    const skip = modal.querySelector('#ob-skip');
    if (skip) skip.addEventListener('click', () => finish(wrap, ctx, true));
  }

  function finish(wrap, ctx, skipped) {
    Store.set('userName', draft.userName);
    Store.set('currency', draft.currency);
    Store.set('adsPctOfPrice', draft.adsPctOfPrice);
    Store.set('returnRatePct', draft.returnRatePct);
    Store.set('onboarded', true);
    Fmt.setCurrency(draft.currency);
    Log.info(skipped ? 'Onboarding skipped' : 'Onboarding completed',
      { currency: draft.currency, ads: draft.adsPctOfPrice, returns: draft.returnRatePct });
    wrap.remove();
    ctx.rescore();
    ctx.toast(skipped ? 'You can rerun setup from Settings anytime' : 'Welcome aboard, ' + draft.userName + ' — happy scouting!');
  }

  function show(ctx) {
    step = 0;
    draft = {
      userName: Store.get('userName') || 'Chris',
      currency: Store.get('currency') || 'USD',
      adsPctOfPrice: Store.get('adsPctOfPrice'),
      returnRatePct: Store.get('returnRatePct')
    };
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = '<div class="modal ob-modal"></div>';
    document.body.appendChild(wrap);
    render(wrap, ctx);
  }

  function maybeShow(ctx) {
    if (!Store.get('onboarded')) show(ctx);
  }

  window.Onboarding = { show, maybeShow };
})();
