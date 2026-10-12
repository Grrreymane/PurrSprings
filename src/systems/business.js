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
// Saved: S.rep = { r: tenths of a star (the reputation in effect), s: today's ratings (tenths) summed, n: how many, d: days rated }.
SEEN_KEYS.push('rush', 'rep', 'full');   // their picture cards (cards.js FIRST_CARD)
const REP_DEF = 45, REP_PRICE = .2, REP_FLOW = .1, REP_STAFF = .1, REP_MIN = 6;
const RUSH_AT = .56, RUSH_T = 60, RUSH_K = 2;
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
function repSummary() {
  const n = S.rep.n, avg = n >= REP_MIN ? R(S.rep.s / n) : null;
  let why = null, wv = 0; for (const k in REP_WHY) { if (REP_WHY[k] > wv) { wv = REP_WHY[k]; why = k; } REP_WHY[k] = 0; }
  S.rep.s = 0; S.rep.n = 0;
  if (!repOn() || avg === null || S.day <= (S.rep.s2 | 0)) return;   // the evening ★2 came is not rated (a three-room inn's first hour)
  S.rep.r = clamp(avg, 10, 50); S.rep.d++; RUN.repDays = (RUN.repDays || []).concat([avg / 10]);
  const h = Math.max(0, R((avg / 10 - 3) * 5)); addHearts(h);
  banner('rep', avg, { pct: R((repMul() - 1) * 100), h, n, why: avg < 45 ? why : null });
  firstTime('rep'); news('rep'); markDirty();
}
// ---- the evening rush
const rushEnd = () => RUSH_AT + RUSH_T / DAY_LEN;
const rushOn = () => star() >= 2 && S.day > (S.rep.s2 | 0) && S.clock >= RUSH_AT && S.clock < rushEnd();
const rushLeft = () => rushOn() ? (rushEnd() - S.clock) * DAY_LEN : 0;
const repFlow = () => 1 + REP_FLOW * repK();           // guest flow (half the fee's swing: a 5-star inn's every fee grows with it)
const flowMul = () => repFlow() * (rushOn() ? RUSH_K : 1);   // spawnGap() divides by this
let rushWas = false, starWas = 0;
// the line at the desk has been long (3+ ready guests, 2+ in the rush) this long: the arrow asks you to help (guide.js deskHelp)
const LINE_LONG_T = 2;
let lineLongT = 0;
function businessTick(dt, c0, c1) {
  const sn = star(); if (starWas && starWas < 2 && sn >= 2) { S.rep.s2 = S.day; markDirty(); } starWas = sn;   // ★2 came today: tonight stays calm
  const on = rushOn();
  if (on && !rushWas) { banner('rush', 0); firstTime('rush'); sfx('dusk'); news('rush'); RUN.rushes = (RUN.rushes || 0) + 1; }
  rushWas = on;
  lineLongT = qReady() >= (on ? 2 : 3) ? lineLongT + dt : 0;
  const wrap = c1 < c0, crossed = a => wrap ? (a > c0 || a <= c1) : (a > c0 && a <= c1);
  if (crossed(rushEnd())) repSummary();
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
  if (rushOn()) {
    pill(x, 17, 30, 11); drawC(clockIcon(), x + 6, 22);
    const f = rushLeft() / RUSH_T; g.fillStyle = OUT; g.fillRect(x + 12, 21, 15, 3); g.fillStyle = '#ff9a2a'; g.fillRect(x + 12, 21, Math.max(1, R(15 * f)), 3);
    return x + 32;
  }
  const r = repToday(); if (r === null) return x;
  const s = r.toFixed(1); pill(x, 17, 13 + textW(s, 7), 11); drawC(starIcon(true), x + 6, 22); txt(s, x + 11, 22.5, 7, '#ffe9a8', 'left');
  return x + 15 + textW(s, 7);
}
// a new game / a load (title.js resetWorld): the rush already on is not announced again; the pile averages start over
function bizReset() { rushWas = rushOn(); starWas = 0; lineLongT = 0; for (const k in PILE_RATE) delete PILE_RATE[k]; for (const k in FULL_T) delete FULL_T[k]; for (const k in FULL_SEEN) delete FULL_SEEN[k]; for (const k in REP_WHY) REP_WHY[k] = 0; }
// ---- save (state-save.js loadState): never wiped, defaults for an old save
function loadRep(s, raw) {
  const r = objOr(raw.rep);
  s.rep = { r: clamp(int0(r.r) || REP_DEF, 10, 50), s: int0(r.s), n: int0(r.n), d: int0(r.d), s2: Math.min(int0(r.s2), s.day) };
  if (s.rep.n > 5000 || s.rep.s > s.rep.n * 50 || s.rep.s < s.rep.n * 10) { s.rep.s = 0; s.rep.n = 0; }
}
