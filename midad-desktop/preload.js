/* جسر آمن بين التطبيق وعملية الإلكترون — contextIsolation مفعّل */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('midadDesktop', {
  isDesktop: true,
  version: '1.0.0'
});
