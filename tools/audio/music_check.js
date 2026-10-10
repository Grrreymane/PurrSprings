// Music scheduler check (SPEC 14.4 music_check), standalone: node D:/Minigame/Hotelgame/tools/audio/music_check.js
// Runs the audio engine (index.html AUDIO block) "dry" (no WebAudio, like headless.js) for 60 minutes per scenario: a player wandering between
// areas with the 6-minute day / night cycle at star 5. Checks: song changes per minute <= 4, new voices per second <= 24,
// the same section (song + section + variation + arrangement + layers) never comes back within 6 minutes.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const eng = require('./engine_from_index_node.js')();   // the engine block of index.html
const AREA_MUSIC = { front: 'lobby', lobby: 'lobby', main: 'lobby', shop: 'lobby', west: 'lobby', onsen: 'onsen', roten: 'onsen', dining: 'dining', garden: 'garden' };
const test = `
const AREA_MUSIC = ${JSON.stringify(AREA_MUSIC)}, areas = Object.keys(AREA_MUSIC);
let seed = ARGS.seed; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const KEY = [[0, 1], [.06, .6], [.10, 0], [.55, 0], [.62, 0], [.68, .3], [.74, 1], [1, 1]];   // SPEC 4.10 night curve
const nightAt = c => { for (let i = 1; i < KEY.length; i++) if (c <= KEY[i][0]) { const a = KEY[i - 1], b = KEY[i]; return a[1] + (b[1] - a[1]) * (c - a[0]) / (b[0] - a[0]); } return 1; };
const dt = 1 / 30, T = ARGS.minutes * 60;
let area = 'lobby', next = 0, clock = .12, last = {}, minGap = 1e9, minGapSig = '', sw = [], vmax = 0, lastKey = '';
musicWant({ song: 'title', night: 0, star: 5 });
for (let i = 0; i < 60; i++) musicTick(dt);
for (let t = 0; t < T; t += dt) {
  if (t >= next) { area = areas[Math.floor(rnd() * areas.length)]; next = t + ARGS.dwell[0] + rnd() * (ARGS.dwell[1] - ARGS.dwell[0]); }
  clock = (clock + dt / 360) % 1;
  musicWant({ song: AREA_MUSIC[area], night: nightAt(clock), star: 5, menu: false, area });
  musicTick(dt);
  if (MUSIC_DBG.voicesPerSec > vmax) vmax = MUSIC_DBG.voicesPerSec;
  const c = _auCur();
  if (c && c.sec && c.sec.sig + '@' + c.secT !== lastKey) {
    lastKey = c.sec.sig + '@' + c.secT;
    if (last[c.sec.sig] !== undefined && c.secT - last[c.sec.sig] < minGap) { minGap = c.secT - last[c.sec.sig]; minGapSig = c.sec.sig; }
    last[c.sec.sig] = c.secT;
  }
  while (MUSIC_DBG.switches > sw.length) sw.push(t);
}
let perMin = 0; for (let i = 0; i < sw.length; i++) { let n = 0; for (let j = i; j < sw.length && sw[j] < sw[i] + 60; j++) n++; perMin = Math.max(perMin, n); }
RESULT.push({ dwell: ARGS.dwell.join('-') + ' s', switches: sw.length, maxSwitchesPerMin: perMin, maxVoicesPerSec: vmax,
  minRepeatGapS: Math.round(minGap), sectionsHeard: Object.keys(last).length, ok: perMin <= 4 && vmax <= 24 && minGap >= 360 });
`;
const RESULT = [];
for (const dwell of [[3, 8], [10, 30], [30, 120], [60, 300], [3600, 3600]]) {
  const sb = { console, Math, RESULT, ARGS: { seed: 7, minutes: 60, dwell }, performance: { now: () => 0 }, window: {}, document: { addEventListener() {} } };
  vm.createContext(sb); vm.runInContext(eng + '\n' + test, sb);
}
for (const r of RESULT) console.log(JSON.stringify(r));
console.log(RESULT.every(r => r.ok) ? 'MUSIC CHECK OK' : 'MUSIC CHECK FAILED');
process.exitCode = RESULT.every(r => r.ok) ? 0 : 1;
