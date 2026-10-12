// SPEC_v2 16.2: seasonal festivals. From star 3, on the 2nd day of each season at clock .55 for 66 s (v2.3: 3-min days; was
// .62 / 72 s; that evening has no rush): guests 1.3x as often,
// +20 s patience, lantern strings over the door and along the lobby wall, 'fest' music. Every check-in lights a lantern
// (HUD row 2); goal ceil(1.3 x open guest rooms) (+ festTargetExtra(): core B's stalls). All lit: hearts +25, a medal, a
// red packet round(20 x room fee x Q) in the cash box, a gold banner. Not lit: "明年再来！", nothing taken. The season's
// first festival puts its two decor pieces on sale (the shop owner says "本季新品！"). Summer: fireworks over the onsen /
// the front door, <= 2 a second, r <= 16, alpha <= .6, no white. Saved (S.fest / S.fests): a load during the 66 s goes on.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_festival.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': ' + (+a).toFixed(3) + ' (want ' + b + ' +- ' + tol + ')');
const DT = 1 / 30;
const STAR3 = UNLOCKS.filter(u => !u.need5 && !u.when && UNLOCKS.indexOf(u) <= UNLOCKS.indexOf(UNLOCK.w3)).map(u => u.id);
const STAR5 = UNLOCKS.filter(u => !u.need5 && !u.when).map(u => u.id);
function setup(list, day, clock) {
  S = defaults(); for (const id of list || []) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.tut.moved = true; S.day = day || 5; S.clock = clock === undefined ? .6 : clock; S.stats.time = 600;
  resetWorld(); go('play'); spawnT = 1e9; BANNER_Q.length = 0; FIRST_Q.length = 0;
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (state === 'card') modalClose(); if (f && f()) return true; } return false; };
const checkins = n => { for (let i = 0; i < n; i++) { S.stats.guests++; S.dayLog.g++; } run(DT); };   // what checkIn() counts
// ---- when: star 3+, the 2nd day of a season, clock .55 - .917; once a season; not in a new game's first spring
{ setup(STAR3.filter(id => id !== 'dining' && UNLOCKS.indexOf(UNLOCK[id]) < UNLOCKS.indexOf(UNLOCK.dining)), 5, (FEST_AT - .0005)); eq(star(), 2, 'star 2'); run(3); ok(!FEST.on, 'no festival at star 2');
  setup(STAR3, 4, (FEST_AT - .0005)); eq(star(), 3, 'star 3'); run(3); ok(!FEST.on, 'not on a season\'s 1st day');
  setup(STAR3, 2, (FEST_AT - .0005)); run(3); ok(!FEST.on, 'not in a new game\'s first spring (nobody is at star 3 then)');
  setup(STAR3, 5, (FEST_AT - .0005)); run(1); ok(FEST.on, 'summer, day 2, clock .55: the festival'); eq(S.fest.s, absSeason(5), 'saved: this season');
  eq(S.fest.goal, Math.ceil(FEST_LANTERN * guestRoomsOpen()), 'goal = ceil(1.3 x open rooms) = ' + S.fest.goal);
  const b = BANNER_Q.find(x => x.kind === 'fest'); ok(b && bannerParts(b).parts.some(p => p.t === '烟花大会！'), 'banner: 烟花大会！');
  ok(FIRST_Q.some(f => f.key === 'fest'), 'first time: the [bell] -> [lantern] card'); }
// ---- meanwhile: guests come 1.3x as often, wait 20 s longer; the music; strings and the HUD lanterns
{ setup(STAR3, 5, .3); const g0 = spawnGap(); S.clock = (FEST_AT - .0005); run(1); ok(!rushOn(), 'v2.3: no evening rush on a festival evening'); near(spawnGap(), g0 / 1.3, 1e-9, 'spawn gap / 1.3');
  addGuest('regular'); run(DT); const gu = GUESTS[GUESTS.length - 1]; ok(gu.pat > PATIENCE + FEST_PAT - 1, 'a new guest\'s patience +20 s: ' + R(gu.pat));
  let want = null; const _mw = musicWant; musicWant = o => { want = o; return _mw(o); }; run(DT); musicWant = _mw; ok(want && want.fest === true && want.season === 1, 'music: fest + summer (' + JSON.stringify(want && { fest: want.fest, season: want.season }) + ')');
  const strings = [], lamps = []; const _cs = chochinString, _li = lanternIcon; chochinString = l => { strings.push(l); return _cs(l); }; lanternIcon = on => { lamps.push(on); return _li(on); };
  P.x = 17 * 16 + 8; P.y = 26 * 16 + 8; updCam(0, true);
  const _di = g.drawImage; let pieces = 0; render(); ok(strings.length >= 1, 'lantern strings drawn');
  { const c = chochinString(false); g = low.getContext('2d'); const d0 = g.drawImage; g.drawImage = function (img, ...a) { if (img === c || img === chochinString(true)) pieces++; return d0.call(this, img, ...a); }; drawFestStrings(); g.drawImage = d0; }
  ok(pieces >= 8, 'along the facade and the lobby wall: ' + pieces + ' pieces');
  const hud = () => { lamps.length = 0; drawHudV21a(60); return lamps; };
  eq(hud().length, Math.min(12, S.fest.goal), 'HUD: ' + Math.min(12, S.fest.goal) + ' lanterns'); ok(hud().every(on => !on), 'none lit yet');
  checkins(3); eq(hud().filter(Boolean).length, Math.floor(Math.min(12, S.fest.goal) * 3 / S.fest.goal), 'three check-ins: lanterns lit'); eq(S.fest.n, 3, 'saved count 3');
  ok(!FIRST_Q.some(f => f.key === 'fest'), 'the card goes once a lantern is lit');
  chochinString = _cs; lanternIcon = _li; }
// ---- the end: all lit -> hearts +40, a medal, the red packet, the decor on sale; not lit -> nothing taken
{ setup(STAR3.concat(['shop']), 5, (FEST_AT - .0005)); run(1); const h0 = S.hearts, box0 = (S.piles.recep || 0) + S.money, red = R(FEST_RED * STARS[star()].room * qualityQ());
  checkins(S.fest.goal); const n0 = S.fest.n; run(80, () => !FEST.on); ok(!FEST.on, 'over after 66 s'); ok(n0 >= S.fest.goal, 'all lit: ' + n0 + '/' + S.fest.goal + ' ' + JSON.stringify(S.fest)); near(S.clock, FEST_AT + FEST_T / DAY_LEN, .003, 'ends at clock .917');
  ok(S.hearts - h0 >= FEST_HEARTS, 'hearts +25 (' + (S.hearts - h0) + ')'); eq(S.medals.length, 1, 'a medal'); eq(S.medals[0] && S.medals[0].s, 1, 'a summer medal');
  ok((S.piles.recep || 0) + S.money - box0 >= red, 'the red packet in the cash box: round(20 x room x Q) = ' + red);
  ok(BANNER_Q.some(x => x.kind === 'festok'), 'gold banner'); eq(S.fests[1], 1, 'summer festivals held: 1'); ok(S.fest.end, 'ended');
  ok(padEligible(UNLOCK.d_windbell) && padEligible(UNLOCK.d_fan), 'the summer decor is on sale'); ok(V21.e12 > 0, 'the shop owner will say "本季新品！"');
  const said = []; const _say = say; say = (e, id, a) => { said.push(id); return _say(e, id, a); };
  const o = shopOwner(); P.x = o.x; P.y = o.y + 20; updCam(0, true); run(.5); ok(said.includes('E12'), 'E12 when you come by'); say = _say;
  run(400); ok(!FEST.on && S.fests[1] === 1, 'not twice in one season'); }
{ setup(STAR3, 5, (FEST_AT - .0005)); run(1); const h0 = S.hearts, m0 = S.money, box0 = S.piles.recep || 0; checkins(2); run(80, () => !FEST.on);
  ok(BANNER_Q.some(x => x.kind === 'festno'), '"明年再来！"'); eq(S.medals.length, 0, 'no medal'); eq(S.money, m0, 'nothing taken (money)');
  ok(S.hearts >= h0, 'hearts never drop'); eq(S.piles.recep || 0, box0, 'no red packet'); eq(S.fests[1], 1, 'held anyway: the decor goes on sale'); }
// ---- save / load: during the 66 s the lanterns carry on; after, it is over (counted, no reward)
{ setup(STAR3, 5, (FEST_AT - .0005)); run(1); checkins(4); saveNow(); S = loadState(); resetWorld(); go('play'); spawnT = 1e9; run(DT);
  ok(FEST.on, 'loaded during the festival: still on'); eq(S.fest.n, 4, 'its 4 lanterns kept');
  S.clock = .95; saveNow(); const L = loadState(); ok(L.fest.end && L.fests[1] === 1, 'loaded after the window: over and counted'); eq(L.medals.length, 0, 'no medal for it'); }
// ---- summer fireworks: <= 2 a second, r <= 16, alpha <= .6, no white; only in summer
{ setup(STAR5, 5, (FEST_AT - .0005)); run(1); P.x = 17 * 16 + 8; P.y = 29 * 16 + 8; updCam(0, true);
  const ctx = low.getContext('2d'), _fr = ctx.fillRect; let L = []; ctx.fillRect = function (x, y, w, h) { L.push([this.fillStyle, this.globalAlpha, x, y]); return _fr.call(this, x, y, w, h); };
  let seen = 0, white = 0, maxA = 0, bursts = new Set(); const t0 = T;
  for (let i = 0; i < 300; i++) { T += DT; L = []; drawFireworks(); seen += L.length; for (const e of L) { if (e[0] === '#ffffff') white++; maxA = Math.max(maxA, e[1]); } }
  for (let k = Math.floor(t0 * 2); k < Math.floor(T * 2); k++) if (_v21h(k, 7) < .8) bursts.add(k);
  ok(seen > 0, 'fireworks drawn'); eq(white, 0, 'no white'); ok(maxA <= FIREWORK_A + 1e-9, 'alpha <= .6 (' + maxA.toFixed(2) + ')'); ok(bursts.size <= 2 * 10 + 1, 'bursts in 10 s: ' + bursts.size + ' (<= 2 a second)');
  near(FIREWORK_R, 16, 0, 'radius cap 16');
  setup(STAR5, 8, (FEST_AT - .0005)); run(1); L = []; for (let i = 0; i < 60; i++) { T += DT; drawFestGlow(); } eq(L.filter(e => FIREWORK_COLS.includes(e[0]) && e[1] > 0).length, 0, 'no fireworks at the autumn festival');
  ctx.fillRect = _fr; }
// ---- a stall sale (core B) lights one too; core B's extra goal hook
{ setup(STAR3, 5, (FEST_AT - .0005)); run(1); festLantern(1); eq(S.fest.n, 1, 'festLantern(1): a lantern'); eq(festTargetExtra(), 0, 'no stalls in core A: +0'); }
console.log(errs.length ? 'SYS FESTIVAL FAIL\n  ' + errs.join('\n  ') : 'SYS FESTIVAL OK');
if (errs.length) process.exitCode = 1;
