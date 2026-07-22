// Inline SVG icon set (global: Icons) — 24×24 viewBox, 1.7px stroke, round joins.
(function () {
  'use strict';

  function I(paths, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"' +
      (extra || '') + '>' + paths + '</svg>';
  }

  window.Icons = {
    logo: I('<path d="M2.5 19L7 9.5l2.4 4.6L12 4l2.6 9.9L17 9.2 21.5 19z" stroke-linejoin="round"/>'),
    dashboard: I('<rect x="3.5" y="3.5" width="7.4" height="7.4" rx="2"/><rect x="13.1" y="3.5" width="7.4" height="7.4" rx="2"/><rect x="3.5" y="13.1" width="7.4" height="7.4" rx="2"/><rect x="13.1" y="13.1" width="7.4" height="7.4" rx="2"/>'),
    finder: I('<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5l-4.9-4.9"/>'),
    sourcing: I('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.2 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.2-3.9-8.5s1.3-6.2 3.9-8.5z"/>'),
    trends: I('<path d="M3.5 17.5l5-5.5 3.5 3 6-7"/><path d="M14.5 7.5H18v3.5"/><path d="M3.5 21h17"/>'),
    calculator: I('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01"/>'),
    business: I('<rect x="3.5" y="7.5" width="17" height="12.5" rx="2.5"/><path d="M8.5 7.5V6a2.5 2.5 0 012.5-2.5h2A2.5 2.5 0 0115.5 6v1.5M3.5 12.5h17"/>'),
    settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.7l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.7-.3 1.6 1.6 0 00-1 1.5v.2a2 2 0 11-4 0v-.2a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.7.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.7 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.2a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.7.3h.1a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.2a1.6 1.6 0 001 1.5h.1a1.6 1.6 0 001.7-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.7v.1a1.6 1.6 0 001.5 1h.2a2 2 0 110 4h-.2a1.6 1.6 0 00-1.5 1z"/>'),
    search: I('<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5l-4.9-4.9"/>'),
    refresh: I('<path d="M20 12a8 8 0 11-2.3-5.6"/><path d="M20 3.5V7h-3.5"/>'),
    external: I('<path d="M13.5 5.5H18.5V10.5"/><path d="M18.5 5.5l-8 8"/><path d="M18.5 14v4a2.5 2.5 0 01-2.5 2.5H6A2.5 2.5 0 013.5 18V8A2.5 2.5 0 016 5.5h4"/>'),
    close: I('<path d="M5 5l14 14M19 5L5 19"/>'),
    chevR: I('<path d="M9 5.5l6.5 6.5L9 18.5"/>'),
    up: I('<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/>'),
    down: I('<path d="M12 5v14M5.5 12.5L12 19l6.5-6.5"/>'),
    alert: I('<path d="M12 3.8L2.7 19.5a1.5 1.5 0 001.3 2.2h16a1.5 1.5 0 001.3-2.2L12 3.8z"/><path d="M12 9.5v4.5M12 17.6h.01"/>'),
    info: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.6h.01"/>'),
    check: I('<path d="M4.5 12.5l5 5 10-11"/>'),
    star: I('<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6z"/>'),
    box: I('<path d="M3.5 7.5L12 3.5l8.5 4v9l-8.5 4-8.5-4v-9z"/><path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9"/>'),
    truck: I('<path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.5V16.5h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>'),
    tag: I('<path d="M3.5 11V4.5A1 1 0 014.5 3.5H11l9 9-6.5 6.5-9-9z" transform="translate(0 .5)"/><path d="M7.7 8.2h.01"/>'),
    spark: I('<path d="M13 2.5L4.5 13.5h6l-1.5 8L17.5 10.5h-6l1.5-8z"/>'),
    news: I('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7.5 9h9M7.5 12.5h9M7.5 16h5.5"/>'),
    wallet: I('<rect x="3.5" y="6" width="17" height="13" rx="2.5"/><path d="M3.5 9.5h17"/><path d="M15.5 14.5h2"/>'),
    cart: I('<circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/><path d="M3 4.5h2.2l2.4 11h10.2l2.3-8H6.2"/>'),
    shield: I('<path d="M12 3.5l7.5 2.8v5.2c0 4.5-3 7.7-7.5 9-4.5-1.3-7.5-4.5-7.5-9V6.3L12 3.5z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>'),
    clock: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    plug: I('<path d="M9 7V3.5M15 7V3.5M7 7h10v4a5 5 0 01-10 0V7z"/><path d="M12 16v4.5"/>'),
    flag: I('<path d="M5.5 21V4"/><path d="M5.5 4.5c4-2.4 8 2.4 12.5 0v9c-4.5 2.4-8.5-2.4-12.5 0"/>'),
    calc2: I('<path d="M7 8h10M9.5 12.5v5M7 15h5M14.5 13.5l3 3M17.5 13.5l-3 3"/>'),
    doc: I('<path d="M6.5 3.5h7l4.5 4.5v12a1 1 0 01-1 1h-10.5a1 1 0 01-1-1v-15.5a1 1 0 011-1z"/><path d="M13.5 3.5V8H18"/>'),
    dollar: I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.4 5.8 4.3 0 1.2-1.3 2.1-3 2.1-1.3 0-2.5-.6-3-1.5"/>'),
    export: I('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 19.5h15"/>'),
    reset: I('<path d="M4 12a8 8 0 102.3-5.6"/><path d="M4 3.5V7h3.5"/>')
  };
})();
