// Economy / pacing measurement (docs/design/economy.md section 1 + 14). Pasted into the game closure by headless.js.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/econ_measure.js --seed N -- <eager|casual|novice|afk> [postMin=10] [json]
// Per star segment (★1..★4, 'post' = after ★5): purchases + gaps, income/min by source (pile deltas), arrow-kind time share
// (pile / work / pad / padPartial / idle / distracted / afk; * = 'here'), body state (walk / work / pour / still), money held,
// money on the floor, drought % (can't afford the cheapest visible pad even after picking up every pile), pickups/min.
// v2: extend src() with the new pile ids (dining / game / shop / vault / wish / vip / event) and actClass() with the new guide kinds.
const PROFILE = ARGS[0] || 'eager', POSTMIN = +(ARGS[1] || 10), JSONOUT = ARGS.includes('json');
const PROFS = {
  eager: { react: .3, distract: 0, ignore: 0 },
  casual: { react: 1, distract: .3, ignore: 0 },
  novice: { react: 2, distract: .5, ignore: .3 },
  afk: { react: .3, distract: 0, ignore: 0, afk: 600 },
};
const PROF = PROFS[PROFILE];
const DT = 1 / 30;
newGame();
let path = [], key = '', think = 0, mode = 'follow', episode = 0, stuckT = 0, lastPos = [P.x, P.y], ignoring = false, afkFrom = null, afkTo = null;
function randomTile() {
  for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * 15), ty = Math.floor(Math.random() * 34); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } }
  return [];
}
function drive(dt) {
  if (PROF.afk) {
    const t = S.stats.time;
    if (afkFrom === null && S.unlocked.recep && S.unlocked.maid1) { afkFrom = t; afkTo = t + PROF.afk; }
    if (afkFrom !== null && t < afkTo) { botMove = null; path = []; key = ''; return; }
  }
  episode -= dt;
  if (episode <= 0) {
    episode = 3 + Math.random() * 5; const was = mode;
    mode = Math.random() < PROF.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow';
    if (mode !== was) { path = []; key = ''; think = 0; ignoring = false; if (mode === 'wander') path = randomTile(); }
  }
  think -= dt;
  if (think <= 0 && mode === 'follow') {
    think = PROF.react;
    if (PROF.ignore && Math.random() < PROF.ignore) { ignoring = true; path = randomTile(); key = 'rand'; }
    else {
      ignoring = false;
      const t = S.tut.moved ? guideTarget() : { tx: 7, ty: 24 };
      if (!t || t.here) { path = []; key = ''; }
      else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; }
    }
  }
  if (path.length) {
    const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) path.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    if (Math.hypot(P.x - lastPos[0], P.y - lastPos[1]) < .2) { stuckT += dt; if (stuckT > 1.5) { stuckT = 0; key = ''; think = 0; path = []; } } else stuckT = 0;
  } else { botMove = null; stuckT = 0; }
  lastPos = [P.x, P.y];
}
// ---------------------------------------------------------------- bookkeeping per segment (★1..★5, post = after ★5)
const seg = {};
const segOf = () => S.unlocked.sign ? 'post' : '★' + star();
const SEG = k => seg[k] || (seg[k] = { t: 0, buys: [], act: {}, src: { room: 0, tip: 0, bath: 0, milk: 0 }, money: 0, piles: 0, drought: 0, affordIdle: 0, choice: 0, pickups: 0, pickupSum: 0, visPads: 0, padsSpentTime: 0, phys: {} });
let prevPiles = {}, prevUnl = new Set(Object.keys(S.unlocked)), lastBuyT = 0, finT = null, prevEarned = 0;
const src = id => id === 'recep' ? 'room' : id === 'onsen' ? 'bath' : id === 'milk' ? 'milk' : 'tip';
const actClass = g => {
  if (!g) return 'idle';
  const k = g.kind;
  if (k === 'pile') return 'pile';
  if (k === 'pad') return 'pad';
  return 'work';   // desk / clean / shelf / basket
};
const steps = Math.round(90 * 60 / DT);
for (let i = 0; i < steps; i++) {
  const k = segOf();
  drive(DT); update(DT);
  if (state === 'celebrate') { S.done = true; go('play'); }
  const t = S.stats.time, s = SEG(k);
  const afkNow = afkFrom !== null && t >= afkFrom && t < afkTo;
  s.t += DT;
  // activity: what the player is doing (by the guide kind the bot follows), walking vs here
  let a = afkNow ? 'afk' : mode !== 'follow' ? 'distracted' : ignoring ? 'distracted' : actClass(GUIDE) + (GUIDE && GUIDE.here ? '*' : '');
  if (a === 'pad' && GUIDE && S.money < padNeed(UNLOCK[GUIDE.id])) a = 'padPartial';
  s.act[a] = (s.act[a] || 0) + DT;
  // physical: what the cat's body is doing this frame
  let ph = 'still';
  const workNow = (P.atDesk && Q[0] && Q[0].st === 'queue' && Q[0].ready && freeRoom()) || ROOMS.some(rm => S.rooms[rm.id] === 'messy' && inCleanZone(rm)) || (P.shelfT > 0) || (P.basketT > 0);
  if (P.pouring) ph = 'pour'; else if (workNow) ph = 'work'; else if (P.moving) ph = 'walk';
  s.phys[ph] = (s.phys[ph] || 0) + DT;
  // income by source: pile deltas
  for (const id in S.piles) { const d = (S.piles[id] || 0) - (prevPiles[id] || 0); if (d > 0) s.src[src(id)] += d; }
  prevPiles = Object.assign({}, S.piles);
  if (S.earned > prevEarned) { s.pickups++; s.pickupSum += S.earned - prevEarned; prevEarned = S.earned; }
  // purchases
  for (const id in S.unlocked) if (!prevUnl.has(id)) { prevUnl.add(id); s.buys.push({ id, t, gap: t - lastBuyT }); lastBuyT = t; }
  // money sitting / drought
  const pileSum = Object.values(S.piles).reduce((x, y) => x + y, 0);
  s.money += S.money * DT; s.piles += pileSum * DT;
  const vis = UNLOCKS.filter(padVisible);
  s.visPads += vis.length * DT;
  if (vis.length >= 2) s.choice += DT;
  const need = vis.length ? Math.min(...vis.map(padNeed)) : Infinity;
  if (S.money + pileSum < need) s.drought += DT;        // nothing affordable even after picking up every pile
  else if (S.money < need) s.affordIdle += DT;          // affordable only after picking up
  if (S.unlocked.sign && finT === null) finT = t;
  if (finT !== null && t > finT + POSTMIN * 60) break;
}
const R = Math.round, mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const out = { profile: PROFILE, fin: finT, seg: {} };
for (const k in seg) {
  const s = seg[k], tot = s.t, inc = s.src.room + s.src.tip + s.src.bath + s.src.milk;
  const gaps = s.buys.map(b => b.gap);
  out.seg[k] = {
    dur: R(tot), buys: s.buys.map(b => b.id).join(','), nBuy: s.buys.length, gapMean: gaps.length ? R(gaps.reduce((x, y) => x + y, 0) / gaps.length) : null, gapMax: gaps.length ? R(Math.max(...gaps)) : null,
    act: Object.fromEntries(Object.entries(s.act).map(([a, v]) => [a, +(v / tot * 100).toFixed(0)])),
    phys: Object.fromEntries(Object.entries(s.phys).map(([a, v]) => [a, +(v / tot * 100).toFixed(0)])),
    incomePerMin: R(inc / tot * 60), srcPct: Object.fromEntries(Object.entries(s.src).map(([a, v]) => [a, inc ? R(v / inc * 100) : 0])),
    avgMoney: R(s.money / tot), avgPiles: R(s.piles / tot), droughtPct: R(s.drought / tot * 100), affordPct: R(s.affordIdle / tot * 100), choicePct: R(s.choice / tot * 100), visPads: +(s.visPads / tot).toFixed(1),
    pickupsPerMin: +(s.pickups / tot * 60).toFixed(1), avgPickup: s.pickups ? R(s.pickupSum / s.pickups) : 0,
  };
}
out.endMoney = S.money; out.earned = S.earned; out.guests = S.stats.guests; out.angry = S.stats.angry;
if (JSONOUT) console.log(JSON.stringify(out));
else {
  console.log(PROFILE, '★5 at', finT ? mmss(finT) : 'not reached', '| end money', S.money, 'earned', S.earned);
  for (const k in out.seg) { const s = out.seg[k]; console.log(' ', k, JSON.stringify(s)); }
}
