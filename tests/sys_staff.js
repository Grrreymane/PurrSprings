// SPEC_v2 4.7: named staff with levels. Experience 20 / 60 / 140 / 300 -> Lv2..Lv5 (one number, no stats). Each level:
// receptionist checks in x0.92; maids clean x0.9 and walk +5 %; the porter carries +1 towel a trip; the chef cooks x0.92;
// waiters and the clerk walk +5 %. Level-up: gold "Lv2" over the head + sparkle + line S18 + a small banner. Lv3 silver
// trim, Lv5 gold trim (look.trim 1 / 2, work clothes only). Within 2 tiles of you the nearest staff cat shows its name
// (7 px) + a level badge. The shop owner has no level. Experience is saved (S.staff).
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_staff.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + (+a).toFixed(3) + ' (want ' + (+b).toFixed(3) + ' +- ' + tol + ')');
const DT = 1 / 30;
const SFXLOG = [], LINES = [];
const _sfx = sfx; sfx = (k, a) => { SFXLOG.push(k); return _sfx(k, a); };
const _ls = lineSay; lineSay = (who, key) => { LINES.push([who, key]); return _ls(who, key); };
const BASE = ['room2', 'room3', 'onsen', 'recep', 'room4', 'room5', 'room6', 'maid1', 'milk', 'porter', 'dining', 'table3', 'waiter1', 'chef', 'room7', 'w1', 'w2', 'shop', 'clerk'];
function setup(xp) {
  S = defaults(); for (const id of BASE) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.basket = BASKET_MAX; S.tut.moved = true; Object.assign(S.staff, xp || {}); resetWorld(); go('play'); spawnT = 1e9;
  P.x = 2 * 16 + 8; P.y = 33 * 16 + 8;   // out of the way (the shop)
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
const staff = id => STAFF.find(s => s.id === id);
// ---- levels from experience
for (const [xp, lv] of [[0, 1], [19, 1], [20, 2], [59, 2], [60, 3], [139, 3], [140, 4], [299, 4], [300, 5], [1e6, 5]]) eq(lvOf(xp), lv, 'level at ' + xp + ' xp');
// ---- names (4.7 table)
setup();
{ const want = { recep: '小樱', maid1: '雪球', porter: '阿灰', chef: '黑糖', waiter1: '阿福', clerk: '老墨', owner: '狸老板' };
  for (const id in want) eq(staff(id) && staff(id).name, want[id], id + ' name'); }
// ---- a level-up: Lv over the head, sparkle, sound, line S18, banner, counted; once per level
setup({ maid1: 16 });
{ const m = staff('maid1'); BANNER_Q.length = 0; POPS.length = 0; FX.length = 0; SFXLOG.length = 0; LINES.length = 0;
  gainXp(m, 4); eq(staffLv(m), 2, 'maid1 Lv2 at 20 xp');
  ok(POPS.some(p => p.s === 'Lv2'), 'gold "Lv2" over the head'); ok(FX.some(f => f.k === 'spark'), 'a sparkle'); ok(SFXLOG.includes('levelup'), 'levelup sound');
  ok(LINES.some(([w, k]) => w === m && k === 'S18'), 'line S18 by the maid'); const b = BANNER_Q.find(x => x.kind === 'level');
  ok(b && b.id === 'maid1' && b.lv === 2, 'small banner [face] name Lv2: ' + JSON.stringify(b)); eq(RUN.levelups, 1, 'one level-up');
  ok(RUN.news.some(n => n[1] === 'level'), 'a "news" event (B3)');
  POPS.length = 0; gainXp(m, 4); eq(RUN.levelups, 1, 'no second event inside Lv2'); ok(!POPS.length, 'no pop');
  gainXp(m, 300); eq(staffLv(m), 5, 'a big jump goes straight to Lv5'); eq(RUN.levelups, 2, 'one event for the jump');
  const ow = staff('owner'); gainXp(ow, 500); eq(S.staff.owner, undefined, 'the shop owner gets no experience'); }
// ---- receptionist: check-in time x0.92 a level
for (const [xp, lv] of [[0, 1], [300, 5]]) {
  setup({ recep: xp }); run(4); const rc = staff('recep'); ok(rc.atDesk, 'receptionist at the desk');
  near(checkinT(), CHECKIN_T * Math.pow(.92, lv - 1), 1e-9, 'check-in time Lv' + lv);
  addGuest('regular'); const gu = GUESTS[0]; gu.x = tcx(QSPOTS[0]); gu.y = tcy(QSPOTS[0]); gu.ready = true; setSt(gu, 'queue');
  let t = 0; run(5, () => { t += DT; return gu.st !== 'queue'; }); near(t, CHECKIN_T * Math.pow(.92, lv - 1), 2 * DT, 'measured check-in Lv' + lv);
  P.x = tcx(DESK_SPOT); P.y = tcy(DESK_SPOT); update(DT); near(checkinT(), CHECKIN_T * Math.pow(.92, lv - 1), 1e-9, 'you at the desk too: the faster one');
}
// ---- maids: clean x0.9 a level, walk +5 % a level
for (const [xp, lv] of [[0, 1], [140, 4]]) {
  setup({ maid1: xp }); const m = staff('maid1'); STAFF.splice(0, STAFF.length, m);
  near(staffSpeed(m), STAFF_SPEED * (1 + .05 * (lv - 1)), 1e-9, 'maid speed Lv' + lv);
  const rm = ROOM.room3; m.x = tcx(rm.stand); m.y = tcy(rm.stand); S.rooms.room3 = 'messy';
  let t = 0; run(10, () => { if (m.working) t += DT; return S.rooms.room3 === 'clean'; });
  near(t, MAID_CLEAN_T * Math.pow(.9, lv - 1), 3 * DT, 'maid cleaning time Lv' + lv);
  // walking speed measured: from the rest spot to a far room
  m.x = tcx(REST[0]); m.y = tcy(REST[0]); m.job = null; S.rooms.w2 = 'messy'; let d = 0, px = m.x, py = m.y, tt = 0;
  run(6, () => { if (m.moving) { d += Math.hypot(m.x - px, m.y - py); tt += DT; } px = m.x; py = m.y; return false; });
  near(d / tt, STAFF_SPEED * (1 + .05 * (lv - 1)), .6, 'maid walks at Lv' + lv + ' speed');
}
// ---- the porter: +1 towel a trip a level; his speed does not change
for (const [xp, lv] of [[0, 1], [300, 5]]) {
  setup({ porter: xp }); const po = staff('porter'); STAFF.splice(0, STAFF.length, po); S.basket = 0;
  eq(porterCap(po), 6 + lv - 1, 'porter carries ' + (6 + lv - 1) + ' at Lv' + lv); eq(staffSpeed(po), STAFF_SPEED, 'porter speed unchanged');
  let mx = 0; run(30, () => { mx = Math.max(mx, po.carry); return false; }); eq(mx, 6 + lv - 1, 'measured towels per trip Lv' + lv);
}
// ---- the chef: one portion every CHEF_T x0.92 a level
for (const [xp, lv] of [[0, 1], [60, 3]]) {
  setup({ chef: xp }); const c = staff('chef'); STAFF.splice(0, STAFF.length, c); c.x = tcx(SPOT.chef); c.y = tcy(SPOT.chef); PASS.n = 0;
  const ts = []; let n0 = 0; run(12, () => { if (PASS.n > n0) ts.push(S.stats.time); n0 = PASS.n; return ts.length >= 4; });
  near((ts[3] - ts[1]) / 2, CHEF_T * Math.pow(.92, lv - 1), 2 * DT, 'chef interval Lv' + lv);
}
// ---- waiters and the clerk walk +5 % a level; the receptionist doesn't
setup({ waiter1: 300, clerk: 60, recep: 300 });
near(staffSpeed(staff('waiter1')), STAFF_SPEED * 1.2, 1e-9, 'waiter Lv5 +20 %'); near(staffSpeed(staff('clerk')), STAFF_SPEED * 1.1, 1e-9, 'clerk Lv3 +10 %');
eq(staffSpeed(staff('recep')), STAFF_SPEED, 'receptionist speed unchanged');
// ---- trim: none / silver (Lv3-4) / gold (Lv5) on work clothes; the drawn look carries it; one object per trim
setup({ maid1: 10, waiter1: 60, chef: 300 });
{ const m = staff('maid1'), w = staff('waiter1'), c = staff('chef'), ow = staff('owner');
  eq(staffLook(m), m.look, 'Lv1: the plain look'); eq(staffLook(w).trim, 1, 'Lv3 silver trim'); eq(staffLook(c).trim, 2, 'Lv5 gold trim');
  ok(staffLook(c) === staffLook(c), 'cached look object'); eq(staffLook(ow), ow.look, 'the shop owner: no trim');
  const seen = []; const _cs = catSprite; catSprite = (v, f, l) => { seen.push(l); return _cs(v, f, l); };
  P.x = c.x; P.y = c.y + 20; updCam(0, true); render(); catSprite = _cs;
  ok(seen.some(l => l.outfit === 'chef' && l.trim === 2), 'the chef is drawn with the gold trim'); }
// ---- name + level badge over the nearest staff cat within 2 tiles (none farther away)
setup({ maid1: 300 });
{ const m = staff('maid1'); STAFF.splice(0, STAFF.length, m); m.x = tcx(REST[0]); m.y = tcy(REST[0]); m.job = null;
  const names = () => TQ.filter(t => t.s === '雪球').length, badge = () => TQ.some(t => t.s === '5' && t.size === 6);
  P.x = m.x + 20; P.y = m.y + 6; updCam(0, true); render(); eq(names(), 1, 'name shown within 2 tiles'); ok(badge(), 'level badge 5');
  P.x = m.x + 40; P.y = m.y; render(); eq(names(), 0, 'no name 2.5 tiles away');
  setup(); P.x = tcx(SPOT.owner) + 10; P.y = tcy(SPOT.owner) + 8; updCam(0, true); render(); ok(TQ.some(t => t.s === '狸老板'), 'the shop owner: name, no badge'); }
// ---- everybody earns experience from their work (a few busy minutes)
setup(); S.unlocked.maid2 = true; ensureStaff(); spawnT = 1; P.x = 17 * 16 + 8; P.y = 27 * 16 + 8;
{ S.piles.room1 = 40; S.piles.onsen = 40; run(240);
  for (const id of ['recep', 'maid1', 'porter', 'chef', 'waiter1', 'clerk']) ok((S.staff[id] | 0) > 0, id + ' gained experience (' + (S.staff[id] | 0) + ')'); }
// ---- experience is saved; the level comes back from it
setup({ maid1: 150, chef: 25 }); saveNow();
{ S = loadState(); resetWorld(); eq(staffLv(staff('maid1')), 4, 'maid1 Lv4 after a reload'); eq(staffLv(staff('chef')), 2, 'chef Lv2 after a reload'); eq(RUN.levelups, 0, 'no level-up replayed on load'); }
console.log(errs.length ? 'SYS STAFF FAIL\n  ' + errs.join('\n  ') : 'SYS STAFF OK');
if (errs.length) process.exitCode = 1;
