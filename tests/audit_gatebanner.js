// Audit: when a star gate is bought, which banner / line does the player see first? (a rank overtake from the gate's
// hearts is queued before the gate's own banner, and its P06 line pushes out P04 "star up!")
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_gatebanner.js --seed N
const DT = 1 / 30; newGame();
let aPath = [], aKey = '', aThink = 0;
function aDrive(dt) {
  aThink -= dt;
  if (aThink <= 0) { aThink = .5; const t = S.tut.moved ? GUIDE : { key: 's', tx: 17, ty: 24 }; if (!t || t.here) { aPath = []; aKey = ''; } else { const k = t.key + '@' + t.tx + ',' + t.ty; if (k !== aKey || !aPath.length) { aKey = k; const [sx, sy] = tileOf(P); aPath = findPath(sx, sy, t.tx, t.ty) || []; } } }
  if (aPath.length) { const [tx, ty] = aPath[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy); if (d < 1.5) aPath.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
}
const out = [];
const u0 = unlock; unlock = function (id) {
  const gate = UNLOCK[id] && UNLOCK[id].gate && !S.unlocked[id], n0 = BANNER_Q.length;
  const r = u0(id);
  if (gate) { const q = BANNER_Q.slice(n0 > 0 ? 0 : 0).map(b => b.kind + (b.kind === 'rank' ? '(' + b.id + ')' : '')); out.push(id + ': queue [' + q.join(', ') + '] line ' + (LINE ? LINE.id : '-') + ' next ' + (LINE_NEXT ? LINE_NEXT.id : '-')); }
  return r;
};
for (let i = 0; i < 40 * 60 / DT && star() < 5; i++) { aDrive(DT); update(DT); if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') modalClose(); }
console.log(out.join(' | '));
