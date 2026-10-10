// Composition check, standalone: node D:/Minigame/Hotelgame/tools/audio/theory_check.js
// Compiles every section of every song for 12 passes x day / night x star 1-5 and looks for two notes sounding together
// a minor second / minor ninth apart (the harsh interval; plucked notes count for their first 3 eighths only).
// Also prints the average new voices per second per arrangement and the number of distinct section signatures.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const eng = require('./engine_from_index_node.js')();   // the engine block of index.html
const test = `
const SHORT = { koto: 1, shamisen: 1, musicbox: 1, glock: 1 };
let rubs = 0, examples = [], sigs = {}, dens = {};
for (const id of ['lobby', 'onsen', 'dining', 'garden', 'fest', 'title']) {
  const sd = _auSong(id);
  for (let si = 0; si < sd.form.length; si++) for (let pass = 0; pass < 12; pass++) for (const night of [false, true]) for (let star = 1; star <= 5; star++) {
    const sec = _auCompile(id, si, pass, night, star);
    sigs[sec.sig] = 1;
    const k = id + (sec.night ? ' night' : ' day') + ' *' + star, d = dens[k] = dens[k] || { v: 0, s: 0 };
    d.v += sec.ev.reduce((a, e) => a + e.n, 0); d.s += sec.len * sec.dt;
    const notes = [];
    for (const e of sec.ev) for (const m of (Array.isArray(e.m) ? e.m : [e.m])) if (m > 0) notes.push({ s: e.s, l: SHORT[e.i] ? Math.min(e.l, 3) : e.l, m, y: e.y });
    for (let a = 0; a < notes.length; a++) for (let b = a + 1; b < notes.length; b++) {
      const x = notes[a], y = notes[b];
      if (x.y === y.y && x.y !== 'lead' && x.y !== 'counter') continue;
      if (Math.min(x.s + x.l, y.s + y.l) - Math.max(x.s, y.s) <= 0) continue;
      const hi = x.m > y.m ? x : y, lo = x.m > y.m ? y : x;
      if ((hi.m - lo.m) % 12 === 1) { rubs++; if (examples.length < 10) examples.push(sec.sig + ' step ' + Math.max(x.s, y.s) + ' ' + lo.y + ':' + lo.m + ' / ' + hi.y + ':' + hi.m); }
    }
  }
}
RESULT.rubs = rubs; RESULT.examples = examples; RESULT.sigs = Object.keys(sigs).length;
RESULT.density = Object.fromEntries(Object.entries(dens).map(([k, d]) => [k, +(d.v / d.s).toFixed(1)]));
`;
const RESULT = {};
const sb = { console, Math, RESULT, performance: { now: () => 0 }, window: {}, document: { addEventListener() {} } };
vm.createContext(sb); vm.runInContext(eng + '\n' + test, sb);
console.log('distinct section signatures:', RESULT.sigs);
console.log('voices per second (one player):', JSON.stringify(RESULT.density));
console.log('minor-2nd / minor-9th rubs:', RESULT.rubs, RESULT.examples.join(' | '));
console.log(RESULT.rubs === 0 ? 'THEORY CHECK OK' : 'THEORY CHECK FAILED');
process.exitCode = RESULT.rubs === 0 ? 0 : 1;
