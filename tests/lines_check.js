// SPEC_v2 8 / 14.4: the cat lines. Static: every line of the 8.2 table exists, <= 8 characters, has a call site. Played
// (an eager bot, 25 min): at most one line on screen, every speaker exists and is on screen within 100 px of the
// innkeeper, the same line never twice within 60 s, chat lines keep the 7 s (star 1: 10 s) gap, only G01 in a new game's
// first minute; lines per minute (F1 target 4-8) are printed.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/lines_check.js --seed 3 [-- minutes]
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const DT = 1 / 30, MIN = +(ARGS[0] || 25);
// ---- static: the table
const IDS = [];
for (let i = 1; i <= 36; i++) IDS.push('G' + String(i).padStart(2, '0'));
for (let i = 1; i <= 19; i++) IDS.push('S' + String(i).padStart(2, '0'));
for (let i = 1; i <= 4; i++) IDS.push('K0' + i);
for (let i = 1; i <= 12; i++) IDS.push('V' + String(i).padStart(2, '0'));
for (let i = 1; i <= 6; i++) IDS.push('P0' + i);
IDS.push('A01', 'A02');
for (const id of IDS) ok(!!LINES[id], 'line ' + id + ' missing');
ok(Object.keys(LINES).length === IDS.length, 'table has ' + Object.keys(LINES).length + ' lines (want ' + IDS.length + ')');
const texts = [];
for (const id in LINES) {
  const L = LINES[id];
  const all = id === 'G36' ? MILESTONES.map(n => L.text(n)) : id === 'P05' ? [L.text(false), L.text(true)] : [L.text];
  for (const t of all) { texts.push(t); ok([...t].length <= 8, id + ' "' + t + '" longer than 8'); }
  ok(L.p > 0 && L.p <= 1, id + ' odds ' + L.p);
}
// every line has a call site in the game (a lineSay / say key, the arrival table, or the VIP greeting 'V0' + n)
{ const src = SCRIPT_TEXT;   // the game's own script (headless: the index.html under test)
  const used = new Set();
  for (const line of src.split('\n')) if (/lineSay\(|[^.\w]say\(|ARRIVE_LINE = /.test(line)) for (const m of line.matchAll(/'([A-Z]\d\d(?:\|[A-Z]\d\d)*)'/g)) m[1].split('|').forEach(k => used.add(k));
  for (let i = 1; i <= 6; i++) if (/lineSay\(VIPG, 'V0' \+/.test(src)) used.add('V0' + i);
  for (const id of IDS) ok(used.has(id), 'line ' + id + ' is never said (no call site)'); }
// ---- played: an eager bot follows the arrow; every line that shows is checked as it comes
S = defaults(); newGame(); S.tut.moved = true;
const shown = [], first = NUL(), speakers = [];
const _show = showLine;
showLine = ln => {
  const e = ln.e, L = LINES[ln.id], t = S.stats.time;
  const known = e === P || e === PET || e === VIPG || STAFF.includes(e) || GUESTS.includes(e) || GUESTS.some(gu => gu.mate === e);
  ok(known, ln.id + ': the speaker is nobody in the inn');
  ok(lineOk(e), ln.id + ': speaker off screen / too far');
  if (first[ln.id] !== undefined) ok(t - first[ln.id] >= 60 - 1e-6, ln.id + ' twice within 60 s (' + (t - first[ln.id]).toFixed(1) + ' s)');
  first[ln.id] = t;
  if (t < 60) ok(ln.id === 'G01', 'first minute: ' + ln.id);
  const prev = shown[shown.length - 1];
  if (!L.ev && prev) ok(UIT - prev.u >= (star() <= 1 ? 10 : 7) - 1e-6, 'chat ' + ln.id + ' only ' + (UIT - prev.u).toFixed(1) + ' s after the last line');
  ok(!LINE || LINE.ev || L.ev, 'a chat line cut in');
  shown.push({ t, u: UIT, id: ln.id, ev: L.ev });
  return _show(ln);
};
let path = [], key = '', think = 0, maxOn = 0;
for (let i = 0, n = Math.round(MIN * 60 / DT); i < n; i++) {
  think -= DT;
  if (think <= 0) { think = .3; const t = guideTarget(); if (!t || t.here) { path = []; key = ''; } else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; } }
  if (path.length) { const [tx, ty] = path[0], dx = tx * 16 + 8 - P.x, dy = ty * 16 + 8 - P.y, d = Math.hypot(dx, dy); if (d < 1.5) path.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
  update(DT); if (state === 'celebrate') { S.done = true; go('play'); }
  maxOn = Math.max(maxOn, LINE ? 1 : 0);
  if (i % 300 === 0) try { render(); } catch (e) { errs.push('render: ' + (e && e.message || e)); break; }
}
botMove = null;
ok(maxOn <= 1, 'lines on screen ' + maxOn);
// per-minute counts after the first minute
const per = []; for (let m = 1; m < MIN; m++) per.push(shown.filter(s => s.t >= m * 60 && s.t < (m + 1) * 60).length);
const sorted = per.slice().sort((a, b) => a - b), med = sorted[sorted.length >> 1] || 0;
const byId = NUL(); for (const s of shown) byId[s.id] = (byId[s.id] || 0) + 1;
ok(shown.length > 0, 'no line at all in ' + MIN + ' min');
ok(!shown.some(s => s.t < 60 && s.id !== 'G01'), 'first minute: only G01');
console.log('  ' + shown.length + ' lines in ' + MIN + ' min (star ' + star() + '); per minute after the first: median ' + med + ', min ' + sorted[0] + ', max ' + sorted[sorted.length - 1] + ' (F1 target 4-8)');
console.log('  per minute: ' + per.join(' '));
console.log('  most said: ' + Object.entries(byId).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => k + ' ' + n).join(', ') + ' | events ' + shown.filter(s => s.ev).length + ' / chat ' + shown.filter(s => !s.ev).length);
console.log(errs.length ? 'LINES CHECK FAIL\n  ' + [...new Set(errs)].slice(0, 30).join('\n  ') : 'LINES CHECK OK  ' + Object.keys(LINES).length + ' lines, all <= 8 characters');
if (errs.length) process.exitCode = 1;
