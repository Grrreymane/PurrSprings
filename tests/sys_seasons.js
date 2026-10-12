// SPEC_v2 16.1: the four seasons. A season = 3 days (9 min since v2.3), a year = 12 days (36 min), computed from S.day (not saved).
// Sunrise starting a season: the morning banner becomes "夏天来了" (one banner), the world is rebuilt once with
// tileArt(..., season) / doorArt(..., season) / treeArt(kind, season); the night before, seasonWarm(next) builds ahead.
// Particles: petals <= 12 / fireflies <= 8 (summer nights, garden) / leaves <= 10 / snow <= 20 on screen, slow, no
// blinking, not over the floors inside, no Math.random. Fees: 花见亭 x1.3 spring, 萤见亭 x1.3 + milk machine x1.5 summer,
// baths x1.2 winter, a seasonal combo x2.0 in its season. Autumn's 2nd night: the full moon on the water. Winter: twice the
// steam, snow caps on stone lanterns. Seasonal decor: on sale after that season's first festival; the arrow re-dresses a
// room to start a seasonal combo (decor.js redressOf -> seasonStart) and the swaps stop on the piece it showed.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_seasons.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + (+a).toFixed(4) + ' (want ' + b + ' +- ' + tol + ')');
const DT = 1 / 30;
const ALL = UNLOCKS.filter(u => !u.need5 && !u.when).map(u => u.id);
function setup(list, day, clock) {
  S = defaults(); for (const id of list || []) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.tut.moved = true; S.day = day || 1; S.clock = clock === undefined ? .3 : clock; S.stats.time = 600;
  resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0; BANNER_Q.length = 0; FIRST_Q.length = 0;
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (state === 'card') modalClose(); if (f && f()) return true; } return false; };
// ---- the calendar
{ const d = [1, 3, 4, 6, 7, 9, 10, 12, 13, 25, 40];
  eq(d.map(seasonOf).join(''), '00112233001', 'seasons of days ' + d.join(','));
  eq(d.map(seasonDay).join(''), '02020202000', 'day within the season');
  eq(d.map(yearOf).join(''), '11111111234', 'years');
  eq(d.map(absSeason).join(','), '0,0,1,1,2,2,3,3,4,8,13', 'absolute seasons');
  eq(SEASON_DAYS * 4, YEAR_DAYS, '4 seasons a year'); near(SEASON_DAYS * DAY_LEN / 60, 9, 1e-9, 'a season = 9 min (v2.3)'); near(YEAR_DAYS * DAY_LEN / 60, 36, 1e-9, 'a year = 36 min');
  near(PRESS_AT, DAWN_AT + 21.6 / DAY_LEN, 1e-9, 'the reporter: 22 s after sunrise'); ok(PRESS_END <= RUSH_AT, 'and before the evening rush'); ok(YEAR_AT < DAWN_AT, 'the year report comes before sunrise');
  ok(!('season' in defaults()), 'the season is not saved'); }
// ---- sunrise starting a season: one banner, one rebuild, the season's art
{ setup(ALL, 3, .095);
  const seasons = [], doors = [], trees = [], _ta = tileArt, _da = doorArt, _tr = treeArt; let rebuilds = 0; const _rb = rebuildWorld;
  tileArt = (c, x, y, nb, s, l) => { seasons.push(s); return _ta(c, x, y, nb, s, l); }; doorArt = (...a) => { doors.push(a[8]); return _da(...a); }; treeArt = (k, s, z) => { trees.push(s); return _tr(k, s, z); };
  rebuildWorld = () => { rebuilds++; return _rb(); };
  run(2); eq(S.day, 4, 'sunrise: day 4'); eq(seasonNow(), 1, 'summer');
  const kinds = BANNER_Q.map(b => b.kind); ok(kinds.includes('season') && !kinds.includes('day'), 'one banner, the season\'s: ' + kinds.join(','));
  const b = BANNER_Q.find(x => x.kind === 'season'); eq(b && b.id, 1, 'banner: summer'); const parts = bannerParts(b).parts.filter(p => p.t).map(p => p.t).join(''); eq(parts, '夏天来了', 'banner text');
  eq(rebuilds, 1, 'the world rebuilt once'); ok(seasons.length > 1000 && seasons.every(s => s === 1), 'every tile drawn for summer (' + seasons.length + ')'); ok(doors.length && doors.every(s => s === 1), 'doors in summer colours');
  P.x = 32 * 16; P.y = 22 * 16; updCam(0, true); render(); ok(trees.length && trees.every(s => s === 1), 'trees drawn for summer (' + trees.length + ')');
  tileArt = _ta; doorArt = _da; treeArt = _tr; rebuildWorld = _rb;
  BANNER_Q.length = 0; S.clock = .095; run(2); eq(S.day, 5, 'day 5'); ok(!BANNER_Q.some(x => x.kind === 'season'), 'within a season: no season banner (v2.3: and a quiet morning - no day banner before star 5 after day 3)');
  setup(ALL, 12, .095); BANNER_Q.length = 0; run(2); eq(S.day, 13, 'a new year'); const b2 = BANNER_Q.find(x => x.kind === 'season');
  eq(b2 && bannerParts(b2).parts.filter(p => p.t).map(p => p.t).join(''), '第2年春天来了', 'year 2 spring banner');
  // a load / a test that jumps the day: the world follows, no crash
  setup(ALL, 1); S.day = 8; run(.1); eq(V21.season, 2, 'jumped to autumn'); }
// ---- the night before: seasonWarm(next season) until it says done
{ setup(ALL, 6, .85); const asked = []; const _sw = seasonWarm; let n = 0; seasonWarm = s => { asked.push(s); return ++n >= 3; };
  run(1); eq(asked.slice(0, 3).join(','), '2,2,2', 'warms autumn on summer\'s last night'); eq(asked.length, 3, 'stops once done'); seasonWarm = _sw;
  setup(ALL, 5, .85); seasonWarm = s => { asked.push('x'); return true; }; asked.length = 0; run(.5); eq(asked.length, 0, 'not on other nights'); seasonWarm = _sw; }
// ---- fees (16.1 + PLAN_v2.1: summer = the milk machine, not the calls)
{ const f = (day, k, o) => { setup(ALL, day); return fee(k, o); };
  const c1 = d => f(d, 'room', { rm: ROOM.c1 }), c2 = d => f(d, 'room', { rm: ROOM.c2 });
  eq(c1(1), R(c1(7) * 1.3), '花见亭 x1.3 in spring'); eq(c1(4), c1(7), '花见亭: only in spring');
  eq(c2(4), R(c2(7) * 1.3), '萤见亭 x1.3 in summer'); eq(c2(1), c2(7), '萤见亭: only in summer');
  eq(f(4, 'milk', {}), R(f(7, 'milk', {}) * 1.5), 'milk x1.5 in summer'); eq(f(4, 'tea', {}), f(7, 'tea', {}), 'tea unchanged');
  { const w = f(10, 'bath', { slot: SLOTS[0] }), a = f(7, 'bath', { slot: SLOTS[0] }); ok(Math.abs(w - a * 1.2) <= .6 && w > a, 'baths x1.2 in winter: ' + w + ' vs ' + a); }
  for (const k of ['room', 'tip', 'meal', 'souv']) eq(f(10, k, { rm: ROOM.room1 }), f(7, k, { rm: ROOM.room1 }), 'winter: ' + k + ' unchanged');
  // a seasonal combo room: x2.0 in its season, a combo's x1.6 otherwise
  const yz = d => { setup(ALL.concat(['d_sakura', 'd_lantern']), d); S.decor['room1:A'] = 'd_sakura'; S.decor['room1:B'] = 'd_lantern'; return fee('room', { rm: ROOM.room1 }); };
  eq(yz(1), R(STARS[star()].room * 2), '夜樱 room in spring x2.0'); eq(yz(7), R(STARS[star()].room * 1.6), '夜樱 room in autumn x1.6');
  setup(ALL, 7); const r0 = fee('room', { rm: ROOM.room1 }), t0 = fee('tip', { rm: ROOM.room1 }); S.popT = 30;
  eq(fee('room', { rm: ROOM.room1 }), R(r0 * POP_K), '"popular": room x1.3'); eq(fee('tip', { rm: ROOM.room1 }), R(t0 * POP_K), '"popular": tip x1.3'); }
// ---- particles: capped, outdoors, no Math.random, slow
{ let L = [];   // every canvas the frame is drawn into (18.2: the world has its own layers - render.js)
  for (const c of [low, lowW, lowP, lowO]) { const ctx = c.getContext('2d'), _fr = ctx.fillRect; ctx.fillRect = function (x, y, w, h) { L.push([this.fillStyle, this.globalAlpha, x, y, w, h, this.globalCompositeOperation]); return _fr.call(this, x, y, w, h); }; }
  const shotAt = (tx, ty, extra) => { P.x = tx * 16 + 8; P.y = ty * 16 + 8; updCam(0, true); L = []; render(); return L; };
  const count = (cols, LL) => { let n = 0; for (const e of LL) if (cols.includes(e[0])) n++; return n; };
  const spots = [[17, 31], [30, 24], [17, 5], [13, 14], [32, 30]];
  for (const [day, cols, cap, name] of [[1, ['#ffe2ea'], 12, 'petals'], [7, LEAF_COL, 10, 'leaves'], [10, ['#ffffff'], 20, 'snow']]) {
    setup(ALL, day, .3); let worst = 0, inside = 0, rnd = 0; const _r = Math.random; Math.random = () => { rnd++; return _r(); };
    for (const [tx, ty] of spots) for (let k = 0; k < 4; k++) {
      T += 2.3; const LL = shotAt(tx, ty).filter(e => cols.includes(e[0]) && e[1] >= .85 && e[6] === 'source-over' && e[4] <= 2 && e[5] <= 2);
      const org = LL.filter(e => !LL.some(o => o !== e && o[2] === e[2] - 1 && o[3] === e[3] - 1));   // a particle's first pixel (a leaf's 2nd row starts 1 px right / down)
      worst = Math.max(worst, org.length);
      for (const e of org) { const c = ch(Math.floor((e[2] + CX) / 16), Math.floor((e[3] + CY) / 16)); if (c === 't' || c === 'l' || c === '.') inside++; } }
    Math.random = _r;
    ok(worst > 0 && worst <= cap, name + ' on screen: max ' + worst + ' (cap ' + cap + ')'); eq(inside, 0, name + ' over floors inside'); eq(rnd, 0, name + ': no Math.random');
  }
  // they drift slowly: the same flake moves < 1 px a frame
  { setup(ALL, 10, .3); const pos = () => { const c = SEASON_FX[3]; return [...Array(c)].map((_, i) => _v21wrap(_v21h(i, 1) * 4096 + T * 1.5 * (.75 + .5 * _v21h(i, 3)), 0, 9999)); };
    const a = pos(); T += DT; const b = pos(); ok(a.every((x, i) => Math.abs(x - b[i]) < 1), 'snow drifts < 1 px a frame'); }
  // fireflies: summer nights in the garden only, <= 8, fading (1.5 s in, 1.5 s out: never a jump)
  { setup(ALL, 4, .9); let worst = 0; for (let k = 0; k < 8; k++) { T += .7; worst = Math.max(worst, count(['#f4ffb0'], shotAt(31, 22))); }
    ok(worst > 0 && worst <= 8, 'fireflies at night in the garden: max ' + worst);
    S.clock = .3; dayLight(); eq(count(['#f4ffb0'], shotAt(31, 22)), 0, 'none by day'); setup(ALL, 7, .9); eq(count(['#f4ffb0'], shotAt(31, 22)), 0, 'none in autumn');
    let jump = 0; for (let i = 0; i < 300; i++) { const b0 = .5 - .5 * Math.cos((i * DT / 3) * Math.PI * 2), b1 = .5 - .5 * Math.cos(((i + 1) * DT / 3) * Math.PI * 2); jump = Math.max(jump, Math.abs(b1 - b0)); }
    ok(jump < .04, 'a firefly brightens / dims by < .04 a frame (' + jump.toFixed(3) + ')'); }
  // autumn's full moon: the 2nd night of autumn, on the water
  { setup(ALL, 8, .9); ok(moonNight(), 'autumn day 2 night: full moon'); ok(count(['#ffe9a8', '#fff6d0'], shotAt(17, 5)) > 5, 'the moon on the onsen water');
    setup(ALL, 7, .9); ok(!moonNight(), 'not the 1st night'); setup(ALL, 5, .9); ok(!moonNight(), 'not in summer'); setup(ALL, 8, .3); ok(!moonNight(), 'not by day'); }
  // winter: twice the steam over the baths; snow caps on the stone lanterns
  { const steam = day => { setup(ALL, day, .3); return shotAt(17, 5).filter(e => e[0] === '#ffffff' && e[6] === 'source-over' && e[1] < .5 && e[1] > 0).length; };
    const s7 = steam(7), s10 = steam(10); ok(s10 >= s7 * 1.6, 'winter steam ' + s10 + ' vs autumn ' + s7);
    const caps = []; const _sc = snowCapArt; snowCapArt = c => { caps.push(c); return _sc(c); };
    setup(ALL, 10, .3); shotAt(17, 31); ok(caps.length >= 2, 'winter: snow caps on the stone lanterns (' + caps.length + ')');
    caps.length = 0; setup(ALL, 7, .3); shotAt(17, 31); eq(caps.length, 0, 'autumn: none'); snowCapArt = _sc; }
  }
// ---- seasonal decor: on sale after that season's first festival; the arrow starts a seasonal combo in a re-dressed room
{ setup(ALL, 1); S.money = 1e5; padsUpdate();
  ok(!UNLOCKS_V21A.some(u => padEligible(u)), 'no seasonal decor before a festival');
  S.fests[0] = 1; for (const id of DECOR_IDS.filter(id => !UNLOCK[id].when)) S.unlocked[id] = true; padsUpdate();
  ok(padEligible(UNLOCK.d_sakura) && padEligible(UNLOCK.d_lantern) && !padEligible(UNLOCK.d_windbell), 'after a spring festival: the two spring pieces only');
  ok(PADPOS.has('d_sakura') && PADPOS.has('d_lantern'), 'on the shop\'s decor pads: ' + [...PADPOS.keys()].filter(id => UNLOCK[id].decor).join());
  eq(UNLOCK.d_sakura.card, '春季组合加倍', 'the info card line');
  // every room dressed as 雅致和室 (2+ rooms share it): the arrow re-dresses one to start 夜樱
  setup(ALL.concat(['d_sakura', 'd_lantern']), 1); for (const rm of GUEST_ROOMS) if (roomOpen(rm)) { S.decor[rm.id + ':A'] = 'd_scroll'; S.decor[rm.id + ':B'] = 'd_ikebana'; }
  S.combos = { c_ga: 1, c_zen: 1, c_cat: 1, c_fuku: 1 };
  let sl = slotTarget(); ok(sl && sl.k === 'A', 'a re-dress slot A (' + (sl && sl.key) + ')'); eq(sl && slotPiece(sl), 'd_sakura', 'its piece: the spring branch');
  eq(slotCycle(sl)[0], 'd_sakura', 'and it swaps in first');
  P.x = tcx(sl.at); P.y = tcy(sl.at); run(DECOR_T0 + DECOR_T * 2 + .2); eq(S.decor[sl.key], 'd_sakura', 'standing still: the branch, and it stays');
  const slB = slotTarget(); ok(slB && slB.rm === sl.rm && slB.k === 'B', 'then slot B of that room (' + (slB && slB.key) + ')'); eq(slB && slotPiece(slB), 'd_lantern', 'with the lantern');
  P.x = tcx(slB.at); P.y = tcy(slB.at); run(DECOR_T0 + .2); ok(S.combos.c_yozakura, '夜樱 made'); eq(roomCombo(sl.rm) && roomCombo(sl.rm).id, 'c_yozakura', 'the room shows it');
  ok(!slotCands().some(s => s.rm === sl.rm), 'done there'); }
// ---- the 16.12 lines are in the table (lines_check checks their call sites and lengths)
for (const id of ['E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09', 'E10', 'E12']) ok(!!LINES[id], 'line ' + id);
eq(LINES.E09.text(2) + LINES.E09.text(3) + LINES.E09.text(4) + LINES.E09.text(5), '还需努力还不错值得推荐！完美旅馆！', 'E09 by stars');
eq(['come', 'grown', 'ten', 'go'].map(k => LINES.E10.text(k)).join('/'), '来看看你喵/又长大了呢/十年了呀/妈妈为你骄傲', 'E10');
// ---- the album shows 12 combos, 6 a page; seasonal ones carry their season's icon
{ setup(ALL); openMenu(); MENU.page = 'book'; MENU.tab = 1; MENU.pg = 0; const icons = []; const _si = seasonIcon; seasonIcon = s => { icons.push(s); return _si(s); };
  render(); eq(icons.length, 0, 'page 1: the six v2.0 combos'); menuPress({ x: 130, y: 262 }); eq(MENU.pg, 1, 'next page'); render(); eq(icons.slice(0, 4).join(','), '0,1,2,3', 'page 2: spring summer autumn winter'); seasonIcon = _si; closeMenu(); }
console.log(errs.length ? 'SYS SEASONS FAIL\n  ' + errs.join('\n  ') : 'SYS SEASONS OK');
if (errs.length) process.exitCode = 1;
