const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printReceipt: (htmlContent, options) => ipcRenderer.invoke('print-receipt', htmlContent, options),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  setWindowTitle: (title) => ipcRenderer.invoke('set-window-title', title),
  getPrinters: () => ipcRenderer.invoke('get-printers')
});
