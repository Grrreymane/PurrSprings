// Long invariant soak (pasted into the game closure by _workflow/tools/headless.js):
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/soak.js --seed 1 -- eager 60
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/soak.js --seed 1 -- casual 60 reload
// Same guide-following driver as bot.js, but it keeps playing after the sign (celebration dismissed) for the
// whole run, and checks a stricter invariant set every simulated second:
//   money integer >= 0; earned == money + sum(paid); fees generated == earned + sum(piles) (no fish created
//   or lost); room <-> guest <-> RT links consistent both ways; reserved/occupied rooms always have a live guest;
//   slots <-> guests consistent; maid claims point at a maid whose job is that room; Q == arrive/queue guests;
//   basket 0..10; nobody lost (path null); no guest in one state > 180 s (sleep / bathing / eat excepted); staff not stuck on a job > 60 s;
//   all positions finite; player not in a wall; render() does not throw.
// Also records growth of runtime arrays / caches (GUESTS, FX, POPS, TXC, ART, FLIPS) and BFS calls per frame.
// Extra args: [profile] [minutes] ['reload' = save -> loadState -> resetWorld every ~4 min]
const PROFILE = ARGS[0] || 'eager', MAXMIN = +ARGS[1] || 60, RELOAD = ARGS.includes('reload');
const PROF = { eager: { react: .3, distract: 0 }, casual: { react: 1, distract: .3 } }[PROFILE] || { react: .3, distract: 0 };
const DT = 1 / 30;
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
// ---- instrumentation (function declarations in the game closure are mutable bindings)
let bfsFrame = 0, bfsMax = 0, bfsTotal = 0, txNew = 0, generated = 0;
const _findPath = findPath; findPath = function (a, b, c, d) { bfsFrame++; return _findPath(a, b, c, d); };
const _textSprite = textSprite; textSprite = function (t) { const had = TXC.has(t.s + '|' + t.size + '|' + t.col + '|' + t.stroke + '|' + K); if (!had) txNew++; return _textSprite(t); };
const _fee = fee; fee = function (k, o) { const v = _fee(k, o); generated += v; return v; };
const _earn = earn; earn = function (v, x, y) { generated += Math.max(0, v | 0); return _earn(v, x, y); };   // calls pay straight into the wallet (v2 4.2)
// v2.0.1 G3: a call the tea runner brings pays its tip into the cash box (not a fee, not the wallet)
const _serveCall = serveCall; serveCall = function (gu, by) { const p0 = S.piles.recep || 0; const r = _serveCall(gu, by); if (by) generated += (S.piles.recep || 0) - p0; return r; };
// v2.1: a festival's red packet and the yearly prize are put into the cash box (not fees)
for (const fn of ['festEnd', 'yearReport']) { const f0 = eval(fn); eval(fn + ' = function (...a) { const p0 = S.piles.recep || 0; const r = f0(...a); generated += (S.piles.recep || 0) - p0; return r; }'); }
// v2.1 core B: a festival stall's 8 x star goes straight into the plaza's pile (not a fee)
{ const f0 = stallGuest; stallGuest = function (gu, dt, walk) { const p0 = S.piles.plaza || 0; f0(gu, dt, walk); generated += (S.piles.plaza || 0) - p0; }; }
newGame();
// ---------------------------------------------------------------- driver (as bot.js)
let path = [], key = '', think = 0, mode = 'follow', episode = 0, stuckT = 0, lastPos = [P.x, P.y], stuckN = 0;
function randomTile() {
  for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = _findPath(sx, sy, tx, ty); if (p) return p; } }
  return [];
}
function drive(dt) {
  episode -= dt;
  if (episode <= 0) {
    episode = 3 + Math.random() * 5;
    const was = mode;
    mode = Math.random() < PROF.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow';
    if (mode !== was) { path = []; key = ''; think = 0; if (mode === 'wander') path = randomTile(); }
  }
  think -= dt;
  if (think <= 0 && mode === 'follow') {
    think = PROF.react;
    const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };
    if (!t || t.here) { path = []; key = ''; }
    else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = _findPath(sx, sy, t.tx, t.ty) || []; }
  }
  if (path.length) {
    const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) path.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    if (Math.hypot(P.x - lastPos[0], P.y - lastPos[1]) < .2) { stuckT += dt; if (stuckT > 1.5) { stuckN++; stuckT = 0; key = ''; think = 0; path = []; } } else stuckT = 0;
  } else { botMove = null; stuckT = 0; }
  lastPos = [P.x, P.y];
}
// ---------------------------------------------------------------- invariants
const inv = {}, flag = (k, m) => { inv[k] = inv[k] || { n: 0, first: m }; inv[k].n++; };
let soakStatueBad = 0;
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
let base = 0;   // fish that existed before tracking started (tips handed out by loadState on reload)
const rebase = () => { base = S.earned + sum(S.piles) - generated; };
rebase();
let lastH = 0, lastClock = -1;
const staffJob = new Map(), peak = { guests: 0, fx: 0, pops: 0, txc: 0, art: 0, flips: 0, rots: 0, q: 0 };
function checkSecond() {
  const t = S.stats.time, at = mmss(t);
  if (!Number.isFinite(S.money) || S.money < 0 || S.money !== Math.floor(S.money)) flag('money', at + ' ' + S.money);
  if (S.earned !== S.money + sum(S.paid)) flag('earned!=money+paid', at + ' earned ' + S.earned + ' money ' + S.money + ' paid ' + sum(S.paid));
  if (generated + base !== S.earned + sum(S.piles)) flag('fish-conservation', at + ' generated ' + (generated + base) + ' vs earned+piles ' + (S.earned + sum(S.piles)));
  for (const k in S.piles) if (!Number.isInteger(S.piles[k]) || S.piles[k] < 0) flag('pile', at + ' ' + k + '=' + S.piles[k]);
  // rooms <-> guests
  for (const rm of ROOMS) {
    const rt = RT[rm.id], st = S.rooms[rm.id];
    if (rm.vip) {   // stage 2B: a suite holds only the VIP (it stays 'clean' while used, 'messy' after - 10.1); v2.4: or its sleeper ('occupied' once in bed)
      const sl = VSLEEP.includes(rt.guest) && rt.guest.room === rm.id;
      if (rt.guest && !sl && (rt.guest !== VIPG || VIPG.suite !== rm.id)) flag('suite-guest', at + ' ' + rm.id);
      if (rt.guest && !sl && st !== 'clean') flag('suite-guest-dirty', at + ' ' + rm.id + ' ' + st);
      if (st === 'reserved' || (st === 'occupied' && !(sl && rt.guest.st === 'sleep'))) flag('suite-state', at + ' ' + rm.id + ' ' + st);
      if (rt.claim && (!STAFF.includes(rt.claim) || rt.claim.job !== rm.id)) flag('claim-leak', at + ' ' + rm.id);
      continue;
    }
    if (rt.guest && !GUESTS.includes(rt.guest)) flag('room-leak', at + ' ' + rm.id + ' guest gone');
    if (rt.guest && rt.guest.room !== rm.id) flag('room-backlink', at + ' ' + rm.id + ' guest.room=' + rt.guest.room);
    if ((st === 'reserved' || st === 'occupied') && !rt.guest) flag('room-held-no-guest', at + ' ' + rm.id + ' ' + st);
    if (rt.guest && st !== 'reserved' && st !== 'occupied') flag('guest-in-free-room', at + ' ' + rm.id + ' ' + st);
    if (st === 'occupied' && rt.guest && rt.guest.st !== 'sleep') flag('occupied-not-sleeping', at + ' ' + rm.id + ' ' + rt.guest.st);
    if (rt.claim && (!STAFF.includes(rt.claim) || rt.claim.job !== rm.id)) flag('claim-leak', at + ' ' + rm.id);
    if (rt.claim && st !== 'messy') flag('claim-on-clean', at + ' ' + rm.id + ' ' + st);
    if (!Number.isFinite(rt.cleanP) || rt.cleanP < 0 || rt.cleanP >= 1.01) flag('cleanP', at + ' ' + rm.id + ' ' + rt.cleanP);
  }
  const perRoom = {};
  for (const gu of GUESTS) {
    if (gu.room) { perRoom[gu.room] = (perRoom[gu.room] || 0) + 1; if (RT[gu.room].guest !== gu) flag('guest-room-not-linked', at + ' ' + gu.room + ' ' + gu.st); }
    if (gu.slot >= 0 && SLOT_OCC[gu.slot] !== gu) flag('slot-backlink', at + ' slot ' + gu.slot);
    if (gu.slot >= 0 && gu.st !== 'toSlot' && gu.st !== 'bathing') flag('slot-held-wrong-state', at + ' ' + gu.st);
    if (gu.t > 180 && gu.st !== 'sleep' && gu.st !== 'bathing' && gu.st !== 'eat') flag('stuck-guest', at + ' ' + gu.st + ' ' + R(gu.t) + 's at ' + R(gu.x) + ',' + R(gu.y));
    if (gu.lost) flag('guest-lost', at + ' ' + gu.st + ' goal ' + gu.goal);
    if (!Number.isFinite(gu.x) || !Number.isFinite(gu.y)) flag('guest-nan', at);
    const inQ = Q.includes(gu), qState = gu.st === 'arrive' || gu.st === 'queue';
    if (inQ !== qState) flag('queue-mismatch', at + ' ' + gu.st + ' inQ=' + inQ);
    if (['toRoom', 'sleep'].includes(gu.st) && !gu.room) flag('roomless-guest', at + ' ' + gu.st);
    if (['toBath', 'towel', 'toSlot', 'bathing', 'toMilk', 'milk'].includes(gu.st) && gu.room) flag('bath-holds-room', at + ' ' + gu.st);   // bath-last: guests bathe after checking out
  }
  for (const k in perRoom) if (perRoom[k] > 1) flag('room-shared', at + ' ' + k);
  for (let i = 0; i < SLOT_OCC.length; i++) { const o = SLOT_OCC[i]; if (o && (!GUESTS.includes(o) || o.slot !== i)) flag('slot-leak', at + ' slot ' + i); if (o && !slotOpen(i)) flag('slot-over-count', at + ' ' + i); }
  for (const g2 of Q) if (!GUESTS.includes(g2)) flag('queue-ghost', at);
  if (S.basket < 0 || S.basket > BASKET_MAX || !Number.isInteger(S.basket)) flag('basket', at + ' ' + S.basket);
  if (P.towels < 0 || P.towels > towelCap()) flag('towels', at + ' ' + P.towels);
  if (boxHit(P.x, P.y)) flag('player-in-wall', at + ' ' + R(P.x) + ',' + R(P.y));
  for (const s of STAFF) {
    if (s.lost) flag('staff-lost', at + ' ' + s.id);
    if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) flag('staff-nan', at + ' ' + s.id);
    if (s.role === 'maid') {
      const j = staffJob.get(s);
      if (s.job) { if (!j || j.job !== s.job) staffJob.set(s, { job: s.job, t }); else if (t - j.t > 60) flag('maid-stuck', at + ' ' + s.id + ' on ' + s.job + ' for ' + R(t - j.t) + 's'); }
      else staffJob.delete(s);
    }
    if (s.role === 'porter' && (s.carry < 0 || s.carry > porterCap(s))) flag('porter-carry', at + ' ' + s.carry + ' cap ' + porterCap(s));
  }
  // stage 2C (SPEC_v2 14.3 as far as it exists): hearts never drop; star >= peak; gold stars only from star 5 and match the
  // hearts; equip only owned pieces; the clock runs (in play) and stays in [0,1); day / day log / staff experience sane;
  // the pet stays near you; the VIP is one at a time; the arrow never points at the statue; at most LIGHT_MAX lamps drawn
  if (S.hearts < lastH) flag('hearts-drop', at + ' ' + lastH + ' -> ' + S.hearts); lastH = S.hearts;
  if (star() < S.peak) flag('star<peak', at);
  if (goldStars() > 5 || (star() < 5 && goldStars() > 0)) flag('gold', at + ' ' + goldStars());
  for (const k of ['hat', 'pet']) { const id = S.equip[k]; if (id !== null && !(S.unlocked[id] && UNLOCK[id][k])) flag('equip', at + ' ' + k + '=' + id); }
  if (!(S.clock >= 0 && S.clock < 1) || !Number.isInteger(S.day) || S.day < 1) flag('clock', at + ' ' + S.clock + ' day ' + S.day);
  if (state === 'play' && S.clock === lastClock) flag('clock-stopped', at); lastClock = S.clock;
  for (const k of ['g', 'h', 'best']) if (!Number.isInteger(S.dayLog[k]) || S.dayLog[k] < 0) flag('daylog', at + ' ' + k + '=' + S.dayLog[k]);
  for (const k in S.staff) if (!Number.isInteger(S.staff[k]) || S.staff[k] < 0 || !STAFF_DEF[k]) flag('staff-xp', at + ' ' + k + '=' + S.staff[k]);
  if (PET && dist(P.x, P.y, PET.x, PET.y) > 200) flag('pet-far', at + ' ' + R(dist(P.x, P.y, PET.x, PET.y)));
  if (VIPG && SUITES.some(rm => RT[rm.id].guest && RT[rm.id].guest !== VIPG && !VSLEEP.includes(RT[rm.id].guest))) flag('suite-guest', at);
  // the statue only once every hat / pet is bought and >= 50,000 on hand (END-1); two checks in a row, since the arrow
  // re-picks every 0.25 s and a pour empties the wallet in a frame
  soakStatueBad = GUIDE && GUIDE.id === 'statue' && (S.money < 50000 || UNLOCKS.some(u => (u.hat || u.pet) && !S.unlocked[u.id])) ? soakStatueBad + 1 : 0;
  if (soakStatueBad >= 2) flag('guide-statue', at);
  try { render(); } catch (e) { flag('render', String(e && e.message || e)); }
  if (LINE && LINE_NEXT && LINE_NEXT.q > LINE_WAIT + .1) flag('line-queue', at);   // one line on screen, one waiting <= 1 s (8.1)
  if (LIGHT_N > LIGHT_MAX) flag('lights>16', at + ' ' + LIGHT_N);
  peak.guests = Math.max(peak.guests, GUESTS.length); peak.fx = Math.max(peak.fx, FX.length); peak.pops = Math.max(peak.pops, POPS.length);
  peak.txc = Math.max(peak.txc, TXC.size); peak.art = Math.max(peak.art, Object.keys(ART).length); peak.flips = Math.max(peak.flips, FLIPS.size); peak.rots = Math.max(peak.rots, ROTS.size); peak.q = Math.max(peak.q, Q.length);
}
// ---------------------------------------------------------------- run
const steps = Math.round(MAXMIN * 60 / DT);
let lastSec = -1, signAt = null, reloads = 0, nextReload = 240, upd = 0, updMax = 0, frames = 0, nextMenu = 150, menus = 0;
const artAt = {};
for (let i = 0; i < steps; i++) {
  drive(DT);
  bfsFrame = 0;
  const t0 = process.hrtime.bigint();
  update(DT);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6; upd += ms; updMax = Math.max(updMax, ms); frames++;
  bfsMax = Math.max(bfsMax, bfsFrame); bfsTotal += bfsFrame;
  if (state === 'celebrate') { signAt = signAt || S.stats.time; S.done = true; go('play'); } if (state === 'card') modalClose();
  const t = S.stats.time;
  if (Math.floor(t) !== lastSec) { lastSec = Math.floor(t); checkSecond(); }
  if (Math.floor(t / 600) * 600 === Math.floor(t) && !artAt[Math.floor(t)]) artAt[Math.floor(t)] = { art: Object.keys(ART).length, txc: TXC.size, txNew, guests: GUESTS.length, fx: FX.length, money: S.money };
  // stage 3 (14.3): every ~5 min the menu opens for 3 s: time played, the clock, money and guests stay put; every page renders
  if (t >= nextMenu) {
    nextMenu += 280 + Math.random() * 60;
    const snap = () => JSON.stringify([S.stats.time, S.clock, S.money, GUESTS.length, GUESTS.map(g => g.st + g.t.toFixed(3))]);
    openMenu(); const a = snap();
    for (let k = 0; k < 90; k++) { update(DT); if (k % 15 === 0) { MENU.page = ['home', 'sound', 'book', 'bought', 'inn'][(k / 15) % 5]; MENU.tab = k % 4; try { render(); } catch (e) { flag('menu-render', String(e && e.message || e)); } } }
    if (snap() !== a) flag('menu-not-paused', mmss(t)); menus++;
    closeMenu(); if (state !== 'play') flag('menu-close', mmss(t) + ' ' + state);
  }
  if (RELOAD && t >= nextReload) {
    nextReload += 200 + Math.random() * 100;
    const before = { money: S.money, unlocked: Object.keys(S.unlocked).sort().join(','), earned: S.earned };
    saveNow(); S = loadState(); resetWorld(); go('play'); reloads++;
    const after = { money: S.money, unlocked: Object.keys(S.unlocked).sort().join(','), earned: S.earned };
    if (JSON.stringify(before) !== JSON.stringify(after)) flag('reload-mismatch', mmss(t) + ' ' + JSON.stringify(before) + ' -> ' + JSON.stringify(after));
    rebase(); staffJob.clear(); path = []; key = '';
  }
}
const invOk = Object.keys(inv).length === 0;
console.log(`${PROFILE} ${MAXMIN}m | ★5 ${signAt ? mmss(signAt) : '-'} | unlocked ${Object.keys(S.unlocked).length}/${UNLOCKS.length + 1} | money ${S.money} earned ${S.earned} | guests ${S.stats.guests} angry ${S.stats.angry} | reloads ${reloads} | menus ${menus} | lines ${RUN.lines} | stuck ${stuckN} | inv ${invOk ? 'OK' : 'FAIL'}`);
console.log(`  peaks: guests ${peak.guests} Q ${peak.q} FX ${peak.fx} POPS ${peak.pops} TXC ${peak.txc} ART ${peak.art} FLIPS ${peak.flips} ROTS ${peak.rots} | new text sprites ${txNew} (${(txNew / MAXMIN).toFixed(1)}/min) | BFS/frame max ${bfsMax} avg ${(bfsTotal / frames).toFixed(3)} | update() avg ${(upd / frames).toFixed(3)}ms max ${updMax.toFixed(2)}ms`);
console.log('  every 10 min: ' + Object.entries(artAt).map(([k, v]) => mmss(+k) + ' art' + v.art + ' txc' + v.txc + ' txNew' + v.txNew + ' g' + v.guests + ' fx' + v.fx).join(' | '));
console.log(`  2C: ♥ ${S.hearts} #${rankOf(S.hearts)} gold ${goldStars()} | day ${S.day} (best ${S.dayLog.best} guests) | staff Lv ${STAFF.filter(s => s.role !== 'owner').map(s => s.name + staffLv(s)).join(' ')} | equip ${S.equip.hat || '-'} / ${S.equip.pet || '-'} | boutique ${UNLOCKS.filter(u => u.booth && S.unlocked[u.id]).map(u => u.id).join(',') || '-'} | statue paid ${S.paid.statue || 0}`);
for (const k in inv) console.log('  INVARIANT ' + k + ' x' + inv[k].n + ' first: ' + inv[k].first);
if (!invOk) process.exitCode = 1;
