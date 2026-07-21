// Activity logging (global: Log). Writes through the Electron bridge to a file
// on disk; keeps an in-memory buffer as fallback for the browser preview.
// Never log secret values — callers pass metadata only.
(function () {
  'use strict';

  const buf = [];

  function stamp(level, msg, data) {
    return '[' + new Date().toISOString() + '] [' + level.toUpperCase().padEnd(5) + '] ' + msg +
      (data ? ' | ' + JSON.stringify(data) : '');
  }

  function write(level, msg, data) {
    buf.push(stamp(level, msg, data));
    if (buf.length > 300) buf.shift();
    if (window.sellscout && window.sellscout.log) {
      window.sellscout.log.write(level, msg, data == null ? null : data).catch(() => {});
    }
  }

  const info = (msg, data) => write('info', msg, data);
  const warn = (msg, data) => write('warn', msg, data);
  const error = (msg, data) => write('error', msg, data);

  async function recent(maxLines) {
    if (window.sellscout && window.sellscout.log) {
      try {
        const res = await window.sellscout.log.read(maxLines || 120);
        if (res && res.ok) return res.lines;
      } catch { /* fall through */ }
    }
    return buf.slice(-(maxLines || 120));
  }

  async function clear() {
    buf.length = 0;
    if (window.sellscout && window.sellscout.log) {
      try { await window.sellscout.log.clear(); } catch {}
    }
  }

  function openFolder() {
    if (window.sellscout && window.sellscout.log) window.sellscout.log.openFolder();
  }

  // Capture uncaught renderer errors
  window.addEventListener('error', (e) => {
    error('Uncaught: ' + e.message, { at: (e.filename || '').split('/').pop() + ':' + e.lineno });
  });
  window.addEventListener('unhandledrejection', (e) => {
    error('Unhandled rejection', { reason: String(e.reason).slice(0, 200) });
  });

  window.Log = { info, warn, error, recent, clear, openFolder };
})();
