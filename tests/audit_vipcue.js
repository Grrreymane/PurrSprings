// Audit: when a VIP walks in, how long until the arrow points at it (kind 'vip'), and is the VIP on screen meanwhile?
// The first-time card "bring to the annex" shows at arrival.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_vipcue.js --seed N -- [react]
const DT = 1 / 30, REACT = +ARGS[0] || .5; newGame();
let aPath = [], aKey = '', aThink = 0;
function aDrive(dt) {
  aThink -= dt;
  if (aThink <= 0) { aThink = REACT; const t = S.tut.moved ? GUIDE : { key: 's', tx: 17, ty: 24 }; if (!t || t.here) { aPath = []; aKey = ''; } else { const k = t.key + '@' + t.tx + ',' + t.ty; if (k !== aKey || !aPath.length) { aKey = k; const [sx, sy] = tileOf(P); aPath = findPath(sx, sy, t.tx, t.ty) || []; } } }
  if (aPath.length) { const [tx, ty] = aPath[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy); if (d < 1.5) aPath.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
}
const out = []; let cur = null;
for (let i = 0; i < 45 * 60 / DT && out.length < 3; i++) {
  aDrive(DT); update(DT); if (state === 'celebrate') { S.done = true; go('play'); }
  const v = VIPG;
  if (v && (!cur || cur.v !== v)) cur = { v, t0: S.stats.time, arrow: null, seen: null, greet: null, kinds: {} };
  if (cur && cur.v === v) {
    const t = S.stats.time - cur.t0;
    if (GUIDE) cur.kinds[GUIDE.kind] = (cur.kinds[GUIDE.kind] || 0) + DT;
    if (cur.arrow === null && GUIDE && GUIDE.kind === 'vip') cur.arrow = t;
    if (cur.seen === null && v.x - cam.x >= 0 && v.x - cam.x < W && v.y - cam.y >= 30 && v.y - cam.y < H - 34) cur.seen = t;
    if (cur.greet === null && v.st === 'follow') { cur.greet = t; out.push(`${VIP[v.id].name} at ${Math.floor(cur.t0 / 60)}:${String(Math.floor(cur.t0 % 60)).padStart(2, '0')}: arrow on it after ${cur.arrow === null ? '-' : cur.arrow.toFixed(0)} s, on screen after ${cur.seen === null ? '-' : cur.seen.toFixed(0)} s, greeted after ${t.toFixed(0)} s; arrow meanwhile ${Object.entries(cur.kinds).map(([k, s]) => k + ' ' + s.toFixed(0) + 's').join(', ')}`); }
  }
}
console.log(out.join('\n'));
