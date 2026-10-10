// SPEC_v2 4.1: the hand tray - pick-up zones (only what someone wants), capacity (2 + 托盘 x2), putting back, handing
// over within DELIVER_R after DELIVER_T, the stove (no chef: rice 1 s; kaiseki 3 s by hand; with a waiter the rice
// goes onto the counter - 18.2), the counter (0.15 s a portion).
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_tray.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
function st(list, peak) {
  S = defaults(); for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), peak || 1); resetWorld(); go('play'); spawnT = 1e9;
}
// a guest already inside, in state `s` (not in the queue)
function guest(s, o) { addGuest(o && o.type || 'regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, { st: s, t: 0, inside: true, x: 17 * 16 + 8, y: 26 * 16 + 8 }, o || {}); return gu; }
const callOn = (gu, k) => { gu.call = { k, t: callT(), max: callT() }; return gu; };
const at = (x, y) => { P.x = x; P.y = y; };
const tick = (sec, f) => { for (let i = 0; i < Math.round(sec / DT); i++) { (f || trayZones)(DT); } };
const ZC = id => ZONE[id].c;

// ---- capacity
st(['room2', 'room3', 'onsen', 'recep', 'tea'], 2);
eq(trayCap(), 2, 'cap 2'); S.unlocked.tray1 = true; eq(trayCap(), 3, 'cap 3 with 托盘'); S.unlocked.tray2 = true; eq(trayCap(), 4, 'cap 4 with 托盘 x2');
// ---- urn: only what is wanted
st(['room2', 'room3', 'onsen', 'recep', 'tea'], 2);
at(ZC('urn1')[0] + 10, ZC('urn1')[1]);
tick(1); eq(P.tray.length, 0, 'no call: the urn gives nothing');
const a = callOn(guest('toBath'), 'tea');
tick(.25); eq(P.tray.length, 0, 'not yet at 0.25 s'); tick(.1); eq(P.tray.join(), 'tea', 'one tea after 0.3 s');
tick(1); eq(P.tray.length, 1, 'one call -> one tea only');
callOn(guest('toBath'), 'tea'); callOn(guest('toBath'), 'tea');
tick(1); eq(P.tray.length, 2, 'three calls, cap 2 -> two teas');
// milk calls don't come from the urn
P.tray = []; for (const gu of GUESTS) gu.call = null; callOn(GUESTS[0], 'milk'); tick(1); eq(P.tray.length, 0, 'the urn never gives milk');
// ---- milk machine needs 牛奶
st(['room2', 'room3', 'onsen', 'recep', 'tea'], 2); callOn(guest('toBath'), 'milk');
at(ZC('milk')[0], ZC('milk')[1]); tick(1); eq(P.tray.length, 0, 'no milk machine yet');
S.unlocked.milk = true; tick(.35); eq(P.tray.join(), 'milk', 'milk from the machine');
// ---- put back: a call that timed out -> its tea goes back at any pick-up zone
st(['room2', 'room3', 'onsen', 'recep', 'tea', 'milk'], 2);
{ const gu = callOn(guest('toBath'), 'tea'); at(ZC('urn1')[0], ZC('urn1')[1] + 6); tick(.4); eq(P.tray.length, 1, 'took the tea');
  gu.call = null; at(200, 300); tick(1); eq(P.tray.length, 1, 'kept while away from a zone');
  at(ZC('milk')[0], ZC('milk')[1]); tick(.2); eq(P.tray.length, 0, 'put back at the milk machine (any zone)'); }
// ---- hand over: within DELIVER_R after DELIVER_T; reward, hearts, stats
st(['room2', 'room3', 'onsen', 'recep', 'tea'], 2);
{ const gu = callOn(guest('toBath', { x: 300, y: 400 }), 'tea'); P.tray = ['tea'];
  const m0 = S.money, h0 = S.hearts, want = callReward(true);
  at(300 + DELIVER_R + 3, 400); tick(1); eq(P.tray.length, 1, 'out of reach: kept');
  at(300 + DELIVER_R - 2, 400); tick(.1); eq(P.tray.length, 1, 'in reach, before 0.2 s');
  tick(.15); eq(P.tray.length, 0, 'handed over after 0.2 s'); ok(!gu.call, 'call served');
  eq(S.money - m0, want, 'fast reward straight into the wallet'); eq(S.hearts - h0, 2, 'fast: +2 ♥'); eq(S.stats.calls, 1, 'stats.calls'); eq(S.stats.callsFast, 1, 'stats.callsFast'); }
// a sleeper is reached at the futon's centre, a bather at the water's edge (from the stand tile in front of the slot)
st(['room2', 'room3', 'onsen', 'recep', 'tea'], 2);
{ const rm = ROOM.room2, gu = guest('sleep', { room: 'room2', tt: 9 }); RT.room2.guest = gu; S.rooms.room2 = 'occupied'; callOn(gu, 'tea'); P.tray = ['tea'];
  const t = rm.cleanT; at(t[0] * 16 + 8, t[1] * 16 + 8); tick(.3); ok(!gu.call && P.tray.length === 0, 'served a sleeper from its futon tile');
  const b = guest('bathing', { slot: 0, tt: 5 }); SLOT_OCC[0] = b; callOn(b, 'tea'); P.tray = ['tea'];
  at(SLOTS[0].x * 16 + 8, 4 * 16 + 8 + 1.4); tick(.3); ok(!b.call, 'served a bather from the stand tile'); }
// ---- the counter: 0.15 s a portion, only for waiting diners / rice calls
st(['room2', 'room3', 'onsen', 'recep', 'tea', 'room4', 'room5', 'maid1', 'dining'], 3);
{ PASS.n = 3; const d = guest('seated', { seat: 0 }); SEAT_OCC[0] = d;
  at(ZC('pass')[0], ZC('pass')[1] + 14); tick(.2); eq(P.tray.join(), 'rice', 'rice from the counter'); eq(PASS.n, 2, 'counter 3 -> 2');
  tick(1); eq(P.tray.length, 1, 'one diner -> one rice');
  // hand it over on the seat
  at(tcx(SEATS[0].at), tcy(SEATS[0].at)); tick(.3); eq(d.st, 'eat', 'diner eats'); eq(P.tray.length, 0, 'tray empty'); }
// ---- the stove, no chef, no waiter: 1 s a portion straight onto the tray, only what is wanted
st(['room2', 'room3', 'onsen', 'recep', 'tea', 'room4', 'room5', 'maid1', 'dining'], 3);
{ for (const i of [0, 2]) SEAT_OCC[i] = guest('seated', { seat: i });
  at(ZC('stove')[0], ZC('stove')[1] + 14); ok(stoveJob(trayWants()) && stoveJob(trayWants()).to === 'tray', 'stove job -> tray');
  tick(.9); eq(P.tray.length, 0, 'not done at 0.9 s'); tick(.15); eq(P.tray.join(), 'rice', 'one portion after 1 s');
  tick(1.1); eq(P.tray.join(), 'rice,rice', 'two diners -> two portions'); tick(2); eq(P.tray.length, 2, 'no more than wanted'); ok(!P.cookK, 'fire rests');
  // put back at the counter when nobody wants it any more
  for (const gu of GUESTS) gu.st = 'leave'; at(ZC('pass')[0], ZC('pass')[1] + 14); tick(.5); eq(P.tray.length, 0, 'unwanted rice put back'); eq(PASS.n, 2, '... onto the counter'); }
// ---- the stove with a waiter and no chef: rice for diners goes onto the counter (18.2); rice for a call onto the tray
st(['room2', 'room3', 'onsen', 'recep', 'tea', 'room4', 'room5', 'maid1', 'dining', 'waiter1'], 3);
{ const w = STAFF.find(s => s.role === 'waiter'); w.x = 900; w.y = 900;   // keep him out of the way
  const d = guest('seated', { seat: 0 }); SEAT_OCC[0] = d; at(ZC('stove')[0], ZC('stove')[1] + 14);
  tick(1.05); eq(PASS.n, 1, 'with a waiter: onto the counter'); eq(P.tray.length, 0, '... not the tray');
  callOn(guest('toBath'), 'rice'); tick(1.05); eq(P.tray.join(), 'rice', 'a rice call -> onto the tray'); }
// ---- the chef: the innkeeper takes rice from the counter, never cooks it
st(['room2', 'room3', 'onsen', 'recep', 'tea', 'room4', 'room5', 'maid1', 'dining', 'waiter1', 'table3', 'chef'], 3);
{ const d = guest('seated', { seat: 0 }); SEAT_OCC[0] = d; at(ZC('stove')[0] - 4, ZC('stove')[1] + 14); ok(!stoveJob(trayWants()), 'chef hired: no rice job at the stove'); }
// ---- kaiseki (the VIP's wish, stage 2B fills vipWants): 3 s at the stove, only by hand, at most one
st(['room2', 'room3', 'onsen', 'recep', 'tea', 'room4', 'room5', 'maid1', 'dining', 'waiter1', 'table3', 'chef'], 4);
{ const vip = { id: 'vip', got: 0 }, saved = vipWants;
  vipWants = L => { if (!vip.got) L.push({ e: vip, k: 'kaiseki', x: 100, y: 100, left: 60, give() { vip.got++; } }); };
  at(ZC('stove')[0] - 4, ZC('stove')[1] + 14); tick(2.9); eq(P.tray.length, 0, 'kaiseki not ready at 2.9 s'); eq(P.cookK, 'kaiseki', 'cooking kaiseki (gold ring)');
  tick(.2); eq(P.tray.join(), 'kaiseki', 'kaiseki after 3 s'); tick(4); eq(countK(P.tray, 'kaiseki'), 1, 'at most one kaiseki');
  at(100, 100); tick(.3); eq(vip.got, 1, 'handed to the VIP through give()'); eq(P.tray.length, 0, 'tray empty');
  vipWants = saved; }
// ---- in a running game: the tray never exceeds its cap / holds unknown kinds; the guide's tray kinds are reachable
st(['room2', 'room3', 'onsen', 'recep', 'tea', 'milk', 'room4', 'room5', 'maid1', 'dining', 'tray1'], 3); spawnT = 1; S.tut.moved = true;
{ let bad = 0;
  for (let i = 0; i < 30 * 240; i++) {
    const g0 = guideTarget();
    if (g0 && !g0.here) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, g0.tx, g0.ty); if (p && p.length) { const [tx, ty] = p[0]; const dx = tx * 16 + 8 - P.x, dy = ty * 16 + 8 - P.y, d = Math.hypot(dx, dy); botMove = d > .01 ? { x: dx / d, y: dy / d } : null; } else botMove = null; } else botMove = null;
    update(DT);
    if (P.tray.length > trayCap() || P.tray.some(k => !TRAY_KINDS.includes(k))) bad++;
  }
  botMove = null; eq(bad, 0, 'tray within cap + known kinds over 4 minutes'); ok(S.stats.calls + S.stats.diners > 0, 'served something: calls ' + S.stats.calls + ', diners ' + S.stats.diners); }
console.log(errs.length ? 'SYS TRAY FAIL\n  ' + errs.join('\n  ') : 'SYS TRAY OK');
if (errs.length) process.exitCode = 1;
