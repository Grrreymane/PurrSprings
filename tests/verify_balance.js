// Independent re-check of the balance audit (pasted into the game closure by _workflow/tools/headless.js).
//   node D:/Minigame/_workflow/tools/headless.js <gameDir> tests/verify_balance.js --seed N -- <eager|casual|novice> [maxMin] [trace=a-b]
// Works on any build (reads no tuning constants by name): driver = tests/bot.js; novice = 2 s reaction, 50% idle/wander
// episodes, 30% of follow decisions walk to a random tile for one reaction period. Prints one JSON line.
// NOTE (headless.js pastes with String.replace): never write a dollar sign followed by a quote, & or backtick here.
const ARG = k => { const a = ARGS.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };
const PROFILE = ARGS[0] || 'eager', MAXMIN = +ARGS[1] || 60, TRACE = ARG('trace') ? ARG('trace').split('-').map(Number) : null;
const PROF = { eager: { react: .3, distract: 0, ignore: 0 }, casual: { react: 1, distract: .3, ignore: 0 }, novice: { react: 2, distract: .5, ignore: .3 } }[PROFILE];
const DT = 1 / 30;
newGame();
let path = [], key = '', think = 0, mode = 'follow', episode = 0, stuckT = 0, lastPos = [P.x, P.y], ignoring = false;
function randomTile() {
  for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } }
  return [];
}
function drive(dt) {
  episode -= dt;
  if (episode <= 0) {
    episode = 3 + Math.random() * 5;
    const was = mode;
    mode = Math.random() < PROF.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow';
    if (mode !== was) { path = []; key = ''; think = 0; ignoring = false; if (mode === 'wander') path = randomTile(); }
  }
  think -= dt;
  if (think <= 0 && mode === 'follow') {
    think = PROF.react;
    if (PROF.ignore && Math.random() < PROF.ignore) { ignoring = true; path = randomTile(); key = 'rand'; }
    else {
      ignoring = false;
      const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };
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
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const pileSum = () => Object.values(S.piles).reduce((a, b) => a + b, 0);
const wealth = () => S.money + pileSum() + Object.values(S.paid).reduce((a, b) => a + b, 0);
const unlockT = {}, inv = {};
const flag = (k, m) => { inv[k] = inv[k] || { n: 0, first: m }; inv[k].n++; };
let onsenAt = null, porterAt = null, recepAt = null, base0 = null, fin = null;
let starve = 0, starve3 = 0, starvePorter = 0, giveTowel = 0, giveSlot = 0, noRoom = 0, maxPile = 0, bigPileT = 0, playT = 0;
let lastEarned = 0, lastEarnAt = 0, maxGap = 0;
// "pile trap": the biggest pile alone would pay for the cheapest visible pad, money in hand would not, and the arrow points elsewhere
let trap2Run = 0, trap2Max = 0, trap2At = 0, trapRun = 0, trapMax = 0, trapMaxAt = 0, trapTot = 0, trapPile = 0;
const ckAt = new Map(), hold = [], prevSt = new Map();
const win = { gen: [], ck: [], col: [] }; let lastW = 0, lastG = 0, lastE = 0, winStart = 0;
const guideT = {};
const steps = Math.round(MAXMIN * 60 / DT);
let lastSec = -1;
for (let i = 0; i < steps; i++) {
  drive(DT); update(DT);
  if (state === 'celebrate') { S.done = true; go('play'); }
  const t = S.stats.time;
  for (const u of UNLOCKS) if (S.unlocked[u.id] && unlockT[u.id] === undefined) unlockT[u.id] = t;
  if (S.unlocked.onsen && onsenAt === null) onsenAt = t;
  if (S.unlocked.porter && porterAt === null) porterAt = t;
  if (S.unlocked.recep && recepAt === null) { recepAt = t; base0 = { g: S.stats.guests, a: S.stats.angry }; }
  if (S.earned > lastEarned) { lastEarned = S.earned; lastEarnAt = t; }
  if (!fin && t - lastEarnAt > maxGap) maxGap = t - lastEarnAt;
  if (S.unlocked.onsen && S.basket === 0 && GUESTS.some(g => g.st === 'towel')) { starve += DT; if (t < onsenAt + 180) starve3 += DT; if (porterAt !== null) starvePorter += DT; }
  const f = Q[0]; if (f && f.st === 'queue' && f.ready && !freeRoom()) noRoom += DT;
  const ps = pileSum(); playT += DT; if (ps > maxPile) maxPile = ps;
  { let mp = 0; for (const k in S.piles) mp = Math.max(mp, S.piles[k]); if (mp > 144) bigPileT += DT; }
  const gk = GUIDE ? GUIDE.kind + (GUIDE.here ? '*' : '') : 'none'; guideT[gk] = (guideT[gk] || 0) + DT;
  {
    let pid = null; for (const id in S.piles) if (S.piles[id] > 0 && (!pid || S.piles[id] > S.piles[pid])) pid = id;
    let need = 1e9; for (const u of UNLOCKS) if (padVisible(u)) need = Math.min(need, padNeed(u));
    const trap = pid && S.money < need && S.money + S.piles[pid] >= need && !(GUIDE && (GUIDE.kind === 'pad' || (GUIDE.kind === 'pile' && GUIDE.tx === PILE_AT[pid][0] && GUIDE.ty === PILE_AT[pid][1])));
    const t2 = pid && S.money < need && S.money + S.piles[pid] >= need; if (t2) { trap2Run += DT; if (trap2Run > trap2Max) { trap2Max = trap2Run; trap2At = t; } } else trap2Run = 0;
    if (trap && mode === 'follow' && !ignoring) { trapRun += DT; trapTot += DT; if (trapRun > trapMax) { trapMax = trapRun; trapMaxAt = t; trapPile = ps; } } else if (!trap) trapRun = 0;
  }
  for (const gu of GUESTS) {
    const p = prevSt.get(gu.id);
    if (p !== gu.st) {
      if (p === 'towel' && gu.st !== 'toSlot') giveTowel++;
      if (p === 'toSlot' && gu.st !== 'bathing') giveSlot++;
      prevSt.set(gu.id, gu.st);
    }
    if (gu.room && !ckAt.has(gu.id)) ckAt.set(gu.id, t);
    if (!gu.room && ckAt.has(gu.id) && ckAt.get(gu.id) >= 0) { hold.push([ckAt.get(gu.id), t - ckAt.get(gu.id)]); ckAt.set(gu.id, -1); }
  }
  if (t - winStart >= 30) { const w = wealth(); win.gen.push(w - lastW); lastW = w; win.ck.push(S.stats.guests - lastG); lastG = S.stats.guests; win.col.push(S.earned - lastE); lastE = S.earned; winStart += 30; }
  if (Math.floor(t) !== lastSec) {
    lastSec = Math.floor(t);
    if (!Number.isFinite(S.money) || S.money < 0 || S.money !== Math.floor(S.money)) flag('money', mmss(t));
    const perRoom = {}; for (const gu of GUESTS) { if (gu.room) perRoom[gu.room] = (perRoom[gu.room] || 0) + 1; if (gu.t > 180 && gu.st !== 'sleep' && gu.st !== 'bathing' && gu.st !== 'eat') flag('stuck', mmss(t) + ' ' + gu.st); }
    for (const k in perRoom) if (perRoom[k] > 1) flag('room-shared', mmss(t));
    if (S.basket < 0 || S.basket > 10) flag('basket', mmss(t));
    try { render(); } catch (e) { flag('render', String(e && e.message)); }
    if (TRACE && t >= TRACE[0] && t <= TRACE[1]) console.log(mmss(t), GUIDE ? GUIDE.kind + (GUIDE.here ? '*' : '') : '-', 'm' + S.money, JSON.stringify(S.piles).replace(/"/g, ''), 'Q' + Q.length, ROOMS.filter(r => S.unlocked[r.id]).map(r => S.rooms[r.id][0]).join(''), 'b' + S.basket, mode, 'need', (() => { let n = 1e9, id = ''; for (const u of UNLOCKS) if (padVisible(u) && padNeed(u) < n) { n = padNeed(u); id = u.id; } return id + ':' + n; })(), 'trap', R(trapRun));
  }
  if ((star() >= 5) && !fin) { fin = t; break; }
}
const order = UNLOCKS.filter(u => unlockT[u.id] !== undefined).sort((a, b) => unlockT[a.id] - unlockT[b.id]);
let prev = 0, gapEarly = 0, gapLate = 0, gapEarlyAt = '', gapLateAt = '';
for (const u of order) { const gp = unlockT[u.id] - prev; if (unlockT[u.id] <= 300) { if (gp > gapEarly) { gapEarly = gp; gapEarlyAt = u.id; } } else if (gp > gapLate) { gapLate = gp; gapLateAt = u.id; } prev = unlockT[u.id]; }
const ga = base0 ? S.stats.guests - base0.g : 0, aa = base0 ? S.stats.angry - base0.a : 0;
const winAvg = (arr, a, b) => { let s = 0, n = 0; arr.forEach((v, i) => { const m = (i + 1) * 30; if (m > a && m <= b) { s += v; n++; } }); return n ? +(s / n * 2).toFixed(2) : 0; };
const holdAvg = (a, b) => { const h = hold.filter(([c]) => c >= a && c < b).map(x => x[1]); return h.length ? +(h.reduce((x, y) => x + y, 0) / h.length).toFixed(1) : 0; };
const O = onsenAt;
const dip = O === null ? null : {
  holdB: holdAvg(O - 120, O), holdA: holdAvg(O, O + 120), holdA2: holdAvg(O + 120, O + 240),
  ckB: winAvg(win.ck, O - 120, O), ckA: winAvg(win.ck, O, O + 120), ckA2: winAvg(win.ck, O + 120, O + 240),
  genB: winAvg(win.gen, O - 120, O), genA: winAvg(win.gen, O, O + 120), genA2: winAvg(win.gen, O + 120, O + 240),
  colB: winAvg(win.col, O - 120, O), colA: winAvg(win.col, O, O + 120), colA2: winAvg(win.col, O + 120, O + 240),
};
console.log(JSON.stringify({ profile: PROFILE, fin, end: S.stats.time, unlockT, gapEarly, gapEarlyAt, gapLate, gapLateAt, angry: ga + aa ? aa / (ga + aa) : 0, angryPre: base0 ? base0.a : S.stats.angry, guestsPre: base0 ? base0.g : S.stats.guests, angryAll: S.stats.angry, guestsAll: S.stats.guests,
  maxGap, starve, starve3, starvePorter, giveTowel, giveSlot, noRoom, dip, trap2Max, trap2At, trapMax, trapMaxAt, trapTot, trapPile, maxPile, bigPileFrac: bigPileT / playT, guideT, inv }));
