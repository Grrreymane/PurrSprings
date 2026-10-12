// SPEC_v2 19.1 (v2.2): a guest of honour's wish shows WHERE it is made. While it waits for a thing made at a station and
// you don't hold it: the station glows (wishGlow / wishStations) with a tag [item] + 2-character verb, its bubble shows
// [station] > [item] (routeBubble), the arrow goes station -> guest with the route as its icon, each kind of wish has a
// one-time picture card (w_tea w_kai w_milk w_rice w_bath w_photo), and a guest only wishes for what the inn can make.
// Last: a bot that never reads the arrow - only the glow, the bubble and the guest - hosts the six VIPs and three rare
// guests (milk, rice, kaiseki) to the photo.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_vipguide.js --seed 4
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const ALL = UNLOCKS.filter(u => !u.need5 && u.id !== 'maid4').map(u => u.id);
function st(list, drop) {
  S = defaults(); for (const id of (list || ALL)) if (!(drop || []).includes(id)) S.unlocked[id] = true;
  for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), 4); S.basket = BASKET_MAX; S.tut.moved = true; S.clock = .3; resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0;
  P.x = 17 * 16 + 8; P.y = 25 * 16 + 8; P.tray = [];
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
// seat a guest of honour `who` in suite A with its wish `k` current
function seat(who, k) {
  vipArrive(); firstDone('vip'); const v = VIPG, rm = ROOM.c3;   // as if the first wish were done (the 3-step card holds the first one)
  if (RARE[who]) Object.assign(v, { id: who, rare: true, look: RARE_LOOK[who], kits: undefined }); else Object.assign(v, { id: who, look: VIP_LOOK[who] });
  v.ws = null; v.x = tcx(rm.stand); v.y = tcy(rm.stand); v.suite = 'c3'; RT.c3.guest = v; setSt(v, 'seated'); v.dir = 'up';
  v.wi = vipWs(v).indexOf(k); vipWishStart(); return v;
}
// ---- only what the inn can make: no milk machine -> the summer boy wants tea instead of milk
st(ALL, ['milk', 'porter', 'clerk', 'net2', 'net3']);
{ const v = { id: 'r_boy' }; eq(vipWs(v).join(','), 'tea,bath,photo', 'no milk machine: milk -> tea'); }
S.unlocked.milk = true;
{ const v = { id: 'r_boy' }; eq(vipWs(v).join(','), 'milk,bath,photo', 'milk machine: milk'); }
{ const v = { id: 'r_bride' }; eq(vipWs(v).join(','), 'kaiseki,bath,photo', 'dining open: kaiseki'); }
for (const v of VIPS.concat(RARES)) for (const k of v.wishes) ok(k === 'photo' || k === 'bath' || k === 'stay' || k === 'show' || WISH_MAKE[k], 'every wish kind is known: ' + v.id + ' ' + k);
// ---- the stations
st();
eq(wishStations('tea').join(','), 'urn1,urn2', 'tea: both urns'); eq(wishStations('milk').join(','), 'milk', 'milk: the machine');
eq(wishStations('kaiseki').join(','), 'stove', 'kaiseki: the stove'); eq(wishStations('rice').join(','), 'pass', 'rice with a chef: the counter');
S.unlocked.chef = false; PASS.n = 0; eq(wishStations('rice').join(','), 'stove', 'rice, no chef, empty counter: the stove'); S.unlocked.chef = true;
// ---- tea: glow, route bubble, arrow at the station with the route icon, then the guest
st(); S.stats.vips = 1; S.seen.w_tea = false;
{ const v = seat('kawa', 'tea'); let gl = wishGlow();
  ok(gl && gl.k === 'tea' && gl.ids.length === 2, 'tea: both urns glow');
  eq(vipBubbleImg('tea').width, 30, 'the bubble draws the route (30 px wide, x2 on screen)');
  ok(FIRST_Q.some(f => f.key === 'w_tea'), 'first tea wish: its picture card'); { const L = FIRST_CARD.w_tea(); eq(L[L.length - 1], '泡茶', 'card verb'); ok(L.length === 6, 'card: [station] > [item] > [face] + verb'); }
  v.wt = VIP_URGENT + 1; let t = guideTarget();
  ok(t && t.kind === 'urn' && t.vip, 'arrow: an urn for the VIP (' + (t && t.kind) + ')');
  const ic = guideIcon(t); ok(ic && ic.width === 24 && ic.height === 11, 'arrow icon: [station] > [item] 24 x 11');
  // render with the glow on (no throw, the verb on screen when the urn is in view)
  P.x = tcx(SPOT.urn1); P.y = tcy(SPOT.urn1) + 16; updCam(0, true); GUIDE = guideTarget(); TQ.length = 0; render(); ok(TQ.some(q => q.s === '泡茶'), 'the urn tag says 泡茶');
  P.tray = ['tea']; gl = wishGlow(); ok(!gl, 'tea on the tray: the glow stops');
  eq(vipBubbleImg('tea').width, 14, 'tea on the tray: the plain wish bubble again');
  t = guideTarget(); ok(t && t.kind === 'deliver', 'then the arrow goes to the guest (' + (t && t.kind) + ')');
  P.tray = []; P.x = VIPG.x; P.y = VIPG.y + 8; P.tray = ['tea']; run(.5); ok(!FIRST_Q.some(f => f.key === 'w_tea'), 'done: the card goes'); }
// a second VIP's tea: no card again
{ VIPG = null; const v = seat('granny', 'tea'); ok(!FIRST_Q.some(f => f.key === 'w_tea'), 'tea card only once'); }
// ---- bath: the tub glows (放水), no route bubble (the tub is the wish), the arrow's icon is the tub
st(); S.stats.vips = 1;
{ const v = seat('kawa', 'bath'), gl = wishGlow(); ok(gl && gl.ids[0] === 'tap', 'bath: the tap glows'); eq(vipBubbleImg('bath').width, 14, 'bath: its own bubble');
  ok(FIRST_Q.some(f => f.key === 'w_bath'), 'bath card'); v.wt = VIP_URGENT + 1; const t = guideTarget(); ok(t && t.kind === 'tap' && guideIcon(t) === stationIcon('tub'), 'arrow: the tap with the tub icon');
  P.x = tcx(ROOM.c3.tap); P.y = tcy(ROOM.c3.tap); run(VIP_TAP_T + .1); eq(VIPG.st, 'soak', 'soaking'); ok(!wishGlow(), 'soaking: no glow'); }
// ---- photo: nothing glows, the camera bubble
st(); S.stats.vips = 1; { seat('kawa', 'photo'); ok(!wishGlow(), 'photo: no station'); ok(FIRST_Q.some(f => f.key === 'w_photo'), 'photo card'); eq(FIRST_CARD.w_photo().pop(), '合影', 'photo verb'); }
// ---- kaiseki / milk / rice: their stations and verbs
st(); S.stats.vips = 1;
for (const [who, k, id, verb] of [['ozeki', 'kaiseki', 'stove', '做饭'], ['r_boy', 'milk', 'milk', '拿奶'], ['r_fisher', 'rice', 'pass', '拿饭']]) {
  VIPG = null; FIRST_Q.length = 0; seat(who, k); const gl = wishGlow();
  ok(gl && gl.k === k && gl.ids.includes(id), k + ': ' + id + ' glows'); eq(wishVerb(k, id), verb, k + ' verb');
  ok(FIRST_Q.some(f => f.key === WISH_CARD[k]), k + ': its card'); eq(vipBubbleImg(k).width, 30, k + ': route bubble');
}
// ---- an old save that saw the v2.0.1 cards still gets the new ones once
{ const raw = JSON.parse(JSON.stringify(defaults())); raw.seen = { vip: true, bath: true, kaiseki: true, photo: true }; const s = loadState(raw); ok(!s.seen.w_bath && !s.seen.w_kai && s.seen.kaiseki, 'old seen keys kept, the new cards still to come'); }
// ---- the glow-only bot: never reads GUIDE / guideTarget. It greets the guest on the carpet, walks into the clean suite
// (the 3-step card shows that), then: a glowing station -> stand on its spot; the item on the tray -> to the guest; no
// glow (photo / stay) -> beside the guest
function walkTo(tx, ty, maxSec, f) {
  const [sx, sy] = tileOf(P); let path = findPath(sx, sy, tx, ty) || [];
  for (let i = 0, n = Math.round((maxSec || 30) / DT); i < n && path.length; i++) {
    const [px, py] = path[0], dx = px * 16 + 8 - P.x, dy = py * 16 + 8 - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { path.shift(); continue; }
    botMove = { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) }; update(DT);
    if (f && f()) break;
  }
  botMove = null;
}
function host(who) {
  VIPG = null; vipT = 1e9; vipArrive(); const v = VIPG;
  if (RARE[who]) Object.assign(v, { id: who, rare: true, look: RARE_LOOK[who], kits: undefined }); else Object.assign(v, { id: who, look: VIP_LOOK[who] });
  v.ws = null; let guard = 0;
  run(20, () => v.st === 'carpet');
  while (VIPG === v && v.st !== 'leave' && guard++ < 400) {
    if (v.st === 'carpet') { walkTo(...tileOf(v), 10, () => v.st === 'follow'); run(1, () => v.st === 'follow'); }
    else if (v.st === 'follow') { const rm = cleanSuite(), t = suiteInner(rm); walkTo(t[0], t[1], 20, () => v.st !== 'follow'); }
    else if (v.st === 'toSuite' || v.st === 'soak' || (v.st === 'seated' && v.hold > 0)) run(.5);
    else if (v.st === 'seated') {
      const k = vipWish(), gl = wishGlow();
      if (gl) { const s = stationAt(gl.ids[0]); walkTo(s.tile[0], s.tile[1], 30); run(k === 'kaiseki' ? KAISEKI_T + .3 : k === 'bath' ? VIP_TAP_T + .3 : 1, () => P.tray.includes(k) || v.st !== 'seated'); }
      else { const st0 = ROOM[v.suite].stand; walkTo(st0[0], st0[1] + 1, 30); botMove = { x: (v.x - P.x) / 16, y: -1 }; run(.25); botMove = null; run(4, () => vipWish() !== k); }   // to the guest: the hand-over / the photo
    } else run(.5);
  }
  if (!(VIPG !== v || v.st === 'leave')) console.log('  stuck: ' + who + ' ' + v.st + ' wish ' + vipWish() + ' tray ' + P.tray + ' at ' + tileOf(P) + ' glow ' + JSON.stringify(wishGlow()));
  return VIPG !== v || v.st === 'leave';
}
st(); S.stats.vips = 1; S.unlocked.chef = false; PASS.n = 0;
const done = [];
for (const who of ['kawa', 'ozeki', 'sakura', 'captain', 'star', 'granny', 'r_boy', 'r_fisher', 'r_bride']) {
  const n0 = S.stats.vips; P.x = 17 * 16 + 8; P.y = 25 * 16 + 8; P.tray = []; for (const rm of SUITES) S.rooms[rm.id] = 'clean';
  ok(host(who) && S.stats.vips === n0 + 1, 'glow-only bot hosted ' + who + ' to the photo'); done.push(who);
}
console.log('  glow-only bot hosted: ' + done.join(' '));
console.log(errs.length ? 'SYS VIPGUIDE FAIL\n  ' + errs.join('\n  ') : 'SYS VIPGUIDE OK');
if (errs.length) process.exitCode = 1;
