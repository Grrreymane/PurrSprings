// SPEC_v2 16.3: the yearly award. Before sunrise ends the year's last day (clock .05 of day 12, 24 ...) a paused card:
// "第N年 年度报告", this year's guests / income / new combos, and the award by this year's hearts (thresholds from the bots,
// SPEC_v2 18.2: >= 5,000 金奖, >= 4,200 银奖, >= 3,700 铜奖, >= 2,000 人气奖, else 努力奖). The prize (30,000 / 15,000 /
// 8,000 / 4,000 / 2,000 x min(year, 3)) waits in the cash box; the trophy stands on the lobby wall (the newest two);
// gold three years running = "殿堂旅馆" (a gold frame on the sign). S.year = the totals at the year's start; a save from
// before v2.1 starts its year at its first load; a load in the report's window doesn't report twice.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_yearly.js --seed 3
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const eq = (a, b, m) => ok(a === b, m + ': ' + a + ' (want ' + b + ')');
const DT = 1 / 30;
const ALL = UNLOCKS.filter(u => !u.need5 && !u.when).map(u => u.id);
function setup(day, clock) {
  S = defaults(); for (const id of ALL) S.unlocked[id] = true; for (const rm of ROOMS) if (roomOpen(rm)) S.rooms[rm.id] = 'clean';
  S.peak = starOf(S); S.tut.moved = true; S.day = day; S.clock = clock; S.stats.time = 4000;
  resetWorld(); go('play'); spawnT = 1e9; BANNER_Q.length = 0; P.x = 30 * 16; P.y = 30 * 16;
}
const sounds = []; const _sfx = sfx; sfx = (k, a) => { sounds.push(k); return _sfx(k, a); };
const run = (sec, f) => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { update(DT); if (f && f()) return true; } return false; };
const yearCard = (h, opts) => {   // a year 1 ending with h hearts this year
  setup(12, .049); Object.assign(S.year, { g: 100, e: 5000, h: 1000, combos: 1, n: 1 }); S.stats.guests = 1500; S.earned = 205000; S.hearts = 1000 + h; S.combos = { c_ga: 1, c_zen: 1, c_cat: 1 };
  if (opts) opts(); run(1, () => state === 'card'); return MODAL_Q[0];
};
// ---- the report: when, what, the award, the prize
{ const box0 = () => S.piles.recep || 0;
  setup(11, .049); run(1); eq(state, 'play', 'not on day 11');
  setup(12, .5); run(1); eq(state, 'play', 'day 12 by day: not yet');
  const m = yearCard(5200); eq(state, 'card', 'day 12, clock .05: the year report pauses the game'); ok(m && m.kind === 'year', 'a year card');
  eq(m && [m.y, m.g, m.e, m.h, m.c].join(','), '1,1400,200000,5200,2', 'year 1: 1,400 guests, 200,000 income, 5,200 hearts, 2 new combos');
  eq(m && m.k, 'gold', '5,200 hearts: 金奖'); eq(m && m.prize, 30000, 'prize 30,000 x 1'); eq(box0(), 30000, 'in the cash box');
  eq(S.awards.length, 1, 'trophy saved'); eq(S.awards[0].k + S.awards[0].y, 'gold1', 'gold, year 1');
  eq([S.year.g, S.year.e, S.year.h, S.year.combos, S.year.n].join(','), [S.stats.guests, S.earned, S.hearts, 3, 2].join(','), 'the new year starts from today\'s totals');
  sounds.length = 0; for (let i = 0; i < 20; i++) update(DT); render(); ok(sounds.includes('stamp'), 'the stamp sound as the award lands');
  const t0 = S.stats.time; for (let i = 0; i < 30; i++) update(DT); eq(S.stats.time, t0, 'paused');
  modalPress(); eq(state, 'play', 'a tap closes it'); run(20); eq(S.day, 13, 'then the sun rises on year 2'); eq(S.awards.length, 1, 'once'); }
for (const [h, k] of [[4999, 'silver'], [4200, 'silver'], [4199, 'bronze'], [3700, 'bronze'], [3699, 'pop'], [2000, 'pop'], [1999, 'effort'], [0, 'effort']]) { const m = yearCard(h); eq(m && m.k, k, h + ' hearts'); modalClose(); }
{ const m = yearCard(4300); eq(m && m.prize, 15000, 'silver: 15,000'); modalClose();
  const p3 = h => { setup(36, .049); S.year.n = 3; S.hearts = S.year.h + h; run(1, () => state === 'card'); const m = MODAL_Q[0]; modalClose(); return m; };
  eq(p3(5000).prize, 90000, 'year 3 gold: x3'); setup(60, .049); S.year.n = 5; S.hearts = S.year.h + 100; run(1, () => state === 'card'); eq(MODAL_Q[0] && MODAL_Q[0].prize, 6000, 'year 5 effort: 2,000 x 3 (cap)'); modalClose(); }
// ---- no double report: a load in the window, or after it
{ yearCard(3000); modalClose(); saveNow(); S = loadState(); resetWorld(); go('play'); spawnT = 1e9; run(1); eq(state, 'play', 'loaded at clock .05 after the report: no second one'); eq(S.awards.length, 1, 'still one trophy'); }
// ---- a save from before v2.1: its year starts at the load
{ setup(30, .5); S.stats.guests = 9000; S.earned = 900000; S.hearts = 20000; saveNow(); const raw = load('state', null); delete raw.year; delete raw.awards;
  S = loadState(raw); eq([S.year.g, S.year.e, S.year.h, S.year.n].join(','), '9000,900000,20000,3', 'old save: the year counts from now (year 3)'); eq(S.awards.length, 0, 'no trophies'); }
// ---- the wall: the newest two trophies; the hall of fame
{ setup(13, .3); S.awards = [{ y: 1, k: 'silver' }, { y: 2, k: 'gold' }, { y: 3, k: 'bronze' }];
  const seen = []; const _ta = trophyArt; trophyArt = k => { seen.push(k); return _ta(k); }; P.x = 22 * 16; P.y = 24 * 16 + 8; updCam(0, true); render(); trophyArt = _ta;
  eq(seen.join(','), 'gold,bronze', 'the newest two on the wall');
  ok(!hallOfFame(), 'silver gold bronze: no hall of fame'); S.awards = [{ y: 1, k: 'gold' }, { y: 2, k: 'gold' }, { y: 4, k: 'gold' }]; ok(!hallOfFame(), 'gold 1, 2, 4: not in a row');
  S.awards = [{ y: 1, k: 'silver' }, { y: 2, k: 'gold' }, { y: 3, k: 'gold' }, { y: 4, k: 'gold' }]; ok(hallOfFame(), 'gold three years running: 殿堂旅馆');
  const g = low.getContext('2d'), L = [], _fr = g.fillRect; g.fillRect = function (x, y, w, h) { L.push(this.fillStyle); return _fr.call(this, x, y, w, h); };
  P.x = 20 * 16 + 16; P.y = 31 * 16; updCam(0, true); render(); g.fillRect = _fr; ok(L.includes('#ffd23f'), 'the sign wears its gold frame');
  setup(36, .049); S.awards = [{ y: 1, k: 'gold' }, { y: 2, k: 'gold' }]; S.year.n = 3; S.hearts = S.year.h + 6000; run(1, () => state === 'card'); ok(MODAL_Q[0] && MODAL_Q[0].hall, 'the card says 殿堂旅馆 the year it happens'); modalClose(); }
sfx = _sfx;
console.log(errs.length ? 'SYS YEARLY FAIL\n  ' + errs.join('\n  ') : 'SYS YEARLY OK');
if (errs.length) process.exitCode = 1;
