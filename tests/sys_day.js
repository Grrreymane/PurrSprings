// SPEC_v2 4.10: day and night. A day is 360 s; S.clock runs only while you play (not under the star-5 celebration, not on
// the title); a new save starts at 0.12, the first dusk comes at about 3:20. Sunrise (0.10): the next day, a banner with
// yesterday's guests / hearts (+ trophy on a new record), line S03, birdsong; dusk (0.68): the temple bell. The tint keys
// are mixed smoothly (no steps, nothing blinks). Light pass: one multiply of the tint layer DARK over the view (lamps cut
// soft holes into it first; a thin plain tint where multiply is missing), additive lamp glows (<= 16, nearest the view centre), each room's andon r10 empty / r18 taken, the
// hand lantern at night, fish-pile glints, 8-12 slow stars on the star-view bath; pad frames stay bright on top.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_day.js --seed 5
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + (+a).toFixed(4) + ' (want ' + (+b).toFixed(4) + ' +- ' + tol + ')');
const DT = 1 / 30;
const SFXLOG = [], LINES = [];
const _sfx = sfx; sfx = (k, a) => { SFXLOG.push(k); return _sfx(k, a); };
const _ls = lineSay; lineSay = (who, key) => { LINES.push([who, key]); return _ls(who, key); };
const ALL = UNLOCKS.filter(u => !u.need5).map(u => u.id);
function setup(list) {
  S = defaults(); for (const id of list || []) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.tut.moved = true; resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0; SFXLOG.length = 0; LINES.length = 0; BANNER_Q.length = 0;
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
// draw log of the low canvas: [op, what, alpha, style, x, y, w, h]
const ctx = low.getContext('2d'), LOG = [];
const _fr = ctx.fillRect, _di = ctx.drawImage;
ctx.fillRect = function (x, y, w, h) { LOG.push([this.globalCompositeOperation, 'rect', this.globalAlpha, this.fillStyle, x, y, w, h]); };
ctx.drawImage = function (c, ...a) { LOG.push([this.globalCompositeOperation, 'img', this.globalAlpha, c, ...a]); };
const frame = () => { LOG.length = 0; render(); return LOG.slice(); };
// ---- the clock: 360 s a day, only while playing
setup();
{ eq(S.clock, .12, 'a new save starts at 0.12'); run(36); near(S.clock, .22, .001, '36 s = 0.1 day');
  const c0 = S.clock, t0 = S.stats.time; go('celebrate'); run(5); eq(S.clock, c0, 'clock stops under the celebration'); ok(S.stats.time > t0, '(the inn itself keeps going there, as in v1)');
  go('title'); run(5); eq(S.clock, c0, 'clock stops on the title'); go('play'); }
{ S = defaults(); resetWorld(); go('play'); spawnT = 1e9; let t = null; run(400, () => { if (dayLight().night >= .3) { t = S.stats.time; return true; } return false; });
  ok(t !== null && t > 190 && t < 215, 'first dusk at about 3:20 (' + (t && t.toFixed(1)) + ' s)'); }
// ---- sunrise: the next day; dusk: the bell
setup(['room2', 'room3', 'onsen', 'recep']); ensureStaff();
{ S.clock = .095; S.day = 4; S.dayLog = { g: 12, h: 30, best: 10 }; run(2.5);
  eq(S.day, 5, 'day 5 at sunrise'); eq(S.dayLog.g + ',' + S.dayLog.h + ',' + S.dayLog.best, '0,0,12', 'day log rolled over, best 12');
  const b = BANNER_Q.find(x => x.kind === 'day'); ok(b && b.id === 5 && b.g === 12 && b.h === 30 && b.rec === true, 'sunrise banner day 5, yesterday 12 guests / 30 hearts, new record: ' + JSON.stringify(b));
  ok(SFXLOG.includes('dawn'), 'birdsong'); ok(LINES.some(([w, k]) => w && w.role === 'recep' && k === 'S03'), 'receptionist S03'); eq(RUN.days, 1, 'counted');
  BANNER_Q.length = 0; S.clock = .095; S.dayLog = { g: 5, h: 2, best: 12 }; run(2.5); const b2 = BANNER_Q.find(x => x.kind === 'day'); ok(b2 && b2.rec === false, 'no trophy below the record');
  BANNER_Q.length = 0; S.clock = .095; S.dayLog = { g: 3, h: 0, best: 0 }; run(2.5); const b3 = BANNER_Q.find(x => x.kind === 'day'); ok(b3 && b3.rec === false, 'the first day is not a "record"');
  SFXLOG.length = 0; S.clock = .675; run(2.5); ok(SFXLOG.includes('dusk'), 'the temple bell at dusk'); eq(S.day, 7, 'dusk does not change the day');
  // wrap: midnight passes without a new day
  S.clock = .995; run(3); eq(S.day, 7, 'midnight: same day'); ok(S.clock < .02, 'clock wrapped'); }
// ---- smooth: per frame the tint, its alpha and the night factor move only a little (no steps, nothing blinks)
{ let maxA = 0, maxN = 0, maxC = 0, prev = dayLight(0); const ch = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  for (let i = 1; i <= 360 * 30; i++) { const d = dayLight(i / (360 * 30)); maxA = Math.max(maxA, Math.abs(d.a - prev.a)); maxN = Math.max(maxN, Math.abs(d.night - prev.night));
    const a = ch(d.col), b = ch(prev.col); maxC = Math.max(maxC, ...a.map((v, j) => Math.abs(v - b[j]))); prev = d; }
  ok(maxA < .001 && maxN < .003 && maxC <= 2, 'per frame: alpha ' + maxA.toFixed(5) + ', night ' + maxN.toFixed(5) + ', colour ' + maxC + '/255');
  for (const [c, a, n] of [[0, .42, 1], [.06, .28, .6], [.10, .14, 0], [.3, 0, 0], [.62, .18, 0], [.68, .26, .3], [.8, .42, 1]]) { const d = dayLight(c); near(d.a, a, 1e-9, 'alpha at ' + c); near(d.night, n, 1e-9, 'night at ' + c); }
  ok(STAR_SPOTS.length >= 8 && STAR_SPOTS.length <= 12 && STAR_SPOTS.every(s => s.f <= .5), 'stars: ' + STAR_SPOTS.length + ', each <= 0.5 Hz'); }
// ---- lamps
setup();
{ eq(LIGHTS.length, 10, 'star 1: lobby 2 + corridor 4 + lanterns 2 + entrance 1 + room1 andon');
  setup(ALL); const inArea = L => areaAt(Math.floor(L.x / 16), Math.floor(L.y / 16));
  ok(LIGHTS.every(L => areaOpen(inArea(L)) || !inArea(L)), 'no lamp in a locked area');
  ok(!LIGHTS.some(L => !L.room && L.x >= 7 * 16 && L.x < 10 * 16 && L.y >= 7 * 16 && L.y < 18 * 16), 'the west wing corridor stays dark');
  eq(LIGHTS.filter(L => L.room).length, 15, 'every open room has its andon (15)');
  ok(LIGHTS.every(L => [10, 18, 24, 28].includes(L.r)), 'radii from glowArt\'s set');
  const r1 = LIGHTS.find(L => L.room === ROOM.room1); eq(lightR(r1), 10, 'empty room: r10'); S.rooms.room1 = 'occupied'; eq(lightR(r1), 18, 'someone asleep: r18'); S.rooms.room1 = 'clean'; }
// ---- the light pass
setup(ALL); P.x = 17 * 16 + 8; P.y = 13 * 16 + 8; updCam(0, true);
{ S.clock = .3; let L = frame(); ok(!L.some(e => e[0] === 'multiply' || e[0] === 'lighter'), 'daytime: no light pass'); eq(LIGHT_N, 0, 'no lamps by day');
  S.clock = .9; L = frame(); const tint = L.find(e => e[0] === 'multiply' && e[1] === 'img');
  ok(tint && Math.abs(tint[2] - .42) < 1e-9 && tint[3] === DARK && tint[4] === 0 && tint[5] === 0 && DARK.width === W && DARK.height === H && DARK.getContext('2d').fillStyle === '#2a3468', 'night: one full-view multiply tint .42 #2a3468 (the DARK layer)');
  eq(L.filter(e => e[0] === 'multiply').length, 1, 'exactly one multiply fill');
  const glows = L.filter(e => e[0] === 'lighter'); ok(LIGHT_N > 8 && LIGHT_N <= LIGHT_MAX, 'lamps drawn in the main corridor: ' + LIGHT_N);
  ok(glows.length >= LIGHT_N, 'additive glows ' + glows.length);
  const iT = L.indexOf(tint), lastLight = L.map(e => e[0]).lastIndexOf('lighter'), firstPad = L.findIndex((e, i) => i > lastLight && e[0] === 'source-over' && e[1] === 'rect' && (e[3] === '#fff6d8' || e[3] === '#ffe14a'));
  ok(iT >= 0 && lastLight > iT, 'glows after the tint');
  ok(visiblePads().some(u => { const [tx, ty] = padXY(u); return VIS(tx * 16 + 8, ty * 16 + 8, 20); }) ? firstPad > lastLight : true, 'pad frames drawn again after the light pass');
  ok(L.some(e => e[1] === 'rect' && e[3] === '#ffd27a'), 'the hand lantern at night');
  // the 16 cap holds anywhere on the map at night
  let worst = 0; for (let ty = 2; ty < MH - 1; ty += 2) for (let tx = 1; tx < MW - 1; tx += 2) if (walkable(tx, ty)) { P.x = tx * 16 + 8; P.y = ty * 16 + 8; updCam(0, true); frame(); worst = Math.max(worst, LIGHT_N); }
  ok(worst <= LIGHT_MAX, 'at most ' + LIGHT_MAX + ' lamps anywhere (worst ' + worst + ')');
  // stars on the star-view bath at night
  P.x = 32 * 16 + 8; P.y = 5 * 16 + 8; updCam(0, true); L = frame(); ok(L.filter(e => e[1] === 'rect' && e[3] === '#fff6c0').length >= 8, 'stars on the water');
  S.clock = .3; L = frame(); ok(!L.some(e => e[1] === 'rect' && e[3] === '#fff6c0'), 'no stars by day');
  // twilight: tint without lamps; dusk: some of both
  S.clock = .6; L = frame(); ok(L.some(e => e[0] === 'multiply') && LIGHT_N === 0, 'golden hour: tint, no lamps');
  S.clock = .7; frame(); ok(LIGHT_N > 0, 'dusk: lamps on');
  // fish piles glint at night
  S.clock = .9; S.piles.onsen = 30; P.x = 17 * 16 + 8; P.y = 5 * 16 + 8; updCam(0, true); L = frame();
  ok(L.some(e => e[0] === 'lighter' && e[3] === glowArt(10, '#ffe9a8')), 'a fish pile glints at night');
  // the title: no light pass; the share card: daylight
  go('title'); L = frame(); ok(!L.some(e => e[0] === 'multiply'), 'no tint on the title'); go('play');
  let threw = null; try { makeShare(); } catch (e) { threw = e; } ok(!threw, 'share card at night: ' + threw);
  // multiply missing: a thin plain tint instead
  const real = ctx.globalCompositeOperation; let op = 'source-over';
  Object.defineProperty(ctx, 'globalCompositeOperation', { configurable: true, get: () => op, set: v => { if (v !== 'multiply') op = v; } });
  L = frame(); const t2 = L.find(e => e[1] === 'img' && e[3] === DARK); ok(t2 && t2[0] === 'source-over' && Math.abs(t2[2] - .42 * .55) < 1e-9, 'fallback tint: plain .23');
  delete ctx.globalCompositeOperation; ctx.globalCompositeOperation = real; }
// ---- the HUD sky dial: from star 2; the sun by day, the moon by night
{ const seen = []; const _sun = sunIcon, _moon = moonIcon; sunIcon = () => { seen.push('sun'); return _sun(); }; moonIcon = () => { seen.push('moon'); return _moon(); };
  setup(); S.clock = .3; frame(); eq(seen.length, 0, 'star 1: no sky dial');
  setup(['room2', 'room3', 'onsen']); S.clock = .3; frame(); eq(seen.pop(), 'sun', 'day: the sun'); S.clock = .9; frame(); eq(seen.pop(), 'moon', 'night: the moon');
  sunIcon = _sun; moonIcon = _moon; }
// ---- clock and day are saved
setup(); S.clock = .4567; S.day = 9; S.dayLog = { g: 3, h: 4, best: 20 }; saveNow(); S = loadState();
eq(S.clock + ',' + S.day + ',' + S.dayLog.g + ',' + S.dayLog.best, '0.4567,9,3,20', 'clock / day / log saved');
ctx.fillRect = _fr; ctx.drawImage = _di;
console.log(errs.length ? 'SYS DAY FAIL\n  ' + errs.join('\n  ') : 'SYS DAY OK');
if (errs.length) process.exitCode = 1;
