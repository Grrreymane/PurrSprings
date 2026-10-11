// ============================================================ guide (arrow) + hints + bubbles
// The single "what next" brain (SPEC_v2 6): the arrow draws it, the balance bots walk it. Every target carries the rule
// it came from (`rule` = the row of the 6 table, 1 = "here": you're already doing it, no arrow) and a `key` (what it
// points at). The rules are checked in table order, so a lower rule number = higher priority. Deviations (18.2): rule 3's
// "in time" uses a Manhattan lower bound and takes the nearest in-time want first; stage 4 moves some rules up at times -
// 6 / 9 after STALL_T s without a purchase, 8 when a seated VIP's wish gets late, 14 for a pointed-at combo never made
// yet (COMBO_RUSH s), 11 before 9 / 10 while there is no chef; rule 6 takes the nearest affordable pad (star gates
// first). Booths (hats / pets) only by rule 6 (once each); the statue by rule 6 once every hat and pet is bought; hidden
// combos only once hinted (gold stars, 18.2); the mirror and the pet cushion never.
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
// the pad under a locked tile (just bought there, you haven't stepped off): not pointed at - it would show your own tile
const padLocked = u => { const xy = P.padLock && padXY(u); return !!xy && xy[0] === P.padLock[0] && xy[1] === P.padLock[1]; };
const guidePads = sk => sk && sk.pad ? [] : visiblePads().filter(u => !u.booth && !padLocked(u) && !(sk && sk.decor && u.decor));
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
const T_TAP = (rm, here) => gT('tap', tcx(rm.tap), tcy(rm.tap), rm.tap[0], rm.tap[1], here, 'tap:' + rm.id);
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
  if ((k === 'tea' || k === 'kaiseki') && !P.tray.includes(k) && P.tray.length < trayCap()) { const s = sourceOf(k, tileOf(P)); if (s) return T_PICK(s, false, k); }
  return null;
}
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
  const L0 = trayWants(), L = sk.call || sk.vip ? L0.filter(w => !(sk.call && w.call) && !(sk.vip && w.vip)) : L0;
  const [ptx, pty] = tileOf(P), spd = playerSpeed(), v = sk.vip ? null : VIPG;
  const slots = sk.decor ? null : slotCands(), slotT = slots ? slots[0] || null : null;
  // 1. you're in the middle of a job: keep at it (no arrow)
  if (P.atDesk && coming) return gAt(1, T_DESK(true));
  for (const rm of ROOMS) if (S.rooms[rm.id] === 'messy' && inCleanZone(rm)) return gAt(1, T_CLEAN(rm, true));
  if (S.unlocked.onsen) {
    if (P.towels > 0 && S.basket < BASKET_MAX && inBasketZone()) return gAt(1, T_BASKET(true));
    if (!S.unlocked.porter && P.towels < towelCap() && inShelfZone() && (P.towels > 0 || S.basket <= 2 || towelWanted())) return gAt(1, T_SHELF(true));
  }
  if (P.pouring && S.money > 0 && PADPOS.has(P.pouring) && !sk.pad && !(sk.decor && UNLOCK[P.pouring].decor)) return gAt(1, T_PAD(UNLOCK[P.pouring], true));
  for (const pk of PICKUPS) if (inZone(ZONE[pk.id]) && canPick(pk, L)) return gAt(1, T_PICK(pk.id, true, pk.k));   // picking up something wanted
  if (inZone(ZONE.stove)) { const sj = stoveJob(L); if (sj) return gAt(1, T_PICK('stove', true, sj.k)); }               // cooking something wanted
  if (P.giveTo) { const w = L.find(x => x.e === P.giveTo && x.k === P.giveK); if (w) return gAt(1, T_GIVE(w, true)); }   // handing it over
  if (v) {   // greeting the VIP / the photo (standing by it) / running its bath (on the tap)
    const k = vipWish(), near = dist(P.x, P.y, v.x, v.y) <= VIP_NEAR;
    if (v.st === 'carpet' && near && cleanSuite()) return gAt(1, T_VIP('vip', true));
    if (v.st === 'seated' && k === 'photo' && near) return gAt(1, T_VIP('photo', true));
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
  // 3. something on the tray that someone waits for -> one of them who can still be reached in time (a Manhattan lower
  //    bound x 1.2): the nearest, unless the most urgent one gets tight (stage 4, 18.2); nobody in time: the tightest one
  //    that may still make it; else no arrow for it
  if (P.tray.length) {
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
  if (S.unlocked.onsen && !S.unlocked.porter && P.towels > 0 && (S.basket <= 2 || towelWanted())) return gAt(5, T_BASKET(false));
  // 8 (moved up while the VIP is seated and its wish has VIP_URGENT s left, 18.2): it leaves after VIP_IDLE s without
  //   progress, so a late wish beats the pads; a fresh one waits for them (a pad is a few seconds away)
  if (v && v.st === 'seated' && v.t >= VIP_IDLE - VIP_URGENT) { const t = vipGuide(); if (t) return gAt(8, t); }
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
  const r11 = () => {   // 11. breakfast (see below)
    if (!S.unlocked.dining || !L.some(w => w.seat)) return null;
    const nr = wantCount('rice', L) - heldCount('rice');
    if (!hasChef() && nr - PASS.n > 0 && (hasWaiter() || P.tray.length < trayCap())) return gAt(11, T_PICK('stove', false, 'rice'));
    if (!hasWaiter() && PASS.n > 0 && nr > 0 && P.tray.length < trayCap()) return gAt(11, T_PICK('pass', false, 'rice'));
    return null;
  };
  // 9. a fish pile that would pay for a pad: the nearest such pile (stage 4: was the biggest - a long walk across the map)
  { const t = rule9(); if (t) return t; }
  // 11 (moved up while there is no chef, 18.2): the diners' rice before the calls - with only you cooking they go hungry
  //   otherwise; the pads (6) and the piles that pay for them (9) still come first, so the chef gets bought
  if (!hasChef()) { const t = r11(); if (t) return t; }
  // 10. a call nobody is bringing yet that can still be served in time -> where its thing is picked up
  //     ((path to the pick-up + path on to the guest) x 16 / speed x 1.2 < time left); late ones are not pointed at
  if (P.tray.length < trayCap()) {
    const calls = L.filter(w => (w.call || w.give) && wantCount(w.k, L) - heldCount(w.k) > 0).sort((a, b) => a.left - b.left), ok = [];
    for (const w of calls.slice(0, 3)) {
      const s = sourceOf(w.k, [ptx, pty]); if (!s) continue;
      const pt = PICK_TILE[s], n = tilesBetween([ptx, pty], pt) + tilesBetween(pt, wantTile(w));
      if (n * TILE / spd * 1.2 < w.left && !ok.some(t => t.key === 'pick:' + s)) ok.push(T_PICK(s, false, w.k));
    }
    if (ok.length) return gStick(10, ok[0], ok);
  }
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
  if (S.unlocked.onsen && !S.unlocked.porter && (S.basket <= 2 || towelWanted())) return gAt(13, P.towels > 0 ? T_BASKET(false) : T_SHELF(false));
  // 14. decor: complete a combo the arrow may point at, else dress an empty room's A slot (nearest first)
  if (slotT) return gStick(14, T_SLOT(slotT), slots.map(sl => T_SLOT(sl)));
  // 15. the biggest fish pile - only one worth the walk: >= 20 fish and >= 10 % of what the cheapest pad still lacks
  { const min = Math.max(PILE_MIN, need < 1e9 ? .1 * (need - S.money) : 0), big = piles.filter(id => S.piles[id] >= min);
    if (big.length) return gStick(15, T_PILE(big[0]), big.map(T_PILE)); }
  // 16. you have fish: the cheapest visible pad (part payment is kept); standing on it = here. With 0 fish, no pad.
  if (S.money > 0 && gp.length) {
    let best = null; for (const u of gp) if (!best || padNeed(u) < padNeed(best)) best = u;
    const [tx, ty] = padXY(best);
    if (ptx === tx && pty === ty) return gAt(1, T_PAD(best, true));
    return gStick(16, T_PAD(best), gp.filter(u => padNeed(u) <= padNeed(best) * 1.3).map(u => T_PAD(u)));
  }
  // 17. a guest waits and every room is taken: stand by the room whose sleeper wakes first (it needs cleaning next)
  if (Q.length && !free) {
    let bm = null; for (const rm of GUEST_ROOMS) { const gu = RT[rm.id].guest; if (gu && gu.st === 'sleep' && (!bm || gu.tt < RT[bm.id].guest.tt)) bm = rm; }
    if (bm) return gAt(inCleanZone(bm) ? 1 : 17, T_CLEAN(bm, inCleanZone(bm)));
  }
  // 18. nothing: no arrow (common after star 5: walk around freely)
  return null;
}
// the 7x7-ish icon beside the arrow (and on the tail of the edge arrow): what you go there for (6), no words
function guideIcon(gt) {
  switch (gt.kind) {
    case 'deliver': case 'urn': case 'milk': case 'pass': case 'stove': return itemIcon(gt.item || PICK_ITEM[gt.kind] || 'tea');
    case 'pile': return fishIcon();
    case 'basket': case 'shelf': return towelArt();
    case 'clean': return broomIcon();
    case 'desk': return bellIcon();
    case 'vip': case 'suite': return starIcon(true, true);
    case 'photo': return menuIcon('camera');
    case 'tap': return padIcon('onsen');
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
    else if (gu.st === 'angry') { b = 'angry'; u = 2; }
    else if (gu.st === 'seated' && !gu.served) { b = 'rice'; u = urgOf(1 - gu.t / SEAT_WAIT); }
    if (gu.embT > 0) { b = 'emb'; u = 0; }                // the room's emblem right after check-in (2.6)
    else if (gu.heart2 > 0) { b = 'heart2'; u = 0; }      // favourite room: a sparkly heart (4.6)
    else if (gu.heart > 0) { b = 'heart'; u = 0; }
    gu.bub = b; gu.urg = u;
  }
}
