// SPEC_v2 4.2: calls (ring for service) - needs 茶台; rolled 1 s after lying down by the room's trait (standard 30% tea,
// near-onsen 35% milk, quiet 35% night snack, cottage 40% tea); milk / snack fall back to tea; at most 2 (3 from star 3),
// 6 s apart; CALL_T 50 s (60 from star 4; stage 4: was 40 / 50); the call rides along with the guest; reward 3 x room fee
// x Q (x1.5 in the first 30 %) straight into the wallet + ♥1 (fast ♥2); timing out costs nothing.
// v2.0.1 G3: bathers no longer call (they buy milk at the machine and never wait there); a call ends quietly when the
// guest gets the thing by itself (a cup at the urn, milk at the machine, breakfast); before the tea runner (茶房) is
// hired a call is an optional tip the arrow never points at; once hired the runner brings them (tip x TEA_TIP_K into
// the cash box) and the innkeeper's tray no longer picks up for them.
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
// ---- a bather never calls (G3: it buys milk at the machine itself)
st(ALL3.concat(['milk']), 3);
{ let n = 0; const M = 300;
  for (let i = 0; i < M; i++) {
    GUESTS.length = 0; SLOT_OCC.fill(null); lastCallAt = -99;
    const gu = guest('toSlot', { slot: 0, x: SLOTS[0].x * 16 + 8, y: 4 * 16 + 8 }); SLOT_OCC[0] = gu; gu.path = []; gu.goal = null;
    updGuest(gu, DT); if (gu.st !== 'bathing') { ok(false, 'bather did not get in'); break; }
    if (gu.call) n++;
  }
  eq(n, 0, 'bathers never call'); }
// ---- a call ends quietly when the guest gets it by itself: milk at the machine (no waiting there), a cup at the urn
st(ALL3.concat(['milk']), 3);
{ const gu = guest('milk', { tt: MILK_T, x: tcx(MILK_SPOT), y: tcy(MILK_SPOT) }); lastCallAt = -99; tryCall(gu, 'milk', 1); const m0 = S.money, h0 = S.hearts;
  for (let i = 0; i < 30 * 2; i++) updGuest(gu, DT);
  ok(gu.st !== 'milk', 'nobody waits at the milk machine (' + gu.st + ')'); ok(!gu.call, 'the milk call ended at the machine'); eq(S.money, m0, 'no tip'); eq(RUN.callsMissed, 0, 'not a miss');
  const g2 = guest('tea', { tt: TEA_T, x: tcx(TEA_SPOT), y: tcy(TEA_SPOT) }); S.stats.time += 7; tryCall(g2, 'tea', 1); const t0 = S.piles.tea || 0;
  for (let i = 0; i < 30 * 2; i++) updGuest(g2, DT);
  ok(!g2.call && (S.piles.tea || 0) - t0 === fee('tea', { gu: g2 }), 'a cup at the urn: the tea call ended, the cup paid into the tea pile'); ok(RUN.callsSelf === 2, 'two self-served: ' + RUN.callsSelf); }
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
  TEA_AT.occ = {};   // the urn spot is taken: this guest skips its cup (a cup would end the call, see above)
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
// ---- no tea runner: nobody but the innkeeper serves a call, and the arrow never sends you for one (a fully staffed inn,
// the innkeeper parked in a corner)
st(UNLOCKS.filter(u => !u.need5 && u.id !== 'roten' && u.id !== 'teaboy').map(u => u.id), 4); S.basket = 10; spawnT = 1; S.stats.vips = 1;
{ P.x = 40; P.y = 34 * 16 + 4; let pointed = 0; for (let i = 0; i < 30 * 300; i++) { update(DT); if (GUIDE && (GUIDE.kind === 'urn' || GUIDE.kind === 'milk') && !GUIDE.vip) pointed++; }
  ok(RUN.calls > 3, 'calls were made: ' + RUN.calls); eq(S.stats.calls, 0, 'nobody but the innkeeper serves a call'); ok(callCount() <= callMax(), 'cap held'); eq(pointed, 0, 'the arrow never points at a pick-up for a call'); }
// ---- the tea runner: brings the calls, the tip (x TEA_TIP_K, never fast) goes into the cash box, not your wallet
st(UNLOCKS.filter(u => !u.need5 && u.id !== 'roten').map(u => u.id), 4); S.basket = 10; spawnT = 1; S.stats.vips = 1;
{ const rn = STAFF.find(s => s.role === 'tea'); ok(!!rn, 'the runner is on staff');
  P.x = 40; P.y = 34 * 16 + 4; const m0 = S.money; for (let i = 0; i < 30 * 300; i++) update(DT);
  ok(RUN.callsStaff >= 5, 'the runner brought calls: ' + RUN.callsStaff + ' of ' + RUN.calls); eq(S.money, m0, 'no call money into the wallet'); ok((S.piles.recep || 0) > 0, 'tips in the cash box');
  ok(RUN.callsStaff / Math.max(1, RUN.callsStaff + RUN.callsMissed) >= .7, 'it keeps up: ' + RUN.callsStaff + ' brought, ' + RUN.callsMissed + ' missed');
  const gu = guest('toBath'); S.stats.time += 7; tryCall(gu, 'tea', 1); const t0 = S.piles.recep || 0, f0 = S.stats.callsFast; serveCall(gu, rn);
  eq((S.piles.recep || 0) - t0, Math.round(callReward(false) * TEA_TIP_K), 'runner tip = TEA_TIP_K x the normal reward'); eq(S.stats.callsFast, f0, 'never fast');
  // your tray no longer picks up for calls: a call open, you at the urn
  GUESTS.length = 0; VIPG = null; vipT = 1e9; spawnT = 1e9; const g3 = guest('toBath', { x: 40, y: 560 }); S.stats.time += 7; tryCall(g3, 'tea', 1); STAFF.splice(STAFF.indexOf(rn), 1);
  P.x = tcx(SPOT.urn1); P.y = tcy(SPOT.urn1); P.tray = []; for (let i = 0; i < 30; i++) update(DT); eq(P.tray.length, 0, 'runner hired: you pick up nothing for a call'); }
console.log(errs.length ? 'SYS CALLS FAIL\n  ' + errs.join('\n  ') : 'SYS CALLS OK');
if (errs.length) process.exitCode = 1;
