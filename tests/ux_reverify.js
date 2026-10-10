// UX re-verify helper (pasted into the game closure by _workflow/tools/headless.js):
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/ux_reverify.js --seed 1 -- [min] [eager|casual] [sticky]
// Follows the arrow like tests/newplayer.js and classifies arrow flip-flops (A -> B -> A within 2 s) by target pair and
// by how far apart A and B are (tiles). Far flips (> 8 tiles: lobby <-> onsen) are the ones a player notices.
// Also reports, at each paid unlock, where the camera was and whether the new staff / pad is on screen.
//   sticky : rule 6 (biggest pile) keeps the pile it already points at while that pile still has fish (prototype)
const MIN = +ARGS[0] || 16, PROFILE = ARGS[1] || 'eager', STICKY = ARGS.includes('sticky');
const PROF = { eager: { react: .3, distract: 0 }, casual: { react: 1, distract: .3 } }[PROFILE];
const DT = 1 / 30;
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') + '.' + Math.floor((t % 1) * 10);
if (STICKY) { const g0 = guideTarget; guideTarget = function () {
  const r = g0();
  // only rewrite a rule-6 answer: a pile that is not the near pile, while the previous target was another pile still holding fish
  if (r && r.kind === 'pile' && GUIDE && GUIDE.kind === 'pile' && !GUIDE.here && (GUIDE.tx !== r.tx || GUIDE.ty !== r.ty)) {
    const [ptx, pty] = tileOf(P), near = Math.abs(r.tx - ptx) + Math.abs(r.ty - pty) < 4;
    const prev = Object.keys(PILE_AT).find(id => PILE_AT[id][0] === GUIDE.tx && PILE_AT[id][1] === GUIDE.ty);
    if (!near && prev && S.piles[prev] > 0) return T_PILE(prev);
  }
  return r;
}; console.log('variant: sticky'); }
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
const lab = g => !g ? '-' : g.kind + (g.id ? ':' + g.id : '') + '@' + g.tx + ',' + g.ty;
let detour = 0, hist = [], flips = 0, far = 0, pairs = {}, farList = [], lastLab = null;
const un0 = unlock; const buys = [];
unlock = function (id) {
  const had = S.unlocked[id]; un0(id);
  if (!had && S.unlocked[id]) {
    const s = STAFF.find(q => q.id === id), cx = R(cam.x), cy = R(cam.y);
    const onS = e => e.x - cx > 0 && e.x - cx < W && e.y - cy > 0 && e.y - cy < H;
    buys.push(mmss(S.stats.time) + ' ' + id + ' cam ' + cx + ',' + cy + (s ? ' staff@' + R(s.x - cx) + ',' + R(s.y - cy) + (onS(s) ? ' ON' : ' OFF') + '-screen' : ''));
  }
};
let unaff = 0, none = 0;
for (let i = 0, n = Math.round(MIN * 60 / DT); i < n; i++) {
  drive(DT); update(DT);
  if (Math.abs(guideClock - .25) < 1e-6) {
    const g = GUIDE, l = lab(g), t = S.stats.time;
    if (S.tut.moved && !g) none += .25;
    if (g && g.kind === 'pad' && !g.here && S.money < padNeed(UNLOCK[g.id])) unaff += .25;
    if (g && g.here) continue;
    if (l !== lastLab) {
      hist.push([t, l, g, tileOf(P)]); hist = hist.filter(h => t - h[0] <= 2);
      if (hist.length >= 3 && hist[hist.length - 3][1] === l && l !== '-') {
        flips++;
        const hb = hist[hist.length - 2], a = hb[2], d = a && g ? Math.abs(a.tx - g.tx) + Math.abs(a.ty - g.ty) : 99;
        // the middle target was a pile 1-3 steps from you when it appeared: a legit grab-it-on-the-way detour
        if (a && a.kind === 'pile' && Math.abs(a.tx - hb[3][0]) + Math.abs(a.ty - hb[3][1]) < 4) { detour++; lastLab = l; continue; }
        const pk = [g.kind, a ? a.kind : '-'].sort().join('<>'); pairs[pk] = (pairs[pk] || 0) + 1;
        if (d > 8) { far++; if (farList.length < 10) farList.push(mmss(t) + ' ' + hist.map(h => h[1]).join(' > ') + ' (' + d + ' tiles)'); }
      }
      lastLab = l;
    }
  }
}
console.log(`=== ${PROFILE} ${MIN} min${STICKY ? ' sticky' : ''}: near-pile detours ${detour}, other flips ${flips} (${(flips / MIN).toFixed(1)}/min), far (>8 tiles) ${far} (${(far / MIN).toFixed(1)}/min); no-arrow ${none.toFixed(1)} s; unaffordable-pad ${unaff.toFixed(1)} s; angry ${S.stats.angry}/${S.stats.guests + S.stats.angry}; unlocked ${Object.keys(S.unlocked).length}`);
console.log('flip pairs: ' + JSON.stringify(pairs));
farList.forEach(f => console.log('   far ' + f));
buys.forEach(b => console.log('   buy ' + b));
