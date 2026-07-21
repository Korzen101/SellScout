// Lightweight SVG chart kit (global: Charts).
// Design rules: thin marks, 2px lines, recessive hairline grid, direct labels,
// tooltips on hover. Series colors come from the validated palette.
(function () {
  'use strict';

  const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
  const INK3 = '#86868b';
  const GRID = 'rgba(0,0,0,0.06)';
  const BASE = 'rgba(0,0,0,0.14)';

  let uid = 0;

  const min = (a) => Math.min(...a);
  const max = (a) => Math.max(...a);

  function niceCeil(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * p;
  }

  // Smooth path through points (Catmull-Rom → cubic Bézier)
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }

  // ------------------------------------------------------------------
  // Sparkline — tiny inline trend, no axes
  // ------------------------------------------------------------------
  function sparkline(values, opts) {
    const o = Object.assign({ w: 96, h: 30, color: SERIES[0] }, opts);
    if (!values || values.length < 2) return '';
    const lo = min(values), hi = max(values), span = hi - lo || 1;
    const pad = 3;
    const pts = values.map((v, i) => [
      pad + (i / (values.length - 1)) * (o.w - pad * 2),
      pad + (1 - (v - lo) / span) * (o.h - pad * 2)
    ]);
    const end = pts[pts.length - 1];
    return `<svg width="${o.w}" height="${o.h}" viewBox="0 0 ${o.w} ${o.h}" aria-hidden="true">
      <path d="${smoothPath(pts)}" fill="none" stroke="${o.color}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="${end[0]}" cy="${end[1]}" r="2.4" fill="${o.color}"/>
    </svg>`;
  }

  // ------------------------------------------------------------------
  // Area / line chart with grid, ticks and hover crosshair
  // ------------------------------------------------------------------
  function areaChart(values, opts) {
    const o = Object.assign({
      w: 560, h: 200, color: SERIES[0], labels: null, fill: true,
      fmt: 'num', yMin: null, unit: ''
    }, opts);
    if (!values || values.length < 2) return '<div class="empty">No data</div>';

    const id = 'ch' + (++uid);
    const padL = 42, padR = 12, padT = 12, padB = 22;
    const iw = o.w - padL - padR, ih = o.h - padT - padB;

    const lo = o.yMin != null ? o.yMin : Math.min(0, min(values));
    const hi = niceCeil(max(values) * 1.06) || 1;
    const span = hi - lo || 1;

    const X = (i) => padL + (i / (values.length - 1)) * iw;
    const Y = (v) => padT + (1 - (v - lo) / span) * ih;

    const pts = values.map((v, i) => [X(i), Y(v)]);
    const line = smoothPath(pts);
    const area = `${line} L${(padL + iw).toFixed(1)},${(padT + ih).toFixed(1)} L${padL},${(padT + ih).toFixed(1)} Z`;

    // grid: 3 inner lines + baseline
    let grid = '';
    const fmtV = fmtFn(o.fmt);
    for (let g = 0; g <= 3; g++) {
      const gv = lo + (span * g) / 3;
      const gy = Y(gv);
      grid += `<line x1="${padL}" y1="${gy}" x2="${padL + iw}" y2="${gy}" stroke="${g === 0 ? BASE : GRID}" stroke-width="1"/>` +
        `<text x="${padL - 8}" y="${gy + 3.5}" text-anchor="end" font-size="10.5" fill="${INK3}">${fmtV(gv)}</text>`;
    }

    // x labels: first, middle, last (or every nth month)
    let xlabels = '';
    if (o.labels && o.labels.length === values.length) {
      const idxs = values.length <= 7
        ? values.map((_, i) => i)
        : [0, Math.floor(values.length / 4), Math.floor(values.length / 2), Math.floor(values.length * 3 / 4), values.length - 1];
      for (const i of idxs) {
        const anchor = i === 0 ? 'start' : i === values.length - 1 ? 'end' : 'middle';
        xlabels += `<text x="${X(i)}" y="${o.h - 6}" text-anchor="${anchor}" font-size="10.5" fill="${INK3}">${Fmt.esc(o.labels[i])}</text>`;
      }
    }

    const fillEl = o.fill
      ? `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0" stop-color="${o.color}" stop-opacity="0.16"/>
           <stop offset="1" stop-color="${o.color}" stop-opacity="0"/>
         </linearGradient></defs>
         <path d="${area}" fill="url(#${id}g)"/>`
      : '';

    return `<svg class="chart-line" data-chart="line" data-values="${values.join(',')}"
        data-labels="${Fmt.esc((o.labels || []).join('|'))}" data-fmt="${o.fmt}" data-color="${o.color}"
        data-padl="${padL}" data-padr="${padR}" data-padt="${padT}" data-padb="${padB}" data-lo="${lo}" data-hi="${hi}"
        width="100%" viewBox="0 0 ${o.w} ${o.h}" preserveAspectRatio="none" style="aspect-ratio:${o.w}/${o.h};display:block">
      ${grid}${fillEl}
      <path d="${line}" fill="none" stroke="${o.color}" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      ${xlabels}
      <line class="ch-cross" x1="0" y1="${padT}" x2="0" y2="${padT + ih}" stroke="rgba(0,0,0,0.28)" stroke-width="1" stroke-dasharray="2 3" visibility="hidden"/>
      <circle class="ch-dot" r="3.4" fill="${o.color}" stroke="#fff" stroke-width="1.6" visibility="hidden"/>
    </svg>`;
  }

  // ------------------------------------------------------------------
  // Multi-line chart (≤3 series) with direct end labels
  // ------------------------------------------------------------------
  function multiLine(seriesArr, opts) {
    const o = Object.assign({ w: 560, h: 210, labels: null, fmt: 'num' }, opts);
    const all = seriesArr.flatMap((s) => s.values);
    if (!all.length) return '<div class="empty">No data</div>';

    const padL = 40, padR = 60, padT = 12, padB = 22;
    const iw = o.w - padL - padR, ih = o.h - padT - padB;
    const lo = Math.min(...all) * 0.96;
    const hi = niceCeil(Math.max(...all) * 1.04);
    const span = hi - lo || 1;
    const n = seriesArr[0].values.length;

    const X = (i) => padL + (i / (n - 1)) * iw;
    const Y = (v) => padT + (1 - (v - lo) / span) * ih;

    let grid = '';
    const fmtV = fmtFn(o.fmt);
    for (let g = 0; g <= 3; g++) {
      const gv = lo + (span * g) / 3, gy = Y(gv);
      grid += `<line x1="${padL}" y1="${gy}" x2="${padL + iw}" y2="${gy}" stroke="${g === 0 ? BASE : GRID}" stroke-width="1"/>` +
        `<text x="${padL - 8}" y="${gy + 3.5}" text-anchor="end" font-size="10.5" fill="${INK3}">${fmtV(gv)}</text>`;
    }

    let paths = '', endLabels = '';
    seriesArr.forEach((s, si) => {
      const color = s.color || SERIES[si % SERIES.length];
      const pts = s.values.map((v, i) => [X(i), Y(v)]);
      paths += `<path d="${smoothPath(pts)}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
      const end = pts[pts.length - 1];
      endLabels += `<circle cx="${end[0]}" cy="${end[1]}" r="2.6" fill="${color}"/>
        <text x="${end[0] + 7}" y="${end[1] + 3.5}" font-size="10.5" font-weight="600" fill="#52514e">${Fmt.esc(s.name)}</text>`;
    });

    let xlabels = '';
    if (o.labels && o.labels.length === n) {
      const idxs = [0, Math.floor(n / 2), n - 1];
      for (const i of idxs) {
        const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
        xlabels += `<text x="${X(i)}" y="${o.h - 6}" text-anchor="${anchor}" font-size="10.5" fill="${INK3}">${Fmt.esc(o.labels[i])}</text>`;
      }
    }

    return `<svg width="100%" viewBox="0 0 ${o.w} ${o.h}" style="aspect-ratio:${o.w}/${o.h};display:block">${grid}${paths}${endLabels}${xlabels}</svg>`;
  }

  // ------------------------------------------------------------------
  // Donut with 2px gaps + center stat
  // ------------------------------------------------------------------
  function donut(segments, opts) {
    const o = Object.assign({ size: 168, thickness: 20, centerTitle: '', centerValue: '' }, opts);
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    const r = (o.size - o.thickness) / 2;
    const c = o.size / 2;
    const circ = 2 * Math.PI * r;
    const gap = 2.5;

    let off = -Math.PI / 2 * r; // start at 12 o'clock, in arc-length units
    let arcs = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const len = (seg.value / total) * circ;
      const dash = Math.max(0.1, len - gap);
      arcs += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${seg.color || SERIES[i % SERIES.length]}"
        stroke-width="${o.thickness}" stroke-dasharray="${dash.toFixed(1)} ${(circ - dash).toFixed(1)}"
        stroke-dashoffset="${(-off).toFixed(1)}" stroke-linecap="butt"/>`;
      off += len;
    }

    return `<svg width="${o.size}" height="${o.size}" viewBox="0 0 ${o.size} ${o.size}">
      ${arcs}
      <text x="${c}" y="${c - 3}" text-anchor="middle" font-size="19" font-weight="700" fill="#1d1d1f">${Fmt.esc(o.centerValue)}</text>
      <text x="${c}" y="${c + 14}" text-anchor="middle" font-size="10.5" fill="${INK3}">${Fmt.esc(o.centerTitle)}</text>
    </svg>`;
  }

  // ------------------------------------------------------------------
  // Score ring (radial meter, status-colored)
  // ------------------------------------------------------------------
  function ringColor(score) {
    if (score >= 78) return '#0ca30c';
    if (score >= 65) return '#2a78d6';
    if (score >= 50) return '#eda100';
    return '#d03b3b';
  }

  function scoreRing(score, opts) {
    const o = Object.assign({ size: 52, thickness: 5, showLabel: false }, opts);
    const r = (o.size - o.thickness) / 2;
    const c = o.size / 2;
    const circ = 2 * Math.PI * r;
    const on = (Math.max(0, Math.min(100, score)) / 100) * circ;
    const color = ringColor(score);
    const fs = Math.round(o.size * 0.31);
    return `<span class="ring-wrap" style="width:${o.size}px;height:${o.size}px">
      <svg width="${o.size}" height="${o.size}" viewBox="0 0 ${o.size} ${o.size}" style="transform:rotate(-90deg)">
        <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="${o.thickness}"/>
        <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${o.thickness}"
          stroke-dasharray="${on.toFixed(1)} ${circ.toFixed(1)}" stroke-linecap="round"/>
      </svg>
      <span class="ring-num" style="font-size:${fs}px">${Math.round(score)}</span>
    </span>`;
  }

  // ------------------------------------------------------------------
  // Horizontal stacked bar (price decomposition) with 2px gaps
  // ------------------------------------------------------------------
  function stackBar(segments) {
    const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
    let html = '<div class="stackbar">';
    for (const seg of segments) {
      const w = (Math.max(0, seg.value) / total) * 100;
      if (w < 0.5) continue;
      html += `<i style="width:${w.toFixed(2)}%;background:${seg.color}" title="${Fmt.esc(seg.label)}: ${Fmt.money(seg.value)}"></i>`;
    }
    return html + '</div>';
  }

  // ------------------------------------------------------------------
  // Horizontal bars (label / track / value)
  // ------------------------------------------------------------------
  function barsH(items, opts) {
    const o = Object.assign({ max: null, fmt: (v) => String(Math.round(v)) }, opts);
    const m = o.max != null ? o.max : Math.max(...items.map((x) => x.value)) || 1;
    let html = '';
    for (const it of items) {
      const w = Math.max(2, (it.value / m) * 100);
      html += `<div class="sbar">
        <span class="sbar-label">${Fmt.esc(it.label)}</span>
        <span class="sbar-track"><span class="sbar-fill" style="width:${w.toFixed(1)}%;background:${it.color || SERIES[0]}"></span></span>
        <span class="sbar-val num">${o.fmt(it.value)}</span>
      </div>`;
    }
    return html;
  }

  // ------------------------------------------------------------------
  // Hover layer for areaChart: crosshair + tooltip
  // ------------------------------------------------------------------
  function fmtFn(kind) {
    if (kind === 'money') return (v) => Fmt.money(v, 0);
    if (kind === 'money2') return (v) => Fmt.money(v);
    if (kind === 'pct') return (v) => Math.round(v) + '%';
    return (v) => Fmt.compact(v);
  }

  function activate(root) {
    const tip = document.getElementById('chart-tip');
    root.querySelectorAll('svg[data-chart="line"]').forEach((svg) => {
      if (svg._wired) return;
      svg._wired = true;
      const values = svg.dataset.values.split(',').map(Number);
      const labels = svg.dataset.labels ? svg.dataset.labels.split('|') : [];
      const fmt = fmtFn(svg.dataset.fmt);
      const padL = +svg.dataset.padl, padR = +svg.dataset.padr;
      const padT = +svg.dataset.padt, padB = +svg.dataset.padb;
      const lo = +svg.dataset.lo, hi = +svg.dataset.hi;
      const vb = svg.viewBox.baseVal;
      const cross = svg.querySelector('.ch-cross');
      const dot = svg.querySelector('.ch-dot');

      svg.addEventListener('mousemove', (e) => {
        const rect = svg.getBoundingClientRect();
        const sx = ((e.clientX - rect.left) / rect.width) * vb.width;
        const iw = vb.width - padL - padR;
        const frac = Math.max(0, Math.min(1, (sx - padL) / iw));
        const i = Math.round(frac * (values.length - 1));
        const vx = padL + (i / (values.length - 1)) * iw;
        const ih = vb.height - padT - padB;
        const vy = padT + (1 - (values[i] - lo) / (hi - lo || 1)) * ih;

        cross.setAttribute('x1', vx); cross.setAttribute('x2', vx);
        cross.setAttribute('visibility', 'visible');
        dot.setAttribute('cx', vx); dot.setAttribute('cy', vy);
        dot.setAttribute('visibility', 'visible');

        tip.innerHTML = (labels[i] ? `<span class="tip-label">${Fmt.esc(labels[i])}</span><br>` : '') +
          `<b>${fmt(values[i])}</b>`;
        tip.hidden = false;
        const tw = tip.offsetWidth;
        let left = e.clientX + 14;
        if (left + tw > window.innerWidth - 12) left = e.clientX - tw - 14;
        tip.style.left = left + 'px';
        tip.style.top = (e.clientY - 12) + 'px';
      });
      svg.addEventListener('mouseleave', () => {
        cross.setAttribute('visibility', 'hidden');
        dot.setAttribute('visibility', 'hidden');
        tip.hidden = true;
      });
    });
  }

  window.Charts = { SERIES, sparkline, areaChart, multiLine, donut, scoreRing, stackBar, barsH, activate, ringColor };
})();
