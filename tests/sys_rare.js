// SPEC_v2 16.7 (v2.1 core B): the garden pieces and their rare guests. From star 5 the garden's chain pad (34,26) sells
// eight pieces, each set on its own ground (blocking, every tile still reachable). A piece brings its rare guest 2-5 min
// after it is bought (the next guest of honour is pulled forward to then), then about every 20 min, at most one rare guest
// every RARE_GAP s (a first visit excepted), some only in their season / at night. A rare guest takes the VIP's place
// (one at a time) and walks the VIP flow - carpet, greeting (its own line E11), the suite - with two new wishes: 'stay'
// (beside it, not moving, 3 s; moving resets) and 'show' (stand by it: it follows you; reach its piece: done, it admires
// it and walks back to its seat by itself). Milk / rice wishes come off the tray. The big gold bubble shows both new
// wishes, the arrow leads every step (rule 2's place while it follows you), each new wish has a first-time card. Its
// photo counts the visit (S.rare) and the first one leaves a keepsake (banner, album) - not on the VIP gift shelf. A bot
// that only follows the arrow brings every one of the eight through a whole visit.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_rare.js --seed 5
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const SAID = [];
const _lsB = lineSay; lineSay = (who, key, arg) => { SAID.push([who, key]); return _lsB(who, key, arg); };
const PRE4 = UNLOCKS.filter(u => !u.need5).map(u => u.id).concat(['maid4']);
function setupB(extra, o, keepStaff) {
  S = defaults(); for (const id of PRE4.concat(extra || [])) S.unlocked[id] = true;
  for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = 5; S.basket = BASKET_MAX; S.tut.moved = true; S.done = true; for (const c of COMBOS) S.combos[c.id] = 1; S.stats.vips = 3; S.vipNext = VIPS.length; S.stats.time = 2000;
  Object.assign(S, o || {});
  resetWorld(); go('play'); spawnT = 1e9; if (!keepStaff) STAFF.length = 0; vipT = 1e9;
  P.x = 17 * 16 + 8; P.y = 27 * 16 + 8; SAID.length = 0; BANNER_Q.length = 0; FIRST_Q.length = 0;
}
const runB = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (state === 'celebrate') go('play'); if (f && f()) return true; } return false; };
const atB = (tx, ty) => { P.x = tx * 16 + 8; P.y = ty * 16 + 8; };
// a bot that only follows the arrow (re-reads it every 0.25 s; a moving target too), like tests/bot_balance.js
function followB(sec, until) {
  let path = [], key = '', think = 0;
  for (let i = 0, n = Math.round(sec / DT); i < n; i++) {
    think -= DT;
    if (think <= 0) {
      think = .25; const g = GUIDE;
      if (!g || g.here) { path = []; key = ''; }
      else { const k = g.key + '@' + g.tx + ',' + g.ty; if (k !== key || !path.length) { key = k; const [sx, sy] = tileOf(P); path = findPath(sx, sy, g.tx, g.ty) || []; } }
    }
    if (path.length) {
      const [tx, ty] = path[0], dx = tx * 16 + 8 - P.x, dy = ty * 16 + 8 - P.y, d = Math.hypot(dx, dy);
      if (d < 1.5) path.shift();
      botMove = d > .01 ? { x: dx / d * Math.min(1, d / 3), y: dy / d * Math.min(1, d / 3) } : null;
    } else botMove = null;
    update(DT); if (state === 'celebrate') go('play');
    if (until && until()) { botMove = null; return true; }
  }
  botMove = null; return false;
}
// ---- the chain pad: eight pieces in price order, each on its own ground
setupB();
{ eq([...PADPOS].find(([id]) => UNLOCK[id].gz)[0], 'gd_chime', 'the garden chain pad shows the wind chime first'); eq(padXY(UNLOCK.gd_chime) + '', GZ_PAD + '', 'at (34,26)');
  let prev = 0; for (const [id, , price] of GARDEN_B) { ok(price >= prev, id + ' in price order'); prev = price; }
  for (const [id, , , at] of GARDEN_B) { S.unlocked[id] = true; } rebuildWorld();
  for (const [id, , , at] of GARDEN_B) { ok(BLOCK[at[1] * MW + at[0]] === 1, id + ' stands (blocks) at ' + at); ok(!!showTile({ id: RARES.find(r => r.piece === id).id }), id + ': a free tile beside it'); }
  for (const [id] of GARDEN_B) delete S.unlocked[id]; rebuildWorld(); }
// ---- bought: its guest due in 2-5 min, the next guest of honour pulled forward; then it comes in the VIP's place
setupB();
{ const t0 = S.stats.time; vipT = t0 + 999; S.money = 10000; unlock('gd_zen'); const due = RARE_DUE.r_zen;
  ok(due >= t0 + RARE_FIRST[0] && due <= t0 + RARE_FIRST[1], 'r_zen due in 2-5 min (' + (due - t0).toFixed(0) + ' s)'); eq(vipT, due, 'the next guest of honour comes then');
  eq(PADPOS.has('gd_zen'), false, 'bought'); ok([...PADPOS.keys()].includes('gd_mill'), 'the chain moves on (the mill)');
  runB(due - S.stats.time + .5); ok(VIPG && VIPG.rare && VIPG.id === 'r_zen', 'the zen master came (' + (VIPG && VIPG.id) + ')');
  ok(BANNER_Q.some(b => b.kind === 'rare' && b.id === 'r_zen'), 'a "rare guest" banner the first time'); eq(RARE_DUE.r_zen, 1e9, 'not due again while here'); }
// ---- the whole visit, the bot following the arrow only: greet (E11a), suite, tea, stay, photo; keepsake
{ const h0 = S.hearts, gifts = S.gifts.slice(), m0 = S.earned;
  ok(followB(60, () => VIPG && VIPG.st === 'seated'), 'led to a suite by the arrow'); ok(SAID.some(([w, k]) => w === VIPG && k === 'E11a'), 'its greeting line E11a');
  eq(vipWish(), 'tea', 'first wish: tea'); ok(followB(60, () => VIPG.wi === 1 && !(VIPG.hold > 0)), 'tea brought (arrow)');
  eq(vipWish(), 'stay', 'second wish: stay'); guideClock = 0; update(DT); ok(FIRST_Q.some(f => f.key === 'stay') || S.seen.stay, 'the stay picture card'); eq(GUIDE && GUIDE.kind, 'stay', 'the arrow: stand by it (' + (GUIDE && GUIDE.key + ' rule ' + GUIDE.rule + ' P ' + tileOf(P)) + ')');
  const bub = bubbleArt('stay', 0, true); ok(bub !== bubbleArt('dots', 0, true) && bub.width === 14, 'its own gold bubble (14 x 13)');
  // moving beside it resets the ring
  P.x = VIPG.x; P.y = VIPG.y; runB(1.5); ok(VIPG.actT > 1.3, 'standing still: the ring fills'); botMove = { x: .3, y: 0 }; update(DT); botMove = null; update(DT); ok(VIPG.actT < .1, 'a step: it starts over');
  P.x = VIPG.x; P.y = VIPG.y; runB(RARE_STAY_T + .2); eq(VIPG.wi, 2, 'stood by it 3 s: done');
  ok(followB(30, () => !VIPG || VIPG.st === 'leave'), 'photo taken (arrow)'); eq(S.rare.r_zen, 1, 'a visit counted'); ok(BANNER_Q.some(b => b.kind === 'keep' && b.id === 'r_zen'), 'keepsake banner');
  eq(S.gifts.join(), gifts.join(), 'not on the VIP gift shelf'); ok(S.hearts - h0 >= 20, 'hearts (photo +10, first +10)'); ok(S.earned > m0, 'its gift paid');
  ok(S.album.photos.some(p => p.v === 'r_zen'), 'its photo on the lobby wall'); ok(RARE_DUE.r_zen >= S.stats.time + RARE_AGAIN[0] - 1, 'next visit in ~20 min'); }
// ---- show: the kitten brothers want to see their tower first, then milk (the tray), then the photo
setupB(['gd_tower']);
{ RARE_DUE.r_kits = S.stats.time; vipT = S.stats.time; runB(.2); ok(VIPG && VIPG.id === 'r_kits', 'the kitten brothers'); eq(VIPG.kits && VIPG.kits.length, 2, 'two little ones follow the first');
  ok(followB(60, () => VIPG.st === 'seated'), 'seated'); eq(vipWish(), 'show', 'first wish: show'); eq(GUIDE && GUIDE.kind, 'vip', 'the arrow: fetch it');
  ok(followB(20, () => VIPG.st === 'show'), 'it got up and follows'); runB(.3); eq(GUIDE && GUIDE.kind, 'showto', 'the arrow: to its piece'); eq(GUIDE && GUIDE.piece, 'gd_tower', 'the tower');
  ok(guideIcon(GUIDE) !== null, 'the arrow carries the piece as its icon');
  ok(followB(60, () => VIPG.wi === 1), 'reached the tower: done'); eq(VIPG.st, 'back', 'it admires it, then walks back');
  ok(runB(40, () => VIPG.st === 'seated'), 'back in its seat by itself'); eq(vipWish(), 'milk', 'next: milk');
  ok(followB(60, () => VIPG.wi === 2 && !(VIPG.hold > 0)), 'milk from the machine (arrow)');
  ok(followB(30, () => !VIPG || VIPG.st === 'leave'), 'photo'); eq(S.rare.r_kits, 1, 'counted');
  let threw = null; try { for (let i = 0; i < 3; i++) { runB(.3); render(); } } catch (e) { threw = e; } ok(!threw, 'the kittens drawn: ' + threw); }
// ---- conditions: the summer boy only in summer, the fox bride only at night; a seen one waits RARE_GAP after a visit
setupB(['gd_chime', 'gd_torii']);
{ RARE_DUE.r_boy = S.stats.time - 1; RARE_DUE.r_bride = S.stats.time - 1; S.day = 1; S.clock = .3; eq(rarePick(), null, 'spring day: neither');
  S.day = 4; eq(rarePick() && rarePick().id, 'r_boy', 'summer (day 4): the boy'); S.day = 1; S.clock = .9; eq(rarePick() && rarePick().id, 'r_bride', 'night: the bride');
  S.rare.r_bride = 1; rareLast = S.stats.time - 10; eq(rarePick(), null, 'seen before and a rare guest 10 s ago: wait for the gap');
  rareLast = S.stats.time - RARE_GAP - 1; eq(rarePick() && rarePick().id, 'r_bride', 'after the gap: it comes');
  S.rare = {}; rareLast = S.stats.time - 10; eq(rarePick() && rarePick().id, 'r_bride', 'a first visit never waits for the gap'); }
// ---- every rare guest, start to end, following the arrow only (season / night set as it needs)
for (const r of RARES) {
  setupB([r.piece], null, true);   // the chef keeps the dining counter stocked (the fisher wants rice)
  if (typeof r.when === 'number') S.day = 1 + 3 * r.when; if (r.when === 'night') S.clock = .85;
  RARE_DUE[r.id] = S.stats.time; vipT = S.stats.time; runB(.1);
  ok(VIPG && VIPG.id === r.id, r.id + ' came'); if (!VIPG) continue;
  const t0 = S.stats.time; const done = followB(400, () => !VIPG || VIPG.st === 'leave');
  ok(done, r.id + ': a whole visit by the arrow (' + (VIPG ? VIPG.st + ' wish ' + vipWish() : 'gone') + ')'); eq(S.rare[r.id], 1, r.id + ' counted');
  ok(S.stats.time - t0 < 260, r.id + ': ' + (S.stats.time - t0).toFixed(0) + ' s');
}
// ---- the album: 稀客 shows silhouettes until the photo; the info card of a piece shows its guest's silhouette
setupB(['gd_zen']); S.rare = { r_zen: 2 };
{ openMenu(); MENU.page = 'book'; MENU.tab = BOOK_TABS.indexOf('稀客'); let threw = null; try { render(); } catch (e) { threw = e; } ok(!threw, 'album 稀客: ' + threw);
  ok(TQ.some(t => t.s === '禅师'), 'the zen master by name'); ok(TQ.filter(t => t.s === '？？？').length === RARES.length - 1, 'the others: ？？？');
  MENU.tab = BOOK_TABS.indexOf('纪念'); try { render(); } catch (e) { threw = e; } ok(!threw, 'album 纪念: ' + threw); closeMenu();
  atB(34, 27); runB(.2); eq(INFO && INFO.id, 'gd_chime', 'by the chain pad: its info card'); const sil = []; const _so = silOf; silOf = c => { sil.push(c); return _so(c); }; render(); silOf = _so;
  ok(sil.length > 0, 'the card draws the silhouette of the guest it may bring'); }
// ---- saved: visits; unknown ids dropped; a load gives each owned piece's guest a new due time
setupB(['gd_zen', 'gd_teahouse']); S.rare = { r_zen: 3, bogus: 2 };
{ saveNow(); S = loadState(); eq(S.rare.r_zen, 3, 'visits saved'); eq(S.rare.bogus, undefined, 'unknown dropped'); resetWorld(); go('play'); STAFF.length = 0;
  rareSync(); ok(RARE_DUE.r_master >= S.stats.time + RARE_FIRST[0] - 1 && RARE_DUE.r_master <= S.stats.time + RARE_FIRST[1] + 1, 'never seen: 2-5 min after a load');
  ok(RARE_DUE.r_zen >= S.stats.time + RARE_FIRST[1] - 1, 'seen: later'); }
// ---- a rare guest never leaves the VIP slot stuck: no clean suite for 4 min -> it leaves and comes back soon
setupB(['gd_zen']);
{ for (const rm of SUITES) S.rooms[rm.id] = 'messy'; RARE_DUE.r_zen = S.stats.time; vipT = S.stats.time; runB(.1); ok(VIPG && VIPG.rare, 'came');
  runB(VIP_NOSUITE + 40, () => !VIPG); ok(!VIPG || VIPG.st === 'leave', 'no suite: it leaves (改日再访)'); runB(30); eq(VIPG, null, 'gone'); ok(RARE_DUE.r_zen <= S.stats.time + RARE_FIRST[1] + 1, 'back soon'); }
console.log(errs.length ? 'SYS RARE FAIL\n  ' + errs.join('\n  ') : 'SYS RARE OK');
if (errs.length) process.exitCode = 1;
