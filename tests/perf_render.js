// Per-frame cost probe (pasted into the game closure by _workflow/tools/headless.js):
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/perf_render.js --seed 1
// Plays to ★5 with the guide-following driver (update only), then renders EVERY frame for 5 minutes like the
// real rAF loop and counts: new outlined-text sprites created (each = a fresh <canvas> + 33 fillText calls),
// TXC full clears, BFS calls per frame, and the pixel memory TXC holds (scaled to a 3x-DPR phone).
const DT = 1 / 30;
let path = [], key = '', think = 0;
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
  } else botMove = null;
}
newGame();
for (let i = 0; i < 30 * 60 * 30 && !S.unlocked.sign; i++) { drive(DT); update(DT); if (state === 'celebrate') { S.done = true; go('play'); } }
S.done = true; if (state !== 'play') go('play');
let created = 0, clears = 0, bfs = 0, bfsMax = 0, framesWithNew = 0;
const _ts = textSprite; textSprite = function (t) { const k = t.s + '|' + t.size + '|' + t.col + '|' + t.stroke + '|' + K; if (!TXC.has(k)) { created++; if (TXC.size > 400) clears++; } return _ts(t); };
const _fp = findPath; findPath = function (a, b, c, d) { bfs++; return _fp(a, b, c, d); };
const N = 5 * 60 * 30;
for (let i = 0; i < N; i++) {
  drive(DT); const c0 = created, b0 = bfs;
  update(DT); render();
  if (created > c0) framesWithNew++;
  bfsMax = Math.max(bfsMax, bfs - b0);
}
let px = 0; for (const v of TXC.values()) px += v.w * v.h;
const k = 6.5 / K;   // 390-css-px-wide phone at DPR 3: K = 1170 / 180 = 6.5
console.log(`after ★5 (${R(S.stats.time / 60)} min), 5 min rendered every frame at 30 fps:`);
console.log(`  new text sprites ${created} (${(created / 5).toFixed(0)}/min), frames that created at least one: ${framesWithNew}/${N} (${(framesWithNew / N * 100).toFixed(1)}%), TXC full clears ${clears}`);
console.log(`  TXC now ${TXC.size} entries = ${(px * 4 / 1e6).toFixed(1)} MB at K=${K}; ~${(px * 4 * k * k / 1e6).toFixed(0)} MB at K=6.5 (scaled)`);
console.log(`  BFS calls: ${bfs} total, max ${bfsMax} in one frame`);
