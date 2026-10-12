// Balance / pacing bot: SPEC_v2 14.1 profiles + 14.2 metrics + 14.3 invariants (pasted into the game closure by
// _workflow/tools/headless.js). Its brain is the arrow (SPEC_v2 6): every reaction it walks the BFS path to GUIDE.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/bot_balance.js --seed 1 -- eager [maxMin] [json]
//        [post=min] [log=file.jsonl] [trace=a-b] [cfg=base] [set=key:val,...]
// profiles (14.1):
//   eager    0.3 s reaction, always on the arrow; plays `post` (default 5) min past star 5 for D1 / D2
//   casual   1 s reaction, 30 % of the time wandering or standing
//   novice   2 s reaction, half of the time wandering or standing, 30 % of its decisions ignore the arrow (a random walk)
//   afk      eager; once the receptionist and a maid are hired: hands off for 10 min (A4), then eager again
//   afkref   the reference for A4 (stage 4): eager, but from that same moment it buys nothing for 10 min - it keeps
//            serving (calls, towels, cleaning, the desk, cooking, the VIP, decor), so the inn is the one afk leaves alone
//   ignore   eager, but never does calls, the VIP or decor: guideTarget({ skip }) leaves those rules out (the next rule
//            applies), and the game's own arrow is the same one (so what is drawn = what is walked)
//   shopper  eager, then `post` (default 120; also ARGS[2]) min past star 5: the boutique (G1-G3)
//   afk5     v2.3 (19.3): eager to star 5, then hands off for the 15 min after it (the star-5 rush without the innkeeper:
//            REP5 must drop to <= 4.0); eager itself now plays 15 min past star 5 (REP5 >= 4.5: the innkeeper helps)
// Every target kind of 6 is known (a target that moves - a guest, the VIP - is re-read every 0.25 s; leading the VIP
// it walks straight to the suite and the VIP follows); an unknown kind is an invariant failure (WORKFLOW 5: never
// "stand around trading").
// Logged every second (log=file: one JSON line per second): the arrow kind ('*' = here) and rule, what the cat does
// (walk / work / pour / stand), income by source, purchases, "new things" (RUN.news). The report (json: one line) has
// every 14.2 metric one run can measure; tests/balance_all.js runs profiles x seeds, prints medians and the cross-run
// ones (A3 ignore vs eager, A4 afk vs afkref in the same minutes). Targets are printed, not enforced: balance_all.js sums
// up the ones not met (SPEC_v2 18.2 stage 4 says which apply to which profile).
// Exit 1 = an invariant (14.3, every second) failed or star 5 was not reached.
// Overrides (stage 4) work without touching index.html: cfg=<name> (CFGS below) / set=price.room2:30,star3.room:40,
// patience:80 ... Data tables are mutable; constants are swapped by re-compiling the few functions that read them (only
// when such an override is given - a re-compiled function sees this script's names, so bot names start with b).
// tests/bot.js runs this file (same arguments).
const ARG = k => { const a = ARGS.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };
const PROFILE = ARGS[0] || 'eager';
const PROFS = {
  eager: { react: .3, distract: 0, ignore: 0, max: 45, post: 15 },   // v2.3: 15 min past star 5 (the big rushes; D1 / D2 still read the first 5)
  casual: { react: 1, distract: .3, ignore: 0, max: 70, post: 0 },
  novice: { react: 2, distract: .5, ignore: .3, max: 120, post: 0 },
  afk: { react: .3, distract: 0, ignore: 0, afk: 600, max: 80, post: 0 },
  afkref: { react: .3, distract: 0, ignore: 0, hold: 600, max: 80, post: 0 },
  ignore: { react: .3, distract: 0, ignore: 0, skip: { call: true, vip: true, decor: true }, max: 70, post: 0 },
  shopper: { react: .3, distract: 0, ignore: 0, max: 45, post: 120 },
  afk5: { react: .3, distract: 0, ignore: 0, max: 45, post: 15, afk5: 900 },
};
if (!PROFS[PROFILE]) throw new Error('unknown profile ' + PROFILE + ' (' + Object.keys(PROFS).join(' / ') + ')');
const PROF = PROFS[PROFILE];
const MAXMIN = +ARGS[1] > 0 ? +ARGS[1] : PROF.max, JSONOUT = ARGS.includes('json');
const POST = ARG('post') !== null ? +ARG('post') : PROFILE === 'shopper' && +ARGS[2] > 0 ? +ARGS[2] : PROF.post;
const TRACE = ARG('trace') ? ARG('trace').split('-').map(Number) : null, LOGF = ARG('log');
const SNAP = ARG('snap'), SNAP_EVERY = 900; let bSnapN = 0;   // snap=dir: S saved as dir/snap_<min after star 5>.json every 15 min
// ---------------------------------------------------------------- overrides (stage 4)
const __C = { patience: PATIENCE, patienceEarly: PATIENCE_EARLY, bathT: BATH_T, sleepT: SLEEP_T, cleanT: CLEAN_T, maidCleanT: MAID_CLEAN_T,
  checkinT: CHECKIN_T, gSpeed: G_SPEED, spawnSlack: 3, porterCarry: 6 };
const CFGS = { base: {} };
function applySet(o, str) { if (!str) return o; for (const kv of str.split(',')) { const [k, v] = kv.split(':'); o[k] = +v; } return o; }
const CFGNAME = ARG('cfg') || 'base', CFG = applySet(Object.assign({}, CFGS[CFGNAME] || {}), ARG('set'));
if (!CFGS[CFGNAME]) throw new Error('unknown cfg ' + CFGNAME);
let bPatch = false;
for (const k in CFG) {
  const v = CFG[k];
  if (k.startsWith('price.')) { if (!UNLOCK[k.slice(6)]) throw new Error('unknown unlock ' + k); UNLOCK[k.slice(6)].price = v; }
  else if (/^star\d\./.test(k)) STARS[+k[4]][k.slice(6)] = v;
  else if (k in __C) { __C[k] = v; bPatch = true; }
  else throw new Error('unknown override ' + k);
}
function bPatchFn(name, pairs) {
  let s = eval(name).toString();
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error('patch ' + name + ': no "' + a + '"'); s = s.split(a).join(b); }
  eval(name + ' = (' + s + ')');
}
if (bPatch) {
  bPatchFn('addGuest', [['PATIENCE_EARLY', '__C.patienceEarly'], ['PATIENCE', '__C.patience'], ['G_SPEED *', '__C.gSpeed *']]);
  bPatchFn('updGuest', [['BATH_T', '__C.bathT'], ['SLEEP_T', '__C.sleepT']]);
  bPatchFn('zones', [['CLEAN_T', '__C.cleanT']]);
  bPatchFn('checkinT', [['CHECKIN_T', '__C.checkinT']]);
  bPatchFn('updStaff', [['MAID_CLEAN_T', '__C.maidCleanT'], ['const cap = porterCap(s);', 'const cap = bPorterCap(s);']]);
  bPatchFn('spawnGuests', [['guestRoomsOpen() + 3', 'guestRoomsOpen() + __C.spawnSlack']]);
}
function bPorterCap(s) { return bPatch ? __C.porterCarry + staffLv(s) - 1 : porterCap(s); }
// the ignore profile: the game's own arrow skips calls / the VIP / decor too
if (PROF.skip) { const bGT = guideTarget; guideTarget = o => bGT(Object.assign({ skip: PROF.skip }, o || {})); }
// the afkref profile: no price pads while it holds (the arrow skips them, so it plays the same inn the afk bot leaves)
if (PROF.hold) { const bGT = guideTarget; guideTarget = o => afkFrom !== null && t0() >= afkFrom && t0() < afkTo ? bGT(Object.assign({ skip: { pad: true } }, o || {})) : bGT(o); }
// ---------------------------------------------------------------- income by source (14.1 log, D1 / D2 / E3)
// v2.0.1: tea = guests' own cups at the urn (G3); callStaff = the tea runner's call tips (into the cash box, not active)
const INC = { room: 0, tip: 0, bath: 0, milk: 0, meal: 0, souv: 0, tea: 0, call: 0, callStaff: 0, vip: 0 };
let bEarnSrc = 'vip', bPickups = 0;
let bFeeK = null, bFeeV = 0;
{ const f0 = fee; fee = function (k, o) { const v = f0(k, o); INC[k] = (INC[k] || 0) + v; bFeeK = k; bFeeV = v; return v; }; }   // fees only ever land in a pile
// v2.2 (19.2): a full pile loses what doesn't fit - income is what landed (deposit right after its fee)
{ const d0 = deposit; deposit = function (id, v) { const a = d0(id, v); if (bFeeK && (v | 0) === bFeeV && a < bFeeV) INC[bFeeK] -= bFeeV - a; bFeeK = null; return a; }; }
{ const e0 = earn; earn = function (v, x, y) { INC[bEarnSrc] += Math.max(0, v | 0); return e0(v, x, y); }; }   // calls + VIP gifts
{ const s0 = serveCall; serveCall = function (gu, by) { bEarnSrc = 'call'; const p0 = S.piles.recep || 0; try { return s0(gu, by); } finally { if (by) INC.callStaff += Math.max(0, (S.piles.recep || 0) - p0); bEarnSrc = 'vip'; } }; }
let bPickT = -9;   // C5 counts pick-ups: piles taken within 1.5 s of each other are one pick-up (the coin-chain sound does the same)
const bCol = {}; let bEarnN = 0;   // F2: pick-ups per pile, money handed to you (a call served, a VIP gift)
{ const c0 = collect; collect = function (id) { if (S.stats.time - bPickT > 1.5) bPickups++; bPickT = S.stats.time; bCol[id] = (bCol[id] || 0) + 1; return c0(id); }; }
{ const e1 = earn; earn = function (v, x, y) { if ((v | 0) > 0) bEarnN++; return e1(v, x, y); }; }
const incSum = () => { let s = 0; for (const k in INC) s += INC[k]; return s; };
// v2.3 (19.3): every banner that goes up, by kind and time (the banner rate with 3-min days)
const bBanners = [];
{ const b0 = banner; banner = function (kind, id, o) { if (!BANNER_Q.some(x => x.kind === kind && x.id === id)) bBanners.push([S.stats.time, kind]); return b0(kind, id, o); }; }
const DT = 1 / 30;
const mmss = t => t === null || t === undefined || !Number.isFinite(t) ? '--' : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const t0 = () => S.stats.time;
newGame();
// ---------------------------------------------------------------- driver
const KNOWN = new Set(['desk', 'clean', 'basket', 'shelf', 'pad', 'pile', 'deliver', 'urn', 'milk', 'pass', 'stove', 'slot', 'vip', 'suite', 'tap', 'photo', 'stay', 'showto']);   // v2.1: a rare guest's wishes
const MOVING = new Set(['deliver', 'vip', 'photo', 'stay']);
const START = { kind: 'start', tx: 17, ty: 24, key: 'start', here: false };   // before the first steps: walk up into the lobby (the hand hint)
const bUnreachAt = [];
let bPath = [], bKey = '', bThink = 0, bMode = 'follow', bEpisode = 0, bStuckT = 0, bLast = [P.x, P.y], bStuckN = 0, bRand = false, bCur = null, bTrack = 0, bUnreach = 0;
let afkFrom = null, afkTo = null;
const inv = {}, flag = (k, m) => { inv[k] = inv[k] || { n: 0, first: m }; inv[k].n++; };
let bStatueBad = 0, bVipWaitMax = 0, bTeaAt = null, bTeaBase = null;
function bRandomPath() {
  for (let k = 0; k < 200; k++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (walkable(tx, ty)) { const [sx, sy] = tileOf(P), p = findPath(sx, sy, tx, ty); if (p) return p; } }
  return [];
}
const afkNow = () => afkFrom !== null && t0() >= afkFrom && t0() < afkTo;
function bAdopt(g, force) {
  if (!g || g.here) { bPath = []; bKey = ''; bCur = g || null; return; }
  if (!KNOWN.has(g.kind) && g !== START) { flag('unknown-kind', mmss(t0()) + ' ' + g.kind); bPath = []; bKey = ''; bCur = null; return; }
  const k = g.key + '@' + g.tx + ',' + g.ty;
  if (k === bKey && bPath.length && !force) return;
  bKey = k; const [sx, sy] = tileOf(P), p = findPath(sx, sy, g.tx, g.ty);
  if (!p) { bUnreach++; if (bUnreachAt.length < 6) bUnreachAt.push(mmss(t0()) + ' ' + g.key + ' from ' + sx + ',' + sy); }
  bPath = p || [];
  if (!bCur || bCur.key !== g.key) arrNew(g);
  bCur = g;
}
// v2.1 core B: the shopper after star 5 also shops by itself, like a player with money in the purse would - a booth piece
// (outfit / uniform / hat / pet) once it holds 1.5x its price, a fireworks show once it holds 3x the show's price and the
// pad is there (the arrow points at a booth piece only once and never at the fireworks)
let bWantT = 0, bWantG = null;
function bWant() {
  if (PROFILE !== 'shopper' || fin === null || bMode !== 'follow') return null;
  if (bWantG && PADPOS.has(bWantG.id) && S.money >= padNeed(UNLOCK[bWantG.id])) return bWantG;
  bWantG = null; if (t0() < bWantT) return null; bWantT = t0() + 20;
  let best = null;
  for (const [id] of PADPOS) { const u = UNLOCK[id]; if (!(u.hat || u.pet || u.outfit || u.uniform || u.id === 'fw')) continue; const k = u.id === 'fw' ? 3 : 1.5;
    if (u.id === 'fw' && fwOn()) continue; if (S.money >= k * padNeed(u) && (!best || padNeed(u) < padNeed(best))) best = u; }
  if (best) bWantG = T_PAD(best);
  return bWantG;
}
const bRareT = [];   // rare guests' arrivals [time, id]
{ const r0 = rareArrive; rareArrive = function () { const r = r0(); if (r) bRareT.push([t0(), VIPG.id]); return r; }; }
function drive(dt) {
  if (PROF.hold && afkFrom === null && S.unlocked.recep && S.unlocked.maid1) { afkFrom = t0(); afkTo = afkFrom + PROF.hold; }
  if (PROF.afk) {
    if (afkFrom === null && S.unlocked.recep && S.unlocked.maid1) { afkFrom = t0(); afkTo = afkFrom + PROF.afk; }
    if (afkNow()) { botMove = null; bPath = []; bKey = ''; bCur = null; return; }
  }
  if (PROF.afk5) {   // v2.3: hands off from star 5 on
    if (afkFrom === null && fin !== null) { afkFrom = fin; afkTo = fin + PROF.afk5; }
    if (afkNow()) { botMove = null; bPath = []; bKey = ''; bCur = null; return; }
  }
  bEpisode -= dt;
  if (bEpisode <= 0) {
    bEpisode = 3 + Math.random() * 5;
    const was = bMode;
    bMode = Math.random() < PROF.distract ? (Math.random() < .5 ? 'wander' : 'idle') : 'follow';
    if (bMode !== was) { bPath = []; bKey = ''; bThink = 0; bRand = false; bCur = null; if (bMode === 'wander') bPath = bRandomPath(); }
  }
  bThink -= dt;
  const g = S.tut.moved ? bWant() || GUIDE : START;
  if (bThink <= 0 && bMode === 'follow') {
    bThink = PROF.react;
    // novice: 30 % of its decisions (one per reaction time) head somewhere random instead of where the arrow points
    if (PROF.ignore && Math.random() < PROF.ignore) { bRand = true; bPath = bRandomPath(); bKey = 'rand'; bCur = null; }
    else { bRand = false; bAdopt(g); }
  } else if (bMode === 'follow' && !bRand && bCur && MOVING.has(bCur.kind) && g && g.key === bCur.key && !g.here) {
    bTrack -= dt; if (bTrack <= 0) { bTrack = .25; if (g.tx !== bCur.tx || g.ty !== bCur.ty) bAdopt(g, true); }   // it moves: re-read every 0.25 s
  }
  if (bPath.length) {
    const [tx, ty] = bPath[0], cx = tx * 16 + 8, cy = ty * 16 + 8, dx = cx - P.x, dy = cy - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) bPath.shift();
    botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    if (Math.hypot(P.x - bLast[0], P.y - bLast[1]) < .2) { bStuckT += dt; if (bStuckT > 1.5) { bStuckN++; bStuckT = 0; bKey = ''; bThink = 0; bPath = []; } } else bStuckT = 0;
  } else { botMove = null; bStuckT = 0; }
  bLast = [P.x, P.y];
}
// ---------------------------------------------------------------- F2: did walking to the arrow really move something?
// Progress = something the innkeeper did: the pile pointed at picked up, a pour / purchase, a check-in at the desk,
// cleaning the room you stand in, the head towels, the tray, cooking / handing over, money handed to you (a call, a VIP
// gift), a decor swap, the VIP's state (only for the VIP's own kinds: its timers run on their own) - within 5 s of
// getting there (on its tile, or the arrow says "here") while the arrow still shows that target. Things that happen
// without you are left out (staff filling the counter, the net sweeping up some other pile while you stand there), so a
// target that moves nothing really fails. (A target done on the way - a pile the net picks up, a hand-over within reach -
// moves the arrow on first and is not an arrival.)
const VIPK = new Set(['vip', 'suite', 'tap', 'photo', 'stay', 'showto']);
function progSig(g) {
  let paid = 0; for (const k in S.paid) paid += S.paid[k];
  let cl = ''; for (const rm of ROOMS) if (inCleanZone(rm)) cl += rm.id + (RT[rm.id].cleanP || 0).toFixed(2) + S.rooms[rm.id];
  const f = Q[0], v = VIPG;
  return [g && g.kind === 'pile' ? bCol[g.id] || 0 : '', bEarnN, paid, Object.keys(S.unlocked).length, P.tray.join(','), P.towels, P.cookT > 0 ? 1 : 0, P.giveT > 0 ? 1 : 0, P.slot.n, P.slot.t > 0 ? 1 : 0,
    JSON.stringify(S.decor), P.atDesk && f ? f.id + ':' + (f.ck || 0).toFixed(2) : '', cl,
    v && g && VIPK.has(g.kind) ? v.st + v.wi + (v.greetT > 0 ? 'g' : '') + (v.actT > 0 ? 'a' : '') + (v.halt ? 'h' : '') : ''].join('|');
}
let arr = null;
const F2 = { n: 0, ok: 0, fail: {}, failAt: [] };
function arrNew(g) { arr = g && g !== START ? { key: g.key, kind: g.kind, id: g.id, tx: g.tx, ty: g.ty, sig: null, at: null, pc: g.kind === 'pile' ? bCol[g.id] || 0 : 0 } : null; }
function arrTick(t) {
  if (!arr) return;
  if (afkNow() || bMode !== 'follow' || bRand) { arr = null; return; }   // the bot walked off on its own: not the arrow's fault
  const g = GUIDE;
  if (arr.at === null) {
    if (!g || g.key !== arr.key) { if (!(g && g.here)) arr = null; return; }   // the arrow moved on first: not an arrival
    const [px, py] = tileOf(P);
    if (g.here || (px === arr.tx && py === arr.ty)) {
      arr.at = t; arr.sig = progSig(arr);
      // "here" = already doing it; a pile picked up as you step onto it (the arrow re-reads every 0.25 s) = done
      if (g.here || (arr.kind === 'pile' && (bCol[arr.id] || 0) !== arr.pc)) { F2.n++; F2.ok++; arr = null; return; }
    }
  }
  if (arr.at !== null) {
    if (progSig(arr) !== arr.sig || (g && g.here && g.key === arr.key)) { F2.n++; F2.ok++; arr = null; }   // moved something / now doing it
    else if (t - arr.at > 5) { F2.n++; F2.fail[arr.kind] = (F2.fail[arr.kind] || 0) + 1; if (F2.failAt.length < 8) F2.failAt.push(mmss(t) + ' ' + arr.key); arr = null; }
  }
}
// target switches of the drawn arrow (6: no jumping back and forth). A switch counts as a jump when the target it leaves
// moved nothing while it was shown (no progress, see progSig) - leaving a pile you just picked up on the way is not a jump.
// many = a 4th jump within 5 s; flip = A -> B -> A with B a jump.
const sw = [];
let swCur = null, swPrev = null, swMany = 0, swFlip = 0, swJumps = 0; const swManyAt = [];
const swPairs = {};
function swTick(t) {
  const g = GUIDE, k = g && !g.here ? g.key : null;
  if (!k || (swCur && k === swCur.key)) return;
  if (swCur) {
    const jump = progSig(swCur) === swCur.sig;
    if (jump) {
      swJumps++; sw.push(t); while (sw.length && sw[0] < t - 5) sw.shift();
      if (sw.length > 3) { swMany++; if (swManyAt.length < 8) swManyAt.push(mmss(t) + ' ' + swCur.key + '>' + k); }
      if (swPrev && swPrev.key === k) { swFlip++; const pk = swPrev.kind + '>' + swCur.kind; swPairs[pk] = (swPairs[pk] || 0) + 1; }
    }
    if (TRACE && t >= TRACE[0] && t <= TRACE[1]) console.log('   switch', mmss(t), (t % 1).toFixed(2), swCur.key, '->', k, '#' + g.rule, jump ? 'JUMP' : '');
  }
  swPrev = swCur; swCur = { key: k, kind: g.kind, id: g.id, sig: progSig(g) };
}
// ---------------------------------------------------------------- 14.3 invariants, every second
const recs = [];                 // one per second: { t, k, h, r, b, m, st, inc, buy, nw }
let lastHearts = 0, nextMenu = 300, menus = 0, vipStT = 0, vipStK = '', firstCombo = null, comboRooms5 = null, recepAt = null, base = null;
let fin = null, lastNews = 0, lastInc = Object.assign({}, INC), lastUnl = new Set(Object.keys(S.unlocked)), padsMax = 0, shopPadsMax = 0, noBuyS = 0;
const starT = {};
function menuCheck(t) {   // 14.3: the menu stops time played and the clock; every page renders
  if (state !== 'play') return;
  openMenu(); const snap = () => S.stats.time + '|' + S.clock + '|' + S.money + '|' + S.stats.guests, a = snap();
  for (let k = 0; k < 30; k++) { update(DT); if (k % 6 === 0) { MENU.page = ['home', 'sound', 'book', 'bought', 'inn'][(k / 6) % 5]; try { render(); } catch (e) { flag('menu-render', String(e && e.message || e)); } } }
  if (snap() !== a) flag('menu-not-paused', mmss(t)); menus++;
  closeMenu(); if (state !== 'play') flag('menu-close', mmss(t) + ' ' + state);
}
function checkSecond() {
  const t = t0();
  if (!Number.isFinite(S.money) || S.money < 0 || S.money !== Math.floor(S.money)) flag('money', mmss(t) + ' ' + S.money);
  const perRoom = {}, perSlot = {};
  for (const gu of GUESTS) {
    if (gu.room) perRoom[gu.room] = (perRoom[gu.room] || 0) + 1;
    if (gu.slot >= 0) perSlot[gu.slot] = (perSlot[gu.slot] || 0) + 1;
    if (gu.t > 180 && gu.st !== 'sleep' && gu.st !== 'bathing' && gu.st !== 'eat') flag('stuck-guest', mmss(t) + ' ' + gu.st + ' ' + R(gu.t) + 's at ' + R(gu.x) + ',' + R(gu.y));
    if (!Number.isFinite(gu.x) || !Number.isFinite(gu.y)) flag('guest-nan', mmss(t));
    if ((gu.st === 'toSeat' || gu.st === 'seated' || gu.st === 'eat') && (gu.seat < 0 || SEAT_OCC[gu.seat] !== gu)) flag('seat-lost', mmss(t) + ' ' + gu.st);
    if (gu.mate && gu.mate.mode === 'follow' && dist(gu.x, gu.y, gu.mate.x, gu.mate.y) > 200) flag('follower-far', mmss(t) + ' ' + gu.st + ' ' + R(dist(gu.x, gu.y, gu.mate.x, gu.mate.y)));
    if (gu.call && !(gu.call.t > 0 && gu.call.t <= gu.call.max)) flag('call-time', mmss(t) + ' ' + gu.call.t);
    if (gu.vip) flag('vip-in-guests', mmss(t));
  }
  if (P.tray.length > trayCap() || P.tray.some(k => !TRAY_KINDS.includes(k)) || countK(P.tray, 'kaiseki') > 1) flag('tray', mmss(t) + ' ' + P.tray.join(','));
  if (callCount() > callMax()) flag('calls>max', mmss(t) + ' ' + callCount());
  for (let i = 0; i < SEAT_OCC.length; i++) { const o = SEAT_OCC[i]; if (o && (!GUESTS.includes(o) || (o.seat !== i && o.seat2 !== i))) flag('seat-leak', mmss(t) + ' seat ' + i); }
  if (!(PASS.n >= 0 && PASS.n <= PASS_MAX && PASS.n === Math.floor(PASS.n))) flag('pass', mmss(t) + ' ' + PASS.n);
  for (const s of STAFF) if (s.tray.length > WAITER_CARRY) flag('waiter-tray', mmss(t) + ' ' + s.id + ' ' + s.tray.length);
  for (const k in perRoom) if (perRoom[k] > 1) flag('room-shared', mmss(t) + ' ' + k);
  for (const k in perSlot) if (perSlot[k] > 1) flag('slot-shared', mmss(t) + ' ' + k);
  for (let i = 0; i < SLOT_OCC.length; i++) if (SLOT_OCC[i] && !GUESTS.includes(SLOT_OCC[i])) flag('slot-leak', mmss(t) + ' slot ' + i);
  for (const rm of ROOMS) if (RT[rm.id].guest && !GUESTS.includes(RT[rm.id].guest) && RT[rm.id].guest !== VIPG) flag('room-leak', mmss(t) + ' ' + rm.id);
  for (const k in S.decor) { const [rid] = k.split(':'); if (!S.unlocked[S.decor[k]] || !UNLOCK[S.decor[k]].decor || !roomOpen(ROOM[rid]) || ROOM[rid].vip) flag('decor', mmss(t) + ' ' + k + '=' + S.decor[k]); }
  if (VIPG) {
    const v = VIPG, k = v.st + ':' + v.wi; if (k !== vipStK) { vipStK = k; vipStT = t; }
    if (t - vipStT > 300 && v.st !== 'seated') flag('vip-state>300s', mmss(t) + ' ' + v.st);   // v2.0.1 G1: a seated wish never runs out
    if (v.st === 'seated') bVipWaitMax = Math.max(bVipWaitMax, t - vipStT);
    if (v.st === 'follow' && !v.halt && dist(P.x, P.y, v.x, v.y) > 200) flag('vip-far', mmss(t) + ' ' + R(dist(P.x, P.y, v.x, v.y)));
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) flag('vip-nan', mmss(t));
    const [tx, ty] = tileOf(v), a = areaAt(tx, ty);
    if (v.y < MAPH && a && !areaOpen(a)) flag('vip-locked-area', mmss(t) + ' ' + v.st);
    if (v.y < MAPH && !v.moving && BLOCK[ty * MW + tx] && v.st !== 'soak') flag('vip-on-block', mmss(t) + ' ' + v.st + ' ' + tx + ',' + ty);
    if (v.suite && RT[v.suite].guest !== v && v.st !== 'leave') flag('vip-suite', mmss(t) + ' ' + v.st);
  } else vipStK = '';
  for (const rm of SUITES) { const o = RT[rm.id].guest; if (o && o !== VIPG) flag('suite-not-vip', mmss(t) + ' ' + rm.id); }
  if (GUIDE && !KNOWN.has(GUIDE.kind)) flag('unknown-kind', mmss(t) + ' ' + GUIDE.kind);
  if (firstCombo === null && Object.keys(S.combos).length) firstCombo = t;
  if (S.basket < 0 || S.basket > BASKET_MAX || S.basket !== Math.floor(S.basket)) flag('basket', mmss(t) + ' ' + S.basket);
  if (boxHit(P.x, P.y)) flag('player-in-wall', mmss(t) + ' ' + R(P.x) + ',' + R(P.y));
  { const [tx, ty] = tileOf(P), a = areaAt(tx, ty); if (P.y < MAPH && a && !areaOpen(a)) flag('player-locked-area', mmss(t) + ' ' + tx + ',' + ty); }
  if (!Number.isFinite(S.hearts) || S.hearts < 0 || S.hearts !== Math.floor(S.hearts)) flag('hearts', mmss(t) + ' ' + S.hearts);
  if (S.hearts < lastHearts) flag('hearts-drop', mmss(t) + ' ' + lastHearts + ' -> ' + S.hearts); lastHearts = S.hearts;
  for (const k in S.piles) if (!Number.isFinite(S.piles[k]) || S.piles[k] < 0 || S.piles[k] !== Math.floor(S.piles[k])) flag('pile', k + ' ' + S.piles[k]);
  if (star() < S.peak) flag('star<peak', mmss(t));
  const prog = [...PADPOS.keys()].filter(id => !UNLOCK[id].decor && !UNLOCK[id].booth && !UNLOCK[id].goldOf && !UNLOCK[id].extra).length;   // v2.1: the shrine / garden / plaza pads are extras, one in each place
  if (prog > PAD_MAX) flag('pads>4', mmss(t) + ' ' + [...PADPOS.keys()].join(','));
  // H1 (3.5.5): price pads fully on screen <= 4, the shop's own ones counted apart
  { let n = 0, ns = 0; for (const [id, xy] of PADPOS) { const x = xy[0] * TILE - cam.x, y = xy[1] * TILE - cam.y; if (x >= 0 && x + TILE <= W && y >= 0 && y + TILE <= H) { if (UNLOCK[id].area === 'shop' || UNLOCK[id].booth || UNLOCK[id].decor) ns++; else n++; } }
    padsMax = Math.max(padsMax, n); shopPadsMax = Math.max(shopPadsMax, ns); if (n > 4) flag('pads-on-screen>4', mmss(t) + ' ' + n); if (ns > 6) flag('shop-pads-on-screen>6', mmss(t) + ' ' + ns); }   // v2.1: the boutique has six (hat, pet, outfit, uniform, two decor), no names floating
  for (const [id, xy] of PADPOS) if (!findPath(DESK_SPOT[0], DESK_SPOT[1], xy[0], xy[1])) flag('pad-unreachable', mmss(t) + ' ' + id);
  if (fin !== null && !PADPOS.size) { noBuyS++; flag('nothing-to-buy', mmss(t)); }   // G4: after star 5 there is always something (the statue)
  for (const e of GUESTS.concat(STAFF)) {
    const [tx, ty] = tileOf(e), a = areaAt(tx, ty);
    if (e.y < MAPH && a && !areaOpen(a)) flag('in-locked-area', mmss(t) + ' ' + (e.st || e.role) + ' ' + tx + ',' + ty);
    if (e.y < MAPH && !e.moving && BLOCK[ty * MW + tx] && e.st !== 'bathing') flag('on-block', mmss(t) + ' ' + (e.st || e.role) + ' ' + tx + ',' + ty);
  }
  if (GUIDE && !GUIDE.here) { const [sx, sy] = tileOf(P); if (!findPath(sx, sy, GUIDE.tx, GUIDE.ty)) flag('guide-unreachable', mmss(t) + ' ' + GUIDE.kind + ' ' + GUIDE.tx + ',' + GUIDE.ty); }
  // the statue only once every hat / pet is bought and >= 50,000 on hand (END-1); two checks in a row, since the arrow
  // re-picks every 0.25 s and a pour empties the wallet in a frame
  bStatueBad = GUIDE && GUIDE.id === 'statue' && (S.money < 50000 || UNLOCKS.some(u => (u.hat || u.pet) && !S.unlocked[u.id])) ? bStatueBad + 1 : 0;
  if (bStatueBad >= 2) flag('guide-statue', mmss(t));
  if (GUIDE && PROF.skip && (['deliver', 'urn', 'milk', 'vip', 'suite', 'tap', 'photo', 'slot'].includes(GUIDE.kind) && !(GUIDE.kind === 'deliver' && GUIDE.item === 'rice') || (GUIDE.kind === 'pad' && UNLOCK[GUIDE.id].decor))) flag('ignore-pointed', mmss(t) + ' ' + GUIDE.key);
  for (const k of ['hat', 'pet']) { const id = S.equip[k]; if (id !== null && !(S.unlocked[id] && UNLOCK[id][k])) flag('equip', mmss(t) + ' ' + k + '=' + id); }
  if (!(S.clock >= 0 && S.clock < 1) || !Number.isInteger(S.day) || S.day < 1) flag('clock', mmss(t) + ' ' + S.clock + ' day ' + S.day);
  for (const k of ['g', 'h', 'best']) if (!Number.isInteger(S.dayLog[k]) || S.dayLog[k] < 0) flag('daylog', mmss(t) + ' ' + k + '=' + S.dayLog[k]);
  for (const k in S.staff) if (!Number.isInteger(S.staff[k]) || S.staff[k] < 0) flag('staff-xp', mmss(t) + ' ' + k + '=' + S.staff[k]);
  for (const s of STAFF) if (s.role === 'porter' && (s.carry < 0 || s.carry > bPorterCap(s))) flag('porter-carry', mmss(t) + ' ' + s.carry);
  if (PET && dist(P.x, P.y, PET.x, PET.y) > 200) flag('pet-far', mmss(t) + ' ' + R(dist(P.x, P.y, PET.x, PET.y)));
  if (goldStars() > 5 || (star() < 5 && goldStars() > 0)) flag('gold', mmss(t) + ' ' + goldStars());
  { const rk = rankOf(S.hearts); if (rk < 1 || rk > 10) flag('rank', mmss(t) + ' ' + rk); }
  if (LINE && !(LINE.e === P || GUESTS.includes(LINE.e) || GUESTS.some(gu => gu.mate === LINE.e) || STAFF.includes(LINE.e) || LINE.e === VIPG || LINE.e === PET)) flag('line-speaker', mmss(t) + ' ' + LINE.id);
  try { render(); } catch (e) { flag('render', String(e && e.message || e)); }
  if (LIGHT_N > LIGHT_MAX) flag('lights>16', mmss(t) + ' ' + LIGHT_N);
  if (t >= nextMenu) { nextMenu += 300; menuCheck(t); }
}
// ---------------------------------------------------------------- run
const steps = Math.round(MAXMIN * 60 / DT);
let lastSec = -1, bMaxActive = 0, bActive = 0, lastEarned = 0, goldAt5 = 0, lastGold = 0, bAt5 = null;
const goldT = {};
for (let i = 0; i < steps * 10; i++) {
  drive(DT);
  update(DT);
  if (state === 'celebrate') { S.done = true; go('play'); } if (state === 'card') modalClose();
  const t = t0();
  if (S.unlocked.recep && recepAt === null) { recepAt = t; base = { g: S.stats.guests, a: S.stats.angry }; }
  if (S.unlocked.teaboy && bTeaAt === null) { bTeaAt = t; bTeaBase = { made: RUN.calls, staff: RUN.callsStaff, self: RUN.callsSelf, missed: RUN.callsMissed, served: S.stats.calls }; }
  arrTick(t); swTick(t);
  if (S.earned > lastEarned) { lastEarned = S.earned; bActive = 0; } else if (bMode === 'follow' && !bRand && !afkNow() && fin === null) { bActive += DT; bMaxActive = Math.max(bMaxActive, bActive); }
  if (Math.floor(t) !== lastSec) {
    lastSec = Math.floor(t);
    checkSecond();
    for (let s = 2; s <= star(); s++) if (starT[s] === undefined) starT[s] = t;
    const g = GUIDE, inc = {}; let any = false;
    for (const k in INC) if (INC[k] !== lastInc[k]) { inc[k] = INC[k] - lastInc[k]; any = true; }
    lastInc = Object.assign({}, INC);
    const buy = Object.keys(S.unlocked).filter(id => !lastUnl.has(id)); buy.forEach(id => lastUnl.add(id));
    const nw = RUN.news.length > lastNews ? RUN.news.slice(lastNews).map(n => n[1]) : []; lastNews = RUN.news.length;
    const rec = { t: R(t), k: g ? g.kind : null, h: g ? g.here : false, r: g ? g.rule : 0, b: P.pouring ? 'pour' : g && g.here ? 'work' : P.moving ? 'walk' : 'stand',
      m: afkNow() ? 'a' : bMode === 'follow' ? (bRand ? 'r' : 'f') : bMode[0], st: star(), $: S.money, inc: any ? inc : null, buy: buy.length ? buy : null, nw: nw.length ? nw : null,
      pk: bPickups, fed: S.stats.diners, hu: RUN.hungry, tm: S.tut.moved ? 1 : 0 };
    recs.push(rec);
    if (TRACE && t >= TRACE[0] && t <= TRACE[1]) console.log(mmss(t), (g ? g.kind + (g.here ? '*' : '') + '#' + g.rule : '-').padEnd(10), 'P' + tileOf(P), '$' + S.money, rec.b, rec.m, 'piles', JSON.stringify(S.piles).replace(/"/g, ''), 'Q' + Q.length, 'tray', P.tray.join(',') || '-', g ? g.key : '');
  }
  if (star() >= 5 && fin === null) { fin = t; goldAt5 = goldStars(); comboRooms5 = GUEST_ROOMS.filter(rm => roomOpen(rm) && roomCombo(rm)).length; bAt5 = { g: S.stats.guests, a: S.stats.angry, day: S.day }; if (!POST) break; }
  if (fin !== null) { const gs = goldStars(); if (gs > lastGold) { for (let k = lastGold + 1; k <= gs; k++) goldT[k] = t; lastGold = gs; } if (t - fin >= POST * 60) break; }
  if (SNAP && fin !== null && t - fin >= bSnapN * SNAP_EVERY) { require('fs').writeFileSync(SNAP + '/snap_' + bSnapN * SNAP_EVERY / 60 + '.json', JSON.stringify(Object.assign({}, S, { _P: [R(P.x), R(P.y)] }))); bSnapN++; }   // v2.1: the save every 15 min after star 5 (screenshot timelines)
  if (fin === null && t >= MAXMIN * 60) break;
}
if (LOGF) require('fs').writeFileSync(LOGF, recs.map(r => JSON.stringify(r)).join('\n') + '\n');
// ---------------------------------------------------------------- 14.2 metrics
const med = a => { const b = a.filter(Number.isFinite).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const pct = (a, p) => { const b = a.filter(Number.isFinite).sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(b.length * p))] : null; };
const r2 = x => x === null || x === undefined || !Number.isFinite(x) ? null : Math.round(x * 100) / 100;
const end = fin !== null ? fin : t0();
const pre = recs.filter(r => r.t <= end), between = (a, b) => pre.filter(r => r.t >= a && r.t < b);
const ACTIVE = new Set(['deliver', 'urn', 'milk', 'pass', 'stove', 'vip', 'suite', 'tap', 'photo', 'slot', 'stay', 'showto']);
const share = (rs, f) => rs.length ? rs.filter(f).length / rs.length : null;
// the arrow's mix (C1-C4) counts the seconds the bot follows it (stage 4): not the afk minutes, and not the casual / novice
// seconds spent idle, wandering or on a random walk - the arrow keeps showing its target then, which only measured the bot
const arrowRecs = rs => rs.filter(r => r.m === 'f' && r.tm);
// purchases: every unlock in time order (afk: the hands-off stretch is not a gap)
const unlockT = {}; for (const r of recs) if (r.buy) for (const id of r.buy) unlockT[id] = r.t;
const buys = Object.entries(unlockT).filter(([id, t]) => t <= end && !UNLOCK[id].booth).sort((a, b) => a[1] - b[1]);
const gapsFrom = (ts, from) => { const g = []; let p = from; for (const t of ts) { let d = t - p; if (afkFrom !== null && p < afkTo && t > afkFrom) d -= Math.min(t, afkTo) - Math.max(p, afkFrom); g.push(d); p = t; } return g; };
const t2 = starT[2], t3 = starT[3], t4 = starT[4];
const gaps25 = t2 !== undefined ? gapsFrom(buys.filter(([, t]) => t > t2).map(b => b[1]), t2) : [];
const gaps5m = gapsFrom(buys.filter(([, t]) => t <= 300).map(b => b[1]), 0);
// B3: the longest wait between two "new things" before star 5
const B3K = ['buy', 'first', 'vip', 'combo', 'rank', 'level', 'area'];
const nt = RUN.news.filter(n => B3K.includes(n[1]) && n[0] <= end).map(n => n[0]);
let b3 = 0, b3At = 0; { const g = gapsFrom(nt.slice(1), nt[0] || 0); g.forEach((d, i) => { if (d > b3) { b3 = d; b3At = nt[i]; } }); }   // afk: minus the hands-off minutes
// C1: "go pick up fish" per 3-min window from star 2 + 3 min
const c1w = [];
// v2.2 (18.2): a window counts only with >= 90 s of following the arrow in it (the afk bot's first window back from its
// hands-off minutes held 48 s - the full piles it came back to; a partial window measured the return, not the mix)
if (t2 !== undefined) for (let a = t2 + 180; a + 180 <= end; a += 180) { const w = arrowRecs(between(a, a + 180)); if (w.length >= 90) c1w.push(share(w, r => r.k === 'pile' && !r.h)); }
// C3: the most common single kind after 5 min (here counted as its kind)
const c3n = {}, c3rs = arrowRecs(between(300, end)); for (const r of c3rs) if (r.k) c3n[r.k] = (c3n[r.k] || 0) + 1;
const c3k = Object.keys(c3n).sort((a, b) => c3n[b] - c3n[a])[0] || null;
// D: income generated (fees into piles + calls + VIP gifts), active = calls + VIP
const incOf = rs => { const o = {}; for (const r of rs) if (r.inc) for (const k in r.inc) o[k] = (o[k] || 0) + r.inc[k]; return o; };
const tot = o => Object.values(o).reduce((a, b) => a + b, 0), act = o => (o.call || 0) + (o.vip || 0);
const actShare = (a, b) => { if (a === undefined || b === undefined) return null; const o = incOf(recs.filter(r => r.t >= a && r.t < b)); return tot(o) ? act(o) / tot(o) : null; };
const post = fin !== null ? recs.filter(r => r.t > fin && r.t <= fin + Math.min(POST, 5) * 60) : [];
const inc30 = []; for (const r of recs) { const i = Math.floor(r.t / 30); inc30[i] = (inc30[i] || 0) + (r.inc ? tot(r.inc) : 0); }
for (let i = 0; i < inc30.length; i++) inc30[i] = inc30[i] || 0;
// E2: breakfast missed before the chef / with two waiters
const dineRate = (a, b) => { if (a === undefined) return null; const rs = recs.filter(r => r.t >= a && r.t <= (b === undefined ? end : Math.min(b, end))); if (rs.length < 2) return null; const f = rs[rs.length - 1].fed - rs[0].fed, h = rs[rs.length - 1].hu - rs[0].hu; return f + h ? h / (f + h) : null; };
const ga = base ? (bAt5 ? bAt5.g : S.stats.guests) - base.g : 0, aa = base ? (bAt5 ? bAt5.a : S.stats.angry) - base.a : 0;   // v2.3: up to star 5 (eager now plays 15 min of big rushes after it)
const preInc = incOf(pre), shopBuys = fin !== null ? RUN.shop.map(([t, id]) => [t - fin, id]) : [];
const hour = shopBuys.filter(([t]) => t <= 3600); let sg = 0; const shopGaps = []; for (const [t] of hour) { shopGaps.push(t - sg); sg = t; }
const firstHat = shopBuys.find(([, id]) => UNLOCK[id].hat);
const M = {
  A1: { s2: starT[2] ?? null, s3: starT[3] ?? null, s4: starT[4] ?? null, s5: fin },
  B1: { med: med(gaps25), p90: pct(gaps25, .9), max: gaps25.length ? Math.max(...gaps25) : null, first5max: gaps5m.length ? Math.max(...gaps5m) : null },
  B3: { max: R(b3), at: R(b3At) },
  C1: { max: r2(c1w.length ? Math.max(...c1w) : null), windows: c1w.map(r2) },
  C2: r2(t3 !== undefined ? share(arrowRecs(between(t3, end)), r => ACTIVE.has(r.k)) : null),
  C3: { kind: c3k, share: r2(c3k ? c3n[c3k] / c3rs.length : null) },
  C4: r2(share(arrowRecs(pre), r => !r.k)),
  C5: t3 !== undefined && end > t3 && pre.length ? r2((pre[pre.length - 1].pk - (recs.find(r => r.t >= t3) || { pk: 0 }).pk) / ((end - t3) / 60)) : null,
  D1: { s3: r2(actShare(t3, t4)), s4: r2(actShare(t4, fin === null ? undefined : fin)), s5: r2(post.length ? act(incOf(post)) / Math.max(1, tot(incOf(post))) : null) },
  D2: post.length >= 60 ? R(tot(incOf(post)) / (post.length / 60)) : null,
  // E1 (v2.0.1 G3): calls are the tea runner's job once it is hired - done = brought (by anyone) / (brought + timed out)
  // among the calls since then (a call that ended because the guest got it by itself counts neither way); before the
  // hire they are an optional tip the arrow never points at (pre = the innkeeper's share of those)
  E1: (() => { const b = bTeaBase || { made: RUN.calls, staff: RUN.callsStaff, self: RUN.callsSelf, missed: RUN.callsMissed, served: S.stats.calls }, sv = S.stats.calls - b.served, ms = RUN.callsMissed - b.missed;
    return { done: bTeaAt === null ? null : r2(sv / Math.max(1, sv + ms)), staff: RUN.callsStaff, self: RUN.callsSelf, hireAt: bTeaAt === null ? null : R(bTeaAt), pre: r2(b.served / Math.max(1, b.made)),
      fast: r2(S.stats.callsFast / Math.max(1, S.stats.calls)), made: RUN.calls, served: S.stats.calls, missed: RUN.callsMissed }; })(),
  E2: { noChef: r2(dineRate(unlockT.dining, unlockT.chef)), twoWaiters: r2(dineRate(unlockT.waiter2)) },
  E3: { used: r2(med(RUN.vipUsed)), f: r2(med(RUN.vipF)), share: r2((preInc.vip || 0) / Math.max(1, tot(preInc))), came: RUN.vips, done: RUN.vipDone, left: RUN.vipLeft, waitMax: R(bVipWaitMax) },
  E4: { firstCombo, rooms5: comboRooms5 },
  E5: r2(ga + aa ? aa / (ga + aa) : 0),
  F1: r2(RUN.lineLog.filter(l => l[0] <= end).length / Math.max(1, end / 60)),
  F2: { ok: r2(F2.n ? F2.ok / F2.n : null), n: F2.n, fail: F2.fail, failAt: F2.failAt, jumps: swJumps, many: swMany, manyAt: swManyAt, flip: swFlip, flips: swPairs, unreach: bUnreach, unreachAt: bUnreachAt },
  G: fin !== null && POST >= 60 ? { firstHat: firstHat ? R(firstHat[0]) : null, hour: hour.length, gapMed: R(med(shopGaps) || 0), gapMax: shopGaps.length ? R(Math.max(...shopGaps)) : null,
    gold: Object.fromEntries(Object.entries(goldT).map(([k, t]) => [k, R(t - fin)])), goldAt5, v21: bV21() } : null,
  G4: fin !== null ? noBuyS : null,
  H1: { max: padsMax, shop: shopPadsMax },
  // v2.2 (19.2): the evening summaries' reputation (stars) up to star 5 (+ the shopper's later days), the guests' own
  // ratings, rushes seen, fish lost to full piles
  REP: { med: med((RUN.repDays || []).slice(0, (RUN.repDays || []).length)), days: (RUN.repDays || []).length, mean: RUN.rates ? r2(RUN.rateSum / RUN.rates / 10) : null, rushes: RUN.rushes || 0, lost: RUN.capLost || 0, pen: RUN.ratePen || null, n: RUN.rates || 0 },
  // v2.3 (19.3): the star-5 rushes - their ratings, how many were great, the extras made / brought / missed; the day of
  // star 5; banners a minute (every banner put up, before / after star 5) and by kind after it
  REP5: { list: RUN.rush5 || [], med: med(RUN.rush5 || []), min: (RUN.rush5 || []).length ? Math.min(...RUN.rush5) : null, n: RUN.rushes5 || 0, great: RUN.rushGreat || 0,
    exMade: RUN.exMade || 0, exServed: RUN.exServed || 0, exMissed: RUN.exMissed || 0, kinds: RUN.exKinds || {}, miss: RUN.exMiss || {}, day5: bAt5 ? bAt5.day : null },
  BAN: (() => { const pre = bBanners.filter(b => fin === null || b[0] <= fin), post = fin !== null ? bBanners.filter(b => b[0] > fin) : [], kinds = {}, kindsPre = {};
    for (const b of post) kinds[b[1]] = (kinds[b[1]] || 0) + 1;
    for (const b of pre) kindsPre[b[1]] = (kindsPre[b[1]] || 0) + 1;
    return { pre: r2(pre.length / Math.max(1, (fin === null ? t0() : fin) / 60)), post: fin !== null && t0() - fin > 60 ? r2(post.length / ((t0() - fin) / 60)) : null, kinds, kindsPre }; })(),
};
// v2.1 core B (14.2 G5-G8): every endless purchase after star 5 (boutique + shrine / garden / plaza / wardrobe + fireworks)
function bV21() {
  const post = POST * 60, endless = Object.entries(unlockT).filter(([id, t]) => t > fin && (UNLOCK[id].booth || UNLOCK[id].v21b)).map(([id, t]) => [t - fin, id]);
  const fwT = RUN.news.filter(n => n[1] === 'fw' && n[0] > fin).map(n => [n[0] - fin, 'fw']);
  const all = endless.concat(fwT).sort((a, b) => a[0] - b[0]), ts = all.map(a => a[0]);
  const gaps = []; let p = 0; for (const t of ts) { gaps.push(t - p); p = t; } gaps.push(Math.min(post, t0() - fin) - p);   // the tail: since the last purchase
  const inH = (a, b) => all.filter(x => x[0] > a && x[0] <= b).length, incH = (a, b) => tot(incOf(recs.filter(r => r.t > fin + a && r.t <= fin + b))) / ((b - a) / 60);
  const gz = endless.filter(([, id]) => UNLOCK[id].gz).map(e => e[0]), rr = bRareT.filter(([t]) => t > fin);
  return { h1: inH(0, 3600), h2: inH(3600, 7200), gapMed: R(med(gaps) || 0), gapMax: R(Math.max(...gaps)), n: all.length,
    firstGz: gz.length ? R(gz[0]) : null, firstRare: rr.length && gz.length ? R(rr[0][0] - fin - gz[0]) : null, rares: rr.length, rareKinds: Object.keys(S.rare).length, rareIds: Object.keys(S.rare),
    shrine: shrineLv(), plaza: unlockT.plaza !== undefined ? R(unlockT.plaza - fin) : null, fw: (S.fw && S.fw.n) | 0, stall: RUN.stall | 0,
    inc1: R(incH(0, 3600)), inc2: R(incH(3600, 7200)), money: S.money, order: all.map(([t, id]) => mmss(t) + ' ' + id) };
}
const out = { profile: PROFILE, cfg: CFGNAME, set: ARG('set') || '', fin, end: R(t0()), post: POST, unlockT, inc: INC, incPre: preInc, inc30,
  afk: afkFrom !== null ? { from: R(afkFrom), to: R(afkTo), inc: tot(incOf(recs.filter(r => r.t >= afkFrom && r.t < afkTo))) } : null,
  M, inv, stuckN: bStuckN, maxActive: R(bMaxActive), guests: S.stats.guests, angry: S.stats.angry, menus, hearts: S.hearts,
  // v2.1 core A (16.1-16.5): festivals held / all lit, the reporters' stars, the yearly awards, mom's visits, seasonal combos
  v21: { fests: RUN.news.filter(n => n[1] === 'fest').length, festOk: RUN.news.filter(n => n[1] === 'festok').length, press: S.covers.map(c => c.n + (c.tv ? 't' : '')),
    awards: S.awards.map(a => a.y + a.k + '♥' + a.h), yearH: S.hearts - S.year.h, mom: S.mom, seasonal: COMBOS.filter(c => c.season !== undefined && S.combos[c.id]).length } };
if (JSONOUT) console.log(JSON.stringify(out));
else {
  const T = (ok, s) => (ok === null || ok === undefined ? '-- ' : ok ? 'ok ' : 'NO ') + s;
  const order = Object.entries(unlockT).sort((a, b) => a[1] - b[1]);
  console.log(`${PROFILE}${CFGNAME !== 'base' || ARG('set') ? '[' + CFGNAME + (ARG('set') ? ' ' + ARG('set') : '') + ']' : ''} ★5 ${fin !== null ? mmss(fin) : 'NOT REACHED (' + mmss(t0()) + ', ' + Object.keys(S.unlocked).length + ' unlocked)'} | ★2 ${mmss(M.A1.s2)} ★3 ${mmss(M.A1.s3)} ★4 ${mmss(M.A1.s4)} | angry ${(M.E5 * 100).toFixed(1)}% | stuck ${bStuckN} | menus ${menus} | inv ${Object.keys(inv).length ? 'FAIL' : 'OK'}`);
  console.log('  ' + order.map(([id, t]) => mmss(t) + ' ' + id).join(', '));
  console.log(`  B1 gaps ★2→★5 med ${R(M.B1.med)} p90 ${R(M.B1.p90)} max ${R(M.B1.max)} s, first 5 min max ${R(M.B1.first5max)} s | B3 ${M.B3.max}s@${mmss(M.B3.at)} | no-earn (following) max ${R(bMaxActive)} s`);
  console.log(`  C1 pile ${M.C1.max} [${M.C1.windows.join(' ')}] | C2 active ${M.C2} | C3 ${M.C3.kind} ${M.C3.share} | C4 null ${M.C4} | C5 pickups/min ${M.C5}`);
  console.log(`  D1 active income ★3 ${M.D1.s3} ★4 ${M.D1.s4} ★5 ${M.D1.s5} | D2 ★5 income/min ${M.D2} | income pre-★5 ${JSON.stringify(preInc)}`);
  console.log(`  E1 calls ${M.E1.made} made, ${M.E1.served} served (${M.E1.fast} fast), ${M.E1.missed} missed = ${M.E1.done} | E2 hungry no-chef ${M.E2.noChef} 2-waiters ${M.E2.twoWaiters} | E3 VIP ${M.E3.came} came ${M.E3.done} done ${M.E3.left} left, med ${M.E3.used}s f ${M.E3.f}, ${M.E3.share} of income | E4 first combo ${mmss(firstCombo)}, combo rooms at ★5 ${comboRooms5}`);
  console.log(`  REP days ${M.REP.days} med ${M.REP.med} (guests' mean ${M.REP.mean}) | rushes ${M.REP.rushes} | fish lost to full piles ${M.REP.lost} | penalties ${JSON.stringify(M.REP.pen)} over ${M.REP.n} guests`);
  console.log(`  REP5 ★5 on day ${M.REP5.day5} | big rushes ${M.REP5.n}: ${M.REP5.list.join(' ')} (great ${M.REP5.great}) | extras ${M.REP5.exMade} made, ${M.REP5.exServed} brought, ${M.REP5.exMissed} missed ${JSON.stringify(M.REP5.kinds)} missed ${JSON.stringify(M.REP5.miss)} | banners/min before ★5 ${M.BAN.pre}, after ${M.BAN.post} ${JSON.stringify(M.BAN.kinds)} | before ★5 ${JSON.stringify(M.BAN.kindsPre)}`);
  console.log(`  F1 lines/min ${M.F1} | F2 arrivals ${M.F2.n} ok ${M.F2.ok} fail ${JSON.stringify(M.F2.fail)} ${M.F2.failAt.join(' / ')} | jumps ${swJumps}: >3 in 5 s ${swMany} ${swManyAt.join(' / ')}, A-B-A ${swFlip} ${JSON.stringify(swPairs)} | unreachable ${bUnreach} ${bUnreachAt.join(' / ')} | H1 pads on screen ${padsMax} (shop ${shopPadsMax})`);
  if (afkFrom !== null) console.log(`  afk ${mmss(afkFrom)}-${mmss(afkTo)}: income ${out.afk.inc}`);
  console.log(`  v2.1: festivals ${out.v21.festOk}/${out.v21.fests} all lit | press ${out.v21.press.join(' ') || '-'} | awards ${out.v21.awards.join(' ') || '-'} (this year so far ♥${out.v21.yearH}) | mom ${out.v21.mom} | seasonal combos ${out.v21.seasonal}`);
  if (M.G && M.G.v21) { const v = M.G.v21; console.log(`  v2.1: ${v.n} endless buys (hour 1 ${v.h1}, hour 2 ${v.h2}), gap med ${mmss(v.gapMed)} max ${mmss(v.gapMax)} | first garden piece ${mmss(v.firstGz)}, its guest ${mmss(v.firstRare)} later, rare guests ${v.rares} (${v.rareKinds} kinds: ${v.rareIds.join(' ')}) | shrine ${v.shrine} | plaza ${mmss(v.plaza)}, fireworks ${v.fw}, stalls ${v.stall} | income/min h1 ${v.inc1} h2 ${v.inc2} | left ${v.money}`); console.log('  ' + v.order.join(', ')); }
  if (M.G) console.log(`  shopper: first hat ${mmss(M.G.firstHat)} | 1st hour ${M.G.hour} pieces, gap med ${mmss(M.G.gapMed)} max ${mmss(M.G.gapMax)} | gold after ★5 ${Object.entries(M.G.gold).map(([k, t]) => k + '@' + mmss(t)).join(' ') || '-'} (at ★5 ${goldAt5}) | G4 ${noBuyS}s with nothing to buy`);
  const kinds = {}; for (const r of arrowRecs(pre)) { const k = r.k ? r.k + (r.h ? '*' : '') : '-'; kinds[k] = (kinds[k] || 0) + 1; }
  console.log('  arrow: ' + Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ' + n).join(', '));
  const chk = PROFILE === 'eager' ? [[fin !== null && fin >= 1260 && fin <= 1620, 'A1 ★5 21-27m'], [M.B1.med !== null && M.B1.med <= 30 && M.B1.p90 <= 50 && M.B1.max <= 90, 'B1'], [M.B1.first5max <= 45, 'B1 first 5m'], [M.D2 === null ? null : M.D2 >= 2500 && M.D2 <= 4500, 'D2'], [M.E5 < .08, 'E5']]
    : PROFILE === 'casual' ? [[fin !== null && fin <= 2160, 'A2 ★5 <=36m'], [M.B1.max <= 120, 'B2 <=120s'], [M.E5 < .08, 'E5']]
    : PROFILE === 'novice' ? [[fin !== null && fin <= 3480, 'A2 ★5 <=58m'], [M.B1.max <= 180, 'B2 <=180s'], [M.E5 < .12, 'E5']] : [];
  chk.push([M.B3.max <= 150, 'B3 <=150s'], [M.C4 === null ? null : M.C4 <= .05, 'C4 <=5%'], [M.C3.share === null ? null : M.C3.share <= .5, 'C3 <=50%'], [M.F2.ok === null ? null : M.F2.ok >= .95, 'F2 >=95%']);
  console.log('  targets (this run alone): ' + chk.map(([ok, s]) => T(ok, s)).join(' | '));
  for (const k in inv) console.log('  INVARIANT ' + k + ' x' + inv[k].n + ' first: ' + inv[k].first);
}
if (Object.keys(inv).length || fin === null) process.exitCode = 1;
