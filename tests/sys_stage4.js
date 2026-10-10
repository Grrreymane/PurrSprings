// SPEC_v2 18.2 (stage 4, balance): the logic that came with the tuning.
//   * an idle maid tops up a low towel basket while there is no porter (MAID_TOWELS a run, one maid at a time)
//   * a guest at the milk machine with a call still open waits there for it (nobody walks out with a call)
//   * a bather calls for milk only once milk is sold
//   * the VIP sips / eats VIP_SIP_T s after tea / kaiseki before its next wish shows (its idle clock waits too)
//   * the arrow: an affordable pad = the nearest one (a star gate first; the shop is not one); nothing bought for
//     STALL_T s -> the pads (or the pile that pays) before the chores; a seated VIP's wish beats the pads only once it
//     has waited VIP_URGENT s; the first combo of a pointed-at pair beats the pads for COMBO_RUSH s; rice for the diners
//     before the calls while there is no chef; on the tray, the nearest in-time want first unless the most urgent gets tight
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_stage4.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
function setup(list, o) {
  S = defaults(); for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(1, starOf(S)); S.tut.moved = true; Object.assign(S, o || {}); resetWorld(); go('play'); spawnT = 1e9;
  P.x = 17 * 16 + 8; P.y = 27 * 16 + 8;
}
function guest(s, o) { addGuest(o && o.type || 'regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, { st: s, t: 0, inside: true }, o || {}); return gu; }
const at = (tx, ty) => { P.x = tx * 16 + 8; P.y = ty * 16 + 8; };
const pick = () => { guideClock = 0; GUIDE = null; return guideTarget(); };
const ST2 = ['room2', 'room3', 'shoes1', 'onsen', 'recep', 'tea'];
// ---- the idle maid and the towels
setup(ST2.concat(['maid1']), { basket: 1 });
{ const m = STAFF.find(s => s.role === 'maid'); ok(!!m, 'maid hired');
  let carried = 0; run(40, () => { carried = Math.max(carried, m.carry); return S.basket >= 1 + MAID_TOWELS; });
  ok(S.basket >= 1 + MAID_TOWELS, 'an idle maid filled the basket: ' + S.basket); eq(carried, MAID_TOWELS, 'towels on her head a run');
  S.rooms.room2 = 'messy'; S.basket = 0; run(.5); eq(m.job, 'room2', 'a dirty room comes first (she was idle)'); }
setup(ST2.concat(['maid1', 'milk', 'dining', 'porter']), { basket: 0 });
{ const m = STAFF.find(s => s.role === 'maid'); run(3); eq(m.carry, 0, 'with a porter the maid leaves the towels to him'); ok(!m.loading, 'not loading'); }
// ---- the milk machine: an open call keeps its guest there
setup(ST2.concat(['milk']));
{ const gu = guest('milk', { tt: MILK_T, x: tcx(MILK_SPOT), y: tcy(MILK_SPOT) }); lastCallAt = -99; gu.call = { k: 'tea', t: 20, max: callT() };
  for (let i = 0; i < 30 * 5; i++) updGuest(gu, DT); eq(gu.st, 'milk', 'waits at the machine while its call is open');
  gu.call = null; for (let i = 0; i < 30 * 1.2; i++) updGuest(gu, DT); ok(gu.st !== 'milk', 'goes on once the call is over (' + gu.st + ')'); }
// ---- bathers ask for milk only once milk is sold
setup(ST2);
{ let n = 0; for (let i = 0; i < 300; i++) { GUESTS.length = 0; SLOT_OCC.fill(null); lastCallAt = -99; const gu = guest('toSlot', { slot: 0, x: SLOTS[0].x * 16 + 8, y: 4 * 16 + 8 }); SLOT_OCC[0] = gu; gu.path = []; gu.goal = null; updGuest(gu, DT); if (gu.call) n++; }
  eq(n, 0, 'no calls from the water before milk'); }
// ---- the arrow: the nearest affordable pad; a star gate first; the shop is no star gate
setup(ST2.concat(['maid1', 'room4']), { money: 2000 });
{ at(19, 27); let t = pick(); ok(t && t.kind === 'pad', 'a pad (' + (t && t.kind) + ')');
  const near = guidePads({}).filter(u => S.money >= padNeed(u)).sort((a, b) => { const d = u => Math.abs(padXY(u)[0] - 19) + Math.abs(padXY(u)[1] - 27); return d(a) - d(b); })[0];
  ok(!guidePads({}).some(u => u.gate && u.star && S.money >= padNeed(u)) ? t.id === near.id : true, 'the nearest affordable one: ' + (t && t.id) + ' (nearest ' + near.id + ')');
  ok(PADPOS.has('shop'), 'the shop pad shows'); ok(t.id !== 'shop' || near.id === 'shop', 'the shop is not pulled first like a star gate'); }
setup(['room2', 'room3', 'shoes1'], { money: 500 });
{ at(19, 27); const t = pick(); ok(t && t.id === 'onsen', 'a star gate first when affordable (' + (t && t.id) + ')'); }
// ---- anti-stall: nothing bought for STALL_T s -> the pad before a delivery on the tray
setup(ST2.concat(['maid1']), { money: 0 });
{ const gu = guest('sleep', { room: 'room2', tt: 999, x: tcx(ROOM.room2.stand), y: tcy(ROOM.room2.stand) }); RT.room2.guest = gu; S.rooms.room2 = 'occupied';
  gu.call = { k: 'tea', t: 50, max: 50 }; P.tray = ['tea']; at(13, 27);
  S.money = 5000; lastBuyAt = S.stats.time; let t = pick(); eq(t && t.kind, 'deliver', 'a fresh buyer delivers first');
  lastBuyAt = S.stats.time - STALL_T - 1; t = pick(); eq(t && t.kind, 'pad', 'stalled: the affordable pad first'); P.tray = []; gu.call = null; }
// ---- a seated VIP's wish beats the pads only once it has waited VIP_URGENT s
setup(ST2.concat(['maid1', 'room4', 'room5', 'room6', 'dining', 'w1', 'room7', 'garden']), { money: 0 });
{ vipArrive(); VIPG.x = tcx(ROOM.c3.stand); VIPG.y = tcy(ROOM.c3.stand); VIPG.suite = 'c3'; RT.c3.guest = VIPG; VIPG.st = 'seated'; VIPG.wi = 0; VIPG.t = 0; VIPG.G = 100; VIPG.paid = 0; VIPG.greetAt = 0;
  S.money = 5000; lastBuyAt = S.stats.time; at(17, 27); let t = pick(); eq(t && t.kind, 'pad', 'a fresh wish waits for the pads');
  VIPG.t = VIP_IDLE - VIP_URGENT + 1; t = pick(); ok(t && t.rule === 8, 'an old wish goes first (rule ' + (t && t.rule) + ' ' + (t && t.kind) + ')');
  // the sip: tea handed over -> no wish for VIP_SIP_T.tea s, then the next one; its idle clock does not run meanwhile
  VIPG.t = 0; vipWishDone(); eq(vipWish(), null, 'sipping'); run(VIP_SIP_T.tea - .2); eq(vipWish(), null, 'still sipping'); ok(VIPG.t < .01, 'idle clock held'); run(.4); eq(vipWish(), 'bath', 'then the next wish'); }
// ---- the first combo of a pointed-at pair: before the pads, for COMBO_RUSH s at most
setup(ST2.concat(['maid1', 'shop', 'd_scroll', 'd_ikebana']), { money: 5000 });
{ lastBuyAt = S.stats.time; at(17, 27); let t = pick(); eq(t && t.kind, 'slot', 'a new combo before the pads');
  S.stats.time += COMBO_RUSH + 1; t = pick(); ok(t && t.kind !== 'slot', 'after COMBO_RUSH s back in its place (' + (t && t.kind) + ')'); }
// ---- no chef: the diners' rice before a call
setup(ST2.concat(['maid1', 'room4', 'room5', 'room6', 'dining']), { money: 0 });
{ const d = guest('seated', { seat: 0 }); SEAT_OCC[0] = d; d.served = false; const c = guest('sleep', { room: 'room2', tt: 999, x: tcx(ROOM.room2.stand), y: tcy(ROOM.room2.stand) }); RT.room2.guest = c; c.call = { k: 'tea', t: 50, max: 50 };
  at(12, 26); lastBuyAt = S.stats.time; let t = pick(); ok(t && t.rule === 11, 'no chef: the stove before the call (rule ' + (t && t.rule) + ' ' + (t && t.kind) + ')'); }
let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'render: ' + threw);
console.log(errs.length ? 'SYS STAGE4 FAIL\n  ' + errs.join('\n  ') : 'SYS STAGE4 OK');
if (errs.length) process.exitCode = 1;
