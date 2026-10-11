// SPEC_v2 4.11: star 5 and the endless loop. Buying 星见汤 -> star 5: with the shop open the "preparing" curtain goes, the
// tanuki says K02, the try-on card (7.4) queues, a "new" edge tag; a hat booth (5,33) and a pet booth (7,33) show the next
// piece (cheapest first, VIP hats only once that VIP came), the mirror (stand at (2,33)) and the pet cushion (8,34) pop in.
// Within 2 tiles of a booth you try the piece on (hat on your head + sparkles / the pet's ghost at your feet), K03 once a
// piece; buying = wearing (K04 + P05). The mirror / cushion switch to the next owned hat / pet incl. none every 1 s. Towels
// on your head hide the hat. Pets follow (crumbs); the duck quacks now and then on a fish pickup (A01, <= 1 / 20 s), the
// shiba barks at a VIP (A02); the gold headband leaves gold glints. The covered statue (1,000,000): the cloth slides with the
// money poured; bought: gold statue, every tip +1, hearts +100, a banner. The arrow points at a booth piece once (the first
// time it is affordable); at the statue only once every hat and pet is bought and you hold >= 50,000 (v2.0 audit END-1).
// After star 5 something is always buyable (the statue). The celebration
// panel shows the three "next" icons; the title and the share card wear the hat and bring the pet.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_boutique.js --seed 4
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const SFXLOG = [], LINES = [];
const _sfx = sfx; sfx = (k, a) => { SFXLOG.push(k); return _sfx(k, a); };
const _ls = lineSay; lineSay = (who, key) => { LINES.push([who, key]); return _ls(who, key); };
const PRE4 = UNLOCKS.filter(u => !u.need5 && u.id !== 'roten').map(u => u.id);
function setup(five, extra) {
  S = defaults(); for (const id of PRE4.concat(extra || [])) S.unlocked[id] = true; if (five) S.unlocked.roten = true;
  for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.basket = BASKET_MAX; S.tut.moved = true; S.done = true; for (const c of COMBOS) if (c.hint) S.combos[c.id] = 1;   // a star-5 inn has made its combos (else rule 14 goes first)
  S.stats.vips = 1;   // ... and hosted a VIP (v2.0.1 G1: the arrow leads the first VIP ever ahead of the pads)
  resetWorld(); go('play'); spawnT = 1e9;
  for (let i = STAFF.length - 1; i >= 0; i--) if (STAFF[i].role !== 'owner') STAFF.splice(i, 1);
  P.x = 17 * 16 + 8; P.y = 27 * 16 + 8; SFXLOG.length = 0; LINES.length = 0; BANNER_Q.length = 0;
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (state === 'celebrate') go('play'); if (state === 'card') modalClose(); if (f && f()) return true; } return false; };
const at = (tx, ty) => { P.x = tx * 16 + 8; P.y = ty * 16 + 8; };
function walkTo(tx, ty, maxSec) {
  const [sx, sy] = tileOf(P); const path = findPath(sx, sy, tx, ty) || [];
  for (let i = 0, n = Math.round((maxSec || 30) / DT); i < n && path.length; i++) {
    const [px, py] = path[0], dx = px * 16 + 8 - P.x, dy = py * 16 + 8 - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { path.shift(); continue; }
    botMove = { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) }; update(DT);
  }
  botMove = null; update(DT);
}
const hasProp = k => OBJS.some(o => o.k === k);
// ---- star 4: the corner is "preparing"
setup(false);
{ ok(hasProp('curtain') && !hasProp('mirror') && !hasProp('statue'), 'star 4: curtain, no mirror / statue'); ok(!PADPOS.has('h_straw') && !PADPOS.has('statue'), 'no booth pads'); ok(!boutiqueOpen(), 'closed'); }
// ---- star 5: it opens
{ S.money = 3000; unlock('roten'); run(.1);
  eq(star(), 5, 'star 5'); ok(boutiqueOpen(), 'the boutique is open'); ok(!hasProp('curtain'), 'curtain gone'); ok(hasProp('mirror') && hasProp('petcushion') && hasProp('statue'), 'mirror, cushion, covered statue');
  ok(LINES.some(([w, k]) => w && w.role === 'owner' && k === 'K02'), 'the tanuki: K02'); ok(S.seen.tryon && FIRST_Q.some(f => f.key === 'tryon'), 'try-on card queued');
  ok(EDGE_Q.some(e => e.icon === 'hat'), 'a "new" edge tag for the booth'); eq(POPA.boutique, POPA.boutique, 'pieces pop in');
  eq(PADPOS.get('h_straw') + '', HAT_PAD + '', 'hat booth: the straw hat'); eq(PADPOS.get('p_duck') + '', PET_PAD + '', 'pet booth: the duck'); eq(PADPOS.get('statue') + '', '13,33', 'statue pad (13,33)');
  ok(OBJS.find(o => o.k === 'statue').uid === 'boutique', 'the covered statue pops with the boutique');
  const n = RUN.news.filter(x => x[1] === 'boutique').length; run(2); eq(RUN.news.filter(x => x[1] === 'boutique').length, n, 'opens once'); }
// ---- a reload at star 5 doesn't replay the opening
{ saveNow(); S = loadState(); resetWorld(); go('play'); LINES.length = 0; run(.5); ok(!LINES.some(([, k]) => k === 'K02'), 'no K02 after a reload'); }
// ---- the shop bought at star 5 (an old v1 save): the boutique opens then
setup(true); { delete S.unlocked.shop; resetWorld(); go('play'); ok(!boutiqueOpen(), 'no shop yet'); S.money = 200; unlock('shop'); run(.1); ok(boutiqueOpen() && LINES.some(([, k]) => k === 'K02'), 'opens with the shop'); }
// ---- VIP hats wait for their VIP; the booth shows the cheapest piece it can
setup(true, ['h_straw', 'h_flower']);
{ eq([...PADPOS.keys()].find(id => UNLOCK[id].hat), 'h_fox', 'no VIP met: beret / captain / shades skipped -> fox');
  S.album.vip.kawa = 1; padsUpdate(); eq([...PADPOS.keys()].find(id => UNLOCK[id].hat), 'h_beret', 'kawa came: the beret'); }
// ---- try-on: within 2 tiles of a booth the piece is on you; walking away takes it off; K03 once a piece
setup(true);
{ at(5, 31); run(.1); eq(TRY.hat, 'straw', 'trying the straw hat (2 tiles from the booth)'); eq(playerLook().hat, 'straw', 'drawn on the innkeeper');
  ok(LINES.filter(([, k]) => k === 'K03').length === 1, 'K03 once'); ok(SFXLOG.includes('tryon'), 'try-on sound'); ok(!S.unlocked.h_straw, 'not bought by trying');
  const looks = []; const _cs = catSprite; catSprite = (v, f, l) => { looks.push(l); return _cs(v, f, l); }; updCam(0, true); render(); catSprite = _cs;
  ok(looks.some(l => l.outfit === 'happi' && l.hat === 'straw'), 'rendered with the hat');
  at(10, 32); run(.1); eq(TRY.hat, null, 'walked away: off'); eq(playerLook().hat || null, null, 'bare head again');
  at(5, 31); run(.1); eq(LINES.filter(([, k]) => k === 'K03').length, 1, 'no second K03 for the same piece');
  P.towels = 3; eq(playerLook().hat || null, null, 'towels on the head: no hat'); P.towels = 0;
  at(7, 31); run(.1); eq(TRY.pet, 'duck', 'the duck ghost at the pet booth');
  const pets = []; const _ps = petSprite; petSprite = (k, v, f) => { pets.push(k); return _ps(k, v, f); }; updCam(0, true); render(); petSprite = _ps;
  ok(pets.includes('duck'), 'its ghost is drawn'); }
// ---- buying = wearing / bringing along
setup(true);
{ S.money = 4000; walkTo(HAT_PAD[0], HAT_PAD[1]); run(4, () => !!S.unlocked.h_straw);
  ok(S.unlocked.h_straw, 'bought the straw hat by standing on the booth'); eq(S.equip.hat, 'h_straw', 'worn'); ok(LINES.some(([, k]) => k === 'K04') && LINES.some(([w, k]) => w === P && k === 'P05'), 'K04 + P05');
  ok(RUN.shop.some(x => x[1] === 'h_straw'), 'counted as a boutique buy'); at(17, 27); run(.1); eq(playerLook().hat, 'straw', 'wearing it anywhere');
  S.money = 24000; walkTo(PET_PAD[0], PET_PAD[1]); run(4, () => !!S.unlocked.p_duck); eq(S.equip.pet, 'p_duck', 'the duck comes along');
  run(.1); ok(PET && PET.kind === 'duck', 'pet entity'); let far = 0; walkTo(17, 27, 40); run(1, () => { far = Math.max(far, dist(P.x, P.y, PET.x, PET.y)); return false; });
  ok(dist(P.x, P.y, PET.x, PET.y) < 30, 'the duck caught up (' + dist(P.x, P.y, PET.x, PET.y).toFixed(1) + ' px)'); }
// ---- the mirror: the next owned hat, "none" included, every 1 s; walk off and it stays
setup(true, ['h_straw', 'h_flower']);
{ S.equip.hat = 'h_straw'; at(SPOT.mirror[0], SPOT.mirror[1]); run(.9); eq(S.equip.hat, 'h_straw', 'not before 1 s');
  run(.15); eq(S.equip.hat, 'h_flower', '1 s: the flower'); run(1); eq(S.equip.hat, null, '2 s: none'); run(1); eq(S.equip.hat, 'h_straw', '3 s: back to straw');
  at(4, 32); run(2); eq(S.equip.hat, 'h_straw', 'walked off: it stays'); ok(SFXLOG.filter(k => k === 'tryon').length >= 3, 'a try-on sound each switch'); }
setup(true); { at(SPOT.mirror[0], SPOT.mirror[1]); run(3); eq(S.equip.hat, null, 'no hats owned: the mirror does nothing'); }
// ---- the pet cushion
setup(true, ['p_duck', 'p_shiba']);
{ S.equip.pet = null; at(SPOT.petCushion[0], SPOT.petCushion[1]); run(1.05); eq(S.equip.pet, 'p_duck', 'cushion: the duck'); run(1); eq(S.equip.pet, 'p_shiba', 'the shiba');
  run(.1); ok(PET && PET.kind === 'shiba', 'the shiba follows now'); run(.95); eq(S.equip.pet, null, 'none'); run(.1); eq(PET, null, 'no pet'); }
// ---- pets: the duck quacks on a pickup (10 %, at most once per 20 s); the shiba barks at a VIP; the shiba wags sitting still
setup(true, ['p_duck']);
{ S.equip.pet = 'p_duck'; run(.1); let quacks = []; const _l2 = lineSay; lineSay = (w, k) => { if (k === 'A01') quacks.push(S.stats.time); return _l2(w, k); };
  const [px, py] = PILE_AT.recep; at(px, py); for (let i = 0; i < 600; i++) { S.piles.recep = 5; run(.5); }   // on the cash box (stage 4: the net doesn't reach it)
  lineSay = _l2; ok(quacks.length >= 2, 'quacks: ' + quacks.length); ok(quacks.every((t, i) => !i || t - quacks[i - 1] >= 20 - 1e-6), 'never twice in 20 s');
  ok(quacks.length <= 300 / 20 + 1, 'not on every pickup'); }
setup(true, ['p_shiba', 'garden']);
{ S.equip.pet = 'p_shiba'; run(.1); LINES.length = 0; vipArrive(); ok(LINES.some(([w, k]) => w === PET && k === 'A02'), 'the shiba barks at the VIP');
  const frs = []; const _ps = petSprite; petSprite = (k, v, f) => { frs.push(f); return _ps(k, v, f); }; run(1.6); updCam(0, true); render(); run(.5); render(); petSprite = _ps;
  ok(frs.includes(3) || frs.includes(4), 'sitting still: the wag frames'); }
setup(true, ['h_gold']);
{ S.equip.hat = 'h_gold'; FX.length = 0; walkTo(17, 24, 3); ok(FX.some(f => f.k === 'vtrail'), 'gold headband: gold glints while walking'); }
// ---- the statue: the cloth slides with what was poured; bought: gold, tips +1, hearts +100, banner; the arrow never points at it
setup(true);
{ const ps = []; const _sa = statueArt; statueArt = (s, p) => { ps.push([s, p]); return _sa(s, p); };
  S.paid.statue = 250000; P.x = 12 * 16; P.y = 31 * 16 + 8; updCam(0, true); render(); ok(ps.some(([s, p]) => s === 'covered' && Math.abs(p - .25) < 1e-9), 'covered, cloth at 25 %');
  const tip0 = fee('tip', { rm: ROOM.room1 }), h0 = S.hearts; S.money = 750000; walkTo(13, 33); run(60, () => !!S.unlocked.statue);
  ok(S.unlocked.statue, 'statue bought'); eq(fee('tip', { rm: ROOM.room1 }), tip0 + 1, 'every tip +1'); ok(S.hearts - h0 >= 100, 'hearts +100');
  ok(BANNER_Q.some(b => b.kind === 'statue'), 'statue banner'); ps.length = 0; render(); statueArt = _sa; ok(ps.some(([s]) => s === 'gold'), 'the golden statue');
  ok(RUN.shop.some(x => x[1] === 'statue'), 'counted'); }
setup(true);
{ let pointed = 0; for (const m of [0, 5e5, 2e6]) { S.money = m; for (let i = 0; i < 40; i++) { update(DT); if (GUIDE && GUIDE.id === 'statue') pointed++; } } eq(pointed, 0, 'the arrow never points at the statue while a hat or pet is unbought'); }
setup(true, UNLOCKS.filter(u => u.hat || u.pet || u.id === 'maid4').map(u => u.id));
{ S.money = 60000; at(17, 27); guideClock = 0; update(DT); ok(GUIDE && GUIDE.id === 'statue', 'everything else bought, 60,000 on hand: the arrow points at the statue (' + (GUIDE && GUIDE.key) + ')');
  S.money = 40000; guideClock = 0; update(DT); ok(!(GUIDE && GUIDE.id === 'statue'), 'under 50,000: not');
  S.money = 60000; walkTo(13, 33); run(.5); ok(S.money === 0 && S.paid.statue === 60000, 'poured in: money ' + S.money + ', paid ' + S.paid.statue);
  guideClock = 0; update(DT); ok(!(GUIDE && GUIDE.id === 'statue'), 'poured: the arrow moves on'); }
// ---- a booth piece is pointed at once: the first time it is affordable; after a look (walking off) or 60 s, never again
setup(true);
{ S.money = 4200; at(17, 27); guideClock = 0; update(DT); ok(GUIDE && GUIDE.kind === 'pad' && GUIDE.id === 'h_straw', 'affordable: the arrow points at the straw hat (' + (GUIDE && GUIDE.kind + ' ' + GUIDE.id) + ')');
  at(5, 31); run(.3); at(17, 27); run(.3); guideClock = 0; update(DT); ok(!(GUIDE && GUIDE.id === 'h_straw'), 'after a look: not again'); }
setup(true);
{ S.money = 4200; at(17, 27); run(BOOTH_HINT_T + 1); guideClock = 0; update(DT); ok(!(GUIDE && GUIDE.id === 'h_straw'), 'ignored for 60 s: not again'); ok(boothOf('h_straw').done, 'done'); }
// ---- after star 5 something is always buyable (G4)
setup(true, UNLOCKS.filter(u => u.need5 && u.id !== 'statue').map(u => u.id)); eq([...PADPOS.keys()].join(','), 'statue', 'everything else owned: the statue is still there');
// ---- the celebration panel, the title, the share card
setup(true, ['h_crown', 'p_shiba']);
{ S.equip.hat = 'h_crown'; S.equip.pet = 'p_shiba'; const pi = []; const _pi = padIcon; padIcon = k => { pi.push(k); return _pi(k); };
  go('celebrate'); update(.2); render(); padIcon = _pi; ok(pi.includes('hat') && pi.includes('statue'), 'celebration: the "next" icons');
  ok(TQ.some(t => t.s === '接下来'), 'celebration: the "next" label');
  const hats = []; const _cb = catBow; catBow = (f, fr, h) => { hats.push(h); return _cb(f, fr, h); }; const pk = []; const _ps = petSprite; petSprite = (k, v, f) => { pk.push(k); return _ps(k, v, f); };
  go('title'); render(); catBow = _cb; ok(hats.includes('crown'), 'title: the innkeeper bows in its crown'); ok(pk.includes('shiba'), 'title: the shiba sits by');
  pk.length = 0; let threw = null; try { makeShare(); } catch (e) { threw = e; } petSprite = _ps; ok(!threw, 'share card: ' + threw); ok(pk.includes('shiba'), 'share card: the shiba'); go('play'); }
// ---- equip is saved; a piece not owned can't be worn after a load
setup(true, ['h_straw']); S.equip.hat = 'h_straw'; S.equip.pet = 'p_duck'; saveNow(); S = loadState(); eq(S.equip.hat, 'h_straw', 'hat saved'); eq(S.equip.pet, null, 'a pet not owned is dropped');
console.log(errs.length ? 'SYS BOUTIQUE FAIL\n  ' + errs.join('\n  ') : 'SYS BOUTIQUE OK');
if (errs.length) process.exitCode = 1;
