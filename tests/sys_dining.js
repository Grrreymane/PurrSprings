// SPEC_v2 4.3: the dining hall - after checking out, a guest takes a free seat (a party a whole table; nobody queues),
// waits SEAT_WAIT for rice (no fee, not angry if it never comes), eats EAT_T, pays breakfast into the dining pile;
// the chef stocks the counter (CHEF_T, up to PASS_MAX, then the fire rests); waiters carry 2 at a time to the
// longest-waiting diners; chef + 2 waiters = fully automatic. 餐桌 adds seats.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_dining.js --seed 7
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
function st(list, peak) {
  S = defaults(); for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), peak || 1); resetWorld(); go('play'); spawnT = 1e9; P.x = 40; P.y = 34 * 16 + 4;   // innkeeper parked in the shop corner
}
function guest(s, o) { addGuest(o && o.type || 'regular'); const gu = GUESTS[GUESTS.length - 1]; Q.splice(Q.indexOf(gu), 1); Object.assign(gu, { st: s, t: 0, inside: true }, o || {}); return gu; }
function sleeper(rid, o) { const rm = ROOM[rid], gu = guest('sleep', Object.assign({ room: rid, tt: .05, rolled: true, x: tcx(rm.stand), y: tcy(rm.stand) }, o || {})); RT[rid].guest = gu; S.rooms[rid] = 'occupied'; if (gu.mate) { gu.mate.mode = 'park'; gu.mate.x = gu.x; gu.mate.y = gu.y; } return gu; }
const run = (sec, gus) => { for (let i = 0; i < Math.round(sec / DT); i++) { for (const gu of (gus || GUESTS.slice())) updGuest(gu, DT); for (const s of STAFF) updStaff(s, DT); } };
const BASE = ['room2', 'room3', 'onsen', 'recep', 'room4', 'room5', 'maid1'];
const DIN = BASE.concat(['dining']);
// ---- closed: straight on to the bath
st(BASE, 2); { const gu = sleeper('room1'); run(.1, [gu]); eq(gu.st, 'toBath', 'no dining hall -> bath'); }
// ---- open: to a seat, sit, wait, give up after SEAT_WAIT (no fee, not angry), then the bath
st(DIN, 3);
{ const gu = sleeper('room1'); run(.1, [gu]); eq(gu.st, 'toSeat', 'woken -> toSeat'); ok(gu.seat >= 0 && SEAT_OCC[gu.seat] === gu, 'seat reserved');
  for (let i = 0; i < 30 * 40 && gu.st === 'toSeat'; i++) updGuest(gu, DT);
  eq(gu.st, 'seated', 'sat down'); eq(gu.dir, SEATS[gu.seat].face, 'faces the table');
  const pile = S.piles.dining || 0; run(SEAT_WAIT - .5, [gu]); eq(gu.st, 'seated', 'still waiting before SEAT_WAIT');
  run(1, [gu]); eq(gu.st, 'toBath', 'gave up -> bath'); eq(S.piles.dining || 0, pile, 'no breakfast fee'); eq(RUN.hungry, 1, 'counted hungry'); eq(S.stats.angry, 0, 'not angry');
  ok(SEAT_OCC.every(o => o !== gu), 'seat freed'); }
// ---- served: eat EAT_T, pay breakfast into the dining pile, table shows 'set' then 'eaten'
st(DIN, 3);
{ const gu = guest('seated', { seat: 0, x: tcx(SEATS[0].at), y: tcy(SEATS[0].at) }); SEAT_OCC[0] = gu;
  serveSeat(gu); eq(gu.st, 'eat', 'eating'); eq(tableState(0), 'set', 'plates set while eating');
  run(EAT_T - .2, [gu]); eq(gu.st, 'eat', 'still eating'); run(.3, [gu]);
  eq(S.piles.dining, fee('meal', { gu }), 'breakfast fee in the dining pile'); eq(S.stats.diners, 1, 'stats.diners'); eq(tableState(0), 'eaten', 'eaten plates');
  ok(!SEAT_OCC[0], 'seat freed'); T += 3.1; eq(tableState(0), 'empty', 'cleared after 3 s'); }
eq(fee('meal', { gu: { type: 'couple' } }), 20, 'couple breakfast x2 (star 3 meal 10)'); eq(fee('meal', { gu: { type: 'family' } }), 15, 'family breakfast x1.5');
// ---- seats: a party takes a whole table; a guest alone sits at a half-taken table first; no seat -> skip
st(DIN, 4);
{ eq(SEATS.filter((s, i) => seatOpen(i)).length, 4, '4 seats at opening');
  const a = guest('toBath'); ok(takeSeat(a), 'first single'); const b = guest('toBath'); ok(takeSeat(b), 'second single');
  eq(b.seat >> 1, a.seat >> 1, 'second single joins the half-taken table');
  const c = guest('toBath', { mate: { kind: 'cat', look: { fur: 'white' }, x: 0, y: 0, q: [], mode: 'follow', path: [] } });
  ok(takeSeat(c), 'party gets the empty table'); eq(c.seat2, c.seat + 1, 'party takes both seats'); ok(SEAT_OCC[c.seat] === c && SEAT_OCC[c.seat2] === c, 'both seats held');
  const d = guest('toBath'); ok(!takeSeat(d), 'no seat left -> skip');
  S.unlocked.table3 = true; ok(takeSeat(d), '餐桌 adds seats'); eq(d.seat >> 1, 2, 'on table 3'); }
// the woken guest skips breakfast when every seat is taken (nobody queues for a seat)
st(DIN, 3);
{ for (let i = 0; i < 4; i++) SEAT_OCC[i] = guest('seated', { seat: i });
  const gu = sleeper('room2'); run(.1, [gu]); eq(gu.st, 'toBath', 'full dining hall -> bath'); }
// ---- a couple: partner walks to the other seat of the table, both sit
st(DIN.concat(['tea', 'shop', 'd_scroll', 'd_ikebana']), 3);
{ addGuest('couple'); const gu = GUESTS[GUESTS.length - 1]; Q.length = 0; Object.assign(gu, { st: 'sleep', room: 'room1', tt: .05, rolled: true, inside: true, x: tcx(ROOM.room1.stand), y: tcy(ROOM.room1.stand) });
  RT.room1.guest = gu; S.rooms.room1 = 'occupied'; gu.mate.mode = 'park'; gu.mate.x = gu.x; gu.mate.y = gu.y + 9;
  run(.1, [gu]); eq(gu.st, 'toSeat', 'couple to a table');
  for (let i = 0; i < 30 * 40 && !(gu.st === 'seated' && gu.mate.mode === 'park'); i++) updGuest(gu, DT);
  eq(gu.st, 'seated', 'couple seated'); eq(gu.mate.mode, 'park', 'partner seated'); ok(dist(gu.mate.x, gu.mate.y, tcx(SEATS[gu.seat2].at), tcy(SEATS[gu.seat2].at)) < 1, 'partner on the other seat');
  serveSeat(gu); run(EAT_T + .1, [gu]); eq(S.piles.dining, fee('meal', { gu }), 'couple pays x2'); eq(gu.mate.mode, 'follow', 'partner follows again'); }
// ---- the chef: a portion every CHEF_T up to PASS_MAX, then the fire rests
st(DIN.concat(['waiter1', 'table3', 'chef']), 3);
{ const chef = STAFF.find(s => s.role === 'chef'), w = STAFF.find(s => s.role === 'waiter');
  const keep = s => { for (let i = 0; i < Math.round(CHEF_T * 0.98 / DT); i++) updStaff(chef, DT); };
  keep(); eq(PASS.n, 0, 'nothing before CHEF_T'); for (let i = 0; i < 3; i++) updStaff(chef, DT); eq(PASS.n, 1, 'one portion at CHEF_T');
  for (let i = 0; i < Math.round(CHEF_T * 6 / DT); i++) updStaff(chef, DT); eq(PASS.n, PASS_MAX, 'stops at ' + PASS_MAX); ok(!chef.cooking, 'fire rests when full');
  eq(S.staff.chef, PASS_MAX, 'chef xp +1 a portion');
  // the waiter: 2 at a time, the longest-waiting first
  const d = [0, 1, 4].map((i, k) => { const gu = guest('seated', { seat: i, t: 10 - k * 4, x: tcx(SEATS[i].at), y: tcy(SEATS[i].at) }); SEAT_OCC[i] = gu; return gu; });
  updStaff(w, DT); eq(w.jobs.length, 0, 'no jobs before reaching the counter');
  for (let i = 0; i < 30 * 20 && w.tray.length === 0; i++) updStaff(w, DT);
  eq(w.tray.length, 2, 'waiter takes 2'); eq(PASS.n, PASS_MAX - 2, 'counter -2');
  updStaff(w, DT); ok(w.jobs[0] === d[0] && w.jobs[1] === d[1], 'longest-waiting diners claimed first');
  for (let i = 0; i < 30 * 30 && (d[0].st === 'seated' || d[1].st === 'seated'); i++) { updStaff(w, DT); for (const gu of d) if (gu.st === 'seated') gu.t = Math.min(gu.t, 20); }
  eq(d[0].st, 'eat', 'first served'); eq(d[1].st, 'eat', 'second served'); eq(S.staff.waiter1, 2, 'waiter xp +1 a serve'); }
// ---- chef + 2 waiters: fully automatic; the innkeeper (parked far away) never helps
st(DIN.concat(['waiter1', 'table3', 'chef', 'table4', 'waiter2', 'garden', 'w1', 'room7']), 4);
{ PASS.n = 0; spawnT = 1; S.basket = 10;
  for (let i = 0; i < 30 * 480; i++) update(DT);
  ok(RUN.seated > 20, 'diners came: ' + RUN.seated); ok(RUN.hungry <= RUN.seated * .05, 'chef + 2 waiters: hungry ' + RUN.hungry + ' / ' + RUN.seated + ' (<= 5%)');
  ok(S.stats.diners > 15, 'fed ' + S.stats.diners); ok(PASS.n >= 0 && PASS.n <= PASS_MAX, 'counter within 0..6'); }
console.log(errs.length ? 'SYS DINING FAIL\n  ' + errs.join('\n  ') : 'SYS DINING OK');
if (errs.length) process.exitCode = 1;
