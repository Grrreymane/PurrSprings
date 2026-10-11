// v2.0.1 saves -> v2.1 (SPEC_v2 16.13): tests/fixtures/v201_*.json were written by the v2.0.1 build (git show ca2c90f:index.html,
// an eager guide-follower, seed 3, at 3 / 12 / 22 / 40 / 70 min). Each loads with nothing lost (unlocks, money, star, hearts),
// gets the v2.1 defaults (year from this load, no festival running, mom from year 2, no rare guests / fireworks, no outfit
// keys), renders every menu page, plays 15 min (seasons, festivals, the press, the year report) and round-trips its save.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/migrate_v201.js --seed 1
const fs = require('fs'), DT = 1 / 30, DIRV = ARGS[0] || 'tests/fixtures', errs = [];
let path = [], key = '', think = 0;
function drive(dt) {
  think -= dt;
  if (think <= 0) { think = .3; const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };
    if (!t || t.here) { path = []; key = ''; } else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; } }
  if (path.length) { const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy); if (d < 1.5) path.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
}
for (const f of fs.readdirSync(DIRV).filter(f => /^v201_.*\.json$/.test(f)).sort()) {
  const raw = JSON.parse(fs.readFileSync(DIRV + '/' + f, 'utf8'));
  try {
    S = loadState(JSON.parse(JSON.stringify(raw))); resetWorld(); go('play');
    const lost = Object.keys(raw.unlocked).filter(id => !S.unlocked[id] && UNLOCK[id]);
    if (lost.length) errs.push(f + ' lost unlocks ' + lost);
    if (S.money !== raw.money) errs.push(f + ' money ' + raw.money + ' -> ' + S.money);
    if (S.peak !== raw.peak || S.hearts !== raw.hearts) errs.push(f + ' peak / hearts changed');
    if (S.year.n !== yearOf(S.day) || S.awards.length || S.fest.end !== true || S.momY !== 1 || JSON.stringify(S.rare) !== '{}' || S.fw.n !== 0) errs.push(f + ' v2.1 defaults ' + JSON.stringify({ year: S.year, fest: S.fest, momY: S.momY, rare: S.rare, fw: S.fw }));
    if ('outfit' in S.equip || 'uniform' in S.equip) errs.push(f + ' equip got outfit / uniform keys');
    render();
    for (const pg of ['home', 'dress', 'book', 'bought', 'inn']) { openMenu(); MENU.page = pg; for (let t = 0; t < (pg === 'book' ? 7 : pg === 'dress' ? 4 : 1); t++) { MENU.tab = t; DRESS.tab = t; render(); } if (pg === 'inn') { MENU.sel = 'map'; render(); } closeMenu(); }
    const y0 = S.year.n, cards = [];
    for (let i = 0; i < 15 * 60 / DT; i++) { drive(DT); update(DT); if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') { cards.push(MODAL_Q[0].kind); render(); modalClose(); } if (i % 300 === 0) render(); }
    saveNow(); const back = loadState(JSON.parse(JSON.stringify(S)));
    if (JSON.stringify(back.unlocked) !== JSON.stringify(S.unlocked) || back.money !== S.money) errs.push(f + ' save round trip differs');
    console.log(f + ': star ' + star() + ' day ' + S.day + ' (' + '春夏秋冬'[seasonNow()] + ') money ' + S.money + ' unlocked ' + Object.keys(S.unlocked).length + ' cards ' + (cards.join(' ') || '-') + ' fests ' + S.fests.join('') + ' covers ' + S.covers.length);
  } catch (e) { errs.push(f + ' threw ' + (e && e.stack || e)); }
}
if (errs.length) process.exitCode = 1;
console.log(errs.length ? 'MIGRATE V201 FAIL\n  ' + errs.join('\n  ') : 'MIGRATE V201 OK  5 v2.0.1 saves x 15 min, nothing lost');
