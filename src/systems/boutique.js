// ============================================================ star 5: the tanuki's boutique + the golden statue (4.11)
// From star 5 (with the shop open) the "preparing" curtain is gone: a hat booth (5,33), a pet booth (7,33), the mirror
// (stand at (2,33)) and the pet cushion (8,34). Within 2 tiles of a booth you try its piece on before buying: the hat sits
// on your head (two sparkles), the pet's ghost walks at your feet; walk away and it's off. Bought = worn / brought along.
// The mirror switches to the next owned hat (incl. none) every 1 s while you stand there, the cushion the next pet; walk
// off and it stays. Towels on your head: no hat. Pets follow you on the crumb follower (like the VIP). The covered
// golden statue by the door is the big money sink: the cloth slides down as you pour (the arrow points at it only once
// every hat and pet is bought, 18.2).
const boutiqueOpen = () => star() >= 5 && !!S.unlocked.shop;
const TRY = { hat: null, pet: null, outfit: null, uniform: null, ids: '' };   // what you try on at the booths right now (runtime; v2.1: + outfit / uniform)
const TRIED = new Set();                       // booth pieces the tanuki already offered (K03, once each)
const BOOTH = new Map();                       // booth piece -> { t: s pointed at, near: came to look, done } (6 rule 6: once)
const MIRROR = { t: 0 }, CUSHION = { t: 0 };
let PET = null, boutiqueWas = false, quackT = -99, goldT = 0, k02Pend = false;   // k02Pend: K02 not heard yet (said when you come by the owner)
const shopOwner = () => STAFF.find(s => s.role === 'owner') || null;
const hatOf = id => id && UNLOCK[id] ? UNLOCK[id].hat || null : null;
const petOf = id => id && UNLOCK[id] ? UNLOCK[id].pet || null : null;
const boothOf = id => { let b = BOOTH.get(id); if (!b) { b = { t: 0, near: false, done: false }; BOOTH.set(id, b); } return b; };
function boutiqueOpened() {   // star 5 with the shop open (or the shop bought at star 5): K02, the try-on card, a "new" tag
  POPA.boutique = T; k02Pend = !lineSay(shopOwner(), 'K02'); firstTime('tryon'); edgeNew(HAT_PAD[0], HAT_PAD[1], 'hat'); news('boutique');
}
function boutiqueZone(dt, ptx, pty) {
  TRY.hat = TRY.pet = TRY.outfit = TRY.uniform = null;
  if (!boutiqueOpen()) { MIRROR.t = CUSHION.t = 0; TRY.ids = ''; return; }
  let ids = '';
  for (const [id, xy] of PADPOS) {
    const u = UNLOCK[id]; if (!u.hat && !u.pet && !u.outfit && !u.uniform) continue;
    const b = boothOf(id);
    if (dist(P.x, P.y, tcx(xy), tcy(xy)) <= TRYON_R) {
      if (b.t > 0) b.near = true;   // the arrow brought you here (a piece you only walk past is still pointed at later)
      ids += id + ',';
      if (u.hat) TRY.hat = u.hat; else if (u.pet) TRY.pet = u.pet; else if (u.outfit) TRY.outfit = u.outfit; else TRY.uniform = u.uniform;   // v2.1: outfits, uniforms
      if (!TRIED.has(id)) { TRIED.add(id); lineSay(shopOwner(), 'K03'); }
      firstDone('tryon');
    } else if (b.near) b.done = true;   // came to look and walked off without buying: the arrow won't point at it again
  }
  if (ids && ids !== TRY.ids) { sfx('tryon'); fxSpark(P.x, P.y - 20, 2); }
  TRY.ids = ids;
  MIRROR.t = ptx === SPOT.mirror[0] && pty === SPOT.mirror[1] ? MIRROR.t + dt : 0;
  if (MIRROR.t >= MIRROR_T - 1e-6) { MIRROR.t = 0; cycleEquip('hat'); }
  CUSHION.t = ptx === SPOT.petCushion[0] && pty === SPOT.petCushion[1] ? CUSHION.t + dt : 0;
  if (CUSHION.t >= MIRROR_T - 1e-6) { CUSHION.t = 0; cycleEquip('pet'); }
}
// the mirror / the cushion: the next owned hat / pet, "none" included (nothing owned: nothing happens)
function cycleEquip(k) {
  const own = UNLOCKS.filter(u => u[k] && S.unlocked[u.id]).map(u => u.id); if (!own.length) return;
  const L = [null].concat(own), i = L.indexOf(S.equip[k]);
  S.equip[k] = L[(i + 1) % L.length]; sfx('tryon'); fxSpark(P.x, P.y - (k === 'hat' ? 22 : 2), 3); firstDone('tryon'); markDirty();
}
// the statue for rule 6 (18.2): once every hat and pet is bought, whenever you hold >= STATUE_HINT fish (pour it in)
const STATUE_HINT = 50000;
function statueHint() {
  if (!PADPOS.has('statue') || S.money < STATUE_HINT) return null;
  for (const u of UNLOCKS) if ((u.hat || u.pet || u.outfit || u.uniform) && !S.unlocked[u.id] && (!u.ok || u.ok())) return null;   // v2.1: every booth piece on sale
  return UNLOCK.statue;
}
// rule 6 of the arrow: a booth piece is pointed at once, the first time you can afford it (cheapest first)
function boothHint() {
  let best = null;
  for (const [id] of PADPOS) {
    const u = UNLOCK[id]; if (!u.hat && !u.pet && !u.outfit && !u.uniform) continue;
    if (boothOf(id).done || S.money < padNeed(u) || padLocked(u)) continue;
    if (!best || padNeed(u) < padNeed(best)) best = u;
  }
  return best;
}
// the pet (S.equip.pet) walks the innkeeper's crumbs PET_GAP px behind; after a jump (a load, a test) it pops back to you
function updPet(dt) {
  // the gold bell headband: a trail of slow gold glints while you walk (4.11)
  if (hatOf(S.equip.hat) === 'goldband' && P.moving && !P.towels) { goldT -= dt; if (goldT <= 0) { goldT = .3; FX.push({ k: 'vtrail', x: P.x + rand(-4, 4), y: P.y - rand(3, 12), t: 0, life: 1 }); } }
  const k = petOf(S.equip.pet);
  if (!k) { PET = null; return; }
  if (!PET || PET.kind !== k || dist(P.x, P.y, PET.x, PET.y) > 160) PET = { kind: k, x: P.x - 10, y: P.y + 1, dir: P.dir, moving: false, walkT: 0, q: [], idle: 0 };
  crumbTo(P, PET); followStep(PET, P, PET_GAP, playerSpeed() * 1.15, dt);
  PET.idle = PET.moving ? 0 : PET.idle + dt;
}
// the innkeeper's look: the hat you try on, else the one you wear; none under towels (one cached object per hat)
// v2.1 (16.6): + the outfit (look.outfit o_yukata ...; shirt = its colour until the character art draws the outfit)
const PLOOK = new Map();
function lookWith(hat, outfit) {
  if (!hat && !outfit) return PLAYER_LOOK;
  const k = (hat || '') + '|' + (outfit || ''); let l = PLOOK.get(k);
  if (!l) { l = Object.assign({}, PLAYER_LOOK, { hat: hat || null }, outfit ? { outfit, shirt: OUTFIT_SHIRT[outfit] } : {}); PLOOK.set(k, l); }
  return l;
}
const playerLook = () => lookWith(P.towels > 0 ? null : TRY.hat || hatOf(S.equip.hat), TRY.outfit || outfitOf(S.equip.outfit));
const equipLook = () => lookWith(hatOf(S.equip.hat), outfitOf(S.equip.outfit));
