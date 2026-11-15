/* مِداد ستوديو — عملية الإلكترون الرئيسية */
const { app, BrowserWindow, Menu, dialog, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let manualUpdateCheck = false;

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
    if (win && !win.isDestroyed()) win.setProgressBar(progress.percent / 100);
  });

  autoUpdater.on('update-downloaded', info => {
    logUpdate('اكتمل تنزيل ' + info.version);
    if (win && !win.isDestroyed()) win.setProgressBar(-1);
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
    if (win && !win.isDestroyed()) win.setProgressBar(-1);
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
    wireDownloads();
    buildMenu();
    createWindow();
    setupAutoUpdater();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}