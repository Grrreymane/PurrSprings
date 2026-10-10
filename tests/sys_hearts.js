// SPEC_v2 4.9: hearts, the rival board, gold stars. Hearts only go up. Rank = 1 + rival inns whose threshold you have
// not reached (10th at the start, 1st from 6,000). Passing one: banner [badge] "passed X! #n" (several within 10 s share
// one), the rank-up horn, line P06. From star 5 the last five thresholds (800 / 1,500 / 3,000 / 6,000 / 10,000) light the
// gold stars, those passed before star 5 all at once when star 5 comes; each: fees +5 %, guests 3 % sooner. The n-th
// guest (100 / 500 / 1,000 / 5,000) is a small event: line G36, a banner, hearts +10 (4.13). HUD row 2: #rank from star 2.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_hearts.js --seed 2
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const SFXLOG = [], LINES = [];
const _sfx = sfx; sfx = (k, a) => { SFXLOG.push(k); return _sfx(k, a); };
const _ls = lineSay; lineSay = (who, key) => { LINES.push([who, key]); return _ls(who, key); };
const PRE4 = UNLOCKS.filter(u => !u.need5 && u.id !== 'roten' && u.id !== 'maid4').map(u => u.id);
function setup(list, hearts) {
  S = defaults(); for (const id of list || []) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.hearts = hearts || 0; S.tut.moved = true; resetWorld(); go('play'); spawnT = 1e9; STAFF.length = 0;
  BANNER_Q.length = 0; SFXLOG.length = 0; LINES.length = 0;
}
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
const ranks = () => BANNER_Q.filter(b => b.kind === 'rank');
// ---- the rank from hearts (the legend's 10,000 is not an inn: it only lights the 5th gold star)
for (const [h, r] of [[0, 10], [29, 10], [30, 9], [79, 9], [80, 8], [150, 7], [250, 6], [400, 5], [800, 4], [1500, 3], [3000, 2], [5999, 2], [6000, 1], [99999, 1]]) eq(rankOf(h), r, 'rank at ' + h + ' hearts');
// ---- overtaking: banner + horn + line; several within 10 s share one; later ones get their own
setup([], 25);
{ addHearts(10); let b = ranks(); eq(b.length, 1, 'one rank banner'); ok(b[0] && b[0].id === 'panda' && b[0].rank === 9, 'passed panda, #9: ' + JSON.stringify(b[0]));
  ok(SFXLOG.includes('rankup'), 'rank-up horn'); ok(LINES.some(([w, k]) => w === P && k === 'P06'), 'line P06 by the innkeeper'); eq(RUN.overtakes, 1, 'counted');
  ok(RUN.news.some(n => n[1] === 'rank'), 'a "news" event');
  run(4); addHearts(50); b = ranks(); eq(b.length, 1, 'passed penguin 4 s later: the same banner'); ok(b[0].id === 'penguin' && b[0].rank === 8, 'merged: penguin #8');
  run(11); addHearts(100); b = ranks(); eq(b.length, 2, '11 s later: a new banner'); ok(b[1] && b[1].id === 'otter' && b[1].rank === 7, 'otter #7');
  const n0 = RUN.overtakes; addHearts(10); eq(RUN.overtakes, n0, 'no overtake without passing anyone');
  BANNER_Q.length = 0; addHearts(400 - S.hearts); b = ranks(); ok(b.length === 1 && b[0].id === 'monkey' && b[0].rank === 5, 'passing two at once: one banner with the last (monkey #5)'); }
// ---- hearts only go up
setup([], 50); addHearts(-5); addHearts(0); addHearts(2.7); eq(S.hearts, 52, 'negative / zero ignored, integer');
// ---- gold stars: none before star 5; at star 5 the ones already passed light together; then one per threshold
setup(PRE4, 1600);
{ eq(goldStars(), 0, 'star 4: no gold stars (1,600 hearts)'); S.money = 5000; const h0 = S.hearts; unlock('roten');
  eq(star(), 5, 'star 5'); eq(S.hearts, h0 + UNLOCK.roten.hearts, 'roten hearts'); eq(goldStars(), 2, '1,625 hearts at star 5: gold x2 (rabbit + tanuki)');
  const gb = BANNER_Q.find(b => b.kind === 'gold'); ok(gb && gb.id === 2, 'gold banner (2): ' + JSON.stringify(gb)); eq(goldPopAt, T, 'the newest gold star pops on the HUD');
  ok(RUN.news.some(n => n[1] === 'gold'), 'a "news" event');
  BANNER_Q.length = 0; addHearts(3000 - S.hearts); eq(goldStars(), 3, '3,000: gold x3'); ok(BANNER_Q.some(b => b.kind === 'gold' && b.id === 3), 'gold banner (3)');
  ok(BANNER_Q.some(b => b.kind === 'rank' && b.id === 'bear'), 'passing bear also an overtake banner');
  addHearts(10000 - S.hearts); eq(goldStars(), 5, '10,000 (the legend): gold x5'); eq(rankOf(S.hearts), 1, '#1');
  // what gold stars do (3.2 / 3.3): fees +5 % each, guests 3 % sooner each
  const roomFee = fee('room', { rm: ROOM.room1 }); eq(roomFee, R(STARS[5].room * 1.25), 'room fee x1.25 with 5 gold stars');
  ok(Math.abs(spawnGap() - Math.max(1.8, STARS[5].gap * Math.min(1, 9 / guestRoomsOpen())) * .85) < 1e-9, 'gap -15 %');
  // drawn: five gold stars on the HUD
  const calls = []; const _si = starIcon; starIcon = (on, gold) => { calls.push(!!gold); return _si(on, gold); }; run(1); render(); starIcon = _si;
  eq(calls.filter(Boolean).length, 5, 'HUD: five gold stars'); }
// ---- a reload doesn't replay the gold banner
{ saveNow(); S = loadState(); resetWorld(); BANNER_Q.length = 0; addHearts(1); ok(!BANNER_Q.some(b => b.kind === 'gold'), 'no gold banner after a reload'); }
// ---- milestones: the 100th guest
setup(['recep'], 0);
{ S.stats.guests = 99; addGuest('regular'); const gu = GUESTS[0]; setSt(gu, 'queue'); gu.ready = true; const h0 = S.hearts; LINES.length = 0;
  checkIn(gu, ROOM.room1); eq(S.stats.guests, 100, '100th guest'); eq(S.hearts - h0, 10, 'hearts +10');
  ok(BANNER_Q.some(b => b.kind === 'milestone' && b.id === 100), 'milestone banner'); ok(LINES.some(([w, k]) => w === gu && k === 'G36'), 'line G36');
  BANNER_Q.length = 0; addGuest('regular'); const g2 = GUESTS[1]; setSt(g2, 'queue'); g2.ready = true; S.rooms.room2 = 'clean'; S.unlocked.room2 = true;
  checkIn(g2, ROOM.room2); ok(!BANNER_Q.some(b => b.kind === 'milestone'), 'the 101st: nothing');
  for (const n of [500, 1000, 5000]) ok(MILESTONES.includes(n), n + ' is a milestone'); }
// ---- HUD row 2: the rank pill from star 2 only
setup([], 100); render(); ok(!TQ.some(t => t.s === '#8'), 'star 1: no rank pill');
setup(['room2', 'room3', 'onsen'], 100); render(); ok(TQ.some(t => t.s === '#8'), 'star 2: "#8" on the HUD');
// ---- a played stretch: hearts never drop, the rank never gets worse
setup(['room2', 'room3', 'onsen', 'recep', 'tea', 'maid1'], 0); spawnT = 1; ensureStaff();
{ let h = 0, r = 10, bad = 0; run(300, () => { if (S.hearts < h || rankOf(S.hearts) > r) bad++; h = S.hearts; r = rankOf(S.hearts); return false; });
  eq(bad, 0, 'hearts / rank monotonic over 5 min'); ok(S.hearts > 0, 'hearts earned by playing: ' + S.hearts); }
console.log(errs.length ? 'SYS HEARTS FAIL\n  ' + errs.join('\n  ') : 'SYS HEARTS OK');
if (errs.length) process.exitCode = 1;
