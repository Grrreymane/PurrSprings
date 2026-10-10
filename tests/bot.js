// Headless balance bot (pasted into the game closure by _workflow/tools/headless.js):
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/bot.js --seed 1 -- eager
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/bot.js --seed 1 -- casual
// A player who follows the guide arrow: every `react` seconds it reads guideTarget() and walks the BFS path
// (findPath) there through botMove. 'eager' = 0.3 s reaction, always on task; 'casual' = 1 s reaction and
// 30% of the time wandering or standing still. Records the game time of every unlock, the angry-guest rate
// after the receptionist is hired, the longest stretch without earning, and checks the SPEC 7 invariants
// every simulated second. Extra args: [profile] [max minutes] [json]
const PROFILE = ARGS[0] || 'eager', MAXMIN = +ARGS[1] || 50, JSONOUT = ARGS.includes('json');
const PROF = { eager: { react: .3, distract: 0 }, casual: { react: 1, distract: .3 } }[PROFILE] || { react: .3, distract: 0 };
const DT = 1 / 30;
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
newGame();
// ---------------------------------------------------------------- driver
let path = [], key = '', think = 0, mode = 'follow', episode = 0, stuckT = 0, lastPos = [P.x, P.y], stuckN = 0;
function randomTile() {
  for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * 15), ty = Math.floor(Math.random() * 34); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } }
  return [];
}
function drive(dt) {
  episode -= dt;
  if (episode <= 0) {
    episode = 3 + Math.random() * 5;
    const was = mode;
    mode = Math.random() < PROF.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow';
    if (mode !== was) { path = []; key = ''; think = 0; if (mode === 'wander') path = randomTile(); }
  }
  think -= dt;
  if (think <= 0 && mode === 'follow') {
    think = PROF.react;
    const t = S.tut.moved ? guideTarget() : { tx: 7, ty: 24 };   // first steps: walk up into the lobby (the hand hint)
    if (!t || t.here) { path = []; key = ''; }
    else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; }
  }
  if (path.length) {
    const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { path.shift(); if (!path.length) key = key; }
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    // stuck on a corner for 1.5 s -> re-plan from where we are
    if (Math.hypot(P.x - lastPos[0], P.y - lastPos[1]) < .2) { stuckT += dt; if (stuckT > 1.5) { stuckN++; stuckT = 0; key = ''; think = 0; path = []; } } else stuckT = 0;
  } else { botMove = null; stuckT = 0; }
  lastPos = [P.x, P.y];
}
// ---------------------------------------------------------------- bookkeeping
const unlockT = {}, inv = {}, flag = (k, m) => { inv[k] = inv[k] || { n: 0, first: m }; inv[k].n++; };
let lastEarned = 0, lastEarnAt = 0, maxGap = 0, maxGapAt = 0, recepAt = null, base = null, renderErr = 0, peakQueue = 0;
const t0 = () => S.stats.time;
function checkSecond() {
  const t = t0();
  if (!Number.isFinite(S.money) || S.money < 0 || S.money !== Math.floor(S.money)) flag('money', mmss(t) + ' ' + S.money);
  const perRoom = {}, perSlot = {};
  for (const gu of GUESTS) {
    if (gu.room) perRoom[gu.room] = (perRoom[gu.room] || 0) + 1;
    if (gu.slot >= 0) perSlot[gu.slot] = (perSlot[gu.slot] || 0) + 1;
    if (gu.t > 120 && gu.st !== 'sleep' && gu.st !== 'bathing') flag('stuck-guest', mmss(t) + ' ' + gu.st + ' ' + R(gu.t) + 's at ' + R(gu.x) + ',' + R(gu.y));
    if (!Number.isFinite(gu.x) || !Number.isFinite(gu.y)) flag('guest-nan', mmss(t));
  }
  for (const k in perRoom) if (perRoom[k] > 1) flag('room-shared', mmss(t) + ' ' + k);
  for (const k in perSlot) if (perSlot[k] > 1) flag('slot-shared', mmss(t) + ' ' + k);
  for (let i = 0; i < SLOT_OCC.length; i++) if (SLOT_OCC[i] && !GUESTS.includes(SLOT_OCC[i])) flag('slot-leak', mmss(t) + ' slot ' + i);
  for (const rm of ROOMS) if (RT[rm.id].guest && !GUESTS.includes(RT[rm.id].guest)) flag('room-leak', mmss(t) + ' ' + rm.id);
  if (S.basket < 0 || S.basket > 10 || S.basket !== Math.floor(S.basket)) flag('basket', mmss(t) + ' ' + S.basket);
  if (boxHit(P.x, P.y)) flag('player-in-wall', mmss(t) + ' ' + R(P.x) + ',' + R(P.y));
  try { render(); } catch (e) { renderErr++; flag('render', String(e && e.message || e)); }
  peakQueue = Math.max(peakQueue, Q.length);
}
// ---------------------------------------------------------------- run
const steps = Math.round(MAXMIN * 60 / DT);
let lastSec = -1, fin = null;
for (let i = 0; i < steps; i++) {
  drive(DT);
  update(DT);
  if (state === 'celebrate') { S.done = true; go('play'); }
  const t = t0();
  for (const u of UNLOCKS) if (S.unlocked[u.id] && unlockT[u.id] === undefined) unlockT[u.id] = t;
  if (S.unlocked.recep && recepAt === null) { recepAt = t; base = { g: S.stats.guests, a: S.stats.angry }; }
  if (S.earned > lastEarned) { lastEarned = S.earned; lastEarnAt = t; }
  if (!fin && t - lastEarnAt > maxGap) { maxGap = t - lastEarnAt; maxGapAt = lastEarnAt; }
  if (Math.floor(t) !== lastSec) { lastSec = Math.floor(t); checkSecond(); }
  if (S.unlocked.sign && !fin) { fin = t; break; }
}
// ---------------------------------------------------------------- report
const order = UNLOCKS.filter(u => unlockT[u.id] !== undefined).sort((a, b) => unlockT[a.id] - unlockT[b.id]);
let prev = 0, gapEarly = 0, gapLate = 0, gapEarlyAt = '', gapLateAt = '';
for (const u of order) { const gp = unlockT[u.id] - prev; if (unlockT[u.id] <= 300) { if (gp > gapEarly) { gapEarly = gp; gapEarlyAt = u.id; } } else if (gp > gapLate) { gapLate = gp; gapLateAt = u.id; } prev = unlockT[u.id]; }
const ga = base ? S.stats.guests - base.g : 0, aa = base ? S.stats.angry - base.a : 0, angryRate = ga + aa ? aa / (ga + aa) : 0;
const r2 = unlockT.room2;
const checks = PROFILE === 'eager'
  ? [['room2 30-60s', r2 !== undefined && r2 >= 30 && r2 <= 60], ['gaps<=60 first 5m', gapEarly <= 60], ['gaps<=120 after', gapLate <= 120], ['5star 15-25m', fin && fin >= 900 && fin <= 1500], ['angry<10% w/ recep', angryRate < .1]]
  : [['5star <=40m', fin && fin <= 2400], ['earn gap <90s', maxGap < 90]];
const invOk = Object.keys(inv).length === 0;
if (JSONOUT) console.log(JSON.stringify({ profile: PROFILE, fin, unlockT, gapEarly, gapLate, angryRate, maxGap, inv, stuckN }));
else {
  console.log(`${PROFILE} ★5 ${fin ? mmss(fin) : 'NOT REACHED (' + mmss(t0()) + ', ' + Object.keys(S.unlocked).length + ' unlocked)'} | room2 ${r2 !== undefined ? mmss(r2) : '-'} | gap≤5m ${R(gapEarly)}s(${gapEarlyAt}) >5m ${R(gapLate)}s(${gapLateAt}) | angry ${(angryRate * 100).toFixed(1)}% (${aa}/${ga + aa} after recep; total ${S.stats.angry}/${S.stats.guests + S.stats.angry}) | earn-gap ${R(maxGap)}s@${mmss(maxGapAt)} | peakQ ${peakQueue} | stuck ${stuckN} | inv ${invOk ? 'OK' : 'FAIL'}`);
  console.log('  ' + order.map(u => mmss(unlockT[u.id]) + ' ' + u.id).join(', '));
  console.log('  checks: ' + checks.map(([n, ok]) => (ok ? 'ok ' : 'NO ') + n).join(' | '));
  for (const k in inv) console.log('  INVARIANT ' + k + ' x' + inv[k].n + ' first: ' + inv[k].first);
}
if (!invOk) process.exitCode = 1;
