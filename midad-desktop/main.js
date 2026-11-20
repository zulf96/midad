/* مِداد ستوديو — عملية الإلكترون الرئيسية */
const { app, BrowserWindow, Menu, dialog, session, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;

/* ---------- التخزين الآمن: مجلد «مِداد ستوديو» في المستندات ---------- */
function dataDir() {
  return path.join(app.getPath('documents'), 'مِداد ستوديو');
}
function dataFile() {
  return path.join(dataDir(), 'midad-data.json');
}
function backupsDir() {
  return path.join(dataDir(), 'نسخ احتياطية');
}
const BACKUPS_TO_KEEP = 12;

function wireStorage() {
  ipcMain.handle('midad:storage-read', () => {
    try { return fs.readFileSync(dataFile(), 'utf8'); } catch (err) { return null; }
  });
  ipcMain.handle('midad:storage-write', (event, data) => {
    try {
      fs.mkdirSync(dataDir(), { recursive: true });
      const tmp = dataFile() + '.tmp';
      fs.writeFileSync(tmp, String(data == null ? '' : data), 'utf8');
      fs.renameSync(tmp, dataFile());
      return true;
    } catch (err) {
      logUpdate('فشل حفظ البيانات: ' + (err && err.message));
      return false;
    }
  });
  ipcMain.handle('midad:storage-backup', (event, data) => {
    try {
      fs.mkdirSync(backupsDir(), { recursive: true });
      const name = 'midad-backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      fs.writeFileSync(path.join(backupsDir(), name), String(data == null ? '' : data), 'utf8');
      const files = fs.readdirSync(backupsDir()).filter(f => f.startsWith('midad-backup-')).sort();
      while (files.length > BACKUPS_TO_KEEP) fs.unlinkSync(path.join(backupsDir(), files.shift()));
      return name;
    } catch (err) {
      logUpdate('فشل النسخ الاحتياطي: ' + (err && err.message));
      return null;
    }
  });
  ipcMain.handle('midad:storage-path', () => dataDir());
}

/* ---------- خطوط النظام المثبّتة (ويندوز / لينكس) ---------- */
let systemFontsCache = null;

/* فحص مجلدات الخطوط — بديل عندما لا يتوفر fc-list أو PowerShell */
function scanFontDirs(dirs) {
  const found = [];
  const walk = dir => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (err) { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ttf|otf|ttc)$/i.test(entry.name)) found.push(entry.name.replace(/\.[^.]+$/, ''));
    }
  };
  dirs.forEach(walk);
  return found;
}

function listSystemFonts() {
  if (systemFontsCache) return systemFontsCache;
  let names = [];
  if (process.platform === 'win32') {
    try {
      const out = require('child_process').execFileSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command',
          "Add-Type -AssemblyName System.Drawing; (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }"],
        { encoding: 'utf8', timeout: 20000, windowsHide: true }
      );
      names = String(out).split(/\r?\n/);
    } catch (err) {
      names = scanFontDirs(['C:/Windows/Fonts']);
    }
  } else {
    /* لينكس: fontconfig أولًا (أسماء العائلات)، ثم فحص مجلدات المستخدم والنظام */
    try {
      const out = require('child_process').execFileSync(
        'fc-list', ['--format=%{family}\n'],
        { encoding: 'utf8', timeout: 20000 }
      );
      names = String(out).split(/\r?\n/).flatMap(line => line.split(','));
    } catch (err) {
      names = scanFontDirs([
        '/usr/share/fonts',
        '/usr/local/share/fonts',
        path.join(app.getPath('home'), '.local/share/fonts'),
        path.join(app.getPath('home'), '.fonts')
      ]);
    }
  }
  systemFontsCache = names.map(s => String(s).trim()).filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a.localeCompare(b, 'ar'))
    .slice(0, 600);
  return systemFontsCache;
}

ipcMain.handle('midad:system-fonts', () => listSystemFonts());

/* ---------- حفظ مباشر بصيغة PDF (بدون نافذة الطباعة) ---------- */
ipcMain.handle('midad:save-pdf', async (event, suggested) => {
  if (!win || win.isDestroyed()) return null;
  const name = String(suggested || 'مستند.pdf');
  const savePath = dialog.showSaveDialogSync(win, {
    title: 'حفظ بصيغة PDF',
    defaultPath: path.join(app.getPath('documents'), 'مِداد ستوديو', name),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (!savePath) return null;
  try {
    const data = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true
    });
    fs.writeFileSync(savePath, Buffer.from(data));
    logUpdate('حُفظ PDF: ' + savePath);
    return savePath;
  } catch (err) {
    logUpdate('فشل حفظ PDF: ' + (err && err.message));
    return null;
  }
});

/* ---------- حفظ واسترجاع أبعاد النافذة ---------- */
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
  } catch (err) {
    return { width: 1280, height: 860, maximized: false };
  }
}

function saveWindowState() {
  if (!win || win.isDestroyed()) return;
  const state = {
    x: win.getPosition()[0],
    y: win.getPosition()[1],
    width: win.getSize()[0],
    height: win.getSize()[1],
    maximized: win.isMaximized()
  };
  try { fs.writeFileSync(stateFile(), JSON.stringify(state)); } catch (err) { /* تجاهل */ }
}

function logUpdate(message) {
  try {
    const line = new Date().toISOString() + '  ' + message + '\n';
    fs.appendFileSync(path.join(app.getPath('userData'), 'updater.log'), line);
  } catch (err) { /* تجاهل */ }
}

/* ---------- النافذة ---------- */
function appIconPath() {
  const icon = path.join(__dirname, 'build', 'icon.png');
  try { return fs.existsSync(icon) ? icon : undefined; } catch (err) { return undefined; }
}

function createWindow() {
  const state = loadWindowState();
  win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width || 1280,
    height: state.height || 860,
    minWidth: 780,
    minHeight: 560,
    backgroundColor: '#f7f9fa',
    title: 'مِداد ستوديو',
    icon: appIconPath(),
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (state.maximized) win.maximize();

  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.once('ready-to-show', () => win.show());

  win.on('close', saveWindowState);
  win.on('closed', () => { win = null; });

  // منع فتح الروابط داخل النافذة — تفتح في المتصفح الخارجي
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

/* ---------- التنزيلات (تصدير HTML / JSON / الصور) ---------- */
function wireDownloads() {
  session.defaultSession.on('will-download', (event, item) => {
    const suggested = item.getFilename() || 'midad-export.html';
    const savePath = dialog.showSaveDialogSync(win, {
      title: 'حفظ الملف',
      defaultPath: suggested
    });
    if (!savePath) { event.preventDefault(); return; }
    event.preventDefault();
    item.setSavePath(savePath);
  });
}

/* ---------- قائمة النقر الأيمن (نسخ/قص/لصق/…) ---------- */
function wireContextMenu() {
  win.webContents.on('context-menu', (event, params) => {
    const items = [];
    const editable = params.isEditable;
    const hasSel = (params.selectionText || '').trim().length > 0;

    if (editable) {
      if (hasSel) items.push({ label: 'قص', role: 'cut' });
      items.push({ label: 'لصق', role: 'paste' });
      if (hasSel) items.push({ label: 'لصق بنفس التنسيق', role: 'pasteAndMatchStyle' });
    }
    if (hasSel) items.push({ label: 'نسخ', role: 'copy' });
    if (params.linkURL) items.push({ label: 'نسخ عنوان الرابط', role: 'copyLink' });
    if (items.length) items.push({ type: 'separator' });
    items.push({ label: 'تحديد الكل', role: 'selectAll' });
    if (editable && hasSel) items.push({
      label: 'إلغاء التحديد',
      click: () => win.webContents.executeJavaScript('window.getSelection().removeAllRanges()').catch(() => {})
    });

    Menu.buildFromTemplate(items).popup({ window: win });
  });
}

/* ---------- التحديث التلقائي ---------- */
const RELEASES_URL = 'https://github.com/zulf96/midad/releases/latest';

/* electron-updater يدعم ويندوز و AppImage؛ حزمة .deb تُحدَّث بتنزيل الحزمة الجديدة */
function autoUpdateSupported() {
  return process.platform !== 'linux' || !!process.env.APPIMAGE;
}

let updaterRef = null;
let cancelToken = null;
let manualUpdateCheck = false;
let installRequested = false;
let downloadedReady = false;
let downloadedInfo = null;

function sendToWin(channel, data) {
  if (!win || win.isDestroyed()) return;
  win.webContents.send(channel, data);
}

/* إرسال نتيجة فحص التحديث إلى الواجهة (إشعار داخل التطبيق بدل نوافذ منبثقة) */
function sendUpdateResult(status, extra) {
  sendToWin('midad:update-check-result', Object.assign({ status: status }, extra || {}));
}

function releaseNotesText(info) {
  if (!info) return '';
  if (typeof info.releaseNotes === 'string') return info.releaseNotes;
  if (Array.isArray(info.releaseNotes)) {
    return info.releaseNotes.map(entry => (entry && entry.note) || '').filter(Boolean).join('\n\n');
  }
  return '';
}

function updateSize(info) {
  const files = info && Array.isArray(info.files) ? info.files : [];
  return files.reduce((total, file) => total + (Number(file && file.size) || 0), 0);
}

function wireUpdaterEvents(autoUpdater, CancellationToken) {
  /* التنزيل لا يبدأ إلا بطلب صريح من مركز التحديثات */
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => logUpdate('فحص خلفي للتحديثات...'));

  autoUpdater.on('update-available', info => {
    downloadedReady = false;
    downloadedInfo = null;
    logUpdate('يتوفر إصدار ' + info.version + ' (فحص خلفي — بلا نافذة منبثقة)');
    const payload = {
      version: info.version,
      releaseName: info.releaseName || '',
      releaseDate: info.releaseDate || '',
      notes: releaseNotesText(info).slice(0, 6000),
      size: updateSize(info)
    };
    sendToWin('midad:update-found', payload);
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      sendUpdateResult('found', { version: payload.version, size: payload.size, notes: payload.notes });
    }
  });

  autoUpdater.on('update-not-available', () => {
    logUpdate('لا يوجد تحديث — الإصدار الحالي هو الأحدث.');
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      sendUpdateResult('none');
    }
  });

  autoUpdater.on('download-progress', progress => {
    logUpdate('تنزيل التحديث: ' + Math.round(progress.percent) + '%');
    if (win && !win.isDestroyed()) win.setProgressBar(progress.percent / 100);
    const total = Number(progress.total) || 0;
    const done = Number(progress.transferred) || 0;
    const speed = Number(progress.bytesPerSecond) || 0;
    const eta = speed > 0 && total > done ? (total - done) / speed : 0;
    sendToWin('midad:update-progress', {
      percent: progress.percent,
      speed: speed,
      transferred: done,
      total: total,
      eta: eta
    });
  });

  autoUpdater.on('update-downloaded', info => {
    logUpdate('اكتمل تنزيل ' + info.version);
    downloadedReady = true;
    downloadedInfo = { version: info.version, size: updateSize(info) };
    if (win && !win.isDestroyed()) win.setProgressBar(-1);
    sendToWin('midad:update-ready', downloadedInfo);
    sendToWin('midad:update-progress', { done: true, version: info.version });
    if (manualUpdateCheck) manualUpdateCheck = false;
    if (installRequested) {
      installRequested = false;
      setTimeout(() => {
        try { autoUpdater.quitAndInstall(false, true); } catch (err) { logUpdate(err && err.message); }
      }, 300);
    }
  });

  autoUpdater.on('error', err => {
    const message = (err && err.message) || '';
    logUpdate('خطأ في التحديث: ' + message);
    if (win && !win.isDestroyed()) win.setProgressBar(-1);
    const cancelled = !!(cancelToken && cancelToken.cancelled) || /cancel/i.test(message);
    cancelToken = null;
    installRequested = false;
    if (cancelled) {
      sendToWin('midad:update-cancelled', {});
      return;
    }
    sendToWin('midad:update-error', { message: message || 'تعذّر تنزيل التحديث.' });
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      sendUpdateResult('error', { message: message });
    }
  });

  return autoUpdater;
}

function getUpdater() {
  if (!app.isPackaged || !autoUpdateSupported()) return null;
  if (updaterRef) return updaterRef;
  try {
    const mod = require('electron-updater');
    updaterRef = wireUpdaterEvents(mod.autoUpdater, mod.CancellationToken);
  } catch (err) {
    logUpdate('electron-updater غير متاح: ' + err.message);
    updaterRef = null;
  }
  return updaterRef;
}

function beginDownload(autoUpdater, installAfter) {
  const mod = require('electron-updater');
  cancelToken = new mod.CancellationToken();
  installRequested = !!installAfter;
  autoUpdater.downloadUpdate(cancelToken).catch(err => {
    if (cancelToken && cancelToken.cancelled) return;
    logUpdate('فشل بدء التنزيل: ' + (err && err.message));
    installRequested = false;
    sendToWin('midad:update-error', { message: (err && err.message) || 'تعذّر بدء تنزيل التحديث.' });
  });
}

/* أوامر التحديث التي تستدعيها الواجهة */
function wireUpdateIpc() {
  ipcMain.handle('midad:app-version', () => app.getVersion());

  ipcMain.handle('midad:update-check', () => {
    if (!app.isPackaged || !autoUpdateSupported()) {
      sendUpdateResult('unsupported');
      return false;
    }
    const autoUpdater = getUpdater();
    if (!autoUpdater) {
      sendUpdateResult('error', { message: 'مكوّن التحديث غير متاح.' });
      return false;
    }
    manualUpdateCheck = true;
    sendUpdateResult('checking');
    try {
      autoUpdater.checkForUpdates().catch(err => {
        manualUpdateCheck = false;
        logUpdate(err && err.message);
        sendUpdateResult('error', { message: err && err.message });
      });
    } catch (err) {
      manualUpdateCheck = false;
      logUpdate(err && err.message);
      sendUpdateResult('error', { message: err && err.message });
      return false;
    }
    return true;
  });

  /* بدء التنزيل فقط (التثبيت قرار منفصل) */
  ipcMain.handle('midad:update-download', () => {
    if (!app.isPackaged || !autoUpdateSupported()) {
      sendUpdateResult('unsupported');
      return false;
    }
    const autoUpdater = getUpdater();
    if (!autoUpdater) return false;
    if (downloadedReady) {
      sendToWin('midad:update-ready', downloadedInfo || {});
      return true;
    }
    try {
      beginDownload(autoUpdater, false);
      return true;
    } catch (err) {
      logUpdate(err && err.message);
      sendToWin('midad:update-error', { message: err && err.message });
      return false;
    }
  });

  /* إلغاء التنزيل الجاري */
  ipcMain.handle('midad:update-cancel', () => {
    if (!cancelToken || cancelToken.cancelled) return false;
    try {
      cancelToken.cancel();
      if (win && !win.isDestroyed()) win.setProgressBar(-1);
      sendToWin('midad:update-cancelled', {});
      return true;
    } catch (err) {
      logUpdate(err && err.message);
      return false;
    }
  });

  /* التثبيت الآن: إن كان التنزيل جاهزًا ثبّت، وإلا نزّل ثم ثبّت */
  ipcMain.handle('midad:update-install', () => {
    if (!app.isPackaged || !autoUpdateSupported()) {
      shell.openExternal(RELEASES_URL);
      return false;
    }
    const autoUpdater = getUpdater();
    if (!autoUpdater) return false;
    try {
      if (downloadedReady) {
        autoUpdater.quitAndInstall(false, true);
        return true;
      }
      beginDownload(autoUpdater, true);
      return true;
    } catch (err) {
      installRequested = false;
      logUpdate(err && err.message);
      sendToWin('midad:update-error', { message: err && err.message });
      return false;
    }
  });

  /* تثبيت عند إغلاق البرنامج بدل إعادة التشغيل الفوري */
  ipcMain.handle('midad:update-install-on-quit', () => {
    if (!downloadedReady) return false;
    const autoUpdater = getUpdater();
    if (!autoUpdater) return false;
    autoUpdater.autoInstallOnAppQuit = true;
    logUpdate('سيُثبَّت التحديث عند إغلاق البرنامج.');
    return true;
  });

  ipcMain.handle('midad:update-open-center', () => {
    sendToWin('midad:update-open', { autoCheck: true });
    return true;
  });

  ipcMain.handle('midad:open-releases', () => {
    shell.openExternal(RELEASES_URL);
    return true;
  });
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;
  if (!autoUpdateSupported()) {
    logUpdate('التحديث التلقائي غير مدعوم في هذه الحزمة (deb) — استخدم AppImage أو نزّل يدويًا.');
    return;
  }
  const autoUpdater = getUpdater();
  if (!autoUpdater) return;

  // فحص عند الإقلاع (بعد استقرار الواجهة) ثم كل ٤ ساعات
  setTimeout(() => autoUpdater.checkForUpdates().catch(err => logUpdate(err && err.message)), 4000);
  setInterval(() => autoUpdater.checkForUpdates().catch(err => logUpdate(err && err.message)), 4 * 60 * 60 * 1000);
}

/* فتح مركز التحديثات من القائمة — بلا نوافذ نظام */
function checkForUpdatesManually() {
  sendToWin('midad:update-open', { autoCheck: true });
}

/* ---------- قائمة عربية ---------- */
function buildMenu() {
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'طباعة / حفظ PDF',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (win) win.webContents.print({ printBackground: true });
          }
        },
        { type: 'separator' },
        {
          label: 'فتح مجلد البيانات',
          click: () => { shell.openPath(dataDir()); }
        },
        { type: 'separator' },
        { role: 'close', label: 'إغلاق' }
      ]
    },
    {
      label: 'تحرير',
      submenu: [
        { role: 'undo', label: 'تراجع' },
        { role: 'redo', label: 'إعادة' },
        { type: 'separator' },
        { role: 'cut', label: 'قص' },
        { role: 'copy', label: 'نسخ' },
        { role: 'paste', label: 'لصق' },
        { role: 'selectAll', label: 'تحديد الكل' }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        { role: 'resetZoom', label: 'الحجم الأصلي' },
        { role: 'zoomIn', label: 'تكبير' },
        { role: 'zoomOut', label: 'تصغير' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'ملء الشاشة' }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'التحقق من التحديثات',
          click: () => checkForUpdatesManually()
        },
        {
          label: 'عن مِداد',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'مِداد ستوديو',
              message: 'مِداد ستوديو — استوديو تأليف الملازم الدراسية',
              detail: 'الإصدار ' + app.getVersion() + '\nجميع البيانات محفوظة محليًا على جهازك.',
              buttons: ['حسنًا']
            });
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ---------- دورة الحياة ---------- */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    wireStorage();
    wireDownloads();
    wireUpdateIpc();
    buildMenu();
    createWindow();
    wireContextMenu();
    setupAutoUpdater();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}