// SellScout — preload bridge. Exposes a minimal, promise-based API to the
// renderer. The renderer never touches Node or Electron directly.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sellscout', {
  store: {
    getAll: () => ipcRenderer.invoke('store:getAll'),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value)
  },
  news: {
    fetch: () => ipcRenderer.invoke('news:fetch')
  },
  spapi: {
    test: () => ipcRenderer.invoke('spapi:test'),
    orders: (days) => ipcRenderer.invoke('spapi:orders', days)
  },
  keepa: {
    bestsellers: (categoryId) => ipcRenderer.invoke('keepa:bestsellers', categoryId)
  },
  log: {
    write: (level, msg, data) => ipcRenderer.invoke('log:write', level, msg, data),
    read: (maxLines) => ipcRenderer.invoke('log:read', maxLines),
    clear: () => ipcRenderer.invoke('log:clear'),
    openFolder: () => ipcRenderer.invoke('log:openFolder')
  },
  exportCsv: (suggestedName, content) => ipcRenderer.invoke('export:csv', suggestedName, content),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  version: () => ipcRenderer.invoke('app:version')
});
