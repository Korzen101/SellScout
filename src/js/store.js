// Settings store (global: Store). Uses the Electron bridge when available,
// falls back to localStorage so the UI also runs in a plain browser preview.
(function () {
  'use strict';

  const DEFAULTS = {
    dataMode: 'demo',            // 'demo' | 'live'
    currency: 'USD',
    userName: 'Chris',
    onboarded: false,
    marketplace: 'US',
    'spapi.region': 'na',
    'spapi.marketplaceId': 'ATVPDKIKX0DER',
    'spapi.sellerId': '',
    // Economics assumptions (editable in Settings, used everywhere)
    adsPctOfPrice: 8,            // advertising spend as % of sale price (TACoS)
    returnRatePct: 2,            // % of units returned
    storageMonths: 1.5,          // avg months a unit sits in FBA storage
    dutyPct: 0,                  // import duty % applied to unit cost
    watchlist: []
  };

  // Keys restored by "Reset to defaults" (secrets, watchlist and onboarding
  // status are deliberately preserved).
  const RESETTABLE = ['dataMode', 'currency', 'adsPctOfPrice', 'returnRatePct', 'storageMonths', 'dutyPct', 'marketplace'];

  const hasBridge = typeof window.sellscout !== 'undefined';
  let cache = { ...DEFAULTS };
  const listeners = new Set();

  async function init() {
    if (hasBridge) {
      try {
        const saved = await window.sellscout.store.getAll();
        cache = { ...DEFAULTS, ...saved };
      } catch (e) { /* keep defaults */ }
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('sellscout-settings') || '{}');
        cache = { ...DEFAULTS, ...saved };
      } catch (e) { /* keep defaults */ }
    }
    return cache;
  }

  function get(key) {
    return cache[key];
  }

  function all() { return cache; }

  function set(key, value) {
    cache[key] = value;
    if (hasBridge) {
      window.sellscout.store.set(key, value);
    } else {
      // Never persist secrets in the browser-preview fallback
      const copy = { ...cache };
      delete copy.keepaApiKey; delete copy.rainforestApiKey;
      delete copy['spapi.lwaClientId']; delete copy['spapi.lwaClientSecret']; delete copy['spapi.refreshToken'];
      localStorage.setItem('sellscout-settings', JSON.stringify(copy));
    }
    listeners.forEach((fn) => fn(key, value));
  }

  // Secrets: value objects from the bridge look like { set: true, hint: 'abcd••••' }
  function secretState(key) {
    const v = cache[key];
    if (v && typeof v === 'object' && 'set' in v) return v;
    return { set: !!v, hint: v ? String(v).slice(0, 4) + '••••' : '' };
  }

  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function toggleWatch(id) {
    const list = Array.isArray(cache.watchlist) ? [...cache.watchlist] : [];
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    set('watchlist', list);
    return i < 0; // true if now watched
  }

  function isWatched(id) {
    return Array.isArray(cache.watchlist) && cache.watchlist.includes(id);
  }

  function resetDefaults() {
    for (const k of RESETTABLE) set(k, DEFAULTS[k]);
    return RESETTABLE.length;
  }

  window.Store = { init, get, set, all, secretState, onChange, toggleWatch, isWatched, resetDefaults, hasBridge, DEFAULTS };
})();
