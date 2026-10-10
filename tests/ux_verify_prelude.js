// UX-audit verifier prelude: candidate fixes overridden inside the closure (index.html untouched).
// Concatenate in front of tests/bot.js, tests/newplayer.js or tests/towelrun.js and pass flags as extra ARGS:
//   fixguide : guideTarget() rewritten as ONE ordered list (desk-early, towel lock, pad-when-you-have-fish, wait-at-room)
//   fixtowel : only the towel lock added to the current guideTarget()
//   pat70    : queue patience 70 s until the receptionist is hired
//   nofill   : with fixguide, drop rule 7' (cheapest pad when money > 0)    nowait : drop rule 8 (wait at the room)
// Build + run (bash):  cat tests/ux_verify_prelude.js tests/bot.js > $TMP/x.js && node headless.js . $TMP/x.js --seed 1 -- eager 50 fixguide pat70
const towelLock = () => S.unlocked.onsen && !S.unlocked.porter && P.towels > 0 && S.basket < BASKET_MAX && (ARGS.includes('lock1') || S.basket <= 2 || towelWanted());
const UXF = ARGS.filter(a => /^(fixguide|fixtowel|pat70|nofill|nowait|lock1|nolock|padsmv)$/.test(a));
if (UXF.includes('pat70')) { const add0 = addGuest; addGuest = function () { add0(); if (!S.unlocked.recep) GUESTS[GUESTS.length - 1].pat = 70; }; }
if (UXF.includes('fixtowel')) { const g0 = guideTarget; guideTarget = function () {
  const r = g0(); if (!r || r.here || r.kind === 'pile' && r.tx !== undefined && Math.abs(r.tx - tileOf(P)[0]) + Math.abs(r.ty - tileOf(P)[1]) < 4) return r;
  if (towelLock()) return T_BASKET(inBasketZone());
  return r;
}; }
if (UXF.includes('fixguide')) guideTarget = function () {
  if (!S.tut.moved) return null;
  const f = Q[0], waiting = !!(f && f.st === 'queue' && f.ready), free = freeRoom();
  const coming = !S.unlocked.recep && Q.length > 0 && !!free;   // a guest at the counter or walking in, a room ready, nobody hired
  // 0. you're in the middle of a job: keep at it
  if (P.atDesk && coming) return T_DESK(true);
  for (const rm of ROOMS) if (S.rooms[rm.id] === 'messy' && inCleanZone(rm)) return T_CLEAN(rm, true);
  if (S.unlocked.onsen) {
    if (P.towels > 0 && S.basket < BASKET_MAX && inBasketZone()) return T_BASKET(true);
    if (!S.unlocked.porter && P.towels < towelCap() && inShelfZone() && (P.towels > 0 || S.basket <= 2 || towelWanted())) return T_SHELF(true);
  }
  if (P.pouring && S.money > 0) return T_PAD(UNLOCK[P.pouring], true);
  // 1. a pile 1-3 steps away
  const [ptx, pty] = tileOf(P); let near = null, nd = 4;
  for (const id in S.piles) if (S.piles[id] > 0) {
    const [tx, ty] = PILE_AT[id]; if (Math.abs(tx - ptx) + Math.abs(ty - pty) >= nd) continue;
    const p = findPath(ptx, pty, tx, ty); if (p && p.length < nd) { nd = p.length; near = id; }
  }
  if (near) return T_PILE(near);
  // 1b. towels on your head: deliver them (keep doing the job you're doing)
  if (!UXF.includes('nolock') && towelLock()) return T_BASKET(false);
  // 5. the cheapest pad you can afford
  let best = null;
  for (const u of UNLOCKS) if (padVisible(u) && S.money >= padNeed(u) && (!best || padNeed(u) < padNeed(best))) best = u;
  if (best) return T_PAD(best);
  // 2. a guest at the counter or on the way, a room ready, nobody at the desk
  if (coming) return T_DESK(false);
  // 3. a guest is stuck because no room is clean
  if (waiting && !free) {
    const messy = ROOMS.filter(rm => S.rooms[rm.id] === 'messy');
    if (messy.length > maidCount()) {
      let bm = null, bd = 1e9;
      for (const rm of messy) { const c = futonC(rm), d = dist(P.x, P.y, c[0], c[1]); if (d < bd) { bd = d; bm = rm; } }
      return T_CLEAN(bm, false);
    }
  }
  // 4. towels (until the porter): basket low or a guest waiting for one
  if (S.unlocked.onsen && !S.unlocked.porter && (S.basket <= 2 || towelWanted())) return P.towels > 0 ? T_BASKET(false) : T_SHELF(false);
  // 6. the biggest pile
  let pid = null;
  for (const id in S.piles) if (S.piles[id] > 0 && (!pid || S.piles[id] > S.piles[pid])) pid = id;
  if (pid) return T_PILE(pid);
  // 7'. you have fish: the cheapest visible pad (part payment is kept); standing on it = here
  if (S.money > 0 && !UXF.includes('nofill')) {
    for (const u of UNLOCKS) if (padVisible(u) && (!best || padNeed(u) < padNeed(best))) best = u;
    if (best) return T_PAD(best, ptx === best.pad[0] && pty === best.pad[1]);
  }
  // 8. a guest waits for a room: stand by the room whose sleeper wakes first
  if (waiting && !free && !UXF.includes('nowait')) {
    let bm = null; for (const rm of ROOMS) { const gu = RT[rm.id].guest; if (gu && gu.st === 'sleep' && (!bm || gu.tt < RT[bm.id].guest.tt)) bm = rm; }
    if (bm) return T_CLEAN(bm, inCleanZone(bm));
  }
  return null;
};
// padsmv : lobby pads into cols 9-10 + milk pad beside the machine (the audit's pads-off-camera fix)
if (UXF.includes('padsmv')) { const MV = { recep: [9, 25], maid1: [9, 25], maid2: [9, 25], porter: [10, 25], shoes1: [9, 28], shoes2: [9, 28], shoes3: [9, 28], basket1: [10, 28], basket2: [10, 28], milk: [10, 5] };
  for (const u of UNLOCKS) if (MV[u.id]) { u.pad = MV[u.id]; if (u.id !== 'milk') u.at = [u.pad[0] * TILE + 8, u.pad[1] * TILE + 8]; } }
if (UXF.length) console.log('ux fixes: ' + UXF.join(' '));
