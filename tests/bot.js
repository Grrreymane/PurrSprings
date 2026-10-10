// Headless balance bot (pasted into the game closure by _workflow/tools/headless.js):
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/bot.js --seed 1 -- eager
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/bot.js --seed 1 -- casual
// A player who follows the guide arrow: every `react` seconds it reads guideTarget() and walks the BFS path
// (findPath) there through botMove. 'eager' = 0.3 s reaction, always on task; 'casual' = 1 s reaction and
// 30% of the time wandering or standing still. Records the game time of every unlock, the angry-guest rate
// after the receptionist is hired, the longest stretch without earning, and checks the SPEC 7 invariants
// every simulated second (+ the SPEC_v2 14.3 ones that exist so far). Ends at star 5. Extra args: [profile] [max minutes] [json]
// v2 note: the timing checks print against the v2 targets (SPEC_v2 14.2) but stay informational until the balance stage;
// green = invariants OK and star 5 reached. Every guide kind the bot sees must be one it knows (SPEC_v2 6 / WORKFLOW 5).
const PROFILE = ARGS[0] || 'eager', MAXMIN = +ARGS[1] || 50, JSONOUT = ARGS.includes('json');
const PROF = { eager: { react: .3, distract: 0 }, casual: { react: 1, distract: .3 } }[PROFILE] || { react: .3, distract: 0 };
const DT = 1 / 30;
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
newGame();
// ---------------------------------------------------------------- driver
let path = [], key = '', think = 0, mode = 'follow', episode = 0, stuckT = 0, lastPos = [P.x, P.y], stuckN = 0;
function randomTile() {
  for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } }
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
    const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };   // first steps: walk up into the lobby (the hand hint)
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
// every arrow kind the bot can walk to (stage 2B: slot / vip / suite / tap / photo); an unknown kind is an invariant failure
const KINDS = new Set(['desk', 'clean', 'basket', 'shelf', 'pad', 'pile', 'deliver', 'urn', 'milk', 'pass', 'stove', 'slot', 'vip', 'suite', 'tap', 'photo']);
const kindN = {}; let firstCombo = null, vipMaxSt = 0, vipStT = 0, vipStK = '';
let lastHearts = 0, lastEarned = 0, lastEarnAt = 0, maxGap = 0, maxGapAt = 0, recepAt = null, base = null, renderErr = 0, peakQueue = 0;
const t0 = () => S.stats.time;
function checkSecond() {
  const t = t0();
  if (!Number.isFinite(S.money) || S.money < 0 || S.money !== Math.floor(S.money)) flag('money', mmss(t) + ' ' + S.money);
  const perRoom = {}, perSlot = {};
  for (const gu of GUESTS) {
    if (gu.room) perRoom[gu.room] = (perRoom[gu.room] || 0) + 1;
    if (gu.slot >= 0) perSlot[gu.slot] = (perSlot[gu.slot] || 0) + 1;
    if (gu.t > 180 && gu.st !== 'sleep' && gu.st !== 'bathing' && gu.st !== 'eat') flag('stuck-guest', mmss(t) + ' ' + gu.st + ' ' + R(gu.t) + 's at ' + R(gu.x) + ',' + R(gu.y));
    if (!Number.isFinite(gu.x) || !Number.isFinite(gu.y)) flag('guest-nan', mmss(t));
    // stage 2A (14.3): seats, followers
    if ((gu.st === 'toSeat' || gu.st === 'seated' || gu.st === 'eat') && (gu.seat < 0 || SEAT_OCC[gu.seat] !== gu)) flag('seat-lost', mmss(t) + ' ' + gu.st);
    if (gu.mate && gu.mate.mode === 'follow' && dist(gu.x, gu.y, gu.mate.x, gu.mate.y) > 200) flag('follower-far', mmss(t) + ' ' + gu.st + ' ' + R(dist(gu.x, gu.y, gu.mate.x, gu.mate.y)));
    if (gu.call && !(gu.call.t > 0 && gu.call.t <= gu.call.max)) flag('call-time', mmss(t) + ' ' + gu.call.t);
  }
  // stage 2A (14.3): the tray, calls, seats, the counter
  if (P.tray.length > trayCap() || P.tray.some(k => !TRAY_KINDS.includes(k)) || countK(P.tray, 'kaiseki') > 1) flag('tray', mmss(t) + ' ' + P.tray.join(','));
  if (callCount() > callMax()) flag('calls>max', mmss(t) + ' ' + callCount());
  for (let i = 0; i < SEAT_OCC.length; i++) { const o = SEAT_OCC[i]; if (o && (!GUESTS.includes(o) || (o.seat !== i && o.seat2 !== i))) flag('seat-leak', mmss(t) + ' seat ' + i); }
  if (!(PASS.n >= 0 && PASS.n <= PASS_MAX && PASS.n === Math.floor(PASS.n))) flag('pass', mmss(t) + ' ' + PASS.n);
  for (const s of STAFF) if (s.tray.length > WAITER_CARRY) flag('waiter-tray', mmss(t) + ' ' + s.id + ' ' + s.tray.length);
  for (const k in perRoom) if (perRoom[k] > 1) flag('room-shared', mmss(t) + ' ' + k);
  for (const k in perSlot) if (perSlot[k] > 1) flag('slot-shared', mmss(t) + ' ' + k);
  for (let i = 0; i < SLOT_OCC.length; i++) if (SLOT_OCC[i] && !GUESTS.includes(SLOT_OCC[i])) flag('slot-leak', mmss(t) + ' slot ' + i);
  for (const rm of ROOMS) if (RT[rm.id].guest && !GUESTS.includes(RT[rm.id].guest) && RT[rm.id].guest !== VIPG) flag('room-leak', mmss(t) + ' ' + rm.id);
  // stage 2B (14.3): decor only bought pieces in open rooms; one VIP, any of its states <= 300 s, a following VIP within 200 px
  // or halted; a suite holds at most the VIP; the clerk's bag is never counted twice (fish conservation is in soak.js)
  for (const k in S.decor) { const [rid] = k.split(':'); if (!S.unlocked[S.decor[k]] || !UNLOCK[S.decor[k]].decor || !roomOpen(ROOM[rid]) || ROOM[rid].vip) flag('decor', mmss(t) + ' ' + k + '=' + S.decor[k]); }
  if (VIPG) {
    const v = VIPG, key = v.st + ':' + v.wi; if (key !== vipStK) { vipStK = key; vipStT = t; }
    if (t - vipStT > 300) flag('vip-state>300s', mmss(t) + ' ' + v.st);
    if (v.st === 'follow' && !v.halt && dist(P.x, P.y, v.x, v.y) > 200) flag('vip-far', mmss(t) + ' ' + R(dist(P.x, P.y, v.x, v.y)));
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) flag('vip-nan', mmss(t));
    const [tx, ty] = tileOf(v), a = areaAt(tx, ty);
    if (v.y < MAPH && a && !areaOpen(a)) flag('vip-locked-area', mmss(t) + ' ' + v.st);
    if (v.y < MAPH && !v.moving && BLOCK[ty * MW + tx] && v.st !== 'soak') flag('vip-on-block', mmss(t) + ' ' + v.st + ' ' + tx + ',' + ty);
    if (v.suite && RT[v.suite].guest !== v && v.st !== 'leave') flag('vip-suite', mmss(t) + ' ' + v.st);
  } else vipStK = '';
  for (const rm of SUITES) { const o = RT[rm.id].guest; if (o && o !== VIPG) flag('suite-not-vip', mmss(t) + ' ' + rm.id); }
  if (GUIDE) { kindN[GUIDE.here ? 'here' : GUIDE.kind] = (kindN[GUIDE.here ? 'here' : GUIDE.kind] || 0) + 1; if (!KINDS.has(GUIDE.kind)) flag('unknown-kind', mmss(t) + ' ' + GUIDE.kind); }
  if (firstCombo === null && Object.keys(S.combos).length) firstCombo = t;
  if (S.basket < 0 || S.basket > 10 || S.basket !== Math.floor(S.basket)) flag('basket', mmss(t) + ' ' + S.basket);
  if (boxHit(P.x, P.y)) flag('player-in-wall', mmss(t) + ' ' + R(P.x) + ',' + R(P.y));
  // SPEC_v2 14.3 (the parts that exist in stage 1)
  if (!Number.isFinite(S.hearts) || S.hearts < 0 || S.hearts !== Math.floor(S.hearts)) flag('hearts', mmss(t) + ' ' + S.hearts);
  if (S.hearts < lastHearts) flag('hearts-drop', mmss(t) + ' ' + lastHearts + ' -> ' + S.hearts); lastHearts = S.hearts;
  for (const k in S.piles) if (!Number.isFinite(S.piles[k]) || S.piles[k] < 0 || S.piles[k] !== Math.floor(S.piles[k])) flag('pile', k + ' ' + S.piles[k]);
  if (star() < S.peak) flag('star<peak', mmss(t));
  const prog = [...PADPOS.keys()].filter(id => !UNLOCK[id].decor && !UNLOCK[id].booth).length;
  if (prog > PAD_MAX) flag('pads>4', mmss(t) + ' ' + [...PADPOS.keys()].join(','));
  for (const [id, xy] of PADPOS) if (!findPath(DESK_SPOT[0], DESK_SPOT[1], xy[0], xy[1])) flag('pad-unreachable', mmss(t) + ' ' + id);
  for (const e of GUESTS.concat(STAFF)) {
    const [tx, ty] = tileOf(e), a = areaAt(tx, ty);
    if (e.y < MAPH && a && !areaOpen(a)) flag('in-locked-area', mmss(t) + ' ' + (e.st || e.role) + ' ' + tx + ',' + ty);
    if (e.y < MAPH && !e.moving && BLOCK[ty * MW + tx] && e.st !== 'bathing') flag('on-block', mmss(t) + ' ' + (e.st || e.role) + ' ' + tx + ',' + ty);
  }
  if (GUIDE && !GUIDE.here) { const [sx, sy] = tileOf(P); if (!findPath(sx, sy, GUIDE.tx, GUIDE.ty)) flag('guide-unreachable', mmss(t) + ' ' + GUIDE.kind + ' ' + GUIDE.tx + ',' + GUIDE.ty); }
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
  if (star() >= 5 && !fin) { fin = t; break; }
}
// ---------------------------------------------------------------- report
const order = UNLOCKS.filter(u => unlockT[u.id] !== undefined).sort((a, b) => unlockT[a.id] - unlockT[b.id]);
let prev = 0, gapEarly = 0, gapLate = 0, gapEarlyAt = '', gapLateAt = '';
for (const u of order) { const gp = unlockT[u.id] - prev; if (unlockT[u.id] <= 300) { if (gp > gapEarly) { gapEarly = gp; gapEarlyAt = u.id; } } else if (gp > gapLate) { gapLate = gp; gapLateAt = u.id; } prev = unlockT[u.id]; }
const ga = base ? S.stats.guests - base.g : 0, aa = base ? S.stats.angry - base.a : 0, angryRate = ga + aa ? aa / (ga + aa) : 0;
const r2 = unlockT.room2;
const checks = PROFILE === 'eager'
  ? [['room2 30-60s', r2 !== undefined && r2 >= 30 && r2 <= 60], ['gaps<=60 first 5m', gapEarly <= 60], ['gaps<=120 after', gapLate <= 120], ['5star 21-27m (v2 target)', fin && fin >= 1260 && fin <= 1620], ['angry<10% w/ recep', angryRate < .1]]
  : [['5star <=36m (v2 target)', fin && fin <= 2160], ['earn gap <90s', maxGap < 90]];
const invOk = Object.keys(inv).length === 0;
if (JSONOUT) console.log(JSON.stringify({ profile: PROFILE, fin, unlockT, gapEarly, gapLate, angryRate, maxGap, inv, stuckN }));
else {
  console.log(`${PROFILE} ★5 ${fin ? mmss(fin) : 'NOT REACHED (' + mmss(t0()) + ', ' + Object.keys(S.unlocked).length + ' unlocked)'} | room2 ${r2 !== undefined ? mmss(r2) : '-'} | gap≤5m ${R(gapEarly)}s(${gapEarlyAt}) >5m ${R(gapLate)}s(${gapLateAt}) | angry ${(angryRate * 100).toFixed(1)}% (${aa}/${ga + aa} after recep; total ${S.stats.angry}/${S.stats.guests + S.stats.angry}) | earn-gap ${R(maxGap)}s@${mmss(maxGapAt)} | peakQ ${peakQueue} | stuck ${stuckN} | inv ${invOk ? 'OK' : 'FAIL'}`);
  console.log('  ' + order.map(u => mmss(unlockT[u.id]) + ' ' + u.id).join(', '));
  console.log(`  2A: calls ${RUN.calls} made, ${S.stats.calls} served (${S.stats.callsFast} fast), ${RUN.callsMissed} missed | diners ${RUN.seated} seated, ${S.stats.diners} fed, ${RUN.hungry} hungry | ♥ ${S.hearts} | types ${Object.keys(S.album.types).join(',') || '-'}`);
  const med = a => a.length ? a.slice().sort((x, y) => x - y)[a.length >> 1] : 0, combosNow = GUEST_ROOMS.filter(rm => roomOpen(rm) && roomCombo(rm)).length;
  console.log(`  2B: decor ${Object.keys(S.decor).length} placed, combo rooms ${combosNow}, combos found ${Object.keys(S.combos).join(',') || '-'} (first ${firstCombo === null ? '-' : mmss(firstCombo)}) | VIPs ${RUN.vips} came, ${RUN.vipDone} done, ${RUN.vipLeft} left, med ${R(med(RUN.vipUsed))}s f ${med(RUN.vipF).toFixed(2)}, paid ${RUN.vipPaid} (${(RUN.vipPaid / Math.max(1, S.earned) * 100).toFixed(1)}% of income) | clerk ${RUN.clerk} | Q ${qualityQ().toFixed(2)}`);
  console.log('  arrow: ' + Object.entries(kindN).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ' + n).join(', '));
  console.log('  checks: ' + checks.map(([n, ok]) => (ok ? 'ok ' : 'NO ') + n).join(' | '));
  for (const k in inv) console.log('  INVARIANT ' + k + ' x' + inv[k].n + ' first: ' + inv[k].first);
}
if (!invOk || !fin) process.exitCode = 1;
