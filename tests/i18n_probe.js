// Untranslated text hunt: plays a whole game (the balance bot, eager to star 5 and on into the boutique) in one language
// and lists every string drawn on screen that is still Chinese - the ones txt() could not look up (a sentence built
// from parts, a name added at run time). Run it after adding text; i18n_check only covers the screens it builds itself.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/i18n_probe.js --seed 1 -- en [profile] [maxMin]
const PROBE_LANG = ARGS[0] || 'en', HAN = /[\u3400-\u9fff]/;
setLang(PROBE_LANG);
const VALUES = new Set(Object.values(DICT || {})), MISS = new Map();
const _L = L; L = function () { const r = _L.apply(this, arguments); VALUES.add(r); return r; };   // a template's result is translated (Japanese keeps kanji)
const _txt = txt;
txt = function (s) { const t = tr(s); if (typeof t === 'string' && HAN.test(t) && !VALUES.has(t) && !/^[\d.]+[万만]$/.test(t)) MISS.set(t, (MISS.get(t) || 0) + 1); return _txt.apply(this, arguments); };
const _update = update; let probeN = 0;
update = function (dt) { _update(dt); if (++probeN % 15 === 0) { try { render(); } catch (e) {} } };
process.on('exit', () => {
  const list = [...MISS].sort((a, b) => b[1] - a[1]);
  console.log(`I18N PROBE ${PROBE_LANG}: ${list.length} untranslated strings drawn`);
  for (const [s, n] of list) console.log('  ' + n + '\t' + s);
});
ARGS.splice(0, 1, ARGS[1] || 'shopper', ARGS[2] || '60');
ARGS.length = Math.min(ARGS.length, 2);
eval(require('fs').readFileSync(require('path').resolve('tests/bot_balance.js'), 'utf8'));
