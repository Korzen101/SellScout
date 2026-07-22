// SellScout — preload bridge. Exposes a minimal, promise-based API to the
// renderer. The renderer never touches Node or Electron directly.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sellscout', {
  store: {
    getAll: () => ipcRenderer.invoke('store:getAll'),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value)
  },
  news: {
    fetch: () => ipcRenderer.invoke('news:fetch'),
    onUpdate: (cb) => ipcRenderer.on('news:update', (_e, items) => cb(items))
  },
  spapi: {
    test: () => ipcRenderer.invoke('spapi:test'),
    orders: (days) => ipcRenderer.invoke('spapi:orders', days),
    product: (asin) => ipcRenderer.invoke('spapi:product', asin),
    configured: () => ipcRenderer.invoke('spapi:configured')
  },
  keepa: {
    bestsellers: (categoryId) => ipcRenderer.invoke('keepa:bestsellers', categoryId),
    product: (asin) => ipcRenderer.invoke('keepa:product', asin)
  },
  file: {
    save: (name, content, extLabel, ext) => ipcRenderer.invoke('file:save', name, content, extLabel, ext),
    openText: (extLabel, exts) => ipcRenderer.invoke('file:openText', extLabel, exts)
  },
  log: {
    write: (level, msg, data) => ipcRenderer.invoke('log:write', level, msg, data),
    read: (maxLines) => ipcRenderer.invoke('log:read', maxLines),
    clear: () => ipcRenderer.invoke('log:clear'),
    openFolder: () => ipcRenderer.invoke('log:openFolder')
  },
  exportCsv: (suggestedName, content) => ipcRenderer.invoke('export:csv', suggestedName, content),
  update: {
    onReady: (cb) => ipcRenderer.on('update:ready', (_e, version) => cb(version)),
    install: () => ipcRenderer.invoke('update:install')
  },
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  version: () => ipcRenderer.invoke('app:version')
});
