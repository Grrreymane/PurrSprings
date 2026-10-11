// Check (no bug expected): reloading cannot mint fish. A room saved as 'occupied' pays its tip exactly once,
// a 'reserved' room comes back clean with the room fee already in the desk pile, and repeated reloads
// (with or without a save in between) never add a second tip.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/check_reload_rewards.js --seed 1
const DT = 1 / 30, total = () => S.money + Object.values(S.piles).reduce((a, b) => a + b, 0);
newGame(); S.tut.moved = true;
S.unlocked.room2 = true; S.paid.room2 = 25; S.rooms.room2 = 'clean'; resetWorld(); go('play');
// two guests: check both in from the desk, let one reach its futon
Object.assign(P, { x: DESK_SPOT[0] * TILE + 8, y: DESK_SPOT[1] * TILE + 8 });
let n = 0; while (S.stats.guests < 2 && n++ < 30 * 60) update(DT);
n = 0; while (!Object.values(S.rooms).includes('occupied') && n++ < 30 * 60) update(DT);
console.log('rooms', JSON.stringify(S.rooms), '| piles', JSON.stringify(S.piles), '| money', S.money);
saveNow(); const saved = total();
const reload = () => { S = loadState(); resetWorld(); go('play'); return total(); };
const r1 = reload(); console.log('reload 1: rooms', JSON.stringify(S.rooms), 'fish', saved, '->', r1, '(+ one tip ' + STARS[star()].tip + ')');
const r2 = reload(); console.log('reload 2 without saving: fish', r2, '(same, not stacked)');
saveNow(); const r3 = reload(); console.log('save + reload 3: fish', r3, '| rooms', JSON.stringify(S.rooms));
Object.assign(P, { x: DESK_SPOT[0] * TILE + 8, y: DESK_SPOT[1] * TILE + 8 }); update(DT);
const room = ROOMS.find(rm => S.piles[rm.id] > 0);
if (room) { Object.assign(P, { x: room.pile[0] * TILE + 8, y: room.pile[1] * TILE + 8 }); update(DT); }
saveNow(); const r4 = reload(); console.log('collect, save, reload 4: fish', r4, '| piles', JSON.stringify(S.piles));
console.log(r1 - saved === STARS[star()].tip && r2 === r1 && r3 === r1 && r4 === r1 ? 'OK: reload pays the sleeping guest\'s tip once, never again' : 'MISMATCH');
// stage 2B (10.1): a VIP being served pays half of its unpaid gift into the cash box on load - once; and the next VIP then
// needs the full gap, so reloading never beats serving
for (const id of ['room3', 'onsen', 'recep', 'maid1', 'room4', 'room5', 'room6', 'dining', 'w1', 'room7', 'garden']) S.unlocked[id] = true;
S.peak = starOf(S); for (const rm of ROOMS) if (roomOpen(rm) && !S.rooms[rm.id]) S.rooms[rm.id] = 'clean'; resetWorld(); go('play');
vipArrive(); setSt(VIPG, 'seated'); VIPG.suite = 'c3'; RT.c3.guest = VIPG; VIPG.paid = R(VIPG.G * .25); S.vipOwe = VIPG.G - VIPG.paid;
const owe = S.vipOwe; saveNow(); const v0 = total();
const v1 = reload(), gap1 = vipT - S.stats.time; const v2 = reload(); saveNow(); const v3 = reload();
console.log('VIP owed ' + owe + ': fish ' + v0 + ' -> ' + v1 + ' (+' + (v1 - v0) + '), again ' + v2 + ', save + reload ' + v3 + ' | next VIP in ' + R(gap1) + ' s');
const vipOk = v1 - v0 === R(owe * .5) && v2 === v1 && v3 === v1 && gap1 >= 180 - .1;
console.log(vipOk ? 'OK: an interrupted VIP pays half its unpaid gift once; the next VIP needs the full gap' : 'MISMATCH (VIP)');
// v2.0 audit CRP-4: a served VIP leaves, then a reload - the next VIP is not any sooner than without the reload
resetWorld(); go('play'); vipArrive(); setSt(VIPG, 'seated'); VIPG.suite = 'c3'; RT.c3.guest = VIPG; S.vipOwe = 0; vipLeave(true);
const due = vipT; for (let i = 0; i < 30 * 5; i++) update(DT); saveNow(); reload(); const due2 = vipT; reload(); const due3 = vipT;
console.log('VIP served and gone: next due ' + R(due) + ' s; after a reload ' + R(due2) + ', again ' + R(due3) + ' (game time ' + R(S.stats.time) + ')');
const leftOk = due2 >= Math.floor(due) && due3 >= Math.floor(due);
console.log(leftOk ? 'OK: a reload after a VIP left does not bring the next one sooner' : 'MISMATCH (VIP gap after a reload)');
if (!vipOk || !leftOk || !(r1 - saved === STARS[1].tip && r2 === r1 && r3 === r1 && r4 === r1)) process.exitCode = 1;
