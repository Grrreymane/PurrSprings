// v2.1 fun check, step 1 (headless): a player from a new game to star 5 + POST min. Logs what the player sees
// (banners as they come on screen, paused cards, first-time picture cards, v2.1 lines, every purchase, rare guests,
// fireworks) and dumps a save every 30 s to .shots/tl/NNNN.json (game seconds) so .shots/stage.js scene 'tl' can open
// any moment in the real page and play on from there.
//   node D:/Minigame/_workflow/tools/headless.js . .shots/timeline.js --seed 1 -- [post=75] [profile=eager|casual|shopper] [max=min] [dir=.shots/tl]
// shopper = eager, and after star 5 it also shops by itself like a player with money would (tests/bot_balance.js): a booth
// piece (hat / pet / outfit / uniform) once it holds 1.5x its price, a fireworks show at 3x.
// The summary at the end: when two v2.1 events overlapped (festival, reporter, VIP / rare guest / mom, fireworks, a card),
// the busiest 10 s of banners, the longest stretch with nothing new after star 5, purchases per 10 min.
const fs = require('fs'), DT = 1 / 30;
const ARG = k => { const a = ARGS.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };
const POST = +(ARG('post') || 75), PROF = ARG('profile') || 'eager', DIR = ARG('dir') || '.shots/tl', MAX = +(ARG('max') || 400);
try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) {}
let path = [], key = '', think = 0, wander = 0, wantG = null, wantT = 0, fin = null;
function shopWant() {
  if (PROF !== 'shopper' || fin === null) return null;
  if (wantG && PADPOS.has(wantG.id) && S.money >= padNeed(UNLOCK[wantG.id])) return wantG;
  wantG = null; if (S.stats.time < wantT) return null; wantT = S.stats.time + 20;
  let best = null;
  for (const [id] of PADPOS) { const u = UNLOCK[id]; if (!(u.hat || u.pet || u.outfit || u.uniform || u.id === 'fw')) continue; const k = u.id === 'fw' ? 3 : 1.5;
    if (u.id === 'fw' && fwOn()) continue; if (S.money >= k * padNeed(u) && (!best || padNeed(u) < padNeed(best))) best = u; }
  if (best) wantG = T_PAD(best);
  return wantG;
}
function drive(dt) {
  think -= dt;
  if (PROF === 'casual') { wander -= dt; if (wander <= 0) wander = 6; if (wander < 1.8) { botMove = null; return; } }   // 30 % standing
  if (think <= 0) {
    think = PROF === 'casual' ? 1 : .3;
    const t = S.tut.moved ? shopWant() || guideTarget() : { tx: 17, ty: 24 };
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
let lastB = null, lastLines = 0, unl = new Set(Object.keys(S.unlocked)), snapT = 0, lastFirst = null, lastAct = '', fwN = 0;
const bdesc = b => { const st = bannerParts(b); return b.kind + ':' + (st ? st.parts.filter(p => p.t !== undefined).map(p => p.t).join('') : '?'); };
const cardsSeen = [], bannerT = [], newsT = [], buyT = [], overlaps = {};
{ const r0 = rareArrive; rareArrive = function () { const r = r0(); if (r) { log(mm(S.stats.time) + ' ' + where() + ' RARE ' + VIPG.id + (S.rare[VIPG.id] ? ' (again)' : ' (first)')); newsT.push(S.stats.time); } return r; }; }
{ const v0 = vipArrive; vipArrive = function () { v0(); log(mm(S.stats.time) + ' ' + where() + ' VIP ' + VIPG.id); }; }
const active = () => {
  const a = [];
  if (FEST.on) a.push('fest'); if (PRESS.gu && !PRESS.gu.press.done) a.push('press');
  if (VIPG) a.push(VIPG.mom ? 'mom' : VIPG.rare ? 'rare' : 'vip'); if (fwOn()) a.push('fireworks');
  if (FIRST_Q[0]) a.push('card:' + FIRST_Q[0].key); if (INFO) a.push('info');
  return a;
};
for (let i = 0; i < MAX * 60 / DT; i++) {
  drive(DT); update(DT);
  const now = S.stats.time;
  if (state === 'celebrate') { log(mm(now) + ' ' + where() + ' CELEBRATE panel'); S.done = true; go('play'); }
  if (state === 'card') { const m = MODAL_Q[0]; log(mm(now) + ' ' + where() + ' CARD ' + JSON.stringify(m)); cardsSeen.push([now, m.kind]); newsT.push(now); modalClose(); }
  const b = BANNER_Q[0]; if (b && b !== lastB && b.age > 0) { lastB = b; bannerT.push(now); log(mm(now) + ' ' + where() + ' banner ' + bdesc(b) + (BANNER_Q.length > 1 ? '  [+' + (BANNER_Q.length - 1) + ' queued]' : '')); if (b.kind !== 'day' && b.kind !== 'rank' && b.kind !== 'level') newsT.push(now); }
  const fc = FIRST_Q[0]; if (fc && fc !== lastFirst) { lastFirst = fc; log(mm(now) + ' ' + where() + ' FIRST card ' + fc.key); }
  for (; lastLines < RUN.lineLog.length; lastLines++) { const [t, id] = RUN.lineLog[lastLines]; if (id[0] === 'E') log(mm(t) + ' ' + where() + ' line ' + id + ' ' + (typeof LINES[id].text === 'function' ? '' : LINES[id].text)); }
  for (const id of Object.keys(S.unlocked)) if (!unl.has(id)) { unl.add(id); const u = UNLOCK[id]; if (u) { buyT.push(now); newsT.push(now); log(mm(now) + ' ' + where() + ' buy ' + id + ' ' + u.name + ' ' + u.price); } }
  if ((S.fw.n | 0) > fwN) { fwN = S.fw.n; buyT.push(now); newsT.push(now); log(mm(now) + ' ' + where() + ' buy fireworks #' + fwN); }
  if ((i % 30) === 0) {
    const a = active(), k = a.join('+');
    if (k !== lastAct) { lastAct = k; const ev = a.filter(x => !x.startsWith('card') && x !== 'info'); if (ev.length >= 2 || (ev.length >= 1 && a.length >= 3)) { overlaps[k] = (overlaps[k] || 0) + 1; log(mm(now) + ' ' + where() + ' OVERLAP ' + k); } }
  }
  if (now >= snapT) { snapT += 30; fs.writeFileSync(DIR + '/' + String(Math.round(now)).padStart(5, '0') + '.json', JSON.stringify({ S, P: { x: P.x, y: P.y, dir: P.dir } })); }
  if (fin === null && star() >= 5) { fin = now; log(mm(fin) + ' ' + where() + ' STAR 5'); }
  if (fin !== null && now - fin >= POST * 60) break;
}
log('end ' + mm(S.stats.time) + ' ' + where() + ' hearts ' + S.hearts + ' money ' + S.money + ' awards ' + JSON.stringify(S.awards) + ' medals ' + S.medals.length + ' covers ' + JSON.stringify(S.covers) + ' rare ' + JSON.stringify(S.rare) + ' shrine ' + shrineLv() + ' combos ' + Object.keys(S.combos).length);
// ---- summary
const sum = [];
let busy = 0, busyAt = 0; for (let i = 0; i < bannerT.length; i++) { let n = 0; for (let j = i; j < bannerT.length && bannerT[j] < bannerT[i] + 10; j++) n++; if (n > busy) { busy = n; busyAt = bannerT[i]; } }
sum.push('banners: ' + bannerT.length + ', busiest 10 s: ' + busy + ' at ' + mm(busyAt));
const gaps = (L, from) => { const a = L.filter(t => t >= from).sort((x, y) => x - y); let g = 0, at = from; for (let i = 1; i < a.length; i++) if (a[i] - a[i - 1] > g) { g = a[i] - a[i - 1]; at = a[i - 1]; } return [g, at]; };
if (fin !== null) {
  const [g1, a1] = gaps(buyT, fin), [g2, a2] = gaps(newsT, fin);
  sum.push('after ★5: longest without a purchase ' + mm(g1) + ' (from ' + mm(a1) + '), longest with nothing new (buy / event / banner) ' + mm(g2) + ' (from ' + mm(a2) + ')');
  const per = []; for (let t = fin; t < S.stats.time; t += 600) per.push(buyT.filter(x => x >= t && x < t + 600).length);
  sum.push('purchases per 10 min after ★5: ' + per.join(' '));
}
const [g0, a0] = gaps(buyT, 0); sum.push('whole run: longest without a purchase ' + mm(g0) + ' (from ' + mm(a0) + ')');
sum.push('overlaps: ' + (Object.entries(overlaps).map(([k, n]) => k + ' x' + n).join(', ') || 'none'));
log('---- summary'); sum.forEach(s => log(s));
fs.writeFileSync(DIR + '/log.txt', out.join('\n') + '\n');
console.log(out.join('\n'));
