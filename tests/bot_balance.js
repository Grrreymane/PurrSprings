// Balance / pacing bot (pasted into the game closure by _workflow/tools/headless.js). Extends tests/bot.js.
// v2 stage 1: runs on the 40x36 map and ends at star 5 (roten); the old cfg price sets (A / F / F2 / B) name v1 pads
// (sign ...) and no longer apply - use cfg=base. SPEC_v2 14.1 profiles + 14.2 metrics come with stage 3.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/bot_balance.js --seed 1 -- eager 60 json cfg=base
//   profiles: eager | casual (same driver as bot.js) | novice (2 s reaction, 50% idle/wander, ignores the arrow 30%)
//             | afk (eager until recep + maid1, then 10 min hands off, then eager again)
//   cfg=<name> picks a named override set from CFGS below; set=key:val,key:val adds ad-hoc overrides on top.
//   Run every profile x seed and print medians with: node tests/balance_all.js [cfg] [set]
// Overrides work without touching index.html: data tables (UNLOCKS / STARS) are mutable objects, and the functions
// that read a `const` (PATIENCE, towelCap() ...) are re-compiled from their own source with the constant swapped for
// a field of __C (direct eval keeps the game's closure in scope). With cfg=base everything equals the shipped game.
// Since the balance fix the shipped game IS bath-last + basket 10 + porter 6 + the F2 prices + the pile-first guide rule 2b (= cfg=rec);
// bathLast:0 / basketStart:4 / porterCarry:4 / pileFirst:0 + the old prices rebuild the MVP for comparison.
const ARG = k => { const a = ARGS.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };
const PROFILE = ARGS[0] || 'eager', MAXMIN = +ARGS[1] || 60, JSONOUT = ARGS.includes('json'), TRACE = ARG('trace') ? ARG('trace').split('-').map(Number) : null;
// ---------------------------------------------------------------- overrides
const __C = {   // shipped values
  patience: PATIENCE, patienceEarly: PATIENCE_EARLY, bathWait: BATH_WAIT, basketStart: BASKET_MAX, towelBase: 4, towelStep: 3, porterCarry: 6, porterRefill: 6,
  checkinT: CHECKIN_T, cleanT: CLEAN_T, maidCleanT: MAID_CLEAN_T, bathT: BATH_T, sleepT: SLEEP_T, spawnSlack: 3, gSpeed: G_SPEED,
  towelLow: 2,        // guide rule 4: fetch towels when the basket has <= this many
  // rule switches (0 = shipped behaviour)
  skipBath: 0,        // (ignored since v2 2A) 1: at check-in a guest only heads for the onsen if the basket has a towel nobody else is already walking to; else straight to the room
  bathLast: 1,        // (ignored since v2 2A) 1 (shipped): guests sleep first, then bathe (+ milk) on the way out, so the room is freed before the long onsen trip; 0 = MVP bath-first
  cleanAhead: 0,      // 1: guide: with nothing more urgent, point at the nearest messy room no maid has claimed (before "biggest pile")
  pileFirst: 1,       // 1 (shipped): guide rule 2b: if money + the biggest pile would pay for a visible pad, fetch that pile (after the desk rule, before cleaning / towels); 0 = without
};
const CFGS = {
  base: {},
  // A = first cut: guests sleep first and bathe on the way out, basket starts full, porter carries 6, cheaper early pads,
  //     maid1 before room4/milk, later pads ~x1.3 (bath-last makes the mid/late game richer). Final pick is F2 (= rec) below.
  // NOTE: headless.js pastes this file with String.replace, so never write a dollar sign followed by a quote / & / backtick here.
  A: { bathLast: 1, basketStart: 10, porterCarry: 6, pileFirst: 0,
    'price.room2': 25, 'price.room3': 40, 'price.shoes1': 40, 'price.onsen': 55, 'price.room4': 180, 'price.recep': 60, 'price.basket1': 90,
    'price.milk': 200, 'price.maid1': 120, 'price.room5': 290, 'price.room6': 340, 'price.shoes2': 310, 'price.porter': 390, 'price.basket2': 340,
    'price.room7': 460, 'price.room8': 520, 'price.maid2': 550, 'price.bigbath': 650, 'price.shoes3': 520, 'price.sign': 1000 },
};
CFGS.A_porterEarly = Object.assign({}, CFGS.A, { reqs: { porter: ['maid1'] } });
// F = A + the guide fetches a pile that would pay for a pad (after the desk rule, before cleaning), and cheaper first five minutes
CFGS.F = Object.assign({}, CFGS.A, { pileFirst: 1, 'price.room3': 35, 'price.shoes1': 35, 'price.onsen': 50, 'price.recep': 55, 'price.basket1': 80 });
// F2 = F with room5 onward ~x1.1 (eager closer to 19 min)  <- the recommended set (alias: rec)
CFGS.F2 = Object.assign({}, CFGS.F, { 'price.room5': 320, 'price.room6': 370, 'price.shoes2': 340, 'price.porter': 430, 'price.basket2': 370,
  'price.room7': 500, 'price.room8': 570, 'price.maid2': 600, 'price.bigbath': 720, 'price.shoes3': 570, 'price.sign': 1100 });
CFGS.rec = CFGS.F2;
// B = numbers only (no bath-last rule): full basket, porter carries 6, pile-first guide, cheaper first pads, maid1 before room4/milk
CFGS.B = { bathLast: 0, basketStart: 10, porterCarry: 6, pileFirst: 1, 'price.room3': 35, 'price.shoes1': 35, 'price.onsen': 50, 'price.recep': 55, 'price.basket1': 80, 'price.maid1': 120 };
function applySet(o, str) { if (!str) return o; for (const kv of str.split(',')) { const [k, v] = kv.split(':'); o[k] = +v; } return o; }
const CFGNAME = ARG('cfg') || 'base', CFG = applySet(Object.assign({}, CFGS[CFGNAME] || {}), ARG('set'));
// lateScale:x,lateFrom:i multiplies the price of UNLOCKS[i..] by x (rounded to 10) before any price.<id> override
if (CFG.lateScale) { UNLOCKS.forEach((u, i) => { if (i >= (CFG.lateFrom || 0)) u.price = Math.round(u.price * CFG.lateScale / 10) * 10; }); }
for (const k in CFG) {
  const v = CFG[k];
  if (k === 'lateScale' || k === 'lateFrom') continue;
  if (k === 'reqs') { for (const id in v) UNLOCK[id].req = v[id]; continue; }   // { id: [prerequisite ids] }
  if (k.startsWith('price.')) UNLOCK[k.slice(6)].price = v;
  else if (/^star\d\./.test(k)) STARS[+k[4]][k.slice(6)] = v;
  else if (k in __C) __C[k] = v;
  else throw new Error('unknown override ' + k);
}
const __towelCap = () => __C.towelBase + __C.towelStep * ((S.unlocked.basket1 ? 1 : 0) + (S.unlocked.basket2 ? 1 : 0));
function patchFn(name, pairs) {
  let s = eval(name).toString();
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('patch ' + name + ': no "' + a + '"'); s = s.split(a).join(b); }
  eval(name + ' = (' + s + ')');
}
patchFn('addGuest', [['PATIENCE_EARLY', '__C.patienceEarly'], ['PATIENCE', '__C.patience'], ['G_SPEED *', '__C.gSpeed *']]);
patchFn('bubbles', [['PATIENCE', '__C.patience'], ['BATH_WAIT', '__C.bathWait']]);
patchFn('updGuest', [['BATH_WAIT', '__C.bathWait'], ['BATH_T', '__C.bathT'], ['SLEEP_T', '__C.sleepT']]);
patchFn('unlock', [['S.basket = BASKET_MAX', 'S.basket = __C.basketStart']]);
patchFn('zones', [['towelCap()', '__towelCap()'], ['CLEAN_T', '__C.cleanT']]);
patchFn('checkinT', [['CHECKIN_T', '__C.checkinT']]);   // v2 2C: the check-in time moved into checkinT() (receptionist levels)
patchFn('guideTarget', [['towelCap()', '__towelCap()'], ['S.basket <= 2', 'S.basket <= __C.towelLow'],
  ['if (pid && S.money + S.piles[pid] >= need) return T_PILE(pid);', 'if (__C.pileFirst && pid && S.money + S.piles[pid] >= need) return T_PILE(pid);'],
  ['  // 6. the biggest fish pile', `  if (__C.cleanAhead) { let bm = null, bd = 1e9; for (const rm of ROOMS) if (S.rooms[rm.id] === 'messy' && !RT[rm.id].claim) { const c = futonC(rm), d = dist(P.x, P.y, c[0], c[1]); if (d < bd) { bd = d; bm = rm; } } if (bm) return T_CLEAN(bm, false); }
  // 6. the biggest fish pile`]]);
patchFn('updStaff', [['const cap = porterCap(s);', 'const cap = __C.porterCarry + staffLv(s) - 1;'], ['S.basket <= 6', 'S.basket <= __C.porterRefill'], ['MAID_CLEAN_T', '__C.maidCleanT']]);   // v2 2C: porter levels
patchFn('spawnGuests', [['guestRoomsOpen() + 3', 'guestRoomsOpen() + __C.spawnSlack']]);
// skipBath / bathLast were v1 flow experiments; since v2 stage 2A the flow is fixed by SPEC_v2 4.12 (room -> breakfast ->
// bath -> souvenirs), so both switches are ignored.

const PROFS = {
  eager: { react: .3, distract: 0, ignore: 0 },
  casual: { react: 1, distract: .3, ignore: 0 },
  novice: { react: 2, distract: .5, ignore: .3 },
  afk: { react: .3, distract: 0, ignore: 0, afk: 600 },
};
const PROF = PROFS[PROFILE] || PROFS.eager;
const DT = 1 / 30;
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
newGame();
// ---------------------------------------------------------------- driver (eager / casual identical to bot.js)
let path = [], key = '', think = 0, mode = 'follow', episode = 0, stuckT = 0, lastPos = [P.x, P.y], stuckN = 0, ignoring = false;
let afkFrom = null, afkTo = null;
function randomTile() {
  for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } }
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
    episode = 3 + Math.random() * 5;
    const was = mode;
    mode = Math.random() < PROF.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow';
    if (mode !== was) { path = []; key = ''; think = 0; ignoring = false; if (mode === 'wander') path = randomTile(); }
  }
  think -= dt;
  if (think <= 0 && mode === 'follow') {
    think = PROF.react;
    // novice: 30% of its decisions (one per reaction time) head somewhere random instead of where the arrow points
    if (PROF.ignore && Math.random() < PROF.ignore) { ignoring = true; path = randomTile(); key = 'rand'; }
    else {
      ignoring = false;
      const t = S.tut.moved ? guideTarget() : { tx: 17, ty: 24 };   // first steps: walk up into the lobby (the hand hint)
      if (!t || t.here) { path = []; key = ''; }
      else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); const pp = findPath(sx, sy, t.tx, t.ty); if (!pp) unreach++; path = pp || []; }
    }
  }
  if (path.length) {
    const [tx, ty] = path[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) path.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    if (Math.hypot(P.x - lastPos[0], P.y - lastPos[1]) < .2) { stuckT += dt; if (stuckT > 1.5) { stuckN++; stuckT = 0; key = ''; think = 0; path = []; } } else stuckT = 0;
  } else { botMove = null; stuckT = 0; }
  lastPos = [P.x, P.y];
}
let unreach = 0;
// ---------------------------------------------------------------- bookkeeping
const unlockT = {}, inv = {}, flag = (k, m) => { inv[k] = inv[k] || { n: 0, first: m }; inv[k].n++; };
let lastEarned = 0, lastEarnAt = 0, maxGap = 0, maxGapAt = 0, recepAt = null, base = null, peakQueue = 0;
let activeSince = 0, maxActiveGap = 0;            // follow-mode seconds since the last pickup (novice: is the arrow ever a dead end?)
let secs = 0, sumMoney = 0, sumPiles = 0, starve = 0, starveAny = 0, giveTowel = 0, giveSlot = 0, bathed = 0, onsenAt = null;
let deskIdle = 0, noRoom = 0, starvePorter = 0, starve3 = 0, qEmpty = 0, recepT = 0;                    // front guest waiting: nobody at the desk / no clean room
const prevSt = new Map();
const actT = {};                                 // seconds by what the arrow said (player activity), split by phase
const phaseOf = t => onsenAt === null ? 'pre' : t < onsenAt + 180 ? 'post3' : 'later';
const wealth = () => S.money + Object.values(S.piles).reduce((a, b) => a + b, 0) + Object.values(S.paid).reduce((a, b) => a + b, 0);
const gen = [], col = [], cki = [];             // per 30 s window: income generated (fees into piles), collected (picked up), check-ins
let lastE = 0, lastG = 0;
const hold = [];                                 // [checkin time, seconds the room was held (check-in -> guest leaves)]
const ckAt = new Map();
let afkLog = null;
const t0 = () => S.stats.time;
function checkSecond() {
  const t = t0();
  if (!Number.isFinite(S.money) || S.money < 0 || S.money !== Math.floor(S.money)) flag('money', mmss(t) + ' ' + S.money);
  const perRoom = {}, perSlot = {};
  for (const gu of GUESTS) {
    if (gu.room) perRoom[gu.room] = (perRoom[gu.room] || 0) + 1;
    if (gu.slot >= 0) perSlot[gu.slot] = (perSlot[gu.slot] || 0) + 1;
    if (gu.t > 180 && gu.st !== 'sleep' && gu.st !== 'bathing' && gu.st !== 'eat') flag('stuck-guest', mmss(t) + ' ' + gu.st + ' ' + R(gu.t) + 's at ' + R(gu.x) + ',' + R(gu.y));
    if (!Number.isFinite(gu.x) || !Number.isFinite(gu.y)) flag('guest-nan', mmss(t));
  }
  for (const k in perRoom) if (perRoom[k] > 1) flag('room-shared', mmss(t) + ' ' + k);
  for (const k in perSlot) if (perSlot[k] > 1) flag('slot-shared', mmss(t) + ' ' + k);
  for (let i = 0; i < SLOT_OCC.length; i++) if (SLOT_OCC[i] && !GUESTS.includes(SLOT_OCC[i])) flag('slot-leak', mmss(t) + ' slot ' + i);
  for (const rm of ROOMS) if (RT[rm.id].guest && !GUESTS.includes(RT[rm.id].guest) && RT[rm.id].guest !== VIPG) flag('room-leak', mmss(t) + ' ' + rm.id);   // a suite may hold the VIP (stage 2B)
  if (S.basket < 0 || S.basket > 10 || S.basket !== Math.floor(S.basket)) flag('basket', mmss(t) + ' ' + S.basket);
  if (boxHit(P.x, P.y)) flag('player-in-wall', mmss(t) + ' ' + R(P.x) + ',' + R(P.y));
  for (const k in S.piles) if (!Number.isFinite(S.piles[k]) || S.piles[k] < 0) flag('pile', k + ' ' + S.piles[k]);
  for (const s of STAFF) if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) flag('staff-nan', s.id);
  try { render(); } catch (e) { flag('render', String(e && e.message || e)); }
  peakQueue = Math.max(peakQueue, Q.length);
  secs++; sumMoney += S.money; sumPiles += Object.values(S.piles).reduce((a, b) => a + b, 0);
}
// ---------------------------------------------------------------- run
const steps = Math.round(MAXMIN * 60 / DT);
let lastSec = -1, fin = null, lastW = 0, winStart = 0;
for (let i = 0; i < steps; i++) {
  drive(DT);
  update(DT);
  if (state === 'celebrate') { S.done = true; go('play'); }
  const t = t0();
  for (const u of UNLOCKS) if (S.unlocked[u.id] && unlockT[u.id] === undefined) unlockT[u.id] = t;
  if (S.unlocked.recep && recepAt === null) { recepAt = t; base = { g: S.stats.guests, a: S.stats.angry }; }
  if (S.unlocked.onsen && onsenAt === null) onsenAt = t;
  const afkNow = afkFrom !== null && t >= afkFrom && t < afkTo;
  if (afkFrom !== null && !afkLog && t >= afkFrom) afkLog = { from: afkFrom, g0: S.stats.guests, a0: S.stats.angry, w0: wealth(), m0: S.money };
  if (afkLog && afkLog.end === undefined && t >= afkTo) {
    afkLog.end = t; afkLog.piles = Object.assign({}, S.piles); afkLog.pileSum = Object.values(S.piles).reduce((a, b) => a + b, 0);
    afkLog.guests = S.stats.guests - afkLog.g0; afkLog.angry = S.stats.angry - afkLog.a0; afkLog.genPerMin = (wealth() - afkLog.w0) / (PROF.afk / 60);
    afkLog.money = S.money; afkLog.basket = S.basket; afkLog.queue = Q.length; afkLog.inHouse = GUESTS.length; afkLog.rooms = Object.assign({}, S.rooms);
    lastEarnAt = t; activeSince = 0;   // the hands-off stretch is not an earning gap
  }
  if (afkLog && afkLog.end !== undefined && afkLog.collected === undefined && Object.values(S.piles).reduce((a, b) => a + b, 0) < afkLog.pileSum * .1) afkLog.collected = t - afkLog.end;
  if (S.earned > lastEarned) { lastEarned = S.earned; lastEarnAt = t; activeSince = 0; }
  else if (mode === 'follow' && !ignoring && !afkNow) activeSince += DT;
  if (!fin && !afkNow) {
    if (t - lastEarnAt > maxGap) { maxGap = t - lastEarnAt; maxGapAt = lastEarnAt; }
    if (activeSince > maxActiveGap) maxActiveGap = activeSince;
  }
  // per-frame stats
  const ph = phaseOf(t), kind = afkNow ? 'afk' : mode !== 'follow' ? mode : ignoring ? 'ignore' : GUIDE ? (GUIDE.here ? GUIDE.kind + '*' : GUIDE.kind) : 'none';
  actT[ph] = actT[ph] || {}; actT[ph][kind] = (actT[ph][kind] || 0) + DT;
  if (S.unlocked.onsen) {
    const waitT = GUESTS.some(gu => gu.st === 'towel');
    if (S.basket === 0 && waitT) { starve += DT; if (S.unlocked.porter) starvePorter += DT; if (t < onsenAt + 180) starve3 += DT; }
    if (S.basket === 0) starveAny += DT;
  }
  const f = Q[0];
  if (f && f.st === 'queue' && f.ready) { if (!freeRoom()) noRoom += DT; else if (!deskManned()) deskIdle += DT; }
  if (S.unlocked.recep && !afkNow) { recepT += DT; if (!Q.length || !(Q[0].ready)) qEmpty += DT; }   // nobody at the counter: spawn-limited
  for (const gu of GUESTS) {
    const p = prevSt.get(gu.id);
    if (p !== gu.st) {
      if (p === 'towel' && (gu.st === 'toRoom' || gu.st === 'leave')) giveTowel++;
      if (p === 'toSlot' && (gu.st === 'toRoom' || gu.st === 'leave')) giveSlot++;
      if (p === 'bathing') bathed++;
      prevSt.set(gu.id, gu.st);
    }
  }
  for (const gu of GUESTS) { if (gu.room && !ckAt.has(gu.id)) ckAt.set(gu.id, t); if (!gu.room && ckAt.has(gu.id) && ckAt.get(gu.id) !== -1) { hold.push([ckAt.get(gu.id), t - ckAt.get(gu.id)]); ckAt.set(gu.id, -1); } }
  if (t - winStart >= 30) { const w = wealth(); gen.push(w - lastW); lastW = w; col.push(S.earned - lastE); lastE = S.earned; cki.push(S.stats.guests - lastG); lastG = S.stats.guests; winStart += 30; }
  if (Math.floor(t) !== lastSec) {
    lastSec = Math.floor(t); if (!fin) checkSecond();
    if (TRACE && t >= TRACE[0] && t <= TRACE[1]) {   // trace=a-b: one line per second (debugging the pacing)
      const gs = {}; for (const gu of GUESTS) gs[gu.st] = (gs[gu.st] || 0) + 1;
      console.log(mmss(t), (GUIDE ? GUIDE.kind + (GUIDE.here ? '*' : '') : '-').padEnd(7), 'P' + tileOf(P), 'm' + S.money, 'piles', JSON.stringify(S.piles).replace(/"/g, ''), 'Q' + Q.length + (Q[0] && Q[0].ready ? 'r' : ''), 'rooms', ROOMS.filter(r => S.unlocked[r.id]).map(r => S.rooms[r.id][0] + (RT[r.id].guest ? '+' : '')).join(''), 'basket', S.basket, 'tw', P.towels, JSON.stringify(gs).replace(/"/g, ''), mode);
    }
  }
  if (star() >= 5 && !fin) { fin = t; break; }
}
// ---------------------------------------------------------------- report
const order = UNLOCKS.filter(u => unlockT[u.id] !== undefined).sort((a, b) => unlockT[a.id] - unlockT[b.id]);
let prev = 0, gapEarly = 0, gapLate = 0, gapEarlyAt = '', gapLateAt = '';
for (const u of order) {
  let gp = unlockT[u.id] - prev;
  if (afkLog && prev < afkLog.end && unlockT[u.id] > afkLog.from) gp -= PROF.afk;   // don't count the hands-off stretch
  if (unlockT[u.id] <= 300) { if (gp > gapEarly) { gapEarly = gp; gapEarlyAt = u.id; } } else if (gp > gapLate) { gapLate = gp; gapLateAt = u.id; }
  prev = unlockT[u.id];
}
const ga = base ? S.stats.guests - base.g : 0, aa = base ? S.stats.angry - base.a : 0, angryRate = ga + aa ? aa / (ga + aa) : 0;
const angryAll = S.stats.angry / Math.max(1, S.stats.guests + S.stats.angry);
// income generated per minute: the 2 minutes before / after the onsen opens
const genAt = (a, b) => { let s = 0, n = 0; gen.forEach((v, i) => { const m = (i + 1) * 30; if (m > a && m <= b) { s += v; n++; } }); return n ? s / n * 2 : 0; };
const winAt = (arr, a, b) => { let s = 0, n = 0; arr.forEach((v, i) => { const m = (i + 1) * 30; if (m > a && m <= b) { s += v; n++; } }); return n ? s / n * 2 : 0; };
const holdAt = (a, b) => { const h = hold.filter(([c]) => c >= a && c < b).map(x => x[1]); return h.length ? h.reduce((x, y) => x + y, 0) / h.length : 0; };
const onsenDip = onsenAt !== null ? { before: R(genAt(onsenAt - 120, onsenAt)), after: R(genAt(onsenAt, onsenAt + 120)), after2: R(genAt(onsenAt + 120, onsenAt + 240)),
  colB: R(winAt(col, onsenAt - 120, onsenAt)), colA: R(winAt(col, onsenAt, onsenAt + 120)), colA2: R(winAt(col, onsenAt + 120, onsenAt + 240)),
  ckB: +winAt(cki, onsenAt - 120, onsenAt).toFixed(1), ckA: +winAt(cki, onsenAt, onsenAt + 120).toFixed(1), ckA2: +winAt(cki, onsenAt + 120, onsenAt + 240).toFixed(1),
  holdB: R(holdAt(onsenAt - 120, onsenAt)), holdA: R(holdAt(onsenAt, onsenAt + 120)), holdA2: R(holdAt(onsenAt + 120, onsenAt + 240)) } : null;
const out = {
  profile: PROFILE, cfg: CFGNAME, set: ARG('set') || '', fin, unlockT, gapEarly, gapEarlyAt, gapLate, gapLateAt, angryRate, angryAll, maxGap, maxGapAt, maxActiveGap,
  avgMoney: secs ? sumMoney / secs : 0, avgPiles: secs ? sumPiles / secs : 0, starve, starvePorter, starve3, qEmptyPct: recepT ? qEmpty / recepT : 0, starveAny, giveTowel, giveSlot, bathed, onsenAt, onsenDip, deskIdle, noRoom,
  act: actT, gen, col, cki, afk: afkLog, inv, stuckN, unreach, peakQueue, guests: S.stats.guests, angry: S.stats.angry, end: t0(), unlockedN: Object.keys(S.unlocked).length,
};
if (JSONOUT) console.log(JSON.stringify(out));
else {
  console.log(`${PROFILE}[${CFGNAME}] ★5 ${fin ? mmss(fin) : 'NOT REACHED (' + mmss(t0()) + ', ' + Object.keys(S.unlocked).length + ' unlocked)'} | gap≤5m ${R(gapEarly)}s(${gapEarlyAt}) >5m ${R(gapLate)}s(${gapLateAt}) | angry ${(angryRate * 100).toFixed(1)}% | earn-gap ${R(maxGap)}s@${mmss(maxGapAt)} | starve ${R(starve)}s give ${giveTowel}/${giveSlot} bathed ${bathed} | money ${R(out.avgMoney)} piles ${R(out.avgPiles)} | onsen ${JSON.stringify(onsenDip)} | inv ${Object.keys(inv).length ? 'FAIL' : 'OK'}`);
  console.log('  ' + order.map(u => mmss(unlockT[u.id]) + ' ' + u.id).join(', '));
  if (afkLog) console.log('  afk ' + JSON.stringify(afkLog));
  for (const ph in actT) console.log('  act ' + ph + ': ' + Object.entries(actT[ph]).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + R(v)).join(', '));
  for (const k in inv) console.log('  INVARIANT ' + k + ' x' + inv[k].n + ' first: ' + inv[k].first);
}
if (Object.keys(inv).length) process.exitCode = 1;
