// Contextual explainers (global: Info). Info.btn('key') renders a small ⓘ that
// opens a plain-language explanation — app.js wires a global click handler.
(function () {
  'use strict';

  const DICT = {
    score: {
      t: 'Opportunity score',
      b: 'A 0–100 blend of five signals: demand (26%), margin (22%), trend (20%), competition (20%) and risk (12%). ' +
         '78+ is Excellent, 65–77 Strong, 50–64 Moderate, below 50 Weak. Every component is shown in the product’s detail panel, so you can always see why something ranks where it does.'
    },
    demand: {
      t: 'Demand',
      b: 'Estimated units sold per month across the top listings for this product type. Scored on a log scale, so a niche doing 300/mo still registers against a giant doing 3,000/mo.'
    },
    trend: {
      t: 'Trend',
      b: 'Momentum of search/purchase demand over 12 months — the last three months compared with the first three. Rising trends give you a tailwind; fading ones mean you’re fighting for a shrinking pie.'
    },
    competition: {
      t: 'Competition',
      b: 'How hard it is to break in: the review depth of the top 10 listings (the “moat”), how many sellers compete, and whether Amazon itself retails the product. Low competition means a new listing can realistically rank.'
    },
    risk: {
      t: 'Risk',
      b: 'Deductions for operational hazards: seasonal demand, intellectual-property exposure, gated categories, fragile or oversize items, certification requirements, and volatile pricing.'
    },
    netMargin: {
      t: 'Net margin',
      b: 'Profit as a percentage of the sale price after every cost: product, shipping, duty, referral fee, FBA fulfillment, storage, returns and advertising. Healthy private-label products typically clear 25–35%.'
    },
    roi: {
      t: 'Return on investment',
      b: 'Profit per unit divided by the cash you put in (landed cost). 100% ROI means every $1 of inventory returns $2. Resellers usually want 50%+ for retail arbitrage and 100%+ for private label to cover the risk.'
    },
    breakeven: {
      t: 'Breakeven price',
      b: 'The sale price at which profit is exactly zero with the current cost structure. If the market price drops near your breakeven, the product can no longer absorb a price war.'
    },
    tacos: {
      t: 'Advertising (TACoS)',
      b: 'Total Advertising Cost of Sales — ad spend as a share of all revenue. New launches often run 15%+ while established listings settle to 5–10%. It is modeled per-unit here so ranked margins stay honest.'
    },
    returnRate: {
      t: 'Return rate',
      b: 'Share of units that come back. Hard goods run ~2%; apparel and sized products much higher. Returns cost you the fees plus, often, the unit itself.'
    },
    storageMonths: {
      t: 'Months in storage',
      b: 'Average time a unit sits in an Amazon warehouse before selling. Slow-turning inventory pays more monthly storage — and long-term storage surcharges after 181 days (not modeled here).'
    },
    duty: {
      t: 'Import duty',
      b: 'Customs duty as a percentage of the unit cost when importing. Rates vary by product HS code and country of origin — check the current tariff schedule for your category.'
    },
    referral: {
      t: 'Referral fee',
      b: 'Amazon’s commission on each sale — most categories pay 15%, consumer electronics 8%, automotive 12%, clothing 17%. Charged on the full sale price, with a $0.30 minimum.'
    },
    fees: {
      t: 'Amazon fees',
      b: 'Referral fee (Amazon’s commission), FBA fulfillment (pick/pack/ship, set by size and weight tier), monthly storage, and an allowance for returns. Together they typically consume 30–40% of the sale price.'
    },
    sizeTier: {
      t: 'Size tier',
      b: 'Amazon prices FBA fulfillment by size/weight bands. Small-standard (under 16 oz) ships for ~$3.35; large-bulky items cost $10+. Shaving an item under a tier boundary is one of the highest-leverage margin moves.'
    },
    landed: {
      t: 'Landed cost',
      b: 'Everything it costs to get one unit into Amazon’s warehouse: the unit price, freight per unit, and import duty. Compare sourcing options by landed cost, never by unit price alone.'
    },
    reviewMoat: {
      t: 'Review moat',
      b: 'The average review count of the top 10 listings. Buyers default to social proof, so out-ranking listings with thousands of reviews takes serious time and ad spend. Under ~500 average is attackable.'
    },
    cover: {
      t: 'Days of cover',
      b: 'Current stock divided by daily sales velocity — how long until you sell out. Reorder before cover drops below your supplier lead time plus a safety buffer (21 days is a common trigger).'
    },
    profitEst: {
      t: 'Estimated net profit',
      b: 'Revenue minus modeled costs (fees, product cost, advertising). This is an estimate for steering the business day-to-day — reconcile with Seller Central settlement reports for accounting.'
    },
    spapi: {
      t: 'Amazon SP-API connection',
      b: 'The official Selling Partner API. You self-authorize your own seller account in Seller Central and paste three credentials; SellScout exchanges them directly with Amazon over HTTPS to read your orders and inventory. Credentials are encrypted on this PC with Windows security and never sent anywhere else.'
    },
    keepa: {
      t: 'Keepa',
      b: 'A paid third-party service (keepa.com) exposing Amazon price history, sales-rank history and best-seller lists via API. A key unlocks live catalog data; without one SellScout uses its bundled research dataset.'
    },
    currency: {
      t: 'Display currency',
      b: 'Catalog and fee data are US-dollar based. Choosing another currency converts what you see (and what you type in the calculator) using approximate fixed rates — good for orientation, not bookkeeping.'
    },
    demoData: {
      t: 'Demo data',
      b: 'The bundled product catalog is realistic research data, not a live feed — Amazon offers no free product API and scraping violates their terms. Live sources plug in via Keepa (catalog), RSS (news) and SP-API (your own business).'
    }
  };

  function btn(key) {
    return DICT[key]
      ? `<button class="info-btn" data-info="${key}" title="What is this?" aria-label="Explain">${Icons.info}</button>`
      : '';
  }

  window.Info = { DICT, btn };
})();
