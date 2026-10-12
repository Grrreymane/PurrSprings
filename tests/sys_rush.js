// SPEC_v2 19.2 (v2.2): the evening rush. From star 2, every day at clock RUSH_AT for RUSH_T (60) s guests come twice as
// often: a banner "客人多起来了", a clock on the HUD, the picture card the first time. The innkeeper is needed: a long line
// with rooms ready points the arrow at the desk, where two check in twice as fast; with the porter hired you still carry
// towels while the basket is empty and a guest waits. It ends with the evening summary. Nobody is ever stuck by it.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_rush.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + (+a).toFixed(3) + ' (want ' + b + ' +- ' + tol + ')');
const DT = 1 / 30;
function st(list, o) { S = defaults(); S.day = 7; for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean'; S.peak = Math.max(starOf(S), 1); S.tut.moved = true; S.basket = BASKET_MAX; Object.assign(S, o || {}); resetWorld(); go('play'); }
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
const STAR2 = ['room2', 'room3', 'onsen', 'recep', 'maid1', 'room4', 'room5', 'room6'];
// ---- not before star 2
st(['room2', 'room3'], { clock: RUSH_AT + .01 }); ok(!rushOn(), 'star 1: no rush (novice protection)');
// ---- the evening ★2 comes stays calm: the first rush is the next day
st(['room2', 'room3'], { clock: RUSH_AT - 2 / DAY_LEN }); S.money = 1000; run(.1); unlock('onsen'); run(1); eq(S.rep.s2, S.day, 'the day ★2 came is kept');
{ S.clock = RUSH_AT + .01; ok(!rushOn(), 'no rush that evening'); S.rep.s = 300; S.rep.n = 10; BANNER_Q.length = 0; S.clock = rushEnd() - .3 / DAY_LEN; run(.5); ok(!BANNER_Q.some(b => b.kind === 'rep') && S.rep.r === 45, 'and no summary'); S.day++; S.clock = RUSH_AT + .01; ok(rushOn(), 'the next evening: rush'); }
// ---- star 2: on in the window, x2 guests
st(STAR2, { clock: .3 }); ok(!rushOn(), 'midday: no rush');
{ const g0 = spawnGap(); S.clock = RUSH_AT + .01; ok(rushOn(), 'clock RUSH_AT: rush'); near(spawnGap(), g0 / RUSH_K, 1e-9, 'guests twice as often'); }
// ---- it comes: banner + card + HUD clock; it lasts RUSH_T s; then the summary
st(STAR2, { clock: RUSH_AT - 1 / DAY_LEN }); BANNER_Q.length = 0; FIRST_Q.length = 0; S.rep.s = 450; S.rep.n = 10;
{ let t0 = null, t1 = null, el = 0;
  run(RUSH_T + 5, () => { el += DT; if (rushOn() && t0 === null) t0 = el; if (t0 !== null && !rushOn() && t1 === null) t1 = el; return t1 !== null; });
  near(t1 - t0, RUSH_T, .1, 'the rush lasts RUSH_T s'); }
ok(RUN.rushes >= 1, 'counted'); ok(S.seen.rush, 'its card was shown'); ok(BANNER_Q.some(b => b.kind === 'rep') || S.rep.d >= 1, 'the evening summary at its end');
st(STAR2, { clock: RUSH_AT - .2 / DAY_LEN }); BANNER_Q.length = 0; FIRST_Q.length = 0;
{ run(.5); const b = BANNER_Q.find(x => x.kind === 'rush'); ok(b && bannerParts(b).parts.some(p => p.t === '客人多起来了'), 'banner: 客人多起来了'); ok(FIRST_Q.some(f => f.key === 'rush'), 'first rush: picture card');
  run(10); updCam(0, true); TQ.length = 0; render(); ok(rushLeft() > 0 && rushLeft() < RUSH_T, 'time left ' + rushLeft().toFixed(1)); }
{ FIRST_Q.length = 0; S.clock = .3; run(1); S.clock = RUSH_AT - .2 / DAY_LEN; run(.5); ok(!FIRST_Q.some(f => f.key === 'rush'), 'the rush card only once'); }
// ---- more guests in the rush than in the same time at midday (same inn, same reputation)
function arrivals(clock, sec) { st(STAR2, { clock }); spawnT = 0; let n = 0; const a0 = guestN; run(sec); n = guestN - a0; return n; }
{ const mid = arrivals(.3, 55), rush = arrivals(RUSH_AT, 55); ok(rush >= mid * 1.4, 'arrivals in 55 s: rush ' + rush + ' vs midday ' + mid); }
// ---- help at the desk: two check in twice as fast; the arrow sends you there when the line stays long with rooms ready
st(STAR2.concat(['tea']), { clock: RUSH_AT + .01 }); spawnT = 1e9; run(4);
{ const rc = STAFF.find(s => s.role === 'recep'); ok(rc && rc.atDesk, 'the receptionist at the desk');
  const t1 = checkinT(); P.x = tcx(DESK_SPOT); P.y = tcy(DESK_SPOT); update(DT); near(checkinT(), t1 / 2, 1e-9, 'you beside her: twice as fast');
  P.x = 17 * 16 + 8; P.y = 20 * 16 + 8; update(DT);
  for (let i = 0; i < 4; i++) { addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; gu.x = tcx(QSPOTS[i]); gu.y = tcy(QSPOTS[i]); gu.ready = true; setSt(gu, 'queue'); gu.inside = true; }
  rc.atDesk = false; const keep = STAFF.splice(STAFF.indexOf(rc), 1);   // she stepped away: the line stays
  run(LINE_LONG_T + .5); STAFF.push(keep[0]);
  ok(lineLongT >= LINE_LONG_T, 'the line has been long ' + lineLongT.toFixed(1) + ' s');
  const t = guideTarget({ prev: null }); ok(t && t.kind === 'desk', 'arrow: help at the desk (' + (t && t.kind + '#' + t.rule) + ')'); }
// ---- towels with the porter: the basket empty and a guest waiting -> the arrow still asks for towels
st(STAR2.concat(['milk', 'dining', 'porter']), { clock: .3 }); spawnT = 1e9; run(1); S.basket = 0;
{ addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; gu.x = tcx(TOWEL_SPOT); gu.y = tcy(TOWEL_SPOT); setSt(gu, 'towel'); gu.wait = BATH_WAIT; gu.inside = true; Q.length = 0;
  for (const s of STAFF) if (s.role === 'porter') { s.carry = 0; s.loading = false; s.x = 400; s.y = 500; }
  P.x = 17 * 16 + 8; P.y = 8 * 16 + 8; const t = guideTarget({ prev: null }); ok(t && (t.kind === 'shelf' || t.kind === 'basket'), 'porter hired, basket empty, a guest waits: towels (' + (t && t.kind) + ')'); }
// ---- three evenings of nobody doing anything: guests keep coming, the game never jams
st(STAR2.concat(['tea', 'shop']), { clock: .4 }); spawnT = 0;
{ const g0 = S.stats.guests; run(3 * DAY_LEN); ok(S.stats.guests - g0 > 60, 'guests checked in over three hands-off days: ' + (S.stats.guests - g0));
  ok(GUESTS.length <= GUEST_MAX, 'never more than 40 guests'); ok(S.rep.d >= 2, 'evenings rated: ' + S.rep.d); ok(GUESTS.every(gu => gu.t < 200 || gu.st === 'sleep'), 'no guest stuck'); }
console.log(errs.length ? 'SYS RUSH FAIL\n  ' + errs.join('\n  ') : 'SYS RUSH OK');
if (errs.length) process.exitCode = 1;
