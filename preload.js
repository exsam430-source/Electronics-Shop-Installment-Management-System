const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printReceipt: (htmlContent, options) => ipcRenderer.invoke('print-receipt', htmlContent, options),
  saveToPdf: (htmlContent, options) => ipcRenderer.invoke('save-pdf', htmlContent, options),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  setWindowTitle: (title) => ipcRenderer.invoke('set-window-title', title),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  openWhatsAppApp: (data) => ipcRenderer.invoke('open-whatsapp-app', data),
  openWhatsAppWeb: (data) => ipcRenderer.invoke('open-whatsapp-web', data)
});
