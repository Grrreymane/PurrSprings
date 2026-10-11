// Audit: standing still on a price pad after it completes - does the next pad that appears on the same tile get bought too?
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_chainbuy.js --seed 1
const DT = 1 / 30;
function setupUnl(ids) { for (const id of ids) { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; for (const rm of ROOMS) if (rm.open === id) S.rooms[rm.id] = 'clean'; } S.peak = Math.max(S.peak, starOf(S)); }
function standOn(tx, ty, money, secs) {
  Object.assign(P, { x: tx * TILE + 8, y: ty * TILE + 8, moving: false }); S.money = money; spawnT = 1e9;
  const before = new Set(Object.keys(S.unlocked)), log = [];
  for (let i = 0; i < secs / DT; i++) { update(DT); for (const id of Object.keys(S.unlocked)) if (!before.has(id)) { before.add(id); log.push((i * DT).toFixed(2) + 's ' + id + ' (' + UNLOCK[id].name + ')'); } }
  return log;
}
const cases = [
  ['front desk tile (19,25): recep then maid1', ['room2', 'room3', 'onsen'], [19, 25], 200],
  ['garden tile (27,27): shishi -> sakura -> maple', UNLOCKS.filter(u => UNLOCKS.indexOf(u) < UNLOCKS.findIndex(x => x.id === 'garden') + 1).map(u => u.id).filter(id => !UNLOCK[id].need5), [27, 27], 2000],
  ['staff tile (20,25): porter then clerk', ['room2', 'room3', 'onsen', 'recep', 'maid1', 'milk', 'dining'], [20, 25], 1000],
  ['tray tile (6,21): tray1', ['room2', 'room3', 'onsen', 'recep', 'maid1', 'dining'], [6, 21], 1000],
];
for (const [name, unl, [tx, ty], money] of cases) {
  newGame(); S.tut.moved = true; setupUnl(unl); resetWorld(); go('play'); padsUpdate();
  const log = standOn(tx, ty, money, 4);
  console.log(name + ': ' + (log.join(', ') || 'nothing') + ' | banners queued: ' + BANNER_Q.map(b => b.kind + ':' + b.id).join(','));
}
// the shop's two decor pads: (2,32) / (4,32)
for (const [tx, ty] of [[2, 32], [4, 32]]) {
  newGame(); S.tut.moved = true; setupUnl(['room2', 'room3', 'onsen', 'recep', 'maid1', 'shop', 'dining']); resetWorld(); go('play'); padsUpdate();
  console.log(`decor pad (${tx},${ty}) with 2000 fish, standing 8 s: ` + (standOn(tx, ty, 2000, 8).join(', ') || 'nothing'));
}
// hat booth after star 5
{ newGame(); S.tut.moved = true; setupUnl(UNLOCKS.filter(u => !u.need5).map(u => u.id)); S.done = true; resetWorld(); go('play'); padsUpdate();
  const hp = [...PADPOS].find(([id]) => UNLOCK[id].hat); console.log('hat booth at ' + (hp && hp[1]) + ' with 60000 fish, standing 10 s: ' + (hp ? standOn(hp[1][0], hp[1][1], 60000, 10).join(', ') || 'nothing' : 'no booth')); }
