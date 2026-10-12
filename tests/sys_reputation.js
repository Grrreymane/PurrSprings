// SPEC_v2 19.2 (v2.2): reputation. Every guest rates its stay 1-5 stars when it leaves (the line, a clean room ready, a
// towel, rice; angry = 1); the evening summary (the end of the rush) makes the day's average the reputation, which sets
// the room fee and the guest flow x0.8-1.2 (4.5 = par), the staff's speed x0.9-1.1 and gives hearts (r - 3) x 5. Before
// star 2 it changes nothing. Saved as S.rep (tenths); an old save starts at par; a bad value is cleaned, never wiped.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_reputation.js --seed 2
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + (+a).toFixed(3) + ' (want ' + b + ' +- ' + tol + ')');
const DT = 1 / 30;
function st(list, o) { S = defaults(); S.day = 7; for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean'; S.peak = Math.max(starOf(S), 1); S.tut.moved = true; Object.assign(S, o || {}); resetWorld(); go('play'); }
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
const STAR2 = ['room2', 'room3', 'onsen', 'recep', 'maid1'];
// ---- defaults, load
eq(defaults().rep.r, 45, 'a new inn: 4.5 stars (par)');
{ const raw = JSON.parse(JSON.stringify(defaults())); delete raw.rep; const s = loadState(raw); eq(s.rep.r, 45, 'an old save without S.rep: par'); eq(s.rep.n, 0, 'no ratings yet'); }
{ const raw = JSON.parse(JSON.stringify(defaults())); raw.rep = { r: 'x', s: -5, n: 3e9, d: 2.7 }; const s = loadState(raw); ok(s.rep.r === 45 && s.rep.s === 0 && s.rep.n === 0 && s.rep.d === 2, 'a bad S.rep is cleaned: ' + JSON.stringify(s.rep)); }
{ const raw = JSON.parse(JSON.stringify(defaults())); raw.rep = { r: 32, s: 410, n: 10, d: 5 }; const s = loadState(raw); eq(JSON.stringify(s.rep), JSON.stringify({ r: 32, s: 410, n: 10, d: 5, s2: 0, s5: 0 }), 'a good S.rep is kept'); }
// ---- one stay's stars
eq(rateStay({}, false), 50, 'nothing went wrong: 5');
eq(rateStay({}, true), 10, 'angry: 1');
eq(rateStay({ qT: 30 }), 40, '30 s in line: 4');
eq(rateStay({ qT: 99 }), 30, 'a very long line: at most -2');
eq(rateStay({ bedT: 8 }), 45, 'no clean room ready: -0.5');
eq(rateStay({ towelT: 6, noBath: true }), 35, 'waited for a towel and gave up the bath: -1.5');
eq(rateStay({ hungry: true }), 40, 'no rice: -1');
eq(rateStay({ seatT: 20 }), 45, 'slow rice: -0.5');
eq(rateStay({ qT: 40, pref: true, combo: true }), 43, 'a favourite combo room makes up for some of the line');
eq(rateStay({ qT: 99, bedT: 9, towelT: 9, noBath: true, hungry: true }), 10, 'never below 1');
// ---- the effect: none before star 2; at star 2 x0.8-1.2 on the room fee and the guest flow
st([]); S.rep.r = 50; eq(repMul(), 1, 'star 1: no effect (novice protection)'); eq(fee('room', { rm: ROOM.room1 }), 12, 'star 1 room fee unchanged');
st(STAR2); S.clock = .3;
for (const [r, m] of [[50, 1.2], [45, 1], [40, 1 - .2 / 2.5 * .5 * 2 / 2 * 2], [20, .8], [10, .8]]) { S.rep.r = r; near(repMul(), r === 40 ? 1 - .2 * .5 / 2.5 : m, 1e-9, 'rep ' + r / 10 + ' -> x'); }
S.rep.r = 50; eq(fee('room', { rm: ROOM.room1 }), R(14 * 1.2), '5 stars: room fee x1.2');
S.rep.r = 20; eq(fee('room', { rm: ROOM.room1 }), R(14 * .8), '2 stars: room fee x0.8');
{ S.rep.r = 45; const g0 = spawnGap(); S.rep.r = 50; near(spawnGap(), g0 / 1.1, 1e-9, '5 stars: guests 1.1x as often'); S.rep.r = 20; near(spawnGap(), g0 / .9, 1e-9, '2 stars: guests 0.9x as often'); }
{ S.rep.r = 50; near(repStaff(), 1.1, 1e-9, '5 stars: staff x1.1'); S.rep.r = 10; near(repStaff(), .9, 1e-9, '1 star: staff x0.9'); }
// ---- guests rate as they leave; the evening summary
st(STAR2); S.clock = .76; S.basket = BASKET_MAX;   // (v2.3: 150 s from just after the summary - a day is 180 s)
{ run(150); ok(S.rep.n >= 5, 'guests rated their stays as they left: ' + S.rep.n); ok(S.rep.s >= S.rep.n * 10 && S.rep.s <= S.rep.n * 50, 'ratings within 1-5'); }
{ S.rep.s = 420; S.rep.n = 10; const h0 = S.hearts, d0 = S.rep.d; BANNER_Q.length = 0; FIRST_Q.length = 0; S.seen.rep = false;
  const _rs = rateStay; rateStay = () => 42;   // (a guest leaving in this second rates 4.2 too: the test is about the summary - one rating 3 made it 41)
  S.clock = rushEnd() - .5 / DAY_LEN; S.rep.s = 420; S.rep.n = 10; run(1, () => S.rep.d > d0); rateStay = _rs;
  eq(S.rep.r, 42, 'the summary: today\'s average becomes the reputation'); eq(S.rep.n, 0, 'a new day of ratings'); eq(S.rep.d, d0 + 1, 'days rated +1');
  ok(S.hearts - h0 >= R((4.2 - 3) * 5) && S.hearts - h0 <= R((4.2 - 3) * 5) + 2, 'hearts (4.2 - 3) x 5 (+ a guest who left): ' + (S.hearts - h0));
  const b = BANNER_Q.find(x => x.kind === 'rep'); ok(b && b.id === 42 && b.pct === R((repMul() - 1) * 100), 'the evening summary banner: stars + the fee change');
  ok(b && bannerParts(b).parts.some(p => p.t === '4.2'), 'the banner says 4.2'); ok(FIRST_Q.some(f => f.key === 'rep'), 'the first summary: its picture card'); }
{ const r0 = S.rep.r; BANNER_Q.length = 0; S.rep.s = 0; S.rep.n = 0; for (const gu of GUESTS) gu.rated = true; spawnT = 1e9; S.clock = rushEnd() - .5 / DAY_LEN; run(1); eq(S.rep.r, r0, 'nobody rated today: the reputation stays'); ok(!BANNER_Q.some(x => x.kind === 'rep'), 'and no banner'); }
st(['room2', 'room3']); { S.rep.s = 100; S.rep.n = 10; BANNER_Q.length = 0; S.clock = rushEnd() - .5 / DAY_LEN; run(1); eq(S.rep.r, 45, 'star 1: the day is not rated'); ok(!BANNER_Q.some(x => x.kind === 'rep'), 'no summary before star 2'); }
// ---- a bad reputation only earns less: a guest leaving angry, a day of 1 star -> x0.8, the inn goes on
st(STAR2); { S.rep.s = 60; S.rep.n = 6; S.clock = rushEnd() - .5 / DAY_LEN; run(1); eq(S.rep.r, 10, '1 star'); near(repMul(), .8, 1e-9, 'x0.8, no lower'); const g0 = S.stats.guests; S.clock = .12; run(120); ok(S.stats.guests > g0, 'guests still come: ' + (S.stats.guests - g0)); }
// ---- only stays that began at ★2+; a day with fewer than REP_MIN ratings is not summed up; below par the banner shows why
st(['room2', 'room3']); { const gu = { type: 'regular' }; gu.r2 = false; S.peak = 2; S.unlocked.onsen = true; const n0 = S.rep.n; rateGuest(gu, false); eq(S.rep.n, n0, 'a guest checked in at ★1 is not rated'); rateGuest({ r2: false }, true); eq(S.rep.n, n0 + 1, 'an angry guest at ★2 is'); }
st(STAR2); { S.rep.s = 200; S.rep.n = 5; const r0 = S.rep.r; for (const gu of GUESTS) gu.rated = true; spawnT = 1e9; S.clock = rushEnd() - .5 / DAY_LEN; run(1); eq(S.rep.r, r0, 'only 5 ratings: no summary'); }
st(STAR2); { BANNER_Q.length = 0; for (const gu of GUESTS) gu.rated = true; spawnT = 1e9;
  for (let i = 0; i < 8; i++) rateGuest({ r2: true, qT: 45 }, false); rateGuest({ r2: true, hungry: true }, false);
  S.clock = rushEnd() - .5 / DAY_LEN; run(1); const b = BANNER_Q.find(x => x.kind === 'rep'); ok(b && b.why === 'line', 'below par: the banner shows the line cost the most (' + (b && b.why) + ')');
  ok(b && bannerParts(b).parts.some(p => p.img === bellIcon()), 'the desk bell on the banner'); }
// ---- the HUD: today's stars after star 2 (render must not throw)
st(STAR2); S.rep.s = 450; S.rep.n = 10; S.clock = .3; updCam(0, true); TQ.length = 0; render(); ok(TQ.some(q => q.s === '4.5'), 'HUD: today\'s stars 4.5');
console.log(errs.length ? 'SYS REPUTATION FAIL\n  ' + errs.join('\n  ') : 'SYS REPUTATION OK');
if (errs.length) process.exitCode = 1;
