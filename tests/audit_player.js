// Player-experience audit (v2.0): what a new player sees and hears, second by second, for the first N minutes.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_player.js --seed 1 -- [casual|eager] [minutes] [post=min] [fix=v1_s5]
// fix=<name>: start from tests/fixtures/<name>.json (a v1 save) instead of a new game; runs the full [minutes].
// A casual-ish bot (bot_balance.js casual: 1 s reaction, 30 % of the time wandering / standing) follows the arrow.
// Every second it renders a frame and reads TQ (the text queue): CJK characters drawn outside the HUD rows, how many
// things ask for attention at once (banner, line bubble, bottom card, edge tags, icon bubbles on screen, price pads on
// screen), which song the area plays. It also counts lines by id, banners by kind, first-time cards, song switches.
// Read-only: it never changes the game's rules. Names start with a (aud*) so they don't shadow the game's.
const audProf = ARGS[0] || 'casual', audMin = +ARGS[1] || 35;
const audPost = (ARGS.find(s => s.startsWith('post=')) || 'post=0').slice(5) | 0;
const audP = { casual: { react: 1, distract: .3 }, eager: { react: .3, distract: 0 } }[audProf];
const DT = 1 / 30;
const audFix = (ARGS.find(s => s.startsWith('fix=')) || '').slice(4);
if (audFix) { localStorage.setItem(SAVE + 'state', require('fs').readFileSync(require('path').join(process.cwd(), 'tests', 'fixtures', audFix + '.json'), 'utf8')); go('title'); continueGame(); } else newGame();
let aPath = [], aKey = '', aThink = 0, aMode = 'follow', aEp = 0;
const aRand = () => { for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } } return []; };
function aDrive(dt) {
  aEp -= dt;
  if (aEp <= 0) { aEp = 3 + Math.random() * 5; const was = aMode; aMode = Math.random() < audP.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow'; if (aMode !== was) { aPath = []; aKey = ''; aThink = 0; if (aMode === 'wander') aPath = aRand(); } }
  aThink -= dt;
  if (aThink <= 0 && aMode === 'follow') {
    aThink = audP.react;
    const t = S.tut.moved ? GUIDE : { key: 'start', tx: 17, ty: 24 };
    if (!t || t.here) { aPath = []; aKey = ''; }
    else { const k = t.key + '@' + t.tx + ',' + t.ty; if (k !== aKey || !aPath.length) { aKey = k; const [sx, sy] = tileOf(P); aPath = findPath(sx, sy, t.tx, t.ty) || []; } }
  }
  if (aPath.length) {
    const [tx, ty] = aPath[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) aPath.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
  } else botMove = null;
}
const CJK = /[\u3400-\u9fff\uff01-\uff5e\u3000-\u303f]/g;
const cjk = s => (String(s).match(CJK) || []).length;
const sec = [];               // one per second
const bannerSeen = new Map(); // banner object -> first second
const bannerLog = [];         // [t, kind, text]
const bannerDelay = [];       // [kind, s from banner() to on screen]
const firstLog = [];
let lastFirst = null, songPrev = null, songSw = [], songT = {}, star5 = null;
const lineN = {};
const onScreen = (wx, wy) => wx - cam.x >= 0 && wx - cam.x < W && wy - cam.y >= 0 && wy - cam.y < H;
const total = (audMin + audPost) * 60, aT0 = S.stats.time;
for (let i = 0, n = Math.round(total / DT); i < n; i++) {
  aDrive(DT); update(DT);
  if (state === 'celebrate') { if (star5 === null) star5 = S.stats.time; S.done = true; go('play'); }
  if (star5 === null && star() >= 5) star5 = S.stats.time;
  if (star5 !== null && audPost === 0 && !audFix) break;
  if (star5 !== null && !audFix && S.stats.time > star5 + audPost * 60) break;
  if (audFix && S.stats.time - aT0 > audMin * 60) break;
  // the song (the area under the innkeeper)
  { const a = areaAt(Math.floor(P.x / TILE), Math.floor(P.y / TILE)), song = a ? a.music : 'lobby';
    songT[song] = (songT[song] || 0) + DT;
    if (song !== songPrev) { if (songPrev !== null) songSw.push(S.stats.time); songPrev = song; } }
  if (i % 30 !== 0) continue;
  TQ.length = 0; try { render(); } catch (e) { console.log('render threw', e && e.message); }
  const t = S.stats.time;
  // text drawn outside the HUD rows (y > 30); the HUD is numbers and icons anyway
  let ch = 0, items = 0; const words = [];
  for (const q of TQ) { if (q.y <= 30 && q.size <= 8 && state === 'play') continue; const c = cjk(q.s); if (c) { ch += c; items++; words.push(q.s); } }
  const b = BANNER_Q[0];
  if (b && !bannerSeen.has(b)) { bannerSeen.set(b, t); bannerDelay.push([b.kind, T - b.t]); const st = bannerParts(b); bannerLog.push([Math.round(t), b.kind, st ? st.parts.filter(p => p.t !== undefined).map(p => p.t).join('') : '']); }
  const fc = FIRST_Q[0]; if (fc && fc !== lastFirst) { lastFirst = fc; firstLog.push([Math.round(t), fc.key]); }
  let bub = 0; for (const gu of GUESTS) if ((gu.bub || gu.call) && onScreen(gu.x, gu.y)) bub++;
  if (VIPG && onScreen(VIPG.x, VIPG.y)) bub++;
  let pads = 0; for (const [id, xy] of PADPOS) if (onScreen(xy[0] * TILE + 8, xy[1] * TILE + 8)) pads++;
  const att = (b ? 1 : 0) + (LINE ? 1 : 0) + (INFO || FIRST_Q[0] ? 1 : 0) + EDGE_Q.length;
  const xin = TQ.filter(q => String(q.s).includes('新')).length;
  sec.push({ t, xin, ch, items, words, b: b ? b.kind : null, line: LINE ? LINE.text : null, card: INFO ? 'info' : FIRST_Q[0] ? 'first' : null, edge: EDGE_Q.length, bub, pads, att, st: star(), night: dayLight().night });
}
for (const [tt, id] of RUN.lineLog) lineN[id] = (lineN[id] || 0) + 1;
// ---- report
const mm = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const end = S.stats.time;
console.log(`${audProf} ${mm(end)} played, star ${star()}${star5 !== null ? ' (star 5 at ' + mm(star5) + ')' : ''}`);
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const by = (f) => { const out = {}; for (const s of sec) { const k = f(s); out[k] = (out[k] || 0) + 1; } return out; };
const chs = sec.map(s => s.ch), atts = sec.map(s => s.att), bubs = sec.map(s => s.bub);
console.log(`CJK chars on screen (outside HUD) per second: median ${pct(chs, .5)}, p90 ${pct(chs, .9)}, max ${Math.max(...chs)}`);
for (const st of [1, 2, 3, 4, 5]) { const a = sec.filter(s => s.st === st); if (!a.length) continue; const c = a.map(s => s.ch), at = a.map(s => s.att), bb = a.map(s => s.bub), pd = a.map(s => s.pads);
  console.log(`  star ${st} (${a.length}s): chars med ${pct(c, .5)} p90 ${pct(c, .9)} max ${Math.max(...c)} | attention items (banner+line+card+edge) med ${pct(at, .5)} p90 ${pct(at, .9)} max ${Math.max(...at)} | icon bubbles on screen med ${pct(bb, .5)} p90 ${pct(bb, .9)} max ${Math.max(...bb)} | pads on screen max ${Math.max(...pd)} | banner up ${Math.round(a.filter(s => s.b).length / a.length * 100)}% line up ${Math.round(a.filter(s => s.line).length / a.length * 100)}% card up ${Math.round(a.filter(s => s.card).length / a.length * 100)}% night ${Math.round(a.filter(s => s.night > .5).length / a.length * 100)}%`); }
const worst = sec.slice().sort((a, b) => b.ch - a.ch).slice(0, 5);
{ const x = sec.map(s => s.xin); console.log(`'新' labels on screen at once: max ${Math.max(...x)}, seconds with >= 3: ${x.filter(v => v >= 3).length}, with >= 2: ${x.filter(v => v >= 2).length} (of ${x.length})`); }
console.log('wordiest seconds:'); for (const s of worst) console.log(`  ${mm(s.t)} ${s.ch} chars: ${s.words.join(' / ')}`);
const busiest = sec.slice().sort((a, b) => (b.att * 10 + b.bub) - (a.att * 10 + a.bub)).slice(0, 5);
console.log('busiest seconds:'); for (const s of busiest) console.log(`  ${mm(s.t)} banner ${s.b} line ${s.line} card ${s.card} edge ${s.edge} bubbles ${s.bub} pads ${s.pads}`);
console.log(`banners: ${bannerLog.length} (${(bannerLog.length / (end / 60)).toFixed(1)}/min) by kind ${JSON.stringify(bannerLog.reduce((o, b) => (o[b[1]] = (o[b[1]] || 0) + 1, o), {}))}`);
const perMin = {}; for (const b of bannerLog) { const m = Math.floor(b[0] / 60); perMin[m] = (perMin[m] || 0) + 1; }
console.log(`  banners per minute: max ${Math.max(0, ...Object.values(perMin))} (minute ${Object.keys(perMin).find(k => perMin[k] === Math.max(...Object.values(perMin)))})`);
console.log('  first 20 banners: ' + bannerLog.slice(0, 20).map(b => mm(b[0]) + ' ' + b[2]).join(' | '));
{ const d = k => bannerDelay.filter(x => k.includes(x[0])).map(x => x[1]); const a = d(['buy', 'area', 'combo', 'statue']); console.log(`  delay from purchase/combo to its banner on screen: median ${pct(a, .5).toFixed(1)} s, p90 ${pct(a, .9).toFixed(1)} s, max ${Math.max(...a).toFixed(1)} s; ${a.filter(x => x > 2.5).length} of ${a.length} waited > 2.5 s`); }
console.log('first-time cards: ' + firstLog.map(f => mm(f[0]) + ' ' + f[1]).join(', '));
const lines = Object.entries(lineN).sort((a, b) => b[1] - a[1]);
const ltot = lines.reduce((a, b) => a + b[1], 0);
console.log(`lines: ${ltot} (${(ltot / (end / 60)).toFixed(1)}/min), ${lines.length} different of ${Object.keys(LINES).length}; top: ` + lines.slice(0, 12).map(([id, n]) => id + ' ' + (typeof LINES[id].text === 'function' ? '#' : LINES[id].text) + ' x' + n).join(', '));
console.log('  never said: ' + Object.keys(LINES).filter(k => !lineN[k]).join(' '));
if (star5 !== null && audPost) { const gs = []; console.log('after star 5 (min:s after it): ' + RUN.shop.map(([t, id]) => mm(t - star5) + ' ' + UNLOCK[id].name).join(', ') + ` | money now ${S.money}, statue paid ${S.paid.statue || 0}, gold stars ${goldStars()}, hearts ${S.hearts}`); }
const st = Object.entries(songT).sort((a, b) => b[1] - a[1]);
console.log('songs (time share): ' + st.map(([k, v]) => k + ' ' + Math.round(v / end * 100) + '%').join(', ') + ` | switches ${songSw.length} (${(songSw.length / (end / 60)).toFixed(1)}/min)`);
for (const s0 of [0, 600, 1200, 1800]) { const n = songSw.filter(x => x >= s0 && x < s0 + 600).length; console.log(`  switches ${mm(s0)}-${mm(s0 + 600)}: ${n}`); }
