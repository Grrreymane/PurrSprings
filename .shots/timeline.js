// v2.1 fun check, step 1 (headless): an eager player from a new game to star 5 + POST min. Logs what the player sees
// (banners as they come on screen, paused cards, v2.1 lines, purchases) and dumps a save every 30 s to .shots/tl/NNNN.json
// (game seconds) so .shots/stage.js scene 'tl' can open any moment in the real page and play on from there.
//   node D:/Minigame/_workflow/tools/headless.js . .shots/timeline.js --seed 1 -- [post=75] [profile=eager|casual]
const fs = require('fs'), DT = 1 / 30;
const ARG = k => { const a = ARGS.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };
const POST = +(ARG('post') || 75), PROF = ARG('profile') || 'eager', DIR = ARG('dir') || '.shots/tl';
try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) {}
let path = [], key = '', think = 0, wander = 0;
function drive(dt) {
  think -= dt;
  if (PROF === 'casual') { wander -= dt; if (wander <= 0) wander = 6; if (wander < 1.8) { botMove = null; return; } }   // 30 % standing
  if (think <= 0) {
    think = PROF === 'casual' ? 1 : .3;
    const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };
    if (!t || t.here) { path = []; key = ''; }
    else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; }
  }
  if (path.length) {
    const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) path.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
  } else botMove = null;
}
newGame(); S.tut.moved = true;
const mm = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const out = [], log = s => { out.push(s); };
const where = () => 'd' + S.day + ' ' + '春夏秋冬'[seasonNow()] + ' c' + S.clock.toFixed(2) + ' ★' + star();
let lastB = null, lastLines = 0, unl = new Set(Object.keys(S.unlocked)), fin = null, snapT = 0;
const bdesc = b => { const st = bannerParts(b); return b.kind + ':' + (st ? st.parts.filter(p => p.t !== undefined).map(p => p.t).join('') : '?'); };
const cardsSeen = [];
for (let i = 0; i < 400 * 60 / DT; i++) {
  drive(DT); update(DT);
  if (state === 'celebrate') { log(mm(S.stats.time) + ' ' + where() + ' CELEBRATE panel'); S.done = true; go('play'); }
  if (state === 'card') { const m = MODAL_Q[0]; log(mm(S.stats.time) + ' ' + where() + ' CARD ' + JSON.stringify(m)); cardsSeen.push([S.stats.time, m.kind]); modalClose(); }
  const b = BANNER_Q[0]; if (b && b !== lastB && b.age > 0) { lastB = b; log(mm(S.stats.time) + ' ' + where() + ' banner ' + bdesc(b)); }
  for (; lastLines < RUN.lineLog.length; lastLines++) { const [t, id] = RUN.lineLog[lastLines]; if (id[0] === 'E') log(mm(t) + ' ' + where() + ' line ' + id + ' ' + (typeof LINES[id].text === 'function' ? '' : LINES[id].text)); }
  for (const id of Object.keys(S.unlocked)) if (!unl.has(id)) { unl.add(id); if (UNLOCK[id] && (UNLOCK[id].when || UNLOCK[id].booth)) log(mm(S.stats.time) + ' ' + where() + ' buy ' + id); }
  if (S.stats.time >= snapT) { snapT += 30; fs.writeFileSync(DIR + '/' + String(Math.round(S.stats.time)).padStart(5, '0') + '.json', JSON.stringify({ S, P: { x: P.x, y: P.y, dir: P.dir } })); }
  if (fin === null && star() >= 5) { fin = S.stats.time; log(mm(fin) + ' ' + where() + ' STAR 5'); }
  if (fin !== null && S.stats.time - fin >= POST * 60) break;
}
log('end ' + mm(S.stats.time) + ' ' + where() + ' hearts ' + S.hearts + ' awards ' + JSON.stringify(S.awards) + ' medals ' + S.medals.length + ' covers ' + JSON.stringify(S.covers) + ' combos ' + Object.keys(S.combos).join());
fs.writeFileSync(DIR + '/log.txt', out.join('\n') + '\n');
console.log(out.join('\n'));
