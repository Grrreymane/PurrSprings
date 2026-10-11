// Audit soak (stage 5 audit): invariants the older soak does not check, plus chaos actions.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_crp_soak.js --seed 1 -- eager 90
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_crp_soak.js --seed 1 -- chaos 90 reload
// Profiles: eager (follows the arrow), casual (follows with distraction), chaos (random walks / stands, follows 40 %),
// afk (follows the arrow, then hands off from minute ARGS[2] (default 20) on: the inn runs alone).
// 'reload' = save -> loadState -> resetWorld at RANDOM frames (mean every ~150 s) so every mid-state gets reloaded.
// Extra invariants (each second): seat <-> guest links, browse spot, counter, tray caps, waiter jobs, VIP <-> suite <->
// vipOwe, calls, entities on blocked tiles / in locked areas, arrow reachable, pads reachable, money conservation.
// Metrics: tray dead-ends (full tray, nothing on it wanted), cache / array growth every 30 min.
const PROFILE = ARGS[0] || 'eager', MAXMIN = +ARGS[1] || 60, RELOAD = ARGS.includes('reload'), MENUS = !ARGS.includes('nomenu');
const PROF = { eager: { react: .3, distract: 0 }, casual: { react: 1, distract: .3 }, chaos: { react: .5, distract: .6 }, afk: { react: .3, distract: 0, stop: +(ARGS[2] || 20) * 60 } }[PROFILE] || { react: .3, distract: 0 };
const DT = 1 / 30;
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
let generated = 0;
const _fee = fee; fee = function (k, o) { const v = _fee(k, o); generated += v; return v; };
const _earn = earn; earn = function (v, x, y) { generated += Math.max(0, v | 0); return _earn(v, x, y); };
newGame();
let path = [], key = '', think = 0, mode = 'follow', episode = 0, stuckT = 0, lastPos = [P.x, P.y];
function randomTile() {
  for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } }
  return [];
}
function drive(dt) {
  if (PROF.stop && S.stats.time >= PROF.stop) { botMove = null; path = []; return; }   // afk: hands off from here on
  episode -= dt;
  if (episode <= 0) {
    episode = 3 + Math.random() * 5;
    const was = mode;
    mode = Math.random() < PROF.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow';
    if (mode !== was || mode === 'wander') { path = []; key = ''; think = 0; if (mode === 'wander') path = randomTile(); }
  }
  think -= dt;
  if (think <= 0 && mode === 'follow') {
    think = PROF.react;
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
const inv = {}, flag = (k, m) => { inv[k] = inv[k] || { n: 0, first: m }; inv[k].n++; };
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
let base = 0; const rebase = () => { base = S.earned + sum(S.piles) - generated; }; rebase();
const blockT = new Map();   // entity -> seconds spent on a blocked tile / in a locked area
function placeCheck(e, name, at) {
  const [tx, ty] = tileOf(e), a = areaAt(tx, ty), bad = !walkable(tx, ty) || (a && !areaOpen(a));
  const t = bad ? (blockT.get(e) || 0) + 1 : 0; blockT.set(e, t);
  if (t === 3) flag('in-wall/locked:' + name, at + ' ' + name + ' at ' + tx + ',' + ty + (a ? ' area ' + a.id + (areaOpen(a) ? '' : '(locked)') : '') + (e.st ? ' st ' + e.st : '') + (e.mode ? ' mode ' + e.mode : ''));
}
let trayDead = 0, trayDeadRun = 0, trayDeadMax = 0, guideUnreach = 0, lastPadCheck = -99, vipLeftN = 0, noIncome = 0, lastEarned = 0;
function checkSecond() {
  const t = S.stats.time, at = mmss(t);
  if (!Number.isFinite(S.money) || S.money < 0 || S.money !== Math.floor(S.money)) flag('money', at + ' ' + S.money);
  if (S.earned !== S.money + sum(S.paid)) flag('earned!=money+paid', at);
  if (generated + base !== S.earned + sum(S.piles)) { flag('fish-conservation', at + ' ' + (generated + base) + ' vs ' + (S.earned + sum(S.piles))); rebase(); }
  // seats
  for (let i = 0; i < SEAT_OCC.length; i++) { const gu = SEAT_OCC[i]; if (gu && (!GUESTS.includes(gu) || (gu.seat !== i && gu.seat2 !== i))) flag('seat-leak', at + ' seat ' + i + ' st ' + (gu && gu.st)); if (gu && !seatOpen(i)) flag('seat-closed', at + ' ' + i); }
  for (const gu of GUESTS) {
    const seatSt = gu.st === 'toSeat' || gu.st === 'seated' || gu.st === 'eat';
    if (seatSt !== (gu.seat >= 0)) flag('seat-state', at + ' ' + gu.st + ' seat ' + gu.seat);
    if (gu.seat >= 0 && SEAT_OCC[gu.seat] !== gu) flag('seat-backlink', at);
    if (gu.seat2 >= 0 && SEAT_OCC[gu.seat2] !== gu) flag('seat2-backlink', at);
    if (gu.call && (gu.call.t > gu.call.max + 1e-6 || !TRAY_KINDS.includes(gu.call.k))) flag('call-shape', at);
    const br = gu.st === 'toBrowse' || gu.st === 'browse';
    if (br !== (BROWSE.occ === gu)) flag('browse-link', at + ' ' + gu.st + ' occ=' + (BROWSE.occ ? BROWSE.occ.st : null));
    if (gu.mate && gu.mate.mode === 'follow' && dist(gu.x, gu.y, gu.mate.x, gu.mate.y) > 80) flag('mate-far', at + ' ' + R(dist(gu.x, gu.y, gu.mate.x, gu.mate.y)) + ' st ' + gu.st);
    if (!['sleep', 'bathing', 'seated', 'eat'].includes(gu.st) && !gu.gone) placeCheck(gu, 'guest', at);
    if (gu.mate && gu.mate.mode !== 'park') placeCheck(gu.mate, 'mate', at);
  }
  if (BROWSE.occ && !GUESTS.includes(BROWSE.occ)) flag('browse-ghost', at);
  if (!Number.isInteger(PASS.n) || PASS.n < 0 || PASS.n > PASS_MAX) flag('pass', at + ' ' + PASS.n);
  if (P.tray.length > trayCap() || P.tray.some(k => !TRAY_KINDS.includes(k))) flag('tray-cap', at + ' ' + P.tray.join(','));
  if (callCount() > callMax()) flag('calls>max', at + ' ' + callCount());
  for (const s of STAFF) {
    if (s.role === 'waiter') { if (s.tray.length > WAITER_CARRY) flag('waiter-tray', at); if (s.jobs.some(gu => !GUESTS.includes(gu))) flag('waiter-ghost-job', at); }
    if (s.role === 'maid' && s.carry > MAID_TOWELS) flag('maid-carry', at + ' ' + s.carry);
    if (!s.arrive) placeCheck(s, 'staff:' + s.id, at);
  }
  // VIP
  const v = VIPG;
  for (const rm of SUITES) { const g = RT[rm.id].guest; if (g && (g !== v || v.suite !== rm.id || v.st === 'leave')) flag('suite-held', at + ' ' + rm.id + ' vip ' + (v ? v.st : '-')); }
  if (v) {
    if (['toSuite', 'seated', 'soak'].includes(v.st) && (!v.suite || RT[v.suite].guest !== v)) flag('vip-suite-link', at + ' ' + v.st);
    if (['seated', 'soak'].includes(v.st) ? S.vipOwe !== Math.max(0, v.G - v.paid) : S.vipOwe !== 0) flag('vipOwe', at + ' ' + v.st + ' owe ' + S.vipOwe);
    if (v.t > 400 && v.st !== 'carpet') flag('vip-stuck', at + ' ' + v.st + ' t ' + R(v.t));
    if (v.st !== 'soak' && v.st !== 'seated') placeCheck(v, 'vip', at);
  } else if (S.vipOwe) flag('vipOwe-no-vip', at + ' ' + S.vipOwe);
  if (PET) placeCheck(PET, 'pet', at);
  // arrow reachable (never points into a wall / a locked area)
  if (GUIDE && !GUIDE.here) { const [sx, sy] = tileOf(P); if (!findPath(sx, sy, GUIDE.tx, GUIDE.ty)) { guideUnreach++; flag('guide-unreachable', at + ' ' + GUIDE.kind + ' ' + GUIDE.key + ' rule ' + GUIDE.rule); } }
  if (t - lastPadCheck > 10) { lastPadCheck = t; const [sx, sy] = tileOf(P); for (const [id, xy] of PADPOS) if (!findPath(sx, sy, xy[0], xy[1]) && !(sx === xy[0] && sy === xy[1])) flag('pad-unreachable', at + ' ' + id + ' at ' + xy); }
  // tray dead end: full, and nothing on it is wanted by anyone
  const L = trayWants(), dead = P.tray.length >= trayCap() && !P.tray.some(k => L.some(w => w.k === k));
  if (dead) { trayDead++; trayDeadRun++; trayDeadMax = Math.max(trayDeadMax, trayDeadRun); } else trayDeadRun = 0;
  if (S.earned + sum(S.piles) === lastEarned && state === 'play') noIncome++; else noIncome = 0; lastEarned = S.earned + sum(S.piles);
  if (noIncome === 180) flag('no-income-3min', at);
  try { render(); } catch (e) { flag('render', String(e && e.stack || e).slice(0, 200)); }
}
const caches = () => ({ ART: Object.keys(ART).length, TXC: TXC.size, TW: TW.size, FLIPS: FLIPS.size, ROTS: ROTS.size, GHOSTS: GHOSTS.size, FACES: FACES.size, SILS: SILS.size, PHOTOS: PHOTOS.size,
  POPA: Object.keys(POPA).length, LSAID: Object.keys(LSAID).length, BOOTH: BOOTH.size, news: RUN.news.length, lineLog: RUN.lineLog.length, vipF: RUN.vipF.length, shop: RUN.shop.length,
  FX: FX.length, POPS: POPS.length, BANNER: BANNER_Q.length, EDGE: EDGE_Q.length, FIRST: FIRST_Q.length, auVQ: _auVQ.length, auPl: _auPl.length, auCC: Object.keys(_auCC).length, G: GUESTS.length });
const snaps = [];
const steps = Math.round(MAXMIN * 60 / DT);
let lastSec = -1, reloads = 0, nextReload = 60 + Math.random() * 240, menus = 0, nextMenu = 100, signAt = null, t0 = Date.now(), upMax = 0;
for (let i = 0; i < steps; i++) {
  drive(DT);
  const a = process.hrtime.bigint(); update(DT); const ms = Number(process.hrtime.bigint() - a) / 1e6; if (S.stats.time > 30) upMax = Math.max(upMax, ms);
  if (state === 'celebrate') { signAt = signAt || S.stats.time; S.done = true; go('play'); }
  const t = S.stats.time;
  if (Math.floor(t) !== lastSec) { lastSec = Math.floor(t); checkSecond(); if (lastSec % 1800 === 0) snaps.push([mmss(t), caches()]); }
  if (MENUS && t >= nextMenu) {   // the menu at a random moment: nothing in the game moves while it is open
    nextMenu += 60 + Math.random() * 180;
    const snap = () => JSON.stringify([S.stats.time, S.clock, S.money, S.piles, GUESTS.map(g => [g.st, g.t, g.x, g.y, g.call && g.call.t]), STAFF.map(s => [s.x, s.y, s.tt]), VIPG && [VIPG.st, VIPG.t, VIPG.x], PASS.n, BANNER_Q.map(b => b.age), FX.length, LINE && LINE.t]);
    openMenu(); const s0 = snap();
    for (let k = 0; k < 120; k++) { update(DT); if (k % 20 === 0) { MENU.page = ['home', 'sound', 'book', 'bought', 'inn', 'home'][k / 20]; try { render(); } catch (e) { flag('menu-render', String(e.message)); } } }
    if (snap() !== s0) flag('menu-not-paused', mmss(t)); menus++;
    closeMenu();
  }
  if (RELOAD && t >= nextReload) {
    nextReload = t + 30 + Math.random() * 240;
    const before = { money: S.money, unl: Object.keys(S.unlocked).sort().join(), earned: S.earned, hearts: S.hearts, decor: JSON.stringify(S.decor) };
    saveNow(); S = loadState(); resetWorld(); go('play'); reloads++;
    const after = { money: S.money, unl: Object.keys(S.unlocked).sort().join(), earned: S.earned, hearts: S.hearts, decor: JSON.stringify(S.decor) };
    if (JSON.stringify(before) !== JSON.stringify(after)) flag('reload-mismatch', mmss(t) + ' ' + JSON.stringify(before) + ' -> ' + JSON.stringify(after));
    rebase(); path = []; key = ''; blockT.clear();
  }
}
snaps.push([mmss(S.stats.time), caches()]);
const ok = Object.keys(inv).length === 0;
console.log(`${PROFILE}${RELOAD ? '+reload' : ''} ${MAXMIN}m | ★5 ${signAt ? mmss(signAt) : '-'} | unlocked ${Object.keys(S.unlocked).length} | money ${S.money} | guests ${S.stats.guests} angry ${S.stats.angry} | VIP done ${S.stats.vips} | reloads ${reloads} menus ${menus} | trayDead ${trayDead}s (longest ${trayDeadMax}s) | update max ${upMax.toFixed(2)}ms | wall ${((Date.now() - t0) / 1000).toFixed(0)}s | inv ${ok ? 'OK' : 'FAIL'}`);
for (const [k, c] of snaps) console.log('  ' + k + ' ' + JSON.stringify(c));
for (const k in inv) console.log('  INVARIANT ' + k + ' x' + inv[k].n + ' first: ' + inv[k].first);
if (!ok) process.exitCode = 1;
