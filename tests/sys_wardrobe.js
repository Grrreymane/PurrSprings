// SPEC_v2 16.6 (v2.1 core B): the full boutique. From star 5 (shop open) two more booths: outfits (3,34) and staff
// uniforms (5,34), one piece each, the cheapest first (the two seasonal outfits only in their season, or once money is
// poured in). Within 2 tiles you try it on: the outfit on you, the uniform on every staff cat (+ a ghost receptionist at
// your side). Bought = worn (K04 + P12 / P13). Three more pets queue at the pet booth (fox, tanuki - a paper lantern now
// and then when it sits still - crane). Gold decor shows in the shop's decor pads once a combo with its piece is found;
// owned, the piece is drawn gold in every room and a combo with it pays x2.0 (not x1.6). The menu's 「装扮」 page changes
// what you wear with a tap (owned only). equip.outfit / uniform are saved; a piece not owned is dropped on load. The statue
// hint waits for every booth piece on sale. The maneki outfit beckons when you stand still.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_wardrobe.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const SAID = [];
const _lsB = lineSay; lineSay = (who, key, arg) => { SAID.push([who, key]); return _lsB(who, key, arg); };
const PRE4 = UNLOCKS.filter(u => !u.need5 && u.id !== 'roten').map(u => u.id);
function setupB(five, extra) {
  S = defaults(); for (const id of PRE4.concat(extra || [])) S.unlocked[id] = true; if (five) S.unlocked.roten = true;
  for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.basket = BASKET_MAX; S.tut.moved = true; S.done = true; for (const c of COMBOS) if (c.hint) S.combos[c.id] = 1; S.stats.vips = 1;
  resetWorld(); go('play'); spawnT = 1e9;
  P.x = 17 * 16 + 8; P.y = 27 * 16 + 8; SAID.length = 0; BANNER_Q.length = 0;
}
const runB = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (state === 'celebrate') go('play'); if (f && f()) return true; } return false; };
const atB = (tx, ty) => { P.x = tx * 16 + 8; P.y = ty * 16 + 8; };
function walkB(tx, ty, maxSec) {
  const [sx, sy] = tileOf(P); const path = findPath(sx, sy, tx, ty) || [];
  for (let i = 0, n = Math.round((maxSec || 30) / DT); i < n && path.length; i++) {
    const [px, py] = path[0], dx = px * 16 + 8 - P.x, dy = py * 16 + 8 - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { path.shift(); continue; }
    botMove = { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) }; update(DT);
  }
  botMove = null; update(DT);
}
const boothAt = xy => [...PADPOS].filter(([, p]) => p[0] === xy[0] && p[1] === xy[1]).map(([id]) => id)[0] || null;
// ---- star 4: no new booths; star 5: they show the cheapest piece
setupB(false); { ok(!boothAt(OUTFIT_PAD) && !boothAt(UNIFORM_PAD), 'star 4: no outfit / uniform booth'); }
setupB(true);
{ eq(boothAt(OUTFIT_PAD), 'o_yukata', 'outfit booth: the yukata (15,000, the cheapest)'); eq(boothAt(UNIFORM_PAD), 'u_sakura', 'uniform booth: sakura (25,000)');
  ok(UNLOCK.o_yukata.booth && UNLOCK.u_sakura.booth, 'booth pieces (never the "cheapest pad")');
  S.day = 1; padsUpdate(); ok(!padEligible(UNLOCK.o_momiji) && !padEligible(UNLOCK.o_snow), 'spring: no autumn / winter outfit');
  S.day = 7; ok(padEligible(UNLOCK.o_momiji) && !padEligible(UNLOCK.o_snow), 'autumn (day 7): the momiji haori is on sale');
  S.day = 10; ok(!padEligible(UNLOCK.o_momiji) && padEligible(UNLOCK.o_snow), 'winter (day 10): the snow country outfit, not the momiji');
  S.paid.o_momiji = 100; ok(padEligible(UNLOCK.o_momiji), 'money poured in: it stays on sale after its season'); delete S.paid.o_momiji; S.day = 1; }
// ---- try-on: the outfit on you, the uniform on the staff + a ghost at your side; walking off takes it off
setupB(true);
{ atB(3, 36); runB(.1); eq(TRY.outfit, 'o_yukata', 'by the outfit booth: trying the yukata'); eq(playerLook().outfit, 'o_yukata', 'drawn on the innkeeper');
  ok(SAID.some(([w, k]) => w && w.role === 'owner' && k === 'K03'), 'the tanuki: K03');
  const rc = STAFF.find(s => s.role === 'recep'), own = STAFF.find(s => s.role === 'owner');
  atB(7, 36); runB(.1); eq(TRY.uniform, 'sakura', 'on the uniform booth: trying sakura'); eq(staffLook(rc).uniform, 'sakura', 'the receptionist wears it');
  eq(staffLook(own).uniform, undefined, 'the shop owner keeps its own clothes');
  const L = []; dressGhostDraws(L); eq(L.length, 1, 'a ghost receptionist at your side');
  const looks = []; const _cs = catSprite; catSprite = (v, f, l) => { looks.push(l); return _cs(v, f, l); }; updCam(0, true); render(); catSprite = _cs;
  ok(looks.some(l => l && l.uniform === 'sakura' && l.outfit === 'kimono'), 'rendered: a kimono in the sakura uniform');
  atB(12, 31); runB(.1); eq(TRY.outfit, null, 'walked off: no outfit'); eq(TRY.uniform, null, 'no uniform'); eq(staffLook(rc).uniform, undefined, 'staff back in their own clothes'); }
// ---- buying = wearing; the booth moves on to the next piece
setupB(true);
{ S.money = 15000; walkB(OUTFIT_PAD[0], OUTFIT_PAD[1]); runB(4, () => !!S.unlocked.o_yukata);
  ok(S.unlocked.o_yukata, 'bought the yukata'); eq(S.equip.outfit, 'o_yukata', 'worn'); ok(SAID.some(([w, k]) => w === P && k === 'P12'), 'P12 新衣服！');
  ok(SAID.some(([w, k]) => w && w.role === 'owner' && k === 'K04'), 'K04'); ok(RUN.shop.some(x => x[1] === 'o_yukata'), 'a boutique buy');
  atB(17, 27); runB(.1); eq(playerLook().outfit, 'o_yukata', 'worn anywhere'); eq(equipLook().outfit, 'o_yukata', 'the share card / title look'); eq(boothAt(OUTFIT_PAD), 'o_chef', 'next: the chef');
  S.money = 25000; walkB(UNIFORM_PAD[0], UNIFORM_PAD[1]); runB(4, () => !!S.unlocked.u_sakura); eq(S.equip.uniform, 'u_sakura', 'uniform bought = the team wears it');
  ok(SAID.some(([w, k]) => w === P && k === 'P13'), 'P13'); atB(17, 27); runB(.1); ok(STAFF.filter(s => s.role !== 'owner').every(s => staffLook(s).uniform === 'sakura'), 'everyone in sakura');
  P.towels = 3; eq(playerLook().outfit, 'o_yukata', 'towels on the head: the outfit stays'); P.towels = 0; }
// ---- pets: fox / tanuki / crane at the pet booth after the shiba; the tanuki's lantern trick
setupB(true, ['p_duck', 'p_shiba']);
{ eq(boothAt(PET_PAD), 'p_fox', 'after the shiba: the fox (60,000)'); S.unlocked.p_fox = true; padsUpdate(); eq(boothAt(PET_PAD), 'p_tanuki', 'then the tanuki');
  S.unlocked.p_tanuki = true; padsUpdate(); eq(boothAt(PET_PAD), 'p_crane', 'then the crane');
  S.equip.pet = 'p_tanuki'; runB(.2); ok(PET && PET.kind === 'tanuki', 'the tanuki follows'); let lit = false; atB(17, 27); runB(60, () => (lit = lit || !!PET.lantern) && false);
  ok(lit, 'standing still, the tanuki turned into a lantern at some point'); let threw = null; try { PET.lantern = true; render(); PET.lantern = false; render(); } catch (e) { threw = e; } ok(!threw, 'drawn: ' + threw);
  S.equip.pet = 'p_crane'; runB(.2); ok(PET && PET.kind === 'crane', 'the crane follows'); try { render(); } catch (e) { threw = e; } ok(!threw, 'crane drawn: ' + threw); }
// ---- gold decor: on sale once a combo with its piece is found; gilds every room; a combo with it x2.0
setupB(true, DECOR_IDS);
{ S.combos = {}; padsUpdate(); ok(!PADPOS.has('d_maneki_gold'), 'no combo with the maneki yet: no gold maneki');
  S.combos.c_fuku = 1; padsUpdate(); ok(PADPOS.has('d_maneki_gold') && PADPOS.has('d_daruma_gold'), 'c_fuku found: gold maneki + gold daruma in the decor pads');
  ok(!PADPOS.has('d_tank_gold'), 'the tank waits for its own combo');
  S.decor['room1:A'] = 'd_maneki'; S.decor['room1:B'] = 'd_daruma'; S.decor['room2:A'] = 'd_maneki'; S.decor['room2:B'] = 'd_tank'; S.decor['room3:A'] = 'd_scroll'; S.decor['room3:B'] = 'd_ikebana'; S.decor['room4:A'] = 'd_maneki';
  const m0 = roomMult(ROOM.room1); eq(m0, 1.6, 'fuku room before: x1.6');
  S.money = 20000; unlock('d_maneki_gold');
  eq(roomMult(ROOM.room1), 2, 'fuku room with the gold maneki: x2.0'); eq(roomMult(ROOM.room2), 2, 'fish room (maneki + tank): x2.0'); eq(roomMult(ROOM.room3), 1.6, 'a combo without it: x1.6');
  eq(roomMult(ROOM.room4), 1.2, 'gold maneki alone (no combo): x1.2');
  ok(DSLOTS.filter(sl => S.decor[sl.key] === 'd_maneki').every(sl => POPA['decor:' + sl.key] === T), 'every maneki pops gold');
  const gl = []; const _da = decorArt; decorArt = (id, f, gd) => { gl.push([id, gd]); return _da(id, f, gd); }; atB(13, 21); updCam(0, true); render(); decorArt = _da;
  ok(gl.some(([id, gd]) => id === 'd_maneki' && gd === true) && gl.some(([id, gd]) => id === 'd_daruma' && !gd), 'drawn gold (the maneki), the daruma not');
  ok(!DECOR_IDS.includes('d_maneki_gold'), 'gold pieces are not placeable pieces'); eq(unlockIcon(UNLOCK.d_maneki_gold).width, decorIcon('d_maneki', true).width, 'its icon = the gold piece'); }
// ---- the menu's 「装扮」 page: tap an owned piece to wear it; a locked one does nothing; render every tab
setupB(true, ['h_straw', 'o_yukata', 'o_chef', 'u_aizome', 'p_duck']);
{ openMenu(); MENU.page = 'dress'; DRESS.tab = 1; render();
  const cellOf = (k, id) => DRESS_CELL(dressItems(k).indexOf(id)), tap = r => menuPress({ x: r[0] + 10, y: r[1] + 10 });
  tap(cellOf('outfit', 'o_chef')); eq(S.equip.outfit, 'o_chef', 'tap the chef outfit: worn');
  tap(cellOf('outfit', 'o_ninja')); eq(S.equip.outfit, 'o_chef', 'a locked one: nothing');
  tap(cellOf('outfit', null)); eq(S.equip.outfit, null, 'tap your own clothes: back to the happi');
  menuPress({ x: 24 + 2 * 33 + 10, y: 70 }); eq(DRESS.tab, 2, 'tab 制服'); tap(cellOf('uniform', 'u_aizome')); eq(S.equip.uniform, 'u_aizome', 'the team in aizome');
  menuPress({ x: 24 + 0 * 33 + 10, y: 70 }); tap(cellOf('hat', 'h_straw')); eq(S.equip.hat, 'h_straw', 'hat'); tap(cellOf('hat', null)); eq(S.equip.hat, null, 'no hat');
  menuPress({ x: 24 + 3 * 33 + 10, y: 70 }); tap(cellOf('pet', 'p_duck')); eq(S.equip.pet, 'p_duck', 'the duck');
  for (let t = 0; t < 4; t++) { DRESS.tab = t; let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'dress tab ' + t + ': ' + threw); }
  ok(TQ.some(t => t.s === '装扮'), 'page title'); closeMenu(); }
// ---- saved; a piece not owned is dropped; a v2.0 save keeps its equip as it was
setupB(true, ['o_ninja', 'u_gold']);
{ S.equip.outfit = 'o_ninja'; S.equip.uniform = 'u_gold'; saveNow(); S = loadState(); eq(S.equip.outfit, 'o_ninja', 'outfit saved'); eq(S.equip.uniform, 'u_gold', 'uniform saved');
  const raw = JSON.parse(JSON.stringify(S)); raw.equip.outfit = 'o_samurai'; raw.equip.uniform = 'nope'; const s2 = loadState(raw); eq(s2.equip.outfit, null, 'not owned: dropped'); eq(s2.equip.uniform, null, 'unknown: dropped');
  const old = loadState({ v: 2, unlocked: { room1: true }, equip: { hat: null, pet: null } }); ok(!('outfit' in old.equip), 'a v2.0 save: no outfit key added'); eq(outfitOf(old.equip.outfit), null, 'own clothes'); }
// ---- the statue hint waits for every booth piece on sale (hats, pets, outfits, uniforms)
setupB(true, UNLOCKS.filter(u => u.hat || u.pet || u.id === 'maid4').map(u => u.id));
{ S.money = 60000; atB(17, 27); guideClock = 0; update(DT); ok(!(GUIDE && GUIDE.id === 'statue'), 'outfits / uniforms still on sale: no statue hint');
  for (const u of UNLOCKS) if (u.outfit || u.uniform) if (!u.ok || u.ok()) S.unlocked[u.id] = true; padsUpdate(); S.money = 60000; guideClock = 0; update(DT);
  ok(!!statueHint(), 'every booth piece on sale bought: the statue hint (seasonal ones out of season do not hold it back)'); }
// ---- the maneki outfit beckons standing still; the title bows in the outfit
setupB(true, ['o_maneki']);
{ S.equip.outfit = 'o_maneki'; atB(17, 27); runB(1.5); ok(maneki >= 1, 'standing still 1.5 s: beckoning'); let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'paw drawn: ' + threw);
  walkB(17, 24); ok(maneki < 1, 'walking: no wave');
  const bows = []; const _cb = catBow; catBow = (f, fr, h, o) => { bows.push(o); return _cb(f, fr, h, o); }; go('title'); render(); catBow = _cb; go('play'); ok(bows.includes('o_maneki'), 'the title bow gets the outfit'); }
console.log(errs.length ? 'SYS WARDROBE FAIL\n  ' + errs.join('\n  ') : 'SYS WARDROBE OK');
if (errs.length) process.exitCode = 1;
