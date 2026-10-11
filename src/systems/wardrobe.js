// ============================================================ v2.1 the full boutique (SPEC_v2 16.6), core B
// From star 5 the shop has two more booths beside the hat / pet ones: the innkeeper's outfits (3,34) and the staff's
// uniforms (5,34) - one piece at a time, the cheapest first, tried on within 2 tiles (boutiqueZone): an outfit on you, a
// uniform on every staff cat on screen and on a ghost of the receptionist at your side. Bought = worn. Three more pets
// (fox, tanuki - now and then a paper lantern - and a white crane) queue at the pet booth. Gold decor (20,000 each, in the
// shop's decor pads once a combo with that piece is found) gilds the piece in every room; a combo with a gold piece in it
// pays x2.0 instead of x1.6. The menu's 「装扮」 page (ui/menu-v21b.js) changes what you wear with a tap.
// Data: data/tables-v21b.js. Hooks: boutique.js (lookWith / try-on / booth hint), entities.js (staffLook), unlock.js
// (unlockB), render-world.js (gold decor, drawPet), state-save.js (roomMult, padsUpdate, loadStateB).
const outfitOf = id => id && UNLOCK[id] ? UNLOCK[id].outfit || null : null;
const uniformOf = id => id && UNLOCK[id] ? UNLOCK[id].uniform || null : null;
const GOLD_ID = NUL(); GOLD_B.forEach(([id, , base]) => { GOLD_ID[base] = id; });
const goldOwned = base => !!base && !!GOLD_ID[base] && !!S.unlocked[GOLD_ID[base]];
const goldPlus = (a, b) => goldOwned(a) || goldOwned(b) ? GOLD_PLUS : 0;
const comboFoundWith = base => COMBOS.some(c => S.combos[c.id] && (c.a === base || c.b === base));
// the uniform the staff wear right now: the one you try on at the booth, else the one bought / chosen (null = their own)
const staffUniform = () => TRY.uniform || uniformOf(S.equip.uniform);
// what the menu's 「装扮」 page lists: [kind, unlock ids in price order]
const DRESS_KINDS = ['hat', 'outfit', 'uniform', 'pet'];
const dressList = k => UNLOCKS.filter(u => u[k]).sort((a, b) => a.price - b.price).map(u => u.id);
// wear it (the menu page, a purchase): null = take it off (outfit / uniform: back to your own clothes)
function wear(k, id) {
  if (id !== null && !(S.unlocked[id] && UNLOCK[id][k])) return false;
  if (S.equip[k] === id) return false;
  S.equip[k] = id; markDirty();
  if (k === 'pet') PET = null;   // the new pet pops in at your feet
  return true;
}

// ---- after a purchase (unlock.js calls this once the unlock is in): wear it, gild the rooms, the shrine's bell, the
// rare guest of a garden piece, ... - the v2.1 core B side of a purchase
function unlockB(u) {
  if (u.outfit) S.equip.outfit = u.id;
  if (u.uniform) { S.equip.uniform = u.id; for (const s of STAFF) if (s.role !== 'owner' && VIS(s.x, s.y, 24)) fxSpark(s.x, s.y - 14, 4); }
  if (u.goldOf) for (const sl of DSLOTS) if (S.decor[sl.key] === u.goldOf && roomOpen(sl.rm)) { POPA['decor:' + sl.key] = T; fxSpark(tcx(sl.at), tcy(sl.at) - 8, 5); }
  if (u.shrine) shrineLevelUp(u);
  if (u.gz) rareBought(u);
  if (u.stall) POPA[u.id] = T;
}

// ---- per frame (gameUpdate): the tanuki's lantern trick, the maneki outfit's wave, gold glints in the rooms
const PETFX = { lantern: 0, next: 30, idle: 0 };
let maneki = 0, goldGlintT = 0;
function wardrobeTick(dt) {
  if (PET && PET.kind === 'tanuki') {   // standing still a while, now and then it turns into a paper lantern for 3 s (16.6)
    if (PETFX.lantern > 0) { PETFX.lantern -= dt; if (PETFX.lantern <= 0 || PET.moving) { PETFX.lantern = 0; FX.push({ k: 'poof', x: PET.x, y: PET.y - 6, t: 0, life: .45 }); } }
    else if (!PET.moving && PET.idle > 2) { PETFX.next -= dt; if (PETFX.next <= 0) { PETFX.next = rand(25, 40); PETFX.lantern = 3; FX.push({ k: 'poof', x: PET.x, y: PET.y - 6, t: 0, life: .45 }); sfx('tryon'); } }
  } else PETFX.lantern = 0;
  PET && (PET.lantern = PETFX.lantern > 0);
  maneki = outfitOf(S.equip.outfit) === 'o_maneki' && !TRY.outfit && !P.moving ? maneki + dt : 0;   // stands still: beckons
  goldGlintT -= dt;
  if (goldGlintT <= 0) {   // a slow glint now and then on a gold piece in view (no blinking: each one fades in and out once)
    goldGlintT = .6;
    const L = DSLOTS.filter(sl => roomOpen(sl.rm) && goldOwned(S.decor[sl.key]) && VIS(tcx(sl.at), tcy(sl.at), 8));
    if (L.length) { const sl = L[Math.floor(Math.random() * L.length)]; FX.push({ k: 'vtrail', x: tcx(sl.at) + rand(-5, 5), y: tcy(sl.at) - rand(2, 14), t: 0, life: 1.2 }); }
  }
}
// ---- drawing (render hooks): the ghost receptionist at the uniform booth, the maneki wave, the tanuki lantern
// the receptionist in the uniform you are trying on, faint at your side (like the pet you try on)
function dressGhostDraws(L) {
  if (!TRY.uniform) return;
  const look = Object.assign({}, STAFF_DEF.recep.look, { uniform: TRY.uniform }), gh = { x: P.x + 13, y: P.y + 1, dir: 'down', moving: false, walkT: 0 };
  L.push({ y: gh.y, f: () => { g.globalAlpha = .55; drawCat(gh, look); g.globalAlpha = 1; } });
}
// o_maneki: standing still you raise a paw and beckon (two frames, 2 a second), drawn beside the head
function manekiPaw() {
  if (maneki < 1 || P.towels) return;
  const fur = FURS.orange, up = Math.floor(maneki * 2) & 1, x = R(P.x) + (P.dir === 'left' ? -9 : 6) - CX, y = R(P.y) - 18 - up * 2 - headBob(P) - CY;
  g.fillStyle = OUT; g.fillRect(x - 1, y - 1, 5, 6); g.fillStyle = fur.O; g.fillRect(x, y, 3, 4); g.fillStyle = fur.W; g.fillRect(x, y, 3, 1); g.fillStyle = '#ff9fb0'; g.fillRect(x + 1, y + 2, 1, 1);
}
// the tanuki turned into a paper lantern (10 x 13, anchor bottom-centre); it glows a little at night
function petLanternArt() {
  return art('core:tanukiLantern', () => rows(['...BB...', '..RRRR..', '.RRYYRR.', 'RRRYYRRR', 'RRYYYYRR', 'RRRYYRRR', '.RRYYRR.', '..RRRR..', '...BB...', '...tt...', '..t..t..'],
    { B: '#3a2a20', R: '#e0503a', Y: '#ffd890', t: '#8a6a4a' }));
}
