// ONE-OFF: builds the v1 save fixtures used by tests/migrate_v1.js (SPEC_v2 10.2 / 15.2 stage 0).
// It only runs against the v1 game (commit 7f59a73), e.g.:
//   git -C D:/Minigame/Hotelgame show 7f59a73:index.html > <tmp>/index.html
//   node D:/Minigame/_workflow/tools/headless.js <tmp> D:/Minigame/Hotelgame/tests/make_v1_fixtures.js --seed 3 -- D:/Minigame/Hotelgame/tests/fixtures
// An eager guide-following bot plays a new v1 game; S (exactly what save() writes) is dumped
//   v1_s1 .. v1_s5   : 40 s into star 2..5 (100 s into star 1) (rooms reserved / occupied / messy, piles, part payments in flight)
//   v1_s5_notdone    : v1_s5 with done = false (bought the sign, never saw the celebration)
//   v1_sign_half     : star 4 with the sign pad about half paid
//   v1_odd.json      : odd / broken raw save strings (tests/repro_save_shapes.js + smoke.js shapes and a few more)
const fs = require('fs'), pathM = require('path');
const OUTDIR = ARGS[0] || 'tests/fixtures';
fs.mkdirSync(OUTDIR, { recursive: true });
const DT = 1 / 30;
newGame();
let path = [], key = '', think = 0, stuckT = 0, lastPos = [P.x, P.y];
function drive(dt) {
  think -= dt;
  if (think <= 0) {
    think = .3;
    const t = S.tut.moved ? guideTarget() : { tx: 7, ty: 24 };
    if (!t || t.here) { path = []; key = ''; }
    else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; }
  }
  if (path.length) {
    const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) path.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    if (Math.hypot(P.x - lastPos[0], P.y - lastPos[1]) < .2) { stuckT += dt; if (stuckT > 1.5) { stuckT = 0; key = ''; think = 0; path = []; } } else stuckT = 0;
  } else { botMove = null; stuckT = 0; }
  lastPos = [P.x, P.y];
}
const dump = (name, s) => { fs.writeFileSync(pathM.join(OUTDIR, name + '.json'), JSON.stringify(s, null, 1) + '\n'); console.log('wrote', name, 'star', starOf(s), 'money', s.money, 't', Math.round(s.stats.time) + 's', 'unlocked', Object.keys(s.unlocked).length); };
const snap = () => JSON.parse(JSON.stringify(S));
const reachedAt = {}, done = {};
let halfDone = false;
for (let i = 0; i < 40 * 60 * 30; i++) {
  drive(DT); update(DT);
  if (state === 'celebrate') { S.done = true; saveNow(); go('play'); } if (state === 'card') modalClose();
  const st = star(), t = S.stats.time;
  if (reachedAt[st] === undefined) reachedAt[st] = t;
  if (!done[st] && t - reachedAt[st] >= (st === 1 ? 100 : 40)) { done[st] = true; const s = snap(); dump('v1_s' + st, s); if (st === 5) { s.done = false; dump('v1_s5_notdone', s); } }
  if (!halfDone && st === 4 && !S.unlocked.sign && (S.paid.sign || 0) >= 450 && (S.paid.sign || 0) <= 700) { halfDone = true; dump('v1_sign_half', snap()); }
  if (done[5] && halfDone) break;
}
if (!halfDone) {   // the bot paid the sign in one go: make the half-paid save from star 4 by hand
  const s = JSON.parse(fs.readFileSync(pathM.join(OUTDIR, 'v1_s4.json'), 'utf8'));
  s.paid.sign = 550; dump('v1_sign_half', s);
}
const ODD = [
  '{}', 'null', '[]', 'not json', '{"v":1,"stats":null,"tut":7}',
  '{"money":"12","unlocked":{"room2":true},"rooms":{"room1":"occupied","room2":"reserved"}}',
  '{"piles":{"desk":5}}', '{"piles":[3,4]}', '{"piles":{"room5":9,"onsen":4,"constructor":2}}',
  '{"money":1e999}', '{"money":-5,"earned":"x"}', '{"money":12,"paid":{"room2":40}}', '{"money":0,"paid":{"room2":30}}',
  '{"unlocked":{"porter":true},"basket":0}', '{"unlocked":{"sign":true},"done":false}',
  '{"paid":{"sign":600,"foo":5},"money":10}', '{"unlocked":null,"paid":"x","piles":null,"rooms":[1],"stats":{"guests":"9"}}',
  '{"unlocked":{"room1":true,"room2":true,"onsen":true,"room6":true},"rooms":{"room6":"messy","room9":"clean"},"piles":{"room6":7,"milk":3}}',
];
fs.writeFileSync(pathM.join(OUTDIR, 'v1_odd.json'), JSON.stringify(ODD, null, 1) + '\n');
console.log('wrote v1_odd', ODD.length, 'shapes; star reached at', JSON.stringify(reachedAt));
