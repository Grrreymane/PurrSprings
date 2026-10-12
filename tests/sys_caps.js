// SPEC_v2 19.2 (v2.2): pile caps. From star 2 every fish pile and the cash box hold about CAP_SEC s of their own income (a
// running average of what lands there, at least CAP_FLOOR x the room fee); full = what doesn't fit is lost, a "满"
// bubble shows, the arrow points at it (with the clerk: the cash box only), a picture card the first time. The clerk
// raises every cap (x1.5, +0.1 a level) and never bags more than fits in the cash box. Before star 2: no caps. Old saves
// with a pile above its cap keep every fish.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_caps.js --seed 5
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + (+a).toFixed(2) + ' (want ' + b + ' +- ' + tol + ')');
const DT = 1 / 30;
function st(list, o) { S = defaults(); S.day = 7; for (const id of list) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean'; S.peak = Math.max(starOf(S), 1); S.tut.moved = true; S.basket = BASKET_MAX; S.clock = .3; Object.assign(S, o || {}); resetWorld(); go('play'); for (const k in PILE_RATE) delete PILE_RATE[k]; }
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
const STAR2 = ['room2', 'room3', 'onsen', 'recep', 'maid1'];
// ---- star 1: no cap
st(['room2']); spawnT = 1e9; eq(pileCap('recep'), 1e9, 'star 1: no cap'); eq(deposit('recep', 5000), 5000, 'all of it lands');
// ---- star 2: the floor, then full
st(STAR2); spawnT = 1e9; P.x = 400; P.y = 100;
eq(pileCap('onsen'), CAP_FLOOR * STARS[2].room, 'a new pile: the floor ' + CAP_FLOOR + ' x room fee');
{ FIRST_Q.length = 0; S.seen.full = false; let landed = 0, sent = 0;   // 9 fish every 3 s, nobody collecting
  for (let i = 0; i < 30 * 900 && !pileFull('onsen'); i++) { if (i % 90 === 0) { landed += deposit('onsen', 9); sent += 9; } capTick(DT); }
  for (let i = 0; i < 20; i++) { landed += deposit('onsen', 9); sent += 9; }
  ok(S.piles.onsen <= pileCap('onsen') + 9, 'stops at its cap: ' + S.piles.onsen + ' / ' + pileCap('onsen')); eq(landed, S.piles.onsen, 'deposit returns what landed'); ok(landed < sent, 'not everything landed');
  ok(pileFull('onsen'), 'full'); ok((RUN.capLost | 0) > 0, 'the rest is lost: ' + RUN.capLost); ok(FIRST_Q.some(f => f.key === 'full'), 'first full pile: its picture card');
  updCam(0, true); P.x = 13 * 16 + 8; P.y = 5 * 16 + 8; updCam(0, true); TQ.length = 0; render(); ok(TQ.some(q => q.s === '满'), '满 over the full pile');
  const t = guideTarget({ prev: null }); ok(t && t.kind === 'pile' && t.id === 'onsen', 'the arrow: the full pile (' + (t && t.key) + ')');
  P.x = PILE_AT.onsen[0] * 16 + 8; P.y = PILE_AT.onsen[1] * 16 + 8; update(DT); eq(S.piles.onsen | 0, 0, 'picked up'); eq(deposit('onsen', 9), 9, 'and it fills again'); }
// ---- the cap follows the pile's own income: about CAP_SEC s of it
st(STAR2); spawnT = 1e9; P.x = 400; P.y = 100;
{ const rate = 3;   // fish a second, nobody collecting
  for (let i = 0; i < 30 * 600; i++) { if (i % 30 === 0) deposit('milk', rate); capTick(DT); }
  near(pileCap('milk'), rate * CAP_SEC, rate * CAP_SEC * .1, 'after 10 min at ' + rate + '/s: the cap is ~' + CAP_SEC + ' s of it');
  near(S.piles.milk, pileCap('milk'), 3 * rate + 1, 'and the pile sits at it'); }
// ---- the clerk: caps x1.5; he never bags more than fits in the cash box
st(STAR2.concat(['tea', 'milk', 'dining', 'porter', 'clerk'])); spawnT = 1e9; run(.1);
{ const c0 = R(CAP_FLOOR * STARS[star()].room); eq(pileCap('shop'), R(c0 * 1.5), 'clerk hired: x1.5');
  const ck = STAFF.find(s => s.role === 'clerk'); S.staff[ck.id] = 300; eq(pileCap('shop'), R(c0 * 1.9), 'clerk Lv5: x1.9 (not endless)');
  GUESTS.length = 0; Q.length = 0; S.piles.recep = pileCap('recep'); S.piles.milk = 200; P.x = 400; P.y = 60; const m0 = S.piles.milk; run(20); eq(S.piles.milk, m0, 'cash box full: the clerk leaves the pile');
  S.piles.recep = pileCap('recep') - 50; const sum0 = S.piles.recep + S.piles.milk, cl0 = RUN.clerk; run(25);
  ok(S.piles.recep <= pileCap('recep') + 1 && S.piles.recep > sum0 - m0, 'he fills the cash box up to its cap: ' + S.piles.recep + ' / ' + pileCap('recep'));
  ok(S.piles.milk > 0 && S.piles.milk < m0, 'the rest stays in the pile: ' + S.piles.milk); eq(RUN.clerk - cl0, m0 - S.piles.milk, 'what he took from the pile went into the cash box');
  const t = guideTarget({ prev: null }); ok(t && t.kind === 'pile' && t.id === 'recep', 'with the clerk the arrow points at the full cash box only (' + (t && t.key) + ')'); }
// ---- an old save with a pile above its cap keeps every fish; it just doesn't grow
{ const raw = JSON.parse(JSON.stringify(defaults())); for (const id of STAR2) raw.unlocked[id] = true; raw.peak = 2; raw.piles = { recep: 99999, onsen: 5000 };
  S = loadState(raw); resetWorld(); go('play'); eq(S.piles.recep, 99999, 'old cash box kept'); eq(S.piles.onsen, 5000, 'old onsen pile kept'); eq(deposit('onsen', 10), 0, 'above its cap: nothing more lands'); }
// ---- hands off at star 2 for 10 minutes: the piles fill to their caps and stop, nobody is stuck, guests still come
st(STAR2.concat(['tea', 'shop', 'basket1'])); spawnT = 0; P.x = 17 * 16 + 8; P.y = 20 * 16 + 8;
{ run(600); const full = Object.keys(S.piles).filter(pileFull); ok(full.length >= 2, 'after 10 min hands off some piles are full: ' + full.join(' '));
  for (const id in S.piles) ok(S.piles[id] <= pileCap(id) * 1.5 + 60, id + ' about its cap (the cap follows a falling income; nothing is taken back): ' + S.piles[id] + ' / ' + pileCap(id));
  const g0 = S.stats.guests; run(60); ok(S.stats.guests > g0, 'guests still check in'); }
console.log(errs.length ? 'SYS CAPS FAIL\n  ' + errs.join('\n  ') : 'SYS CAPS OK');
if (errs.length) process.exitCode = 1;
