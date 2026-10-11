// Music scheduler check (SPEC 14.4 music_check), standalone: node D:/Minigame/Hotelgame/tools/audio/music_check.js
// Runs the audio engine (index.html AUDIO block) "dry" (no WebAudio, like headless.js) for 75 minutes per scenario: a player wandering between
// areas with the 6-minute day / night cycle at star 5 and the v2.1 calendar (a season = 3 days; each season's festival
// on its 2nd day from clock 0.62 for 72 s, passed as fest: true; the plaza at night and the shrine are areas too).
// Checks: song changes per minute <= 4, new voices per second <= 24, the same section (song + section + variation +
// arrangement + layers) never comes back within 6 minutes, and the song follows what is wanted (area song / fest)
// within 22 s of it staying the same.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const eng = require('./engine_from_index_node.js')();   // the engine block of index.html
const AREA_MUSIC = { front: 'lobby', lobby: 'lobby', main: 'lobby', shop: 'lobby', west: 'lobby', onsen: 'onsen', roten: 'onsen', dining: 'dining', garden: 'garden',
  shrine: 'garden', plaza: 'lobby' };
const test = `
const AREA_MUSIC = ${JSON.stringify(AREA_MUSIC)}, areas = Object.keys(AREA_MUSIC);
let seed = ARGS.seed; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const KEY = [[0, 1], [.06, .6], [.10, 0], [.55, 0], [.62, 0], [.68, .3], [.74, 1], [1, 1]];   // SPEC 4.10 night curve
const nightAt = c => { for (let i = 1; i < KEY.length; i++) if (c <= KEY[i][0]) { const a = KEY[i - 1], b = KEY[i]; return a[1] + (b[1] - a[1]) * (c - a[0]) / (b[0] - a[0]); } return 1; };
const dt = 1 / 30, T = ARGS.minutes * 60;
let area = 'lobby', next = 0, clock = .12, day = 1, last = {}, minGap = 1e9, minGapSig = '', sw = [], vmax = 0, lastKey = '';
let wantS = null, wantT = 0, lag = 0, festS = 0, seasons = {}, plazaFest = 0;
musicWant({ song: 'title', night: 0, star: 5 });
for (let i = 0; i < 60; i++) musicTick(dt);
for (let t = 0; t < T; t += dt) {
  if (t >= next) { area = areas[Math.floor(rnd() * areas.length)]; next = t + ARGS.dwell[0] + rnd() * (ARGS.dwell[1] - ARGS.dwell[0]); }
  clock += dt / 360; if (clock >= 1) { clock -= 1; day++; }
  const season = Math.floor((day - 1) / 3) % 4, fest = day % 3 === 2 && clock >= .62 && clock < .62 + 72 / 360, night = nightAt(clock);
  musicWant({ song: AREA_MUSIC[area], night, star: 5, menu: false, area, season, fest });
  musicTick(dt);
  seasons[season] = 1; if (fest) festS += dt;
  // what should be playing: fest during a festival, or in the plaza once the night arrangement has flipped (night > 0.6)
  const w = fest || (area === 'plaza' && _auNight) ? 'fest' : AREA_MUSIC[area];
  if (w !== wantS) { wantS = w; wantT = t; }
  if (MUSIC_DBG.song !== w) lag = Math.max(lag, t - wantT);
  if (area === 'plaza' && MUSIC_DBG.song === 'fest' && !fest) plazaFest += dt;
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
  minRepeatGapS: Math.round(minGap), sectionsHeard: Object.keys(last).length, seasons: Object.keys(seasons).length, festivalS: Math.round(festS),
  plazaNightFestS: Math.round(plazaFest), maxLagS: +lag.toFixed(1), ok: perMin <= 4 && vmax <= 24 && minGap >= 360 && lag <= 22 });
`;
const RESULT = [];
for (const dwell of [[3, 8], [10, 30], [30, 120], [60, 300], [3600, 3600]]) {
  const sb = { console, Math, RESULT, ARGS: { seed: 7, minutes: 75, dwell }, performance: { now: () => 0 }, window: {}, document: { addEventListener() {} } };
  vm.createContext(sb); vm.runInContext(eng + '\n' + test, sb);
}
for (const r of RESULT) console.log(JSON.stringify(r));
console.log(RESULT.every(r => r.ok) ? 'MUSIC CHECK OK' : 'MUSIC CHECK FAILED');
process.exitCode = RESULT.every(r => r.ok) ? 0 : 1;
