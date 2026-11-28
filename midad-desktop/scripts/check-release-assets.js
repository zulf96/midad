#!/usr/bin/env node
/*
 check-release-assets.js — فحص مطابقة أسماء الأصول في ملفات التحديث (latest*.yml)
 قبل النشر المحلي/في CI (--dir) وبعد النشر على GitHub (--tag).

 يعالج العيب الذي ظهر في 1.2.7: electron-builder يعلن في latest.yml اسمًا
 (مثل "Midad Studio Setup 1.2.7.exe") بينما GitHub يخزّن الأصل باسم آخر
 (المسافات تصبح نقاطًا)، فيعود التحديث التلقائي بـ404.

 الاستخدام:
   node scripts/check-release-assets.js --dir release
   node scripts/check-release-assets.js --dir artifacts --version 1.2.7
   node scripts/check-release-assets.js --tag v1.2.7 --repo zulf96/midad

 الخروج: 0 إذا نجحت كل الفحوص، 1 إذا فشل أي فحص.
*/
'use strict';

const fs = require('fs');
const path = require('path');

const YMLS = ['latest.yml', 'latest-linux.yml', 'latest-linux-arm64.yml'];
/* أحرف يغيّرها GitHub عند تخزين الأصل أو تُربك الروابط */
const UNSAFE = /[\s#?%&+]/;

function log(pass, name, extra) {
  const line = (pass ? 'PASS' : 'FAIL') + ' | ' + name + (extra === undefined ? '' : ' :: ' + extra);
  console.log(line);
  return { pass, line };
}

/* قارئ YAML مصغّر: يكفيه version و files[].url و path */
function parseYml(text) {
  const out = { version: '', path: '', files: [], sha512: '', size: 0 };
  const vm = /^version:\s*(.+)$/m.exec(text);
  if (vm) out.version = vm[1].trim().replace(/^['"]|['"]$/g, '');
  const pm = /^path:\s*(.+)$/m.exec(text);
  if (pm) out.path = pm[1].trim().replace(/^['"]|['"]$/g, '');
  const sm = /^sha512:\s*(.+)$/m.exec(text);
  if (sm) out.sha512 = sm[1].trim();
  const zm = /^size:\s*(\d+)$/m.exec(text);
  if (zm) out.size = parseInt(zm[1], 10);
  const re = /^\s*-\s*url:\s*(.+)$/gm;
  let m;
  while ((m = re.exec(text))) out.files.push(m[1].trim().replace(/^['"]|['"]$/g, ''));
  if (!out.files.length && out.path) out.files.push(out.path);
  return out;
}

function ghName(name) {
  /* التطبيع الذي يطبقه GitHub على أسماء الأصول */
  return name.replace(/\s+/g, '.');
}

function readExpectedVersion(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return pkg.version || '';
  } catch (e) {
    return '';
  }
}

/* ---------- الوضع المحلي: قبل النشر ---------- */
function checkDir(dir, expectedVersion) {
  const results = [];
  const push = r => results.push(r);
  if (!fs.existsSync(dir)) {
    push(log(false, 'مجلد المخرجات موجود', dir));
    return results;
  }
  const present = YMLS.filter(f => fs.existsSync(path.join(dir, f)));
  push(log(present.length > 0, 'ملفات التحديث موجودة', present.join(', ') || '(لا شيء)'));

  const seen = new Map();
  for (const file of present) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    const yml = parseYml(text);
    push(log(!!yml.version, file + ': يحمل رقم إصدار', yml.version || '(فارغ)'));

    if (expectedVersion) {
      push(log(yml.version === expectedVersion, file + ': الإصدار يطابق package.json',
        yml.version + ' مقابل ' + expectedVersion));
    }
    push(log(yml.files.length > 0, file + ': يعلن ملفًا واحدًا على الأقل', String(yml.files.length)));

    for (const name of yml.files) {
      const target = path.join(dir, name);
      const exists = fs.existsSync(target);
      const size = exists ? fs.statSync(target).size : 0;
      push(log(exists && size > 0, file + ': الملف المُعلن موجود', name + (exists ? ' (' + size + ')' : ' (مفقود)')));

      /* الحارس الأساسي: الاسم يجب أن يكون آمنًا لـ GitHub كما هو */
      const safe = !UNSAFE.test(name);
      push(log(safe, file + ': الاسم آمن لـ GitHub', safe ? name : name + ' ← سيُخزَّن باسم ' + ghName(name)));

      if (exists) {
        const normalized = ghName(name);
        push(log(normalized === name, file + ': الاسم يطابق ما سيُخزَّنه GitHub', normalized));
      }
      if (seen.has(name) && seen.get(name) !== file) {
        push(log(false, 'اسم مكرر بين ملفات التحديث', name + ' في ' + seen.get(name) + ' و' + file));
      }
      seen.set(name, file);
    }
  }
  return results;
}

/* ---------- وضع بعد النشر: يتحقق من الروابط الحقيقية ---------- */
async function head(url) {
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, redirect: 'follow' });
    try { await res.arrayBuffer(); } catch (e) { /* تجاهل */ }
    return res.status;
  } catch (e) {
    return 0;
  }
}

async function checkTag(tag, repo) {
  const results = [];
  const push = r => results.push(r);
  const base = 'https://github.com/' + repo + '/releases/download/' + tag + '/';
  let found = 0;
  for (const file of YMLS) {
    const url = base + file;
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      push(log(false, 'ملف التحديث منشور', file + ' → ' + res.status));
      continue;
    }
    found++;
    const yml = parseYml(await res.text());
    push(log(!!yml.version, file + ': يحمل رقم إصدار', yml.version || '(فارغ)'));
    push(log(('v' + yml.version) === tag || yml.version === tag,
      file + ': الإصدار يطابق الوسم', yml.version + ' مقابل ' + tag));

    for (const name of yml.files) {
      const code = await head(base + encodeURI(name));
      const okCode = code === 200 || code === 206;
      push(log(okCode, file + ': رابط الملف يعمل', name + ' → ' + (code || 'خطأ شبكة')));
    }
  }
  push(log(found > 0, 'وُجد ملف تحديث واحد على الأقل', String(found)));
  return results;
}

/* ---------- التشغيل ---------- */
function argOf(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : '';
}

(async function main() {
  const tag = argOf('--tag');
  let results;
  if (tag) {
    const repo = argOf('--repo') || 'zulf96/midad';
    results = await checkTag(tag, repo);
  } else {
    const dir = argOf('--dir') || 'release';
    const version = argOf('--version') || (fs.existsSync(path.join(dir, 'package.json'))
      ? readExpectedVersion(dir) : '');
    results = checkDir(dir, version);
  }
  const fails = results.filter(r => !r.pass).length;
  console.log('');
  console.log('PASS=' + (results.length - fails) + ' FAIL=' + fails);
  if (fails) {
    console.log('السبب: اسم في latest*.yml لا يطابق اسم الأصل الذي سينشره GitHub —');
    console.log('اضبط nsis.artifactName (ويندوز) و linux.artifactName (لينكس) بلا مسافات، ثم أعد البناء.');
  }
  process.exit(fails ? 1 : 0);
})();
