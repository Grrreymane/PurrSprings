// ============================================================ guide (arrow) + hints + bubbles
// The single "what next" brain (SPEC_v2 6): the arrow draws it, the balance bots walk it. Every target carries the rule
// it came from (`rule` = the row of the 6 table, 1 = "here": you're already doing it, no arrow) and a `key` (what it
// points at). The rules are checked in table order, so a lower rule number = higher priority. Deviations (18.2): rule 3's
// "in time" uses a Manhattan lower bound and takes the nearest in-time want first; stage 4 moves some rules up at times -
// 6 / 9 after STALL_T s without a purchase, 8 when a seated VIP's wish gets late, 14 for a pointed-at combo never made
// yet (COMBO_RUSH s), 11 before 9 / 10 while there is no chef; rule 6 takes the nearest affordable pad (star gates
// first). Booths (hats / pets) only by rule 6 (once each); the statue by rule 6 once every hat and pet is bought; hidden
// combos only once hinted (gold stars, 18.2); the mirror and the pet cushion never.
// v2.0.1: calls are never pointed at (G3: an optional tip; rule 10 is gone - rule 3 still finishes what is already on
// your tray, the VIP first). The VIP (G1): the first one ever is led all the way (rule 8 ahead of the pads), later ones
// once a wish has waited VIP_URGENT s; its pick-up / tap targets carry `vip` and show the VIP's gold wish bubble as the
// arrow's icon, the same picture as over its head.
// Stickiness (6): the arrow keeps what it shows (opts.prev, default GUIDE) while that is still a candidate of the SAME
// rule; another candidate of that rule takes over only when it is >= 30 % nearer. A different rule always takes over
// (higher priority, or the old rule has nothing left). Targets that move (guests, the VIP) are re-read every 0.25 s.
// opts.skip = { call, vip, decor } (the 'ignore' bot, 14.1): calls / the VIP / decor (slots and decor pads) are never
// pointed at - the next rule applies. skip.pad (the 'afkref' bot, A4): no price pads at all (it plays on, buys nothing).
function gT(kind, x, y, tx, ty, here, key) { return { kind, x, y, tx, ty, here: !!here, rule: 0, key: key || kind + ':' + tx + ',' + ty }; }
const T_DESK = here => gT('desk', DESK_SPOT[0] * TILE + 8, DESK_SPOT[1] * TILE + 8, DESK_SPOT[0], DESK_SPOT[1], here);
const T_CLEAN = (rm, here) => gT('clean', rm.cleanC[0], rm.cleanC[1], rm.cleanT[0], rm.cleanT[1], here, 'clean:' + rm.id);
const T_BASKET = here => gT('basket', BASKET_C[0], BASKET_C[1], BASKET_SPOT[0], BASKET_SPOT[1], here);
const T_SHELF = here => gT('shelf', SHELF_C[0], SHELF_C[1], SHELF_SPOT[0], SHELF_SPOT[1], here);
const T_PAD = (u, here) => { const [tx, ty] = padXY(u); return Object.assign(gT('pad', tx * TILE + 8, ty * TILE + 8, tx, ty, here, 'pad:' + u.id), { id: u.id }); };
const T_PILE = id => { const [tx, ty] = PILE_AT[id]; return Object.assign(gT('pile', tx * TILE + 8, ty * TILE + 8, tx, ty, false, 'pile:' + id), { id }); };
const towelWanted = () => S.basket === 0 && GUESTS.some(gu => gu.st === 'towel');
// v2.2 (19.2): the staff can't do it all in a rush - with the porter hired you still carry towels while the basket is
// empty and someone waits for one; a long line at the desk (3+, or 2+ in the evening rush) with a room ready: help the
// receptionist (two check in twice as fast)
const towelHelp = () => S.unlocked.porter ? towelWanted() : (S.basket <= 2 || towelWanted());
// (it has to stay long for LINE_LONG_T s first, business.js; once shown it holds while anyone is in line - no flicker)
const qReady = () => { let n = 0; for (const q of Q) if (q.st === 'queue' && q.ready) n++; return n; };
const deskHelp = free => !!S.unlocked.recep && !!free && (lineLongT >= LINE_LONG_T && !(GPREV && GPREV.rule === 12 && !GPREV.here) && GUEST_ROOMS.filter(roomFree).length >= 2 || (!!GPREV && GPREV.kind === 'desk' && qReady() > 0));
// the pad under a locked tile (just bought there, you haven't stepped off): not pointed at - it would show your own tile
const padLocked = u => { const xy = P.padLock && padXY(u); return !!xy && xy[0] === P.padLock[0] && xy[1] === P.padLock[1]; };
const guidePads = sk => sk && sk.pad ? [] : visiblePads().filter(u => !u.booth && !u.noArrow && !padLocked(u) && !(sk && sk.decor && u.decor));   // v2.1: never the fireworks
// pick-up points: the tile the arrow / bot goes to and the arrow kind (6)
const PICK_TILE = { urn1: SPOT.urn1, urn2: SPOT.urn2, milk: MILK_SPOT, pass: [3, 22], stove: [2, 20] };
const PICK_KIND = { urn1: 'urn', urn2: 'urn', milk: 'milk', pass: 'pass', stove: 'stove' };
const T_PICK = (id, here, k) => { const z = ZONE[id], t = PICK_TILE[id]; return Object.assign(gT(PICK_KIND[id], z.c[0], z.c[1], t[0], t[1], here, 'pick:' + id), { item: k || null }); };
// stage 2B kinds (6): slot (decor), vip (greet / catch up), suite (show it in), tap (run its bath), photo
const T_SLOT = (sl, here) => Object.assign(gT('slot', tcx(sl.at), tcy(sl.at), sl.at[0], sl.at[1], here, 'slot:' + sl.key), { slot: sl.key });
// who a deliver / VIP target is about (not enumerable: targets get printed as JSON by tests); drawGuide puts the arrow over its bubble
const withE = (t, e) => Object.defineProperty(t, 'e', { value: e });
const T_VIP = (kind, here) => { const [tx, ty] = tileOf(VIPG); return withE(gT(kind || 'vip', VIPG.x, VIPG.y, tx, ty, here, kind || 'vip'), VIPG); };
const T_SUITE = rm => { const t = suiteInner(rm); return gT('suite', tcx(t), tcy(t), t[0], t[1], false, 'suite:' + rm.id); };
const T_TAP = (rm, here) => Object.assign(gT('tap', tcx(rm.tap), tcy(rm.tap), rm.tap[0], rm.tap[1], here, 'tap:' + rm.id), { vip: true, item: 'bath' });
const T_GIVE = (w, here) => { const t = wantTile(w); return withE(Object.assign(gT('deliver', w.x, w.y, t[0], t[1], here, 'deliver:' + (w.e.id !== undefined ? w.e.id : '?') + ':' + w.k), { item: w.k }), w.e); };
// rule 8 (6): the VIP - on the carpet: greet it (no clean suite: the nearest dirty one); seated: its wish (tea from the
// nearer urn, bath at the tap, kaiseki at the stove, photo beside it). What's already on the tray goes by rule 3.
function vipGuide() {
  const v = VIPG; if (!v) return null;
  if (v.st === 'carpet') {
    if (cleanSuite()) return T_VIP();
    let bm = null, bd = 1e9;
    for (const rm of SUITES) if (roomOpen(rm) && S.rooms[rm.id] === 'messy') { const d = dist(P.x, P.y, rm.cleanC[0], rm.cleanC[1]); if (d < bd) { bd = d; bm = rm; } }
    return bm ? T_CLEAN(bm, false) : null;
  }
  if (v.st !== 'seated') return null;
  const k = vipWish(), rm = ROOM[v.suite];
  if (k === 'bath') return T_TAP(rm);
  if (k === 'photo') return T_VIP('photo');
  if (k === 'stay') return T_VIP('stay');   // v2.1 rare guests (rare.js): stand by it / fetch it to show it its piece
  if (k === 'show') return T_VIP();
  if ((k === 'tea' || k === 'kaiseki' || k === 'milk' || k === 'rice') && !P.tray.includes(k) && P.tray.length < trayCap()) { const s = sourceOf(k, tileOf(P)); if (s) return Object.assign(T_PICK(s, false, k), { vip: true }); }
  return null;
}
// the arrow leads the VIP ahead of the pads (G1): the very first VIP from the carpet to its last wish (the 3-step card is
// up meanwhile); later ones once the current wish has waited VIP_URGENT s
const vipLeads = v => !!v && (v.st === 'carpet' || v.st === 'seated') && (!S.stats.vips || (v.rare && !rareSeen(v.id)) || (v.st === 'seated' && (v.wt || 0) >= VIP_URGENT));   // v2.1: a rare guest's first visit too
const wantTile = w => w.tile || guestTile(w.e);
const tilesBetween = (a, b) => { const p = findPath(a[0], a[1], b[0], b[1]); return p ? p.length : 1e4; };
// where a tray item comes from: tea from the nearer urn (the urn the arrow shows stays until the other one is >= 30 %
// nearer: no flipping halfway between them), milk from the machine, rice from the counter (or the stove while nobody's
// chef and the counter is empty; with a chef and an empty counter: nowhere yet), kaiseki from the stove
function sourceOf(k, from) {
  if (k === 'tea') {
    const a = S.unlocked.tea, b = S.unlocked.garden; if (!a || !b) return a ? 'urn1' : b ? 'urn2' : null;
    const d1 = dist(tcx(from), tcy(from), ZONE.urn1.c[0], ZONE.urn1.c[1]), d2 = dist(tcx(from), tcy(from), ZONE.urn2.c[0], ZONE.urn2.c[1]);
    const was = GPREV && GPREV.kind === 'urn' && !GPREV.here ? GPREV.key : null;
    if (was === 'pick:urn1' && d2 >= .7 * d1) return 'urn1';
    if (was === 'pick:urn2' && d1 >= .7 * d2) return 'urn2';
    return d1 <= d2 ? 'urn1' : 'urn2';
  }
  if (k === 'milk') return S.unlocked.milk ? 'milk' : null;
  if (k === 'rice') return !S.unlocked.dining ? null : PASS.n > 0 ? 'pass' : hasChef() ? null : 'stove';   // chef + empty counter: wait for him
  if (k === 'kaiseki') return S.unlocked.dining ? 'stove' : null;
  return null;
}
const PILE_MIN = 20;   // rule 15: a pile smaller than this is not worth a walk across the map
const NEAR_MIN = [0, 1, 10, 40, 70, 110];   // stage 4, by star: rule 4 points at a pile 1-3 steps away / the net reaches a pile from this size
let GPREV = null;   // the target shown before this pick (stickiness)
const gAt = (rule, t) => { if (t) t.rule = rule; return t; };
// the rule's own pick vs. the one shown before: keep the old one while it is still a candidate of this rule, unless the
// new one is >= 30 % nearer (6: the arrow must not jump back and forth)
function gStick(rule, best, cands) {
  const o = GPREV;
  if (!best || !o || o.here || o.rule !== rule || o.key === best.key) return gAt(rule, best);
  const old = cands.find(c => c.key === o.key); if (!old) return gAt(rule, best);
  return gAt(rule, dist(P.x, P.y, best.x, best.y) < .7 * dist(P.x, P.y, old.x, old.y) ? best : old);
}
// the piles the arrow may send you to, biggest first
const pileIds = () => Object.keys(S.piles).filter(id => S.piles[id] > 0).sort((a, b) => S.piles[b] - S.piles[a]);
function guideTarget(opts) {
  if (!S.tut.moved) return null;
  opts = opts || {};
  const sk = opts.skip || {};
  GPREV = opts.prev === undefined ? GUIDE : opts.prev;
  const free = freeRoom();
  // rules 12 / 17: the guests in line (at the counter or walking up to it) outnumber the clean empty rooms. Counting the
  // whole line, not only a head that has reached the counter, keeps the arrow steady while the line moves up (no jumping)
  const short = Q.length > GUEST_ROOMS.filter(roomFree).length;
  const coming = !S.unlocked.recep && Q.length > 0 && !!free;   // a guest at the counter or walking in, a room ready, nobody hired
  const L0 = playerWants(), L = sk.call || sk.vip ? L0.filter(w => !(sk.call && w.call) && !(sk.vip && w.vip)) : L0;
  const [ptx, pty] = tileOf(P), spd = playerSpeed(), v = sk.vip ? null : VIPG;
  const slots = sk.decor ? null : slotCands(), slotT = slots ? slots[0] || null : null;
  // 1. you're in the middle of a job: keep at it (no arrow)
  if (P.atDesk && (coming || deskHelp(free))) return gAt(1, T_DESK(true));
  for (const rm of ROOMS) if (S.rooms[rm.id] === 'messy' && inCleanZone(rm)) return gAt(1, T_CLEAN(rm, true));
  if (S.unlocked.onsen) {
    if (P.towels > 0 && S.basket < BASKET_MAX && inBasketZone()) return gAt(1, T_BASKET(true));
    if (P.towels < towelCap() && inShelfZone() && (S.unlocked.porter ? towelWanted() : (P.towels > 0 || S.basket <= 2 || towelWanted()))) return gAt(1, T_SHELF(true));
  }
  if (P.pouring && S.money > 0 && PADPOS.has(P.pouring) && !sk.pad && !(sk.decor && UNLOCK[P.pouring].decor)) return gAt(1, T_PAD(UNLOCK[P.pouring], true));
  for (const pk of PICKUPS) if (inZone(ZONE[pk.id]) && canPick(pk, L)) return gAt(1, T_PICK(pk.id, true, pk.k));   // picking up something wanted
  if (inZone(ZONE.stove)) { const sj = stoveJob(L); if (sj) return gAt(1, T_PICK('stove', true, sj.k)); }               // cooking something wanted
  if (P.giveTo) { const w = L.find(x => x.e === P.giveTo && x.k === P.giveK); if (w) return gAt(1, T_GIVE(w, true)); }   // handing it over
  if (v) {   // greeting the VIP / the photo (standing by it) / running its bath (on the tap)
    const k = vipWish(), near = dist(P.x, P.y, v.x, v.y) <= VIP_NEAR;
    if (v.st === 'carpet' && near && cleanSuite()) return gAt(1, T_VIP('vip', true));
    if (v.st === 'seated' && k === 'photo' && near) return gAt(1, T_VIP('photo', true));
    if (v.st === 'seated' && (k === 'stay' || k === 'show') && near) return gAt(1, T_VIP(k === 'stay' ? 'stay' : 'vip', true));   // v2.1 rare guests
    if (v.st === 'seated' && k === 'bath') { const rm = ROOM[v.suite]; if (ptx === rm.tap[0] && pty === rm.tap[1]) return gAt(1, T_TAP(rm, true)); }
  }
  if (slotT && ptx === slotT.at[0] && pty === slotT.at[1]) return gAt(1, T_SLOT(slotT, true));   // standing on the slot the arrow wants filled
  const gp = guidePads(sk);
  const rule6 = statueOk => {   // statueOk: the statue may come up (only at rule 6's own place, not when moved up)
    let best = null;
    const dP = u => { const [tx, ty] = padXY(u); return Math.abs(tx - ptx) + Math.abs(ty - pty); }, better = (u, o) => dP(u) < dP(o);
    const sg = u => !!u.gate && !!u.star;   // a gate that adds a star goes first (stage 4: not the shop - a side area)
    for (const u of gp) if (S.money >= padNeed(u) && (!best || (sg(u) && !sg(best)) || (sg(u) === sg(best) && better(u, best)))) best = u;
    const bu = boutiqueOpen() && !sk.pad ? boothHint() || (statueOk ? statueHint() : null) : null; if (bu && (!best || (!sg(best) && better(bu, best)))) best = bu;
    if (!best) return null;
    const same = gp.filter(u => S.money >= padNeed(u) && sg(u) === sg(best));
    if (best.booth) same.push(best);
    return gStick(6, T_PAD(best), same.map(u => T_PAD(u)));
  };
  // the cheapest visible progress pad's shortfall (rules 9 and 15)
  let need = 1e9; for (const u of gp) need = Math.min(need, padNeed(u));
  const piles = pileIds();
  const rule9 = () => {
    const dPl = id => { const [tx, ty] = PILE_AT[id]; return Math.abs(tx - ptx) + Math.abs(ty - pty); };
    const pays = piles.filter(id => S.money + S.piles[id] >= need).sort((a, b) => dPl(a) - dPl(b));
    return pays.length ? gStick(9, T_PILE(pays[0]), pays.map(T_PILE)) : null;
  };
  // 6 / 9 (moved up when nothing was bought for STALL_T s, 18.2): a slow player kept busy by chores (the VIP, deliveries)
  //   is sent to buy what it can afford, or to the pile that pays for it; the next purchase resets the clock
  if (S.stats.time - lastBuyAt >= STALL_T) { const t = rule6() || rule9(); if (t) return t; }
  // 2. the VIP follows you: it fell behind and stopped -> back to it; else -> into a clean empty suite
  if (v && v.st === 'follow') { if (v.halt) return gAt(2, T_VIP()); const rm = cleanSuite(); if (rm) return gAt(2, T_SUITE(rm)); }
  if (v && v.st === 'show') { const t = rareShowGuide(); if (t) return gAt(t.here ? 1 : 2, t); }   // v2.1: a rare guest follows you to its garden piece
  // 2b (v2.1, 16.4): the reporter at the front and nobody at the desk -> the desk; it waits for a towel -> towels (press.js)
  { const t = pressGuide(); if (t) return t; }
  // 3. something on the tray that someone waits for -> the VIP first (its wish never runs out, G1), else one of them who
  //    can still be reached in time (a Manhattan lower bound x 1.2): the nearest, unless the most urgent one gets tight
  //    (stage 4, 18.2); nobody in time: the tightest one that may still make it; else no arrow for it
  if (P.tray.length) {
    { const vw = L.find(w => w.vip && P.tray.includes(w.k)); if (vw) return gAt(3, T_GIVE(vw)); }
    let bw = null, late = null; const ok = [];
    for (const w of L) {
      if (!P.tray.includes(w.k)) continue;
      const t = wantTile(w), eta = (Math.abs(t[0] - ptx) + Math.abs(t[1] - pty)) * TILE / spd;
      if (eta * 1.2 < w.left) { ok.push(w); w.eta = eta; if (!bw || w.left < bw.left) bw = w; } else if (eta < w.left && (!late || w.left > late.left)) late = w;
    }
    if (bw && bw.left - bw.eta * 1.2 >= DELIVER_SLACK) for (const w of ok) if (w.eta < bw.eta) bw = w;   // nearest first
    if (bw) return gStick(3, T_GIVE(bw), ok.map(w => T_GIVE(w)));
    if (late) return gAt(3, T_GIVE(late));
  }
  // 4. a fish pile two or three steps away is always worth grabbing (the desk pile, a room's tip)
  { const near = [], was = GPREV && GPREV.rule === 4 && !GPREV.here ? GPREV.id : null;
    for (const id in S.piles) if (id !== 'recep' && (S.piles[id] >= NEAR_MIN[star()] || (id === was && S.piles[id] > 0))) {
      const lim = id === was ? 6 : 4;   // hysteresis: the pile already shown stays while it is <= 5 steps away (walking past
      const [tx, ty] = PILE_AT[id]; if (Math.abs(tx - ptx) + Math.abs(ty - pty) >= lim) continue;   // it must not flicker)
      const p = findPath(ptx, pty, tx, ty); if (p && p.length < lim) near.push([p.length, id]);
    }
    if (near.length) { near.sort((a, b) => a[0] - b[0]); return gStick(4, T_PILE(near[0][1]), near.map(n => T_PILE(n[1]))); } }
  // 5. towels on your head (before the porter): finish the run while the need that started it still holds
  if (S.unlocked.onsen && P.towels > 0 && towelHelp()) return gAt(5, T_BASKET(false));   // v2.2: with the porter too while someone waits for a towel
  // 8 (moved up: the first VIP ever all the way, later a wish that has waited VIP_URGENT s - G1): ahead of the pads; a
  //   fresh wish of a later VIP waits for them (a pad is a few seconds away)
  if (vipLeads(v)) { const t = vipGuide(); if (t) return gAt(8, t); }
  // 14 (moved up while a pointed-at combo has never been made and you own both pieces, 18.2): a one-off, two short
  //   stands; ahead of the pads for COMBO_RUSH s per combo at most, then back in its place
  if (slotT && comboRush()) return gStick(14, T_SLOT(slotT), slots.map(sl => T_SLOT(sl)));
  // 6. a price pad you can afford: a star gate first, else the nearest (stage 4: was the cheapest); a booth piece once (4.11);
  //    the statue once nothing else is left to buy in the boutique (18.2)
  { const t = rule6(true); if (t) return t; }
  // 7. a guest is at the counter or walking in, a room is ready, nobody is serving
  if (coming) return gAt(7, T_DESK(false));
  // 8. the VIP: greet it (no clean suite: clean one), or its current wish
  if (v) { const t = vipGuide(); if (t) return gAt(8, t); }
  // 8b (v2.2, 19.2): a long line at the desk and rooms ready - help the receptionist (two check in twice as fast)
  if (deskHelp(free)) return gAt(7, T_DESK(false));
  const r11 = () => {   // 11. breakfast (see below)
    if (!S.unlocked.dining || !L.some(w => w.seat)) return null;
    const nr = wantCount('rice', L) - heldCount('rice');
    if (!hasChef() && nr - PASS.n > 0 && (hasWaiter() || P.tray.length < trayCap())) return gAt(11, T_PICK('stove', false, 'rice'));
    if (!hasWaiter() && PASS.n > 0 && nr > 0 && P.tray.length < trayCap()) return gAt(11, T_PICK('pass', false, 'rice'));
    return null;
  };
  // 9a (v2.2, 19.2): a full pile has stopped filling - the nearest one (with the clerk: only the cash box, the rest is his)
  { const clerkOn = STAFF.some(s => s.role === 'clerk'), full = piles.filter(id => pileFull(id) && (!clerkOn || id === 'recep'));
    if (full.length) { const c = full.map(T_PILE).sort((a, b) => dist(P.x, P.y, a.x, a.y) - dist(P.x, P.y, b.x, b.y)); return gStick(9, c[0], c); } }
  // 9. a fish pile that would pay for a pad: the nearest such pile (stage 4: was the biggest - a long walk across the map)
  { const t = rule9(); if (t) return t; }
  // 11 (moved up while there is no chef, 18.2): the diners' rice before the calls - with only you cooking they go hungry
  //   otherwise; the pads (6) and the piles that pay for them (9) still come first, so the chef gets bought
  if (!hasChef()) { const t = r11(); if (t) return t; }
  // 10. (v2.0.1 G3: gone - a call is an optional tip the arrow never sends you for; the tea runner brings them. The
  //     VIP's tea / kaiseki pick-up is rule 8.)
  // 11. breakfast: diners wait and nobody else covers them -> the stove (no chef; with a waiter the innkeeper cooks onto
  //     the counter for him - 18.2) or the counter (rice on it, no waiter; the tray then goes by rule 3)
  { const t = r11(); if (t) return t; }
  // 12. a guest is stuck because no room is clean, and the maids can't keep up -> the nearest messy room. Once shown, the
  //     room stays while it is messy and someone is in line (a check-in or a maid finishing elsewhere must not flip the
  //     arrow to a pile and back)
  if (short) {
    const messy = GUEST_ROOMS.filter(rm => S.rooms[rm.id] === 'messy');
    if (messy.length > maidCount()) {
      const c = messy.map(rm => T_CLEAN(rm, false)).sort((a, b) => dist(P.x, P.y, a.x, a.y) - dist(P.x, P.y, b.x, b.y));
      return gStick(12, c[0], c);
    }
  }
  if (GPREV && GPREV.rule === 12 && !GPREV.here && Q.length) { const rm = ROOM[GPREV.key.slice(6)]; if (rm && S.rooms[rm.id] === 'messy') return gAt(12, T_CLEAN(rm, false)); }
  // 13. towels (until the porter is hired): basket low or a guest waiting for one
  if (S.unlocked.onsen && towelHelp()) return gAt(13, P.towels > 0 ? T_BASKET(false) : T_SHELF(false));
  // 14. decor: complete a combo the arrow may point at, else dress an empty room's A slot (nearest first)
  if (slotT) return gStick(14, T_SLOT(slotT), slots.map(sl => T_SLOT(sl)));
  // 15. the biggest fish pile - only one worth the walk: >= 20 fish and >= 20 % (stage 4: 10 %) of what the cheapest pad
  //     still lacks. v2.0.1: once the clerk is hired the other piles are his round - you only go for the cash box he
  //     fills, and only when it pays a third of that shortfall (with the calls gone to the tea runner this rule had
  //     become a fish-fetching loop: C1 56 %)
  { const clerkOn = STAFF.some(s => s.role === 'clerk'), min = Math.max(PILE_MIN, need < 1e9 ? (clerkOn ? .33 : .2) * (need - S.money) : 0), big = piles.filter(id => S.piles[id] >= min && (!clerkOn || id === 'recep'));
    if (big.length) return gStick(15, T_PILE(big[0]), big.map(T_PILE)); }
  // 16. you have fish: the cheapest visible pad (part payment is kept); standing on it = here. With 0 fish, no pad.
  //     v2.1: not the star-5 sinks (shrine, garden pieces, plaza): the arrow shows one when you can pay it all (rule 6) -
  //     till then the purse is yours to save up for what you like (an outfit, the next offering)
  const gp16 = gp.filter(u => !u.v21b);
  if (S.money > 0 && gp16.length) {
    let best = null; for (const u of gp16) if (!best || padNeed(u) < padNeed(best)) best = u;
    const [tx, ty] = padXY(best);
    if (ptx === tx && pty === ty) return gAt(1, T_PAD(best, true));
    return gStick(16, T_PAD(best), gp16.filter(u => padNeed(u) <= padNeed(best) * 1.3).map(u => T_PAD(u)));
  }
  // 17. a guest waits and every room is taken: stand by the room whose sleeper wakes first (it needs cleaning next)
  if (Q.length && !free) {
    let bm = null; for (const rm of GUEST_ROOMS) { const gu = RT[rm.id].guest; if (gu && gu.st === 'sleep' && (!bm || gu.tt < RT[bm.id].guest.tt)) bm = rm; }
    if (bm) return gAt(inCleanZone(bm) ? 1 : 17, T_CLEAN(bm, inCleanZone(bm)));
  }
  // the last things before nothing (v2.0.1, star < 5 - after star 5 the arrow may rest; C4): a messy room no maid has
  //    taken yet (the nearest - rooms turn over sooner), else the biggest pile >= 20 (with the clerk on his round: only
  //    the cash box he fills)
  if (star() < 5) {
    const mess = GUEST_ROOMS.filter(rm => roomOpen(rm) && S.rooms[rm.id] === 'messy' && !RT[rm.id].claim).map(rm => T_CLEAN(rm, false)).sort((a, b) => dist(P.x, P.y, a.x, a.y) - dist(P.x, P.y, b.x, b.y));
    if (mess.length) return gStick(17, mess[0], mess);
    const clerkOn = STAFF.some(s => s.role === 'clerk'), big = piles.filter(id => S.piles[id] >= PILE_MIN && (!clerkOn || id === 'recep'));
    if (big.length) return gStick(15, T_PILE(big[0]), big.map(T_PILE));
  }
  // 18. nothing: no arrow (common after star 5: walk around freely)
  return null;
}
// the 7x7-ish icon beside the arrow (and on the tail of the edge arrow): what you go there for (6), no words
function guideIcon(gt) {
  switch (gt.kind) {
    case 'deliver': return gt.vip ? bubbleArt(gt.item, 0, true) : itemIcon(gt.item || 'tea');   // for the VIP: its gold wish bubble (G1)
    case 'urn': case 'milk': case 'pass': case 'stove': return gt.vip ? routeIcon(gt.item, STATION_ICON[gt.key.slice(5)] || 'urn') : itemIcon(gt.item || PICK_ITEM[gt.kind] || 'tea');   // v2.2: the VIP's [station] > [item], as in its bubble
    case 'pile': return fishIcon();
    case 'basket': case 'shelf': return towelArt();
    case 'clean': return broomIcon();
    case 'desk': return bellIcon();
    case 'vip': case 'suite': return starIcon(true, true);
    case 'showto': return gzIcon(gt.piece);   // v2.1: leading a rare guest to its garden piece
    case 'photo': return menuIcon('camera');
    case 'tap': return stationIcon('tub');   // v2.2: the VIP's bath: the tub you run (vipguide.js)
    case 'slot': { const sl = DSLOTS.find(s => s.key === gt.slot), id = sl && slotPiece(sl); return id ? decorIcon(id) : padIcon('decor'); }
    case 'pad': return gt.id ? unlockIcon(UNLOCK[gt.id]) : padIcon('room');
  }
  return null;
}
const PICK_ITEM = { urn: 'tea', milk: 'milk', pass: 'rice', stove: 'rice' };
// a tiny broom for "clean" (no art contract entry: core-drawn, 7x7 + outline)
function broomIcon() { return art('core:broom', () => rows(['....H', '...H.', '.SH..', 'SSS..', 'SS...'], { H: '#a06a3a', S: '#e8c060' })); }
let GUIDE = null, guideClock = 0;
// guest thought bubbles (icons only); urgency 0/1/2 = white / orange / red rim
const urgOf = fr => fr > .6 ? 0 : fr > .3 ? 1 : 2;
function bubbles() {
  const manned = deskManned(), free = !!freeRoom();
  let worst = 0; for (const q of Q) if (q.st === 'queue') worst = Math.max(worst, urgOf(q.pat / PATIENCE));
  for (const gu of GUESTS) {
    let b = null, u = 0;
    if (gu.st === 'queue') {
      // only the front guest gets a bubble (one over each guest covered the face of the guest ahead); its rim shows
      // the most impatient guest in the line. Thresholds stay absolute: early guests' 70 s read white until 27 s are left.
      if (gu === Q[0] && gu.ready) { u = worst; if (!free) b = 'bed'; else if (!manned && gu.front > .6) b = 'dots'; }
    } else if (gu.st === 'towel') { b = 'towel'; u = urgOf(gu.wait / BATH_WAIT); }
    else if (gu.st === 'toSlot' && gu.slot < 0 && gu.wait < BATH_WAIT * .6) { b = 'dots'; u = urgOf(gu.wait / BATH_WAIT); }
    else if (gu.st === 'milk') b = 'milk';
    else if (gu.st === 'tea') b = 'tea';
    else if (gu.st === 'angry') { b = 'angry'; u = 2; }
    else if (gu.st === 'seated' && !gu.served) { b = 'rice'; u = urgOf(1 - gu.t / SEAT_WAIT); }
    if (gu.embT > 0) { b = 'emb'; u = 0; }                // the room's emblem right after check-in (2.6)
    else if (gu.heart2 > 0) { b = 'heart2'; u = 0; }      // favourite room: a sparkly heart (4.6)
    else if (gu.heart > 0) { b = 'heart'; u = 0; }
    gu.bub = b; gu.urg = u;
  }
}
