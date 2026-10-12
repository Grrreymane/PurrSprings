// ============================================================ v2.2 business pressure (SPEC_v2 19.2)
// Player feedback (2026-10-12): "the rest is a bit too easy - more business pressure? idling also makes money now". The
// rule (WORKFLOW 3): playing well pays clearly more, slacking slowly earns less - never a punishment, never a dead end.
//   reputation  every guest rates the stay 1-5 stars when it leaves (the wait at the counter, a clean room ready, a towel
//               when it wanted a bath, rice when it sat down; an angry one = 1 star). The day's average shows on the
//               evening summary (a banner at the end of the rush) and sets the next day: the room fee x0.8-x1.2 (4.5
//               stars = x1, 5 = x1.2, 3.25 = x0.9, 2 or less = x0.8), guest flow x0.9-1.1, staff a little quicker / slower, hearts
//               + (r - 3) x 5. Bad reputation only earns less.
//   rush        from star 2, every evening (clock RUSH_AT, RUSH_T s): guests come twice as often; a little clock on the
//               HUD, a banner "客人多起来了", a picture card the first time. The staff can't keep up alone: the arrow
//               sends you to help at the desk (two check in twice as fast), clean, carry towels.
//   caps        from star 2 every fish pile / the cash box holds about CAP_SEC s of its own income (a running average);
//               full = nothing more lands there and a "满" bubble shows. The clerk raises every cap (x1.5, +0.1 a level).
// Before star 2 (novice protection) there is no rush, no cap, and the reputation changes nothing; the evening ★2 is reached
// stays calm too (fun check: the rush card came on the same second as the onsen gate, and the first summary rated the ★1
// queue - "3.0 -12%" a minute into ★2): only guests checked in at ★2+ are rated, the first rush and the first summary
// come the next day (S.rep.s2 = the day ★2 came), and a day with fewer than REP_MIN ratings is not summed up. A summary below par shows
// what cost the most stars (the arrow's icon for that job: the desk, a broom, towels, rice).
// Saved: S.rep = { r: tenths of a star (the reputation in effect), s: today's ratings (tenths) summed, n: how many, d: days rated,
// s2 / s5: the day ★2 / ★5 came }.
// v2.3 (SPEC_v2 19.3, player feedback "五星后的高峰做难一点，现在一天下来其实比较慢"): a day is 3 min (DAY_LEN), the rush 45 s
// from clock .50 (sunset), not on a festival evening (the festival is that evening's crowd) and from the 2nd day after ★2.
// From the day after ★5 the rush is the big one (大高峰): guests x2.5 (+0.1 a gold star, +0.1 a year, at most x3), about
// half of them picky (急客: 28 s of patience, and they want something right now - tea, a towel, rice or milk, a bubble over
// the head that turns orange / red as its 30 s run out; only the innkeeper brings it, never the staff). The rush is rated
// on its own (rushScore: the wait in line - stricter for the picky ones - and the extra brought or not; angry = 1) and that
// rating is the evening summary: >= 4.5 = 高峰大成功 (a gold banner, a red packet in the cash box, hearts +20 over the
// usual); below it the banner shows what cost the most (the line or the extras). A bad rush only costs reputation (the
// next day's fees) - nobody is ever stuck.
SEEN_KEYS.push('rush', 'rep', 'full', 'rush5');   // their picture cards (cards.js FIRST_CARD)
const REP_DEF = 45, REP_PRICE = .2, REP_FLOW = .1, REP_STAFF = .1, REP_MIN = 6, REP_QUIET = 3;   // v2.3: a summary at par or above within 0.3 of the day before: no banner (3-min days)
const RUSH_AT = .50, RUSH_T = 45, RUSH_K = 2;   // v2.3: was .56 / 60 s of a 6-min day
const CAP_SEC = 240, CAP_TAU = 120, CAP_FLOOR = 8;   // tuned with tests/balance_all.js (A4 30-50 %)
// ---- reputation
const repOn = () => star() >= 2;
const repR = () => repOn() ? clamp(S.rep.r | 0, 10, 50) / 10 : REP_DEF / 10;
const repK = () => { const d = repR() - 4.5; return clamp(d >= 0 ? d / .5 : d / 2.5, -1, 1); };   // 4.5 stars = par
const repMul = () => 1 + REP_PRICE * repK();           // the room fee
const repStaff = () => 1 + REP_STAFF * repK();          // check-in / cleaning speed of the staff
const repToday = () => S.rep.n ? S.rep.s / S.rep.n / 10 : null;
// a guest's stay, 1-5 stars (tenths), when it leaves (guests.js guestLeave)
function rateStay(gu, angry) {
  const pen = RUN.ratePen || (RUN.ratePen = { angry: 0, line: 0, bed: 0, towel: 0, noBath: 0, hungry: 0, slow: 0 });
  if (angry) { pen.angry += 4; REP_WHY.line += 4; return 10; }
  let r = 5;
  const q = gu.qT || 0; if (q > 15) { const d = Math.min(2, (q - 15) / 15); r -= d; pen.line += d; REP_WHY.line += d; }   // the wait in line (the counter)
  if ((gu.bedT || 0) > 6) { r -= .5; pen.bed += .5; REP_WHY.bed += .5; }                                              // no clean room was ready
  if ((gu.towelT || 0) > 4) { r -= .5; pen.towel += .5; REP_WHY.towel += .5; } if (gu.noBath) { r -= 1; pen.noBath++; REP_WHY.towel++; }  // a towel when it wanted a bath
  if (gu.hungry) { r -= 1; pen.hungry++; REP_WHY.food++; } else if ((gu.seatT || 0) > 15) { r -= .5; pen.slow += .5; REP_WHY.food += .5; }   // rice when it sat down
  if (gu.pref) r += .5; if (gu.combo) r += .5;                                                     // a favourite / a combo room
  return R(clamp(r, 1, 5) * 10);
}
const REP_WHY = { line: 0, bed: 0, towel: 0, food: 0 };   // today's lost stars by cause (runtime; the summary's hint)
function rateGuest(gu, angry) {
  if (gu.rated) return; gu.rated = true;
  if (star() < 2 || (!angry && !gu.r2)) return;   // only stays that began at ★2+ (an angry guest in line: at ★2+)
  const r = rateStay(gu, angry); S.rep.s += r; S.rep.n++; RUN.rates = (RUN.rates || 0) + 1; RUN.rateSum = (RUN.rateSum || 0) + r;
  markDirty();
}
// the evening summary (the end of the rush): today's average becomes the reputation; a banner, hearts, a card the first time
// v2.3: o = the big rush's result { avg, n, why } instead of today's ratings
function repSummary(o) {
  const n = o ? o.n : S.rep.n, avg = o ? o.avg : n >= REP_MIN ? R(S.rep.s / n) : null;
  let why = null, wv = 0; for (const k in REP_WHY) { if (REP_WHY[k] > wv) { wv = REP_WHY[k]; why = k; } REP_WHY[k] = 0; }
  if (o) why = o.why;
  S.rep.s = 0; S.rep.n = 0;
  if (!repOn() || avg === null || S.day <= (S.rep.s2 | 0)) return;   // the evening ★2 came is not rated (a three-room inn's first hour)
  const r0 = S.rep.r, quiet = !o && S.seen.rep && avg >= 45 && r0 >= 45 && Math.abs(avg - r0) < REP_QUIET;   // v2.3: a good day like the one before: no banner
  S.rep.r = clamp(avg, 10, 50); S.rep.d++; RUN.repDays = (RUN.repDays || []).concat([avg / 10]);
  const great = !!o && avg >= RUSH_GREAT, h = Math.max(0, R((avg / 10 - 3) * 5)) + (great ? RUSH_GREAT_H : 0); addHearts(h);
  if (great) {   // 高峰大成功: a red packet in the cash box (like the festival's: past the cap), a gong, a pop over the innkeeper
    const red = R(RUSH_PACKET * STARS[star()].room * o.n * repMul()); S.piles.recep = (S.piles.recep || 0) + red;
    banner('rush5ok', avg, { h, red, n }); sfx('gong'); pop('大成功！', P.x, P.y - 40, '#ffd23f', 8, 1.6); fxSpark(P.x, P.y - 20, 8);
    RUN.rushGreat = (RUN.rushGreat || 0) + 1; news('rushok');
  } else if (!quiet) banner('rep', avg, { pct: R((repMul() - 1) * 100), h, n, why: avg < 45 ? why : null, rush: !!o });
  else pop('★' + (avg / 10).toFixed(1), P.x, P.y - 34, '#ffe9a8', 8, 1.2);   // (the HUD shows today's stars; a small pop instead)
  firstTime('rep'); news('rep'); markDirty();
}
// ---- the evening rush
const rushEnd = () => RUSH_AT + RUSH_T / DAY_LEN;
const festEve = () => star() >= FEST_STAR && seasonDay(S.day) === 1;   // v2.3: the festival is that evening's crowd (festival.js)
const rushDay = () => star() >= 2 && S.day > (S.rep.s2 | 0) + 1 && !festEve();   // v2.3: from the 2nd day after ★2 (days are 3 min now)
const rushOn = () => rushDay() && S.clock >= RUSH_AT && S.clock < rushEnd();
const rushLeft = () => rushOn() ? (rushEnd() - S.clock) * DAY_LEN : 0;
const repFlow = () => 1 + REP_FLOW * repK();           // guest flow (half the fee's swing: a 5-star inn's every fee grows with it)
const flowMul = () => repFlow() * (rushOn() ? rushK() : 1);   // spawnGap() divides by this
// ---- v2.3 (19.3): the star-5 rush (大高峰)
const RUSH5_K = 2.5, RUSH5_MAX = 3, RUSH5_STEP = .1;            // guests x2.5, +0.1 a gold star / a year after the first, <= x3
const PICKY_P = .55, PICKY_P_MAX = .7, PICKY_PAT = 28;          // the share of picky guests (+5 % a gold star) and their patience
const RUSH_LINE = 12, PICKY_LINE = 8;                           // rushScore: a wait in line over this many s costs (-1 a limit more)
const EX_T = 30, EX_T_MIN = 22, EX_PAT = 10, EX_MISS = 20;      // an extra: 30 s (-1.5 a gold star, >= 22); brought: patience +10 s; missed: -2 stars
const RUSH_GRACE = 25, RUSH_MIN_N = 4, RUSH_GREAT = 45, RUSH_GREAT_H = 20, RUSH_PACKET = 2;   // the result waits <= 25 s for the last ones; >= 4.5 = great: hearts +20, 2 x room fee a guest
const EX_KINDS = [['tea', .4, 'tea'], ['towel', .25, 'onsen'], ['rice', .25, 'dining'], ['milk', .1, 'milk']];   // [kind, weight, the unlock it needs]
const hardRush = () => star() >= 5 && S.day > (S.rep.s5 | 0);   // the day ★5 comes stays an ordinary rush
const rushK = () => !hardRush() ? RUSH_K : Math.min(RUSH5_MAX, RUSH5_K + RUSH5_STEP * (goldStars() + Math.max(0, yearOf(S.day) - 1)));
const pickyP = () => Math.min(PICKY_P_MAX, PICKY_P + .05 * goldStars());
const exT = () => Math.max(EX_T_MIN, EX_T - 1.5 * goldStars());
// runtime: this rush is the big one; its guests; when it ended (the result waits for its last guests); the bell's last ring
const RUSH5 = { on: false, g: [], end: null, ring: -9 };
// a guest walks in during the big rush (guests.js addGuest): one of its guests, maybe a picky one
function rushGuest(gu) {
  if (!RUSH5.on || !rushOn()) return;
  gu.rush = true; RUSH5.g.push(gu);
  if (Math.random() < pickyP()) { gu.picky = true; gu.pat = PICKY_PAT; }
}
// ...and comes in through the door (guests.js updGuest): a picky one wants something right now (only what the inn has)
function rushInside(gu) {
  if (!gu.picky || gu.exK) return;
  const ks = EX_KINDS.filter(k => S.unlocked[k[2]]); if (!ks.length) return;
  let x = Math.random() * ks.reduce((a, k) => a + k[1], 0), k = ks[0][0];
  for (const e of ks) { x -= e[1]; if (x < 0) { k = e[0]; break; } }
  const t = exT(); gu.ex = { k, t, max: t }; gu.exK = k; RUN.exMade = (RUN.exMade || 0) + 1; (RUN.exKinds || (RUN.exKinds = {}))[k] = (RUN.exKinds[k] || 0) + 1;
  if (T - RUSH5.ring > 3) { RUSH5.ring = T; sfx('ring'); }
  firstTime('rush5'); lineSay(gu, { tea: 'G22', milk: 'G23', rice: 'G24' }[k]);
}
// checked in before its extra came: it waits for it on the lobby's east side (its room stays reserved), in sight of the
// desk and the urn, so the rush plays out on one screen - nobody is chased through the corridors
const EX_WAIT = [[20, 27], [21, 27], [22, 27], [20, 28], [21, 28], [22, 28], [19, 28], [19, 27]];
function exWait(gu) {
  if (!(gu.exW >= 0)) { const used = new Set(); for (const o of GUESTS) if (o !== gu && o.ex && o.exW >= 0) used.add(o.exW); let i = 0; while (i < EX_WAIT.length - 1 && used.has(i)) i++; gu.exW = i; }
  return EX_WAIT[gu.exW];
}
function exTick(gu, dt) { if (gu.ex && (gu.ex.t -= dt) <= 0) { gu.ex = null; gu.exMiss = true; gu.callGone = .25; RUN.exMissed = (RUN.exMissed || 0) + 1; (RUN.exMiss || (RUN.exMiss = {}))[gu.exK] = (RUN.exMiss[gu.exK] || 0) + 1; } }
// the innkeeper hands it over (zones.js giveTo): a tip in hand, a heart, more patience if still in line
function serveExtra(gu) {
  const [x, y] = guestSpot(gu); gu.ex = null; gu.exOk = true; gu.heart = 1;
  if (gu.st === 'queue' || gu.st === 'arrive') gu.pat += EX_PAT;
  earn(fee('tip', { gu }), x, y - 12); addHearts(1); RUN.exServed = (RUN.exServed || 0) + 1; firstDone('rush5');
  lineSay(gu, 'G25|G26|G39'); sfx('serve'); markDirty();
}
// a rush guest's stars for the rush (tenths): the wait in line and the extra; angry = 1
function rushScore(gu) {
  if (gu.st === 'angry' || gu.angryR) return 10;
  const lim = gu.picky ? PICKY_LINE : RUSH_LINE, q = gu.qT || 0;
  let r = 50 - (q > lim ? Math.min(gu.picky ? 30 : 20, (q - lim) / lim * 10) : 0);
  if (gu.exMiss) r -= EX_MISS;
  return clamp(R(r), 10, 50);
}
const rushSettled = gu => gu.st === 'angry' || !!gu.angryR || (!!gu.r2 && !gu.ex);   // checked in (or gone) and its extra brought / missed
const rushLive = () => { let s = 0, n = 0; for (const gu of RUSH5.g) if (rushSettled(gu)) { s += rushScore(gu); n++; } return n ? s / n / 10 : null; };
// the big rush's result = the evening summary (repSummary with the rush's own average and what cost the most)
function rushResult() {
  const L = RUSH5.g; RUSH5.end = null; RUSH5.on = false; RUSH5.g = [];
  if (L.length < RUSH_MIN_N) { repSummary(); return; }
  let s = 0; const why = { line: 0, extra: 0 }, miss = {};
  for (const gu of L) {
    const r = rushScore(gu); s += r;
    if (gu.exMiss) { why.extra += EX_MISS; miss[gu.exK] = (miss[gu.exK] || 0) + 1; }
    why.line += 50 - r - (gu.exMiss ? EX_MISS : 0);
  }
  const avg = R(s / L.length), mk = Object.keys(miss).sort((a, b) => miss[b] - miss[a])[0] || 'tea';
  RUN.rush5 = (RUN.rush5 || []).concat([avg / 10]);
  repSummary({ avg, n: L.length, why: why.extra > why.line ? 'ex:' + mk : 'line' });
}
let rushWas = false, starWas = 0;
// the line at the desk has been long (3+ ready guests, 2+ in the rush) this long: the arrow asks you to help (guide.js deskHelp)
const LINE_LONG_T = 2;
let lineLongT = 0;
function businessTick(dt, c0, c1) {
  const sn = star(); if (starWas && starWas < 2 && sn >= 2) { S.rep.s2 = S.day; markDirty(); }   // ★2 came today: tonight stays calm
  if (starWas && starWas < 5 && sn >= 5) { S.rep.s5 = S.day; markDirty(); } starWas = sn;          // v2.3: ★5 today - the big rush from tomorrow
  const on = rushOn();
  if (on && !rushWas) {
    RUSH5.on = hardRush(); RUSH5.g = []; RUSH5.end = null;
    banner('rush', RUSH5.on ? 1 : 0, { k: RUSH5.on ? rushK() : RUSH_K }); firstTime('rush'); sfx('dusk'); news('rush'); RUN.rushes = (RUN.rushes || 0) + 1;
    if (RUSH5.on) RUN.rushes5 = (RUN.rushes5 || 0) + 1;
  }
  rushWas = on;
  lineLongT = qReady() >= (on ? 2 : 3) ? lineLongT + dt : 0;
  const wrap = c1 < c0, crossed = a => wrap ? (a > c0 || a <= c1) : (a > c0 && a <= c1);
  if (crossed(rushEnd())) { if (RUSH5.on && RUSH5.g.length) RUSH5.end = S.stats.time; else { RUSH5.on = false; repSummary(); } }
  if (RUSH5.end !== null && (RUSH5.g.every(rushSettled) || S.stats.time - RUSH5.end >= RUSH_GRACE)) rushResult();
  capTick(dt);
}
// ---- caps on the fish piles
const PILE_RATE = NUL();   // pile id -> fish a second landing there (attempted), a running average over CAP_TAU s; runtime
const capOn = () => star() >= 2;
function clerkCapK() { const c = STAFF.find(s => s.role === 'clerk'); return c ? 1.5 + .1 * (staffLv(c) - 1) : S.unlocked.clerk ? 1.5 : 1; }
function pileCap(id) { if (!capOn()) return 1e9; return R(Math.max(CAP_FLOOR * STARS[star()].room, (PILE_RATE[id] || 0) * CAP_SEC) * clerkCapK()); }
// full: at its cap, or something didn't fit in the last FULL_HOLD s (the cap breathes with the running average: no flicker)
const FULL_HOLD = 4, FULL_T = NUL();
const pileFull = id => capOn() && (S.piles[id] || 0) > 0 && ((S.piles[id] || 0) >= pileCap(id) || T - (FULL_T[id] === undefined ? -99 : FULL_T[id]) < FULL_HOLD);
function capTick(dt) { const k = Math.exp(-dt / CAP_TAU); for (const id in PILE_RATE) PILE_RATE[id] *= k; }
// income landing in a pile: what fits under its cap lands, the rest is lost (a full pile stops filling). Returns what landed.
function deposit(id, v) {
  v = v | 0; if (v <= 0) return 0;
  const cur = S.piles[id] || 0, add = Math.max(0, Math.min(v, pileCap(id) - cur));   // the cap before this one counts in it
  PILE_RATE[id] = (PILE_RATE[id] || 0) + v / CAP_TAU;
  if (add > 0) S.piles[id] = cur + add;
  if (add < v) { FULL_T[id] = T; RUN.capLost = (RUN.capLost || 0) + v - add; if (!FULL_SEEN[id]) { FULL_SEEN[id] = true; firstTime('full'); news('full'); } }
  return add;
}
const FULL_SEEN = NUL();   // runtime: a pile that was full once since the load (its first-time card is S.seen.full)
// a full pile: a small white bubble with 满 over it (render-world drawScene pile loop -> drawOverlays)
function drawFullPiles() {
  if (!capOn()) return;
  for (const id in S.piles) {
    if (!pileFull(id)) continue;
    const [tx, ty] = PILE_AT[id], x = tx * TILE + 8, y = ty * TILE - 6 - (id === 'recep' && S.piles[id] > 200 ? 4 : 0);
    if (!VIS(x, y, 20)) continue;
    const b = R(Math.sin(T * 2) * .6);
    drawA(bubbleArt('blank', 0), x, y + b, 7, 12); txt('满', x - CX, y + b - 6 - CY + .5, 7, '#c0392b', 'center', null);
  }
}
// ---- the HUD (row 2, after the bell): the evening rush (a clock + the time left) / today's reputation
function drawBizHud(x) {
  if (star() < 2) return x;
  if (rushOn() || RUSH5.end !== null) {   // the clock + the time left; the big rush (red bar) also its stars so far
    const live = RUSH5.on ? rushLive() : null, s = live === null ? '' : live.toFixed(1), w = 30 + (s ? 9 + textW(s, 7) : 0);
    pill(x, 17, w, 11); drawC(clockIcon(), x + 6, 22);
    const f = rushLeft() / RUSH_T; g.fillStyle = OUT; g.fillRect(x + 12, 21, 15, 3); g.fillStyle = RUSH5.on ? '#e8453c' : '#ff9a2a'; g.fillRect(x + 12, 21, Math.max(1, R(15 * f)), 3);
    if (s) { const hi = live >= RUSH_GREAT / 10; drawC(starIcon(hi), x + 33, 22); txt(s, x + 38, 22.5, 7, hi ? '#ffe9a8' : live >= 4 ? '#ffffff' : '#ffb0a0', 'left'); }
    return x + w + 2;
  }
  const r = repToday(); if (r === null) return x;
  const s = r.toFixed(1); pill(x, 17, 13 + textW(s, 7), 11); drawC(starIcon(true), x + 6, 22); txt(s, x + 11, 22.5, 7, '#ffe9a8', 'left');
  return x + 15 + textW(s, 7);
}
// a new game / a load (title.js resetWorld): the rush already on is not announced again; the pile averages start over
function bizReset() { rushWas = rushOn(); starWas = 0; RUSH5.on = false; RUSH5.g = []; RUSH5.end = null; lineLongT = 0; for (const k in PILE_RATE) delete PILE_RATE[k]; for (const k in FULL_T) delete FULL_T[k]; for (const k in FULL_SEEN) delete FULL_SEEN[k]; for (const k in REP_WHY) REP_WHY[k] = 0; }
// ---- save (state-save.js loadState): never wiped, defaults for an old save
function loadRep(s, raw) {
  const r = objOr(raw.rep);
  s.rep = { r: clamp(int0(r.r) || REP_DEF, 10, 50), s: int0(r.s), n: int0(r.n), d: int0(r.d), s2: Math.min(int0(r.s2), s.day), s5: Math.min(int0(r.s5), s.day) };   // v2.3 s5: an old save already at ★5 gets the big rush from now on
  if (s.rep.n > 5000 || s.rep.s > s.rep.n * 50 || s.rep.s < s.rep.n * 10) { s.rep.s = 0; s.rep.n = 0; }
}
