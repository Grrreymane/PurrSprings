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
