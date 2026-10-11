// SPEC_v2 10.2 old-save test: every v1 save in tests/fixtures (made by tests/make_v1_fixtures.js from the v1 game) is
// loaded into v2 and played for 15 minutes by the eager guide-following bot.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/migrate_v1.js --seed 1 [-- <fixture filter> <minutes>]
// Right after loading: v = 2, star >= the v1 star (peak), nothing v1 bought is lost, money only grows by refunds (the
// v1 招牌's part payment), hearts = SPEC formula, piles kept (+ the tip of each guest that was asleep), <= 4 progress
// pads, no NaN, a save -> load round trip is stable. v2.0.1 G2: the celebration panel is for the whole inn built (every
// room and area) - a v1 save never has that, so loading queues no panel (a v1 招牌 never celebrated included); one that
// already saw the v1 panel (done) never gets another.
// While playing: the bot.js invariants + the v2 ones (hearts never drop, star >= peak, guide target reachable ...).
// Then every odd / broken save shape in v1_odd.json loads without throwing and plays 5 s.
const fs = require('fs'), pathM = require('path');
const DIR = pathM.join(process.cwd(), 'tests', 'fixtures'), FILTER = ARGS[0] && ARGS[0] !== 'all' ? ARGS[0] : '', MIN = +ARGS[1] || 15;
const DT = 1 / 30, errs = [], bad = (tag, m) => { if (errs.length < 80) errs.push(tag + ': ' + m); };
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
let path = [], key = '', think = 0, stuckT = 0, lastPos = [0, 0];
function drive(dt) {
  think -= dt;
  if (think <= 0) {
    think = .3;
    const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };
    if (!t || t.here) { path = []; key = ''; }
    else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; }
  }
  if (path.length) {
    const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) path.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    if (Math.hypot(P.x - lastPos[0], P.y - lastPos[1]) < .2) { stuckT += dt; if (stuckT > 1.5) { stuckT = 0; key = ''; think = 0; path = []; } } else stuckT = 0;
  } else { botMove = null; stuckT = 0; }
  lastPos = [P.x, P.y];
}
function nanWalk(o, at, tag) {
  if (typeof o === 'number') { if (!Number.isFinite(o)) bad(tag, 'not finite: ' + at); return; }
  if (o && typeof o === 'object') for (const k in o) nanWalk(o[k], at + '.' + k, tag);
}
const sum = o => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
function invariants(tag, st) {
  const t = mmss(S.stats.time);
  if (!Number.isFinite(S.money) || S.money < 0 || S.money !== Math.floor(S.money)) bad(tag, t + ' money ' + S.money);
  if (!Number.isFinite(S.hearts) || S.hearts < st.hearts) bad(tag, t + ' hearts ' + st.hearts + ' -> ' + S.hearts); st.hearts = S.hearts;
  for (const k in S.piles) if (!Number.isFinite(S.piles[k]) || S.piles[k] < 0 || !PILE_AT[k]) bad(tag, t + ' pile ' + k + ' ' + S.piles[k]);
  if (star() < S.peak || S.peak < st.v1Star) bad(tag, t + ' star ' + star() + ' peak ' + S.peak + ' v1 ' + st.v1Star);
  const prog = [...PADPOS.keys()].filter(id => !UNLOCK[id].decor && !UNLOCK[id].booth).length;
  if (prog > PAD_MAX) bad(tag, t + ' progress pads ' + prog);
  if (GUIDE && !GUIDE.here) { const [sx, sy] = tileOf(P); if (!findPath(sx, sy, GUIDE.tx, GUIDE.ty)) bad(tag, t + ' guide target unreachable ' + GUIDE.kind + ' ' + GUIDE.tx + ',' + GUIDE.ty); }
  for (const e of GUESTS.concat(STAFF)) {
    if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) bad(tag, t + ' NaN entity');
    const [tx, ty] = tileOf(e), a = areaAt(tx, ty); if (e.y < MAPH && a && !areaOpen(a)) bad(tag, t + ' entity in a locked area ' + tx + ',' + ty);
    if (e.t > 180 && e.st && e.st !== 'sleep' && e.st !== 'bathing') bad(tag, t + ' guest stuck in ' + e.st);
  }
  if (boxHit(P.x, P.y)) bad(tag, t + ' player in a wall');
  for (const k in st.v1u) if (!S.unlocked[k]) bad(tag, t + ' lost unlock ' + k);
  try { render(); } catch (e) { bad(tag, t + ' render threw ' + (e && e.message || e)); }
}
const files = fs.readdirSync(DIR).filter(f => /^v1_.*\.json$/.test(f) && f !== 'v1_odd.json' && f.includes(FILTER)).sort();
const report = [];
for (const f of files) {
  const tag = f.replace('.json', ''), txt = fs.readFileSync(pathM.join(DIR, f), 'utf8'), raw = JSON.parse(txt), u = raw.unlocked || {};
  const v1Star = 1 + !!u.onsen + !!u.room6 + !!u.room8 + !!u.sign;
  localStorage.setItem(SAVE + 'state', txt);
  try { go('title'); continueGame(); } catch (e) { bad(tag, 'load threw ' + (e && e.stack || e)); continue; }
  // ---- right after loading
  if (S.v !== 2) bad(tag, 'v ' + S.v);
  if (star() < v1Star) bad(tag, 'star ' + star() + ' < v1 star ' + v1Star);
  for (const k in u) if (u[k] && !S.unlocked[k]) bad(tag, 'lost unlock ' + k);
  let refund = 0; for (const k in raw.paid || {}) if (!UNLOCK[k] && !u[k]) refund += raw.paid[k];
  if (S.money !== raw.money + refund) bad(tag, 'money ' + raw.money + ' + refund ' + refund + ' -> ' + S.money);
  const hearts = UNLOCKS.reduce((a, x) => a + (u[x.id] ? x.hearts : 0), 0) + Math.min(600, Math.floor(raw.stats.guests / 4));
  if (S.hearts !== hearts) bad(tag, 'hearts ' + S.hearts + ' (want ' + hearts + ')');
  if (BANNER_Q.some(b => b.kind === 'gift') !== (v1Star >= 2) || S.gift) bad(tag, 'the "inn grew" banner: ' + BANNER_Q.map(b => b.kind).join(',') + ' / flag ' + S.gift);   // shown once, then the flag is off (10.2)
  const asleep = Object.values(raw.rooms || {}).filter(v => v === 'occupied').length;
  if (sum(S.piles) !== sum(raw.piles) + asleep * STARS[S.peak].tip) bad(tag, 'piles ' + sum(raw.piles) + ' (+' + asleep + ' tips) -> ' + sum(S.piles));
  if (celebrateAt) bad(tag, 'a celebration queued on load (the v2 inn is not complete; G2)');
  nanWalk(S, 'S', tag);
  { const a = JSON.stringify(S); saveNow(); const b = JSON.stringify(loadState()); if (a !== b) bad(tag, 'save -> load round trip changed S'); }
  const loaded = { star: star(), peak: S.peak, money: S.money, hearts: S.hearts, pads: [...PADPOS.keys()].join(',') };
  // ---- play 15 minutes
  const stt = { hearts: S.hearts, v1Star, v1u: u }, t0 = S.stats.time, before = Object.keys(S.unlocked).length;
  path = []; key = ''; think = 0; let lastSec = -1, celebrated = false;
  for (let i = 0; i < MIN * 60 / DT; i++) {
    drive(DT);
    try { update(DT); } catch (e) { bad(tag, 'update threw ' + (e && e.stack || e)); break; }
    if (state === 'celebrate') { celebrated = true; S.done = true; go('play'); }
    if (Math.floor(S.stats.time) !== lastSec) { lastSec = Math.floor(S.stats.time); invariants(tag, stt); }
  }
  if (celebrated && (raw.done || !innComplete())) bad(tag, 'a celebration showed ' + (raw.done ? 'again (the v1 panel was seen)' : 'before the inn was complete'));
  nanWalk(S, 'S', tag);
  const bought = Object.keys(S.unlocked).length - before;
  report.push(`${tag.padEnd(14)} v1★${v1Star} -> ★${loaded.star} (peak ${loaded.peak}) | money ${raw.money}->${loaded.money} | ♥ ${loaded.hearts} | pads [${loaded.pads}] | 15 min: +${bought} unlocks, ★${star()}, money ${S.money}, ♥ ${S.hearts}, guests +${S.stats.guests - raw.stats.guests}`);
}
// ---- odd shapes
const odd = JSON.parse(fs.readFileSync(pathM.join(DIR, 'v1_odd.json'), 'utf8'));
if (!FILTER || 'v1_odd'.includes(FILTER)) for (const raw of odd) {
  const tag = 'odd ' + raw.slice(0, 50);
  try {
    localStorage.setItem(SAVE + 'state', raw); const s = loadState();
    if (!Number.isFinite(s.money) || !s.unlocked.room1 || s.v !== 2) bad(tag, 'bad load');
    for (const k in s.piles) if (!PILE_AT[k] || !Number.isFinite(s.piles[k])) bad(tag, 'pile ' + k);
    nanWalk(s, 'S', tag);
    S = s; resetWorld(); go('play'); const stt = { hearts: S.hearts, v1Star: 1, v1u: {} };
    for (let i = 0; i < 5 / DT; i++) { drive(DT); update(DT); if (i % 30 === 0) invariants(tag, stt); }
  } catch (e) { bad(tag, 'threw ' + (e && e.stack || e)); }
}
console.log(report.join('\n'));
console.log(errs.length ? 'MIGRATE FAIL (' + errs.length + ')\n  ' + errs.join('\n  ') : 'MIGRATE OK  ' + files.length + ' v1 saves x ' + MIN + ' min + ' + odd.length + ' odd shapes');
if (errs.length) process.exitCode = 1;
