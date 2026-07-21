// Formatting helpers (global: Fmt)
(function () {
  'use strict';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Display currencies. Internal math is always USD; `rate` converts for
  // display only (approximate fixed rates, noted in Settings).
  const CURRENCIES = {
    USD: { sym: '$',  rate: 1,    label: 'US Dollar ($)' },
    EUR: { sym: '€',  rate: 0.92, label: 'Euro (€)' },
    GBP: { sym: '£',  rate: 0.79, label: 'British Pound (£)' },
    CAD: { sym: 'C$', rate: 1.36, label: 'Canadian Dollar (C$)' },
    AUD: { sym: 'A$', rate: 1.51, label: 'Australian Dollar (A$)' }
  };
  let cur = CURRENCIES.USD;
  let curCode = 'USD';

  function setCurrency(code) {
    if (CURRENCIES[code]) { cur = CURRENCIES[code]; curCode = code; }
  }
  const currency = () => curCode;
  const rate = () => cur.rate;
  const sym = () => cur.sym;

  function money(n, dp) {
    if (n == null || isNaN(n)) return '—';
    const v = n * cur.rate;
    const d = dp != null ? dp : (Math.abs(v) >= 100 ? 0 : 2);
    const sign = v < 0 ? '-' : '';
    return sign + cur.sym + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function compact(n) {
    if (n == null || isNaN(n)) return '—';
    const abs = Math.abs(n);
    if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(Math.round(n));
  }

  function pct(n, dp) {
    if (n == null || isNaN(n)) return '—';
    return n.toFixed(dp != null ? dp : 0) + '%';
  }

  function signPct(n, dp) {
    if (n == null || isNaN(n)) return '—';
    return (n > 0 ? '+' : '') + n.toFixed(dp != null ? dp : 0) + '%';
  }

  function num(n) {
    if (n == null || isNaN(n)) return '—';
    return Math.round(n).toLocaleString('en-US');
  }

  function timeAgo(ts) {
    if (!ts) return '';
    const s = Math.max(1, (Date.now() - ts) / 1000);
    if (s < 3600) return Math.max(1, Math.floor(s / 60)) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 86400 * 14) return Math.floor(s / 86400) + 'd ago';
    const d = new Date(ts);
    return MONTHS[d.getMonth()] + ' ' + d.getDate();
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Last 12 month labels ending with the current month
  function last12Labels() {
    const out = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(MONTHS[d.getMonth()]);
    }
    return out;
  }

  function lastNDayLabels(n) {
    const out = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      out.push(MONTHS[d.getMonth()] + ' ' + d.getDate());
    }
    return out;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Working late';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function longDate() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  window.Fmt = { money, compact, pct, signPct, num, timeAgo, esc, last12Labels, lastNDayLabels, greeting, longDate,
    MONTHS, CURRENCIES, setCurrency, currency, rate, sym };
})();
