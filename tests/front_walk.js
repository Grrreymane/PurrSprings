// v2.5 (player feedback "with the milk machine at the front door, the lamp on the left catches my feet"): walking in and
// out of the main entrance and from it to the front-door milk machine never snags on a prop. Everything bought (milk2,
// the gold statue, the shop's boutique ...): from the lobby through the entrance (cols 16-18, every 2 px across) straight
// down to the front gate and back up; from the entrance to the milk machine's spot with the stick aimed at it; from the
// milk spot back to the entrance and out to the gate. Each walk must take at most 1.25 x the straight-line time + 0.25 s,
// and the foot box never overlaps a blocked tile. The front walk (cols 15-19) and the milk machine's approach stay prop-free.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/front_walk.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const DT = 1 / 60;
S = defaults(); for (const u of UNLOCKS) S.unlocked[u.id] = true; for (const rm of ROOMS) S.rooms[rm.id] = 'clean';
S.peak = 5; S.done = true; S.tut.moved = true; resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0; GUESTS.length = 0;
let clip = 0;
function go2(x0, y0, x1, y1, label) {
  Object.assign(P, { x: x0, y: y0, moving: false }); const d = Math.hypot(x1 - x0, y1 - y0), sp = playerSpeed();
  for (let i = 0, n = Math.round((d / sp * 1.25 + .25) / DT); i < n; i++) {
    const dx = x1 - P.x, dy = y1 - P.y, r = Math.hypot(dx, dy);
    if (r < 3) return true;
    botMove = { x: dx / r, y: dy / r }; updPlayer(DT); if (boxHit(P.x, P.y)) clip++;
  }
  botMove = null; errs.push(label + ': stuck at ' + tileOf(P) + ' (' + R(P.x) + ',' + R(P.y) + ')'); return false;
}
const tx = t => t * TILE + 8;
let runs = 0;
for (let x = 16 * TILE + 2; x <= 19 * TILE - 2; x += 2) {
  go2(x, tx(27), x, tx(37), 'in -> out from x ' + x); go2(x, tx(37), x, tx(27), 'out -> in at x ' + x); runs += 2;
}
for (const sx of [16, 17, 18]) {
  go2(tx(sx), tx(28), tx(MILK2_SPOT[0]), tx(MILK2_SPOT[1]), 'entrance ' + sx + ' -> milk machine');
  go2(tx(MILK2_SPOT[0]), tx(MILK2_SPOT[1]), tx(sx), tx(28), 'milk machine -> entrance ' + sx);
  go2(tx(MILK2_SPOT[0]), tx(MILK2_SPOT[1]), tx(sx), tx(37), 'milk machine -> front gate ' + sx); runs += 3;
}
ok(clip === 0, 'the foot box overlapped a blocked tile on ' + clip + ' frames');
for (let y = 30; y <= 37; y++) for (let x = 15; x <= 19; x++) ok(!BLOCK[y * MW + x], 'the front walk is clear at ' + x + ',' + y);
for (const [x, y] of [[15, 30], [15, 31], [14, 31], [13, 31], [13, 32], [14, 32], [15, 32]]) ok(!BLOCK[y * MW + x], 'nothing round the milk machine\'s spot at ' + x + ',' + y);
console.log(errs.length ? 'FRONT WALK FAIL\n  ' + errs.slice(0, 30).join('\n  ') : 'FRONT WALK OK  ' + runs + ' walks through the entrance / to the milk machine');
if (errs.length) process.exitCode = 1;
