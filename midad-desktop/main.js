/* مِداد ستوديو — عملية الإلكترون الرئيسية */
const { app, BrowserWindow, Menu, dialog, session, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let manualUpdateCheck = false;

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

/* ---------- خطوط ويندوز المثبّتة ---------- */
let systemFontsCache = null;

function listSystemFonts() {
  if (systemFontsCache) return systemFontsCache;
  try {
    const out = require('child_process').execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command',
        "Add-Type -AssemblyName System.Drawing; (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }"],
      { encoding: 'utf8', timeout: 20000, windowsHide: true }
    );
    systemFontsCache = String(out).split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b, 'ar'))
      .slice(0, 600);
  } catch (err) {
    /* بديل: أسماء ملفات خطوط ويندوز */
    try {
      const dir = 'C:/Windows/Fonts';
      systemFontsCache = fs.readdirSync(dir)
        .filter(f => /\.(ttf|otf|ttc)$/i.test(f))
        .map(f => f.replace(/\.(ttf|otf|ttc)$/i, ''))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => a.localeCompare(b, 'ar'))
        .slice(0, 600);
    } catch (err2) {
      systemFontsCache = [];
    }
  }
  return systemFontsCache;
}

ipcMain.handle('midad:system-fonts', () => listSystemFonts());

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
function setupAutoUpdater() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try {
    autoUpdater = require('electron-updater').autoUpdater;
  } catch (err) {
    logUpdate('electron-updater غير متاح: ' + err.message);
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => logUpdate('جارٍ فحص التحديثات...'));

  autoUpdater.on('update-available', info => {
    logUpdate('يتوفر إصدار ' + info.version);
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'تحديث متوفر',
        message: 'يتوفر إصدار جديد: ' + info.version,
        detail: 'يجري تنزيله الآن في الخلفية. ستصلك رسالة عند اكتمال التنزيل.',
        buttons: ['حسنًا']
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    logUpdate('لا يوجد تحديث — الإصدار الحالي هو الأحدث.');
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'التحديثات',
        message: 'أنت تستخدم أحدث إصدار (' + app.getVersion() + ').',
        buttons: ['حسنًا']
      });
    }
  });

  autoUpdater.on('download-progress', progress => {
    logUpdate('تنزيل التحديث: ' + Math.round(progress.percent) + '%');
    if (win && !win.isDestroyed()) {
      win.setProgressBar(progress.percent / 100);
      win.webContents.send('midad:update-progress', {
        percent: progress.percent,
        speed: progress.bytesPerSecond,
        mbDone: progress.transferred,
        mbTotal: progress.total
      });
    }
  });

  autoUpdater.on('update-downloaded', info => {
    logUpdate('اكتمل تنزيل ' + info.version);
    if (win && !win.isDestroyed()) {
      win.setProgressBar(-1);
      win.webContents.send('midad:update-progress', { done: true, version: info.version });
    }
    if (manualUpdateCheck) manualUpdateCheck = false;
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'التحديث جاهز',
      message: 'اكتمل تنزيل الإصدار ' + info.version,
      detail: 'سيُثبَّت تلقائيًا عند إغلاق التطبيق، أو أعد التشغيل الآن لتطبيقه فورًا.',
      buttons: ['إعادة التشغيل الآن', 'لاحقًا'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall(false, true);
    });
  });

  autoUpdater.on('error', err => {
    logUpdate('خطأ في التحديث: ' + (err && err.message));
    if (win && !win.isDestroyed()) {
      win.setProgressBar(-1);
      win.webContents.send('midad:update-progress', { failed: true });
    }
    if (manualUpdateCheck) {
      manualUpdateCheck = false;
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'تعذّر التحديث',
        message: 'لم نتمكن من التحقق من التحديثات.',
        detail: 'تأكد من اتصال الإنترنت ثم حاول لاحقًا.\n' + (err && err.message ? String(err.message) : ''),
        buttons: ['حسنًا']
      });
    }
  });

  // فحص عند الإقلاع (بعد استقرار الواجهة) ثم كل ٤ ساعات
  setTimeout(() => autoUpdater.checkForUpdates().catch(err => logUpdate(err && err.message)), 4000);
  setInterval(() => autoUpdater.checkForUpdates().catch(err => logUpdate(err && err.message)), 4 * 60 * 60 * 1000);
}

function checkForUpdatesManually() {
  if (!app.isPackaged) {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'التحديثات',
      message: 'أنت تشغّل نسخة التطوير.',
      detail: 'فحص التحديثات متاح في النسخة المثبَّتة فقط.',
      buttons: ['حسنًا']
    });
    return;
  }
  manualUpdateCheck = true;
  const { autoUpdater } = require('electron-updater');
  autoUpdater.checkForUpdates().catch(err => {
    manualUpdateCheck = false;
    logUpdate(err && err.message);
  });
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