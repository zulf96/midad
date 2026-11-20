/* جسر آمن بين التطبيق وعملية الإلكترون — contextIsolation مفعّل */
const { contextBridge, ipcRenderer } = require('electron');

function listen(channel, cb) {
  if (typeof cb !== 'function') return;
  ipcRenderer.on(channel, (event, data) => { try { cb(data); } catch (err) { /* تجاهل */ } });
}

contextBridge.exposeInMainWorld('midadDesktop', {
  isDesktop: true,
  version: '1.1.0',
  /* التخزين الآمن: ملفات JSON في مجلد المستخدم بدل ذاكرة المتصفح */
  storage: {
    read: () => ipcRenderer.invoke('midad:storage-read'),
    write: data => ipcRenderer.invoke('midad:storage-write', data),
    backup: data => ipcRenderer.invoke('midad:storage-backup', data),
    path: () => ipcRenderer.invoke('midad:storage-path')
  },
  /* التحديثات: مركز تحديثات مستقل داخل البرنامج (فحص/تنزيل/إلغاء/تثبيت) */
  updates: {
    check: () => ipcRenderer.invoke('midad:update-check'),
    download: () => ipcRenderer.invoke('midad:update-download'),
    cancel: () => ipcRenderer.invoke('midad:update-cancel'),
    installNow: () => ipcRenderer.invoke('midad:update-install'),
    installOnQuit: () => ipcRenderer.invoke('midad:update-install-on-quit'),
    install: () => ipcRenderer.invoke('midad:update-install'),
    openCenter: () => ipcRenderer.invoke('midad:update-open-center'),
    openReleases: () => ipcRenderer.invoke('midad:open-releases'),
    getVersion: () => ipcRenderer.invoke('midad:app-version'),
    onAvailable: cb => listen('midad:update-found', cb),
    onCheckResult: cb => listen('midad:update-check-result', cb),
    onProgress: cb => listen('midad:update-progress', cb),
    onReady: cb => listen('midad:update-ready', cb),
    onError: cb => listen('midad:update-error', cb),
    onCancelled: cb => listen('midad:update-cancelled', cb),
    onOpenCenter: cb => listen('midad:update-open', cb)
  },
  /* خطوط النظام المثبّتة (ويندوز/لينكس) */
  systemFonts: () => ipcRenderer.invoke('midad:system-fonts'),
  /* حفظ مباشر بصيغة PDF (printToPDF) — يعيد المسار أو null */
  savePdf: suggested => ipcRenderer.invoke('midad:save-pdf', suggested)
});
