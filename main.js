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
// Keepa — optional live Amazon product data if the user adds an API key
// ---------------------------------------------------------------------------

async function keepaBestSellers(categoryId) {
  const key = secret('keepaApiKey');
  if (!key) throw new Error('Keepa API key is not configured.');
  const url = 'https://api.keepa.com/bestsellers?key=' + encodeURIComponent(key) +
    '&domain=1&category=' + encodeURIComponent(categoryId || '0');
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Keepa request failed');
  return { asinList: (data.bestSellersList?.asinList || []).slice(0, 50), tokensLeft: data.tokensLeft };
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

ipcMain.handle('shell:openExternal', (_e, url) => {
  if (typeof url === 'string' && /^https:\/\//i.test(url)) shell.openExternal(url);
});

ipcMain.handle('app:version', () => app.getVersion());

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

app.whenReady().then(() => {
  appendLog('info', 'App started', { version: app.getVersion() });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
