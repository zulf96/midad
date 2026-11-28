# مِداد ستوديو

استوديو عربي (RTL) لتأليف الملازم والكتب الدراسية، مبني بالكامل بـ **HTML5 + CSS3 + JavaScript خالص** — ملف واحد مكتفٍ بذاته: `midad-app.html`.

الواجهة والمحرر والتخزين والتصدير كلها JavaScript محلي، بلا أي طبقة وسيطة.

## التشغيل
- افتح `midad-app.html` في المتصفح، أو
- شغّل غلاف Electron: `cd midad-desktop && npm install && npm start`.

## البنية
- `midad-app.html` — التطبيق الكامل (الواجهة، المحرر، القوالب، التصدير).
- `midad-desktop/` — غلاف Electron يحمّل ملف HTML مباشرةً عبر `loadFile`.
- `android-icons/` — أيقونات الحزم.
- `.github/workflows/` — بناء ونشر حزم سطح المكتب.
- `graphify-out/REA_FINDINGS.md` — أدلة تحليل REA لسلوك النسخة الأصلية.

مفتاح التخزين المحلي: `midad.studio.v1`. الطباعة PDF تبقى A4 افتراضياً مع احترام مقاس كل مستند واتجاهه.

## الترخيص
MIT — انظر `LICENSE`.
