// New-player clarity audit (pasted into the game closure by _workflow/tools/headless.js):
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/newplayer.js --seed 1 -- [minutes] [eager|casual] [log]
// Plays the first minutes following the guide arrow (like tests/bot.js) and, every guide tick (0.25 s), records
// what the arrow shows: on-screen arrow / edge arrow / nothing, its kind, whether it is "here" (you're doing it),
// how often it switches target, flip-flops (A -> B -> A within 2 s), time pointing at a pad you can't afford,
// the camera's visible columns, and pads that are on screen only as a sliver. Also logs the key first-time moments.
const MIN = +ARGS[0] || 6, PROFILE = ARGS[1] || 'eager', LOG = ARGS.includes('log');
const PROF = { eager: { react: .3, distract: 0 }, casual: { react: 1, distract: .3 } }[PROFILE];
const DT = 1 / 30;
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') + '.' + Math.floor((t % 1) * 10);
// ---- candidate fixes, tested without touching index.html (function declarations in the closure are rebindable)
//   cap      : early guest cap  inHouse < rooms + min(3, rooms)   (was rooms + 3)
//   pat=NN   : queue patience NN s until the receptionist is hired (was 45)
//   guide    : arrow -> desk as soon as a guest is coming (no recep); cheapest pad when you have any fish (partial pay
//              is real progress; standing on it = "here"); never hidden near it
// (several variants can be combined; they are prototypes for the audit, the real fix belongs in guideTarget's ordered list)
const VAR = ARGS.filter(a => /^(cap|guide|wait|pads|pat=\d+)$/.test(a));
if (VAR.includes('cap')) spawnGuests = function (dt) {
  spawnT -= dt; if (spawnT > 0) return;
  const inHouse = GUESTS.filter(gu => gu.st !== 'leave' && gu.st !== 'angry').length, rooms = ROOMS.filter(r => S.unlocked[r.id]).length;
  if (Q.length < QSPOTS.length && inHouse < rooms + Math.min(3, rooms)) { addGuest(); spawnT = STARS[star()].gap; } else spawnT = .5;
};
const patV = VAR.find(a => a.startsWith('pat='));
if (patV) { const add0 = addGuest, pv = +patV.slice(4); addGuest = function () { add0(); if (!S.unlocked.recep) GUESTS[GUESTS.length - 1].pat = pv; }; }
if (VAR.includes('guide')) { const g0 = guideTarget; guideTarget = function () {
  const r = g0(); if (!S.tut.moved || (r && r.here)) return r;
  const coming = Q.length > 0 && !S.unlocked.recep && freeRoom();
  if (coming && !(r && (r.kind === 'pile' || (r.kind === 'pad' && S.money >= padNeed(UNLOCK[r.id]))))) return T_DESK(P.atDesk);
  if (!r || (r.kind === 'pad' && S.money < padNeed(UNLOCK[r.id]))) {
    let best = null; for (const u of UNLOCKS) if (padVisible(u) && (!best || padNeed(u) < padNeed(best))) best = u;
    if (best && S.money > 0) { const [ptx, pty] = tileOf(P); return T_PAD(best, ptx === best.pad[0] && pty === best.pad[1]); }
  }
  return r;
}; }
//   wait     : nothing else to do and a guest is waiting for a room -> the occupied room whose guest wakes first
if (VAR.includes('wait')) { const g1 = guideTarget; guideTarget = function () {
  const r = g1(); if (r || !S.tut.moved) return r;
  const f = Q[0]; if (!(f && f.st === 'queue' && f.ready && !freeRoom())) return r;
  let bm = null; for (const rm of ROOMS) { const gu = RT[rm.id].guest; if (gu && gu.st === 'sleep' && (!bm || gu.tt < RT[bm.id].guest.tt)) bm = rm; }
  return bm ? T_CLEAN(bm, inCleanZone(bm)) : r;
}; }
//   pads     : lobby pads moved into cols 9-10 (on camera for every cam.x 0..60, clear of the queue's bubbles), label rows
//              25 and 28 so prices never stack: (9,25) recep->maid1->maid2, (10,25) porter, (9,28) shoes1->2->3,
//              (10,28) basket1->2; milk pad (10,5) beside the machine instead of under it
if (VAR.includes('pads')) { const MV = { recep: [9, 25], maid1: [9, 25], maid2: [9, 25], porter: [10, 25], shoes1: [9, 28], shoes2: [9, 28], shoes3: [9, 28], basket1: [10, 28], basket2: [10, 28], milk: [10, 5] };
  for (const u of UNLOCKS) if (MV[u.id]) { u.pad = MV[u.id]; if (u.id !== 'milk') u.at = [u.pad[0] * TILE + 8, u.pad[1] * TILE + 8]; } }
if (VAR.length) console.log('variant: ' + VAR.join(' '));
newGame();
let path = [], key = '', think = 0, mode = 'follow', episode = 0;
function randomTile() {
  for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } }
  return [];
}
function drive(dt) {
  episode -= dt;
  if (episode <= 0) { episode = 3 + Math.random() * 5; const was = mode; mode = Math.random() < PROF.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow'; if (mode !== was) { path = []; key = ''; think = 0; if (mode === 'wander') path = randomTile(); } }
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
  } else botMove = null;
}
// the same on-screen test drawGuide() uses
function arrowMode(gt) {
  if (!S.tut.moved) return 'hand';
  if (!gt) return 'none';
  if (gt.here) return 'here';
  const sx = gt.x - R(cam.x), sy = gt.y - R(cam.y);
  let lift = gt.kind === 'shelf' ? 26 : gt.kind === 'desk' || gt.kind === 'clean' ? 22 : gt.kind === 'pile' ? 19 : 15;
  if (gt.kind === 'pad' && UNLOCK[gt.id]) { const { over, named } = padLayout(UNLOCK[gt.id]); lift = 15 + (over ? 8 : 0) + (named ? 9 : 0); }
  return (sx > 4 && sx < W - 4 && sy - lift > 18 && sy < H - 2) ? 'screen' : 'edge';
}
const label = gt => !gt ? '-' : gt.kind + (gt.id ? ':' + gt.id : gt.kind === 'pile' ? '' : '') + (gt.kind === 'pile' ? '@' + gt.tx + ',' + gt.ty : '');
const tally = {}, kindT = {}, events = [], first = {};
const ev = (k, m) => { if (!first[k]) { first[k] = S.stats.time; events.push(mmss(S.stats.time) + '  ' + k + (m ? '  ' + m : '')); } };
let lastLab = null, lastSwitch = 0, hist = [], switches = 0, flips = 0, flipList = [], unaffT = 0, edgeRuns = [], edgeStart = null, noneRuns = [], noneStart = null;
let sliverT = {}, padOffT = {}, strayPour = 0, strayN = {};
const visCols = () => { const x0 = R(cam.x), x1 = x0 + W; return [x0 / 16, x1 / 16]; };
let lastTowels = 0, lastBasket = 0, angryLog = [], lastAngry = 0, idleNoArrow = 0;
const steps = Math.round(MIN * 60 / DT);
for (let i = 0; i < steps; i++) {
  const m0 = S.money, pd0 = P.pouring;
  drive(DT); update(DT);
  const t = S.stats.time;
  if (P.pouring && S.money < m0 && !(GUIDE && GUIDE.kind === 'pad' && GUIDE.id === P.pouring)) { strayPour += m0 - S.money; strayN[P.pouring] = (strayN[P.pouring] || 0) + m0 - S.money; }
  // first-time events
  for (const u of UNLOCKS) if (S.unlocked[u.id] && !first['buy ' + u.id]) ev('buy ' + u.id, '(money left ' + S.money + ')');
  if (S.tut.moved) ev('moved (hand hint gone)');
  if (S.stats.guests > 0) ev('first check-in');
  if (Object.values(S.rooms).includes('messy')) ev('first messy room');
  if (P.towels > lastTowels) ev('first towel picked up', 'basket=' + S.basket);
  if (S.basket > lastBasket && P.towels < lastTowels) ev('first towel delivered by player');
  if (GUESTS.some(g => g.st === 'towel' && S.basket === 0)) ev('first guest waiting for towel (basket empty)');
  if (GUESTS.some(g => g.st === 'bathing')) ev('first guest bathing');
  if (S.stats.angry > lastAngry) { const why = !freeRoom() ? (ROOMS.some(r => S.rooms[r.id] === 'messy') ? 'no-room(messy waiting)' : 'no-room(all busy)') : 'room free, desk empty'; angryLog.push(mmss(t) + ' ' + why + ' [arrow ' + label(GUIDE) + ', money ' + S.money + ']'); lastAngry = S.stats.angry; }
  lastTowels = P.towels; lastBasket = S.basket;
  for (const id in S.piles) if (S.piles[id] > 0) ev('first pile ' + id);
  // guide sampling at its own clock (every 0.25 s; guideClock was just reset when it is .25)
  if (Math.abs(guideClock - .25) < 1e-6) {
    const gt = GUIDE, m = arrowMode(gt), lab = label(gt);
    tally[m] = (tally[m] || 0) + .25;
    if (gt && !gt.here) kindT[gt.kind] = (kindT[gt.kind] || 0) + .25;
    if (gt && gt.kind === 'pad' && !gt.here && S.money < padNeed(UNLOCK[gt.id])) unaffT += .25;
    if (gt && gt.kind === 'shelf' && !first['guide->shelf']) ev('guide->shelf', 'arrow mode ' + m);
    if (gt && gt.kind === 'basket' && !first['guide->basket']) ev('guide->basket', 'arrow mode ' + m);
    if (gt && gt.kind === 'clean' && !first['guide->clean']) ev('guide->clean', 'arrow mode ' + m);
    if (gt && gt.kind === 'desk' && !first['guide->desk']) ev('guide->desk', 'arrow mode ' + m);
    if (gt && gt.kind === 'pad' && !first['guide->pad ' + gt.id]) ev('guide->pad ' + gt.id, 'arrow mode ' + m + ', money ' + S.money + '/' + padNeed(UNLOCK[gt.id]) + ', cam cols ' + visCols().map(v => v.toFixed(1)).join('-'));
    if (m === 'edge') { if (edgeStart === null) edgeStart = [t, lab]; } else if (edgeStart) { edgeRuns.push([edgeStart[0], t - edgeStart[0], edgeStart[1]]); edgeStart = null; }
    if (m === 'none') { if (noneStart === null) noneStart = t; } else if (noneStart !== null) { noneRuns.push([noneStart, t - noneStart]); noneStart = null; }
    if (lab !== lastLab && m !== 'here') {
      if (lastLab !== null) switches++;
      hist.push([t, lab]); hist = hist.filter(h => t - h[0] <= 2);
      if (hist.length >= 3 && hist[hist.length - 3][1] === lab && lab !== '-') { flips++; if (flipList.length < 12) flipList.push(mmss(t) + ' ' + hist.map(h => h[1]).join('>')); }
      if (LOG) console.log(mmss(t) + '  ' + m.padEnd(6) + ' ' + lab.padEnd(18) + ' m=' + S.money + '  P@' + tileOf(P).join(',') + '  cam cols ' + visCols().map(v => v.toFixed(1)).join('-'));
      lastLab = lab;
    }
    // pads on screen only as a sliver (less than half the 16px tile visible) while you're in the lobby
    const x0 = R(cam.x), y0 = R(cam.y);
    for (const u of UNLOCKS) if (padVisible(u)) {
      const px = u.pad[0] * 16, py = u.pad[1] * 16, visW = Math.min(px + 16, x0 + W) - Math.max(px, x0), inY = py + 16 > y0 + 16 && py < y0 + H;
      if (inY && visW < 16 && visW > -999) { if (visW < 8) sliverT[u.id] = (sliverT[u.id] || 0) + .25; else padOffT[u.id] = (padOffT[u.id] || 0) + .25; }
    }
  }
}
console.log(`=== ${PROFILE} first ${MIN} min (seed run) ===`);
console.log('arrow modes (s): ' + Object.entries(tally).map(([k, v]) => k + ' ' + R(v)).join(', '));
console.log('arrow kinds (s, not "here"): ' + Object.entries(kindT).map(([k, v]) => k + ' ' + R(v)).join(', '));
console.log('time pointing at a pad you cannot afford yet: ' + R(unaffT) + ' s');
console.log('target switches: ' + switches + ' (' + (switches / MIN).toFixed(1) + '/min), flip-flops A>B>A within 2s: ' + flips);
flipList.forEach(f => console.log('   flip ' + f));
console.log('edge-arrow runs >= 2s: ' + edgeRuns.filter(r => r[1] >= 2).map(r => mmss(r[0]) + ' ' + r[1].toFixed(1) + 's ' + r[2]).join(' | '));
console.log('no-arrow runs >= 1s: ' + noneRuns.filter(r => r[1] >= 1).map(r => mmss(r[0]) + ' ' + r[1].toFixed(1) + 's').join(' | '));
console.log('pad seconds as a <8px sliver at screen edge: ' + JSON.stringify(sliverT) + '  half-cut (8-15px): ' + JSON.stringify(padOffT));
console.log('fish poured into a pad the arrow was not pointing at: ' + strayPour + ' ' + JSON.stringify(strayN));
console.log('angry guests: ' + angryLog.length + ' / ' + (S.stats.guests + S.stats.angry) + ' arrivals served-or-lost'); angryLog.forEach(a => console.log('   angry ' + a));
console.log('--- first-time moments');
events.forEach(e => console.log('  ' + e));
