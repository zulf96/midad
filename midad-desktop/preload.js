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
  /* التحديثات: فحص خلفي + إشعار بثلاثة خيارات + تقدّم التنزيل */
  updates: {
    check: () => ipcRenderer.invoke('midad:update-check'),
    install: () => ipcRenderer.invoke('midad:update-install'),
    openReleases: () => ipcRenderer.invoke('midad:open-releases'),
    onAvailable: cb => listen('midad:update-found', cb),
    onCheckResult: cb => listen('midad:update-check-result', cb),
    onProgress: cb => listen('midad:update-progress', cb)
  },
  /* خطوط النظام المثبّتة (ويندوز/لينكس) */
  systemFonts: () => ipcRenderer.invoke('midad:system-fonts'),
  /* حفظ مباشر بصيغة PDF (printToPDF) — يعيد المسار أو null */
  savePdf: suggested => ipcRenderer.invoke('midad:save-pdf', suggested)
});
