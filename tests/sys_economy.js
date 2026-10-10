// SPEC_v2 3.1-3.3: per-star fees, multipliers (all multiply, then round), quality Q, guest spawning.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_economy.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
function st(list, peak, o) { S = defaults(); for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean'; S.peak = Math.max(starOf(S), peak || 1); Object.assign(S, o || {}); resetWorld(); go('play'); }
// STARS table = SPEC 3.1 (v1 room / tip / bath / milk / gap unchanged)
eq(STARS.slice(1).map(s => [s.room, s.tip, s.bath, s.milk, s.meal, s.souv, s.gap].join('/')).join(' '),
  '12/5/6/4/0/0/7 14/5/9/5/0/4/6 16/6/10/6/10/6/5 20/8/12/8/12/10/4.2 25/10/15/10/15/12/3.6', 'STARS');
// base fees follow the star (peak counts)
st([], 1); eq(fee('room', { rm: ROOM.room1 }), 12, 'star 1 room');
st([], 4); eq(fee('room', { rm: ROOM.room1 }), 20, 'peak 4 room');
// cottage x1.5, decor x1.2, combo x1.6 (either / or), guest types
st(['garden', 'd_scroll', 'd_ikebana', 'd_bonsai'], 4);
eq(fee('room', { rm: ROOM.c1 }), 30, 'cottage x1.5');
S.decor['room1:A'] = 'd_bonsai'; eq(fee('room', { rm: ROOM.room1 }), 24, 'one decor x1.2');
S.decor['room1:A'] = 'd_scroll'; S.decor['room1:B'] = 'd_ikebana'; eq(fee('room', { rm: ROOM.room1 }), 32, 'combo x1.6');
eq(fee('tip', { rm: ROOM.room1 }), 16, 'combo tip x2');
eq(fee('tip', { rm: ROOM.room1, pref: true }), 24, 'combo + preference tip x2 x1.5');
S.decor['c1:A'] = 'd_scroll'; S.decor['c1:B'] = 'd_bonsai'; eq(roomCombo(ROOM.c1) && roomCombo(ROOM.c1).id, 's_tea', 'hidden combo found');
eq(fee('room', { rm: ROOM.c1 }), 48, 'cottage + combo = 20 x 1.5 x 1.6');
eq(fee('room', { rm: ROOM.room2, gu: { type: 'couple' } }), 32, 'couple x1.6');
eq(fee('room', { rm: ROOM.room2, gu: { type: 'family' } }), 36, 'family x1.8');
eq(fee('meal', { gu: { type: 'couple' } }), 24, 'couple breakfast x2');
eq(fee('milk', { gu: { type: 'elder' } }), 12, 'elder milk x1.5');
// quality Q = mean room multiplier of the open guest rooms (suites excluded)
{ const rooms = GUEST_ROOMS.filter(r => roomOpen(r)), q = rooms.reduce((a, r) => a + roomMult(r), 0) / rooms.length; ok(Math.abs(qualityQ() - q) < 1e-9 && qualityQ() > 1, 'Q ' + qualityQ()); }
// bath: onsen slot x1.5 with 浴池; roten day x1.2, night x1.8 (no 浴池 bonus); elder x1.5
st(['onsen', 'bigbath', 'roten'], 5);
eq(fee('bath', { slot: SLOTS[0] }), 23, 'onsen + 浴池 (15 x 1.5 = 22.5 -> 23)');
S.clock = .3; eq(fee('bath', { slot: SLOTS[5] }), 18, 'roten by day x1.2');
S.clock = .9; eq(fee('bath', { slot: SLOTS[5] }), 27, 'roten at night x1.8');
eq(fee('bath', { slot: SLOTS[5], gu: { type: 'elder' } }), 41, 'roten night elder 15 x 1.8 x 1.5 = 40.5 -> 41');
// gold stars: rivals 6-10 from star 5; +5 % each; statue +1 tip after rounding
S.clock = .3; S.hearts = 799; eq(goldStars(), 0, 'gold stars below 800 hearts');
S.hearts = 1500; eq(goldStars(), 2, 'gold stars at 1500');
eq(fee('room', { rm: ROOM.room1 }), 28, 'room 25 x 1.1 = 27.5 -> 28');
S.unlocked.statue = true; eq(fee('tip', { rm: ROOM.room1 }), 12, 'tip 10 x 1.1 + 1 (statue)');
st(['onsen'], 4, { hearts: 9999 }); eq(goldStars(), 0, 'no gold stars before star 5');
// spawn gap: max(1.8, gap x min(1, 9 / rooms)) x (1 - 0.03 x gold)
st([], 1); eq(spawnGap(), 7, '1 room, star 1');
st(UNLOCKS.filter(u => !u.need5).map(u => u.id), 5); eq(guestRoomsOpen(), 13, 'open guest rooms (suites excluded)');
ok(Math.abs(spawnGap() - 3.6 * 9 / 13) < 1e-9, '13 rooms, star 5: ' + spawnGap().toFixed(3) + ' s (SPEC: about 2.5)');
S.hearts = 10000; ok(Math.abs(spawnGap() - 3.6 * 9 / 13 * .85) < 1e-9, '5 gold stars -15 %');
// spawning rules: queue < 5, guests needing / holding a room < rooms + 3, at most 40 guests
st([], 1); for (let i = 0; i < 30 * 120; i++) update(1 / 30);
{ let need = 0; for (const gu of GUESTS) if (NEEDS_ROOM[gu.st]) need++; ok(Q.length <= 5 && need <= 1 + 3 && GUESTS.length <= GUEST_MAX, 'spawn caps: queue ' + Q.length + ', need room ' + need); }
st(UNLOCKS.filter(u => !u.need5).map(u => u.id), 5); S.basket = 10;
let peak = 0; for (let i = 0; i < 30 * 180; i++) { update(1 / 30); peak = Math.max(peak, GUESTS.length); }
ok(peak <= GUEST_MAX, 'never more than 40 guests: ' + peak);
console.log(errs.length ? 'SYS ECONOMY FAIL\n  ' + errs.join('\n  ') : 'SYS ECONOMY OK');
if (errs.length) process.exitCode = 1;
