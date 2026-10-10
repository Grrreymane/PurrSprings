// SPEC_v2 4.2: calls (ring for service) - needs 茶台; rolled 1 s after lying down by the room's trait (standard 30% tea,
// near-onsen 35% milk, quiet 35% night snack, cottage 40% tea) and 20% milk when a bather gets in; milk / snack fall
// back to tea; at most 2 (3 from star 3), 6 s apart; CALL_T 50 s (60 from star 4; stage 4: was 40 / 50); the call rides along with the
// guest; reward 3 x room fee x Q (x1.5 in the first half) straight into the wallet + ♥1 (fast ♥2); timing out costs
// nothing; staff never take calls.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_calls.js --seed 5
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + a.toFixed(3) + ' (want ' + b + ' +- ' + tol + ')');
const DT = 1 / 30;
function st(list, peak) {
  S = defaults(); for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), peak || 1); resetWorld(); go('play'); spawnT = 1e9;
}
function guest(s, o) { addGuest(o && o.type || 'regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, { st: s, t: 0, inside: true }, o || {}); return gu; }
// one guest lies down in room `rid`; returns the kind it called for (or null)
function rollRoom(rid) {
  GUESTS.length = 0; lastCallAt = -99; RT[rid].guest = null;
  const rm = ROOM[rid], gu = guest('sleep', { room: rid, tt: SLEEP_T, x: tcx(rm.stand), y: tcy(rm.stand) }); RT[rid].guest = gu; S.rooms[rid] = 'occupied';
  updGuest(gu, .5); const before = gu.call; updGuest(gu, .55);
  return before ? 'EARLY' : gu.call ? gu.call.k : null;
}
function freq(rid, n) { const c = {}; for (let i = 0; i < n; i++) { const k = rollRoom(rid) || 'none'; c[k] = (c[k] || 0) + 1; } return c; }
const ALL3 = ['room2', 'room3', 'onsen', 'recep', 'tea', 'room4', 'room5', 'room6', 'room7', 'maid1', 'dining', 'w1'];
const N = 1500;
// ---- no 茶台, no calls
st(['room2', 'room3', 'onsen', 'recep'], 2); { const c = freq('room1', 200); eq(c.none, 200, 'no calls before 茶台'); }
// ---- per-trait odds, 1 s after lying down (never before)
st(ALL3.concat(['milk', 'garden']), 4);
{ const c = freq('room1', N); ok(!c.EARLY, 'no call in the first second'); near((c.tea || 0) / N, .3, .04, 'standard room: 30% tea'); eq(Object.keys(c).filter(k => k !== 'tea' && k !== 'none').length, 0, 'standard room calls only tea'); }
{ const c = freq('room7', N); near((c.milk || 0) / N, .35, .04, 'near-onsen room: 35% milk'); }
{ const c = freq('w1', N); near((c.rice || 0) / N, .35, .04, 'quiet room: 35% night snack'); }
{ const c = freq('c1', N); near((c.tea || 0) / N, .4, .04, 'cottage: 40% tea'); }
// ---- fallbacks: milk without 牛奶, a snack without the dining hall -> tea
st(['room2', 'room3', 'onsen', 'recep', 'tea', 'room4', 'room5', 'room6', 'room7'], 2);
{ const c = freq('room7', 400); ok(!c.milk && (c.tea || 0) > 80, 'near-onsen without milk -> tea (' + JSON.stringify(c) + ')'); }
{ const gu = guest('toBath'); lastCallAt = -99; ok(tryCall(gu, 'rice', 1) && gu.call.k === 'tea', 'snack without dining -> tea'); }
// ---- a bather asks for milk 20% of the time as it gets in
st(ALL3.concat(['milk']), 3);
{ let n = 0; const M = 1000;
  for (let i = 0; i < M; i++) {
    GUESTS.length = 0; SLOT_OCC.fill(null); lastCallAt = -99;
    const gu = guest('toSlot', { slot: 0, x: SLOTS[0].x * 16 + 8, y: 4 * 16 + 8 }); SLOT_OCC[0] = gu; gu.path = []; gu.goal = null;
    updGuest(gu, DT); if (gu.st !== 'bathing') { ok(false, 'bather did not get in'); break; }
    if (gu.call && gu.call.k === 'milk') n++;
  }
  near(n / M, .2, .035, 'bather: 20% milk'); }
// ---- caps and spacing: 2 at a time at star 2, 3 from star 3; 6 s apart
st(['room2', 'room3', 'onsen', 'recep', 'tea'], 2);
{ const g = [0, 1, 2, 3].map(() => guest('toBath')); lastCallAt = -99;
  ok(tryCall(g[0], 'tea', 1), 'first call'); ok(!tryCall(g[1], 'tea', 1), 'second call within 6 s refused');
  S.stats.time += 6.1; ok(tryCall(g[1], 'tea', 1), 'second call after 6 s'); S.stats.time += 7; ok(!tryCall(g[2], 'tea', 1), 'star 2: no third call'); eq(callMax(), 2, 'callMax star 2'); eq(callT(), 50, 'CALL_T 50'); }
st(ALL3, 3);
{ const g = [0, 1, 2, 3].map(() => guest('toBath')); lastCallAt = -99;
  for (let i = 0; i < 3; i++) { ok(tryCall(g[i], 'tea', 1), 'star 3 call ' + (i + 1)); S.stats.time += 6.1; }
  ok(!tryCall(g[3], 'tea', 1), 'star 3: no fourth call'); eq(callCount(), 3, 'three open calls'); }
st(ALL3.concat(['garden']), 4); eq(callT(), 60, 'CALL_T 60 from star 4');
// ---- the call rides along: a sleeper wakes, checks out, walks on - the call stays until served or timed out
st(['room2', 'room3', 'onsen', 'recep', 'tea'], 2);
{ const rm = ROOM.room1, gu = guest('sleep', { room: 'room1', tt: 3, x: tcx(rm.stand), y: tcy(rm.stand) }); RT.room1.guest = gu; S.rooms.room1 = 'occupied';
  lastCallAt = -99; tryCall(gu, 'tea', 1); const m0 = S.money, h0 = S.hearts;
  P.x = 40; P.y = 560;   // far away
  for (let i = 0; i < 30 * 10; i++) updGuest(gu, DT);
  ok(gu.st !== 'sleep' && gu.call && gu.call.k === 'tea', 'call still open after waking (' + gu.st + ')');
  for (let i = 0; i < 30 * (callT() - 9); i++) updGuest(gu, DT);
  ok(!gu.call, 'timed out at CALL_T'); eq(S.money, m0, 'no money lost'); ok(S.hearts >= h0, 'no ♥ lost (a happy leave still gives one)'); ok(gu.st !== 'angry', 'not angry'); eq(RUN.callsMissed, 1, 'counted as missed'); }
// ---- reward: 3 x room x Q, x1.5 in the first half; gold stars +5% each
st(['room2', 'room3', 'onsen', 'recep', 'tea', 'shop', 'd_scroll', 'd_ikebana'], 2);
{ S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana';
  const Qv = qualityQ(); ok(Qv > 1, 'Q > 1 with a combo room');
  eq(callReward(false), Math.round(3 * 14 * Qv), 'normal reward'); eq(callReward(true), Math.round(3 * 14 * Qv * 1.5), 'fast reward');
  const gu = guest('toBath'); lastCallAt = -99; tryCall(gu, 'tea', 1); gu.call.t = gu.call.max / 2 - .1;   // past half time: normal
  const m0 = S.money, h0 = S.hearts; P.tray = ['tea']; serveCall(gu);
  eq(S.money - m0, callReward(false), 'slow serve pays normal'); eq(S.hearts - h0, 1, 'slow serve ♥1'); eq(S.stats.callsFast, 0, 'not fast'); }
// ---- staff never take calls: a fully staffed inn with the innkeeper parked in a corner
st(UNLOCKS.filter(u => !u.need5 && u.id !== 'roten').map(u => u.id), 4); S.basket = 10; spawnT = 1;
{ P.x = 40; P.y = 34 * 16 + 4; let made = 0; for (let i = 0; i < 30 * 300; i++) { update(DT); } made = RUN.calls;
  ok(made > 3, 'calls were made: ' + made); eq(S.stats.calls, 0, 'nobody but the innkeeper serves a call'); ok(callCount() <= callMax(), 'cap held'); }
console.log(errs.length ? 'SYS CALLS FAIL\n  ' + errs.join('\n  ') : 'SYS CALLS OK');
if (errs.length) process.exitCode = 1;
