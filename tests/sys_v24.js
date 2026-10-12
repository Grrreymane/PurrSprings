// v2.4 (player feedback, 2026-10-12): the roomier shop + standing still to buy, the wider doors and the two new ways
// through (dining -> shop, west wing -> shrine), the second milk machine by the front door.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_v24.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
function st(list, peak) {
  S = defaults(); for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), peak || 1); S.tut.moved = true; S.clock = .3; S.stats.time = 500; S.done = true; resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0;
}
const at = (x, y) => { P.x = x * 16 + 8; P.y = y * 16 + 8; P.moving = false; updCam(0, true); };
// ---- standing still on a pad: nothing for PAD_DELAY (0.8 s), a gold ring at your feet meanwhile; walking over: nothing
st(['room2']); S.money = 1000;
{ const u = UNLOCK.room3, [px, py] = u.pad;
  // walk across the pad at full speed (left to right): no fish spent
  P.x = (px - 2) * 16 + 8; P.y = py * 16 + 8; botMove = { x: 1, y: 0 }; run(1.2); botMove = null; eq(S.paid.room3 || 0, 0, 'walking across: nothing poured');
  // slowly over it (a nudge every frame): still nothing
  at(px, py); P.x -= 3; for (let i = 0; i < 40; i++) { botMove = { x: .4, y: 0 }; update(DT); } botMove = null; ok(!S.paid.room3, 'creeping over it: nothing (' + (S.paid.room3 || 0) + ')');
  at(px, py); run(.7); ok(!S.paid.room3, 'standing 0.7 s: not yet'); ok(P.padT > .5 && !P.pouring, 'waiting (' + P.padT.toFixed(2) + ' s)');
  const rings = []; const _r = ring; ring = (x, y, p, c) => { rings.push(c); return _r(x, y, p, c); }; render(); ring = _r; ok(rings.includes('#ffd23f'), 'the gold ring fills at your feet');
  run(.3); ok((S.paid.room3 || 0) > 0 || S.unlocked.room3, 'after 0.8 s: the fish go in'); run(2); ok(S.unlocked.room3, 'bought'); }
// ---- the shop: try-on one booth at a time (TRYON_R 1.5 tiles), the info card shows the nearest before you pay
st(['room2', 'room3', 'onsen', 'recep', 'shop'], 5); S.money = 0;
{ at(HAT_PAD[0], HAT_PAD[1]); run(.1); ok(TRY.hat && !TRY.pet && !TRY.outfit && !TRY.uniform, 'on the hat booth: only the hat'); eq(INFO && INFO.id, [...PADPOS].find(([id]) => UNLOCK[id].hat)[0], 'its card shows');
  at(5, 35); run(.1); ok(!TRY.hat && !TRY.pet && !TRY.outfit && !TRY.uniform, 'in the gap between the four booths: nothing tried'); }
// ---- doors: wide ones cover two tiles; the new links open only when both sides are bought
{ const wide = DOORS.filter(d => (d.w || 1) * (d.h || 1) === 2); eq(wide.length, 9, '9 doors / gates are 2 tiles wide');
  for (const d of wide) for (let j = 0; j < (d.h || 1); j++) for (let i = 0; i < (d.w || 1); i++) { ok(DOOR_AT[(d.at[1] + j) * MW + d.at[0] + i] === d && MAP[d.at[1] + j][d.at[0] + i] === 'D', d.kind + ' ' + d.at + ': tile ' + i + ',' + j); }
  const shopDoor = DOOR_AT[29 * MW + 8], shrineDoor = DOOR_AT[6 * MW + 8];
  st(['room2', 'room3', 'room4', 'room5', 'onsen', 'recep', 'maid1', 'dining']); ok(!doorIsOpen(shopDoor) && BLOCK[29 * MW + 8], 'dining open, shop not: the shop door stays shut');
  S.unlocked.shop = true; rebuildWorld(); ok(doorIsOpen(shopDoor) && !BLOCK[29 * MW + 8] && !BLOCK[29 * MW + 9], 'both: open, 2 tiles');
  const p = findPath(5, 24, 5, 33); ok(p && p.length <= 15, 'dining hall -> shop floor through it: ' + (p && p.length) + ' steps');
  st(['room2', 'room3', 'room4', 'room5', 'onsen', 'recep', 'maid1', 'dining', 'w1'], 5); ok(!doorIsOpen(shrineDoor) && BLOCK[6 * MW + 8], 'west wing, no shrine: its gate stays shut');
  S.unlocked.shrine = true; rebuildWorld(); ok(doorIsOpen(shrineDoor), 'both: open'); const q = findPath(8, 12, 5, 2); ok(q && q.length <= 13, 'west hall -> the offering pad: ' + (q && q.length) + ' steps');
  const viaOnsen = (() => { BLOCK[6 * MW + 8] = BLOCK[6 * MW + 9] = 1; const r = findPath(8, 12, 5, 2); rebuildWorld(); return r ? r.length : 999; })(); ok(viaOnsen > q.length + 15, 'the old way round is ' + viaOnsen + ' steps');
  st([]); for (const d of DOORS.filter(d => !d.room && d.open)) for (let j = 0; j < (d.h || 1); j++) for (let i = 0; i < (d.w || 1); i++) ok(BLOCK[(d.at[1] + j) * MW + d.at[0] + i], 'start: ' + d.kind + ' ' + d.at + ' shut'); }
// ---- the second milk machine: its pad on its own tile; guests use the free one; staff / arrow the nearer
st(UNLOCKS.filter(u => !u.need5 && u.id !== 'milk2').map(u => u.id), 5);
{ ok(PADPOS.has('milk2') && PADPOS.get('milk2') + '' === MILK2_AT + '', 'pad on the machine\'s tile: ' + PADPOS.get('milk2')); S.money = 500; at(MILK2_AT[0], MILK2_AT[1]); run(2); ok(S.unlocked.milk2, 'bought'); ok(!boxHit(P.x, P.y), 'stepped off the new machine'); ok(BLOCK[MILK2_AT[1] * MW + MILK2_AT[0]], 'the machine blocks its tile');
  const mk2 = () => { addGuest('regular'); const g = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(g), 1); Object.assign(g, { inside: true, x: tcx([17, 5]), y: tcy([17, 5]) }); setSt(g, 'toMilk'); g.goal = null; return g; };
  at(17, 24); const a = mk2(), b = mk2(); update(DT); eq(a.milkAt, 'milk', 'the first goes to the onsen machine'); eq(b.milkAt, 'milk2', 'the second, the one by the door');
  run(40, () => b.st !== 'toMilk' && b.st !== 'milk'); ok((S.piles.milk2 || 0) > 0, 'paid into the pile by the door (' + (S.piles.milk2 || 0) + ')');
  at(14, 33); eq(sourceOf('milk', tileOf(P)), 'milk2', 'the arrow: the nearer machine'); at(20, 5); eq(sourceOf('milk', tileOf(P)), 'milk', 'from the onsen: its own');
  const s0 = { x: tcx([15, 32]), y: tcy([15, 32]) }; eq(teaSource('milk', s0), 'milk2', 'the tea runner: the nearer'); S.clock = .9; rebuildWorld(); ok(LIGHTS.some(L => Math.abs(L.x - tcx(MILK2_AT)) < 1), 'it glows at night'); }
// ---- old saves: piles / decor / pads by id still valid on the new map
{ const raw = JSON.parse(JSON.stringify(defaults())); Object.assign(raw.unlocked, { room2: 1, room3: 1, onsen: 1, recep: 1, shop: 1, milk: 1 }); raw.piles = { shop: 50, milk: 20, milk2: 9 }; raw.paid = { h_straw: 100, milk2: 30 };
  const s = loadState(raw); eq(s.piles.shop, 50, 'the shop pile kept'); eq(s.piles.recep, 9, 'a pile of a machine not bought goes to the cash box'); eq(s.paid.milk2, 30, 'poured into milk2: kept'); S = s; resetWorld(); ok(PILE_AT.shop && walkable(...PILE_AT.shop), 'the shop pile stands on floor'); }
let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'render: ' + threw);
console.log(errs.length ? 'SYS V24 FAIL\n  ' + errs.join('\n  ') : 'SYS V24 OK');
if (errs.length) process.exitCode = 1;
