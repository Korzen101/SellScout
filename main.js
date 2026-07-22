// SellScout — Electron main process
// Handles: window lifecycle, local settings store (with OS-encrypted secrets),
// live news fetching (RSS), Amazon SP-API + Keepa integrations, external links.

const { app, BrowserWindow, ipcMain, shell, safeStorage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const SMOKE = process.argv.includes('--smoke');

// ---------------------------------------------------------------------------
// Activity log: plain-text file in userData/logs, 1 MB rotation
// ---------------------------------------------------------------------------

const logDir = () => path.join(app.getPath('userData'), 'logs');
const logFile = () => path.join(logDir(), 'sellscout.log');

function appendLog(level, msg, data) {
  try {
    fs.mkdirSync(logDir(), { recursive: true });
    try {
      if (fs.existsSync(logFile()) && fs.statSync(logFile()).size > 1024 * 1024) {
        fs.renameSync(logFile(), logFile() + '.1');
      }
    } catch { /* rotation is best-effort */ }
    const line = '[' + new Date().toISOString() + '] [' + String(level).toUpperCase().padEnd(5) + '] ' +
      msg + (data ? ' | ' + JSON.stringify(data) : '') + '\n';
    fs.appendFileSync(logFile(), line, 'utf8');
  } catch { /* never let logging break the app */ }
}

function readLog(maxLines) {
  try {
    const text = fs.readFileSync(logFile(), 'utf8');
    return text.split('\n').filter(Boolean).slice(-(maxLines || 200));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Settings store: plain JSON for preferences, safeStorage-encrypted for secrets
// ---------------------------------------------------------------------------

const storeFile = () => path.join(app.getPath('userData'), 'sellscout-settings.json');

// Keys whose values are encrypted at rest with the OS keychain (DPAPI on Windows)
const SECRET_KEYS = new Set([
  'keepaApiKey',
  'rainforestApiKey',
  'spapi.lwaClientId',
  'spapi.lwaClientSecret',
  'spapi.refreshToken'
]);

let settingsCache = null;

function readSettings() {
  if (settingsCache) return settingsCache;
  try {
    settingsCache = JSON.parse(fs.readFileSync(storeFile(), 'utf8'));
  } catch {
    settingsCache = {};
  }
  return settingsCache;
}

function writeSettings(obj) {
  settingsCache = obj;
  try {
    fs.mkdirSync(path.dirname(storeFile()), { recursive: true });
    fs.writeFileSync(storeFile(), JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('[store] write failed:', err.message);
  }
}

function encryptValue(value) {
  if (!value) return '';
  if (safeStorage.isEncryptionAvailable()) {
    return 'enc:' + safeStorage.encryptString(String(value)).toString('base64');
  }
  return 'raw:' + Buffer.from(String(value), 'utf8').toString('base64');
}

function decryptValue(stored) {
  if (!stored) return '';
  try {
    if (stored.startsWith('enc:')) {
      return safeStorage.decryptString(Buffer.from(stored.slice(4), 'base64'));
    }
    if (stored.startsWith('raw:')) {
      return Buffer.from(stored.slice(4), 'base64').toString('utf8');
    }
    return stored; // legacy plain value
  } catch {
    return '';
  }
}

function storeGetAll() {
  const raw = readSettings();
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (SECRET_KEYS.has(k)) {
      const val = decryptValue(v);
      // Never ship the actual secret to the renderer wholesale — send a mask
      // plus a "set" flag. The renderer only needs to know whether it exists.
      out[k] = val ? { set: true, hint: val.slice(0, 4) + '••••' } : { set: false, hint: '' };
    } else {
      out[k] = v;
    }
  }
  return out;
}

function storeSet(key, value) {
  const raw = readSettings();
  if (SECRET_KEYS.has(key)) {
    if (value === '' || value == null) delete raw[key];
    else raw[key] = encryptValue(value);
  } else {
    raw[key] = value;
  }
  writeSettings(raw);
  return true;
}

function secret(key) {
  const raw = readSettings();
  return decryptValue(raw[key] || '');
}

// ---------------------------------------------------------------------------
// News: fetch + parse RSS feeds in the main process (no CORS restrictions)
// ---------------------------------------------------------------------------

const NEWS_FEEDS = [
  { source: 'Retail Dive',          url: 'https://www.retaildive.com/feeds/news/' },
  { source: 'Practical Ecommerce',  url: 'https://www.practicalecommerce.com/feed' },
  { source: 'TechCrunch Commerce',  url: 'https://techcrunch.com/category/commerce/feed/' },
  { source: 'Marketplace Pulse',    url: 'https://www.marketplacepulse.com/rss.xml' }
];

let newsCache = { at: 0, items: null };

function stripTags(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#0?39;|&apos;|&#8217;/g, "'").replace(/&quot;|&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&#8212;/g, '—').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRss(xml, source) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const block of blocks.slice(0, 12)) {
    const pick = (tag) => {
      const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
      return m ? stripTags(m[1]) : '';
    };
    const title = pick('title');
    if (!title) continue;
    items.push({
      title,
      link: pick('link'),
      date: pick('pubDate') || pick('dc:date'),
      summary: pick('description').slice(0, 220),
      source
    });
  }
  return items;
}

async function fetchNews() {
  const now = Date.now();
  if (newsCache.items && now - newsCache.at < 15 * 60 * 1000) return newsCache.items;

  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      try {
        const res = await fetch(feed.url, {
          signal: controller.signal,
          headers: { 'user-agent': 'SellScout/0.1 (desktop research app)' }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return parseRss(await res.text(), feed.source);
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const items = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .map((it) => ({ ...it, ts: Date.parse(it.date) || 0 }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 40);

  if (!items.length) return null; // renderer falls back to bundled headlines
  newsCache = { at: now, items };
  return items;
}

// ---------------------------------------------------------------------------
// Amazon SP-API (Selling Partner API) — works with user-supplied LWA credentials
// ---------------------------------------------------------------------------

const SPAPI_HOSTS = {
  na: 'https://sellingpartnerapi-na.amazon.com',
  eu: 'https://sellingpartnerapi-eu.amazon.com',
  fe: 'https://sellingpartnerapi-fe.amazon.com'
};

let lwaCache = { token: null, expires: 0 };

async function lwaAccessToken() {
  if (lwaCache.token && Date.now() < lwaCache.expires - 60000) return lwaCache.token;
  const clientId = secret('spapi.lwaClientId');
  const clientSecret = secret('spapi.lwaClientSecret');
  const refreshToken = secret('spapi.refreshToken');
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('SP-API credentials are not configured yet.');
  }
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Login with Amazon token refresh failed');
  }
  lwaCache = { token: data.access_token, expires: Date.now() + (data.expires_in || 3600) * 1000 };
  return lwaCache.token;
}

async function spapiGet(pathname, params = {}) {
  const region = readSettings()['spapi.region'] || 'na';
  const host = SPAPI_HOSTS[region] || SPAPI_HOSTS.na;
  const token = await lwaAccessToken();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(host + pathname + (qs ? '?' + qs : ''), {
    headers: { 'x-amz-access-token': token, 'content-type': 'application/json' }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.errors?.[0]?.message || 'SP-API request failed (HTTP ' + res.status + ')';
    throw new Error(msg);
  }
  return body;
}

async function spapiTest() {
  // Marketplace participations is the cheapest "are my credentials valid" call.
  const data = await spapiGet('/sellers/v1/marketplaceParticipations');
  const markets = (data.payload || [])
    .map((p) => p?.marketplace?.name)
    .filter(Boolean);
  return { ok: true, marketplaces: markets };
}

async function spapiOrders(days) {
  const after = new Date(Date.now() - (days || 30) * 86400000).toISOString();
  const marketplaceId = readSettings()['spapi.marketplaceId'] || 'ATVPDKIKX0DER'; // amazon.com
  const data = await spapiGet('/orders/v0/orders', {
    MarketplaceIds: marketplaceId,
    CreatedAfter: after,
    MaxResultsPerPage: '100'
  });
  return data.payload?.Orders || [];
}

// ---------------------------------------------------------------------------
// Keepa — optional live Amazon product data if the user adds an API key.
// Responses are cached on disk (Keepa bills per token).
// ---------------------------------------------------------------------------

const cacheDir = () => path.join(app.getPath('userData'), 'cache');

function cacheGet(key, ttlMs) {
  try {
    const f = path.join(cacheDir(), key + '.json');
    const stat = fs.statSync(f);
    if (Date.now() - stat.mtimeMs > ttlMs) return null;
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch { return null; }
}

function cacheSet(key, value) {
  try {
    fs.mkdirSync(cacheDir(), { recursive: true });
    fs.writeFileSync(path.join(cacheDir(), key + '.json'), JSON.stringify(value), 'utf8');
  } catch { /* cache is best-effort */ }
}

async function keepaFetch(pathname, params, cacheKey, ttlMs) {
  const key = secret('keepaApiKey');
  if (!key) throw new Error('Keepa API key is not configured — add one in Settings.');
  const cached = cacheKey ? cacheGet(cacheKey, ttlMs) : null;
  if (cached) return { ...cached, fromCache: true };
  const qs = new URLSearchParams({ key, domain: '1', ...params }).toString();
  const res = await fetch('https://api.keepa.com/' + pathname + '?' + qs);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Keepa request failed');
  if (cacheKey) cacheSet(cacheKey, data);
  return data;
}

async function keepaBestSellers(categoryId) {
  const data = await keepaFetch('bestsellers', { category: categoryId || '0' },
    'bestsellers-' + (categoryId || '0'), 12 * 3600 * 1000);
  return { asinList: (data.bestSellersList?.asinList || []).slice(0, 50), tokensLeft: data.tokensLeft };
}

// Keepa time = minutes since epoch offset by 21564000
const keepaTimeToMs = (kt) => (kt + 21564000) * 60000;

// Rough BSR → monthly-sales heuristic (used only when Keepa's own
// bought-past-month figure is unavailable)
function salesFromRank(rank) {
  if (!rank || rank <= 0) return 0;
  return Math.max(0, Math.round(268000 * Math.pow(rank, -0.85)));
}

// Map a Keepa category name onto our referral-fee schedule keys
function mapCategory(name) {
  const n = (name || '').toLowerCase();
  const table = [
    ['pet', 'Pet Supplies'], ['kitchen', 'Kitchen & Dining'], ['home', 'Home & Kitchen'],
    ['sport', 'Sports & Outdoors'], ['outdoor', 'Sports & Outdoors'], ['beauty', 'Beauty & Personal Care'],
    ['health', 'Health & Household'], ['office', 'Office Products'], ['toy', 'Toys & Games'],
    ['garden', 'Patio & Garden'], ['patio', 'Patio & Garden'], ['baby', 'Baby'],
    ['automotive', 'Automotive'], ['tool', 'Tools & Home Improvement'], ['electronic', 'Electronics'],
    ['clothing', 'Clothing & Accessories'], ['grocery', 'Grocery'], ['craft', 'Arts & Crafts']
  ];
  for (const [frag, cat] of table) if (n.includes(frag)) return cat;
  return 'Default';
}

function sizeTierFromGrams(g) {
  if (!g || g <= 0) return 'large-std-1';
  if (g <= 453) return 'small-std';
  if (g <= 907) return 'large-std-1';
  if (g <= 1814) return 'large-std-2';
  if (g <= 2722) return 'large-std-3';
  if (g <= 9072) return 'large-std-h';
  return 'large-bulky';
}

// 12 monthly demand-index points from Keepa's sales-rank history
function trendFromRankHistory(csv) {
  if (!Array.isArray(csv) || csv.length < 8) return Array(12).fill(100);
  const points = [];
  for (let i = 0; i + 1 < csv.length; i += 2) {
    if (csv[i + 1] > 0) points.push({ t: keepaTimeToMs(csv[i]), rank: csv[i + 1] });
  }
  if (points.length < 6) return Array(12).fill(100);
  const now = Date.now();
  const buckets = Array.from({ length: 12 }, () => []);
  for (const p of points) {
    const monthsAgo = Math.floor((now - p.t) / (30.44 * 86400000));
    if (monthsAgo >= 0 && monthsAgo < 12) buckets[11 - monthsAgo].push(p.rank);
  }
  const avgAll = points.reduce((s, p) => s + p.rank, 0) / points.length;
  let last = 100;
  return buckets.map((b) => {
    if (!b.length) return last;
    const avg = b.reduce((s, x) => s + x, 0) / b.length;
    // demand ∝ rank^-0.85, indexed to the year's average
    last = Math.round(100 * Math.pow(avgAll / avg, 0.85));
    return last;
  });
}

// Accepts a bare ASIN or any Amazon product URL
function extractAsin(raw) {
  const m = String(raw || '').trim().match(/(?:dp|gp\/product|asin)[\/=]?([A-Z0-9]{10})|^([A-Z0-9]{10})$/i);
  const asin = (m && (m[1] || m[2]) || '').toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(asin)) throw new Error('Enter a valid ASIN (10 characters) or an Amazon product URL.');
  return asin;
}

// Stable per-ASIN hue for the product tile
function asinHue(asin) {
  let hue = 0;
  for (const ch of asin) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  return hue;
}

async function keepaProduct(asinRaw) {
  const asin = extractAsin(asinRaw);

  const data = await keepaFetch('product', { asin, stats: '90', history: '1', rating: '1' },
    'product-' + asin, 6 * 3600 * 1000);
  const p = data.products && data.products[0];
  if (!p || !p.title) throw new Error('ASIN ' + asin + ' was not found on amazon.com.');

  const cur = (p.stats && p.stats.current) || [];
  const cents = (v) => (v != null && v > 0 ? v / 100 : null);
  const price = cents(cur[18]) || cents(cur[1]) || cents(cur[0]) || 0;
  const rank = cur[3] > 0 ? cur[3] : (p.salesRanks ? Object.values(p.salesRanks).map((a) => a[a.length - 1]).find((v) => v > 0) : 0);
  const monthlySold = p.monthlySold > 0 ? p.monthlySold : salesFromRank(rank);
  const reviews = cur[17] > 0 ? cur[17] : 0;
  const rating = cur[16] > 0 ? cur[16] / 10 : 0;
  const offers = cur[11] > 0 ? cur[11] : 1;
  const fbaFee = p.fbaFees && p.fbaFees.pickAndPackFee > 0 ? p.fbaFees.pickAndPackFee / 100 : null;
  const grams = p.packageWeight > 0 ? p.packageWeight : p.itemWeight;
  const rootCat = p.categoryTree && p.categoryTree[0] ? p.categoryTree[0].name : '';
  const amazonOn = cur[0] != null && cur[0] > 0;

  const hue = asinHue(asin);

  appendLog('info', 'ASIN analyzed via Keepa', { asin, tokensLeft: data.tokensLeft, cached: !!data.fromCache });

  return {
    ok: true,
    tokensLeft: data.tokensLeft,
    product: {
      id: 'live-' + asin,
      live: true,
      asin,
      name: p.title.length > 90 ? p.title.slice(0, 87) + '…' : p.title,
      category: mapCategory(rootCat),
      categoryRaw: rootCat,
      emoji: '🛒',
      hue,
      price,
      sizeTier: sizeTierFromGrams(grams),
      fbaFee,
      estMonthlySales: monthlySold,
      sellers: offers,
      reviewsTop10: reviews,     // this listing's own review count
      rating,
      amazonOnListing: amazonOn,
      trend12: trendFromRankHistory(p.csv && p.csv[3]),
      seasonal: null,
      flags: [],
      assumedCost: true,
      sources: [{
        marketplace: 'Assumed cost (25% of price)',
        unitCost: Math.round(price * 25) / 100,
        shipPerUnit: Math.round(price * 3) / 100,
        moq: 1, leadDays: 0, rating: 0
      }]
    }
  };
}

// ---------------------------------------------------------------------------
// FREE product data via the seller's own SP-API connection.
// Catalog Items gives title/category/sales-rank/dimensions; Product Pricing
// gives buy-box price and offer count. No paid subscription — but unlike
// Keepa there is no review or price/rank history, so trend and review-moat
// signals are unavailable (reported via `limited`).
// ---------------------------------------------------------------------------

function gramsFromWeight(w) {
  if (!w || !(w.value > 0)) return 0;
  const unit = String(w.unit || '').toLowerCase();
  if (unit.startsWith('pound') || unit === 'lb' || unit === 'lbs') return w.value * 453.6;
  if (unit.startsWith('ounce') || unit === 'oz') return w.value * 28.35;
  if (unit.startsWith('kilogram') || unit === 'kg') return w.value * 1000;
  if (unit.startsWith('gram') || unit === 'g') return w.value;
  return w.value * 453.6; // default to pounds, the common SP-API unit
}

async function spapiCatalogProduct(asinRaw) {
  const asin = extractAsin(asinRaw);
  const marketplaceId = readSettings()['spapi.marketplaceId'] || 'ATVPDKIKX0DER';

  const item = await spapiGet('/catalog/2022-04-01/items/' + asin, {
    marketplaceIds: marketplaceId,
    includedData: 'attributes,salesRanks,summaries,dimensions'
  });

  const pick = (arr) => (arr || []).find((x) => x.marketplaceId === marketplaceId) || (arr || [])[0] || null;
  const summary = pick(item.summaries) || {};
  const name = summary.itemName || ('ASIN ' + asin);
  const browse = (summary.browseClassification && summary.browseClassification.displayName) || '';

  // Sales rank → velocity estimate
  let rank = 0;
  const sr = pick(item.salesRanks);
  if (sr) {
    const entry = (sr.classificationRanks || [])[0] || (sr.displayGroupRanks || [])[0];
    if (entry && entry.rank > 0) rank = entry.rank;
  }

  // Package weight → FBA size tier
  const dim = pick(item.dimensions);
  const grams = gramsFromWeight(dim && dim.package && dim.package.weight);

  // Competitive pricing (best-effort — pricing scope may not be granted)
  let price = 0, offers = 1, pricingOk = true;
  try {
    const pricing = await spapiGet('/products/pricing/v0/items/' + asin + '/offers', {
      MarketplaceId: marketplaceId, ItemCondition: 'New'
    });
    const s = (pricing.payload && pricing.payload.Summary) || {};
    offers = s.TotalOfferCount ||
      ((s.NumberOfOffers || [])[0] && s.NumberOfOffers[0].OfferCount) || 1;
    const bb = (s.BuyBoxPrices || [])[0];
    const lp = (s.LowestPrices || [])[0];
    price = (bb && bb.LandedPrice && bb.LandedPrice.Amount) ||
            (lp && lp.LandedPrice && lp.LandedPrice.Amount) || 0;
  } catch (err) {
    pricingOk = false;
    appendLog('warn', 'SP-API pricing unavailable', { asin, error: err.message });
  }

  appendLog('info', 'ASIN analyzed via SP-API', { asin, rank, price, offers });

  return {
    ok: true,
    source: 'spapi',
    limited: true,
    pricingOk,
    product: {
      id: 'live-' + asin,
      live: true,
      dataSource: 'SP-API',
      asin,
      name: name.length > 90 ? name.slice(0, 87) + '…' : name,
      category: mapCategory(browse),
      categoryRaw: browse,
      emoji: '🛒',
      hue: asinHue(asin),
      price,
      sizeTier: sizeTierFromGrams(grams),
      fbaFee: null,
      estMonthlySales: salesFromRank(rank),
      sellers: offers,
      reviewsTop10: null,       // not exposed by SP-API → scored as neutral
      rating: null,             // not exposed by SP-API
      amazonOnListing: false,   // not reliably derivable
      trend12: Array(12).fill(100), // no history via SP-API → neutral trend
      seasonal: null,
      flags: [],
      assumedCost: true,
      sources: [{
        marketplace: 'Assumed cost (25% of price)',
        unitCost: Math.round(price * 25) / 100,
        shipPerUnit: Math.round(price * 3) / 100,
        moq: 1, leadDays: 0, rating: 0
      }]
    }
  };
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1120,
    minHeight: 700,
    backgroundColor: '#f5f5f7',
    title: 'SellScout',
    icon: path.join(__dirname, 'assets', 'sellscout.ico'),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#f7f7f9', symbolColor: '#1d1d1f', height: 44 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Open target=_blank / external navigation in the system browser, never in-app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (SMOKE) {
    let failed = false;
    win.webContents.on('console-message', (_e, level, message) => {
      if (level >= 3) {
        failed = true;
        console.error('[smoke] renderer error:', message);
      }
    });
    win.webContents.once('did-finish-load', () => {
      // Give the renderer a beat to run page scripts, then report.
      setTimeout(() => {
        console.log(failed ? '[smoke] FAIL' : '[smoke] renderer loaded OK');
        app.exit(failed ? 1 : 0);
      }, 2500);
    });
  }
}

// ---------------------------------------------------------------------------
// IPC surface
// ---------------------------------------------------------------------------

ipcMain.handle('store:getAll', () => storeGetAll());
ipcMain.handle('store:set', (_e, key, value) => storeSet(key, value));

ipcMain.handle('news:fetch', async () => {
  try {
    return { ok: true, items: await fetchNews() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('spapi:test', async () => {
  try { return { ok: true, ...(await spapiTest()) }; }
  catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('spapi:orders', async (_e, days) => {
  try { return { ok: true, orders: await spapiOrders(days) }; }
  catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('keepa:bestsellers', async (_e, categoryId) => {
  try { return { ok: true, ...(await keepaBestSellers(categoryId)) }; }
  catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('keepa:product', async (_e, asin) => {
  try { return await keepaProduct(asin); }
  catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('spapi:product', async (_e, asin) => {
  try { return await spapiCatalogProduct(asin); }
  catch (err) { return { ok: false, error: err.message }; }
});

// True when SP-API credentials are configured (enables the free data path)
ipcMain.handle('spapi:configured', () => Boolean(
  secret('spapi.lwaClientId') && secret('spapi.lwaClientSecret') && secret('spapi.refreshToken')
));

ipcMain.handle('file:save', async (_e, suggestedName, content, extLabel, ext) => {
  try {
    const res = await dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('documents'), suggestedName || 'export.txt'),
      filters: [{ name: extLabel || 'File', extensions: [ext || 'txt'] }]
    });
    if (res.canceled || !res.filePath) return { ok: false, canceled: true };
    fs.writeFileSync(res.filePath, content, 'utf8');
    return { ok: true, path: res.filePath };
  } catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('file:openText', async (_e, extLabel, exts) => {
  try {
    const res = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: extLabel || 'Text', extensions: exts || ['csv', 'txt'] }]
    });
    if (res.canceled || !res.filePaths.length) return { ok: false, canceled: true };
    const file = res.filePaths[0];
    const stat = fs.statSync(file);
    if (stat.size > 30 * 1024 * 1024) return { ok: false, error: 'File is larger than 30 MB.' };
    return { ok: true, name: path.basename(file), content: fs.readFileSync(file, 'utf8') };
  } catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('shell:openExternal', (_e, url) => {
  if (typeof url === 'string' && /^https:\/\//i.test(url)) shell.openExternal(url);
});

ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('update:install', () => {
  try {
    require('electron-updater').autoUpdater.quitAndInstall();
  } catch (e) {
    appendLog('error', 'quitAndInstall failed', { error: e.message });
  }
});

ipcMain.handle('log:write', (_e, level, msg, data) => appendLog(level, msg, data));
ipcMain.handle('log:read', (_e, maxLines) => ({ ok: true, lines: readLog(maxLines) }));
ipcMain.handle('log:clear', () => {
  try { fs.rmSync(logFile(), { force: true }); fs.rmSync(logFile() + '.1', { force: true }); } catch {}
  appendLog('info', 'Log cleared by user');
  return { ok: true };
});
ipcMain.handle('log:openFolder', () => {
  try { fs.mkdirSync(logDir(), { recursive: true }); shell.openPath(logDir()); } catch {}
});

ipcMain.handle('export:csv', async (_e, suggestedName, content) => {
  try {
    const res = await dialog.showSaveDialog(win, {
      title: 'Export CSV',
      defaultPath: path.join(app.getPath('documents'), suggestedName || 'sellscout-export.csv'),
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (res.canceled || !res.filePath) return { ok: false, canceled: true };
    fs.writeFileSync(res.filePath, '﻿' + content, 'utf8'); // BOM so Excel reads UTF-8
    appendLog('info', 'CSV exported', { path: res.filePath });
    return { ok: true, path: res.filePath };
  } catch (err) {
    appendLog('error', 'CSV export failed', { error: err.message });
    return { ok: false, error: err.message };
  }
});

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Auto-update (packaged builds only) + background news refresh
// ---------------------------------------------------------------------------

function initUpdater() {
  if (!app.isPackaged) return;
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.logger = {
      info: (m) => appendLog('info', 'updater: ' + m),
      warn: (m) => appendLog('warn', 'updater: ' + m),
      error: (m) => appendLog('error', 'updater: ' + m),
      debug: () => {}
    };
    autoUpdater.on('update-downloaded', (info) => {
      appendLog('info', 'Update downloaded — ready to install', { version: info.version });
      if (win && !win.isDestroyed()) win.webContents.send('update:ready', info.version);
    });
    autoUpdater.checkForUpdatesAndNotify()
      .catch((e) => appendLog('warn', 'Update check failed', { error: e.message }));
  } catch (e) {
    appendLog('warn', 'Updater unavailable', { error: e.message });
  }
}

function startNewsLoop() {
  if (SMOKE) return;
  setInterval(async () => {
    try {
      newsCache = { at: 0, items: null }; // force refetch past the cache
      const items = await fetchNews();
      if (items && win && !win.isDestroyed()) {
        win.webContents.send('news:update', items);
        appendLog('info', 'Background news refresh', { stories: items.length });
      }
    } catch { /* offline is fine */ }
  }, 30 * 60 * 1000);
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.korzen.sellscout'); // Windows toast identity
  appendLog('info', 'App started', { version: app.getVersion() });
  createWindow();
  initUpdater();
  startNewsLoop();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
