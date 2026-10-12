// v2.4 (player feedback "I picked up towels by accident, but the basket was full - awkward"): at the shelf the innkeeper
// only picks up what has a use (towelUse: room in the basket less what the porter / a maid carry there, plus the rush
// guests' towel wishes); a surplus goes back by itself at the shelf or the basket, one every TOWEL_BACK_T s (the stack
// shrinks); the porter and the innkeeper never fight over the basket; a picky guest's towel still works.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_towel_overflow.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
function st(list, basket) {
  S = defaults(); for (const id of ['room2', 'room3', 'onsen', 'recep', 'basket1'].concat(list || [])) S.unlocked[id] = true;
  for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), 2); S.tut.moved = true; S.clock = .3; S.basket = basket; resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0; GUESTS.length = 0; Q.length = 0;
}
const at = (t, dy) => { P.x = tcx(t); P.y = tcy(t) + (dy || 0); P.towels = P.towels || 0; };
// ---- full basket, at the shelf: picks nothing
st([], BASKET_MAX); at(SHELF_SPOT); run(1.5); eq(P.towels, 0, 'basket full: nothing picked at the shelf');
// ---- 6 surplus towels at the shelf / at the full basket: back to 0 within ~1.5 s, one at a time
st([], BASKET_MAX); at(SHELF_SPOT); P.towels = 6; run(.5); ok(P.towels > 0 && P.towels < 6, 'at the shelf: the stack shrinks one by one (' + P.towels + ')'); run(1); eq(P.towels, 0, 'at the shelf: all 6 back within 1.5 s');
st([], BASKET_MAX); at(BASKET_SPOT); P.towels = 6; run(1.5); eq(P.towels, 0, 'at the full basket: all 6 back within 1.5 s'); eq(S.basket, BASKET_MAX, 'the basket stays full');
// ---- only what fits: basket 7 / 10 -> 3 picked (the cap would allow 7)
st([], 7); at(SHELF_SPOT); run(2); eq(P.towels, 3, 'basket 7/10: picks the 3 that fit'); ok(towelCap() > 3, '(cap ' + towelCap() + ')');
at(BASKET_SPOT); run(1.5); eq(S.basket, BASKET_MAX, 'all of them go into the basket'); eq(P.towels, 0, 'none left over');
// ---- 2 surplus at a basket with room for 1: one in, one back
st([], 9); at(BASKET_SPOT); P.towels = 2; run(1.5); eq(S.basket, BASKET_MAX, 'one fits'); eq(P.towels, 0, 'the other goes back');
// ---- the porter carrying a load: the innkeeper takes only what is still missing
st(['milk', 'maid1', 'porter', 'dining', 'room4', 'room5'], 4); ensureStaff(); const po = STAFF.find(s => s.role === 'porter'); ok(!!po, 'porter hired');
if (po) { po.carry = 4; po.loading = false; eq(towelUse(), BASKET_MAX - 4 - 4, 'towelUse = room 6 - the porter\'s 4'); at(SHELF_SPOT); P.towels = 0; for (let i = 0; i < 45; i++) { po.carry = 4; update(DT); } eq(P.towels, 2, 'picks the 2 the porter does not bring'); P.towels = 0; }
// ---- a picky rush guest wants a towel: the full basket doesn't stop that one
st([], BASKET_MAX); addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; Q.length = 0; Object.assign(gu, { inside: true, st: 'queue', x: tcx([17, 27]), y: tcy([17, 27]) }); gu.ex = { k: 'towel', t: 30, max: 30 }; gu.exK = 'towel';
eq(towelUse(), 1, 'towelUse = the one towel wish'); at(SHELF_SPOT); run(1.5); eq(P.towels, 1, 'picks one for the picky guest'); run(1); eq(P.towels, 1, 'and keeps it (not surplus)');
{ const m0 = S.money; P.x = gu.x; P.y = gu.y + 10; run(1.5, () => !gu.ex); ok(!gu.ex && gu.exOk, 'handed over'); eq(P.towels, 0, 'from the stack'); ok(S.money > m0, 'tip'); }
// ---- the arrow never parks you at the shelf when there is nothing to pick
st([], BASKET_MAX); at(SHELF_SPOT); P.towels = 0; guideClock = 0; update(DT); ok(!(GUIDE && GUIDE.kind === 'shelf' && GUIDE.here), 'no "stay at the shelf" with a full basket (' + (GUIDE && GUIDE.kind) + ')');
console.log(errs.length ? 'SYS TOWEL OVERFLOW FAIL\n  ' + errs.join('\n  ') : 'SYS TOWEL OVERFLOW OK');
if (errs.length) process.exitCode = 1;
