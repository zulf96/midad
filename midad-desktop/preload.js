/* جسر آمن بين التطبيق وعملية الإلكترون — contextIsolation مفعّل */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('midadDesktop', {
  isDesktop: true,
  version: '1.0.0',
  /* التخزين الآمن: ملفات JSON في مجلد المستخدم بدل ذاكرة المتصفح */
  storage: {
    read: () => ipcRenderer.invoke('midad:storage-read'),
    write: data => ipcRenderer.invoke('midad:storage-write', data),
    backup: data => ipcRenderer.invoke('midad:storage-backup', data),
    path: () => ipcRenderer.invoke('midad:storage-path')
  },
  /* تقدّم تنزيل التحديث التلقائي */
  updates: {
    onProgress: cb => {
      if (typeof cb !== 'function') return;
      ipcRenderer.on('midad:update-progress', (event, data) => { try { cb(data); } catch (err) { /* تجاهل */ } });
    }
  },
  /* خطوط ويندوز المثبّتة */
  systemFonts: () => ipcRenderer.invoke('midad:system-fonts')
});
