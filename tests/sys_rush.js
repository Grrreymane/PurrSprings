// SPEC_v2 19.2 (v2.2): the evening rush. From star 2, every day at clock RUSH_AT for RUSH_T (45) s guests come twice as
// often: a banner "客人多起来了", a clock on the HUD, the picture card the first time. The innkeeper is needed: a long line
// with rooms ready points the arrow at the desk, where two check in twice as fast; with the porter hired you still carry
// towels while the basket is empty and a guest waits. It ends with the evening summary. Nobody is ever stuck by it.
// v2.3 (19.3): a 3-min day, the rush from the 2nd day after ★2, none on a festival evening. From the day after ★5 the big
// rush (大高峰): x2.5 guests (more with gold stars / years, <= x3), picky ones (28 s patience) who want an extra right now
// (tea / towel / rice / milk) only the innkeeper brings - checked in before it came, they wait for it in the lobby; the
// rush is rated on its own (rushScore) and that is the evening summary: >= 4.5 = 高峰大成功 (gold banner, red packet, hearts).
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
{ S.clock = RUSH_AT + .01; ok(!rushOn(), 'no rush that evening'); S.rep.s = 300; S.rep.n = 10; BANNER_Q.length = 0; S.clock = rushEnd() - .3 / DAY_LEN; run(.5); ok(!BANNER_Q.some(b => b.kind === 'rep') && S.rep.r === 45, 'and no summary');
  S.day++; S.clock = RUSH_AT + .01; ok(!rushOn(), 'v2.3: the next evening calm too (3-min days)'); S.day++; ok(rushOn(), 'the evening after: rush'); }
// ---- v2.3: no rush on a festival evening (star 3+, a season's 2nd day: the festival is that evening's crowd)
{ st(STAR2.concat(['dining']), { clock: RUSH_AT + .01, day: 8 }); ok(star() >= 3 && seasonDay(S.day) === 1, '(star 3, a season\'s 2nd day)'); ok(!rushOn(), 'festival evening: no rush'); S.day = 9; ok(rushOn(), 'the next day: rush'); }
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
{ const mid = arrivals(.3, RUSH_T - 2), rush = arrivals(RUSH_AT, RUSH_T - 2); ok(rush >= mid * 1.4, 'arrivals in ' + (RUSH_T - 2) + ' s: rush ' + rush + ' vs midday ' + mid); }
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
// ==== v2.3 (19.3): the star-5 rush
const STAR5 = UNLOCKS.filter(u => !u.need5 && !u.when).map(u => u.id);
const st5 = o => { st(STAR5, Object.assign({ day: 9, clock: .3 }, o || {})); S.rep.s5 = 7; S.rep.s2 = 1; ensureStaff(); };
const guestAt = (tile, o) => { addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); gu.x = tcx(tile); gu.y = tcy(tile); gu.inside = true; Object.assign(gu, o || {}); return gu; };
{ st5(); eq(star(), 5, 'star 5'); ok(hardRush(), 'the day after ★5: the big rush'); near(rushK(), RUSH5_K, 1e-9, 'x2.5 guests');
  S.rep.s5 = 9; ok(!hardRush() && rushK() === RUSH_K, 'the day ★5 came: an ordinary rush'); S.rep.s5 = 7;
  S.hearts = 1e6; ok(goldStars() >= 5, '(all gold stars)'); near(rushK(), RUSH5_MAX, 1e-9, 'gold stars: up to x3'); near(pickyP(), PICKY_P_MAX, 1e-9, 'and more picky guests'); ok(exT() >= EX_T_MIN, 'an extra never shorter than ' + EX_T_MIN + ' s');
  S.hearts = 0; S.day = 9 + YEAR_DAYS; near(rushK(), RUSH5_K + RUSH5_STEP, 1e-9, 'a year later: x2.6'); }
// it comes: the red banner with the guest factor; a picky share; extras only of what the inn has; picky patience
{ st5({ clock: RUSH_AT - .5 / DAY_LEN }); BANNER_Q.length = 0; spawnT = 0; run(1);
  const b = BANNER_Q.find(x => x.kind === 'rush'); ok(b && b.id === 1 && bannerParts(b).parts.some(p => p.t === '大高峰！') && bannerParts(b).parts.some(p => p.t === '×2.5'), 'banner: 大高峰！ ×2.5');
  ok(RUSH5.on, 'the big rush is on'); run(RUSH_T - 2);
  const L = RUSH5.g, pk = L.filter(gu => gu.picky);
  ok(L.length >= 8, 'its guests: ' + L.length); ok(pk.length >= 2 && pk.length <= L.length * .9, 'picky ones: ' + pk.length + ' of ' + L.length);
  ok(pk.filter(gu => gu.inside).every(gu => gu.exK && EX_KINDS.some(k => k[0] === gu.exK)), 'every picky guest inside wanted something: ' + pk.map(gu => gu.exK).join(' '));
  ok(L.filter(gu => !gu.picky).every(gu => !gu.exK), 'the others want nothing extra');
  updCam(0, true); let threw = null; try { TQ.length = 0; render(); } catch (e) { threw = e; } ok(!threw, 'renders: ' + threw); }
{ st5({ clock: RUSH_AT + .01 }); S.unlocked.milk = false; const gu = guestAt([17, 27]); gu.picky = true; RUSH5.on = true; for (let i = 0; i < 60; i++) { gu.exK = null; gu.ex = null; rushInside(gu); ok(gu.ex.k !== 'milk', 'no milk machine: never milk'); } }
// only the innkeeper brings it: the tea runner, the waiters leave it; it runs out -> missed (the bubble shrinks away)
{ st5({ clock: RUSH_AT + .01 }); RUSH5.on = true; spawnT = 1e9; const gu = guestAt([19, 27]); gu.picky = true; rushInside(gu); gu.ex.k = 'tea'; gu.exK = 'tea'; setSt(gu, 'toRoom'); gu.room = null;
  ok(trayWants().some(w => w.ex && w.e === gu && w.k === 'tea'), 'in your wants'); P.x = 17 * 16 + 8; P.y = 10 * 16 + 8;
  const t = guideTarget({ prev: null }); ok(t && t.kind === 'urn' && t.rule === 10, 'arrow: the urn for it (' + (t && t.kind + '#' + t.rule) + ')');
  gu.room = 'room1'; RT.room1.guest = gu; S.rooms.room1 = 'reserved'; run(gu.ex.t + .5);
  ok(gu.exMiss && !gu.ex && !gu.exOk, 'nobody brought it: missed'); ok(STAFF.some(s => s.role === 'tea'), '(the tea runner is hired)'); }
// you bring it: a tip in hand, a heart, more patience; a towel comes off your head
{ st5({ clock: RUSH_AT + .01 }); RUSH5.on = true; spawnT = 1e9; const gu = guestAt(QSPOTS[2]); Q.push(gu); setSt(gu, 'queue'); gu.picky = true; rushInside(gu); gu.ex.k = 'tea';
  const p0 = gu.pat, m0 = S.money, h0 = S.hearts; P.x = gu.x + 4; P.y = gu.y; P.tray = ['tea']; run(.5);
  ok(gu.exOk && !gu.ex, 'tea handed over'); ok(S.money > m0, 'a tip in hand'); ok(S.hearts > h0, 'a heart'); ok(gu.pat > p0 - 1 + EX_PAT * .9, 'more patience'); eq(P.tray.length, 0, 'tray empty'); }
{ st5({ clock: RUSH_AT + .01 }); RUSH5.on = true; spawnT = 1e9; const gu = guestAt([20, 27]); setSt(gu, 'toRoom'); gu.room = 'room1'; RT.room1.guest = gu; S.rooms.room1 = 'reserved'; gu.picky = true; rushInside(gu); gu.ex.k = 'towel';
  P.x = 30 * 16; P.y = 26 * 16 + 8; P.towels = 0; let t = guideTarget({ prev: null }); ok(t && t.kind === 'shelf' && t.rule === 10, 'a towel wanted: arrow to the shelf (' + (t && t.kind + '#' + t.rule) + ')');
  P.towels = 2; t = guideTarget({ prev: null }); ok(t && t.kind === 'deliver' && t.item === 'towel', 'towels on your head: to the guest (' + (t && t.key) + ')');
  P.x = gu.x + 4; P.y = gu.y; run(.5); ok(gu.exOk, 'the towel handed over'); eq(P.towels, 1, 'one off your head'); }
// checked in before it came: waits in the lobby (the room stays reserved), then goes up
{ st5({ clock: RUSH_AT + .01 }); RUSH5.on = true; spawnT = 1e9; const gu = guestAt([13, 26]); Q.push(gu); setSt(gu, 'queue'); gu.ready = true; gu.picky = true; rushInside(gu); gu.ex.k = 'rice'; gu.ex.t = 20;
  P.x = 30 * 16; P.y = 26 * 16 + 8; run(4, () => gu.st === 'toRoom'); ok(gu.st === 'toRoom' && gu.room, 'checked in'); run(6);
  const w = EX_WAIT[gu.exW]; ok(w && tileOf(gu)[0] === w[0] && tileOf(gu)[1] === w[1], 'waits on the lobby\'s east side ' + tileOf(gu)); eq(S.rooms[gu.room], 'reserved', 'its room reserved');
  P.tray = ['rice']; P.x = gu.x + 3; P.y = gu.y; run(.5); ok(gu.exOk, 'rice brought'); run(30, () => gu.st === 'sleep'); eq(gu.st, 'sleep', 'then up to its room'); }
// a rush guest's stars: the line (stricter for picky ones), the extra; angry = 1
{ eq(rushScore({ qT: 5 }), 50, 'quick: 5'); eq(rushScore({ qT: 24 }), 40, '24 s in line: 4'); eq(rushScore({ qT: 16, picky: true }), 40, 'picky, 16 s: 4');
  eq(rushScore({ qT: 5, picky: true, exMiss: true }), 30, 'its extra missed: -2'); eq(rushScore({ st: 'angry' }), 10, 'angry: 1'); eq(rushScore({ qT: 99, picky: true, exMiss: true }), 10, 'never below 1'); }
// the result = the evening summary: great -> 高峰大成功 (gold banner, red packet past the cap, hearts +20); else the usual with why
{ st5({ clock: rushEnd() - .5 / DAY_LEN }); spawnT = 1e9; RUSH5.on = true; RUSH5.g = []; for (let i = 0; i < 8; i++) RUSH5.g.push({ st: 'sleep', r2: true, qT: 3, picky: i < 4, exOk: i < 4 });
  BANNER_Q.length = 0; const h0 = S.hearts, box0 = (S.piles.recep || 0) + S.money, d0 = S.rep.d; run(1);
  eq(S.rep.d, d0 + 1, 'rated'); eq(S.rep.r, 50, 'the rush\'s 5 stars are the reputation'); const b = BANNER_Q.find(x => x.kind === 'rush5ok');
  ok(b && bannerParts(b).parts.some(p => p.t === '大成功！'), 'banner 高峰大成功'); ok(S.hearts - h0 >= RUSH_GREAT_H + 10, 'hearts +' + (S.hearts - h0)); ok((S.piles.recep || 0) + S.money - box0 >= RUSH_PACKET * STARS[5].room * 8, 'a red packet in the cash box: ' + ((S.piles.recep || 0) + S.money - box0)); ok(!RUSH5.on && !RUSH5.g.length, 'done'); }
{ st5({ clock: rushEnd() - .5 / DAY_LEN }); spawnT = 1e9; RUSH5.on = true; RUSH5.g = []; for (let i = 0; i < 8; i++) RUSH5.g.push({ st: 'sleep', r2: true, qT: 3, picky: i < 5, exMiss: i < 5, exK: 'tea' });
  BANNER_Q.length = 0; run(1); const b = BANNER_Q.find(x => x.kind === 'rep');
  ok(b && b.why === 'ex:tea' && b.rush, 'a bad rush: the usual summary, the tea missed most (' + JSON.stringify(b) + ')'); ok(b && bannerParts(b).parts.some(p => p.img === bubbleArt('tea', 2)), 'the red tea bubble on it');
  eq(S.rep.r, R((3 * 50 + 5 * 30) / 8), 'reputation = the rush'); ok(repMul() < 1, 'the next day earns less: x' + repMul().toFixed(2)); }
// the result waits for its last guests (<= RUSH_GRACE s); the HUD shows its stars so far
{ st5({ clock: rushEnd() - .5 / DAY_LEN }); spawnT = 1e9; RUSH5.on = true; const late = { st: 'queue', qT: 3 }; RUSH5.g = [late]; for (let i = 0; i < 6; i++) RUSH5.g.push({ st: 'sleep', r2: true, qT: 3 });
  const d0 = S.rep.d; run(1); eq(S.rep.d, d0, 'one still in line: the result waits'); ok(RUSH5.end !== null, 'pending');
  updCam(0, true); TQ.length = 0; render(); ok(TQ.some(q => q.s === '5.0'), 'HUD: the rush\'s stars so far 5.0');
  late.r2 = true; late.st = 'toRoom'; run(.2); eq(S.rep.d, d0 + 1, 'it checked in: the result'); }
{ st5({ clock: rushEnd() - .5 / DAY_LEN }); spawnT = 1e9; RUSH5.on = true; RUSH5.g = [{ st: 'queue', qT: 3 }]; for (let i = 0; i < 6; i++) RUSH5.g.push({ st: 'sleep', r2: true, qT: 3 });
  const d0 = S.rep.d; run(RUSH_GRACE + 1.5); eq(S.rep.d, d0 + 1, 'or after ' + RUSH_GRACE + ' s'); }
// a paused card (the reporter's result, mom's photo) waits for the rush and its result
{ st5({ clock: RUSH_AT + .01 }); spawnT = 1e9; run(.2); modalPush({ kind: 'year', y: 1, g: 0, e: 0, h: 0, c: 0, k: 'effort', name: '努力奖', prize: 0 }); run(.5); eq(state, 'play', 'in the rush: the card waits');
  S.clock = rushEnd() + .01; RUSH5.end = null; run(.5); eq(state, 'card', 'after it: the card'); modalClose(); }
// first time: its picture card
{ st5({ clock: RUSH_AT + .01 }); FIRST_Q.length = 0; S.seen.rush5 = false; RUSH5.on = true; const gu = guestAt([17, 27]); gu.picky = true; rushInside(gu); ok(FIRST_Q.some(f => f.key === 'rush5'), 'the first extra: its picture card'); }
// hands off through three days of big rushes: guests keep coming, nobody stuck, every big rush rated
{ st5({ clock: .3 }); spawnT = 0; const g0 = S.stats.guests, d0 = S.rep.d, n0 = (RUN.rush5 || []).length;
  run(3 * DAY_LEN); ok(S.stats.guests - g0 > 80, 'guests checked in: ' + (S.stats.guests - g0)); ok(GUESTS.length <= GUEST_MAX, 'never more than 40 guests');
  ok((RUN.rush5 || []).length - n0 >= 2, 'big rushes rated: ' + (RUN.rush5 || []).slice(n0).join(' ')); ok(GUESTS.every(gu => gu.t < 200 || gu.st === 'sleep'), 'no guest stuck');
  ok((RUN.rush5 || []).slice(n0).every(r => r >= 1 && r < 4.5), 'without the innkeeper: below 高峰大成功 (' + (RUN.rush5 || []).slice(n0).join(' ') + ')'); }
console.log(errs.length ? 'SYS RUSH FAIL\n  ' + errs.join('\n  ') : 'SYS RUSH OK');
if (errs.length) process.exitCode = 1;
