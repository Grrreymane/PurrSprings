// ============================================================ languages (1GP: Chinese original + en / ja / ko / es)
// Every string on screen goes through txt() / textW(), which look the Chinese original up here, so data-table names
// need no change; a sentence built from parts is one template: L('第{0}天', n) (string arguments are looked up too).
// The translations ship inside the game (src/data/lang.js, written from i18n/*.json by tools/i18n.cjs), so GitHub Pages
// and a slow network show them as well; inside the platform's player entries the author edited on 1GP are fetched
// over them. Language: ?lang= first, then the browser's; no language at all (headless tests) = the Chinese original.
const LANGS = ['zh', 'en', 'ja', 'ko', 'es'];
const I18N_ORIGIN = 'https://www.ai-made.games', I18N_GAME = '3c4961eaf94f00edc68f3db316056970-cbf5b613';
function langPick() {
  try { const m = /[?&]lang=([A-Za-z-]+)/.exec(location.search || ''); if (m && LANGS.includes(m[1])) return m[1]; } catch (e) {}
  try {
    const ls = (navigator.languages && navigator.languages.length ? [...navigator.languages] : [navigator.language]).filter(Boolean);
    for (const l of ls) { const b = String(l).toLowerCase(); if (b.startsWith('zh')) return 'zh'; if (LANGS.includes(b.split('-')[0])) return b.split('-')[0]; }
    if (ls.length) return 'en';
  } catch (e) {}
  return 'zh';
}
let LANG = 'zh', DICT = null;
function setLang(l) {
  LANG = LANGS.includes(l) ? l : 'zh';
  DICT = LANG === 'zh' ? null : Object.assign({}, LANG_DATA[LANG] || {});
  try { TXC.clear(); TW.clear(); } catch (e) {}   // cached text sprites / widths (present.js, drawing.js)
}
setLang(langPick());
const tr = s => { if (!DICT || typeof s !== 'string') return s; const v = DICT[s]; return typeof v === 'string' && v ? v : s; };
function L(k) {
  const a = arguments; let s = tr(k);
  return s.replace(/\{(\d+)\}/g, (m, i) => { const v = a[+i + 1]; return v === undefined ? m : String(tr(v)); });
}
// in the platform's player: the author's latest entries for this language (4 s at most; the bundled ones stay otherwise)
function langFetch() {
  if (!DICT) return;
  const want = LANG, ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const stop = setTimeout(() => { try { if (ctl) ctl.abort(); } catch (e) {} }, 4000);
  // the 1GP copy is keyed p.<SHA-256 of the trimmed original> (tools/i18n.cjs): hash each original the same way
  const pid = async k => 'p.' + [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(k.trim())))].map(b => b.toString(16).padStart(2, '0')).join('');
  fetch(I18N_ORIGIN + '/i18n/' + encodeURIComponent(I18N_GAME) + '/' + want + '.json?use=phrases', { credentials: 'omit', signal: ctl ? ctl.signal : undefined })
    .then(r => r.ok ? r.json() : null).then(async d => {
      if (!d || typeof d !== 'object' || LANG !== want || !DICT || !(crypto && crypto.subtle)) return;
      for (const k of Object.keys(LANG_DATA[want] || {})) { const v = d[await pid(k)]; if (typeof v === 'string' && v) DICT[k] = v; }
      try { TXC.clear(); TW.clear(); } catch (e) {}
    }).catch(() => {}).finally(() => clearTimeout(stop));
}
