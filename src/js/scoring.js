// Opportunity scoring engine (global: Scoring).
// Produces a transparent 0–100 score from five components. Each component is
// normalized to 0–1; the total is a weighted blend. Weights are visible in the
// UI ("How scoring works") so the ranking is explainable, not a black box.
(function () {
  'use strict';

  const WEIGHTS = {
    demand: 0.26,       // how much volume is there to win
    margin: 0.22,       // does the unit economics clear a healthy bar
    trend: 0.20,        // is demand rising or fading
    competition: 0.20,  // how hard is it to break in
    risk: 0.12          // operational hazards (seasonality, IP, fragility…)
  };

  const FLAG_INFO = {
    seasonal:  { label: 'Seasonal demand',    text: 'Sales concentrate in part of the year — plan inventory around the peak.' },
    fragile:   { label: 'Fragile item',       text: 'Higher damage/return risk in transit; budget extra packaging cost.' },
    'ip-risk': { label: 'IP / brand risk',    text: 'Design or brand elements could attract infringement claims. Verify before sourcing.' },
    gated:     { label: 'Gated category',     text: 'Amazon may require approval/documents before you can list.' },
    oversize:  { label: 'Oversize shipping',  text: 'Bulky dimensions raise FBA and freight costs; margins are sensitive to rate changes.' },
    volatile:  { label: 'Volatile pricing',   text: 'Buy-box price swings widely; margin at the average price may not hold.' },
    electric:  { label: 'Certification needed', text: 'Electronics typically need UL/FCC certs; factor compliance cost and lead time.' }
  };

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);

  function demandScore(p) {
    // log-scaled: 100/mo ≈ 0.55, 1000/mo ≈ 0.83, 3000+/mo ≈ 1
    if (!p.estMonthlySales) return 0;
    return clamp01(Math.log10(p.estMonthlySales + 1) / Math.log10(3000));
  }

  function trendScore(p) {
    const t = p.trend12 || [];
    if (t.length < 6) return 0.5;
    const first = mean(t.slice(0, 3));
    const last = mean(t.slice(-3));
    if (first <= 0) return 0.5;
    const momentum = (last - first) / first;      // -0.5 → fading, +0.5 → surging
    return clamp01(0.5 + momentum * 1.15);
  }

  function competitionScore(p) {
    // Higher = easier to compete
    const sellerEase = 1 - clamp01((p.sellers || 0) / 40);
    // Review depth is unknown for some sources (e.g. SP-API exposes no review
    // data) — treat unknown as neutral rather than as "no competition".
    const moatEase = p.reviewsTop10 == null
      ? 0.5
      : 1 - clamp01(Math.log10(p.reviewsTop10 + 1) / Math.log10(5000));
    let s = 0.55 * moatEase + 0.45 * sellerEase;
    if (p.amazonOnListing) s -= 0.18;             // competing with Amazon retail is brutal
    return clamp01(s);
  }

  function marginScore(p) {
    const best = Fees.bestSource(p);
    if (!best) return 0;
    const m = best.econ.marginPct / 100;
    const r = best.econ.roiPct / 100;
    if (best.econ.profit <= 0) return 0.05;
    return clamp01(0.55 * (m / 0.35) + 0.45 * (r / 2.0));
  }

  function riskScore(p) {
    let s = 1;
    for (const f of p.flags || []) {
      s -= (f === 'ip-risk' || f === 'gated') ? 0.18 : 0.11;
    }
    return Math.max(0.3, s);
  }

  function verdict(total) {
    if (total >= 78) return { label: 'Excellent', cls: 'excellent' };
    if (total >= 65) return { label: 'Strong', cls: 'strong' };
    if (total >= 50) return { label: 'Moderate', cls: 'moderate' };
    return { label: 'Weak', cls: 'weak' };
  }

  function score(p) {
    const parts = {
      demand: demandScore(p),
      trend: trendScore(p),
      competition: competitionScore(p),
      margin: marginScore(p),
      risk: riskScore(p)
    };
    let total = 0;
    for (const k of Object.keys(WEIGHTS)) total += WEIGHTS[k] * parts[k];
    total = Math.round(total * 100);
    return { parts, total, verdict: verdict(total) };
  }

  // Score every product once; call again after assumption changes.
  function scoreAll(products) {
    for (const p of products) {
      p.scoring = score(p);
      p.best = Fees.bestSource(p);
    }
    return [...products].sort((a, b) => b.scoring.total - a.scoring.total);
  }

  function trendPct(p) {
    const t = p.trend12 || [];
    if (t.length < 6) return 0;
    const first = mean(t.slice(0, 3));
    const last = mean(t.slice(-3));
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }

  function competitionLevel(p) {
    const c = p.scoring ? p.scoring.parts.competition : competitionScore(p);
    if (c >= 0.62) return { label: 'Low', cls: 'low' };
    if (c >= 0.4) return { label: 'Medium', cls: 'mid' };
    return { label: 'High', cls: 'high' };
  }

  window.Scoring = { WEIGHTS, FLAG_INFO, score, scoreAll, verdict, trendPct, competitionLevel };
})();
