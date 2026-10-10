// SPEC_v2 14.4 music_check: reads MUSIC_DBG (the audio engine, merged into index.html's AUDIO block in stage M) while
// the innkeeper walks around the real game. Headless has no AudioContext, so the engine runs "dry" on musicTick(dt)
// (the game calls audioTick -> musicWant + musicTick every frame). Checks (9 / 13 / 14.4):
//   - song changes per minute (any 60 s window) <= 4 while walking between areas (the title and the star-5 fest switch at
//     once by design - engine: 0.25 s - and are counted apart)
//   - new voices per second <= 24
//   - the same section (song + section + variation + arrangement + layers = its sig) never comes back within 6 minutes
//   - the song follows the area (title / fest / area music) once the switch has had time to land
// Phase 1: an eager guide-follower plays a new game to star 5 and 8 minutes on. Phase 2: everything open (star 5, night
// and day), a wanderer walks to a random area every 3-30 s for 30 minutes (the worst case for switching).
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/music_check.js --seed 1 [-- strict]
// Until the engine is spliced in there is no MUSIC_DBG: prints MUSIC CHECK SKIPPED and exits 0 (exit 1 with 'strict').
if (typeof MUSIC_DBG === 'undefined') {
  console.log('MUSIC CHECK SKIPPED: no MUSIC_DBG (no v2 audio engine in index.html)');
  if (ARGS.includes('strict')) process.exitCode = 1;
} else {
  const DT = 1 / 30, errs = [], bad = m => { if (errs.length < 20) errs.push(m); };
  const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  // ---- what we watch, every frame
  const FAST = new Set(['title', 'fest', null, undefined]);
  const swT = [], lastSig = {}; let swFast = 0, prevSong = null, swSeen = 0, vMax = 0, minGap = 1e9, minGapSig = '', secKey = '', clockT = 0, lastWant = null, wantSince = 0, lagMax = 0, sections = 0;
  function watch(tag) {
    clockT += DT;
    const D = MUSIC_DBG;
    // a switch between two area songs (title / fest / silence switch at once by design and are counted apart)
    while (D.switches > swSeen) { swSeen++; const to = typeof _auW !== 'undefined' ? _auW.song : D.song; if (FAST.has(prevSong) || FAST.has(to)) swFast++; else swT.push(clockT); }
    prevSong = D.song;
    vMax = Math.max(vMax, D.voicesPerSec | 0);
    // the section being played: the engine's current player (between two sections its `sec` is empty for a moment - skip)
    const hasCur = typeof _auCur === 'function', c = hasCur ? _auCur() : null;
    const sig = hasCur ? (c && c.sec ? c.sec.sig : '') : D.sig, at = c && c.sec ? c.secT : null;
    const k = sig + '@' + (at !== null ? at.toFixed(3) : D.section + D.pass);
    if (sig && k !== secKey) {
      secKey = k; sections++;
      const now = at !== null ? at : D.t;
      if (lastSig[sig] !== undefined && now - lastSig[sig] < minGap) { minGap = now - lastSig[sig]; minGapSig = sig + ' (' + tag + ' ' + mmss(clockT) + ')'; }
      lastSig[sig] = now;
    }
    // the song follows what the game asks for (area / title / fest): once that has stayed the same for the longest switch
    // delay (1.5 s debounce + 15 s between area switches + the next bar line, ~20 s) the song must be it
    const a = areaAt(Math.floor(P.x / TILE), Math.floor(P.y / TILE)), want = state === 'title' ? 'title' : state === 'celebrate' ? 'fest' : a ? a.music : 'lobby';
    if (want !== lastWant) { lastWant = want; wantSince = clockT; }
    if (D.song !== want) lagMax = Math.max(lagMax, clockT - wantSince);
  }
  // ---- phase 1: an eager guide follower, new game -> star 5 -> 8 more minutes
  let path = [], key = '', think = 0;
  function follow(dt) {
    think -= dt;
    if (think <= 0) {
      think = .3;
      const t = S.tut.moved ? GUIDE : { tx: 17, ty: 24, key: 'start' };
      if (!t || t.here) { path = []; key = ''; }
      else if (t.key + t.tx + ',' + t.ty !== key || !path.length) { key = t.key + t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; }
    }
    step();
  }
  function step() {
    if (path.length) {
      const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
      if (d < 1.5) path.shift();
      botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    } else botMove = null;
  }
  for (let i = 0; i < 90; i++) { update(DT); watch('title'); }   // the title song first
  newGame();
  let fin = null;
  for (let i = 0; i < 45 * 60 * 30; i++) {
    follow(DT); update(DT); watch('play');
    if (state === 'celebrate' && st > 4) { S.done = true; go('play'); }   // hear a few seconds of fest
    if (star() >= 5 && fin === null) fin = S.stats.time;
    if (fin !== null && S.stats.time - fin > 8 * 60) break;
  }
  if (fin === null) bad('phase 1: the follower never reached star 5');
  const p1 = { switches: swT.length, sections, vMax, minGap: minGap < 1e9 ? Math.round(minGap) : "--" };
  // ---- phase 2: everything open, a wanderer between areas (3-30 s per area), day and night
  for (const u of UNLOCKS) if (!u.need5) { S.unlocked[u.id] = true; S.paid[u.id] = u.price; }
  for (const rm of ROOMS) if (roomOpen(rm) && !S.rooms[rm.id]) S.rooms[rm.id] = 'clean';
  S.peak = 5; S.done = true; resetWorld(); go('play');
  const spots = AREAS.filter(a => areaOpen(a)).map(a => { for (let k = 0; k < 400; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (areaAt(tx, ty) === a && walkable(tx, ty)) return [tx, ty]; } return null; }).filter(Boolean);
  let dwell = 0;
  for (let i = 0; i < 30 * 60 * 30; i++) {
    dwell -= DT;
    if (dwell <= 0 || !path.length) {
      if (dwell <= 0) dwell = 3 + Math.random() * 27;
      const g = spots[Math.floor(Math.random() * spots.length)], [sx, sy] = tileOf(P); path = findPath(sx, sy, g[0], g[1]) || [];
    }
    step(); update(DT); watch('wander');
    if (state === 'celebrate') { S.done = true; go('play'); }
  }
  // ---- report
  let perMin = 0; for (let i = 0; i < swT.length; i++) { let n = 0; for (let j = i; j < swT.length && swT[j] < swT[i] + 60; j++) n++; perMin = Math.max(perMin, n); }
  if (perMin > 4) bad('area song changes per minute ' + perMin + ' (max 4)');
  if (vMax > 24) bad('new voices per second ' + vMax + ' (max 24)');
  if (minGap < 360) bad('the same section came back after ' + Math.round(minGap) + ' s (min 360): ' + minGapSig);
  if (lagMax > 22) bad('the song lagged ' + lagMax.toFixed(1) + ' s behind an area you stayed in (max 22)');
  console.log(`phase 1 (new game -> ★5 ${fin !== null ? mmss(fin) : '--'} + 8 min): ${p1.switches} song changes, ${p1.sections} sections, voices/s max ${p1.vMax}, closest repeat ${p1.minGap} s`);
  console.log(`all: ${swT.length} area song changes (+ ${swFast} to / from title or fest), max ${perMin}/min (<= 4) | voices/s max ${vMax} (<= 24; engine's own max ${MUSIC_DBG.voicesMax}) | closest repeat of a section ${Math.round(minGap)} s (>= 360) | ${Object.keys(lastSig).length} distinct sections | song behind a steady area max ${lagMax.toFixed(1)} s (<= 22)`);
  console.log(errs.length ? 'MUSIC CHECK FAIL\n  ' + errs.join('\n  ') : 'MUSIC CHECK OK');
  if (errs.length) process.exitCode = 1;
}
