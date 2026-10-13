// Save through the real entry points: preserve the whole rush score, unfinished work and the grace deadline.
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, m) => ok(Math.abs(a - b) < 1e-6, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
function setup(clock = RUSH_AT + .1) {
  S = defaults(); for (const u of UNLOCKS.filter(u => !u.need5 && !u.when)) S.unlocked[u.id] = true;
  S.peak = 5; S.day = 9; S.clock = clock; S.stats.time = 500; S.rep.s2 = 1; S.rep.s5 = 7; S.done = true;
  for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  resetWorld(); go('play'); quiet();
}
function quiet() { STAFF.length = 0; spawnT = 1e9; vipT = 1e9; P.x = tcx([30, 27]); P.y = tcy([30, 27]); }
function run(sec) { for (let i = 0; i < Math.round(sec / DT); i++) { update(DT); if (state === 'card') modalClose(); } }
function waiting(type = 'regular', o = {}) {
  addGuest(type); const gu = GUESTS[GUESTS.length - 1];
  Object.assign(gu, { st: 'queue', x: tcx(QSPOTS[0]), y: tcy(QSPOTS[0]), inside: true, ready: true, pat: 23.5,
    qT: 11.25, picky: true, exK: 'tea', ex: { k: 'tea', t: 12.5, max: EX_T } }, o);
  return gu;
}
function reload() { saveNow(); continueGame(); }
// Legacy saves in the rush resume tracking, without replaying banners. The first star-5 day is still ordinary.
setup();
ok(rushOn() && hardRush() && RUSH5.on, 'legacy mid-rush: tracking restored');
ok(!BANNER_Q.some(b => b.kind === 'rush'), 'no duplicate rush announcement');
waiting(); ok(RUSH5.g.includes(GUESTS[0]), 'new arrivals belong to the restored rush');
setup(); S.rep.s5 = S.day; resetWorld(); ok(rushOn() && !RUSH5.on, 'star 5 reached today: ordinary rush');
setup(); S.day = 8; resetWorld(); ok(!rushOn() && !RUSH5.on, 'festival evening stays quiet');
setup(.3); ok(!RUSH5.on, 'outside the rush stays quiet');
// History includes guests that already left. Pending queue and checked-in extras stay live, without another room fee.
setup();
const angry = waiting(); guestLeave(angry, true); Q.splice(Q.indexOf(angry), 1); GUESTS.splice(GUESTS.indexOf(angry), 1);
const served = waiting('regular', { ex: null, exOk: true, qT: 3 }); checkIn(served, ROOM.room1);
const family = waiting('family', { qT: 5 }); checkIn(family, ROOM.room2);
const queue = waiting('regular', { qT: 17.25, pat: 9.5, ck: .75 });
const expectedScores = RUSH5.g.map(rushScore).join(), guestCount = S.stats.guests, packet0 = S.piles.recep;
spawnT = .625; reload();
ok(RUSH5.on && rushOn(), 'saved mid-rush resumes tracking');
eq(RUSH5.g.length, 4, 'all four score records survive');
eq(RUSH5.g.map(rushScore).join(), expectedScores, 'scores survive, including departed angry guest');
eq(GUESTS.length, 2, 'only unfinished work is recreated'); eq(Q.length, 1, 'queue rebuilt once');
const fam = GUESTS.find(gu => gu.type === 'family'), que = Q[0];
ok(fam && fam.st === 'toRoom' && fam.mate && RT.room2.guest === fam, 'family waiting for extra owns its room');
eq(S.rooms.room2, 'reserved', 'unfinished room remains reserved'); eq(S.rooms.room1, 'clean', 'settled stay uses ordinary room reset');
near(que && que.pat, 9.5, 'queue patience unchanged'); near(que && que.qT, 17.25, 'elapsed queue time unchanged');
near(que && que.ck, .75, 'check-in progress unchanged'); near(fam && fam.ex && fam.ex.t, 12.5, 'extra timer unchanged');
near(spawnT, .625, 'arrival timer unchanged'); eq(S.stats.guests, guestCount, 'no duplicate check-in'); eq(S.piles.recep, packet0, 'no duplicate room fee');
reload(); eq(RUSH5.g.length, 4, 'second reload does not duplicate history'); eq(GUESTS.length, 2, 'second reload does not duplicate live guests');
eq(S.stats.guests, guestCount, 'second reload does not check in twice'); quiet();
run(10); ok(RUSH5.g.some(gu => gu.st === 'angry' && gu.qT > 17.25), 'restored patience runs out normally');
run(3); ok(RUSH5.g.some(gu => gu.type === 'family' && gu.exMiss && !gu.ex), 'restored extra expires normally');
try { render(); } catch (e) { errs.push('restored guests render: ' + e.message); }
// Great result after load uses the original full denominator and is paid exactly once.
setup(rushEnd() - .1 / DAY_LEN);
RUSH5.g = Array.from({ length: 6 }, () => ({ st: 'sleep', r2: true, qT: 3, picky: true, exOk: true, exK: 'tea' }));
reload(); quiet(); const h0 = S.hearts, box0 = S.piles.recep || 0, d0 = S.rep.d;
run(.3); eq(S.rep.r, 50, 'restored great rush is rated 5'); eq(S.rep.d, d0 + 1, 'one rush summary');
eq(S.hearts - h0, RUSH_GREAT_H + 10, 'great reward hearts preserved');
eq((S.piles.recep || 0) - box0, R(RUSH_PACKET * STARS[5].room * 6 * repMul()), 'packet includes all original guests');
ok(BANNER_Q.some(b => b.kind === 'rush5ok'), 'great result banner survives');
const h1 = S.hearts, b1 = S.piles.recep, d1 = S.rep.d;
reload(); quiet(); run(1); eq(S.hearts, h1, 'no second heart reward after reload'); eq(S.piles.recep, b1, 'no second packet after reload');
eq(S.rep.d, d1, 'no repeated summary'); ok(!RUSH5.on && !RUSH5.g.length, 'completed rush stays completed');
// Save late in the grace period. Reloading must not add another 25 seconds or discard the pending result.
setup(rushEnd() - .1 / DAY_LEN);
RUSH5.g = Array.from({ length: 4 }, () => ({ st: 'sleep', r2: true, qT: 3 }));
waiting('regular', { st: 'arrive', inside: false, x: EXIT[0], y: EXIT[1], pat: PATIENCE, ex: null, exK: null });
S.clock = rushEnd() + 20 / DAY_LEN; RUSH5.end = S.stats.time - 20;
const end0 = RUSH5.end; reload(); eq(RUSH5.end, end0, 'original grace start restored');
reload(); eq(RUSH5.end, end0, 'second reload does not extend grace'); quiet(); const n0 = S.rep.d;
run(4); eq(S.rep.d, n0, 'result still waits for last guest'); run(1.2); eq(S.rep.d, n0 + 1, 'result at original grace deadline');
// A pending extra can still be served after load, releasing its room without an extra check-in payment.
setup(); const pending = waiting('family', { qT: 3 }); checkIn(pending, ROOM.room1); reload(); quiet();
const restored = GUESTS[0], paid0 = S.stats.guests; if (restored) serveExtra(restored);
for (let i = 0; restored && restored.st !== 'sleep' && i < 30 * 30; i++) update(DT);
ok(restored && restored.exOk && !restored.ex && restored.st === 'sleep', 'restored extra served, guest reaches bed');
eq(S.stats.guests, paid0, 'restored guest only checked in once');
// Corrupt or stale snapshots cannot create a rush outside its day/window, or reserve a VIP room.
setup(); waiting(); saveNow(); const raw = JSON.parse(localStorage.getItem(SAVE + 'state'));
if (raw.rush5) {
  raw.rush5.day--; eq(loadState(raw).rush5, null, 'stale snapshot ignored'); raw.rush5.day++;
  raw.clock = .2; eq(loadState(raw).rush5, null, 'daytime snapshot ignored'); raw.clock = RUSH_AT + .1;
  raw.rush5.g = [null, { st: 'toRoom', exK: 'tea', live: { type: 'regular', room: 'c3', ex: { k: 'tea', t: 10, max: EX_T } } }];
  eq(loadState(raw).rush5.g.length, 0, 'invalid pending records dropped');
} else errs.push('rush snapshot missing from saved state');
console.log(errs.length ? 'SYS RUSH SAVE FAIL\n  ' + errs.join('\n  ') : 'SYS RUSH SAVE OK');
if (errs.length) process.exitCode = 1;
