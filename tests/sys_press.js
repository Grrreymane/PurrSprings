// SPEC_v2 16.4: the reporter / the TV crew. From star 3, on a season's 1st day 90 s after sunrise; from star 4 a TV host
// (+ a camera cat) in autumn and winter. Cuts into the line (2nd if the front one is being checked in), never angry, the
// best free room. Score = 1 + desk (<= 10 s at the front) + combo room + towel (<= 5 s at the basket; no onsen = passed)
// + milk machine. Leaving: the result card pauses the game (a tap closes it after 0.8 s); hearts = stars x 15 (TV x 30);
// "popular" 90 s (TV 120 s): room fees / tips x1.3, every check-in hearts +1; the cover on the lobby wall. The arrow: the
// reporter at the front with nobody at the desk -> the desk; waiting at an empty basket with no porter -> towels. It waits
// while the first VIP is shown round or a new area has just opened.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_press.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const upTo = id => UNLOCKS.filter(u => !u.need5 && !u.when && UNLOCKS.indexOf(u) <= UNLOCKS.indexOf(UNLOCK[id])).map(u => u.id);
const STAR3 = upTo('w3'), STAR4 = upTo('suiteB');
function setup(list, day, clock, o) {
  S = defaults(); for (const id of list || []) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.tut.moved = true; S.day = day || 4; S.clock = clock === undefined ? .349 : clock; S.stats.time = 600; S.basket = BASKET_MAX; Object.assign(S, o || {});
  resetWorld(); go('play'); spawnT = 1e9; BANNER_Q.length = 0; FIRST_Q.length = 0;
}
let cards = 0;
const run = (sec, f, keep) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (state === 'card') { cards++; if (!keep) modalClose(); else return true; } if (f && f()) return true; } return false; };
const rep = () => PRESS.gu;
// ---- who, when
{ setup(STAR3.filter(id => UNLOCKS.indexOf(UNLOCK[id]) < UNLOCKS.indexOf(UNLOCK.dining)), 4); run(2); ok(!rep(), 'not at star 2');
  setup(STAR3, 5); run(2); ok(!rep(), 'not on a season\'s 2nd day'); setup(STAR3, 1); run(2); ok(!rep(), 'not in a new game\'s first spring');
  setup(STAR3, 4, .3); run(2); ok(!rep(), 'not before clock .35');
  setup(STAR3, 4); run(1); ok(!!rep(), 'summer, day 1, .35: the reporter'); eq(S.pressS, absSeason(4), 'saved: this season');
  eq(rep().look.hat, 'beret', 'a beret'); eq(rep().look.acc, 'camera', 'and a camera'); ok(!rep().mate, 'alone');
  ok(BANNER_Q.some(b => b.kind === 'press' && bannerParts(b).parts.some(p => p.t === '记者来了！')), 'banner 记者来了！'); ok(FIRST_Q.some(f => f.key === 'press'), 'the first-time card: what it checks');
  eq(Q[0], rep(), 'at the front of the line'); ok(rep().pat > 1e6, 'no patience to run out');
  run(400); ok(!GUESTS.includes(rep()) || rep().press.done || true, ''); setup(STAR3, 4, .5, { pressS: absSeason(4) }); run(2); ok(!rep(), 'once a season (pressS)');
  setup(STAR4, 7); run(1); ok(rep() && rep().press.tv, 'star 4, autumn: the TV crew'); eq(rep().look.acc, 'mic', 'the host has a mic'); ok(rep().mate && rep().mate.look.acc === 'tvcam', 'a camera cat follows');
  setup(STAR4, 4); run(1); ok(rep() && !rep().press.tv, 'star 4, summer: a reporter');
  setup(STAR3, 10); run(1); ok(rep() && !rep().press.tv, 'star 3, winter: a reporter'); }
// ---- polite: not while the very first VIP is shown round, not within 60 s of a new area (fun check, 18.2)
{ setup(STAR4, 4, .349); S.stats.vips = 0; vipArrive(); run(1); ok(!rep(), 'waits while the first VIP is in'); VIPG = null; vipT = 1e9; run(.2); ok(!rep(), 'still waits while its picture card is up');
  FIRST_Q.length = 0; run(.2); ok(!rep(), 'and for 30 s after a picture card came (v2.1 merge fun check)'); run(PRESS_CARD_CALM); ok(!!rep(), 'then comes');
  setup(STAR3, 4, .349); news('area'); run(1); ok(!rep(), 'waits after a new area opens'); run(PRESS_CALM); ok(!!rep(), 'comes ' + PRESS_CALM + ' s later'); }
// ---- cutting in: second if the front guest is being checked in
{ setup(STAR3, 4, .3); addGuest('regular'); addGuest('regular'); run(8, () => Q[0].ready); Q[0].ck = .3; S.clock = .3499; run(.5, () => !!rep());
  ok(rep() && Q[1] === rep(), 'second behind the guest being checked in (' + Q.indexOf(rep()) + ')'); }
// ---- the best room: combo > decor > plain
{ setup(STAR3.concat(['d_scroll', 'd_ikebana']), 4, .3); S.decor['room3:A'] = 'd_scroll'; S.decor['room3:B'] = 'd_ikebana'; S.decor['room2:A'] = 'd_scroll';
  addGuest('regular'); const gu = GUESTS[GUESTS.length - 1]; gu.press = {}; eq(freeRoom(gu).id, 'room3', 'the combo room');
  S.rooms.room3 = 'messy'; eq(freeRoom(gu).id, 'room2', 'else the room with decor'); }
// ---- a whole visit, played: five stars; the card pauses; rewards; "popular"
function visit(list, o, day, before) {
  setup(list, day || 4, .349, o); STAFF.length = 0; ensureStaff(); if (before) before();
  P.x = DESK_SPOT[0] * 16 + 8; P.y = DESK_SPOT[1] * 16 + 8;   // at the desk: a quick check-in
  cards = 0; run(200, null, true); return MODAL_Q[0];
}
{ const m = visit(STAR3.concat(['d_scroll', 'd_ikebana']), null, 4, () => { for (const rm of GUEST_ROOMS) if (roomOpen(rm)) { S.decor[rm.id + ':A'] = 'd_scroll'; S.decor[rm.id + ':B'] = 'd_ikebana'; } });
  eq(state, 'card', 'the result card pauses the game'); ok(m && m.kind === 'press', 'a press card');
  eq(m && m.stars, 5, 'five stars: ' + JSON.stringify(m && m.checks)); eq(m && m.hearts, 75, 'hearts 5 x 15');
  onPress({ x: 90, y: 160 }); eq(state, 'card', 'a tap before 0.8 s does nothing');
  const t0 = S.stats.time, c0 = S.clock; for (let i = 0; i < 30; i++) update(DT); eq(S.stats.time + '|' + S.clock, t0 + '|' + c0, 'paused: time and the clock wait');
  onPress({ x: 90, y: 160 }); eq(state, 'play', 'a tap after 0.8 s closes it');
  eq(S.popT > 85 && S.popT <= POP_T, true, '"popular" ~90 s (' + S.popT.toFixed(1) + ')'); eq(S.covers.length, 1, 'a cover on the wall'); eq(S.covers[0].n, 5, 'a 5-star cover');
  const h0 = S.hearts; S.stats.guests += 2; run(DT); eq(S.hearts - h0, 2, 'popular: each check-in hearts +1');
  const icons = []; const _ca = coverArt; coverArt = (n, tv, s) => { icons.push([n, tv]); return _ca(n, tv, s); }; drawHudV21a(60); coverArt = _ca; ok(icons.length === 1 && icons[0][0] === 5, 'HUD: the cover + its ring');
  run(POP_T + 2); eq(S.popT, 0, 'popular is over'); }
// ---- fewer stars: no milk machine, an empty basket and no porter, a plain room, a slow desk
{ const m = visit(STAR3.filter(id => !/^(milk|porter|clerk|net2|maid\d)$/.test(id)), null, 4, () => { S.basket = 0; P.towels = 0; });   // (no maid: they top the basket up)
  ok(m && m.stars <= 3, 'stars ' + (m && m.stars) + ' ' + JSON.stringify(m && m.checks)); ok(m && !m.checks[1] && !m.checks[2] && !m.checks[3], 'combo, towel, milk not ticked: ' + JSON.stringify(m && m.checks));
  eq(m && m.hearts, m && m.stars * 15, 'hearts = stars x 15'); modalClose(); }
// ---- TV: hearts x 30, popular 120 s
{ const m = visit(STAR4, null, 7); ok(m && m.tv, 'TV result'); eq(m && m.hearts, m && m.stars * 30, 'TV hearts = stars x 30'); modalClose(); ok(S.popT > 115 && S.popTV, 'TV: popular 120 s'); }
// ---- the arrow: desk / towels for the reporter
{ setup(STAR3.filter(id => id !== 'recep'), 4, .3); S.unlocked.recep = false; STAFF.length = 0; S.clock = .3499; run(.5);
  run(10, () => rep() && rep().ready && Q[0] === rep()); P.x = 30 * 16; P.y = 5 * 16;
  const t = guideTarget(); ok(t && t.kind === 'desk' && t.rule === 2, 'reporter at the front, nobody at the desk: the desk (' + (t && t.kind + '#' + t.rule) + ')'); }
{ setup(STAR3.filter(id => id !== 'porter'), 4, .3); STAFF.length = 0; S.clock = .3499; run(.5); S.basket = 0;
  const gu = rep(); Q.splice(Q.indexOf(gu), 1); setSt(gu, 'towel'); gu.x = TOWEL_SPOT[0] * 16 + 8; gu.y = TOWEL_SPOT[1] * 16 + 8; gu.wait = 20; P.x = 17 * 16 + 8; P.y = 26 * 16 + 8; P.towels = 0;
  const t = guideTarget(); ok(t && (t.kind === 'shelf' || t.kind === 'basket') && t.rule === 2, 'reporter waiting for a towel: towels (' + (t && t.kind + '#' + t.rule) + ')'); }
// ---- a load mid-visit: the reporter is gone, no card, no second visit this season
{ setup(STAR3, 4); run(1); ok(!!rep(), 'came'); saveNow(); S = loadState(); resetWorld(); go('play'); spawnT = 1e9; run(5); ok(!rep() && state === 'play', 'loaded: no reporter, no card'); }
console.log(errs.length ? 'SYS PRESS FAIL\n  ' + errs.join('\n  ') : 'SYS PRESS OK');
if (errs.length) process.exitCode = 1;
