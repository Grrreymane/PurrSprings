// First towel run audit: node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/towelrun.js --seed N -- [eager|casual]
// Follows the arrow like tests/bot.js; measures, for the first 3 towel runs, the time from picking up towels to dropping
// them in the basket and how many times the arrow pointed somewhere else while you carried them.
const PROFILE = ARGS[0] || 'eager', PROF = { eager: { react: .3, distract: 0 }, casual: { react: 1, distract: .3 } }[PROFILE], DT = 1 / 30;
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
newGame();
let path = [], key = '', think = 0, mode = 'follow', episode = 0;
function randomTile() { for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } } return []; }
function drive(dt) {
  episode -= dt;
  if (episode <= 0) { episode = 3 + Math.random() * 5; const was = mode; mode = Math.random() < PROF.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow'; if (mode !== was) { path = []; key = ''; think = 0; if (mode === 'wander') path = randomTile(); } }
  think -= dt;
  if (think <= 0 && mode === 'follow') { think = PROF.react; const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 }; if (!t || t.here) { path = []; key = ''; } else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; } }
  if (path.length) { const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy); if (d < 1.5) path.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
}
const runs = []; let cur = null, lastKind = null;
for (let i = 0; i < 12 * 60 / DT && runs.length < 3; i++) {
  const tw0 = P.towels, b0 = S.basket;
  drive(DT); update(DT);
  if (!cur && P.towels > tw0) { cur = { start: S.stats.time, away: [], lastLab: null }; }
  if (cur && Math.abs(guideClock - .25) < 1e-6 && GUIDE && !GUIDE.here) {
    const lab = GUIDE.kind + (GUIDE.id ? ':' + GUIDE.id : '');
    if (lab !== cur.lastLab) { cur.lastLab = lab; if (GUIDE.kind !== 'basket' && GUIDE.kind !== 'shelf') cur.away.push(lab); }
  }
  if (cur && S.basket > b0 && P.towels < tw0) { cur.end = S.stats.time; runs.push(cur); cur = null; }
}
console.log(PROFILE + ' onsen ' + mmss(UNLOCKS.find(u => u.id === 'onsen') && S.unlocked.onsen ? 0 : 0) + ' | ' + runs.map((r, i) => `run${i + 1} ${mmss(r.start)} +${(r.end - r.start).toFixed(0)}s, arrow away x${r.away.length} (${r.away.join(' ')})`).join(' || '));
