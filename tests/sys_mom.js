// SPEC_v2 16.5: the cat mom. From star 5, once a year on the 3rd day of spring (from clock .30, when no VIP is in): a VIP
// in all but name - greet, lead to a suite, tea -> bath -> photo. The photo is the family photo (the innkeeper as dressed
// + mom + every hired staff cat at the front door, redrawn from the data), a paused card, then on the lobby wall (15,22).
// Lines E10: "来看看你喵" (year 3+ "又长大了呢", year 10 "十年了呀"), going "妈妈为你骄傲". No VIP album entry / gift for her.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_mom.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const ALL = UNLOCKS.filter(u => !u.need5 && !u.when).map(u => u.id);
function setup(day, clock, o) {
  S = defaults(); for (const id of ALL) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.tut.moved = true; S.day = day; S.clock = clock; S.stats.time = 5000; S.vipNext = 6; Object.assign(S, o || {});
  resetWorld(); go('play'); spawnT = 1e9; vipT = 1e9; BANNER_Q.length = 0; P.x = 17 * 16 + 8; P.y = 27 * 16 + 8;
}
const said = []; const _say = say; say = (e, id, a) => { const r = _say(e, id, a); if (r) said.push(id + ':' + (a || '')); return r; };
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
function walkTo(tx, ty, maxSec) {
  const [sx, sy] = tileOf(P); let path = findPath(sx, sy, tx, ty) || [];
  for (let i = 0, n = Math.round((maxSec || 30) / DT); i < n && path.length; i++) {
    const [px, py] = path[0], dx = px * 16 + 8 - P.x, dy = py * 16 + 8 - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { path.shift(); continue; }
    botMove = { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) }; update(DT);
  }
  botMove = null; update(DT);
}
const mom = () => VIPG && VIPG.mom ? VIPG : null;
// ---- when
{ setup(15, .29); run(1); ok(!mom(), 'not before clock .30');
  setup(15, .299); run(1); ok(!!mom(), 'year 2, spring day 3, .30: mom comes'); eq(S.momY, 2, 'saved: this year'); eq(S.mom, 1, 'visits 1');
  ok(BANNER_Q.some(b => b.kind === 'mom' && bannerParts(b).parts.some(p => p.t === '妈妈来了！')), 'banner 妈妈来了！');
  eq(mom().look.outfit, 'mom', 'in her own outfit'); eq(mom().look.acc, 'bundle', 'with a bundle'); ok(!S.album.vip.mom, 'not in the VIP album');
  setup(14, .5); run(1); ok(!mom(), 'not on spring day 2'); setup(18, .5); run(1); ok(!mom(), 'not in summer');
  setup(15, .5, { momY: 2 }); run(1); ok(!mom(), 'once a year');
  setup(3, .5, { momY: 0 }); S.peak = 4; S.unlocked.roten = false; run(1); ok(!mom(), 'not before star 5');
  setup(15, .5); vipArrive(); run(1); ok(VIPG && !VIPG.mom, 'a VIP is in: she waits'); VIPG = null; run(DT * 2); ok(!!mom(), 'and comes once it has gone'); }
// ---- the visit: greet ("又长大了呢" from year 3), lead, tea, bath, the family photo, "妈妈为你骄傲"
{ setup(27, .299); run(1); const v = mom(); ok(v && v.momYear === 3, 'year 3');
  run(20, () => v.st === 'carpet'); eq(v.st, 'carpet', 'on the red carpet'); let t = guideTarget(); ok(t && t.kind === 'vip', 'the arrow: greet her');
  said.length = 0; P.x = v.x; P.y = v.y; run(.6); eq(v.st, 'follow', 'greeted'); ok(said.includes('E10:grown'), 'year 3: "又长大了呢" (' + said.join() + ')');
  walkTo(suiteInner(ROOM.c3)[0], suiteInner(ROOM.c3)[1]); run(15, () => v.st === 'seated'); eq(v.st, 'seated', 'in the suite');
  eq(vipWish(), 'tea', 'wish 1: tea'); vipWishDone(); run(VIP_SIP_T.tea + .5); eq(vipWish(), 'bath', 'wish 2: her bath');
  const tp = ROOM[v.suite].tap; P.x = tp[0] * 16 + 8; P.y = tp[1] * 16 + 8; run(VIP_TAP_T + VIP_SOAK_T + 1); eq(vipWish(), 'photo', 'wish 3: the photo');
  const photos = S.album.photos.length, gifts = S.gifts.length; said.length = 0; P.x = v.x + 6; P.y = v.y; run(VIP_PHOTO_T + .2, () => state === 'card');
  eq(state, 'card', 'the family photo pauses the game'); ok(MODAL_Q[0] && MODAL_Q[0].kind === 'family' && MODAL_Q[0].y === 3, 'a family card, year 3');
  eq(S.album.photos.length, photos, 'no VIP album photo'); eq(S.gifts.length, gifts, 'no gift on the shelf'); ok(said.includes('E10:go'), '"妈妈为你骄傲" (' + said.join() + ')');
  render(); modalClose(); eq(state, 'play', 'closed'); run(30, () => !VIPG); ok(!VIPG, 'she went home'); }
// ---- the family photo: everyone hired, the pet; the wall
{ setup(15, .2, { mom: 1 }); S.unlocked.p_shiba = true; S.equip.pet = 'p_shiba'; const c0 = familyCast();
  eq(c0.ids.length, Object.keys(STAFF_DEF).filter(id => STAFF_DEF[id].role !== 'owner' && S.unlocked[STAFF_DEF[id].need]).length, 'every hired staff cat (' + c0.ids.join() + ')'); ok(!c0.ids.includes('owner'), 'not the shop owner');
  const looks = []; const _cs = catSprite; catSprite = (v, f, l) => { looks.push(l); return _cs(v, f, l); }; FAMILY.clear(); familyPhoto(); catSprite = _cs;
  eq(looks.length, c0.ids.length + 2, 'staff + mom + the innkeeper drawn'); ok(looks.includes(MOM_DEF.look), 'mom in it');
  const pets = []; const _ps = petSprite; petSprite = (k, v, f) => { pets.push(k); return _ps(k, v, f); }; FAMILY.clear(); familyPhoto(); petSprite = _ps; eq(pets.join(), 'shiba', 'the pet too');
  const walls = []; const _wd = wallDecorArt; wallDecorArt = k => { walls.push(k); return _wd(k); }; P.x = 16 * 16; P.y = 24 * 16; updCam(0, true); render(); wallDecorArt = _wd;
  ok(walls.includes('family'), 'on the lobby wall (15,22)');
  setup(15, .2, { mom: 0 }); walls.length = 0; wallDecorArt = k => { walls.push(k); return _wd(k); }; render(); wallDecorArt = _wd; ok(!walls.includes('family'), 'no frame before her first visit'); }
// ---- lines by year; save
{ eq(LINES.E10.text('come'), '来看看你喵', 'year 1-2'); setup(111, .299, { momY: 9 }); run(1); ok(mom() && mom().momYear === 10, 'year 10'); const v = mom(); run(20, () => v.st === 'carpet'); said.length = 0; P.x = v.x; P.y = v.y; run(.6); ok(said.includes('E10:ten'), 'year 10: "十年了呀"'); }
{ setup(15, .299); run(1); saveNow(); const L = loadState(); eq(L.mom + ',' + L.momY, '1,2', 'saved: visits 1, year 2'); S = L; resetWorld(); go('play'); vipT = 1e9; run(2); ok(!mom(), 'a load the same day: she doesn\'t come again'); }
say = _say;
console.log(errs.length ? 'SYS MOM FAIL\n  ' + errs.join('\n  ') : 'SYS MOM OK');
if (errs.length) process.exitCode = 1;
