// SPEC_v2 4.4: VIPs. The first one (猫川先生) 20 s after 庭园, then 210 +- 30 s after the last one left (star 5: 180;
// suite B x0.7); one at a time; the six in order, then at random (never twice running). arrive -> red carpet (17,26) ->
// greet (within 14 px for 0.5 s) -> follows 16 px behind on your crumbs (stops > 96 px behind with "...", goes on within
// 48 px) -> you step into a clean empty suite (A first) -> it walks to its seat -> 3 wishes (tea / kaiseki by tray, bath:
// tap 1.5 s then it soaks 5 s, photo: beside it 1.2 s; stage 4: after tea / kaiseki it sips / eats VIP_SIP_T s first) -> 25% G per earlier wish (♥2), photo 50% G x f (♥10, +10 first)
// -> gift on the shelf, album; leaves, suite messy (cleans x2, maids put it first while a VIP waits). Soft fails: 60 s
// unwelcomed -> walks to the suite alone; no clean suite -> waits, no clock. v2.0.1 G1: a wish never runs out (no more
// "leaves after 120 s") - a slow one tips less (wishF: full within VIP_WISH_FAST s, 60 % at +VIP_WISH_SLOW s); the wish is a
// big gold bubble; each wish done pops a big tick; the first VIP's 3-step card stays up until its first wish is done.
// Not saved: half of the unpaid G goes to the cash box on load (10.1).
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_vip.js --seed 7
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + (+a).toFixed(2) + ' (want ' + b + ' +- ' + tol + ')');
const DT = 1 / 30;
const PRE = UNLOCKS.filter(u => !u.need5 && UNLOCK.garden.req.concat(['dining', 'onsen', 'tea', 'recep', 'maid1', 'room5', 'room6', 'room2', 'room3', 'room4']).includes(u.id)).map(u => u.id);
function st(list, peak) {
  S = defaults(); for (const id of PRE.concat(list || [])) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = Math.max(starOf(S), peak || 1); S.basket = BASKET_MAX; S.tut.moved = true; resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0;
  P.x = 13 * 16 + 8; P.y = 27 * 16 + 8;
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
// walk the innkeeper to a tile like a player would (joystick at full tilt along the BFS path)
function walkTo(tx, ty, maxSec, f) {
  const [sx, sy] = tileOf(P); let path = findPath(sx, sy, tx, ty) || [];
  for (let i = 0, n = Math.round((maxSec || 30) / DT); i < n && path.length; i++) {
    const [px, py] = path[0], dx = px * 16 + 8 - P.x, dy = py * 16 + 8 - P.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { path.shift(); continue; }
    botMove = { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) }; update(DT);
    if (f && f()) break;
  }
  botMove = null; update(DT);
}
const toVip = () => { P.x = VIPG.x; P.y = VIPG.y; };
const arrive = pre => { unlockNow('garden'); if (pre) pre(); run(VIP_FIRST + .1); ok(!!VIPG, 'VIP arrived'); run(15, () => VIPG && VIPG.st === 'carpet'); eq(VIPG && VIPG.st, 'carpet', 'on the red carpet'); };
function unlockNow(id) { const m = S.money; unlock(id); S.money = m; STAFF.length = 0; }   // bought; no staff walking about
const greet = () => { toVip(); run(.6); eq(VIPG.st, 'follow', 'greeted -> follows'); };
// escort to the suite like a player: walk into its first inner tile
const escort = rm => { walkTo(suiteInner(rm)[0], suiteInner(rm)[1], 40); run(15, () => VIPG.st === 'seated'); eq(VIPG.st, 'seated', 'seated in ' + rm.id); };
// ---- the first VIP: 20 s after 庭园, 猫川先生
st([], 3);
{ unlockNow('garden'); ok(!VIPG, 'nobody yet'); run(VIP_FIRST - .2); ok(!VIPG, 'not before 20 s'); run(.4); ok(VIPG && VIPG.id === 'kawa', 'kawa first'); eq(S.vipNext, 1, 'vipNext 1'); eq(S.album.vip.kawa, 1, 'album: seen once');
  eq(VIPG.look.outfit, 'robe', 'robe'); eq(VIPG.look.hat, 'beret', 'beret'); ok(FIRST_Q.some(f => f.key === 'vip'), 'first-time card "vip"');
  run(15, () => VIPG.st === 'carpet'); eq(tileOf(VIPG) + '', SPOT.carpet + '', 'waits on the red carpet'); ok(!Q.includes(VIPG) && !GUESTS.includes(VIPG), 'no queue, not a guest');
  let t = guideTarget(); ok(t && t.kind === 'vip', 'arrow: the VIP (' + (t && t.kind) + ')');
  // greeting: 0.5 s within 14 px
  toVip(); P.x += 13; run(.45); eq(VIPG.st, 'carpet', 'not before 0.5 s'); t = guideTarget(); ok(t && t.here, 'greeting = here');
  run(.1); eq(VIPG.st, 'follow', 'greeted at 0.5 s'); ok(VIPG.greetAt !== null, 'greet time');
  t = guideTarget(); ok(t && t.kind === 'suite', 'arrow: into the suite (' + (t && t.kind) + ')');
  // it follows 16 px behind; the innkeeper walks to the lobby's west end and back: never more than ~96 px
  let far = 0; walkTo(11, 27, 10, () => { far = Math.max(far, dist(P.x, P.y, VIPG.x, VIPG.y)); return false; });
  ok(far < VIP_HALT, 'keeps up on a walk: max ' + R(far) + ' px'); ok(dist(P.x, P.y, VIPG.x, VIPG.y) <= VIP_FOLLOW + 2, 'stops 16 px behind: ' + R(dist(P.x, P.y, VIPG.x, VIPG.y)));
  // run off: it stops with "...", the arrow points back at it; come back within 48 px: it walks to you
  const vx = VIPG.x, vy = VIPG.y; P.x = 22 * 16 + 8; P.y = 24 * 16 + 8; run(.2); ok(VIPG.halt, 'halted > 96 px behind'); run(1); ok(dist(VIPG.x, VIPG.y, vx, vy) < 1, 'stays put while halted');
  t = guideTarget(); ok(t && t.kind === 'vip', 'arrow back to it (' + (t && t.kind) + ')');
  P.x = VIPG.x + 40; P.y = VIPG.y; run(.1); ok(!VIPG.halt, 'goes on within 48 px'); run(2); ok(dist(P.x, P.y, VIPG.x, VIPG.y) <= VIP_FOLLOW + 2, 'caught up');
  // escort: into suite A
  escort(ROOM.c3); eq(VIPG.suite, 'c3', 'suite A first'); eq(RT.c3.guest, VIPG, 'suite taken'); eq(tileOf(VIPG) + '', ROOM.c3.stand + '', 'at its seat'); eq(VIPG.dir, 'up', 'faces the table');
  ok(S.vipOwe > 0 && S.vipOwe === VIPG.G, 'owed = G once seated'); eq(VIPG.G, R(20 * STARS[star()].room * qualityQ()), 'G = 20 x room x Q');
  ok(FIRST_Q.some(f => f.key === 'vip'), 'the 3-step card is still up while it is seated'); { const bt = bubbleTop(VIPG); ok(bt && VIPG.y - bt[1] >= 40, 'the big wish bubble: its top ' + (bt && R(VIPG.y - bt[1])) + ' px over the feet'); }
  // wish 1: tea (from urn 2, the nearer one) -> 25% G, ♥2
  t = guideTarget(); ok(t && t.kind === 'urn' && t.tx === SPOT.urn2[0], 'arrow: tea from urn 2 (' + (t && t.kind + ' ' + t.tx + ',' + t.ty) + ')');
  ok(trayWants().some(w => w.vip && w.k === 'tea'), 'the tea wish is a tray want');
  walkTo(SPOT.urn2[0], SPOT.urn2[1], 20); run(.5); ok(P.tray.includes('tea'), 'tea picked up at urn 2');
  t = guideTarget(); ok(t && t.kind === 'deliver', 'arrow: deliver (' + (t && t.kind) + ')');
  const m0 = S.money, h0 = S.hearts, G = VIPG.G; walkTo(ROOM.c3.stand[0], ROOM.c3.stand[1], 20); run(.4);
  eq(S.money - m0, R(G * .25), 'tea: 25% of G'); eq(S.hearts - h0, 2, 'tea: ♥2'); eq(VIPG.wi, 1, 'next wish'); eq(S.vipOwe, G - R(G * .25), 'owed shrinks');
  ok(FX.some(x => x.k === 'vipok'), 'a big tick over it'); ok(!FIRST_Q.some(f => f.key === 'vip'), 'the 3-step card is done with the first wish');
  eq(vipWish(), null, 'sips the tea first (no wish shown)'); ok(!guideTarget() || guideTarget().kind !== 'tap', 'no arrow to the tap while it sips'); run(VIP_SIP_T.tea + .1); eq(vipWish(), 'bath', 'bath next'); eq(VIPG.t < 1, true, 'the idle clock starts after the sip');
  ok(FIRST_Q.some(f => f.key === 'w_bath'), 'first-time card "w_bath" (v2.2)');
  // wish 2: bath - the tap 1.5 s, it soaks 5 s (you may leave)
  S.money = 0; t = guideTarget(); ok(t && t.kind === 'tap', 'arrow: the tap (' + (t && t.kind) + ')');
  walkTo(ROOM.c3.tap[0], ROOM.c3.tap[1], 10); run(1.3); eq(VIPG.st, 'seated', 'not before 1.5 s'); ok(guideTarget().here, 'on the tap = here'); ok(tubBusy(ROOM.c3), 'tub steams while filling');
  run(.3); eq(VIPG.st, 'soak', 'soaking'); P.x = 25 * 16 + 8; P.y = 20 * 16 + 8; const m1 = S.money; run(4.6); eq(VIPG.st, 'soak', 'soaks 5 s'); run(.5);
  eq(VIPG.st, 'seated', 'back to its seat'); eq(S.money - m1, R(G * .25), 'bath: 25%'); eq(vipWish(), 'photo', 'photo last');
  // wish 3: photo - beside it 1.2 s -> 50% x f, ♥10 + 10 (first photo), gift, album; leaves; suite messy (x2 clean)
  S.money = 0; t = guideTarget(); ok(t && t.kind === 'photo', 'arrow: photo (' + (t && t.kind) + ')');
  toVip(); run(1.1); eq(VIPG.wi, 2, 'not before 1.2 s'); const m2 = S.money, h2 = S.hearts, used = S.stats.time + .2 - VIPG.greetAt; run(.2);
  const f = .6 + .4 * clamp(1 - (used - 90) / 120, 0, 1);
  near(S.money - m2, G * .5 * f, 2, 'photo: 50% x f'); eq(S.hearts - h2, 20, 'photo ♥10 + 10 first time'); eq(S.album.photos.length, 1, 'album photo'); eq(S.album.photos[0].v, 'kawa', 'photo of kawa');
  eq(S.gifts.join(), 'kawa', 'gift on the shelf'); eq(S.stats.vips, 1, 'stats.vips'); eq(VIPG.st, 'leave', 'leaves'); eq(S.rooms.c3, 'messy', 'suite messy'); ok(RT.c3.vipMess, 'long clean');
  eq(S.vipOwe, 0, 'nothing owed'); ok(FX.some(x => x.k === 'polaroid'), 'polaroid flies'); ok(vipT - S.stats.time >= 180 - .1 && vipT - S.stats.time <= 240 + .1, 'next in 210 +- 30: ' + R(vipT - S.stats.time));
  run(20, () => !VIPG); ok(!VIPG, 'gone'); ok(!RT.c3.guest, 'suite free');
  // cleaning a VIP suite takes twice as long
  STAFF.length = 0; RT.c3.cleanP = 0; P.x = ROOM.c3.cleanC[0]; P.y = ROOM.c3.cleanC[1]; run(CLEAN_T * 2 - .1); eq(S.rooms.c3, 'messy', 'not clean at 2 x CLEAN_T - 0.1'); run(.2); eq(S.rooms.c3, 'clean', 'clean at 2 x CLEAN_T'); ok(!RT.c3.vipMess, 'flag cleared'); }
// ---- the same VIP again (not the first photo): ♥10 only
{ st([], 4); S.album.photos.push({ v: 'kawa', d: 1, h: null, p: null }); arrive(); greet(); escort(ROOM.c3);
  for (let k = 0; k < 2; k++) { const w = vipWish(); if (w === 'tea') { P.tray = ['tea']; toVip(); run(.4 + VIP_SIP_T.tea + .1); } else if (w === 'bath') { P.x = tcx(ROOM.c3.tap); P.y = tcy(ROOM.c3.tap); run(1.6); P.x = 400; P.y = 400; run(5.2); } }
  const h0 = S.hearts; toVip(); run(1.3); eq(S.hearts - h0, 10, 'second photo of kawa: ♥10 only'); eq(S.gifts.length, 1, 'gift shelf: one per VIP'); }
// ---- kaiseki (大关): the stove 3 s (gold ring), one box on the tray, carried to the suite
{ st(['chef'], 4); S.vipNext = 1; arrive(); eq(VIPG.id, 'ozeki', 'the second VIP is 大关'); greet(); escort(ROOM.c3);
  eq(vipWish(), 'kaiseki', 'kaiseki first'); ok(FIRST_Q.some(f => f.key === 'w_kai') || (S.seen.w_kai && FIRST_Q.some(f => f.key === 'vip')), 'kaiseki card (v2.2: w_kai; the first VIP ever: inside its 3-step card)');
  let t = guideTarget(); ok(t && t.kind === 'stove', 'arrow: the stove (' + (t && t.kind) + ')');
  P.x = tcx(PICK_TILE.stove); P.y = tcy(PICK_TILE.stove); run(2.8); ok(!P.tray.includes('kaiseki'), 'not before 3 s'); eq(P.cookK, 'kaiseki', 'cooking kaiseki');
  run(.4); eq(countK(P.tray, 'kaiseki'), 1, 'one kaiseki box'); run(4); eq(countK(P.tray, 'kaiseki'), 1, 'only one');
  t = guideTarget(); ok(t && t.kind === 'deliver', 'arrow: deliver the box (' + (t && t.kind) + ')');
  const m0 = S.money; walkTo(ROOM.c3.stand[0], ROOM.c3.stand[1], 40); run(.4); ok(!P.tray.includes('kaiseki'), 'handed over'); eq(S.money - m0, R(VIPG.G * .25), 'kaiseki: 25%'); }
// ---- nobody greets it: after 60 s it walks to the suite by itself; the wishes still work
{ st([], 4); arrive(); P.x = 40; P.y = 34 * 16; run(VIP_NOGREET - 1); eq(VIPG.st, 'carpet', 'waits 60 s'); run(1.2); eq(VIPG.st, 'toSuite', 'walks there alone');
  run(30, () => VIPG.st === 'seated'); eq(VIPG.st, 'seated', 'seated alone'); }
// ---- no time limit (G1): left alone for 10 minutes it is still there, wish shown; the slow wish then tips 60 %
{ st([], 4); arrive(); greet(); escort(ROOM.c3); P.tray = ['tea']; toVip(); run(.4); const m0 = S.money, ang = S.stats.angry; P.x = 40; P.y = 34 * 16; P.tray = []; run(VIP_SIP_T.tea);
  run(600); eq(VIPG.st, 'seated', 'still seated after 10 min'); eq(vipWish(), 'bath', 'its wish still up'); eq(RUN.vipLeft, 0, 'nobody left'); eq(S.money, m0, 'no money lost'); eq(S.stats.angry, ang, 'not angry');
  eq(wishF(0), 1, 'wishF quick = 1'); eq(wishF(VIP_WISH_FAST), 1, 'wishF at VIP_WISH_FAST = 1'); ok(Math.abs(wishF(VIP_WISH_FAST + VIP_WISH_SLOW) - .6) < 1e-9 && wishF(1e4) === .6, 'wishF slow = 0.6');
  const m1 = S.money, G = VIPG.G; P.x = tcx(ROOM.c3.tap); P.y = tcy(ROOM.c3.tap); run(1.6); P.x = 400; P.y = 400; run(5.2); eq(S.money - m1, R(G * .25 * .6), 'the bath after 10 min: 25% x 0.6'); }
// ---- no clean suite: it waits on the carpet, the 60 s clock stops; the arrow / the maids go to the dirty suite first
{ st(['maid2'], 4); arrive(() => { S.rooms.c3 = 'messy'; RT.c3.vipMess = true; S.rooms.room2 = 'messy'; P.x = 40; P.y = 34 * 16; });
  STAFF.length = 0; run(VIP_NOGREET + 5); eq(VIPG.st, 'carpet', 'still waiting after 65 s (no clock)'); ok(vipNeedsSuite(), 'needs a suite');
  toVip(); run(1); eq(VIPG.st, 'carpet', 'cannot be greeted without a clean suite'); P.x = 40; P.y = 34 * 16;
  const t = guideTarget(); ok(t && t.kind === 'clean' && t.tx === ROOM.c3.cleanT[0], 'arrow: the dirty suite (' + (t && t.kind + ' ' + t.tx) + ')');
  ensureStaff(); const maid = STAFF.find(s => s.role === 'maid'); maid.x = 20 * 16 + 8; maid.y = 20 * 16 + 8;   // next to room2
  run(.2); eq(maid.job, 'c3', 'a VIP waits: the maid takes the suite before the nearer room');
  run(80, () => S.rooms.c3 === 'clean'); eq(S.rooms.c3, 'clean', 'cleaned'); ok(VIPG.t < VIP_NOGREET, 'the clock started only now'); }
// ---- suite B when A is dirty
{ st(['suiteB'], 4); arrive(() => { S.rooms.c3 = 'messy'; }); greet(); const t = guideTarget(); ok(t && t.kind === 'suite' && t.tx === suiteInner(ROOM.c4)[0], 'arrow: suite B'); escort(ROOM.c4); eq(VIPG.suite, 'c4', 'suite B'); }
// ---- the gap: 210 +- 30, star 5 180 +- 30, suite B x0.7; order: 6 in order, then never the same twice running
{ st([], 4); const a = []; for (let i = 0; i < 300; i++) a.push(vipGap()); ok(Math.min(...a) >= 180 && Math.max(...a) <= 240, 'gap 180-240');
  S.unlocked.suiteB = true; const b = []; for (let i = 0; i < 300; i++) b.push(vipGap()); ok(Math.min(...b) >= 126 - .01 && Math.max(...b) <= 168 + .01, 'suite B x0.7');
  S.unlocked.roten = true; S.peak = 5; const c = []; for (let i = 0; i < 300; i++) c.push(vipGap()); ok(Math.min(...c) >= 105 - .01 && Math.max(...c) <= 147 + .01, 'star 5 180 +- 30, x0.7');
  st([], 4); const ids = []; for (let i = 0; i < 30; i++) { vipArrive(); ids.push(VIPG.id); VIPG = null; }
  eq(ids.slice(0, 6).join(), VIPS.map(v => v.id).join(), 'first six in order'); ok(ids.every((x, i) => !i || x !== ids[i - 1]), 'never the same twice running'); }
// ---- not saved: half of what is still owed goes to the cash box on load, once; the next VIP then needs the full gap
{ st([], 4); arrive(); greet(); escort(ROOM.c3); P.tray = ['tea']; toVip(); run(.4);
  const owe = S.vipOwe, recep = S.piles.recep || 0; ok(owe > 0, 'owed ' + owe); saveNow();
  S = loadState(); resetWorld(); go('play');
  eq((S.piles.recep || 0) - recep, R(owe * .5), 'half the unpaid gift into the cash box'); eq(S.vipOwe, 0, 'cleared'); ok(!VIPG, 'no VIP after loading');
  ok(vipT - S.stats.time >= 180 - .1, 'no reload shortcut: next VIP after the full gap (' + R(vipT - S.stats.time) + ' s)');
  const again = loadState(); eq((again.piles.recep || 0) - recep, R(owe * .5), 'reloading the same save twice does not stack');
  S = defaults(); Object.assign(S.unlocked, { garden: true }); S.vipNext = 2; resetWorld(); eq(R(vipT - S.stats.time), VIP_RELOAD, 'a plain reload: the next VIP in 60 s'); }
// ---- following the arrow from the garden purchase on: the bot hosts VIPs (invariants hold)
{ st(['chef', 'waiter1', 'w2', 'room7', 'room8', 'milk', 'porter', 'maid2', 'clerk', 'shop', 'd_scroll', 'd_ikebana'], 4); spawnT = 1; S.money = 0; unlockNow('garden'); S.money = 0;
  let path = [], key = '', think = 0, maxSt = 0, stK = '', stT = 0, far = 0;
  for (let i = 0; i < 30 * 480; i++) {
    think -= DT;
    if (think <= 0) { think = .3; const t = guideTarget(); if (!t || t.here) { path = []; key = ''; } else if (t.tx + ',' + t.ty !== key || !path.length) { key = t.tx + ',' + t.ty; const [sx, sy] = tileOf(P); path = findPath(sx, sy, t.tx, t.ty) || []; } }
    if (path.length) { const [tx, ty] = path[0], dx = tx * 16 + 8 - P.x, dy = ty * 16 + 8 - P.y, d = Math.hypot(dx, dy); if (d < 1.5) path.shift(); botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null; } else botMove = null;
    update(DT);
    if (VIPG) { const k = VIPG.st + VIPG.wi; if (k !== stK) { stK = k; stT = S.stats.time; } maxSt = Math.max(maxSt, S.stats.time - stT); if (VIPG.st === 'follow' && !VIPG.halt) far = Math.max(far, dist(P.x, P.y, VIPG.x, VIPG.y)); }
  }
  botMove = null;
  ok(S.stats.vips >= 2, 'VIPs hosted in 8 min of following the arrow: ' + S.stats.vips + ' (came ' + RUN.vips + ')');
  ok(maxSt <= 300, 'no VIP state over 300 s: ' + R(maxSt)); ok(far <= 200, 'a following VIP stays within 200 px: ' + R(far));
  ok(RUN.vipF.every(f => f >= .6 && f <= 1), 'speed factor in 0.6..1: ' + RUN.vipF.map(f => f.toFixed(2)));
  console.log('  bot: ' + S.stats.vips + ' hosted, used ' + RUN.vipUsed.map(R).join('/') + ' s, f ' + RUN.vipF.map(f => f.toFixed(2)).join('/') + ', paid ' + RUN.vipPaid); }
let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'render: ' + threw);
console.log(errs.length ? 'SYS VIP FAIL\n  ' + errs.join('\n  ') : 'SYS VIP OK');
if (errs.length) process.exitCode = 1;
