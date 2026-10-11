// Audit: is the star-view bath (the star-5 reward area) in use when it opens? Bathers in its slots, 0-180 s after star 5.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_roten.js --seed N
const DT = 1 / 30; newGame();
let aPath = [], aKey = '', aThink = 0;
function aDrive(dt) {
  aThink -= dt;
  if (aThink <= 0) { aThink = .4; const t = S.tut.moved ? GUIDE : { key: 's', tx: 17, ty: 24 }; if (!t || t.here) { aPath = []; aKey = ''; } else { const k = t.key + '@' + t.tx + ',' + t.ty; if (k !== aKey || !aPath.length) { aKey = k; const [sx, sy] = tileOf(P); aPath = findPath(sx, sy, t.tx, t.ty) || []; } } }
  if (aPath.length) { const [tx, ty] = aPath[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy); if (d < 1.5) aPath.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
}
let t5 = null; const occ = [];
const RS = SLOTS.map((s, i) => s.need === 'roten' ? i : -1).filter(i => i >= 0), OS = SLOTS.map((s, i) => s.need !== 'roten' ? i : -1).filter(i => i >= 0);
for (let i = 0; i < 45 * 60 / DT; i++) {
  aDrive(DT); update(DT); if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') modalClose();
  if (t5 === null && star() >= 5) t5 = S.stats.time;
  if (t5 !== null && i % 30 === 0) { const t = S.stats.time - t5; if (t > 600) break; occ.push([t, RS.filter(k => SLOT_OCC[k]).length, OS.filter(k => SLOT_OCC[k]).length, dayLight().night]); }
}
const win = (a, b) => { const r = occ.filter(o => o[0] >= a && o[0] < b); return r.length ? (r.reduce((s, o) => s + o[1], 0) / r.length).toFixed(1) + ' (onsen ' + (r.reduce((s, o) => s + o[2], 0) / r.length).toFixed(1) + '/' + OS.length + ', night ' + (r.reduce((s, o) => s + o[3], 0) / r.length).toFixed(2) + ')' : '-'; };
console.log(`star-view bath slots ${RS.length}: avg bathers 0-60 s after star 5: ${win(0, 60)}, 60-180 s: ${win(60, 180)}, 180-600 s: ${win(180, 600)}`);
