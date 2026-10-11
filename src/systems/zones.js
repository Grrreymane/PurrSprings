// ============================================================ zones: check-in, cleaning, towels, piles, price pads
let coinCombo = 0, coinT = -9, lastEarnT = 0;
function deskManned() { const rc = STAFF.find(s => s.role === 'recep'); return P.atDesk || !!(rc && rc.atDesk); }
// check-in time: the receptionist at the desk checks in x0.92 a level (4.7); you alone take CHECKIN_T
function checkinT() { const rc = STAFF.find(s => s.role === 'recep' && s.atDesk); return rc ? CHECKIN_T * lvMul(rc, .92) : CHECKIN_T; }
function inShelfZone() { return S.unlocked.onsen && dist(P.x, P.y, SHELF_C[0], SHELF_C[1]) <= 22; }
function inBasketZone() { return S.unlocked.onsen && dist(P.x, P.y, BASKET_C[0], BASKET_C[1]) <= 20; }
function inCleanZone(rm) { return dist(P.x, P.y, rm.cleanC[0], rm.cleanC[1]) <= rm.cleanR; }
// pulled: the net reached it from further than a step (G5) - its fish fly over to the innkeeper (not straight to the HUD)
// and the net's ring shows for a moment (netPullAt), so you can see what the net does
let netPullAt = -9;
function collect(id, pulled) {
  const v = S.piles[id]; S.piles[id] = 0;
  S.money += v; S.earned += v; lastEarnT = S.stats.time;
  const [tx, ty] = PILE_AT[id], wx = tx * TILE + 8, wy = ty * TILE + 8;
  coinCombo = T - coinT < 1.5 ? coinCombo + 1 : 0; coinT = T; SFX.coin(coinCombo);
  const big = id === 'recep' && v > 200;   // the cash box (4.8): 10 fish instead of 6 and a rattle
  if (big) sfx('coinBig');
  const n = Math.min(big ? 10 : 6, Math.max(1, Math.ceil(v / 6)));
  if (pulled) {
    netPullAt = T;
    for (let i = 0; i < Math.min(n, 5); i++) FX.push({ k: 'suck', x0: wx + rand(-4, 4), y0: wy - 4 + rand(-3, 3), t: -i * .06, life: .4 });
    pop('+' + v, P.x, P.y - 30, '#ffe9a8', 8, .9);
  } else {
    for (let i = 0; i < n; i++) FX.push({ k: 'fly', x0: wx - R(cam.x) + rand(-4, 4), y0: wy - R(cam.y) - 6 + rand(-3, 3), t: -i * .05, life: .55 + i * .02 });
    pop('+' + v, wx, wy - 14, '#ffe9a8', 8, .9);
  }
  if (PET && PET.kind === 'duck' && T - quackT >= 20 && Math.random() < .1) { quackT = T; lineSay(PET, 'A01'); sfx('quack'); }   // the duck: 10 %, once per 20 s
  markDirty();
}
function pour(u, dt) {
  if (P.padOn !== u.id) { P.padOn = u.id; P.padT = 0; }
  P.padT += dt; if (P.padT < PAD_DELAY) return;   // walking across a pad doesn't spend; stand on it for a moment
  if (padNeed(u) <= 0) { unlock(u.id); return; }   // an old save already paid more than a price that was lowered later
  if (S.money <= 0) { P.pouring = null; P.pourAcc = 0; return; }   // out of fish: no pouring look (the frame stays white)
  if (P.pouring !== u.id) { P.pouring = u.id; P.pourAcc = 0; }
  P.pourAcc += Math.max(15, u.price / POUR_T) * dt;
  const n = Math.min(Math.floor(P.pourAcc), S.money, padNeed(u));
  if (n > 0) {
    P.pourAcc -= n; S.money -= n; S.paid[u.id] = (S.paid[u.id] || 0) + n; markDirty();
    SFX.tick((S.paid[u.id] || 0) / u.price);
    // a few fish hop off your head and land in the pad's corners (few and to the sides, so the cat stays visible)
    const xy = padXY(u);
    if (xy && FX.filter(f => f.k === 'pour').length < 3 && Math.random() < .35) { const sd = Math.random() < .5 ? -1 : 1; FX.push({ k: 'pour', x0: P.x + sd * 3, y0: P.y - 18, x1: xy[0] * TILE + 8 + sd * rand(5, 7), y1: xy[1] * TILE + 11, t: 0, life: .35 }); }
  }
  if (padNeed(u) <= 0) unlock(u.id);
}
// ---- the tray (4.1). Everyone waiting for a tray item: calls, seated diners and (stage 2B) the VIP's current wish.
// A want: { e, k, x, y, left (s), call | seat | give() }. x, y = where it is handed over (within DELIVER_R).
// playerWants (v2.0.1 G3): what the innkeeper's tray serves - once the tea runner is hired the calls are its job, not yours
const playerWants = () => { const L = trayWants(); return hasTeaboy() ? L.filter(w => !w.call) : L; };
function trayWants() {
  const L = [];
  for (const gu of GUESTS) {
    if (gu.call) { const [x, y] = guestSpot(gu); L.push({ e: gu, k: gu.call.k, x, y, left: gu.call.t, call: true }); }
    if (dinerWaiting(gu)) { const [x, y] = guestSpot(gu); L.push({ e: gu, k: 'rice', x, y, left: SEAT_WAIT - gu.t, seat: true }); }
  }
  vipWants(L);
  return L;
}
const countK = (tr, k) => { let n = 0; for (const x of tr) if (x === k) n++; return n; };
const wantCount = (k, L) => { let n = 0; for (const w of L || playerWants()) if (w.k === k) n++; return n; };
function staffHeld(k) { let n = 0; for (const s of STAFF) if (s.tray.length && s.role !== 'tea') n += countK(s.tray, k); return n; }   // waiters (the tea runner's cups are for its calls, not in playerWants)
const heldCount = k => countK(P.tray, k) + staffHeld(k);
// pick-up points: standing in the zone hands you one portion every t seconds, only while somebody still wants one
const PICKUPS = [
  { id: 'urn1', k: 'tea', t: .3, on: () => !!S.unlocked.tea },
  { id: 'urn2', k: 'tea', t: .3, on: () => !!S.unlocked.garden },
  { id: 'milk', k: 'milk', t: .3, on: () => !!S.unlocked.milk },
  { id: 'pass', k: 'rice', t: .15, on: () => !!S.unlocked.dining },
];
const inZone = z => dist(P.x, P.y, z.c[0], z.c[1]) <= z.r;
const canPick = (pk, L) => pk.on() && P.tray.length < trayCap() && wantCount(pk.k, L) - heldCount(pk.k) > 0 && (pk.id !== 'pass' || PASS.n > 0);
// what the innkeeper would cook standing at the stove right now: a kaiseki box for the VIP (3 s, only by hand), else
// rice while nobody's chef (1 s a portion, only what is wanted). Rice for seated diners goes onto the counter when a
// waiter is hired (he carries it; SPEC_v2 18.2), else onto the tray.
function stoveJob(L) {
  if (!S.unlocked.dining) return null;
  if (P.tray.length < trayCap() && !P.tray.includes('kaiseki') && wantCount('kaiseki', L) - heldCount('kaiseki') > 0) return { k: 'kaiseki', to: 'tray', t: KAISEKI_T };
  if (hasChef() || wantCount('rice', L) - heldCount('rice') - PASS.n <= 0) return null;
  const forCalls = L.filter(w => w.k === 'rice' && !w.seat).length - countK(P.tray, 'rice'), room = P.tray.length < trayCap(), passRoom = hasWaiter() && PASS.n < PASS_MAX;
  if (forCalls <= 0 && passRoom) return { k: 'rice', to: 'pass', t: STOVE_T };
  if (room) return { k: 'rice', to: 'tray', t: STOVE_T };
  return passRoom ? { k: 'rice', to: 'pass', t: STOVE_T } : null;
}
const stoveBusy = () => P.cookT > 0 || STAFF.some(s => s.cooking);
function trayZones(dt) {
  const L = playerWants();
  let inAny = false;
  for (const pk of PICKUPS) {
    const z = ZONE[pk.id];
    if (!pk.on() || !inZone(z)) { P.pick[pk.id] = 0; continue; }
    inAny = true;
    if (!canPick(pk, L)) { P.pick[pk.id] = 0; continue; }
    P.pick[pk.id] = (P.pick[pk.id] || 0) + dt;
    if (P.pick[pk.id] >= pk.t) { P.pick[pk.id] = 0; P.tray.push(pk.k); if (pk.id === 'pass') PASS.n--; sfx('take'); }
  }
  const atStove = !!S.unlocked.dining && inZone(ZONE.stove), sj = atStove ? stoveJob(L) : null;
  inAny = inAny || atStove;
  if (sj) {
    if (P.cookK !== sj.k) { P.cookK = sj.k; P.cookT = 0; }
    P.cookT += dt;
    if (P.cookT >= sj.t) { P.cookT = 0; P.cookK = null; if (sj.to === 'pass') PASS.n++; else P.tray.push(sj.k); sfx('cook'); }
  } else { P.cookT = 0; P.cookK = null; }
  // put back: what nobody waits for any more (a call timed out) goes back at any pick-up zone, one every 0.15 s
  let ex = null;
  if (inAny) for (const k of TRAY_KINDS) if (countK(P.tray, k) > Math.max(0, wantCount(k, L) - staffHeld(k))) { ex = k; break; }
  if (ex) {
    P.putT += dt;
    if (P.putT >= .15) { P.putT = 0; P.tray.splice(P.tray.lastIndexOf(ex), 1); if (ex === 'rice' && inZone(ZONE.pass) && PASS.n < PASS_MAX) PASS.n++; SFX.pop(); }
  } else P.putT = 0;
  // hand over: the nearest one within DELIVER_R who waits for something on the tray, after DELIVER_T there
  let best = null, bd = DELIVER_R + .001;
  if (P.tray.length) for (const w of L) if (P.tray.includes(w.k)) { const d = dist(P.x, P.y, w.x, w.y); if (d < bd) { bd = d; best = w; } }
  if (!best || best.e !== P.giveTo || best.k !== P.giveK) { P.giveTo = best ? best.e : null; P.giveK = best ? best.k : null; P.giveT = 0; }
  if (best) { P.giveT += dt; if (P.giveT >= DELIVER_T) { P.giveT = 0; P.giveTo = P.giveK = null; giveTo(best); } }
}
function giveTo(w) {
  const i = P.tray.indexOf(w.k); if (i < 0) return;
  P.tray.splice(i, 1);
  FX.push({ k: 'give', it: w.k, x0: P.x, y0: P.y - 12, x1: w.x, y1: w.y - 10, t: 0, life: .3 });
  if (w.call) serveCall(w.e); else if (w.seat) { serveSeat(w.e); firstDone('dine'); } else if (w.give) w.give();
}
function zones(dt) {
  const ptx = Math.floor(P.x / TILE), pty = Math.floor(P.y / TILE);
  P.atDesk = ptx === DESK_SPOT[0] && pty === DESK_SPOT[1];
  // check-in: the front guest, someone at the desk, a clean empty room (their favourite kind first)
  const f = Q[0];
  if (f && f.st === 'queue' && f.ready) { const rm = freeRoom(f); if (rm && deskManned()) { f.ck += dt / checkinT(); if (f.ck >= 1) checkIn(f, rm); } }
  trayZones(dt);
  // fish piles: step near it, take it all; the net widens the reach (4.8). v2.0.1 G5: every pile inside NET_R - small ones
  // and the cash box too (the stage-4 NEAR_MIN / cash-box gate made the net feel like it did nothing) - flies over
  const nr = NET_R[netLvl()];
  for (const id in S.piles) if (S.piles[id] > 0) { const [tx, ty] = PILE_AT[id], d = dist(P.x, P.y, tx * TILE + 8, ty * TILE + 8); if (d <= nr) collect(id, d > NET_R[0] + 6); }
  // cleaning: progress is kept if you walk away
  for (const rm of ROOMS) if (S.rooms[rm.id] === 'messy' && inCleanZone(rm)) { RT[rm.id].cleanP += dt / (CLEAN_T * cleanMulOf(rm)); if (RT[rm.id].cleanP >= 1) finishClean(rm.id); }
  // towels: shelf -> head stack -> basket
  if (S.unlocked.onsen) {
    const cap = towelCap();
    if (inShelfZone() && P.towels < cap) { P.shelfT += dt; while (P.shelfT >= .12 && P.towels < cap) { P.shelfT -= .12; P.towels++; SFX.pop(); } } else P.shelfT = 0;
    if (inBasketZone() && P.towels > 0 && S.basket < BASKET_MAX) { P.basketT += dt; while (P.basketT >= .1 && P.towels > 0 && S.basket < BASKET_MAX) { P.basketT -= .1; P.towels--; S.basket++; SFX.pop(); markDirty(); } } else P.basketT = 0;
  }
  // decor slots: stand still on one to swap in the next piece (4.5)
  slotZone(dt, ptx, pty);
  // the star-5 boutique: try-on at the booths, the mirror, the pet cushion (4.11)
  boutiqueZone(dt, ptx, pty);
  // price pads
  let on = null;
  // after a purchase the tile you stand on is locked (P.padLock) until you step off it: the next pad of a same-tile chain
  // (decor, garden, booths) waits for you to come back, so standing still to watch the banner never buys it (18.2)
  if (P.padLock && (P.padLock[0] !== ptx || P.padLock[1] !== pty)) P.padLock = null;
  if (state === 'play' && !P.padLock) for (const [id, xy] of PADPOS) if (xy[0] === ptx && xy[1] === pty) on = UNLOCK[id];
  if (on) pour(on, dt); else { P.pourAcc = 0; P.pouring = null; P.padOn = null; P.padT = 0; }
}
